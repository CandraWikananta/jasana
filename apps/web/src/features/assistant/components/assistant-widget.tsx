"use client"

import { Maximize2, MessagesSquare, SquarePen, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
import { assistantWidgetAt } from "@/components/layout/nav-items"
import { ErrorState } from "@/components/shared/error-state"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/error-messages"
import { isSessionSuspended, refreshSession } from "@/lib/session"
import { useSessionStatus } from "@/lib/use-session-status"
import { cn } from "@/lib/utils"
import { getAssistantState, updateAssistant, useAssistantState } from "../assistant-store"
import { useGuestClaim } from "../claim"
import { markGuestResume, setGuestSession, useGuestSession } from "../guest-session"
import { ClaimEndedNotice, ClaimFailed } from "./claim-views"
import { Conversation, MessagesSkeleton } from "./conversation"

// AssistantWidget (PRD Frontend 5.15, DS 6.2, usulan D271). Di HP tombolnya tautan ke /asisten: panel layar
// penuh akan sama persis dengan halaman itu, tanpa penanganan keyboard HP-nya (D267). Mulai md tombolnya
// membuka panel non-modal di kanan bawah, supaya halaman di belakangnya tetap bisa dipakai, misalnya
// membuka jasa yang direkomendasikan sambil tetap melihat percakapannya.
//
// Jarak bawah, toast, dan scroll-padding diatur di globals.css lewat data-assistant-launcher dan
// data-assistant-panel (usulan D272), tanpa JS dan tanpa geseran tata letak.

const PANEL_ID = "panel-asisten"
const TITLE_ID = "judul-panel-asisten"
const DESKTOP = "(min-width: 48rem)"

/** `spacer`: ruang di akhir halaman supaya isi terakhir bisa digulir ke atas tombol (layout pelanggan). */
export function AssistantWidget({ spacer = false }: { spacer?: boolean }) {
  // usePathname di rute dinamis butuh batas Suspense (Cache Components). Tombolnya fixed, jadi muncul
  // belakangan pun tidak menggeser apa pun.
  return (
    <Suspense fallback={null}>
      <Widget spacer={spacer} />
    </Suspense>
  )
}

function Widget({ spacer }: { spacer: boolean }) {
  const placement = assistantWidgetAt(usePathname())
  const { panelOpen, accountSessionId } = useAssistantState()
  const status = useSessionStatus()
  const launcherRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  // Fokus hanya dipindah saat panel dibuka pengguna (atau oleh klaim yang ia minta), bukan setiap pindah
  // halaman dengan panel yang masih terbuka.
  const [focusRequest, setFocusRequest] = useState(0)
  // Isi panel dipasang saat pertama dibuka lalu dibiarkan, supaya draf dan posisi gulir bertahan.
  const [everOpen, setEverOpen] = useState(panelOpen)
  if (panelOpen && !everOpen) setEverOpen(true)

  // Klaim berjalan walau panel tertutup: tamu yang kembali dari /daftar atau /masuk ke halaman ini.
  const claim = useGuestClaim((outcome) => {
    if (outcome.resume && window.matchMedia(DESKTOP).matches) open()
  })

  useEffect(() => {
    if (focusRequest === 0) return
    const panel = panelRef.current
    ;(panel?.querySelector<HTMLElement>("textarea") ?? panel)?.focus()
  }, [focusRequest])

  function open() {
    updateAssistant({ panelOpen: true })
    setFocusRequest((n) => n + 1)
  }

  function close() {
    updateAssistant({ panelOpen: false })
    requestAnimationFrame(() => launcherRef.current?.focus())
  }

  if (!placement) return null
  const fullPage = status === "authenticated" && accountSessionId ? `/asisten?percakapan=${accountSessionId}` : "/asisten"
  const onlyLg = placement === "lg"

  return (
    <>
      {spacer && <div aria-hidden className={cn("h-18", onlyLg && "hidden lg:block")} />}

      {/* Panel terbuka: tombolnya digantikan panel di sudut yang sama (md ke atas). */}
      <div
        data-assistant-launcher={placement}
        className={cn("assistant-fab z-30", onlyLg ? (panelOpen ? "hidden" : "hidden lg:block") : panelOpen && "md:hidden")}
      >
        <Button asChild variant="outline" className="shadow-lg md:hidden">
          <Link href={fullPage}>
            <MessagesSquare aria-hidden />
            Tanya Asisten
          </Link>
        </Button>
        <Button
          ref={launcherRef}
          variant="outline"
          className="hidden shadow-lg md:inline-flex"
          aria-haspopup="dialog"
          aria-expanded={panelOpen}
          aria-controls={PANEL_ID}
          onClick={open}
        >
          <MessagesSquare aria-hidden />
          Tanya Asisten
        </Button>
      </div>

      {everOpen && (
        <section
          ref={panelRef}
          id={PANEL_ID}
          role="dialog"
          aria-modal="false"
          aria-labelledby={TITLE_ID}
          tabIndex={-1}
          hidden={!panelOpen}
          data-assistant-panel
          onKeyDown={(event) => {
            if (event.key === "Escape" && !event.defaultPrevented) close()
          }}
          className={cn(
            "assistant-panel z-40 hidden origin-bottom-right flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex",
            "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-200 motion-safe:ease-out",
            onlyLg && "md:hidden lg:flex",
          )}
        >
          <Suspense fallback={<MessagesSkeleton compact />}>
            <PanelBody fullPage={fullPage} claim={claim} onClose={close} />
          </Suspense>
        </section>
      )}
    </>
  )
}

type Claim = ReturnType<typeof useGuestClaim>

function PanelBody({ fullPage, claim, onClose }: { fullPage: string; claim: Claim; onClose: () => void }) {
  const status = useSessionStatus()
  const pathname = usePathname()
  const query = useSearchParams().toString()
  // Daftar dan Masuk kembali ke halaman ini, lalu panelnya dibuka lagi setelah klaim (usulan D273).
  const authReturn = query ? `${pathname}?${query}` : pathname
  const draft = useRef("")
  const [round, setRound] = useState(0)
  const { accountSessionId } = useAssistantState()
  const account = status === "authenticated" && !claim.pending

  return (
    <>
      <div className="flex min-h-15 shrink-0 items-center justify-between gap-2 border-b border-border py-2 pr-2 pl-4">
        <h2 id={TITLE_ID} className="text-h3 font-semibold">
          Asisten <span translate="no">Jasana</span>
        </h2>
        <div className="flex items-center">
          {account && accountSessionId && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Percakapan baru"
              title="Percakapan baru"
              onClick={() => {
                updateAssistant({ accountSessionId: null, claimEnded: false })
                setRound((n) => n + 1)
              }}
            >
              <SquarePen aria-hidden />
            </Button>
          )}
          <Button asChild variant="ghost" size="icon">
            <Link
              href={fullPage}
              aria-label="Buka di halaman penuh"
              title="Buka di halaman penuh"
              // Draf ikut pindah; panelnya ditutup, karena halaman penuh tidak punya widget.
              onClick={() => updateAssistant({ handoffDraft: draft.current, panelOpen: false })}
            >
              <Maximize2 aria-hidden />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Tutup" title="Tutup" onClick={onClose}>
            <X aria-hidden />
          </Button>
        </div>
      </div>

      {status === "unknown" ? (
        <MessagesSkeleton compact />
      ) : status === "authenticated" ? (
        claim.pending ? (
          claim.failure !== null ? (
            <ClaimFailed error={claim.failure} onRetry={claim.retry} />
          ) : (
            <MessagesSkeleton compact />
          )
        ) : (
          <AccountThread
            round={round}
            authReturn={authReturn}
            onDraftChange={(text) => (draft.current = text)}
            onNew={() => setRound((n) => n + 1)}
          />
        )
      ) : isSessionSuspended() ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ErrorState message={getErrorMessage("SERVICE_UNAVAILABLE")} onRetry={() => void refreshSession().catch(() => undefined)} />
        </div>
      ) : (
        <GuestThread authReturn={authReturn} onDraftChange={(text) => (draft.current = text)} />
      )}
    </>
  )
}

