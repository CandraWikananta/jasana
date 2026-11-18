"use client"

import { useQueryClient } from "@tanstack/react-query"
import { LogOut } from "lucide-react"
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
import { useMe } from "@/features/auth/queries"
import { loginHref } from "@/lib/safe-next"
import { logout } from "@/lib/session"
import { useSessionStatus } from "@/lib/use-session-status"

/** Dua huruf pertama dari dua kata pertama nama, untuk avatar tanpa foto (Design System 5). */
export function initials(fullName: string | undefined): string {
  const words = (fullName ?? "").trim().split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map((word) => word[0]!.toUpperCase()).join("") || "?"
}

// Bagian kanan header publik. Status sesi baru diketahui di browser, jadi selama "unknown"
// tampil kerangka seukuran tombol supaya header tidak meloncat. Pengalih area (RoleSwitcher)
// dan banner email belum terverifikasi menyusul bersama layout area.
export function HeaderAccount() {
  // usePathname di rute dinamis (/listing/[id]) menghambat prerender Cache Components tanpa batas
  // Suspense. Kerangkanya sama dengan status "unknown", jadi tidak ada loncatan tampilan.
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <HeaderAccountInner />
    </Suspense>
  )
}

function AccountSkeleton() {
  return <Skeleton className="ml-auto h-10 w-24" />
}

function HeaderAccountInner() {
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
  return <AccountMenu />
}

function AccountMenu() {
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
          className="ml-auto flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold text-primary-subtle-foreground">
            {me ? initials(me.full_name) : <Skeleton className="size-10 rounded-full" />}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-semibold">{me?.full_name ?? "Memuat..."}</span>
          {me && <span className="truncate text-xs text-muted-foreground">{me.email}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
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
