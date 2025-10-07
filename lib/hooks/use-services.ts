"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Service } from "@/lib/types/database"
import { getErrorMessage } from "@/lib/utils"

export function useServices(filters?: { branchId?: string; category?: string; isActive?: boolean }) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchServices()

    const channel = supabase
      .channel("services-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "services",
        },
        (payload) => {
          console.log("[v0] Service change detected:", payload)

          if (payload.eventType === "INSERT") {
            setServices((prev) => [...prev, payload.new as Service])
          } else if (payload.eventType === "UPDATE") {
            setServices((prev) => prev.map((s) => (s.id === payload.new.id ? (payload.new as Service) : s)))
          } else if (payload.eventType === "DELETE") {
            setServices((prev) => prev.filter((s) => s.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [filters?.branchId, filters?.category, filters?.isActive])

  const fetchServices = async () => {
    try {
      setLoading(true)
      setError(null)
      let query = supabase.from("services").select("*").order("name")

      if (filters?.branchId) query = query.eq("branch_id", filters.branchId)
      if (filters?.category) query = query.eq("category", filters.category)
      if (filters?.isActive !== undefined) query = query.eq("is_active", filters.isActive)

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setServices(data || [])
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      setError(errorMsg)
      console.error("[v0] Error fetching services:", errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const createService = async (serviceData: Partial<Service>) => {
    try {
      const { data, error: createError } = await supabase.from("services").insert(serviceData).select().single()

      if (createError) throw createError

      setServices((prev) => [...prev, data])
      return { data, error: null }
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      return { data: null, error: errorMsg }
    }
  }

  const updateService = async (id: string, updates: Partial<Service>) => {
    try {
      const { data, error: updateError } = await supabase
        .from("services")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (updateError) throw updateError

      setServices((prev) => prev.map((s) => (s.id === id ? data : s)))
      return { data, error: null }
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      return { data: null, error: errorMsg }
    }
  }

  const deleteService = async (id: string) => {
    try {
      const { error: deleteError } = await supabase.from("services").delete().eq("id", id)

      if (deleteError) throw deleteError

      setServices((prev) => prev.filter((s) => s.id !== id))
      return { error: null }
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      return { error: errorMsg }
    }
  }

  return {
    services,
    loading,
    error,
    fetchServices,
    createService,
    updateService,
    deleteService,
  }
}
