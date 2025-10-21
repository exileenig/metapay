import { randomBytes } from "crypto"

export function generateApiKey(): string {
  return `metapay_sk_${randomBytes(32).toString("hex")}`
}

export function generateCouponCode(index: number): string {
  return `SELLER_${index.toString().padStart(6, "0")}_${randomBytes(4).toString("hex").toUpperCase()}`
}
