"use client"

import { useSyncExternalStore } from "react"
import { getSessionStatus, subscribeSession, type SessionStatus } from "./session"

// Dipisah dari session.ts karena session.ts ikut terimpor Server Component publik lewat api-client.
// Di server selalu "unknown", jadi header merender kerangka sampai browser tahu status sesi.
export function useSessionStatus(): SessionStatus {
  return useSyncExternalStore(subscribeSession, getSessionStatus, () => "unknown")
}
