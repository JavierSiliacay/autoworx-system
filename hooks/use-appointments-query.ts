import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export const APPOINTMENTS_QUERY_KEY = ["appointments"] as const
export const HISTORY_QUERY_KEY = ["history"] as const

export async function fetchAppointmentsApi() {
  const response = await fetch("/api/appointments")
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || "Failed to fetch appointments")
  }
  return response.json()
}

export async function fetchHistoryApi() {
  const response = await fetch("/api/history")
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || "Failed to fetch history")
  }
  return response.json()
}

/**
 * Hook for managing appointments with TanStack Query.
 * Includes caching, background revalidation, and smart optimistic updates.
 */
export function useAppointmentsQuery(enabled = true) {
  return useQuery({
    queryKey: APPOINTMENTS_QUERY_KEY,
    queryFn: fetchAppointmentsApi,
    enabled,
    staleTime: 1000 * 60, // 1 minute
  })
}

export function useHistoryQuery(enabled = true) {
  return useQuery({
    queryKey: HISTORY_QUERY_KEY,
    queryFn: fetchHistoryApi,
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}
