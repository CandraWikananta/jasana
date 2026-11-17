"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { shouldRetry } from "@/lib/api-client"

// Satu QueryClient per tab. useState, bukan konstanta modul, supaya render server tidak berbagi cache antar request.
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: shouldRetry } },
      }),
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
