"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Seller {
  id: number
  email: string
  businessName: string
  status: string
  balance: number
  createdAt: string
  apiKey: string
}

export function SellersTab() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const fetchSellers = async () => {
    try {
      setLoading(true)
      const adminSecret = sessionStorage.getItem("admin_secret")
      const url = statusFilter === "all" ? "/api/v1/admin/sellers" : `/api/v1/admin/sellers?status=${statusFilter}`

      const res = await fetch(url, {
        headers: { "x-admin-secret": adminSecret || "" },
      })

      const data = await res.json()
      if (data.success) {
        setSellers(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch sellers:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSellers()
  }, [statusFilter])

  const approveSeller = async (sellerId: number) => {
    try {
      const adminSecret = sessionStorage.getItem("admin_secret")
      const res = await fetch("/api/v1/admin/approve-seller", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret || "",
        },
        body: JSON.stringify({ sellerId }),
      })

      const data = await res.json()
      if (data.success) {
        alert(`Seller approved! API Key: ${data.apiKey}`)
        fetchSellers()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Failed to approve seller:", error)
      alert("Failed to approve seller")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sellers</CardTitle>
            <CardDescription>Manage seller accounts and approvals</CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Business Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellers.map((seller) => (
                <TableRow key={seller.id}>
                  <TableCell>{seller.id}</TableCell>
                  <TableCell className="font-medium">{seller.businessName}</TableCell>
                  <TableCell>{seller.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        seller.status === "approved"
                          ? "default"
                          : seller.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {seller.status}
                    </Badge>
                  </TableCell>
                  <TableCell>${seller.balance.toFixed(2)}</TableCell>
                  <TableCell>{new Date(seller.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {seller.status === "pending" && (
                      <Button size="sm" onClick={() => approveSeller(seller.id)}>
                        Approve
                      </Button>
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
