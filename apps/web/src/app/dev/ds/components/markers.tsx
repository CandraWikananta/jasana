// Penanda kecil DS v2.0: titik live (1.3b), ModeBadge (6.2), StatusBadge (7.1), rating (1.4c),
// tautan (6.4), dan penanda "catatan A#" yang menunjuk daftar temuan di bawah halaman.
import type { OrderStatus } from "@jasana/shared"
import { CalendarClock, Star } from "lucide-react"
import { cn } from "cn"
import { formatRating } from "@/lib/format"
import { ORDER_STATUS_META } from "@/lib/order-status"
import { Badge } from "../ui/badge"
import type { Mode } from "../data"

/** Lingkaran --brand 8 px dengan cahaya 4 px, berdenyut pelan kecuali prefers-reduced-motion (ds.css). */
export function LiveDot({ className }: { className?: string }) {
  return <span aria-hidden className={cn("ds-live-dot inline-block size-2 shrink-0 rounded-full bg-brand glow-brand", className)} />
}

export function ModeBadge({ mode }: { mode: Mode }) {
  if (mode === "AVAILABLE_NOW") {
    return (
      <Badge tone="now">
        {/* 1.3b: titik 6 sampai 7 px, tanpa cahaya. */}
        <span aria-hidden className="size-1.5 rounded-full bg-brand" />
        Sekarang
      </Badge>
    )
  }
  return (
    <Badge tone="outline">
      <CalendarClock aria-hidden />
      Terjadwal
    </Badge>
  )
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status]
  const Icon = meta.icon
  return (
    <Badge tone={meta.tone}>
      <Icon aria-hidden />
      {meta.label}
    </Badge>
  )
}

export function RatingText({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <span className="flex items-center gap-1">
      <Star aria-hidden className="size-4 fill-rating text-rating-stroke" />
      <span className="font-semibold text-foreground tabular-nums">{formatRating(rating)}</span>
      <span className="text-muted-foreground tabular-nums">({reviews} ulasan)</span>
    </span>
  )
}

export const LINK_CLASS =
  "font-semibold text-brand-strong underline underline-offset-3 hover:text-brand-subtle-foreground focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none"

/** Penanda "catatan A#": bagian yang dirender dari aturan dokumen yang ambigu atau bertentangan. */
export function Catatan({ id }: { id: string }) {
  return (
    <a
      href={`#catatan-${id}`}
      className="inline-flex w-fit items-center rounded-sm text-xs font-medium text-muted-foreground underline underline-offset-3 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      catatan {id}
    </a>
  )
}
