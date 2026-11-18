import type { OrderStatus } from "@jasana/shared"
import { Badge } from "@/components/ui/badge"
import { ORDER_STATUS_META, type StatusMeta } from "@/lib/order-status"

/** Badge dari satu entri tabel label (order-status.ts atau enum-labels.ts). Selalu teks + ikon (DS 6.1). */
export function EnumBadge({ meta, className }: { meta: StatusMeta; className?: string }) {
  const { label, tone, icon: Icon } = meta
  return (
    <Badge tone={tone} className={className}>
      <Icon aria-hidden />
      {label}
    </Badge>
  )
}

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return <EnumBadge meta={ORDER_STATUS_META[status]} className={className} />
}
