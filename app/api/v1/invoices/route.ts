import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import supabase from "@/lib/supabase"
import { authMiddleware, type AuthenticatedRequest } from "@/lib/auth"
import { MetaPayError } from "@/lib/errors"

const invoiceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(["pending", "completed", "failed", "refunded"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export async function GET(req: NextRequest) {
  return authMiddleware(req, async (authReq: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const queryParams = {
        page: searchParams.get("page"),
        perPage: searchParams.get("perPage"),
        status: searchParams.get("status"),
        startDate: searchParams.get("startDate"),
        endDate: searchParams.get("endDate"),
      }

      const result = invoiceQuerySchema.safeParse(queryParams)

      if (!result.success) {
        throw new MetaPayError(400, result.error.issues[0].message)
      }

      const { page, perPage, status, startDate, endDate } = result.data

      let query = supabase.from("transactions").select("*", { count: "exact" }).eq("seller_id", authReq.seller.id)

      if (status) {
        query = query.eq("status", status)
      }

      if (startDate) {
        query = query.gte("created_at", startDate)
      }

      if (endDate) {
        query = query.lte("created_at", endDate)
      }

      const {
        data: transactions,
        error,
        count,
      } = await query.order("created_at", { ascending: false }).range((page - 1) * perPage, page * perPage - 1)

      if (error) {
        throw new MetaPayError(500, "Failed to fetch invoices")
      }

      return NextResponse.json({
        success: true,
        data: transactions || [],
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
      console.error("[v0] List invoices error:", error)
      throw new MetaPayError(500, "Failed to fetch invoices")
    }
  })
}
