import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Design System 5 dan 10: ikon 24 px di lingkaran --muted, judul, satu kalimat, satu aksi.
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-4 py-10 text-center", className)}>
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon aria-hidden className="size-6" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-h3 font-semibold">{title}</h3>
        <p className="max-w-lg text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}
