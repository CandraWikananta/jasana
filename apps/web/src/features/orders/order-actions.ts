import type { OrderStatus } from "@jasana/shared"
import { getCapabilities } from "@/features/auth/capabilities"
import { formatJam } from "@/lib/time"
import type { Me } from "@/types/api/auth"
import type { OrderDetail, VerificationCodeDto } from "@/types/api/order"

// Satu pintu tombol aksi order (D214, Matriks-UI-Order Bagian 7), padanan transitionOrder() di
// backend. Murni: tanpa fetch, tanpa hook, tanpa Date.now(). Server tetap penentu; fungsi ini
// hanya menentukan tombol yang DITAWARKAN.

export type OrderActionId =
  | "cancel" | "accept" | "reject" | "claim" | "skip_offer"
  | "pay" | "reassign" | "edit_crew"
  | "depart" | "check_in" | "start" | "finish" | "verify"
  | "request_new_code" | "open_dispute" | "add_evidence" | "review"

export interface Viewer {
  isClient: boolean
  isOwner: boolean
  isAssignee: boolean
  isCrew: boolean
  isOfferRecipient: boolean
  isAdmin: boolean
  providerType: "INDIVIDUAL" | "BUSINESS" | null
}

export interface OrderAction {
  id: OrderActionId
  label: string
  variant: "primary" | "secondary" | "destructive" | "now"
  enabled: boolean
  disabledReason?: string
  needsConfirm: boolean
  /** Isi dialog konfirmasi. Ada di sini supaya dialog tidak perlu bercabang status (Matriks 3.4). */
  confirmText?: string
}

/** Data di luar OrderDto. `verification` dari GET /orders/:id/verification-code, hanya client. */
export interface OrderActionContext {
  verification?: VerificationCodeDto | null
}

// shortcut: salinan DEPART_EARLY_MINUTES di apps/api order-execution.service.ts (guard T8), karena
// backend belum mengeksposnya. Ganti dengan field server begitu OrderDto memuatnya.
export const DEPART_EARLY_MINUTES = 60

const LABEL: Record<OrderActionId, string> = {
  cancel: "Batalkan pesanan",
  accept: "Terima",
  reject: "Tolak",
  claim: "Ambil",
  skip_offer: "Lewati",
  pay: "Bayar sekarang",
  reassign: "Ganti penanggung jawab",
  edit_crew: "Atur pendamping",
  depart: "Berangkat",
  check_in: "Saya sudah sampai",
  start: "Mulai kerjakan",
  finish: "Tandai selesai",
  verify: "Verifikasi",
  request_new_code: "Minta kode baru",
  open_dispute: "Ajukan komplain",
  add_evidence: "Tambah bukti",
  review: "Beri ulasan",
}

// Urutan tampil. Aksi pelaksanaan di depan, sehingga saat dua kapabilitas sama-sama punya aksi
// utama, aksi pelaksanaan yang tetap menonjol (Matriks 7). Batalkan dan Tolak selalu paling akhir.
const ORDER: OrderActionId[] = [
  "claim", "depart", "check_in", "start", "finish", "verify",
  "accept", "pay", "request_new_code", "review",
  "reassign", "edit_crew", "skip_offer", "open_dispute", "add_evidence",
  "reject", "cancel",
]

const DISPUTABLE = new Set<OrderStatus>(["ARRIVED", "IN_PROGRESS", "AWAITING_VERIFICATION", "COMPLETED"])

const CANCEL_BY: Partial<Record<OrderStatus, (v: Viewer) => boolean>> = {
  PENDING_ACCEPTANCE: (v) => v.isClient,
  ACCEPTED: (v) => v.isClient || v.isOwner,
  PAID: (v) => v.isClient || v.isOwner || v.isAdmin,
  ON_THE_WAY: (v) => v.isClient || v.isOwner || v.isAdmin,
}

export function getViewer(order: OrderDetail, me: Me, opts: { offered?: boolean } = {}): Viewer {
  const caps = getCapabilities(me)
  const isOwner = caps.isVerifiedProvider && me.provider?.id === order.provider.id
  const workerId = me.worker?.id
  // OrderDto tidak memuat daftar penerima tawaran. Server hanya memperlihatkan order
  // PENDING_ACCEPTANCE Available Now ke pekerja bukan pemilik kalau dia penerima yang belum
  // menolak, jadi bagi mereka "bisa melihat" berarti "ditawari". Pemilik melihat seluruh order
  // usahanya, jadi butuh petunjuk `offered` dari daftar `?as=worker` atau event `order:offer`.
  const offerOpen =
    order.status === "PENDING_ACCEPTANCE" &&
    order.booking_mode === "AVAILABLE_NOW" &&
    me.worker?.provider_profile_id === order.provider.id
  return {
    isClient: order.client_id === me.id,
    isOwner,
    isAssignee: workerId !== undefined && order.assigned_worker?.id === workerId,
    isCrew: workerId !== undefined && order.crew.some((c) => c.id === workerId),
    isOfferRecipient: offerOpen && (isOwner ? opts.offered === true : true),
    isAdmin: caps.isAdmin,
    providerType: caps.providerType,
  }
}

const passed = (iso: string | null, now: Date) => iso !== null && now.getTime() >= new Date(iso).getTime()

