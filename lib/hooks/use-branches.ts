"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Branch } from "@/lib/types/database"
import { getErrorMessage } from "@/lib/utils"

export function useBranches(isActive?: boolean) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchBranches()

    const channel = supabase
      .channel("branches-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "branches",
          filter: isActive !== undefined ? `is_active=eq.${isActive}` : undefined,
        },
        (payload) => {
          console.log("[v0] Branch change detected:", payload)

          if (payload.eventType === "INSERT") {
            setBranches((prev) => [...prev, payload.new as Branch])
          } else if (payload.eventType === "UPDATE") {
            setBranches((prev) => prev.map((b) => (b.id === payload.new.id ? (payload.new as Branch) : b)))
          } else if (payload.eventType === "DELETE") {
            setBranches((prev) => prev.filter((b) => b.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isActive])

  const fetchBranches = async () => {
    try {
      setLoading(true)
      setError(null)
      let query = supabase.from("branches").select("*").order("name")

      if (isActive !== undefined) {
        query = query.eq("is_active", isActive)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setBranches(data || [])
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      setError(errorMsg)
      console.error("[v0] Error fetching branches:", errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const createBranch = async (branchData: Partial<Branch>) => {
    try {
      const tempId = `temp-${Date.now()}`
      const optimisticBranch = { ...branchData, id: tempId } as Branch
      setBranches((prev) => [...prev, optimisticBranch])

      const { data, error: createError } = await supabase.from("branches").insert(branchData).select().single()

      if (createError) throw createError

      setBranches((prev) => prev.map((b) => (b.id === tempId ? data : b)))
      return { data, error: null }
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      await fetchBranches()
      return { data: null, error: errorMsg }
    }
  }

  const updateBranch = async (id: string, updates: Partial<Branch>) => {
    try {
      const originalBranch = branches.find((b) => b.id === id)
      setBranches((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)))

      const { data, error: updateError } = await supabase
        .from("branches")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (updateError) throw updateError

      setBranches((prev) => prev.map((b) => (b.id === id ? data : b)))
      return { data, error: null }
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      await fetchBranches()
      return { data: null, error: errorMsg }
    }
  }

  const deleteBranch = async (id: string) => {
    try {
      const originalBranches = [...branches]
      setBranches((prev) => prev.filter((b) => b.id !== id))

      const { error: deleteError } = await supabase.from("branches").delete().eq("id", id)

      if (deleteError) throw deleteError

      return { error: null }
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      await fetchBranches()
      return { error: errorMsg }
    }
  }

  return {
    branches,
    loading,
    error,
    fetchBranches,
    createBranch,
    updateBranch,
    deleteBranch,
  }
}
