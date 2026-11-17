import type { OrderStatus } from "@jasana/shared"
import { Badge } from "@/components/ui/badge"
import { ORDER_STATUS_META } from "@/lib/order-status"

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const { label, tone, icon: Icon } = ORDER_STATUS_META[status]
  return (
    <Badge tone={tone} className={className}>
      <Icon aria-hidden />
      {label}
    </Badge>
  )
}
