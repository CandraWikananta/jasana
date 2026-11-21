"use client"

import { useEffect, useRef, useState } from "react"
import { Clock } from "lucide-react"
import { cn } from "cn"

// DS 6.2 dan 8: ikon Clock abu, angka --foreground, --destructive di bawah 5 menit.
// Format "23 jam 15 menit", lalu "04:59" di bawah satu jam. Di aplikasi asli sisa waktu dihitung
// dari timestamp server. Di peraga ini mulai dari detik contoh supaya hasil server dan client sama.
// Bagian 11: pembaca layar hanya diberi tahu di ambang 5 menit, 1 menit, dan habis.

function formatSisa(detik: number): string {
  if (detik >= 3600) {
    const jam = Math.floor(detik / 3600)
    const menit = Math.floor((detik % 3600) / 60)
    return menit === 0 ? `${jam} jam` : `${jam} jam ${menit} menit`
  }
  const mm = String(Math.floor(detik / 60)).padStart(2, "0")
  const ss = String(detik % 60).padStart(2, "0")
  return `${mm}:${ss}`
}

const AMBANG: Record<number, string> = { 300: "Sisa 5 menit", 60: "Sisa 1 menit" }

export function Countdown({
  seconds,
  label = "Sisa waktu",
  expiredText = "Waktu habis",
  running = true,
  onExpire,
}: {
  seconds: number
  label?: string
  expiredText?: string
  running?: boolean
  onExpire?: () => void
}) {
  const [left, setLeft] = useState(seconds)
  const expireRef = useRef(onExpire)

  useEffect(() => {
    expireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    if (!running || seconds <= 0) return
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [running, seconds])

  useEffect(() => {
    if (left === 0 && seconds > 0) expireRef.current?.()
  }, [left, seconds])

  const habis = left === 0
  // Isi wilayah aria-live hanya berubah di ambang, jadi detik biasa tidak diumumkan.
  const announce = habis && seconds > 0 ? expiredText : (AMBANG[left] ?? "")
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <Clock aria-hidden className="size-4 text-muted-foreground" />
      <span className="text-muted-foreground">{habis ? expiredText : label}</span>
      {!habis && (
        <span className={cn("font-semibold tabular-nums", left < 300 ? "text-destructive" : "text-foreground")}>
          {formatSisa(left)}
        </span>
      )}
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </span>
  )
}
