import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import supabase from "@/lib/supabase"
import { callSellAuth } from "@/lib/sellauth"
import { authMiddleware, type AuthenticatedRequest } from "@/lib/auth"
import { getCustomerFee, calculateCustomerSurcharge } from "@/lib/fees"
import { MetaPayError } from "@/lib/errors"

const paymentSchema = z.object({
  amount: z.number().min(0.5, "Minimum $0.50").max(100000, "Maximum $100,000 per transaction"),
  currency: z.literal("usd", { errorMap: () => ({ message: "Only USD supported" }) }),
  customer_email: z.string().email("Invalid customer email"),
  description: z.string().max(500, "Description too long").optional(),
  success_url: z.string().url("Invalid success URL").optional(),
  cancel_url: z.string().url("Invalid cancel URL").optional(),
})

export async function POST(req: NextRequest) {
  return authMiddleware(req, async (authReq: AuthenticatedRequest) => {
    try {
      const body = await req.json()
      const result = paymentSchema.safeParse(body)

      if (!result.success) {
        throw new MetaPayError(400, result.error.issues[0].message)
      }

      const seller = authReq.seller

      // Calculate customer fee and total
      const customerFee = await getCustomerFee(seller.id)
      const surcharge = calculateCustomerSurcharge(result.data.amount, customerFee)
      const internalTotal = result.data.amount + surcharge

      // Calculate quantity for dummy product ($0.01 per unit)
      const quantity = Math.floor(internalTotal * 100)

      if (quantity < 50) {
        throw new MetaPayError(400, "Amount too low after fee calculation")
      }

      const ip = "8.8.8.8"

      const user_agent = req.headers.get("user-agent") || "Mozilla/5.0"

      // Prepare cart for SellAuth
      const cart = [
        {
          product_id: process.env.DUMMY_PRODUCT_ID,
          variant_id: process.env.DUMMY_VARIANT_ID,
          quantity,
        },
      ]

      // Create checkout in SellAuth
      const sellauthBody = {
        cart,
        ip,
        user_agent,
        email: result.data.customer_email,
        gateway: "NMI",
        coupon: seller.coupon_code,
        newsletter: false,
      }

      console.log("[v0] Creating SellAuth checkout:", {
        sellerId: seller.id,
        amount: result.data.amount,
        quantity,
        coupon: seller.coupon_code,
        ip,
      })

      const sellauthRes = await callSellAuth("POST", `/shops/${process.env.MASTER_SHOP_ID}/checkout`, sellauthBody)

      // Extract invoice ID from response
      const invoiceId = sellauthRes.id || sellauthRes.invoice_id || sellauthRes.invoiceId

      if (!invoiceId) {
        console.error("[v0] No invoice ID in SellAuth response:", sellauthRes)
        throw new MetaPayError(500, "Failed to create checkout - no invoice ID")
      }

      // Create transaction record
      const { error } = await supabase.from("transactions").insert({
        seller_id: seller.id,
        invoice_id: invoiceId,
        amount: result.data.amount,
        customer_fee: surcharge,
        net_to_seller: result.data.amount,
        status: "pending",
        description: result.data.description,
      })

      if (error) {
        console.error("[v0] Failed to create transaction:", error)
        throw new MetaPayError(500, "Failed to create transaction record")
      }

      // Get checkout URL
      const checkout_url =
        sellauthRes.url || sellauthRes.checkout_url || `https://checkout.sellauth.com/invoice/${invoiceId}`

      console.log("[v0] Payment created:", { invoiceId, checkout_url })

      return NextResponse.json({
        success: true,
        checkout_url,
        invoice_id: invoiceId,
      })
    } catch (error) {
      if (error instanceof MetaPayError) {
        throw error
      }
      console.error("[v0] Payment creation error:", error)
      throw new MetaPayError(500, "Failed to create payment")
    }
  })
}
