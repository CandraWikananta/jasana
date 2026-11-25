"use client"

import { ArrowDown, CircleAlert, LocateFixed, RotateCw } from "lucide-react"
import Link from "next/link"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/error-messages"
import { loginHref } from "@/lib/safe-next"
import type { ChatScope } from "../api"
import { answerScrollTop, isFailedReply, needsLocation, type ConversationMessage } from "../conversation"
import { ConversationNotice } from "./conversation-notice"
import { MessageBubble } from "./message-bubble"
import { RecommendationList } from "./recommendation-list"
import { TypingIndicator } from "./typing-indicator"

/** Masih dianggap di bawah kalau sisa gulirnya sekecil ini. */
const NEAR_BOTTOM = 80
/** Sama dengan py-4 daftar pesan. */
const PADDING = 16

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

export interface MessageActions {
  scope: ChatScope
  hasPoint: boolean
  locating: boolean
  onRetry: (content: string, replaceIds: string[]) => void
  /** Mengambil lokasi kalau belum ada, lalu mengirim pesan yang sama. */
  onSendWithLocation: (content: string) => void
  /** Mengembalikan pesan yang ditolak ke kotak tulis. */
  onEdit: (message: ConversationMessage) => void
  /** Memuat ulang riwayat dari server. */
  onReload: () => void
  reloading: boolean
}

export function MessageList({ messages, ...actions }: { messages: ConversationMessage[] } & MessageActions) {
  const areaRef = useRef<HTMLDivElement>(null)
  const lastRef = useRef<HTMLLIElement>(null)
  // Pesan terakhir yang sudah digulirkan. Next menyimpan halaman lama tersembunyi dan menjalankan ulang
  // efeknya saat dibuka lagi; di situ posisi baca dikembalikan, bukan digulirkan ulang.
  const handledRef = useRef<string | null>(null)
  const savedTopRef = useRef(0)
  const awayRef = useRef(false)
  const [away, setAway] = useState(false)
  const [reachedId, setReachedId] = useState<string | null>(null)

  const last = messages[messages.length - 1]!
  const lastAnswerId = messages.findLast((m) => m.recommended_listing_ids.length > 0)?.id
  const sending = last.state === "sending"

  const lastTop = () => {
    const area = areaRef.current!
    const answer = lastRef.current!
    return answerScrollTop(
      { height: area.clientHeight, padding: PADDING },
      { top: answer.offsetTop, height: answer.offsetHeight },
    )
  }

  function scrollTo(top: number, behavior: ScrollBehavior) {
    const area = areaRef.current!
    const max = area.scrollHeight - area.clientHeight
    const target = Math.min(top, max)
    awayRef.current = max - target > NEAR_BOTTOM
    savedTopRef.current = target
    area.scrollTo({ top: target, behavior: prefersReducedMotion() ? "instant" : behavior })
  }

  useLayoutEffect(() => {
    const key = last.id + (last.state ?? "")
    if (handledRef.current === key) {
      areaRef.current!.scrollTop = savedTopRef.current
      return
    }
    const first = handledRef.current === null
    handledRef.current = key
    if (last.role === "USER") scrollTo(areaRef.current!.scrollHeight, "instant")
    else if (first) scrollTo(lastTop(), "instant")
    // Pengguna sedang membaca di atas: jangan ditarik, tombol "Jawaban baru" yang memberi tahu.
    else if (!awayRef.current) scrollTo(lastTop(), "smooth")
  }, [last])

  // Keyboard HP dan kotak tulis yang tumbuh mengecilkan daftar; yang sedang di bawah tetap di bawah.
  useEffect(() => {
    const area = areaRef.current!
    const observer = new ResizeObserver(() => {
      if (!awayRef.current) area.scrollTop = area.scrollHeight
    })
    observer.observe(area)
    return () => observer.disconnect()
  }, [])

  function handleScroll() {
    const area = areaRef.current!
    savedTopRef.current = area.scrollTop
    awayRef.current = area.scrollHeight - area.clientHeight - area.scrollTop > NEAR_BOTTOM
    setAway(awayRef.current)
    if (lastRef.current && lastRef.current.offsetTop < area.scrollTop + area.clientHeight - PADDING) setReachedId(last.id)
  }

  const showNewAnswer = away && last.live === true && reachedId !== last.id

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={areaRef}
        role="region"
        aria-labelledby="judul-percakapan"
        tabIndex={0}
        onScroll={handleScroll}
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <h2 id="judul-percakapan" className="sr-only">
          Percakapan
        </h2>
        <ol className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4 md:px-6">
          {messages.map((message, i) => (
            <li key={message.id} ref={message === last ? lastRef : undefined} className="flex flex-col gap-3">
              <MessageItem
                message={message}
                previous={messages[i - 1]}
                isLast={message === last}
                autoLoad={message.id === lastAnswerId}
                {...actions}
              />
            </li>
          ))}
          {sending && (
            <li className="flex flex-col">
              <TypingIndicator />
            </li>
          )}
        </ol>
      </div>
      {showNewAnswer && (
        <Button
          variant="outline"
          className="absolute bottom-3 left-1/2 -translate-x-1/2"
          onClick={() => {
            scrollTo(lastTop(), "smooth")
            setReachedId(last.id)
          }}
        >
          <ArrowDown aria-hidden />
          Jawaban baru
        </Button>
      )}
    </div>
  )
}

