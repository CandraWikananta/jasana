"use client"

import { WifiOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRealtimeStatus } from "@/lib/socket"

// PRD Frontend 8: tanda kecil saat socket putus. Hanya muncul untuk sesi aktif, karena status
// "disconnected" hanya terjadi setelah percobaan tersambung.
export function RealtimeIndicator() {
  if (useRealtimeStatus() !== "disconnected") return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center md:bottom-4">
      <Badge tone="warning" role="status" className="shadow-md">
        <WifiOff aria-hidden />
        Pembaruan otomatis terputus
      </Badge>
    </div>
  )
}
