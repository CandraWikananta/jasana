"use client"

import { ArrowUp, LoaderCircle } from "lucide-react"
import { useId } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

/** CHAT_MESSAGE_MAX_LENGTH di apps/api/src/config/constants.ts. */
const MAX_LENGTH = 1000
const COUNTER_FROM = 800

export function Composer({
  value,
  onChange,
  onSend,
  sending,
  inputRef,
}: {
  value: string
  onChange: (value: string) => void
  onSend: (content: string) => void
  sending: boolean
  inputRef: React.RefObject<HTMLTextAreaElement | null>
}) {
  const counterId = useId()
  const content = value.trim()
  const showCounter = value.length >= COUNTER_FROM

  function submit() {
    if (!content || sending) return
    onSend(content)
    // Tombol kirim jadi nonaktif setelah ditekan; fokus tetap di kotak tulis, dan keyboard HP tetap terbuka.
    inputRef.current?.focus()
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <div className="flex items-end gap-2">
        <Textarea
          ref={inputRef}
          name="content"
          rows={1}
          value={value}
          maxLength={MAX_LENGTH}
          autoComplete="off"
          enterKeyHint="send"
          aria-label="Pesan untuk Asisten"
          aria-describedby={showCounter ? counterId : undefined}
          placeholder="Contoh: AC bocor, servis besok…"
          // field-sizing: tumbuh mengikuti isi. Browser yang belum mendukung menampilkan satu baris yang bisa digulir.
          className="field-sizing-content max-h-40 min-h-11 resize-none overflow-y-auto overscroll-contain py-2.25"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            // Enter saat menyusun huruf (IME) bukan kirim.
            if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return
            event.preventDefault()
            submit()
          }}
        />
        <Button type="submit" size="icon" aria-label={sending ? "Mengirim…" : "Kirim"} aria-busy={sending || undefined} disabled={!content || sending}>
          {sending ? <LoaderCircle aria-hidden className="motion-safe:animate-spin" /> : <ArrowUp aria-hidden />}
        </Button>
      </div>
      {showCounter && (
        <p id={counterId} className="text-xs font-medium text-muted-foreground tabular-nums">
          {value.length} dari 1.000 karakter
        </p>
      )}
    </form>
  )
}
