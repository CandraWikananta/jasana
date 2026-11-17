import { Camera, Cog, PerfumeBottle, Shapes, SprayCan, Wrench, type LucideIcon } from "lucide-react"

// Whitelist categories.icon_name (kebab-case) ke ikon lucide. Impor bernama, bukan dynamic import
// seluruh ikon, supaya bundle hanya membawa ikon yang dipakai. Nama baru dari admin ditambahkan di sini.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  cog: Cog,
  camera: Camera,
  "perfume-bottle": PerfumeBottle,
  wrench: Wrench,
  "spray-can": SprayCan,
}

/** Ikon kategori; `Shapes` kalau icon_name kosong atau belum ada di whitelist. */
export function getCategoryIcon(iconName: string | null): LucideIcon {
  // hasOwn: nilai seperti "constructor" dari DB tidak boleh terbaca sebagai kunci dikenal.
  return iconName && Object.hasOwn(CATEGORY_ICONS, iconName) ? CATEGORY_ICONS[iconName] : Shapes
}
