"use client"

import { WifiOff } from "lucide-react"
import { usePathname } from "next/navigation"
import { Suspense } from "react"
import { Badge } from "@/components/ui/badge"
import { useRealtimeStatus } from "@/lib/socket"
import { cn } from "@/lib/utils"
import { bottomNavAt } from "./nav-items"

// Jarak bawah mengikuti navigasi bawah (D256): di atasnya kalau ada, selain itu jarak biasa ditambah
// ruang aman garis home.
const OFFSET = {
  all: "bottom-0 pb-nav-safe",
  mobile: "bottom-0 pb-nav-safe md:bottom-4 md:pb-safe",
  none: "bottom-4 pb-safe",
  // Bar Pesan detail jasa menempel di bawah sampai lg (D255, D256).
  orderBar: "bottom-0 pb-nav-safe lg:bottom-4 lg:pb-safe",
} as const

function offsetFor(pathname: string): string {
  if (pathname.startsWith("/listing/")) return OFFSET.orderBar
  return OFFSET[bottomNavAt(pathname) ?? "none"]
}

// PRD Frontend 8: tanda kecil saat socket putus. Hanya muncul untuk sesi aktif, karena status
// "disconnected" hanya terjadi setelah percobaan tersambung.
export function RealtimeIndicator() {
  if (useRealtimeStatus() !== "disconnected") return null
  // usePathname butuh batas Suspense di rute dinamis (Cache Components).
  return (
    <Suspense fallback={null}>
      <Indicator />
    </Suspense>
  )
}

function Indicator() {
  const offset = offsetFor(usePathname())
  return (
    <div className={cn("pointer-events-none fixed inset-x-0 z-50 flex justify-center", offset)}>
      <Badge tone="warning" role="status" className="shadow-md">
        <WifiOff aria-hidden />
        Pembaruan otomatis terputus
      </Badge>
    </div>
  )
}
