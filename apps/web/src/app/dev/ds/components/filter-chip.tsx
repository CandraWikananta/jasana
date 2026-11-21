import { Check, type LucideIcon } from "lucide-react"
import { cn } from "cn"

// Chip filter DS 6.1 dan 6.4. Bisa ditekan, jadi radius 10 px, bukan pill (D249). Tidak aktif:
// latar --card, garis --input, teks 500, hover --muted. Aktif: pucat dengan ikon Check.
export function FilterChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon?: LucideIcon
  active: boolean
  onClick?: () => void
}) {
  const Icon = active ? Check : icon
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-md border px-4 text-sm transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        active
          ? "border-transparent bg-brand-subtle font-semibold text-brand-subtle-foreground"
          : "border-input bg-card font-medium text-foreground hover:bg-muted"
      )}
    >
      {Icon ? <Icon aria-hidden className={cn("size-4", !active && "text-muted-foreground")} /> : null}
      {label}
    </button>
  )
}
