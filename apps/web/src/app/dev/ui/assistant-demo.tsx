"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Composer } from "@/features/assistant/components/composer"
import { ConversationNotice } from "@/features/assistant/components/conversation-notice"
import { MessageBubble } from "@/features/assistant/components/message-bubble"
import { RecommendationList } from "@/features/assistant/components/recommendation-list"
import { TypingIndicator } from "@/features/assistant/components/typing-indicator"
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
