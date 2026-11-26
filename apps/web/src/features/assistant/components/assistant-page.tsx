"use client"

import { History, SquarePen } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ErrorState } from "@/components/shared/error-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage } from "@/lib/error-messages"
import { isSessionSuspended, refreshSession } from "@/lib/session"
import { useSessionStatus } from "@/lib/use-session-status"
import { updateAssistant, useAssistantState } from "../assistant-store"
import { useGuestClaim } from "../claim"
import { setGuestSession, useGuestSession } from "../guest-session"
import { ClaimEndedNotice, ClaimFailed } from "./claim-views"
import { Conversation, MessagesSkeleton } from "./conversation"
import { HistorySheet } from "./history-sheet"

const PATH = "/asisten"
const SESSION_PARAM = "percakapan"
/** Teks dari titik masuk (contoh di beranda, pencarian tanpa hasil) untuk kotak tulis. Tidak pernah dikirim otomatis (D268). */
const FILL_PARAM = "isi"
const MAX_LENGTH = 1000

// Tamu dan akun memakai percakapan yang terpisah, jadi keluar atau masuk selalu memasang komponen baru
// dan draf lama tidak tertinggal (H149). Sesi tamu yang tertinggal saat masuk diklaim dulu (D77, usulan D273).
export function AssistantPage() {
  const status = useSessionStatus()
  if (status === "unknown") return <AssistantSkeleton />
  if (status === "authenticated") return <AccountAssistant />
  // Penanda sesi masih ada: API sempat tidak terjangkau, bukan tamu (D231, pola AreaGate).
  if (isSessionSuspended()) {
    return (
      <>
        <Bar />
        <ErrorState message={getErrorMessage("SERVICE_UNAVAILABLE")} onRetry={() => void refreshSession().catch(() => undefined)} />
      </>
    )
  }
  return <GuestAssistant />
}

/**
 * Teks `?isi=` dari titik masuk, dibaca sekali lalu dibuang dari URL. Hanya dipakai komponen yang dirender
 * setelah status sesi diketahui (di klien), dan dibaca saat dipasang, karena percakapan akun mungkin baru
 * dipasang setelah klaim selesai.
 */
function usePrefill(): string {
  const params = useSearchParams()
  const [prefill] = useState(() => (params.get(FILL_PARAM) ?? "").trim().slice(0, MAX_LENGTH))
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has(FILL_PARAM)) return
    const url = new URL(window.location.href)
    url.searchParams.delete(FILL_PARAM)
    window.history.replaceState(null, "", url.pathname + url.search)
  }, [])
  return prefill
}

/** `draft`: teks yang dibawa dari percakapan yang sudah berakhir, atau dari titik masuk. */
type Fresh = { round: number; draft: string }

function GuestAssistant() {
  const prefill = usePrefill()
  const guest = useGuestSession()
  const [fresh, setFresh] = useState<Fresh>({ round: 0, draft: prefill })

  return (
    <>
      <Bar />
      <Conversation
        key={fresh.round}
        scope="guest"
        target={guest ? { sessionId: guest.sessionId, guestToken: guest.token } : null}
        initialDraft={fresh.draft}
        authReturn={PATH}
        onSessionStart={({ sessionId, guestToken }) => setGuestSession({ sessionId, token: guestToken! })}
        onReset={(draft) => {
          setGuestSession(null)
          setFresh(({ round }) => ({ round: round + 1, draft }))
        }}
      />
    </>
  )
}

function AccountAssistant() {
  const prefill = usePrefill()
  // D270: percakapan aktif di URL, supaya muat ulang dan tombol kembali membukanya lagi.
  const sessionId = useSearchParams().get(SESSION_PARAM)
  const { claimEnded } = useAssistantState()
  const [startedId, setStartedId] = useState<string | null>(null)
  const [fresh, setFresh] = useState<Fresh>({ round: 0, draft: prefill })
  const [historyOpen, setHistoryOpen] = useState(false)
  const claim = useGuestClaim((outcome) => {
    if (outcome.kind !== "gone" && window.location.pathname === PATH) {
      window.history.replaceState(null, "", `${PATH}?${SESSION_PARAM}=${outcome.sessionId}`)
    }
  })

  // Widget membuka percakapan yang terakhir dilihat di tab ini.
  useEffect(() => {
    if (!claim.pending) updateAssistant({ accountSessionId: sessionId })
  }, [sessionId, claim.pending])

  function reset(draft: string) {
    window.history.pushState(null, "", PATH)
    setStartedId(null)
    updateAssistant({ claimEnded: false })
    setFresh(({ round }) => ({ round: round + 1, draft }))
  }

  if (claim.pending) {
    return (
      <>
        <Bar />
        {claim.failure !== null ? <ClaimFailed error={claim.failure} onRetry={claim.retry} /> : <MessagesSkeleton />}
      </>
    )
  }

  return (
    <>
      <Bar>
        <Button variant="ghost" onClick={() => setHistoryOpen(true)}>
          <History aria-hidden />
          Riwayat
        </Button>
        {sessionId && (
          <Button variant="ghost" size="icon" aria-label="Percakapan baru" title="Percakapan baru" onClick={() => reset("")}>
            <SquarePen aria-hidden />
          </Button>
        )}
      </Bar>
      <Conversation
        // Sesi yang baru dibuat di sini tidak memasang ulang percakapannya.
        key={`${fresh.round}-${sessionId === startedId ? "baru" : (sessionId ?? "baru")}`}
        scope="account"
        target={sessionId ? { sessionId, guestToken: null } : null}
        initialDraft={fresh.draft}
        authReturn={PATH}
        notice={claimEnded && !sessionId ? <ClaimEndedNotice /> : undefined}
        onSessionStart={({ sessionId: id }) => {
          setStartedId(id)
          updateAssistant({ accountSessionId: id, claimEnded: false })
          // Jawaban pertama bisa datang setelah pengguna pindah halaman.
          if (window.location.pathname === PATH) window.history.replaceState(null, "", `${PATH}?${SESSION_PARAM}=${id}`)
        }}
        onReset={reset}
      />
      <HistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        activeId={sessionId}
        onSelect={(id) => {
          setHistoryOpen(false)
          if (id !== sessionId) window.history.pushState(null, "", `${PATH}?${SESSION_PARAM}=${id}`)
        }}
      />
    </>
  )
}

function Bar({ children }: { children?: React.ReactNode }) {
  return (
    <div className="border-b border-border">
      <div className="mx-auto flex min-h-15 max-w-2xl items-center justify-between gap-2 px-4 py-2 md:px-6">
        <h1 className="text-h3 font-semibold">
          Asisten <span translate="no">Jasana</span>
        </h1>
        {children && <div className="-mr-3 flex items-center gap-1">{children}</div>}
      </div>
    </div>
  )
}

// Sebentuk keadaan awal: judul, satu kalimat, contoh, lalu kotak tulis.
function AssistantSkeleton() {
  return (
    <>
      <Bar />
      <div aria-busy="true" aria-label="Memuat" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-4 md:px-6">
          <div className="flex flex-col gap-2 pt-2 md:pt-10">
            <Skeleton className="h-7.5 w-full max-w-80" />
            <Skeleton className="h-12 w-full max-w-lg" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-11 w-56" />
            <Skeleton className="h-11 w-60" />
            <Skeleton className="h-11 w-64" />
          </div>
        </div>
        <div className="border-t border-border pb-safe">
          <div className="mx-auto flex max-w-2xl flex-col gap-2 px-4 py-3 md:px-6">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
      </div>
    </>
  )
}