export function getOrderActions(
  order: OrderDetail,
  viewer: Viewer,
  now: Date,
  ctx: OrderActionContext = {},
): OrderAction[] {
  const out = new Map<OrderActionId, OrderAction>()
  const add = (id: OrderActionId, variant: OrderAction["variant"], extra: Partial<OrderAction> = {}) => {
    if (!out.has(id)) out.set(id, { id, label: LABEL[id], variant, enabled: true, needsConfirm: false, ...extra })
  }
  const disabledIf = (cond: boolean, reason: string): Partial<OrderAction> =>
    cond ? { enabled: false, disabledReason: reason } : {}

  const { status } = order
  const business = viewer.providerType === "BUSINESS"
  const responseOver = disabledIf(passed(order.response_deadline_at, now), "Waktu respons habis")

  switch (status) {
    case "PENDING_ACCEPTANCE":
      if (viewer.isOfferRecipient) {
        add("claim", "now", responseOver)
        // Pemilik menolak lewat Tolak (T2). Lewati hanya untuk penerima yang bukan pemilik (Matriks 1).
        if (!viewer.isOwner) add("skip_offer", "secondary", responseOver)
      }
      if (viewer.isOwner) {
        add("accept", "primary", responseOver)
        add("reject", "destructive", { needsConfirm: true, confirmText: "Pesanan ini akan ditolak dan pelanggan diberi tahu." })
      }
      break
    case "ACCEPTED":
      if (viewer.isClient) add("pay", "primary", disabledIf(passed(order.payment_deadline_at, now), "Batas pembayaran habis"))
      break
    case "PAID":
      if (viewer.isAssignee) {
        const start = order.booking_mode === "SCHEDULED" && order.scheduled_at
          ? new Date(new Date(order.scheduled_at).getTime() - DEPART_EARLY_MINUTES * 60_000)
          : null
        add("depart", "primary", start && now < start
          ? { enabled: false, disabledReason: `Bisa berangkat mulai pukul ${formatJam(start.toISOString())}` }
          : {})
      }
      break
    case "ON_THE_WAY":
      if (viewer.isAssignee) add("check_in", "primary")
      break
    case "ARRIVED":
      if (viewer.isAssignee) add("start", "primary")
      break
    case "IN_PROGRESS":
      if (viewer.isAssignee) {
        add("finish", "primary", {
          needsConfirm: true,
          confirmText: "Pastikan pekerjaan sudah selesai. Pelanggan akan diminta memberikan kode verifikasi.",
        })
      }
      break
    case "AWAITING_VERIFICATION": {
      // OrderDto belum memuat verification_locked_until, jadi input pekerja tidak bisa dikunci di sini.
      if (viewer.isAssignee) add("verify", "primary")
      const code = ctx.verification
      if (viewer.isClient && code && passed(code.expires_at, now)) {
        const locked = code.locked_until !== null && !passed(code.locked_until, now)
        add("request_new_code", "primary", locked
          ? { enabled: false, disabledReason: `Bisa diminta lagi mulai pukul ${formatJam(code.locked_until!)}` }
          : {})
      }
      break
    }
    case "COMPLETED":
    case "SETTLED":
      // OrderDto belum memuat ada tidaknya ulasan; 409 REVIEW_ALREADY_EXISTS menyembunyikannya di W3.
      if (viewer.isClient && order.completed_at) add("review", "primary")
      break
    case "DISPUTED":
      if (viewer.isClient || viewer.isOwner) add("add_evidence", "secondary")
      break
  }

  // Pengelolaan oleh pemilik BUSINESS sebelum berangkat (Matriks 4).
  if (viewer.isOwner && business && (status === "ACCEPTED" || status === "PAID")) {
    add("reassign", "secondary")
    if (order.booking_mode === "SCHEDULED") add("edit_crew", "secondary")
  }

  // Komplain (Matriks 3.3). Membuka komplain selalu memindahkan order ke DISPUTED, jadi di status
  // ini order pasti belum punya komplain.
  const windowOpen = order.settlement_due_at === null || now.getTime() <= new Date(order.settlement_due_at).getTime()
  if (DISPUTABLE.has(status) && windowOpen && (viewer.isClient || viewer.isOwner)) add("open_dispute", "secondary")

  // Batalkan (Matriks 3.4). Pekerja yang bukan pemilik tidak pernah melihatnya.
  if (CANCEL_BY[status]?.(viewer)) {
    const paid = status === "PAID" || status === "ON_THE_WAY"
    add("cancel", "destructive", {
      needsConfirm: true,
      confirmText: !paid
        ? "Pesanan dibatalkan."
        : viewer.isClient
          ? "Pesanan dibatalkan dan dananya dikembalikan kepadamu."
          : "Pesanan dibatalkan dan dana dikembalikan ke pelanggan.",
    })
  }

  // Paling banyak satu aksi menonjol (primary atau now). Yang pertama menurut ORDER menang.
  let emphasized = false
  return [...out.values()]
    .sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id))
    .map((action) => {
      if (action.variant !== "primary" && action.variant !== "now") return action
      if (emphasized) return { ...action, variant: "secondary" as const }
      emphasized = true
      return action
    })
}
