"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"

interface Payout {
  id: number
  sellerId: number
  sellerName: string
  amount: number
  cryptoType: string
  walletAddress: string
  status: string
  createdAt: string
  txHash?: string
}

export function PayoutsTab() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [txHash, setTxHash] = useState("")

  const fetchPayouts = async () => {
    try {
      setLoading(true)
      const adminSecret = sessionStorage.getItem("admin_secret")

      const res = await fetch("/api/v1/admin/payouts", {
        headers: { "x-admin-secret": adminSecret || "" },
      })

      const data = await res.json()
      if (data.success) {
        setPayouts(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch payouts:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayouts()
  }, [])

  const handleApprove = async (payoutId: number) => {
    if (!txHash) {
      alert("Please enter transaction hash")
      return
    }

    try {
      const adminSecret = sessionStorage.getItem("admin_secret")
      const res = await fetch("/api/v1/admin/payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret || "",
        },
        body: JSON.stringify({
          payoutId,
          action: "approve",
          txHash,
        }),
      })

      const data = await res.json()
      if (data.success) {
        alert("Payout approved successfully")
        setTxHash("")
        setProcessingId(null)
        fetchPayouts()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Failed to approve payout:", error)
      alert("Failed to approve payout")
    }
  }

  const handleReject = async (payoutId: number) => {
    if (!confirm("Are you sure you want to reject this payout?")) return

    try {
      const adminSecret = sessionStorage.getItem("admin_secret")
      const res = await fetch("/api/v1/admin/payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret || "",
        },
        body: JSON.stringify({
          payoutId,
          action: "reject",
        }),
      })

      const data = await res.json()
      if (data.success) {
        alert("Payout rejected")
        fetchPayouts()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Failed to reject payout:", error)
      alert("Failed to reject payout")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payout Requests</CardTitle>
        <CardDescription>Review and approve seller payout requests</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Crypto</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>{payout.id}</TableCell>
                  <TableCell className="font-medium">{payout.sellerName}</TableCell>
                  <TableCell>${payout.amount.toFixed(2)}</TableCell>
                  <TableCell>{payout.cryptoType}</TableCell>
                  <TableCell className="max-w-xs truncate font-mono text-xs">{payout.walletAddress}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        payout.status === "completed"
                          ? "default"
                          : payout.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {payout.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(payout.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {payout.status === "pending" && (
                      <div className="flex gap-2">
                        {processingId === payout.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="TX Hash"
                              value={txHash}
                              onChange={(e) => setTxHash(e.target.value)}
                              className="w-40"
                            />
                            <Button size="sm" onClick={() => handleApprove(payout.id)}>
                              Confirm
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setProcessingId(null)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Button size="sm" onClick={() => setProcessingId(payout.id)}>
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleReject(payout.id)}>
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                    {payout.status === "completed" && payout.txHash && (
                      <a
                        href={`https://explorer.solana.com/tx/${payout.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View TX
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
