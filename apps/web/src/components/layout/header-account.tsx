"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Bell, Briefcase, HardHat, LogOut, ShieldCheck, ShoppingBag, UserRound, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Suspense, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { getCapabilities, type Area } from "@/features/auth/capabilities"
import { useMe } from "@/features/auth/queries"
import { useUnreadNotificationCount } from "@/features/notifications/queries"
import { loginHref } from "@/lib/safe-next"
import { logout } from "@/lib/session"
import { cn } from "@/lib/utils"
import { useSessionStatus } from "@/lib/use-session-status"

/** Dua huruf pertama dari dua kata pertama nama, untuk avatar tanpa foto (Design System 5). */
export function initials(fullName: string | undefined): string {
  const words = (fullName ?? "").trim().split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map((word) => word[0]!.toUpperCase()).join("") || "?"
}

// Pengalih area di menu avatar (PRD Frontend 4.1, D220): hanya area yang dimiliki akun ini.
const AREA_LINKS: Record<Area, { href: string; label: string; icon: LucideIcon }> = {
  pelanggan: { href: "/pesanan", label: "Mode pelanggan", icon: ShoppingBag },
  usaha: { href: "/usaha", label: "Usaha saya", icon: Briefcase },
  pekerja: { href: "/pekerja", label: "Mode pekerja", icon: HardHat },
  admin: { href: "/admin", label: "Panel admin", icon: ShieldCheck },
}

interface HeaderAccountProps {
  /** Header publik: tautan Pesanan dan Bell mulai md, karena navigasi bawah pelanggan hanya di HP. */
  customerLinks?: boolean
  /** lg: pemicu avatar 48 px untuk area pekerja (DS 11). */
  size?: "md" | "lg"
}

// Bagian kanan header. Status sesi baru diketahui di browser, jadi selama "unknown"
// tampil kerangka seukuran tombol supaya header tidak meloncat.
export function HeaderAccount(props: HeaderAccountProps) {
  // usePathname di rute dinamis (/listing/[id]) menghambat prerender Cache Components tanpa batas
  // Suspense. Kerangkanya sama dengan status "unknown", jadi tidak ada loncatan tampilan.
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <HeaderAccountInner {...props} />
    </Suspense>
  )
}

function AccountSkeleton() {
  return <Skeleton className="ml-auto h-10 w-24" />
}

function HeaderAccountInner({ customerLinks = false, size = "md" }: HeaderAccountProps) {
  const status = useSessionStatus()
  const pathname = usePathname()

  if (status === "unknown") return <AccountSkeleton />
  if (status === "guest") {
    return (
      <Button asChild variant="outline" className="ml-auto">
        <Link href={pathname === "/" ? "/masuk" : loginHref(pathname)}>Masuk</Link>
      </Button>
    )
  }
  return (
    <div className="ml-auto flex items-center gap-2">
      {customerLinks && <CustomerLinks pathname={pathname} />}
      <AccountMenu size={size} />
    </div>
  )
}

// Tautan aktif header publik (DS 6.4): teks --brand-strong bergaris bawah. Bell berupa tombol ikon
// navigasi, jadi aktifnya pucat; titik --destructive bergaris putih menandai notifikasi baru.
function CustomerLinks({ pathname }: { pathname: string }) {
  const { data: unread = 0 } = useUnreadNotificationCount()
  const ordersActive = pathname === "/pesanan" || pathname.startsWith("/pesanan/")
  const notificationsActive = pathname === "/notifikasi"

  return (
    <nav aria-label="Menu pelanggan" className="hidden items-center gap-2 md:flex">
      <Link
        href="/pesanan"
        aria-current={ordersActive ? "page" : undefined}
        className={cn(
          "inline-flex h-11 items-center rounded-sm px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          ordersActive ? "font-semibold text-brand-strong underline underline-offset-3" : "font-medium text-foreground hover:text-muted-foreground",
        )}
      >
        Pesanan
      </Link>
      <Button
        asChild
        variant="ghost"
        size="icon"
        className={cn("relative", notificationsActive && "bg-brand-subtle text-brand-subtle-foreground hover:bg-brand-subtle")}
      >
        <Link href="/notifikasi" aria-current={notificationsActive ? "page" : undefined}>
          <Bell aria-hidden />
          {unread > 0 && <span aria-hidden className="absolute top-2.5 right-2.5 size-2.5 rounded-full bg-destructive ring-2 ring-card" />}
          <span className="sr-only">{unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}</span>
        </Link>
      </Button>
    </nav>
  )
}

function AccountMenu({ size }: { size: "md" | "lg" }) {
  const { data: me } = useMe()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [leaving, setLeaving] = useState(false)

  async function handleLogout() {
    setLeaving(true)
    try {
      await logout()
    } catch {
      // Jaringan putus: sesi di memori tetap dihapus oleh logout().
    } finally {
      queryClient.clear()
      setLeaving(false)
      router.replace("/")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Menu akun"
          className={cn(
            "flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            size === "lg" ? "size-12" : "size-11",
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-brand-subtle text-sm font-semibold text-brand-subtle-foreground">
            {me ? initials(me.full_name) : <Skeleton className="size-10 rounded-full" />}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-semibold">{me?.full_name ?? "Memuat…"}</span>
          {me && <span className="truncate text-xs text-muted-foreground">{me.email}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/akun">
            <UserRound aria-hidden />
            Akun
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {getCapabilities(me).areas.map((area) => {
          const { href, label, icon: Icon } = AREA_LINKS[area]
          return (
            <DropdownMenuItem key={area} asChild>
              <Link href={href}>
                <Icon aria-hidden />
                {label}
              </Link>
            </DropdownMenuItem>
          )
        })}
        {me && <DropdownMenuSeparator />}
        <DropdownMenuItem
          disabled={leaving}
          onSelect={(event) => {
            event.preventDefault()
            void handleLogout()
          }}
        >
          <LogOut aria-hidden />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
