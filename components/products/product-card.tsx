"use client"

import type { Product } from "@/lib/types/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Package } from "lucide-react"
import Image from "next/image"

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const inStock = product.stock_quantity > 0

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {product.image_url ? (
            <Image
              src={product.image_url || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          {!inStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge variant="destructive" className="text-sm">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold leading-tight">{product.name}</CardTitle>
          {product.category && (
            <Badge variant="secondary" className="text-xs">
              {product.category}
            </Badge>
          )}
        </div>

        {product.description && (
          <CardDescription className="text-sm line-clamp-2 leading-relaxed">{product.description}</CardDescription>
        )}

        <div className="flex items-end justify-between pt-2">
          <div>
            <p className="text-2xl font-semibold text-foreground">KES {product.price.toFixed(2)}</p>
            {inStock && <p className="text-xs text-muted-foreground mt-1">{product.stock_quantity} in stock</p>}
          </div>

          {onAddToCart && (
            <Button onClick={() => onAddToCart(product)} disabled={!inStock} size="sm" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Add to cart
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
