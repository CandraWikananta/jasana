"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense } from "react"
import { cn } from "@/lib/utils"
import { useAreaNavVisible } from "./area-gate"
import { NAV, isActive, type NavItem, type NavName } from "./nav-items"

// Navigasi bawah HP (Design System 3): tinggi 64 px, ikon + label. Halaman di atasnya wajib
// memberi ruang bawah (pb-16) supaya isi terakhir tidak tertutup.
export function BottomNav({ nav, className }: { nav: NavName; className?: string }) {
  const items = NAV[nav]
  if (!useAreaNavVisible(nav)) return null
  return (
    <nav
      aria-label="Navigasi utama"
      className={cn("fixed inset-x-0 bottom-0 z-40 h-16 border-t border-border bg-card", className)}
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

function NavList({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <ul className="mx-auto flex h-full max-w-md">
      {items.map((item) => {
        const active = isActive(item, pathname)
        const Icon = item.icon
        return (
          <li key={item.href} className="flex-1">
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-full flex-col items-center justify-center gap-1 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon aria-hidden className="size-6" />
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
