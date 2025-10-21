import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import supabase from "@/lib/supabase"
import { MetaPayError } from "@/lib/errors"
import { adminMiddleware } from "@/lib/auth"

const transactionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["pending", "completed", "failed", "refunded"]).optional(),
  sellerId: z.coerce.number().int().positive().optional(),
})

export async function GET(req: NextRequest) {
  try {
    adminMiddleware(req)

    const { searchParams } = new URL(req.url)
    const queryParams = {
      page: searchParams.get("page"),
      perPage: searchParams.get("perPage"),
      status: searchParams.get("status"),
      sellerId: searchParams.get("sellerId"),
    }

    const result = transactionQuerySchema.safeParse(queryParams)

    if (!result.success) {
      throw new MetaPayError(400, result.error.issues[0].message)
    }

    const { page, perPage, status, sellerId } = result.data

    let query = supabase
      .from("transactions")
      .select(
        `
        *,
        seller:sellers!inner(id, email, business_name)
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    if (sellerId) {
      query = query.eq("seller_id", sellerId)
    }

    const { data: transactions, error, count } = await query.range((page - 1) * perPage, page * perPage - 1)

    if (error) {
      throw new MetaPayError(500, "Failed to fetch transactions")
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
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    console.error("[v0] Admin transactions error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
