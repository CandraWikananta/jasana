"use client"

import { useEffect } from "react"
import { ErrorState } from "@/components/shared/error-state"
import { ForbiddenView } from "@/components/shared/forbidden-view"
import { Skeleton } from "@/components/ui/skeleton"
import { getCapabilities, type Area } from "@/features/auth/capabilities"
import { useMe } from "@/features/auth/queries"
import { ApiError } from "@/lib/api-client"
import { getErrorMessage } from "@/lib/error-messages"
import { isSessionSuspended, redirectToLogin, refreshSession } from "@/lib/session"
import { useSessionStatus } from "@/lib/use-session-status"

// Lapis kedua penjagaan rute (PRD Frontend 4.3): kapabilitas dari /auth/me, bukan isi JWT yang
// bisa basi 15 menit. proxy.ts hanya menyaring tamu, dan Express tetap penentu akhir.
export function AreaGate({ area, children }: { area: Area; children: React.ReactNode }) {
  const status = useSessionStatus()
  const { data: me, error, refetch, isPending } = useMe()

  // Refresh ditolak dan penanda sudah dihapus: sesi mati, ke /masuk. Kalau penanda masih ada,
  // API hanya sempat tidak terjangkau (D231), jadi pengguna diberi Coba lagi, bukan dikeluarkan.
  const suspended = status === "guest" && isSessionSuspended()
  useEffect(() => {
    if (status === "guest" && !isSessionSuspended()) redirectToLogin()
  }, [status])

  if (suspended) {
    const resume = () =>
      void refreshSession().then(
        (ok) => {
          if (!ok) redirectToLogin()
        },
        () => undefined,
      )
    return <ErrorState message={getErrorMessage("SERVICE_UNAVAILABLE")} onRetry={resume} />
  }
  if (status !== "authenticated" || (isPending && !error)) return <GateSkeleton />
  if (error || !me) {
    const code = error instanceof ApiError ? error.code : null
    return <ErrorState message={getErrorMessage(code)} onRetry={() => void refetch()} />
  }
  if (!getCapabilities(me).areas.includes(area)) return <ForbiddenView />
  return children
}

/**
 * Menu area hanya untuk yang berhak, supaya halaman 403 tidak memamerkan menu area lain. Selama
 * /auth/me belum datang menu tetap tampil, supaya sidebar tidak meloncat bagi yang berhak.
 */
export function useAreaNavVisible(area: Area): boolean {
  const { data: me } = useMe()
  return me === undefined || getCapabilities(me).areas.includes(area)
}

function GateSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6" aria-busy="true" aria-label="Memuat">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72 max-w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}
