"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ProfileTab({ profile, onUpdate }: { profile: any; onUpdate: () => void }) {
  const [loading, setLoading] = useState(false)
  const [wallets, setWallets] = useState({
    usdcSolWallet: profile?.usdcSolWallet || "",
    usdcBscWallet: profile?.usdcBscWallet || "",
    ltcWallet: profile?.ltcWallet || "",
  })

  const handleUpdate = async () => {
    try {
      setLoading(true)
      const apiKey = localStorage.getItem("metapay_api_key")
      const res = await fetch("/api/v1/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(wallets),
      })

      const data = await res.json()

      if (data.success) {
        alert("Profile updated successfully")
        onUpdate()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Manage your account and payout wallets</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>API Key</Label>
          <div className="flex gap-2">
            <Input value={profile?.apiKey || ""} readOnly />
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(localStorage.getItem("metapay_api_key") || "")
                alert("API key copied!")
              }}
            >
              Copy
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="usdcSol">USDC Wallet (Solana)</Label>
          <Input
            id="usdcSol"
            placeholder="Solana address"
            value={wallets.usdcSolWallet}
            onChange={(e) => setWallets({ ...wallets, usdcSolWallet: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="usdcBsc">USDC Wallet (BSC)</Label>
          <Input
            id="usdcBsc"
            placeholder="0x..."
            value={wallets.usdcBscWallet}
            onChange={(e) => setWallets({ ...wallets, usdcBscWallet: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ltc">Litecoin Wallet</Label>
          <Input
            id="ltc"
            placeholder="L..."
            value={wallets.ltcWallet}
            onChange={(e) => setWallets({ ...wallets, ltcWallet: e.target.value })}
          />
        </div>

        <Button onClick={handleUpdate} disabled={loading}>
          {loading ? "Updating..." : "Update Profile"}
        </Button>
      </CardContent>
    </Card>
  )
}
