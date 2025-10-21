import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import supabase from "@/lib/supabase"
import { callSellAuth } from "@/lib/sellauth"
import { authMiddleware, type AuthenticatedRequest } from "@/lib/auth"
import { MetaPayError } from "@/lib/errors"

const refundSchema = z.object({
  reason: z.string().min(5, "Reason too short").max(500, "Reason too long").optional(),
})

export async function POST(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  return authMiddleware(req, async (authReq: AuthenticatedRequest) => {
    try {
      const { invoiceId } = params

      if (!invoiceId || invoiceId.length < 1) {
        throw new MetaPayError(400, "Invalid invoice ID")
      }

      const body = await req.json()
      const result = refundSchema.safeParse(body)

      if (!result.success) {
        throw new MetaPayError(400, result.error.issues[0].message)
      }

      const { data: transaction, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("invoice_id", invoiceId)
        .single()

      if (error || !transaction) {
        throw new MetaPayError(404, "Transaction not found")
      }

      // Verify ownership
      if (transaction.seller_id !== authReq.seller.id) {
        throw new MetaPayError(403, "Not your transaction")
      }

      // Check status
      if (transaction.status !== "completed") {
        throw new MetaPayError(400, "Can only refund completed payments")
      }

      // Call SellAuth to refund
      await callSellAuth("POST", `/shops/${process.env.MASTER_SHOP_ID}/invoices/${invoiceId}/refund`, {
        reason: result.data.reason,
      })

      await supabase.from("transactions").update({ status: "refunded" }).eq("id", transaction.id)

      await supabase.rpc("decrement_seller_balance", {
        seller_id: transaction.seller_id,
        amount: transaction.net_to_seller,
      })

      console.log("[v0] Refund initiated:", {
        invoiceId,
        sellerId: transaction.seller_id,
        reason: result.data.reason || "No reason provided",
      })

      return NextResponse.json({
        success: true,
        message: "Refund initiated successfully",
      })
    } catch (error) {
      if (error instanceof MetaPayError) {
        throw error
      }
      console.error("[v0] Refund error:", error)
      throw new MetaPayError(500, "Failed to process refund")
    }
  })
}
