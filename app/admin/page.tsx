"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SellersTab } from "@/components/admin/sellers-tab"
import { TransactionsTab } from "@/components/admin/transactions-tab"
import { FeesTab } from "@/components/admin/fees-tab"
import { PayoutsTab } from "@/components/admin/payouts-tab"
import { CreateCheckoutTab } from "@/components/admin/create-checkout-tab"

export default function AdminPage() {
  const [adminSecret, setAdminSecret] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!adminSecret) {
      setError("Please enter admin secret")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/v1/admin/verify", {
        method: "POST",
        headers: {
          "x-admin-secret": adminSecret,
        },
      })

      const data = await res.json()

      if (data.success) {
        sessionStorage.setItem("admin_secret", adminSecret)
        setIsAuthenticated(true)
      } else {
        setError("Invalid admin secret key")
      }
    } catch (err) {
      setError("Failed to verify admin secret")
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Access</CardTitle>
            <CardDescription>Enter your admin secret key to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secret">Admin Secret</Label>
              <Input
                id="secret"
                type="password"
                placeholder="Enter admin secret"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleLogin} className="w-full" disabled={loading}>
              {loading ? "Verifying..." : "Login"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">MetaPay Admin</h1>
            <Button
              variant="outline"
              onClick={() => {
                sessionStorage.removeItem("admin_secret")
                setIsAuthenticated(false)
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="sellers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sellers">Sellers</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="create">Create Checkout</TabsTrigger>
            <TabsTrigger value="fees">Fee Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="sellers">
            <SellersTab />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionsTab />
          </TabsContent>

          <TabsContent value="payouts">
            <PayoutsTab />
          </TabsContent>

          <TabsContent value="create">
            <CreateCheckoutTab />
          </TabsContent>

          <TabsContent value="fees">
            <FeesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
