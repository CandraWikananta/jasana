"use client"

import { useQuery } from "@tanstack/react-query"
import { qk } from "@/lib/query-keys"
import { useSessionStatus } from "@/lib/use-session-status"
import { getUnreadNotificationCount } from "./api"

/** Lencana Bell di header. Ikut terinvalidasi oleh awalan ["notifications"] dari socket. */
export function useUnreadNotificationCount() {
  const status = useSessionStatus()
  return useQuery({ queryKey: qk.notificationsUnread, queryFn: getUnreadNotificationCount, enabled: status === "authenticated" })
}