interface ThreadProps {
  authReturn: string
  onDraftChange: (draft: string) => void
}

function GuestThread({ authReturn, onDraftChange }: ThreadProps) {
  const guest = useGuestSession()
  const [round, setRound] = useState(0)
  return (
    <Conversation
      key={round}
      scope="guest"
      variant="panel"
      target={guest ? { sessionId: guest.sessionId, guestToken: guest.token } : null}
      authReturn={authReturn}
      onAuthLeave={markGuestResume}
      onDraftChange={onDraftChange}
      onSessionStart={({ sessionId, guestToken }) => setGuestSession({ sessionId, token: guestToken! })}
      onReset={(draft) => {
        setGuestSession(null)
        updateAssistant({ handoffDraft: draft })
        setRound((n) => n + 1)
      }}
    />
  )
}

function AccountThread({ round, authReturn, onDraftChange, onNew }: ThreadProps & { round: number; onNew: () => void }) {
  const { accountSessionId, claimEnded } = useAssistantState()
  const [startedId, setStartedId] = useState<string | null>(null)
  return (
    <Conversation
      // Sesi yang baru dibuat di panel tidak memasang ulang percakapannya (pola halaman /asisten).
      key={`${round}-${accountSessionId === startedId ? "baru" : (accountSessionId ?? "baru")}`}
      scope="account"
      variant="panel"
      target={accountSessionId ? { sessionId: accountSessionId, guestToken: null } : null}
      authReturn={authReturn}
      notice={claimEnded && !accountSessionId ? <ClaimEndedNotice /> : undefined}
      onDraftChange={onDraftChange}
      onSessionStart={({ sessionId }) => {
        setStartedId(sessionId)
        updateAssistant({ accountSessionId: sessionId, claimEnded: false })
      }}
      onReset={(draft) => {
        updateAssistant({ accountSessionId: null, claimEnded: false, handoffDraft: draft || getAssistantState().handoffDraft })
        onNew()
      }}
    />
  )
}
