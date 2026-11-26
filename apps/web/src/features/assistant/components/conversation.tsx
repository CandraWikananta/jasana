"use client"

import { LocateFixed, MapPin, MessageCircleOff } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage } from "@/lib/error-messages"
import { getCurrentPoint, type Point } from "@/lib/geo"
import { loginHref } from "@/lib/safe-next"
import { cn } from "@/lib/utils"
import type { ChatScope, ChatTarget } from "../api"
import { getAssistantState, updateAssistant } from "../assistant-store"
import { resolveChatFailure } from "../chat-failure"
import { isFailedReply, type ConversationMessage } from "../conversation"
import { useConversation } from "../queries"
import { Composer } from "./composer"
import { ConversationNotice } from "./conversation-notice"
import { MessageList } from "./message-list"
import { Welcome } from "./welcome"

/** Sisa kuota tamu baru disebut saat tinggal sedikit. Batasnya sendiri dari server (guest_quota). */
const SHOW_QUOTA_BELOW = 5

type Locating = "idle" | "locating" | "failed"

interface ConversationProps {
  scope: ChatScope
  /** null: percakapan baru. */
  target: ChatTarget | null
  onSessionStart: (started: ChatTarget) => void
  /** Mulai percakapan baru, membawa teks yang belum terkirim. */
  onReset: (draft: string) => void
  initialDraft?: string
  /** `panel`: widget selebar 400 px, jadi jarak tepi tidak ikut melebar di md (usulan D271). */
  variant?: "page" | "panel"
  /** Tujuan kembali setelah Daftar atau Masuk: /asisten di halaman, halaman yang sedang dibuka di widget. */
  authReturn: string
  /** Dipanggil saat Daftar atau Masuk ditekan, supaya percakapan dilanjutkan setelah klaim (usulan D273). */
  onAuthLeave?: () => void
  onDraftChange?: (draft: string) => void
  /** Pemberitahuan di atas keadaan awal, misalnya klaim yang tidak mungkin lagi. */
  notice?: React.ReactNode
}

