"use client"

import { use, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, XCircle, Clock, Package, ArrowLeft } from "lucide-react"
import Image from "next/image"
import type { Order } from "@/lib/types/database"

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentStatus = searchParams.get("payment")
  const supabase = getSupabaseBrowserClient()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchOrder()
  }, [id])

  const fetchOrder = async () => {
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
          client:users!orders_client_id_fkey(id, full_name, email, phone),
          branch:branches(id, name, city, address, phone),
          items:order_items(
            *,
            product:products(id, name, price, image_url)
          )
        `,
        )
        .eq("id", id)
        .eq("client_id", user.id)
        .single()

      if (fetchError) throw fetchError

      setOrder(data)
    } catch (err: any) {
      console.error("[v0] Fetch order error:", err)
      setError(err.message || "Failed to load order")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "cancelled":
      case "refunded":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "processing":
        return <Package className="h-5 w-5 text-blue-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "refunded":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertDescription>{error || "Order not found"}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/shop")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shop
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button variant="ghost" onClick={() => router.push("/shop")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Shop
      </Button>

      {paymentStatus === "success" && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Payment successful! Your order has been confirmed.
          </AlertDescription>
        </Alert>
      )}

      {paymentStatus === "failed" && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>Payment failed. Please try again or contact support.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">Order #{order.order_number}</CardTitle>
                <CardDescription>Placed on {new Date(order.created_at).toLocaleDateString()}</CardDescription>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <Badge className={getStatusColor(order.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(order.status)}
                    {order.status.toUpperCase()}
                  </span>
                </Badge>
                <Badge className={getPaymentStatusColor(order.payment_status)}>
                  {order.payment_status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <p className="text-sm text-muted-foreground">{order.client?.full_name}</p>
                <p className="text-sm text-muted-foreground">{order.client?.email}</p>
                {order.client?.phone && <p className="text-sm text-muted-foreground">{order.client.phone}</p>}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Branch Information</h3>
                <p className="text-sm text-muted-foreground">{order.branch?.name}</p>
                <p className="text-sm text-muted-foreground">{order.branch?.city}</p>
                <p className="text-sm text-muted-foreground">{order.branch?.phone}</p>
              </div>
            </div>

            {order.shipping_address && (
              <div>
                <h3 className="font-semibold mb-2">Delivery Address</h3>
                <p className="text-sm text-muted-foreground">{order.shipping_address}</p>
              </div>
            )}

            {order.payment_method && (
              <div>
                <h3 className="font-semibold mb-2">Payment Method</h3>
                <p className="text-sm text-muted-foreground">{order.payment_method}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {item.product?.image_url ? (
                      <Image
                        src={item.product.image_url || "/placeholder.svg"}
                        alt={item.product.name || "Product"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.product?.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} x KES {item.unit_price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">KES {item.total_price.toFixed(2)}</p>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>KES {order.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
