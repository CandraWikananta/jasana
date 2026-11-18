import type { OrderStatus } from "@jasana/shared"
import type { QueryClient, QueryKey } from "@tanstack/react-query"
import type { OrderMessageDto } from "@/types/api/order"
import { qk } from "./query-keys"

// Event Socket.IO dari apps/api (realtime/socket.ts dan pemanggil emit di modul orders dan
// notifications). Socket hanya pemicu (D217, aturan web 13): event memicu invalidasi cache,
// data tetap diambil ulang lewat REST.

export interface OrderStatusChangedPayload {
  order_id: string
  from_status: OrderStatus | null
  to_status: OrderStatus
  timestamp: string
}

export interface OrderAssignmentChangedPayload {
  order_id: string
  from_worker_name: string | null
  to_worker_name: string
}

interface OfferSummary {
  order_id: string
  order_number: string
  listing_title: string
  service_address: string
  total_amount: number
  response_deadline_at: string
}

/** Ke room user pekerja membawa `distance_meters`, ke room provider membawa `recipient_count`. */
export type OrderOfferPayload = OfferSummary & ({ distance_meters: number } | { recipient_count: number })

export interface OrderOfferClosedPayload {
  order_id: string
  reason: "CLAIMED" | "EXPIRED"
}

/** Hanya relay, tidak ditulis ke basis data (D112). */
export interface OrderLocationUpdatePayload {
  order_id: string
  latitude: number
  longitude: number
  timestamp: string
}

export interface NotificationPayload {
  id: string
  type: string
  title: string
  body: string
  reference_type: string | null
  reference_id: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface ServerEvents {
  "order:status_changed": OrderStatusChangedPayload
  "order:assignment_changed": OrderAssignmentChangedPayload
  "order:offer": OrderOfferPayload
  "order:offer_closed": OrderOfferClosedPayload
  "order:location_update": OrderLocationUpdatePayload
  "order:message": OrderMessageDto
  "notification:new": NotificationPayload
}

const orderId = (payload: unknown): string | null => {
  const id = (payload as { order_id?: unknown } | null)?.order_id
  return typeof id === "string" ? id : null
}

/** Kunci query yang basi karena satu event (PRD Frontend 7.3). Event tak dikenal: tidak ada. */
export function invalidationsFor(event: string, payload: unknown): QueryKey[] {
  const id = orderId(payload)
  switch (event) {
    case "order:status_changed": {
      const keys: QueryKey[] = [qk.orders.lists, qk.worker.orders]
      if (id) keys.push(qk.orders.detail(id))
      const to = (payload as Partial<OrderStatusChangedPayload>).to_status
      if (to === "SETTLED" || to === "REFUNDED") keys.push(qk.wallet)
      return keys
    }
    case "order:assignment_changed":
      return id ? [qk.orders.detail(id), qk.worker.orders] : [qk.worker.orders]
    case "order:message":
      return id ? [qk.orders.messages(id)] : []
    case "order:offer":
    case "order:offer_closed":
      return [qk.worker.orders, qk.orders.lists]
    case "notification:new":
      return [qk.notifications]
    // order:location_update menggerakkan penanda peta lewat onSocketEvent, tanpa invalidasi.
    default:
      return []
  }
}

/**
 * Event selama koneksi putus hilang, jadi setelah tersambung ULANG seluruh data yang biasanya
 * diperbarui socket dianggap basi. Awalan ["orders"] mencakup daftar, detail, dan pesan.
 */
export const RECONNECT_INVALIDATIONS: QueryKey[] = [qk.orders.all, qk.worker.orders, qk.notifications]

export function createRealtimeHandlers(client: QueryClient) {
  const invalidate = (keys: QueryKey[]) => {
    for (const queryKey of keys) void client.invalidateQueries({ queryKey })
  }
  return {
    onEvent: (event: string, payload: unknown) => invalidate(invalidationsFor(event, payload)),
    onReconnect: () => invalidate(RECONNECT_INVALIDATIONS),
  }
}
