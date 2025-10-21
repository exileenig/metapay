import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import supabase from "@/lib/supabase"
import { MetaPayError } from "@/lib/errors"
import { adminMiddleware } from "@/lib/auth"

const feeSchema = z.object({
  customerFee: z.number().min(0).max(30).optional(),
  sellerFee: z.number().min(0).max(30).optional(),
  sellerId: z.number().int().positive().optional(),
})

export async function POST(req: NextRequest) {
  try {
    adminMiddleware(req)

    const body = await req.json()
    const result = feeSchema.safeParse(body)

    if (!result.success) {
      throw new MetaPayError(400, result.error.issues[0].message)
    }

    if (result.data.sellerId) {
      const { error } = await supabase
        .from("sellers")
        .update({
          custom_customer_fee: result.data.customerFee,
          custom_seller_fee: result.data.sellerFee,
        })
        .eq("id", result.data.sellerId)

      if (error) {
        throw new MetaPayError(500, "Failed to update seller fees")
      }

      console.log("[v0] Seller fees updated:", {
        sellerId: result.data.sellerId,
        customerFee: result.data.customerFee,
        sellerFee: result.data.sellerFee,
      })
    } else {
      const { error } = await supabase
        .from("config")
        .upsert({
          id: 1,
          customer_fee: result.data.customerFee ?? 15,
          seller_fee: result.data.sellerFee ?? 10,
        })
        .eq("id", 1)

      if (error) {
        throw new MetaPayError(500, "Failed to update global fees")
      }

      console.log("[v0] Global fees updated:", {
        customerFee: result.data.customerFee,
        sellerFee: result.data.sellerFee,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Fees updated successfully",
    })
  } catch (error) {
    if (error instanceof MetaPayError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    console.error("[v0] Update fees error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    adminMiddleware(req)

    const { data: config } = await supabase.from("config").select("*").eq("id", 1).single()

    const defaultConfig = { customer_fee: 15, seller_fee: 10 }

    return NextResponse.json({
      success: true,
      data: {
        customerFee: config?.customer_fee ?? defaultConfig.customer_fee,
        sellerFee: config?.seller_fee ?? defaultConfig.seller_fee,
      },
    })
  } catch (error) {
    if (error instanceof MetaPayError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    console.error("[v0] Get fees error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
