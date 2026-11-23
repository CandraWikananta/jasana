import { Construction, type LucideIcon } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"

// Isi sementara halaman area sampai fasenya dikerjakan (PRD Frontend 11).
export function PlaceholderPage({
  title,
  description = "Halaman ini sedang disiapkan.",
  icon = Construction,
  action,
}: {
  title: string
  description?: string
  icon?: LucideIcon
  /** Satu aksi `outline` ke halaman yang sudah ada (DS 10). */
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-h1 font-bold">{title}</h1>
      <div className="rounded-lg border border-border bg-card">
        <EmptyState icon={icon} title="Segera hadir" description={description} action={action} />
      </div>
    </div>
  )
}
