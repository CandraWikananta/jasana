// Penanda posisi DS 6.4 (D243): potongan sidebar 248 px (area usaha dan admin), navigasi bawah
// 64 px (pelanggan dan pekerja di HP), dan header publik. Aktif memakai hijau pucat, supaya hijau
// solid hanya milik tombol `now` dan titik live. `demo` hanya untuk peraga state statis.
import {
  ClipboardList,
  CircleUser,
  House,
  LayoutDashboard,
  Menu,
  Search,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"

type Item = { label: string; icon: LucideIcon; count?: number; countLabel?: string; demo?: "hover" | "focus" }

const SIDEBAR: Item[] = [
  { label: "Ringkasan", icon: LayoutDashboard, demo: "hover" },
  { label: "Pesanan", icon: ClipboardList, count: 3, countLabel: "pesanan baru" },
  { label: "Jasa Saya", icon: Store, demo: "focus" },
  { label: "Pekerja", icon: Users, count: 2, countLabel: "pelamar baru" },
  { label: "Saldo", icon: Wallet },
]

const DEMO_CLASS = {
  hover: "bg-muted",
  focus: "ring-2 ring-ring ring-offset-2 ring-offset-card",
} as const

/**
 * Lencana angka (6.4): di item aktif latar --primary dengan teks putih, di item tidak aktif pucat
 * bobot 700. Teks sr-only memberi konteks supaya pembaca layar tidak hanya membacakan "3".
 */
export function CountBadge({ count, label, active }: { count: number; label: string; active: boolean }) {
  return (
    <span
      className={cn(
        "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold tabular-nums",
        active ? "bg-primary text-primary-foreground" : "bg-brand-subtle text-brand-subtle-foreground"
      )}
    >
      <span aria-hidden>{count}</span>
      <span className="sr-only">
        {count} {label}
      </span>
    </span>
  )
}

export function SidebarSnippet({ active = "Pesanan" }: { active?: string }) {
  return (
    <nav aria-label="Menu usaha" className="flex w-62 max-w-full flex-col gap-1 rounded-lg border border-border bg-card p-3">
      <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">Usaha Saya</p>
      <ul className="flex flex-col gap-1">
        {SIDEBAR.map((it) => {
          const on = it.label === active
          const Icon = it.icon
          return (
            <li key={it.label}>
              <a
                href="#penanda"
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm outline-none transition-colors duration-150",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                  on
                    ? "bg-brand-subtle font-semibold text-brand-subtle-foreground"
                    : "font-medium text-foreground hover:bg-muted",
                  it.demo && DEMO_CLASS[it.demo]
                )}
              >
                <Icon aria-hidden className={cn("size-6", on ? "text-brand-subtle-foreground" : "text-muted-foreground")} />
                <span className="flex-1">{it.label}</span>
                {it.count !== undefined && <CountBadge count={it.count} label={it.countLabel ?? ""} active={on} />}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

const BOTTOM: Item[] = [
  { label: "Beranda", icon: House },
  { label: "Cari", icon: Search },
  { label: "Pesanan", icon: ClipboardList },
  { label: "Akun", icon: CircleUser },
]

/** Indikator aktif berupa pill --brand-subtle di sekitar ikon (DS 4), area sentuhnya seluruh item. */
export function BottomNav({ active = "Beranda" }: { active?: string }) {
  return (
    <nav aria-label="Navigasi utama" className="h-16 border-t border-border bg-card">
      <ul className="grid h-full grid-cols-4">
        {BOTTOM.map((it) => {
          const on = it.label === active
          const Icon = it.icon
          return (
            <li key={it.label} className="flex">
              <a
                href="#penanda"
                aria-current={on ? "page" : undefined}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-150",
                    on ? "bg-brand-subtle text-brand-subtle-foreground" : "text-muted-foreground"
                  )}
                >
                  <Icon aria-hidden className="size-6" />
                </span>
                <span className={cn("text-xs", on ? "font-semibold text-brand-subtle-foreground" : "font-medium text-foreground")}>
                  {it.label}
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

const PUBLIC_LINKS = ["Jelajahi", "Kategori", "Jadi penyedia"]

/**
 * Header publik. Tautan aktif --brand-strong tebal dengan garis bawah (6.4, elemen lain): pengecualian
 * dari penanda pucat, karena isinya tautan halaman, bukan navigasi aplikasi. Tombol Masuk outline.
 */
export function PublicHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-4">
      <span translate="no" className="text-lg font-bold">
        Jasana
      </span>
      <Button variant="ghost" size="md" aria-label="Buka menu" className={cn("size-11 px-0", !compact && "@3xl:hidden")}>
        <Menu aria-hidden />
      </Button>
      {compact ? null : (
        <div className="hidden items-center gap-6 @3xl:flex">
          <nav aria-label="Menu publik">
            <ul className="flex items-center gap-5 text-sm">
              {PUBLIC_LINKS.map((label, i) => (
                <li key={label}>
                  <a
                    href="#responsif"
                    aria-current={i === 0 ? "page" : undefined}
                    className={cn(
                      "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      i === 0
                        ? "font-semibold text-brand-strong underline underline-offset-3"
                        : "font-medium text-foreground hover:text-muted-foreground"
                    )}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Button variant="outline" size="md">
            Masuk
          </Button>
        </div>
      )}
    </header>
  )
}
