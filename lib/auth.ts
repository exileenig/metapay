import { type NextRequest, NextResponse } from "next/server"
import supabase from "./supabase"
import { MetaPayError } from "./errors"

export interface AuthenticatedRequest extends NextRequest {
  seller?: any
}

export async function authMiddleware(
  req: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new MetaPayError(401, "Missing or invalid authorization header")
    }

    const apiKey = authHeader.substring(7)
    const { data: seller, error } = await supabase.from("sellers").select("*").eq("api_key", apiKey).single()

    if (error || !seller) {
      throw new MetaPayError(401, "Invalid API key")
    }

    if (seller.status !== "approved") {
      throw new MetaPayError(403, "Account not approved")
    }

    // Attach seller to request
    const authenticatedReq = req as AuthenticatedRequest
    authenticatedReq.seller = seller

    return await handler(authenticatedReq)
  } catch (error) {
    if (error instanceof MetaPayError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    console.error("[v0] Auth middleware error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export function adminMiddleware(req: NextRequest): void {
  const adminSecret = req.headers.get("x-admin-secret")
  if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
    throw new MetaPayError(403, "Unauthorized admin access")
  }
}
