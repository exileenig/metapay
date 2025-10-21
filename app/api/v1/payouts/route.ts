import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import supabase from "@/lib/supabase"
import { authMiddleware, type AuthenticatedRequest } from "@/lib/auth"
import { getSellerFee, calculateSellerDeduction } from "@/lib/fees"
import { MetaPayError } from "@/lib/errors"

const payoutSchema = z.object({
  crypto: z.enum(["USDC_SOL", "USDC_BSC", "LTC"], { errorMap: () => ({ message: "Invalid crypto type" }) }),
  amount: z.number().min(10, "Minimum payout $10").optional(),
})

const payoutQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
})

export async function POST(req: NextRequest) {
  return authMiddleware(req, async (authReq: AuthenticatedRequest) => {
    try {
      const body = await req.json()
      const result = payoutSchema.safeParse(body)

      if (!result.success) {
        throw new MetaPayError(400, result.error.issues[0].message)
      }

      const seller = authReq.seller
      const amount = result.data.amount || seller.balance

      // Validate amount
      if (amount > seller.balance) {
        throw new MetaPayError(400, "Insufficient balance")
      }

      if (amount < 10) {
        throw new MetaPayError(400, "Minimum payout is $10")
      }

      // Get wallet address
      let wallet: string | null = null
      switch (result.data.crypto) {
        case "USDC_SOL":
          wallet = seller.usdc_sol_wallet
          break
        case "USDC_BSC":
          wallet = seller.usdc_bsc_wallet
          break
        case "LTC":
          wallet = seller.ltc_wallet
          break
      }

      if (!wallet) {
        throw new MetaPayError(400, `No ${result.data.crypto} wallet configured`)
      }

      // Calculate fees
      const sellerFeePercent = await getSellerFee(seller.id)
      const sellerFeeAmount = calculateSellerDeduction(amount, sellerFeePercent)
      const netUsd = amount - sellerFeeAmount

      const { error } = await supabase.from("payouts").insert({
        seller_id: seller.id,
        amount_usd: amount,
        seller_fee: sellerFeeAmount,
        net_usd: netUsd,
        crypto: result.data.crypto,
        wallet_address: wallet,
        status: "pending",
      })

      if (error) {
        console.error("[v0] Failed to create payout:", error)
        throw new MetaPayError(500, "Failed to create payout request")
      }

      const { error: balanceError } = await supabase
        .from("sellers")
        .update({ balance: seller.balance - amount })
        .eq("id", seller.id)

      if (balanceError) {
        console.error("[v0] Failed to update balance:", balanceError)
        throw new MetaPayError(500, "Failed to update balance")
      }

      console.log("[v0] Payout requested:", {
        sellerId: seller.id,
        amount,
        crypto: result.data.crypto,
        wallet,
      })

      return NextResponse.json({
        success: true,
        message: "Payout request submitted. Admin will process manually and approve.",
      })
    } catch (error) {
      if (error instanceof MetaPayError) {
        throw error
      }
      console.error("[v0] Payout error:", error)
      throw new MetaPayError(500, "Failed to process payout")
    }
  })
}

export async function GET(req: NextRequest) {
  return authMiddleware(req, async (authReq: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const queryParams = {
        page: searchParams.get("page"),
        perPage: searchParams.get("perPage"),
        status: searchParams.get("status"),
      }

      const result = payoutQuerySchema.safeParse(queryParams)

      if (!result.success) {
        throw new MetaPayError(400, result.error.issues[0].message)
      }

      const { page, perPage, status } = result.data

      let query = supabase.from("payouts").select("*", { count: "exact" }).eq("seller_id", authReq.seller.id)

      if (status) {
        query = query.eq("status", status)
      }

      const {
        data: payouts,
        error,
        count,
      } = await query.order("created_at", { ascending: false }).range((page - 1) * perPage, page * perPage - 1)

      if (error) {
        throw new MetaPayError(500, "Failed to fetch payouts")
      }

      return NextResponse.json({
        success: true,
        data: payouts || [],
        pagination: {
          page,
          perPage,
          total: count || 0,
          pages: Math.ceil((count || 0) / perPage),
        },
      })
    } catch (error) {
      if (error instanceof MetaPayError) {
        throw error
      }
      console.error("[v0] List payouts error:", error)
      throw new MetaPayError(500, "Failed to fetch payouts")
    }
  })
}
