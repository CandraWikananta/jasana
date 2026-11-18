"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Suspense, useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useAreaNavVisible } from "./area-gate"
import { EmailVerificationBanner } from "./email-verification-banner"
import { HeaderAccount } from "./header-account"
import { NAV, isActive, type NavItem, type NavName } from "./nav-items"

// Kerangka area usaha dan admin (PRD Frontend 4.1): sidebar 248 px mulai lg, di bawahnya
// menu dibuka lewat Sheet dari kiri (Design System 3).
export function SidebarShell({
  areaLabel,
  nav,
  children,
}: {
  areaLabel: string
  nav: NavName
  children: React.ReactNode
}) {
  const items = NAV[nav]
  const [open, setOpen] = useState(false)
  const showNav = useAreaNavVisible(nav)

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
        <div className="flex h-16 items-center gap-3 px-4 md:px-6">
          {showNav && (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="size-11 p-0 lg:hidden" aria-label="Buka menu">
                  <Menu aria-hidden />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-62 p-0">
                <SheetTitle className="px-4 pt-5 pb-2 text-lg font-semibold">{areaLabel}</SheetTitle>
                <SidebarNav items={items} onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
          )}
          <Link
            href="/"
            className="rounded-sm text-2xl font-bold text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Jasana
          </Link>
          <span className="hidden text-sm font-semibold text-muted-foreground sm:inline">{areaLabel}</span>
          <HeaderAccount />
        </div>
      </header>
      <EmailVerificationBanner />
      <div className="flex flex-1">
        {showNav && (
          <aside className="hidden w-62 shrink-0 border-r border-border bg-card lg:block">
            <div className="sticky top-16 py-4">
              <SidebarNav items={items} />
            </div>
          </aside>
        )}
        <main className="min-w-0 flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  )
}

function SidebarNav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <nav aria-label="Menu area">
      <Suspense fallback={<NavLinks items={items} pathname="" onNavigate={onNavigate} />}>
        <ActiveNavLinks items={items} onNavigate={onNavigate} />
      </Suspense>
    </nav>
  )
}

function ActiveNavLinks(props: { items: NavItem[]; onNavigate?: () => void }) {
  return <NavLinks {...props} pathname={usePathname()} />
}

function NavLinks({ items, pathname, onNavigate }: { items: NavItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <ul className="flex flex-col gap-1 px-3">
      {items.map((item) => {
        const active = isActive(item, pathname)
        const Icon = item.icon
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "bg-primary-subtle text-primary-subtle-foreground" : "text-foreground hover:bg-muted",
              )}
            >
              <Icon aria-hidden className="size-5" />
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
