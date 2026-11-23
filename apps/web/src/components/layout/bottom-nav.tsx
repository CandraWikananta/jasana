"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense } from "react"
import { useSessionStatus } from "@/lib/use-session-status"
import { cn } from "@/lib/utils"
import { useAreaNavVisible } from "./area-gate"
import { NAV, bottomNavAt, isActive, type NavItem, type NavName } from "./nav-items"

// Navigasi bawah HP (Design System 3): tinggi 64 px, ikon + label. Aktif: pill --brand-subtle di
// sekitar ikon, area sentuhnya tetap seluruh item (D243, DS 4 dan 6.4). Tinggi isi 64 px ada di <ul>; <nav>
// menambah ruang aman garis home di bawahnya (pb-safe, D256). Halaman di atasnya wajib memberi ruang
// bawah (pb-nav-safe) supaya isi terakhir tidak tertutup.
//
// `publicPages` (layout publik): hanya untuk sesi aktif dan hanya di halaman tujuan menu (/, /cari).
// Detail jasa dan profil penyedia punya bar Pesan sendiri. Spacer menggantikan pb-nav-safe di main.
export function BottomNav({ nav, className, publicPages = false }: { nav: NavName; className?: string; publicPages?: boolean }) {
  const visible = useAreaNavVisible(nav)
  const status = useSessionStatus()
  if (!visible) return null
  if (publicPages) {
    if (status !== "authenticated") return null
    return (
      <Suspense fallback={null}>
        <PublicBottomNav nav={nav} className={className} />
      </Suspense>
    )
  }
  return <BottomNavBar nav={nav} className={className} />
}

function PublicBottomNav({ nav, className }: { nav: NavName; className?: string }) {
  if (bottomNavAt(usePathname()) !== "mobile") return null
  return (
    <>
      <div aria-hidden className={cn("pb-nav-safe", className)} />
      <BottomNavBar nav={nav} className={className} />
    </>
  )
}

function BottomNavBar({ nav, className }: { nav: NavName; className?: string }) {
  const items = NAV[nav]
  return (
    <nav
      aria-label="Navigasi utama"
      className={cn("fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-safe", className)}
    >
      {/* usePathname di rute dinamis butuh batas Suspense (Cache Components). */}
      <Suspense fallback={<NavList items={items} pathname="" />}>
        <ActiveNavList items={items} />
      </Suspense>
    </nav>
  )
}

function ActiveNavList({ items }: { items: NavItem[] }) {
  return <NavList items={items} pathname={usePathname()} />
}

/** Isi navigasi bawah. Di-export untuk galeri /dev/ui dengan pathname tetap. */
export function NavList({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <ul className="mx-auto flex h-16 max-w-md">
      {items.map((item) => {
        const active = isActive(item, pathname)
        const Icon = item.icon
        return (
          <li key={item.href} className="flex-1">
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex h-full flex-col items-center justify-center gap-0.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              <span
                className={cn(
                  "flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-150",
                  active ? "bg-brand-subtle text-brand-subtle-foreground" : "text-muted-foreground",
                )}
              >
                <Icon aria-hidden className="size-6" />
              </span>
              <span className={cn("text-xs", active ? "font-semibold text-brand-subtle-foreground" : "font-medium text-foreground")}>
                {item.label}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
