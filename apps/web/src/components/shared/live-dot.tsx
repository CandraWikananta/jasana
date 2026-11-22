import { cn } from "@/lib/utils"

/** Titik live DS 1.3b: lingkaran --brand 8 px (6 px di dalam badge) dengan cahaya 4 px. Denyutnya di globals.css. */
export function LiveDot({ className }: { className?: string }) {
  return <span aria-hidden className={cn("live-dot inline-block size-2 shrink-0 rounded-full bg-brand glow-brand", className)} />
}
