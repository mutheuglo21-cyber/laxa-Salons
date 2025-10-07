import useSWR from "swr"
import { getErrorMessage } from "@/lib/utils"

const fetcher = async (url: string) => {
  const res = await fetch(url)

  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || "Failed to fetch stats")
  }

  return res.json()
}

export function useAdminStats(branchId?: string) {
  const url = branchId ? `/api/admin/stats?branch_id=${branchId}` : "/api/admin/stats"

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    onError: (err) => {
      console.error("[v0] Error fetching admin stats:", getErrorMessage(err))
    },
  })

  return {
    stats: data?.stats,
    recentAppointments: data?.recentAppointments,
    revenueByMonth: data?.revenueByMonth,
    isLoading,
    isError: error,
    errorMessage: error ? getErrorMessage(error) : null,
    refresh: mutate,
  }
}
