import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import supabase from "@/lib/supabase"
import { authMiddleware, type AuthenticatedRequest } from "@/lib/auth"
import { MetaPayError } from "@/lib/errors"

const profileUpdateSchema = z.object({
  usdcSolWallet: z
    .string()
    .optional()
    .refine((val) => !val || (val.length === 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(val)), {
      message: "Invalid Solana address",
    }),
  usdcBscWallet: z
    .string()
    .optional()
    .refine((val) => !val || /^0x[a-fA-F0-9]{40}$/.test(val), { message: "Invalid BSC address" }),
  ltcWallet: z
    .string()
    .optional()
    .refine((val) => !val || /^[LM3][1-9A-HJ-NP-Za-km-z]{26,33}$/.test(val), { message: "Invalid LTC address" }),
})

export async function GET(req: NextRequest) {
  return authMiddleware(req, async (authReq: AuthenticatedRequest) => {
    try {
      const seller = authReq.seller
      const { data: config } = await supabase.from("config").select("*").eq("id", 1).single()

      const defaultConfig = { customer_fee: 15, seller_fee: 10 }

      return NextResponse.json({
        success: true,
        data: {
          id: seller.id,
          email: seller.email,
          businessName: seller.business_name,
          url: seller.url,
          apiKey: `****${seller.api_key.slice(-8)}`,
          usdcSolWallet: seller.usdc_sol_wallet,
          usdcBscWallet: seller.usdc_bsc_wallet,
          ltcWallet: seller.ltc_wallet,
          balance: seller.balance,
          customerFeeRate: seller.custom_customer_fee ?? config?.customer_fee ?? defaultConfig.customer_fee,
          sellerFeeRate: seller.custom_seller_fee ?? config?.seller_fee ?? defaultConfig.seller_fee,
          status: seller.status,
        },
      })
    } catch (error) {
      console.error("[v0] Get profile error:", error)
      throw new MetaPayError(500, "Failed to fetch profile")
    }
  })
}

export async function PUT(req: NextRequest) {
  return authMiddleware(req, async (authReq: AuthenticatedRequest) => {
    try {
      const body = await req.json()
      const result = profileUpdateSchema.safeParse(body)

      if (!result.success) {
        throw new MetaPayError(400, result.error.issues[0].message)
      }

      const { error } = await supabase
        .from("sellers")
        .update({
          usdc_sol_wallet: result.data.usdcSolWallet,
          usdc_bsc_wallet: result.data.usdcBscWallet,
          ltc_wallet: result.data.ltcWallet,
        })
        .eq("id", authReq.seller.id)

      if (error) {
        throw new MetaPayError(500, "Failed to update profile")
      }

      console.log("[v0] Profile updated:", {
        sellerId: authReq.seller.id,
        changes: Object.keys(result.data),
      })

      return NextResponse.json({
        success: true,
        message: "Profile updated successfully",
      })
    } catch (error) {
      if (error instanceof MetaPayError) {
        throw error
      }
      console.error("[v0] Update profile error:", error)
      throw new MetaPayError(500, "Failed to update profile")
    }
  })
}
