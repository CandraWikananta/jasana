"use client"

import { useQuery } from "@tanstack/react-query"
import { qk } from "@/lib/query-keys"
import { getAddresses, getSessions } from "./api"

/** Selalu dimuat ulang saat dibuka: daftar lama bisa menyembunyikan perangkat yang baru masuk. */
export function useSessions() {
  return useQuery({ queryKey: qk.sessions, queryFn: getSessions, staleTime: 0 })
}

export function useAddresses() {
  return useQuery({ queryKey: qk.addresses, queryFn: getAddresses })
}
