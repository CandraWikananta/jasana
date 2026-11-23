import { Star } from "lucide-react"
import { formatRating } from "@/lib/format"
import { cn } from "@/lib/utils"

// Design System 1.4c: bintang terisi --rating bergaris --rating-stroke, selalu diikuti angka. Bintang hanya penanda
// grafis (aria-hidden); maknanya dibawa angka, yang juga dibaca pembaca layar.
export function RatingStars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      <span aria-hidden className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn("size-4", i < Math.round(rating) ? "fill-rating text-rating-stroke" : "text-border")}
          />
        ))}
      </span>
      <span className="text-sm font-semibold tabular-nums">
        <span className="sr-only">Rating </span>
        {formatRating(rating)}
        <span className="sr-only"> dari 5</span>
      </span>
    </span>
  )
}

/** Ringkasan rating di header halaman publik: satu bintang, angka, dan jumlah ulasan (DS 1.4c). */
export function RatingSummary({ average, count }: { average: number; count: number }) {
  if (count === 0) return <span className="text-muted-foreground">Belum ada ulasan</span>
  return (
    <span className="flex items-center gap-1">
      <Star aria-hidden className="size-4 fill-rating text-rating-stroke" />
      <span className="font-semibold tabular-nums">{formatRating(average)}</span>
      <span className="text-muted-foreground tabular-nums">({count} ulasan)</span>
    </span>
  )
}