function MessageItem({
  message,
  previous,
  isLast,
  autoLoad,
  scope,
  hasPoint,
  locating,
  onRetry,
  onSendWithLocation,
  onEdit,
  onReload,
  reloading,
}: {
  message: ConversationMessage
  previous: ConversationMessage | undefined
  isLast: boolean
  autoLoad: boolean
} & MessageActions) {
  if (message.role === "USER") {
    const kind = message.failure?.kind
    return (
      <>
        <MessageBubble own>{message.content}</MessageBubble>
        {kind === "resting" && (
          <ConversationNotice message={message.failure!.message}>
            <SearchLink />
            <Button asChild variant="ghost">
              <Link href={loginHref("/asisten")}>Masuk</Link>
            </Button>
          </ConversationNotice>
        )}
        {(kind === "retry" || kind === "invalid") && (
          <div role="alert" className="-mt-1 ml-8 flex max-w-lg flex-col items-end gap-1 self-end">
            <p className="flex gap-1.5 text-sm font-medium text-destructive">
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              {message.failure!.message}
            </p>
            {kind === "retry" ? (
              <Button variant="ghost" onClick={() => onRetry(message.content, [message.id])}>
                <RotateCw aria-hidden />
                Kirim lagi
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => onEdit(message)}>
                Ubah pesan
              </Button>
            )}
          </div>
        )}
        {/* Halaman dimuat ulang selagi menunggu: pesannya tercatat, jawabannya mungkin baru menyusul di server. */}
        {isLast && !message.state && (
          <div className="-mt-1 flex flex-wrap items-center justify-end gap-x-2 self-end">
            <p className="text-sm text-muted-foreground">Belum ada jawaban.</p>
            <Button variant="ghost" loading={reloading} onClick={onReload}>
              {reloading ? "Memuat…" : "Muat jawaban"}
            </Button>
            <Button variant="ghost" onClick={() => onRetry(message.content, [message.id])}>
              Kirim lagi
            </Button>
          </div>
        )}
      </>
    )
  }

  const question = previous?.role === "USER" ? previous : undefined

  if (isLast && isFailedReply(message)) {
    return (
      <ConversationNotice message={getErrorMessage("GEMINI_UNAVAILABLE")}>
        {question && (
          <Button variant="outline" onClick={() => onRetry(question.content, [question.id, message.id])}>
            <RotateCw aria-hidden />
            Kirim lagi
          </Button>
        )}
        <SearchLink variant={question ? "ghost" : "outline"} />
      </ConversationNotice>
    )
  }

  return (
    <>
      <MessageBubble own={false}>{message.content}</MessageBubble>
      {message.recommended_listing_ids.length > 0 && (
        <RecommendationList ids={message.recommended_listing_ids} cards={message.recommendations} autoLoad={autoLoad} />
      )}
      {isLast && question && needsLocation(message) && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" loading={locating} onClick={() => onSendWithLocation(question.content)}>
            {!locating && <LocateFixed aria-hidden />}
            {locating ? "Membaca lokasi…" : hasPoint ? "Kirim lagi dengan lokasiku" : "Pakai lokasiku dan kirim lagi"}
          </Button>
          {scope === "account" && (
            <Button asChild variant="outline">
              <Link href="/akun/alamat">Atur alamat</Link>
            </Button>
          )}
        </div>
      )}
    </>
  )
}

function SearchLink({ variant = "outline" }: { variant?: "outline" | "ghost" }) {
  return (
    <Button asChild variant={variant}>
      <Link href="/cari">Cari jasa</Link>
    </Button>
  )
}
