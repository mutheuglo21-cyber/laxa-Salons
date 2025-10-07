"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Review } from "@/lib/types/database"
import { getErrorMessage } from "@/lib/utils"

export function useReviews(filters?: { branchId?: string; staffId?: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchReviews()

    const channel = supabase
      .channel("reviews-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
        },
        async (payload) => {
          console.log("[v0] Review change detected:", payload)
          await fetchReviews()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [filters?.branchId, filters?.staffId])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      setError(null)
      let query = supabase
        .from("reviews")
        .select(
          `
          *,
          user:users!reviews_user_id_fkey(id, full_name, avatar_url),
          branch:branches(id, name),
          staff:staff!reviews_staff_id_fkey(
            id,
            user:users!staff_user_id_fkey(full_name)
          )
        `,
        )
        .order("created_at", { ascending: false })

      if (filters?.branchId) query = query.eq("branch_id", filters.branchId)
      if (filters?.staffId) query = query.eq("staff_id", filters.staffId)

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setReviews(data || [])
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      setError(errorMsg)
      console.error("[v0] Error fetching reviews:", errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const createReview = async (reviewData: Partial<Review>) => {
    try {
      const { data, error: createError } = await supabase
        .from("reviews")
        .insert(reviewData)
        .select(
          `
          *,
          user:users!reviews_user_id_fkey(id, full_name, avatar_url),
          branch:branches(id, name),
          staff:staff!reviews_staff_id_fkey(
            id,
            user:users!staff_user_id_fkey(full_name)
          )
        `,
        )
        .single()

      if (createError) throw createError

      setReviews((prev) => [data, ...prev])
      return { data, error: null }
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      return { data: null, error: errorMsg }
    }
  }

  return {
    reviews,
    loading,
    error,
    fetchReviews,
    createReview,
  }
}
