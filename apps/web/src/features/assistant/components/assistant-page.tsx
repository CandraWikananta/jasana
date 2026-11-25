"use client"

import { History, SquarePen } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { ErrorState } from "@/components/shared/error-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage } from "@/lib/error-messages"
import { isSessionSuspended, refreshSession } from "@/lib/session"
import { useSessionStatus } from "@/lib/use-session-status"
import { setGuestSession, useGuestSession } from "../guest-session"
import { Conversation } from "./conversation"
import { HistorySheet } from "./history-sheet"

const PATH = "/asisten"
const SESSION_PARAM = "percakapan"

// Tamu dan akun memakai percakapan yang terpisah, jadi keluar atau masuk selalu memasang komponen baru
// dan draf lama tidak tertinggal (H149). Klaim sesi tamu ke akun dikerjakan di W8b.
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

/** `draft`: teks yang dibawa dari percakapan yang sudah berakhir. */
type Fresh = { round: number; draft: string }

function GuestAssistant() {
  const guest = useGuestSession()
  const [fresh, setFresh] = useState<Fresh>({ round: 0, draft: "" })

  return (
    <>
      <Bar />
      <Conversation
        key={fresh.round}
        scope="guest"
        target={guest ? { sessionId: guest.sessionId, guestToken: guest.token } : null}
        initialDraft={fresh.draft}
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
  // D270: percakapan aktif di URL, supaya muat ulang dan tombol kembali membukanya lagi.
  const sessionId = useSearchParams().get(SESSION_PARAM)
  const [startedId, setStartedId] = useState<string | null>(null)
  const [fresh, setFresh] = useState<Fresh>({ round: 0, draft: "" })
  const [historyOpen, setHistoryOpen] = useState(false)

  function reset(draft: string) {
    window.history.pushState(null, "", PATH)
    setStartedId(null)
    setFresh(({ round }) => ({ round: round + 1, draft }))
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
        onSessionStart={({ sessionId: id }) => {
          setStartedId(id)
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
