import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

let supabase: any
let callSellAuth: any
let generateApiKey: any
let generateCouponCode: any
let MetaPayError: any

try {
  supabase = require("@/lib/supabase").default
  callSellAuth = require("@/lib/sellauth").callSellAuth
  const crypto = require("@/lib/utils/crypto")
  generateApiKey = crypto.generateApiKey
  generateCouponCode = crypto.generateCouponCode
  MetaPayError = require("@/lib/errors").MetaPayError
} catch (err) {
  console.error("[v0] Import error:", err)
}

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  businessName: z.string().min(3, "Business name must be at least 3 characters"),
  url: z.string().url("Invalid URL").optional().or(z.literal("")),
  volumeEstimate: z.number().min(0, "Volume estimate must be non-negative").optional(),
})

export async function POST(req: NextRequest) {
  try {
    if (!supabase || !callSellAuth || !generateApiKey || !generateCouponCode || !MetaPayError) {
      console.error("[v0] Required modules not loaded")
      return NextResponse.json(
        { success: false, error: "Server configuration error. Please contact support." },
        { status: 500 },
      )
    }

    console.log("[v0] Registration request received")

    const body = await req.json()
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.issues[0].message }, { status: 400 })
    }

    const { email, businessName, url, volumeEstimate } = result.data

    console.log("[v0] Checking for existing email")
    const { data: existing, error: checkError } = await supabase
      .from("sellers")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (checkError) {
      console.error("[v0] Database check error:", checkError)
      return NextResponse.json({ success: false, error: `Database error: ${checkError.message}` }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({ success: false, error: "Email already registered" }, { status: 409 })
    }

    const apiKey = generateApiKey()
    console.log("[v0] Generated API key:", apiKey.slice(0, 20) + "...")

    const { count, error: countError } = await supabase.from("sellers").select("*", { count: "exact", head: true })

    if (countError) {
      console.error("[v0] Count error:", countError)
      return NextResponse.json({ success: false, error: `Database error: ${countError.message}` }, { status: 500 })
    }

    const index = (count || 0) + 1
    let couponCode = generateCouponCode(index)
    console.log("[v0] Generated coupon code:", couponCode)

    let attempts = 0
    while (attempts < 3) {
      try {
        console.log("[v0] Creating SellAuth coupon (attempt", attempts + 1, ")")
        await callSellAuth("POST", `/shops/${process.env.MASTER_SHOP_ID}/coupons`, {
          code: couponCode,
          discount: 0,
          discount_type: "percentage",
          max_uses: null,
          expires_at: null,
        })
        console.log("[v0] SellAuth coupon created successfully")
        break
      } catch (err: any) {
        console.error("[v0] SellAuth error:", err.message)
        if (err.message.includes("already exists") || err.status === 409) {
          attempts++
          couponCode = generateCouponCode(index + attempts)
          console.log("[v0] Retrying with new coupon code:", couponCode)
        } else {
          return NextResponse.json({ success: false, error: `SellAuth error: ${err.message}` }, { status: 500 })
        }
      }
    }

    if (attempts === 3) {
      return NextResponse.json(
        { success: false, error: "Failed to create unique coupon after 3 attempts" },
        { status: 500 },
      )
    }

    console.log("[v0] Inserting seller into database")
    const { error: insertError } = await supabase.from("sellers").insert({
      email,
      business_name: businessName,
      url: url || null,
      volume_estimate: volumeEstimate || null,
      api_key: apiKey,
      coupon_code: couponCode,
      status: "pending",
      balance: 0,
    })

    if (insertError) {
      console.error("[v0] Database insert error:", insertError)
      return NextResponse.json(
        { success: false, error: `Failed to create seller: ${insertError.message}` },
        { status: 500 },
      )
    }

    console.log("[v0] Seller registered successfully:", email)
    return NextResponse.json(
      {
        success: true,
        message: "Registration successful! Your account is pending approval.",
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}
