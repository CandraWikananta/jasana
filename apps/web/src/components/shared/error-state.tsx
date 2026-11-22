import { CloudOff, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Design System 10: pesan dari peta kode error + "Coba lagi". Pola sama dengan EmptyState.
export function ErrorState({
  title = "Gagal memuat",
  message,
  onRetry,
  className,
}: {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div role="alert" className={cn("flex flex-col items-center gap-3 px-4 py-10 text-center", className)}>
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive-subtle text-destructive-subtle-foreground">
        <CloudOff aria-hidden className="size-6" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-h3 font-semibold">{title}</h3>
        <p className="max-w-lg text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RotateCw aria-hidden />
          Coba lagi
        </Button>
      )}
    </div>
  )
}
