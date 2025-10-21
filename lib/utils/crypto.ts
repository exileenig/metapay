export function generateApiKey(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  const hex = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
  return `metapay_sk_${hex}`
}

export function generateCouponCode(index: number): string {
  const array = new Uint8Array(4)
  crypto.getRandomValues(array)
  const hex = Array.from(array, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()
  return `SELLER_${index.toString().padStart(6, "0")}_${hex}`
}
