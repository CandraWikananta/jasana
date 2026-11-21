// Penanda kecil DS v2.1: titik live (1.3b), ModeBadge (6.2), StatusBadge (7.1), rating (1.4c), dan
// tautan (6.4).
import type { OrderStatus } from "@jasana/shared"
import { CalendarClock, Star } from "lucide-react"
import { cn } from "cn"
import { formatRating } from "@/lib/format"
import { ORDER_STATUS_META } from "@/lib/order-status"
import { Badge } from "../ui/badge"
import type { Mode } from "../data"

/** Lingkaran --brand 8 px (6 px di dalam badge) dengan cahaya 4 px. Denyutnya di ds.css. */
export function LiveDot({ className }: { className?: string }) {
  return <span aria-hidden className={cn("ds-live-dot inline-block size-2 shrink-0 rounded-full bg-brand glow-brand", className)} />
}

/**
 * Satu bentuk mode Sekarang untuk kartu listing, kartu pesanan, kartu tawaran, dan toggle (D242):
 * pill putih bergaris --brand dengan titik live. Terjadwal tampil sebagai label bergaris, karena
 * pill berwarna selalu berarti status (DS 7.1).
 */
export function ModeBadge({ mode }: { mode: Mode }) {
  if (mode === "AVAILABLE_NOW") {
    return (
      <Badge tone="now">
        <LiveDot className="size-1.5" />
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

// D245: SETTLED berlabel "Dana cair". lib/order-status.ts masih v1.6 ("Tuntas") dan baru diganti
// saat migrasi (DS Bagian 14), jadi peraga ini menimpanya secara lokal.
const LABEL_V21: Partial<Record<OrderStatus, string>> = { SETTLED: "Dana cair" }

export function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status]
  const Icon = meta.icon
  return (
    <Badge tone={meta.tone}>
      <Icon aria-hidden />
      {LABEL_V21[status] ?? meta.label}
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
