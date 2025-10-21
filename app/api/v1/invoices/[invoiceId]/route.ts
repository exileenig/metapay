import { type NextRequest, NextResponse } from "next/server"
import supabase from "@/lib/supabase"
import { callSellAuth } from "@/lib/sellauth"
import { authMiddleware, type AuthenticatedRequest } from "@/lib/auth"
import { MetaPayError } from "@/lib/errors"

export async function GET(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  return authMiddleware(req, async (authReq: AuthenticatedRequest) => {
    try {
      const { invoiceId } = params

      if (!invoiceId || invoiceId.length < 1) {
        throw new MetaPayError(400, "Invalid invoice ID")
      }

      // Get local transaction
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
        throw new MetaPayError(403, "Unauthorized access to invoice")
      }

      // Optionally fetch from SellAuth for additional details
      let sellauthData = null
      try {
        sellauthData = await callSellAuth("GET", `/shops/${process.env.MASTER_SHOP_ID}/invoices/${invoiceId}`)
      } catch (error) {
        console.warn("[v0] Failed to fetch SellAuth invoice details:", error)
      }

      return NextResponse.json({
        success: true,
        data: {
          id: transaction.invoice_id,
          amount: transaction.amount,
          customerFee: transaction.customer_fee,
          netToSeller: transaction.net_to_seller,
          status: transaction.status,
          description: transaction.description,
          completedAt: transaction.completed_at,
          createdAt: transaction.created_at,
          sellauth: sellauthData
            ? {
                paid_usd: sellauthData.paid_usd,
                email: sellauthData.email,
                gateway: sellauthData.gateway,
              }
            : null,
        },
      })
    } catch (error) {
      if (error instanceof MetaPayError) {
        throw error
      }
      console.error("[v0] Get invoice error:", error)
      throw new MetaPayError(500, "Failed to fetch invoice")
    }
  })
}
