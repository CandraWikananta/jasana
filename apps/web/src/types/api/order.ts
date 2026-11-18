import type { BookingMode, OrderActorType, OrderStatus } from "@jasana/shared"

// Bentuk JSON order (apps/api/src/modules/orders/orders.mapper.ts toOrderDto). snake_case,
// uang integer rupiah, waktu ISO 8601 UTC. Kode verifikasi tidak pernah ikut (D60).

export type LocationSource = "SAVED_ADDRESS" | "CURRENT_LOCATION" | "MAP_PIN"
export type PaymentStatus = "PENDING" | "PAID" | "EXPIRED" | "FAILED"

/** Satu baris opsi terpilih yang sudah dihitung server (order-pricing.ts PricedLine). */
export interface PricedLine {
  attribute_key: string
  label: string
  option_value: string | null
  quantity: number
  unit_delta: number
  amount: number
}

export interface OrderPayment {
  status: PaymentStatus
  amount: number
  invoice_url: string | null
  expires_at: string | null
  paid_at: string | null
}

export interface OrderDetail {
  id: string
  order_number: string
  status: OrderStatus
  booking_mode: BookingMode
  scheduled_at: string | null
  client_id: string
  provider: { id: string; business_name: string | null }
  listing: { id: string; title: string }
  assigned_worker: { id: string; name: string | null } | null
  crew: { id: string; display_name: string }[]
  service: {
    address: string
    latitude: number
    longitude: number
    notes: string | null
    location_source: LocationSource
    location_accuracy_m: number | null
  }
  duration_minutes: number | null
  attributes: Record<string, unknown>
  price: {
    listing_base_amount: number
    options: PricedLine[]
    options_amount: number
    total_amount: number
    platform_fee: number
    provider_earning: number
  }
  response_deadline_at: string | null
  payment_deadline_at: string | null
  payment: OrderPayment | null
  accepted_at: string | null
  paid_at: string | null
  started_at: string | null
  completed_at: string | null
  settlement_due_at: string | null
  cancelled_at: string | null
  cancelled_by: OrderActorType | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

/** GET dan POST /orders/:id/verification-code, hanya untuk client (D60, D111). */
export interface VerificationCodeDto {
  code: string
  expires_at: string
  locked_until: string | null
}

/** Pesan dalam order (order-messages.service.ts), juga payload event `order:message`. */
export interface OrderMessageDto {
  id: string
  order_id: string
  sender_user_id: string
  sender_role: OrderActorType
  sender_name: string
  content: string
  read_at: string | null
  created_at: string
}
