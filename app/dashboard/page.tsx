"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InvoicesTab } from "@/components/dashboard/invoices-tab"
import { PayoutsTab } from "@/components/dashboard/payouts-tab"
import { ProfileTab } from "@/components/dashboard/profile-tab"

export default function DashboardPage() {
  const router = useRouter()
  const [apiKey, setApiKey] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const storedKey = localStorage.getItem("metapay_api_key")
    if (storedKey) {
      setApiKey(storedKey)
      verifyAndFetchProfile(storedKey)
    }
  }, [])

  const verifyAndFetchProfile = async (key: string) => {
    try {
      const res = await fetch("/api/v1/profile", {
        headers: { Authorization: `Bearer ${key}` },
      })

      const data = await res.json()

      if (data.success) {
        setProfile(data.data)
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem("metapay_api_key")
        setError("Invalid API key")
      }
    } catch (err) {
      setError("Failed to fetch profile")
    }
  }

  const handleLogin = () => {
    if (!apiKey) {
      setError("Please enter your API key")
      return
    }
    localStorage.setItem("metapay_api_key", apiKey)
    verifyAndFetchProfile(apiKey)
  }

  const handleLogout = () => {
    localStorage.removeItem("metapay_api_key")
    setIsAuthenticated(false)
    setProfile(null)
    setApiKey("")
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Seller Login</CardTitle>
            <CardDescription>Enter your API key to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="metapay_sk_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleLogin} className="w-full">
              Login
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
            <div>
              <h1 className="text-2xl font-bold">{profile?.businessName}</h1>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${profile?.balance?.toFixed(2) || "0.00"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Fee</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{profile?.customerFeeRate || 15}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seller Fee</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{profile?.sellerFeeRate || 10}%</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="invoices" className="space-y-6">
          <TabsList>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <InvoicesTab />
          </TabsContent>

          <TabsContent value="payouts">
            <PayoutsTab balance={profile?.balance || 0} />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileTab profile={profile} onUpdate={() => verifyAndFetchProfile(apiKey)} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
