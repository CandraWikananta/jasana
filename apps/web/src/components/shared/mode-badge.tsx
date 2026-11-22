import type { BookingMode } from "@jasana/shared"
import { LiveDot } from "@/components/shared/live-dot"
import { Badge } from "@/components/ui/badge"
import { BOOKING_MODE_META } from "@/lib/order-status"

// Satu bentuk mode Sekarang di semua tempat (D242): pill putih bergaris --brand dengan titik live.
// Terjadwal label bergaris dengan ikon, karena pill berwarna selalu berarti status (DS 7.1).
export function ModeBadge({ mode, className }: { mode: BookingMode; className?: string }) {
  const { label, tone, icon: Icon } = BOOKING_MODE_META[mode]
  return (
    <Badge tone={tone} className={className}>
      {Icon ? <Icon aria-hidden /> : <LiveDot className="size-1.5" />}
      {label}
    </Badge>
  )
}
