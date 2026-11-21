"use client"

import { useState } from "react"
import { ListChecks, MapPin, Timer } from "lucide-react"
import { Button } from "../ui/button"
import { Countdown } from "./countdown"
import { Catatan, LiveDot } from "./markers"

// OfferCard DS 1.3b dan 6.2: kartu putih, garis tepi kiri 4 px --brand, titik live, label hitam
// tebal, hitung mundur, tombol now (Ambil atau Terima) dan outline (Lewati atau Tolak).
// A6: "bayangan tipis" dari 1.3b dipakai walaupun Bagian 4 melarang bayangan di kartu.
export function OfferCard({
  viewer,
  seconds,
  title,
  area,
  distance,
  duration,
  options,
}: {
  viewer: "pekerja" | "pemilik"
  seconds: number
  title: string
  area: string
  distance: string
  duration: string
  options: string
}) {
  const [expired, setExpired] = useState(seconds <= 0)
  const [accept, skip] = viewer === "pekerja" ? ["Ambil", "Lewati"] : ["Terima", "Tolak"]

  return (
    <article className="flex flex-col gap-4 rounded-lg border border-border border-l-4 border-l-brand bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="flex items-center gap-2 text-sm font-bold">
          <LiveDot />
          Tawaran baru · Sekarang
        </p>
        <Countdown seconds={seconds} onExpire={() => setExpired(true)} />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg leading-6.5 font-semibold">{title}</h3>
        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <MapPin aria-hidden className="size-4" />
            {area} · {distance}
          </li>
          <li className="flex items-center gap-2">
            <Timer aria-hidden className="size-4" />
            Perkiraan {duration}
          </li>
          <li className="flex items-center gap-2">
            <ListChecks aria-hidden className="size-4" />
            {options}
          </li>
        </ul>
      </div>
      {expired ? (
        <div className="flex flex-col gap-2">
          <Button variant="now" size="lg" disabled className="w-full">
            Waktu respons habis
          </Button>
          <p className="text-xs font-medium text-muted-foreground">Menunggu sistem memperbarui status</p>
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
      <span className="flex gap-3">
        <Catatan id="A5" />
        <Catatan id="A6" />
      </span>
    </article>
  )
}
