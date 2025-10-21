import { type NextRequest, NextResponse } from "next/server"
import { adminMiddleware } from "@/lib/auth"
import { MetaPayError } from "@/lib/errors"

export async function POST(req: NextRequest) {
  try {
    adminMiddleware(req)
    return NextResponse.json({ success: true, message: "Admin verified" })
  } catch (error) {
    if (error instanceof MetaPayError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 })
  }
}
