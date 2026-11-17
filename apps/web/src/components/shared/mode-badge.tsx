import type { BookingMode } from "@jasana/shared"
import { Badge } from "@/components/ui/badge"
import { BOOKING_MODE_META } from "@/lib/order-status"

export function ModeBadge({ mode, className }: { mode: BookingMode; className?: string }) {
  const { label, tone, icon: Icon } = BOOKING_MODE_META[mode]
  return (
    <Badge tone={tone} className={className}>
      <Icon aria-hidden />
      {label}
    </Badge>
  )
}
