// Banner status DS 1.4b: latar paling pucat, garis 1 px, chip ikon bulat, judul tebal, satu kalimat.
import { CircleCheck, CircleX, Info, TriangleAlert, type LucideIcon } from "lucide-react"
import { cn } from "cn"

export type BannerTone = "success" | "warning" | "info" | "destructive"

const TONE: Record<BannerTone, { box: string; chip: string; title: string; body: string; icon: LucideIcon }> = {
  success: { box: "border-success-border bg-success-surface", chip: "bg-success-border text-success", title: "text-success-title", body: "text-success-subtle-foreground", icon: CircleCheck },
  warning: { box: "border-warning-border bg-warning-surface", chip: "bg-warning-border text-warning", title: "text-warning-title", body: "text-warning-subtle-foreground", icon: TriangleAlert },
  info: { box: "border-info-border bg-info-surface", chip: "bg-info-border text-info", title: "text-info-title", body: "text-info-subtle-foreground", icon: Info },
  destructive: { box: "border-destructive-border bg-destructive-surface", chip: "bg-destructive-border text-destructive", title: "text-destructive-title", body: "text-destructive-subtle-foreground", icon: CircleX },
}

export function StatusBanner({ tone, title, children }: { tone: BannerTone; title: string; children: React.ReactNode }) {
  const t = TONE[tone]
  const Icon = t.icon
  return (
    <div role="status" className={cn("flex items-start gap-3 rounded-lg border p-4", t.box)}>
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", t.chip)}>
        <Icon aria-hidden className="size-5" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className={cn("text-base font-semibold", t.title)}>{title}</p>
        <div className={cn("text-sm text-pretty", t.body)}>{children}</div>
      </div>
    </div>
  )
}
