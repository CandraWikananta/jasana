import { Check, X, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Chip filter DS 6.1 dan 6.4. Bisa ditekan, jadi radius 10 px, bukan pill (D249). Tidak aktif:
// latar --card, garis --input, teks 500, hover --muted. Aktif: pucat dengan ikon Check.
/** Kelas chip, juga untuk chip berupa tautan (kategori di beranda). Ikon tidak aktif: tambahkan `chipIconClass`. */
export function filterChipClass(active: boolean) {
  return cn(
    "inline-flex h-11 items-center gap-2 rounded-md border px-4 text-sm transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
    active
      ? "border-transparent bg-brand-subtle font-semibold text-brand-subtle-foreground"
      : "border-input bg-card font-medium text-foreground hover:bg-muted",
  )
}

export function chipIconClass(active: boolean) {
  return cn("size-4", !active && "text-muted-foreground")
}

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
    <button type="button" aria-pressed={active} onClick={onClick} className={filterChipClass(active)}>
      {Icon ? <Icon aria-hidden className={chipIconClass(active)} /> : null}
      {label}
    </button>
  )
}

/**
 * Chip filter `removable` (D253): filter yang sedang aktif, satu tombol penuh yang menghapusnya. Selalu pucat,
 * karena memang aktif; hover menebalkan garisnya.
 */
export function RemovableChip({
  label,
  onRemove,
  ref,
}: {
  label: string
  onRemove: () => void
  ref?: React.Ref<HTMLButtonElement>
}) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={`Hapus filter ${label}`}
      onClick={onRemove}
      className="inline-flex h-11 items-center gap-2 rounded-md border border-transparent bg-brand-subtle px-4 text-sm font-semibold text-brand-subtle-foreground transition-colors duration-150 outline-none hover:border-brand-subtle-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
    >
      {label}
      <X aria-hidden className="size-4" />
    </button>
  )
}
