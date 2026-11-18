"use client"

import { useQuery } from "@tanstack/react-query"
import { qk } from "@/lib/query-keys"
import { useSessionStatus } from "@/lib/use-session-status"
import { getMe } from "./api"

/**
 * Profil pemanggil beserta status usaha dan keanggotaan pekerja (D220). Hanya berjalan saat sesi
 * aktif. Klaim access token bisa basi sampai 15 menit, jadi keputusan tampilan memakai data ini,
 * bukan isi JWT (CLAUDE.md web jebakan 11).
 */
export function useMe() {
  const status = useSessionStatus()
  return useQuery({ queryKey: qk.me, queryFn: getMe, enabled: status === "authenticated" })
}
