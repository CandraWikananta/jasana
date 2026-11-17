import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

// Design System 5: bintang berwarna teks, bukan kuning. Nilai dibaca pembaca layar lewat label.
export function RatingStars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span role="img" aria-label={`Rating ${rating} dari 5`} className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden
          className={cn("size-4", i < Math.round(rating) ? "fill-foreground text-foreground" : "text-border")}
        />
      ))}
    </span>
  )
}
