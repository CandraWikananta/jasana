import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

// Design System 1.4c: bintang terisi --rating bergaris --rating-stroke. Nilai dibaca pembaca layar lewat label.
export function RatingStars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span role="img" aria-label={`Rating ${rating} dari 5`} className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden
          className={cn("size-4", i < Math.round(rating) ? "fill-rating text-rating-stroke" : "text-border")}
        />
      ))}
    </span>
  )
}
