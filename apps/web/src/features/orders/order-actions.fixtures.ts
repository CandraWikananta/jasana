import type { Me } from "@/types/api/auth"
import type { OrderDetail } from "@/types/api/order"

// Data contoh untuk test getOrderActions dan galeri /dev/ui. Bentuknya mengikuti OrderDto asli.

export const IDS = {
  client: "00000000-0000-4000-8000-000000000001",
  ownerUser: "00000000-0000-4000-8000-000000000002",
  workerUser: "00000000-0000-4000-8000-000000000003",
  crewUser: "00000000-0000-4000-8000-000000000004",
  adminUser: "00000000-0000-4000-8000-000000000005",
  provider: "10000000-0000-4000-8000-000000000001",
  otherProvider: "10000000-0000-4000-8000-000000000002",
  ownerWorker: "20000000-0000-4000-8000-000000000002",
  worker: "20000000-0000-4000-8000-000000000003",
  crew: "20000000-0000-4000-8000-000000000004",
  order: "30000000-0000-4000-8000-000000000001",
} as const

/** Waktu acuan seluruh contoh: Rabu 18 Nov 2026, 10.00 WITA. */
export const NOW = new Date("2026-11-18T02:00:00.000Z")

export const at = (minutesFromNow: number) => new Date(NOW.getTime() + minutesFromNow * 60_000).toISOString()

export function makeOrder(overrides: Partial<OrderDetail> = {}): OrderDetail {
  return {
    id: IDS.order,
    order_number: "ORD-20261118-0001",
    status: "PAID",
    booking_mode: "SCHEDULED",
    scheduled_at: at(24 * 60),
    client_id: IDS.client,
    provider: { id: IDS.provider, business_name: "Lensa Dewata Production" },
    listing: { id: "40000000-0000-4000-8000-000000000001", title: "Dokumentasi acara" },
    assigned_worker: { id: IDS.worker, name: "Putu Arsana" },
    crew: [{ id: IDS.crew, display_name: "Kadek Wira" }],
    service: {
      address: "Jl. Tukad Badung No. 10, Renon",
      latitude: -8.67,
      longitude: 115.23,
      notes: null,
      location_source: "SAVED_ADDRESS",
      location_accuracy_m: null,
    },
    duration_minutes: 180,
    attributes: {},
    price: {
      listing_base_amount: 1_500_000,
      options: [],
      options_amount: 0,
      total_amount: 1_500_000,
      platform_fee: 150_000,
      provider_earning: 1_350_000,
    },
    response_deadline_at: null,
    payment_deadline_at: null,
    payment: null,
    accepted_at: at(-120),
    paid_at: at(-60),
    started_at: null,
    completed_at: null,
    settlement_due_at: null,
    cancelled_at: null,
    cancelled_by: null,
    cancellation_reason: null,
    created_at: at(-180),
    updated_at: at(-60),
    ...overrides,
  }
}

function makeMe(id: string, overrides: Partial<Me> = {}): Me {
  return {
    id,
    full_name: "Pengguna Contoh",
    email: `${id.slice(-4)}@contoh.test`,
    pending_email: null,
    phone: "081200000000",
    role: "CLIENT",
    avatar_url: null,
    email_verified: true,
    email_verified_at: at(-10_000),
    created_at: at(-20_000),
    provider: null,
    worker: null,
    ...overrides,
  }
}

const verifiedBusiness = { id: IDS.provider, provider_type: "BUSINESS", verification_status: "VERIFIED" } as const

export const ME = {
  client: makeMe(IDS.client),
  /** Pemilik BUSINESS, otomatis juga pekerja di usahanya (D33). */
  owner: makeMe(IDS.ownerUser, {
    provider: verifiedBusiness,
    worker: { id: IDS.ownerWorker, provider_profile_id: IDS.provider, is_owner: true },
  }),
  /** Pemilik INDIVIDUAL: satu-satunya pekerja usahanya. */
  individualOwner: makeMe(IDS.ownerUser, {
    provider: { id: IDS.provider, provider_type: "INDIVIDUAL", verification_status: "VERIFIED" },
    worker: { id: IDS.ownerWorker, provider_profile_id: IDS.provider, is_owner: true },
  }),
  /** Pemilik yang usahanya belum VERIFIED: bukan aktor PROVIDER. */
  pendingOwner: makeMe(IDS.ownerUser, {
    provider: { id: IDS.provider, provider_type: "BUSINESS", verification_status: "PENDING" },
  }),
  worker: makeMe(IDS.workerUser, {
    worker: { id: IDS.worker, provider_profile_id: IDS.provider, is_owner: false },
  }),
  crew: makeMe(IDS.crewUser, {
    worker: { id: IDS.crew, provider_profile_id: IDS.provider, is_owner: false },
  }),
  admin: makeMe(IDS.adminUser, { role: "ADMIN" }),
} satisfies Record<string, Me>
