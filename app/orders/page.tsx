"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, ShoppingBag } from "lucide-react"
import type { Order } from "@/lib/types/database"

export default function OrdersPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data, error: fetchError } = await supabase
        .from("orders")
        .select(
          `
          *,
          branch:branches(id, name, city)
        `,
        )
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      setOrders(data || [])
    } catch (err: any) {
      console.error("[v0] Fetch orders error:", err)
      setError(err.message || "Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
      case "refunded":
        return "bg-red-100 text-red-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">You haven't placed any orders yet</p>
            <Button onClick={() => router.push("/shop")}>Start Shopping</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader onClick={() => router.push(`/orders/${order.id}`)}>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                  <CardDescription>
                    {new Date(order.created_at).toLocaleDateString()} • {order.branch?.name}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(order.status)}>{order.status.toUpperCase()}</Badge>
              </div>
            </CardHeader>
            <CardContent onClick={() => router.push(`/orders/${order.id}`)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>Payment: {order.payment_status}</span>
                </div>
                <p className="text-lg font-semibold">KES {order.total_amount.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
