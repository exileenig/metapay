import supabase from "./supabase"

export async function getCustomerFee(sellerId: number): Promise<number> {
  const { data: seller } = await supabase.from("sellers").select("custom_customer_fee").eq("id", sellerId).single()

  if (seller?.custom_customer_fee !== null && seller?.custom_customer_fee !== undefined) {
    return seller.custom_customer_fee
  }

  const { data: config } = await supabase.from("config").select("customer_fee").eq("id", 1).single()

  return config?.customer_fee || 15
}

export async function getSellerFee(sellerId: number): Promise<number> {
  const { data: seller } = await supabase.from("sellers").select("custom_seller_fee").eq("id", sellerId).single()

  if (seller?.custom_seller_fee !== null && seller?.custom_seller_fee !== undefined) {
    return seller.custom_seller_fee
  }

  const { data: config } = await supabase.from("config").select("seller_fee").eq("id", 1).single()

  return config?.seller_fee || 10
}

export function calculateCustomerSurcharge(amount: number, feePercent: number): number {
  return amount * (feePercent / 100)
}

export function calculateSellerDeduction(amount: number, feePercent: number): number {
  return amount * (feePercent / 100)
}
