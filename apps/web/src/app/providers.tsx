"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { RealtimeIndicator } from "@/components/layout/realtime-indicator"
import { Toaster } from "@/components/ui/sonner"
import { shouldRetry } from "@/lib/api-client"
import { qk } from "@/lib/query-keys"
import { bootstrapSession, getSessionStatus, listenForLogout, subscribeSession } from "@/lib/session"
import { startRealtime } from "@/lib/socket"
import { createRealtimeHandlers } from "@/lib/socket-events"

// Satu QueryClient per tab. useState, bukan konstanta modul, supaya render server tidak berbagi cache antar request.
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: shouldRetry } },
      }),
  )

  // Sesi dipulihkan sekali per tab dari cookie (D212). Saat sesi berakhir, data akun dibuang
  // dari cache supaya tidak tampil ke orang berikutnya di perangkat yang sama.
  useEffect(() => {
    void bootstrapSession()
    const stopListening = listenForLogout()
    const unsubscribe = subscribeSession(() => {
      if (getSessionStatus() === "guest") client.removeQueries({ queryKey: qk.me })
    })
    return () => {
      stopListening()
      unsubscribe()
    }
  }, [client])

  // Satu koneksi Socket.IO per tab (D217). Event hanya memicu invalidasi.
  useEffect(() => startRealtime(createRealtimeHandlers(client)), [client])

  return (
    <QueryClientProvider client={client}>
      {children}
      <RealtimeIndicator />
      <Toaster />
    </QueryClientProvider>
  )
}
