"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Product } from "@/lib/types/database"

export function useProducts(filters?: { branchId?: string; category?: string; inStock?: boolean }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchProducts()

    const channel = supabase
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, (payload) => {
        console.log("[v0] Products real-time update:", payload)

        if (payload.eventType === "INSERT") {
          setProducts((prev) => [...prev, payload.new as Product])
        } else if (payload.eventType === "UPDATE") {
          setProducts((prev) => prev.map((p) => (p.id === payload.new.id ? (payload.new as Product) : p)))
        } else if (payload.eventType === "DELETE") {
          setProducts((prev) => prev.filter((p) => p.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [filters?.branchId, filters?.category, filters?.inStock])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      let query = supabase.from("products").select("*").eq("is_active", true).order("name")

      if (filters?.branchId) query = query.eq("branch_id", filters.branchId)
      if (filters?.category) query = query.eq("category", filters.category)
      if (filters?.inStock) query = query.gt("stock_quantity", 0)

      const { data, error } = await query

      if (error) throw error

      setProducts(data || [])
    } catch (err: any) {
      console.error("[v0] Fetch products error:", err)
      setError(err.message || "Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  const createProduct = async (productData: Partial<Product>) => {
    try {
      const { data, error } = await supabase.from("products").insert(productData).select().single()

      if (error) throw error

      return { data, error: null }
    } catch (err: any) {
      console.error("[v0] Create product error:", err)
      return { data: null, error: err.message || "Failed to create product" }
    }
  }

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const { data, error } = await supabase.from("products").update(updates).eq("id", id).select().single()

      if (error) throw error

      return { data, error: null }
    } catch (err: any) {
      console.error("[v0] Update product error:", err)
      return { data: null, error: err.message || "Failed to update product" }
    }
  }

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id)

      if (error) throw error

      return { error: null }
    } catch (err: any) {
      console.error("[v0] Delete product error:", err)
      return { error: err.message || "Failed to delete product" }
    }
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  }
}
