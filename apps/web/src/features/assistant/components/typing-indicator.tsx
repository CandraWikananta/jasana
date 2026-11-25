"use client"

import { useEffect, useState } from "react"

/** Jawaban biasanya 2 sampai 5 detik; lewat dari ini pengguna perlu tahu bahwa permintaannya masih berjalan. */
const SLOW_AFTER_MS = 4000

// Usulan D268: hanya opacity yang beranimasi, dan diam kalau pengguna meminta gerak dikurangi (DS 12).
// Pengumuman untuk pembaca layar ada di status Conversation.
export function TypingIndicator() {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div aria-hidden className="flex min-h-11 items-center gap-3 self-start rounded-lg bg-muted px-4 py-2.5">
      <span className="flex gap-1">
        <span className="size-1.5 rounded-full bg-muted-foreground motion-safe:animate-pulse" />
        <span className="size-1.5 rounded-full bg-muted-foreground delay-300 motion-safe:animate-pulse" />
        <span className="size-1.5 rounded-full bg-muted-foreground delay-500 motion-safe:animate-pulse" />
      </span>
      {slow && <span className="text-sm text-muted-foreground">Masih memproses…</span>}
    </div>
  )
}
