import axios from "axios"
import { MetaPayError } from "./errors"

const sellauth = axios.create({
  baseURL: "https://api.sellauth.com/v1",
  headers: {
    Authorization: `Bearer ${process.env.SELLAUTH_TOKEN}`,
    "Content-Type": "application/json",
  },
  timeout: 10000,
})

sellauth.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("[v0] SellAuth error:", err.response?.data || err.message)
    throw new MetaPayError(
      err.response?.status || 500,
      err.response?.data?.error || err.response?.data?.message || "SellAuth failure",
    )
  },
)

export async function callSellAuth(method: "GET" | "POST" | "PUT" | "DELETE", path: string, data?: any) {
  const config = method === "GET" ? { params: data } : { data }
  const res = await sellauth({ method, url: path, ...config })
  return res.data
}
