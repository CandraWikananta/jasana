// Penanda kecil DS v2.1: titik live (1.3b), ModeBadge (6.2), StatusBadge (7.1), rating (1.4c), dan
// tautan (6.4).
import { Star } from "lucide-react"
import { formatRating } from "@/lib/format"

// Sejak M2 ketiganya komponen bersama aplikasi; peraga ini memakai yang sama.
export { LiveDot } from "@/components/shared/live-dot"
export { ModeBadge } from "@/components/shared/mode-badge"
export { StatusBadge } from "@/components/shared/status-badge"

export function RatingText({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <span className="flex items-center gap-1">
      <Star aria-hidden className="size-4 fill-rating text-rating-stroke" />
      <span className="font-semibold text-foreground tabular-nums">{formatRating(rating)}</span>
      <span className="text-muted-foreground tabular-nums">({reviews} ulasan)</span>
    </span>
  )
}

export { LINK_CLASS } from "@/components/shared/link-class"
