"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function FeesTab() {
  const [customerFee, setCustomerFee] = useState("15")
  const [sellerFee, setSellerFee] = useState("10")
  const [loading, setLoading] = useState(false)

  const fetchFees = async () => {
    try {
      const adminSecret = sessionStorage.getItem("admin_secret")
      const res = await fetch("/api/v1/admin/config/fees", {
        headers: { "x-admin-secret": adminSecret || "" },
      })

      const data = await res.json()
      if (data.success) {
        setCustomerFee(data.data.customerFee.toString())
        setSellerFee(data.data.sellerFee.toString())
      }
    } catch (error) {
      console.error("Failed to fetch fees:", error)
    }
  }

  useEffect(() => {
    fetchFees()
  }, [])

  const updateFees = async () => {
    try {
      setLoading(true)
      const adminSecret = sessionStorage.getItem("admin_secret")
      const res = await fetch("/api/v1/admin/config/fees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret || "",
        },
        body: JSON.stringify({
          customerFee: Number.parseFloat(customerFee),
          sellerFee: Number.parseFloat(sellerFee),
        }),
      })

      const data = await res.json()
      if (data.success) {
        alert("Fees updated successfully")
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Failed to update fees:", error)
      alert("Failed to update fees")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Configuration</CardTitle>
        <CardDescription>Manage global platform fees</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="customerFee">Customer Fee (%)</Label>
          <Input
            id="customerFee"
            type="number"
            min="0"
            max="30"
            step="0.1"
            value={customerFee}
            onChange={(e) => setCustomerFee(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Fee added to customer's payment (hidden surcharge). Default: 15%
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sellerFee">Seller Fee (%)</Label>
          <Input
            id="sellerFee"
            type="number"
            min="0"
            max="30"
            step="0.1"
            value={sellerFee}
            onChange={(e) => setSellerFee(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">Fee deducted from seller's payout. Default: 10%</p>
        </div>

        <Button onClick={updateFees} disabled={loading}>
          {loading ? "Updating..." : "Update Fees"}
        </Button>
      </CardContent>
    </Card>
  )
}
