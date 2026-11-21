// Penanda aktif DS 6.4 untuk navigasi: potongan sidebar 248 px (area usaha dan admin), navigasi
// bawah 64 px (pelanggan dan pekerja di HP), dan header publik. `demo` hanya untuk peraga state.
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
import { Button } from "../ui/button"

type Item = { label: string; icon: LucideIcon; count?: number; demo?: "hover" | "focus" }

const SIDEBAR: Item[] = [
  { label: "Ringkasan", icon: LayoutDashboard, demo: "hover" },
  { label: "Pesanan", icon: ClipboardList, count: 3 },
  { label: "Jasa Saya", icon: Store, demo: "focus" },
  { label: "Pekerja", icon: Users, count: 2 },
  { label: "Saldo", icon: Wallet },
]

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
                data-demo={it.demo}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm outline-none transition-colors duration-150",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                  "data-[demo=focus]:ring-2 data-[demo=focus]:ring-ring data-[demo=focus]:ring-offset-2 data-[demo=focus]:ring-offset-card",
                  on
                    ? "bg-brand font-semibold text-brand-foreground"
                    : "font-medium text-foreground hover:bg-muted data-[demo=hover]:bg-muted"
                )}
              >
                <Icon aria-hidden className={cn("size-6", on ? "text-brand-foreground" : "text-muted-foreground")} />
                <span className="flex-1">{it.label}</span>
                {it.count !== undefined && (
                  <span
                    className={cn(
                      "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold tabular-nums",
                      on ? "bg-primary text-primary-foreground" : "bg-brand-subtle text-brand-subtle-foreground"
                    )}
                  >
                    {it.count}
                  </span>
                )}
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

/** A8: item aktif berupa pill --brand di sekitar ikon, mengikuti paragraf 6.4. */
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
                    on ? "bg-brand text-brand-foreground" : "text-muted-foreground"
                  )}
                >
                  <Icon aria-hidden className="size-6" />
                </span>
                <span className={cn("text-xs text-foreground", on ? "font-semibold" : "font-medium")}>{it.label}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

const PUBLIC_LINKS = ["Jelajahi", "Kategori", "Jadi penyedia"]

/** A13: tautan menu aktif header publik --brand-strong (Bagian 14). Tombol Masuk tetap outline. */
export function PublicHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-4">
      <span className="text-lg font-bold">Jasana</span>
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
                      i === 0 ? "font-semibold text-brand-strong" : "font-medium text-foreground hover:text-muted-foreground"
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
