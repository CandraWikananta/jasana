"use client"

import { Maximize2, MessagesSquare, X } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Composer } from "@/features/assistant/components/composer"
import { ConversationNotice } from "@/features/assistant/components/conversation-notice"
import { MessageBubble } from "@/features/assistant/components/message-bubble"
import { RecommendationList } from "@/features/assistant/components/recommendation-list"
import { TypingIndicator } from "@/features/assistant/components/typing-indicator"
import { Welcome } from "@/features/assistant/components/welcome"
import { getErrorMessage } from "@/lib/error-messages"
import { COMPACT_LISTINGS } from "../ds/data"

export function AssistantDemo() {
  const [draft, setDraft] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)
  return (
    <div className="flex max-w-2xl flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <MessageBubble own>AC di kamar bocor, butuh servis besok</MessageBubble>
      <MessageBubble own={false}>Ini 2 pilihan jasa yang bisa melayani lokasimu.</MessageBubble>
      <RecommendationList ids={COMPACT_LISTINGS.map((l) => l.id)} cards={COMPACT_LISTINGS} autoLoad />
      <TypingIndicator />
      <ConversationNotice message={getErrorMessage("GEMINI_UNAVAILABLE")}>
        <Button variant="outline">Kirim lagi</Button>
      </ConversationNotice>
      <Composer value={draft} onChange={setDraft} onSend={() => setDraft("")} sending={false} inputRef={inputRef} />
    </div>
  )
}

/** Bentuk tombol dan panel widget tanpa posisi fixed dan tanpa sesi (komponen aslinya memakai store dan API). */
export function AssistantWidgetDemo() {
  const [draft, setDraft] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)
  return (
    <div className="flex flex-wrap items-end gap-6">
      <Button variant="outline" className="shadow-lg">
        <MessagesSquare aria-hidden />
        Tanya Asisten
      </Button>
      <div className="flex h-120 w-100 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        <div className="flex min-h-15 shrink-0 items-center justify-between gap-2 border-b border-border py-2 pr-2 pl-4">
          <p className="text-h3 font-semibold">Asisten Jasana</p>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" aria-label="Buka di halaman penuh">
              <Maximize2 aria-hidden />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Tutup">
              <X aria-hidden />
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <Welcome onPick={setDraft} compact />
        </div>
        <div className="flex flex-col gap-2 border-t border-border px-4 py-3">
          <Composer value={draft} onChange={setDraft} onSend={() => setDraft("")} sending={false} inputRef={inputRef} />
          <p className="text-xs font-medium text-muted-foreground">Jawaban dibuat AI. Cek detail jasa sebelum memesan.</p>
        </div>
      </div>
    </div>
  )
}
