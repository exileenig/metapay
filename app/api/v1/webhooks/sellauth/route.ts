import { type NextRequest, NextResponse } from "next/server"
import supabase from "@/lib/supabase"
import { MetaPayError } from "@/lib/errors"

export async function POST(req: NextRequest) {
  try {
    // Verify webhook source IP (optional but recommended)
    const allowedIps = process.env.SELLAUTH_IPS?.split(",") || []
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip")

    if (allowedIps.length > 0 && ip && !allowedIps.includes(ip)) {
      console.warn("[v0] Webhook from unauthorized IP:", ip)
      throw new MetaPayError(403, "Unauthorized webhook source")
    }

    const body = await req.json()
    console.log("[v0] Webhook received:", { event: body.event, invoice: body.invoice?.id })

    const event = body.event
    const invoice = body.invoice || body.payment
    const invoiceId = invoice?.id

    if (!invoiceId) {
      console.warn("[v0] Webhook missing invoice ID")
      return NextResponse.json({ success: true, message: "No invoice ID" }, { status: 200 })
    }

    const coupon_code = invoice.coupon_code

    // Find seller by coupon code
    const { data: seller } = await supabase.from("sellers").select("*").eq("coupon_code", coupon_code).single()

    if (!seller) {
      console.warn("[v0] Webhook for unknown coupon:", coupon_code)
      return NextResponse.json({ success: true, message: "Unknown coupon" }, { status: 200 })
    }

    // Find or create transaction
    const { data: transaction } = await supabase.from("transactions").select("*").eq("invoice_id", invoiceId).single()

    if (!transaction && event === "payment.completed") {
      // Auto-sync missed transaction
      await supabase.from("transactions").insert({
        seller_id: seller.id,
        invoice_id: invoiceId,
        amount: invoice.paid_usd || invoice.total || 0,
        customer_fee: 0,
        net_to_seller: invoice.paid_usd || invoice.total || 0,
        status: "pending",
        description: "Auto-synced from webhook",
      })
    }

    if (!transaction) {
      console.warn("[v0] Transaction not found for invoice:", invoiceId)
      return NextResponse.json({ success: true, message: "Transaction not found" }, { status: 200 })
    }

    // Handle different event types
    if (event === "payment.completed" || event === "invoice.completed") {
      await supabase
        .from("transactions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      await supabase.rpc("increment_seller_balance", {
        seller_id: seller.id,
        amount: transaction.net_to_seller,
      })

      console.log("[v0] Payment completed:", {
        invoiceId,
        sellerId: seller.id,
        amount: transaction.net_to_seller,
      })
    } else if (event === "payment.refunded" || event === "invoice.refunded") {
      await supabase.from("transactions").update({ status: "refunded" }).eq("id", transaction.id)

      await supabase.rpc("decrement_seller_balance", {
        seller_id: seller.id,
        amount: transaction.net_to_seller,
      })

      console.log("[v0] Payment refunded:", { invoiceId, sellerId: seller.id })
    } else if (event === "payment.failed" || event === "invoice.failed") {
      await supabase.from("transactions").update({ status: "failed" }).eq("id", transaction.id)

      console.log("[v0] Payment failed:", { invoiceId })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    if (error instanceof MetaPayError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ success: true }, { status: 200 }) // Always return 200 to prevent retries
  }
}
