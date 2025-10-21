"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Payout {
  id: number
  amountUsd: number
  sellerFee: number
  netUsd: number
  crypto: string
  amountCrypto: number
  txHash: string
  status: string
  createdAt: string
  explorerUrl: string
}

export function PayoutsTab({ balance }: { balance: number }) {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(false)
  const [crypto, setCrypto] = useState("USDC_SOL")
  const [amount, setAmount] = useState("")

  const fetchPayouts = async () => {
    try {
      const apiKey = localStorage.getItem("metapay_api_key")
      const res = await fetch("/api/v1/payouts", {
        headers: { Authorization: `Bearer ${apiKey}` },
      })

      const data = await res.json()
      if (data.success) {
        setPayouts(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch payouts:", error)
    }
  }

  useEffect(() => {
    fetchPayouts()
  }, [])

  const handlePayout = async () => {
    if (!amount || Number.parseFloat(amount) < 10) {
      alert("Minimum payout is $10")
      return
    }

    if (Number.parseFloat(amount) > balance) {
      alert("Insufficient balance")
      return
    }

    try {
      setLoading(true)
      const apiKey = localStorage.getItem("metapay_api_key")
      const res = await fetch("/api/v1/payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          crypto,
          amount: Number.parseFloat(amount),
        }),
      })

      const data = await res.json()

      if (data.success) {
        alert(`Payout initiated! TX: ${data.txHash}`)
        setAmount("")
        fetchPayouts()
        window.location.reload() // Refresh to update balance
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert("Failed to process payout")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Request Payout</CardTitle>
          <CardDescription>Withdraw your balance to crypto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Cryptocurrency</Label>
            <Select value={crypto} onValueChange={setCrypto}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USDC_SOL">USDC (Solana)</SelectItem>
                <SelectItem value="USDC_BSC">USDC (BSC)</SelectItem>
                <SelectItem value="LTC">Litecoin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Amount (USD)</Label>
            <Input
              type="number"
              min="10"
              max={balance}
              step="0.01"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">Available: ${balance.toFixed(2)} | Minimum: $10</p>
          </div>

          <Button onClick={handlePayout} disabled={loading}>
            {loading ? "Processing..." : "Request Payout"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Crypto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>TX Hash</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>${payout.amountUsd.toFixed(2)}</TableCell>
                  <TableCell>{payout.crypto}</TableCell>
                  <TableCell>
                    <Badge variant={payout.status === "confirmed" ? "default" : "secondary"}>{payout.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <a
                      href={payout.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-primary hover:underline"
                    >
                      {payout.txHash.slice(0, 8)}...
                    </a>
                  </TableCell>
                  <TableCell>{new Date(payout.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
