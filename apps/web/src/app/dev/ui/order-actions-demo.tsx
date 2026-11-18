import type { Me } from "@/types/api/auth"
import type { OrderDetail } from "@/types/api/order"
import { ModeBadge } from "@/components/shared/mode-badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { IDS, ME, NOW, at, makeOrder } from "@/features/orders/order-actions.fixtures"
import { getOrderActions, getViewer, type OrderActionContext } from "@/features/orders/order-actions"
import { formatTanggalJam } from "@/lib/time"

// Contoh hasil getOrderActions() dengan `now` tetap. Tombol hanya dirender dari hasil fungsi,
// sama seperti OrderActionBar nanti (aturan web nomor 3).

const ownerAssigned = { assigned_worker: { id: IDS.ownerWorker, name: "Pemilik" } }
const nowMode = { booking_mode: "AVAILABLE_NOW", scheduled_at: null } as const

const SCENARIOS: { title: string; me: Me; order: OrderDetail; offered?: boolean; ctx?: OrderActionContext }[] = [
  {
    title: "Pelanggan, menunggu konfirmasi",
    me: ME.client,
    order: makeOrder({ status: "PENDING_ACCEPTANCE", assigned_worker: null, crew: [], response_deadline_at: at(30) }),
  },
  {
    title: "Pemilik usaha, pesanan terjadwal baru",
    me: ME.owner,
    order: makeOrder({ status: "PENDING_ACCEPTANCE", assigned_worker: null, crew: [], response_deadline_at: at(30) }),
  },
  {
    title: "Penerima tawaran, hitung mundur habis",
    me: ME.worker,
    order: makeOrder({ status: "PENDING_ACCEPTANCE", ...nowMode, assigned_worker: null, crew: [], response_deadline_at: at(0) }),
  },
  {
    title: "Pemilik yang juga penerima tawaran",
    me: ME.owner,
    offered: true,
    order: makeOrder({ status: "PENDING_ACCEPTANCE", ...nowMode, assigned_worker: null, crew: [], response_deadline_at: at(4) }),
  },
  {
    title: "Pemilik sekaligus penanggung jawab, 61 menit sebelum jadwal",
    me: ME.owner,
    order: makeOrder({ status: "PAID", scheduled_at: at(61), ...ownerAssigned }),
  },
  {
    title: "Pelanggan, kode verifikasi kedaluwarsa",
    me: ME.client,
    order: makeOrder({ status: "AWAITING_VERIFICATION" }),
    ctx: { verification: { code: "482915", expires_at: at(-1), locked_until: null } },
  },
  {
    title: "Pelanggan, pesanan selesai",
    me: ME.client,
    order: makeOrder({ status: "COMPLETED", completed_at: at(-30), settlement_due_at: at(23 * 60) }),
  },
  {
    title: "Pendamping, sudah dibayar",
    me: ME.crew,
    order: makeOrder({ status: "PAID" }),
  },
]

export function OrderActionsDemo() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-medium text-muted-foreground">Waktu acuan {formatTanggalJam(NOW.toISOString())}</p>
      <ul className="grid gap-4 md:grid-cols-2">
        {SCENARIOS.map(({ title, me, order, offered, ctx }) => {
          const actions = getOrderActions(order, getViewer(order, me, { offered }), NOW, ctx)
          return (
            <li key={title} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold">{title}</p>
                <div className="flex flex-wrap gap-2">
                  <ModeBadge mode={order.booking_mode} />
                  <StatusBadge status={order.status} />
                </div>
              </div>
              {actions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tanpa aksi, hanya baca.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {actions.map((action) => (
                    <Button key={action.id} variant={action.variant} size="sm" disabled={!action.enabled}>
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
              {actions
                .filter((a) => a.disabledReason)
                .map((a) => (
                  <p key={a.id} className="text-xs font-medium text-muted-foreground">
                    {a.label}: {a.disabledReason}
                  </p>
                ))}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
