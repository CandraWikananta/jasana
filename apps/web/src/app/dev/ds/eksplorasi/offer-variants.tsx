"use client"

// EKSPLORASI, bukan bagian DS v2.0. Empat cara menandai mode Sekarang pada OfferCard. Isi kartu
// (judul, detail, tombol, bayangan tipis) sama di keempatnya, yang berbeda hanya penandanya.
// OfferCard sesuai DS ada di ../components/offer-card.tsx dan tidak diubah.
import { ListChecks, MapPin, Timer } from "lucide-react"
import { cn } from "cn"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Countdown } from "../components/countdown"
import { LiveDot } from "../components/markers"

export type MarkerVariant = "A" | "B" | "C" | "D"

/** Pill Sekarang untuk varian B: bentuk badge `now` (1.3b), titiknya diganti titik live. */
export function NowPill() {
  return (
    <Badge tone="now">
      <LiveDot className="size-1.5" />
      Sekarang
    </Badge>
  )
}

const SHELL: Record<MarkerVariant, string> = {
  A: "border border-border border-l-4 border-l-brand",
  B: "border border-border",
  C: "border border-brand",
  D: "overflow-hidden border border-border",
}

export function OfferVariant({ variant, seconds = 570 }: { variant: MarkerVariant; seconds?: number }) {
  const header =
    variant === "B" ? (
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold">Tawaran baru</p>
        <NowPill />
      </div>
    ) : variant === "D" ? (
      <div className="-mx-4 -mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 bg-brand-subtle px-4 py-2.5">
        <p className="flex items-center gap-2 text-sm font-bold text-brand-subtle-foreground">
          <LiveDot />
          Tawaran baru · Sekarang
        </p>
        <Countdown seconds={seconds} />
      </div>
    ) : (
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="flex items-center gap-2 text-sm font-bold">
          <LiveDot />
          Tawaran baru · Sekarang
        </p>
        <Countdown seconds={seconds} />
      </div>
    )

  return (
    <article className={cn("flex flex-col gap-4 rounded-lg bg-card p-4 shadow-sm", SHELL[variant])}>
      {header}
      <div className="flex flex-col gap-2">
        <h3 className="text-lg leading-6.5 font-semibold">Perbaikan pipa bocor</h3>
        {/* Varian B: kanan atas sudah dipakai badge, jadi hitung mundur turun ke bawah judul. */}
        {variant === "B" ? <Countdown seconds={seconds} /> : null}
        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <MapPin aria-hidden className="size-4" />
            Sanur Kaja · 850 m
          </li>
          <li className="flex items-center gap-2">
            <Timer aria-hidden className="size-4" />
            Perkiraan 1 jam
          </li>
          <li className="flex items-center gap-2">
            <ListChecks aria-hidden className="size-4" />
            Pipa PVC 1/2 inci, 1 titik bocor
          </li>
        </ul>
      </div>
      <div className="flex gap-2">
        <Button variant="now" size="lg" className="flex-1">
          Ambil
        </Button>
        <Button variant="outline" size="lg">
          Lewati
        </Button>
      </div>
    </article>
  )
}
