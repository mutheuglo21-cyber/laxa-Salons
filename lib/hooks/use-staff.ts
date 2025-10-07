"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Staff } from "@/lib/types/database"
import { getErrorMessage } from "@/lib/utils"

export function useStaff(filters?: { branchId?: string; isAvailable?: boolean }) {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchStaff()

    const channel = supabase
      .channel("staff-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "staff",
        },
        async (payload) => {
          console.log("[v0] Staff change detected:", payload)
          await fetchStaff()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [filters?.branchId, filters?.isAvailable])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      setError(null)
      let query = supabase
        .from("staff")
        .select(
          `
          *,
          user:users!staff_user_id_fkey(id, full_name, email, phone, avatar_url),
          branch:branches(id, name, city)
        `,
        )
        .order("created_at", { ascending: false })

      if (filters?.branchId) query = query.eq("branch_id", filters.branchId)
      if (filters?.isAvailable !== undefined) query = query.eq("is_available", filters.isAvailable)

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setStaff(data || [])
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      setError(errorMsg)
      console.error("[v0] Error fetching staff:", errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const createStaff = async (staffData: Partial<Staff>) => {
    try {
      const { data, error: createError } = await supabase
        .from("staff")
        .insert(staffData)
        .select(
          `
          *,
          user:users!staff_user_id_fkey(id, full_name, email, phone, avatar_url),
          branch:branches(id, name, city)
        `,
        )
        .single()

      if (createError) throw createError

      setStaff((prev) => [...prev, data])
      return { data, error: null }
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      return { data: null, error: errorMsg }
    }
  }

  const updateStaff = async (id: string, updates: Partial<Staff>) => {
    try {
      const { data, error: updateError } = await supabase
        .from("staff")
        .update(updates)
        .eq("id", id)
        .select(
          `
          *,
          user:users!staff_user_id_fkey(id, full_name, email, phone, avatar_url),
          branch:branches(id, name, city)
        `,
        )
        .single()

      if (updateError) throw updateError

      setStaff((prev) => prev.map((s) => (s.id === id ? data : s)))
      return { data, error: null }
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      return { data: null, error: errorMsg }
    }
  }

  const deleteStaff = async (id: string) => {
    try {
      const { error: deleteError } = await supabase.from("staff").delete().eq("id", id)

      if (deleteError) throw deleteError

      setStaff((prev) => prev.filter((s) => s.id !== id))
      return { error: null }
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      return { error: errorMsg }
    }
  }

  return {
    staff,
    loading,
    error,
    fetchStaff,
    createStaff,
    updateStaff,
    deleteStaff,
  }
}
