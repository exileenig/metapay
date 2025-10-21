import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import supabase from "@/lib/supabase"
import { MetaPayError } from "@/lib/errors"
import { adminMiddleware } from "@/lib/auth"

const approvePayoutSchema = z.object({
  payoutId: z.number().int().positive(),
  status: z.enum(["approved", "rejected"]),
  adminNote: z.string().max(500).optional(),
})

export async function GET(req: NextRequest) {
  try {
    adminMiddleware(req)

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    let query = supabase
      .from("payouts")
      .select(
        `
        *,
        seller:sellers!inner(id, email, business_name)
      `,
      )
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data: payouts, error } = await query

    if (error) {
      throw new MetaPayError(500, "Failed to fetch payouts")
    }

    return NextResponse.json({
      success: true,
      data: payouts || [],
    })
  } catch (error) {
    if (error instanceof MetaPayError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    console.error("[v0] Admin payouts error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    adminMiddleware(req)

    const body = await req.json()
    const result = approvePayoutSchema.safeParse(body)

    if (!result.success) {
      throw new MetaPayError(400, result.error.issues[0].message)
    }

    const { payoutId, status, adminNote } = result.data

    const { data: payout, error: fetchError } = await supabase.from("payouts").select("*").eq("id", payoutId).single()

    if (fetchError || !payout) {
      throw new MetaPayError(404, "Payout not found")
    }

    if (payout.status !== "pending") {
      throw new MetaPayError(400, "Payout already processed")
    }

    const { error: updateError } = await supabase
      .from("payouts")
      .update({
        status,
        admin_note: adminNote,
      })
      .eq("id", payoutId)

    if (updateError) {
      throw new MetaPayError(500, "Failed to update payout")
    }

    // If rejected, refund the balance to seller
    if (status === "rejected") {
      await supabase.rpc("increment_seller_balance", {
        seller_id: payout.seller_id,
        amount: payout.amount_usd,
      })
    }

    console.log("[v0] Payout processed:", { payoutId, status, adminNote })

    return NextResponse.json({
      success: true,
      message: `Payout ${status} successfully`,
    })
  } catch (error) {
    if (error instanceof MetaPayError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    console.error("[v0] Process payout error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
