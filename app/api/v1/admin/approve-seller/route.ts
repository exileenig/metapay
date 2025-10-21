import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import supabase from "@/lib/supabase"
import { MetaPayError } from "@/lib/errors"
import { adminMiddleware } from "@/lib/auth"

const approveSchema = z.object({
  sellerId: z.number().int().positive("Invalid seller ID"),
})

export async function POST(req: NextRequest) {
  try {
    adminMiddleware(req)

    const body = await req.json()
    const result = approveSchema.safeParse(body)

    if (!result.success) {
      throw new MetaPayError(400, result.error.issues[0].message)
    }

    const { data: seller, error: fetchError } = await supabase
      .from("sellers")
      .select("*")
      .eq("id", result.data.sellerId)
      .single()

    if (fetchError || !seller) {
      throw new MetaPayError(404, "Seller not found")
    }

    if (seller.status !== "pending") {
      throw new MetaPayError(400, "Seller already approved or invalid status")
    }

    const { error: updateError } = await supabase
      .from("sellers")
      .update({ status: "approved" })
      .eq("id", result.data.sellerId)

    if (updateError) {
      throw new MetaPayError(500, "Failed to approve seller")
    }

    console.log("[v0] Seller approved:", { sellerId: seller.id, email: seller.email })

    return NextResponse.json({
      success: true,
      message: "Seller approved",
      apiKey: seller.api_key,
    })
  } catch (error) {
    if (error instanceof MetaPayError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    console.error("[v0] Approve seller error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
