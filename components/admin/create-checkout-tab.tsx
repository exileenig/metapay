"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Seller {
  id: number
  email: string
  businessName: string
  apiKey: string
}

export function CreateCheckoutTab() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [selectedSeller, setSelectedSeller] = useState("")
  const [amount, setAmount] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchSellers()
  }, [])

  const fetchSellers = async () => {
    try {
      const adminSecret = sessionStorage.getItem("admin_secret")
      const res = await fetch("/api/v1/admin/sellers?status=approved", {
        headers: { "x-admin-secret": adminSecret || "" },
      })

      const data = await res.json()
      if (data.success) {
        setSellers(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch sellers:", error)
    }
  }

  const handleCreateCheckout = async () => {
    setError("")
    setCheckoutUrl("")

    if (!selectedSeller) {
      setError("Please select a seller")
      return
    }

    if (!amount || Number.parseFloat(amount) < 0.5) {
      setError("Minimum amount is $0.50")
      return
    }

    if (!customerEmail) {
      setError("Customer email is required")
      return
    }

    try {
      setLoading(true)
      const seller = sellers.find((s) => s.id.toString() === selectedSeller)

      const res = await fetch("/api/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${seller?.apiKey}`,
        },
        body: JSON.stringify({
          amount: Number.parseFloat(amount),
          currency: "usd",
          customer_email: customerEmail,
          description: description || undefined,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setCheckoutUrl(data.checkout_url)
        setAmount("")
        setCustomerEmail("")
        setDescription("")
      } else {
        setError(data.error || "Failed to create checkout")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Checkout</CardTitle>
        <CardDescription>Generate a payment link for any seller</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="seller">Select Seller</Label>
          <Select value={selectedSeller} onValueChange={setSelectedSeller}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a seller" />
            </SelectTrigger>
            <SelectContent>
              {sellers.map((seller) => (
                <SelectItem key={seller.id} value={seller.id.toString()}>
                  {seller.businessName} ({seller.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (USD)</Label>
          <Input
            id="amount"
            type="number"
            min="0.5"
            max="100000"
            step="0.01"
            placeholder="10.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">Minimum: $0.50 | Maximum: $100,000</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Customer Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="customer@example.com"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Product or service description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {checkoutUrl && (
          <div className="rounded-lg border bg-muted p-4">
            <p className="mb-2 text-sm font-medium">Checkout URL Created:</p>
            <div className="flex gap-2">
              <Input value={checkoutUrl} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(checkoutUrl)
                  alert("Copied to clipboard!")
                }}
              >
                Copy
              </Button>
              <Button variant="outline" onClick={() => window.open(checkoutUrl, "_blank")}>
                Open
              </Button>
            </div>
          </div>
        )}

        <Button onClick={handleCreateCheckout} disabled={loading} className="w-full">
          {loading ? "Creating..." : "Create Checkout"}
        </Button>
      </CardContent>
    </Card>
  )
}
