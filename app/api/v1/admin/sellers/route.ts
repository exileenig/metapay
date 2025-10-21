import { type NextRequest, NextResponse } from "next/server"
import supabase from "@/lib/supabase"
import { MetaPayError } from "@/lib/errors"
import { adminMiddleware } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    adminMiddleware(req)

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    let query = supabase
      .from("sellers")
      .select("id, email, business_name, url, volume_estimate, status, balance, created_at, api_key")
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data: sellers, error } = await query

    if (error) {
      throw new MetaPayError(500, "Failed to fetch sellers")
    }

    return NextResponse.json({
      success: true,
      data: sellers || [],
    })
  } catch (error) {
    if (error instanceof MetaPayError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    console.error("[v0] List sellers error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
