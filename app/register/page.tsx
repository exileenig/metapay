"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    businessName: "",
    url: "",
    volumeEstimate: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("[v0] Submitting registration form...")
      const res = await fetch("/api/v1/sellers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          volumeEstimate: formData.volumeEstimate ? Number.parseFloat(formData.volumeEstimate) : undefined,
        }),
      })

      console.log("[v0] Response status:", res.status)
      console.log("[v0] Response content-type:", res.headers.get("content-type"))

      const contentType = res.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text()
        console.error("[v0] Non-JSON response:", text.substring(0, 200))
        throw new Error("Server error: Please check that all environment variables are set correctly in .env.local")
      }

      const data = await res.json()
      console.log("[v0] Response data:", data)

      if (data.success) {
        alert("Registration submitted! You will receive your API key once approved by admin.")
        router.push("/")
      } else {
        setError(data.error || "Registration failed")
      }
    } catch (err) {
      console.error("[v0] Registration error:", err)
      setError(err instanceof Error ? err.message : "Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register as Seller</CardTitle>
          <CardDescription>Create your MetaPay account to start accepting payments</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                required
                minLength={3}
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Website URL (optional)</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="volumeEstimate">Estimated Monthly Volume (optional)</Label>
              <Input
                id="volumeEstimate"
                type="number"
                placeholder="10000"
                value={formData.volumeEstimate}
                onChange={(e) => setFormData({ ...formData, volumeEstimate: e.target.value })}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Register"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