// Isi percakapan tanpa kerangka halaman: mengisi tinggi induknya (flex), jadi bisa dipakai halaman /asisten
// dan panel widget. Induk memberi `key` baru untuk percakapan lain, sehingga draf dan lokasi ikut kosong.
export function Conversation({
  scope,
  target,
  onSessionStart,
  onReset,
  initialDraft = "",
  variant = "page",
  authReturn,
  onAuthLeave,
  onDraftChange,
  notice,
}: ConversationProps) {
  const { history, messages, send, discard } = useConversation({ scope, target, onSessionStart })
  // Serahan dari bagian lain (panel ke halaman penuh, pertanyaan yang tertahan batas tamu) hanya dipakai sekali.
  const [draft, setDraft] = useState(() => initialDraft || getAssistantState().handoffDraft)
  useEffect(() => {
    if (getAssistantState().handoffDraft) updateAssistant({ handoffDraft: "" })
  }, [])
  const draftListener = useRef(onDraftChange)
  useEffect(() => {
    draftListener.current = onDraftChange
  })
  useEffect(() => {
    draftListener.current?.(draft)
  }, [draft])
  const gutter = variant === "panel" ? "px-4" : "px-4 md:px-6"
  // H66: lokasi hanya di memori, selama percakapan ini.
  const [point, setPoint] = useState<Point | null>(null)
  const [locating, setLocating] = useState<Locating>("idle")
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const noticeRef = useRef<HTMLDivElement>(null)

  const last = messages.at(-1)
  const sending = last?.state === "sending"
  const quota = scope === "guest" ? messages.findLast((m) => m.quota)?.quota : undefined
  const blocked =
    last?.failure?.kind === "ended" || last?.failure?.kind === "limit"
      ? last.failure.kind
      : quota?.remaining === 0
        ? "limit"
        : null

  // Kotak tulis hilang, jadi fokus pindah ke pemberitahuannya (DS 10).
  useEffect(() => {
    if (blocked) noticeRef.current?.focus({ preventScroll: true })
  }, [blocked])

  function submit(content: string) {
    send({ content, point })
    setDraft("")
  }

  function fill(text: string) {
    setDraft(text)
    inputRef.current?.focus()
  }

  async function locate(): Promise<Point | null> {
    setLocating("locating")
    try {
      const found = await getCurrentPoint()
      setPoint(found)
      setLocating("idle")
      return found
    } catch {
      setLocating("failed")
      return null
    }
  }

  async function sendWithLocation(content: string) {
    const found = point ?? (await locate())
    if (found) send({ content, point: found })
  }

  function edit(message: ConversationMessage) {
    discard(message.id)
    fill(message.content)
  }

  if (history.isError) {
    const failure = resolveChatFailure(history.error, scope)
    // 422: id di URL bukan UUID, sama artinya dengan tidak ada.
    const gone = failure.kind === "ended" || failure.kind === "invalid"
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        {gone ? (
          <EmptyState
            icon={MessageCircleOff}
            title={scope === "account" ? "Percakapan tidak ditemukan" : "Percakapan sudah berakhir"}
            description={
              scope === "account" ? "Buka percakapan lain di Riwayat, atau mulai yang baru." : "Mulai percakapan baru untuk melanjutkan."
            }
            action={<Button onClick={() => onReset(draft)}>Mulai percakapan baru</Button>}
          />
        ) : (
          <ErrorState message={failure.message} onRetry={() => void history.refetch()} />
        )}
      </div>
    )
  }

  const locationFailed = locating === "failed" && (
    <p className="text-sm text-muted-foreground">
      Lokasimu belum terbaca. Izinkan akses lokasi lalu coba lagi. Kamu tetap bisa bertanya tanpa lokasi.
    </p>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {target && history.isPending ? (
        <MessagesSkeleton compact={variant === "panel"} />
      ) : messages.length === 0 ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className={cn("mx-auto flex max-w-2xl flex-col gap-4 py-4", gutter)}>
            {notice}
            <Welcome onPick={fill} compact={variant === "panel"} />
          </div>
        </div>
      ) : (
        <MessageList
          messages={messages}
          scope={scope}
          compact={variant === "panel"}
          authReturn={authReturn}
          onAuthLeave={onAuthLeave}
          hasPoint={point !== null}
          locating={locating === "locating"}
          onRetry={(content, replaceIds) => send({ content, point, replaceIds })}
          onSendWithLocation={(content) => void sendWithLocation(content)}
          onEdit={edit}
          onReload={() => void history.refetch()}
          reloading={history.isRefetching}
        />
      )}

      <p role="status" className="sr-only">
        {announcement(last)}
      </p>

      <div className="border-t border-border bg-card pb-safe">
        <div className={cn("mx-auto flex max-w-2xl flex-col gap-2 py-3", gutter)}>
          {blocked === "limit" ? (
            <ConversationNotice message={getErrorMessage("GUEST_CHAT_LIMIT_REACHED")} ref={noticeRef}>
              <Button asChild>
                <Link href={`/daftar?next=${encodeURIComponent(authReturn)}`} onClick={onAuthLeave}>
                  Daftar
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={loginHref(authReturn)} onClick={onAuthLeave}>
                  Masuk
                </Link>
              </Button>
            </ConversationNotice>
          ) : blocked === "ended" ? (
            <ConversationNotice message={last!.failure!.message} ref={noticeRef}>
              <Button onClick={() => onReset(last!.content)}>Mulai percakapan baru</Button>
            </ConversationNotice>
          ) : (
            <>
              {scope === "guest" ? (
                <div className="flex flex-col gap-1">
                  <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-3">
                    {point ? (
                      <div className="flex flex-wrap items-center gap-x-1">
                        <span className="flex items-center gap-1.5 text-sm">
                          <MapPin aria-hidden className="size-4 text-brand-strong" />
                          Memakai lokasimu
                        </span>
                        <Button variant="ghost" onClick={() => setPoint(null)}>
                          Hapus lokasi
                        </Button>
                      </div>
                    ) : (
                      // -ml-5 meluruskan ikon dengan tepi kotak tulis (padding px-5 tombol ghost).
                      <Button variant="ghost" className="-ml-5" loading={locating === "locating"} onClick={() => void locate()}>
                        {locating !== "locating" && <LocateFixed aria-hidden />}
                        {locating === "locating" ? "Membaca lokasi…" : "Pakai lokasiku"}
                      </Button>
                    )}
                    {quota && quota.remaining <= SHOW_QUOTA_BELOW && (
                      <p className="text-sm text-muted-foreground tabular-nums">Sisa {quota.remaining} pesan</p>
                    )}
                  </div>
                  <div role="status">{locationFailed}</div>
                </div>
              ) : (
                <div role="status">{locationFailed}</div>
              )}
              <Composer value={draft} onChange={setDraft} onSend={submit} sending={sending} inputRef={inputRef} />
            </>
          )}
          <p className="text-xs font-medium text-muted-foreground">Jawaban dibuat AI. Cek detail jasa sebelum memesan.</p>
        </div>
      </div>
    </div>
  )
}

/** Yang dibacakan pembaca layar: hanya jawaban yang baru tiba. Pemberitahuan galat punya perannya sendiri. */
function announcement(last: ConversationMessage | undefined): string {
  if (last?.state === "sending") return "Asisten sedang menulis…"
  if (!last?.live || isFailedReply(last)) return ""
  const count = last.recommended_listing_ids.length
  return `Asisten: ${last.content}${count > 0 ? ` ${count} jasa ditampilkan.` : ""}`
}

export function MessagesSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="min-h-0 flex-1 overflow-hidden" aria-busy="true" aria-label="Memuat percakapan">
      <div className={cn("mx-auto flex max-w-2xl flex-col gap-4 py-4", compact ? "px-4" : "px-4 md:px-6")}>
        <Skeleton className="h-11 w-48 self-end rounded-lg" />
        <Skeleton className="h-17 w-3/4 max-w-lg rounded-lg" />
        <Skeleton className="h-11 w-32 self-end rounded-lg" />
        <Skeleton className="h-17 w-2/3 max-w-lg rounded-lg" />
      </div>
    </div>
  )
}
