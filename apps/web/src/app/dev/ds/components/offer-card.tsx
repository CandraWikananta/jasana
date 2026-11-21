"use client"

import { useEffect, useRef, useState } from "react"
import { ListChecks, MapPin, Timer } from "lucide-react"
import { Button } from "../ui/button"
import { Countdown, formatSisa } from "./countdown"
import { ModeBadge } from "./markers"

// OfferCard DS 1.3b dan 6.2 (D242): kartu putih biasa tanpa garis tepi kiri dan tanpa bayangan.
// Baris atas "Tawaran baru" dan badge Sekarang, judul, hitung mundur di bawah judul, detail, lalu
// tombol now (Ambil atau Terima) dan outline (Lewati atau Tolak), keduanya lg untuk lapangan.
export function OfferCard({
  viewer,
  seconds,
  title,
  area,
  distance,
  duration,
  options,
  announce = false,
}: {
  viewer: "pekerja" | "pemilik"
  seconds: number
  title: string
  area: string
  distance: string
  duration: string
  options: string
  /** Umumkan kedatangan tawaran ke pembaca layar (D248). Satu kartu saja di peraga, supaya tidak bising. */
  announce?: boolean
}) {
  const [expired, setExpired] = useState(seconds <= 0)
  const [arrival, setArrival] = useState("")
  const actionsRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLParagraphElement>(null)
  const hadFocus = useRef(false)
  const [accept, skip] = viewer === "pekerja" ? ["Ambil", "Lewati"] : ["Terima", "Tolak"]

  // Diisi sesaat setelah mount: pembaca layar hanya mengumumkan perubahan isi wilayah aria-live
  // yang sudah ada di DOM, bukan wilayah yang lahir bersama teksnya.
  useEffect(() => {
    if (!announce || seconds <= 0) return
    const id = setTimeout(() => setArrival(`Tawaran baru: ${title}, sisa ${formatSisa(seconds)}`), 500)
    return () => clearTimeout(id)
  }, [announce, seconds, title])

  // D248, DS 10: tombol yang sedang difokus jadi nonaktif saat waktu habis. Fokus dipindah ke
  // teks status supaya tidak jatuh ke body.
  useEffect(() => {
    if (expired && hadFocus.current) statusRef.current?.focus()
  }, [expired])

  function handleExpire() {
    hadFocus.current = actionsRef.current?.contains(document.activeElement) ?? false
    setExpired(true)
  }

  return (
    <article className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-muted-foreground">Tawaran baru</p>
        <ModeBadge mode="AVAILABLE_NOW" />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-h3 font-semibold">{title}</h3>
        <Countdown seconds={seconds} onExpire={handleExpire} />
        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <MapPin aria-hidden className="size-4 shrink-0" />
            {area} · {distance}
          </li>
          <li className="flex items-center gap-2">
            <Timer aria-hidden className="size-4 shrink-0" />
            Perkiraan {duration}
          </li>
          <li className="flex items-center gap-2">
            <ListChecks aria-hidden className="size-4 shrink-0" />
            {options}
          </li>
        </ul>
      </div>
      <div ref={actionsRef}>
        {expired ? (
          <div className="flex flex-col gap-2">
            <Button variant="now" size="lg" disabled className="w-full">
              Waktu respons habis
            </Button>
            <p ref={statusRef} tabIndex={-1} className="text-sm font-medium text-muted-foreground outline-none">
              Menunggu sistem memperbarui status
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="now" size="lg" className="flex-1">
              {accept}
            </Button>
            <Button variant="outline" size="lg">
              {skip}
            </Button>
          </div>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {arrival}
      </p>
    </article>
  )
}
