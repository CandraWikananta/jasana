import { ALLOWED_TRANSITIONS, type OrderStatus } from "@jasana/shared"
import { describe, expect, it } from "vitest"
import type { Me } from "@/types/api/auth"
import type { OrderDetail, VerificationCodeDto } from "@/types/api/order"
import { IDS, ME, NOW, at, makeOrder } from "./order-actions.fixtures"
import { getOrderActions, getViewer, type OrderActionContext } from "./order-actions"

const STATUSES = Object.keys(ALLOWED_TRANSITIONS) as OrderStatus[]

/** Order yang masuk akal untuk tiap status: kolom waktu terisi sesuai alurnya. */
function orderIn(status: OrderStatus, overrides: Partial<OrderDetail> = {}): OrderDetail {
  const pending = status === "PENDING_ACCEPTANCE"
  const done = status === "COMPLETED" || status === "SETTLED" || status === "DISPUTED"
  return makeOrder({
    status,
    assigned_worker: pending ? null : { id: IDS.worker, name: "Putu Arsana" },
    crew: pending ? [] : [{ id: IDS.crew, display_name: "Kadek Wira" }],
    response_deadline_at: at(30),
    payment_deadline_at: pending ? null : at(10),
    completed_at: done ? at(-30) : null,
    settlement_due_at: status === "COMPLETED" ? at(23 * 60) : status === "SETTLED" ? at(-60) : null,
    ...overrides,
  })
}

function actionsFor(order: OrderDetail, me: Me, ctx?: OrderActionContext, offered?: boolean) {
  return getOrderActions(order, getViewer(order, me, { offered }), NOW, ctx)
}

const ids = (order: OrderDetail, me: Me, ctx?: OrderActionContext, offered?: boolean) =>
  actionsFor(order, me, ctx, offered).map((a) => a.id)

type Who = keyof typeof ME
const NOW_MODE = { booking_mode: "AVAILABLE_NOW", scheduled_at: null } as const

// Satu baris per baris tabel Matriks Bagian 2. Mode bawaan SCHEDULED.
const MATRIX: [string, OrderStatus, Who, string[], Partial<OrderDetail>?][] = [
  ["2.1 C", "PENDING_ACCEPTANCE", "client", ["cancel"]],
  ["2.1 O Terjadwal", "PENDING_ACCEPTANCE", "owner", ["accept", "reject"]],
  ["2.1 O Sekarang, bukan penerima", "PENDING_ACCEPTANCE", "owner", ["accept", "reject"], NOW_MODE],
  ["2.1 Wo", "PENDING_ACCEPTANCE", "worker", ["claim", "skip_offer"], NOW_MODE],
  ["2.1 pekerja pada order Terjadwal", "PENDING_ACCEPTANCE", "worker", []],
  ["2.1 A", "PENDING_ACCEPTANCE", "admin", []],
  ["2.2 C", "ACCEPTED", "client", ["pay", "cancel"]],
  ["2.2 O Terjadwal", "ACCEPTED", "owner", ["reassign", "edit_crew", "cancel"]],
  ["2.2 O Sekarang", "ACCEPTED", "owner", ["reassign", "cancel"], NOW_MODE],
  ["2.2 W", "ACCEPTED", "worker", []],
  ["2.2 K", "ACCEPTED", "crew", []],
  ["2.2 A", "ACCEPTED", "admin", []],
  ["2.3 C", "PAID", "client", ["cancel"]],
  ["2.3 O", "PAID", "owner", ["reassign", "edit_crew", "cancel"]],
  ["2.3 W", "PAID", "worker", ["depart"]],
  ["2.3 K", "PAID", "crew", []],
  ["2.3 A", "PAID", "admin", ["cancel"]],
  ["2.4 C", "ON_THE_WAY", "client", ["cancel"]],
  ["2.4 O", "ON_THE_WAY", "owner", ["cancel"]],
  ["2.4 W", "ON_THE_WAY", "worker", ["check_in"]],
  ["2.4 K", "ON_THE_WAY", "crew", []],
  ["2.4 A", "ON_THE_WAY", "admin", ["cancel"]],
  ["2.5 C", "ARRIVED", "client", ["open_dispute"]],
  ["2.5 O", "ARRIVED", "owner", ["open_dispute"]],
  ["2.5 W", "ARRIVED", "worker", ["start"]],
  ["2.5 A", "ARRIVED", "admin", []],
  ["2.6 C", "IN_PROGRESS", "client", ["open_dispute"]],
  ["2.6 O", "IN_PROGRESS", "owner", ["open_dispute"]],
  ["2.6 W", "IN_PROGRESS", "worker", ["finish"]],
  ["2.6 A", "IN_PROGRESS", "admin", []],
  ["2.7 C tanpa data kode", "AWAITING_VERIFICATION", "client", ["open_dispute"]],
  ["2.7 O", "AWAITING_VERIFICATION", "owner", ["open_dispute"]],
  ["2.7 W", "AWAITING_VERIFICATION", "worker", ["verify"]],
  ["2.7 A", "AWAITING_VERIFICATION", "admin", []],
  ["2.8 C", "COMPLETED", "client", ["review", "open_dispute"]],
  ["2.8 O", "COMPLETED", "owner", ["open_dispute"]],
  ["2.8 W", "COMPLETED", "worker", []],
  ["2.8 A", "COMPLETED", "admin", []],
  ["2.9 C", "DISPUTED", "client", ["add_evidence"]],
  ["2.9 O", "DISPUTED", "owner", ["add_evidence"]],
  ["2.9 W", "DISPUTED", "worker", []],
  ["2.9 A", "DISPUTED", "admin", []],
  ["2.10 SETTLED C", "SETTLED", "client", ["review"]],
  ["2.10 SETTLED O", "SETTLED", "owner", []],
  ["2.10 SETTLED W", "SETTLED", "worker", []],
  ...(["REJECTED", "EXPIRED", "PAYMENT_EXPIRED", "CANCELLED", "REFUNDED"] as const).flatMap((status) =>
    (["client", "owner", "worker", "admin"] as const).map(
      (who) => [`2.10 ${status} ${who}`, status, who, []] as [string, OrderStatus, Who, string[]],
    ),
  ),
]

describe("getOrderActions, Matriks Bagian 2", () => {
  it.each(MATRIX)("%s", (_name, status, who, expected, overrides) => {
    expect(ids(orderIn(status, overrides), ME[who])).toEqual(expected)
  })
})

describe("kombinasi kapabilitas", () => {
  const ownerAssigned = { assigned_worker: { id: IDS.ownerWorker, name: "Pemilik" } }

  it("pemilik BUSINESS sekaligus penanggung jawab: gabungan, Berangkat yang menonjol", () => {
    const actions = actionsFor(orderIn("PAID", { ...ownerAssigned, scheduled_at: at(30) }), ME.owner)
    expect(actions.map((a) => [a.id, a.variant])).toEqual([
      ["depart", "primary"],
      ["reassign", "secondary"],
      ["edit_crew", "secondary"],
      ["cancel", "destructive"],
    ])
  })

  it("pemilik INDIVIDUAL sekaligus penanggung jawab: tanpa reassign dan edit_crew", () => {
    expect(ids(orderIn("PAID", ownerAssigned), ME.individualOwner)).toEqual(["depart", "cancel"])
    expect(ids(orderIn("ACCEPTED", ownerAssigned), ME.individualOwner)).toEqual(["cancel"])
    expect(ids(orderIn("IN_PROGRESS", ownerAssigned), ME.individualOwner)).toEqual(["finish", "open_dispute"])
  })

  it("pemilik yang juga penerima tawaran: Ambil menonjol, Terima turun jadi secondary", () => {
    const actions = actionsFor(orderIn("PENDING_ACCEPTANCE", NOW_MODE), ME.owner, undefined, true)
    expect(actions.map((a) => [a.id, a.variant])).toEqual([
      ["claim", "now"],
      ["accept", "secondary"],
      ["reject", "destructive"],
    ])
  })

  it("pendamping saja tidak pernah mendapat aksi", () => {
    // Pendamping baru ada sejak ACCEPTED. Di PENDING_ACCEPTANCE akun ini hanya pekerja biasa.
    for (const status of STATUSES.filter((s) => s !== "PENDING_ACCEPTANCE")) {
      expect(ids(orderIn(status), ME.crew), status).toEqual([])
      expect(ids(orderIn(status, NOW_MODE), ME.crew), status).toEqual([])
    }
  })

  it("pemilik yang usahanya belum VERIFIED tidak mendapat aksi pemilik", () => {
    expect(ids(orderIn("PENDING_ACCEPTANCE"), ME.pendingOwner)).toEqual([])
    expect(ids(orderIn("ACCEPTED"), ME.pendingOwner)).toEqual([])
  })
})

describe("batas waktu", () => {
  it("Berangkat Terjadwal 61 menit sebelum jadwal nonaktif, 60 menit aktif", () => {
    const early = actionsFor(orderIn("PAID", { scheduled_at: at(61) }), ME.worker)[0]!
    expect(early).toMatchObject({ id: "depart", enabled: false, disabledReason: "Bisa berangkat mulai pukul 10.01 WITA" })
    expect(actionsFor(orderIn("PAID", { scheduled_at: at(60) }), ME.worker)[0]).toMatchObject({ id: "depart", enabled: true })
  })

  it("Berangkat Sekarang langsung aktif", () => {
    expect(actionsFor(orderIn("PAID", NOW_MODE), ME.worker)[0]).toMatchObject({ id: "depart", enabled: true })
  })

  it("komplain tepat di settlement_due_at masih muncul, 1 detik sesudahnya tidak", () => {
    expect(ids(orderIn("COMPLETED", { settlement_due_at: NOW.toISOString() }), ME.owner)).toEqual(["open_dispute"])
    const lewat = new Date(NOW.getTime() - 1000).toISOString()
    expect(ids(orderIn("COMPLETED", { settlement_due_at: lewat }), ME.owner)).toEqual([])
    expect(ids(orderIn("COMPLETED", { settlement_due_at: lewat }), ME.client)).toEqual(["review"])
  })

  it("hitung mundur respons habis: Terima, Ambil, Lewati nonaktif, Tolak tetap", () => {
    const habis = { ...NOW_MODE, response_deadline_at: NOW.toISOString() }
    const owner = actionsFor(orderIn("PENDING_ACCEPTANCE", habis), ME.owner)
    expect(owner.find((a) => a.id === "accept")).toMatchObject({ enabled: false, disabledReason: "Waktu respons habis" })
    expect(owner.find((a) => a.id === "reject")).toMatchObject({ enabled: true })
    for (const action of actionsFor(orderIn("PENDING_ACCEPTANCE", habis), ME.worker)) {
      expect(action).toMatchObject({ enabled: false, disabledReason: "Waktu respons habis" })
    }
  })

  it("hitung mundur pembayaran habis: Bayar nonaktif, Batalkan tetap", () => {
    const actions = actionsFor(orderIn("ACCEPTED", { payment_deadline_at: at(-1) }), ME.client)
    expect(actions[0]).toMatchObject({ id: "pay", enabled: false, disabledReason: "Batas pembayaran habis" })
    expect(actions[1]).toMatchObject({ id: "cancel", enabled: true })
  })

  describe("Minta kode baru (D111)", () => {
    const code = (expiresIn: number, lockedIn: number | null): OrderActionContext => ({
      verification: { code: "482915", expires_at: at(expiresIn), locked_until: lockedIn === null ? null : at(lockedIn) } satisfies VerificationCodeDto,
    })
    const order = orderIn("AWAITING_VERIFICATION")

    it("kode masih berlaku: tidak ditawarkan", () => {
      expect(ids(order, ME.client, code(5, null))).toEqual(["open_dispute"])
    })
    it("kode kedaluwarsa: ditawarkan dan aktif", () => {
      expect(actionsFor(order, ME.client, code(-1, null))[0]).toMatchObject({ id: "request_new_code", enabled: true, variant: "primary" })
    })
    it("kedaluwarsa tapi masih terkunci: nonaktif sampai kunci lepas", () => {
      expect(actionsFor(order, ME.client, code(-1, 15))[0]).toMatchObject({
        id: "request_new_code",
        enabled: false,
        disabledReason: "Bisa diminta lagi mulai pukul 10.15 WITA",
      })
      expect(actionsFor(order, ME.client, code(-1, -1))[0]).toMatchObject({ id: "request_new_code", enabled: true })
    })
    it("tidak pernah ditawarkan ke pekerja", () => {
      expect(ids(order, ME.worker, code(-1, null))).toEqual(["verify"])
    })
  })
})

describe("aturan menyeluruh", () => {
  const viewers: [string, Me, boolean?][] = [
    ["client", ME.client],
    ["owner", ME.owner],
    ["owner ditawari", ME.owner, true],
    ["individualOwner", ME.individualOwner, true],
    ["worker", ME.worker],
    ["crew", ME.crew],
    ["admin", ME.admin],
  ]
  const ownerAssigned = { assigned_worker: { id: IDS.ownerWorker, name: "Pemilik" } }

  it("edit_crew tidak pernah muncul pada mode Sekarang", () => {
    for (const status of STATUSES) {
      for (const order of [orderIn(status, NOW_MODE), orderIn(status, { ...NOW_MODE, ...ownerAssigned })]) {
        expect(ids(order, ME.owner, undefined, true), status).not.toContain("edit_crew")
      }
    }
  })

  it("pekerja yang bukan pemilik tidak pernah mendapat cancel", () => {
    for (const status of STATUSES) {
      for (const order of [orderIn(status), orderIn(status, NOW_MODE)]) {
        expect(ids(order, ME.worker), status).not.toContain("cancel")
        expect(ids(order, ME.crew), status).not.toContain("cancel")
      }
    }
  })

  it("paling banyak satu aksi menonjol di setiap status, mode, dan penampil", () => {
    for (const status of STATUSES) {
      for (const overrides of [{}, NOW_MODE, ownerAssigned, { ...NOW_MODE, ...ownerAssigned }]) {
        for (const [name, me, offered] of viewers) {
          const loud = actionsFor(orderIn(status, overrides), me, undefined, offered).filter(
            (a) => a.variant === "primary" || a.variant === "now",
          )
          expect(loud.length, `${status} ${name}`).toBeLessThanOrEqual(1)
        }
      }
    }
  })

  it("teks konfirmasi batal berbeda sebelum dan sesudah bayar", () => {
    const sebelum = actionsFor(orderIn("ACCEPTED"), ME.client).find((a) => a.id === "cancel")!
    const sesudahClient = actionsFor(orderIn("PAID"), ME.client).find((a) => a.id === "cancel")!
    const sesudahOwner = actionsFor(orderIn("PAID"), ME.owner).find((a) => a.id === "cancel")!
    expect(sebelum).toMatchObject({ needsConfirm: true, confirmText: "Pesanan dibatalkan." })
    expect(sesudahClient.confirmText).toBe("Pesanan dibatalkan dan dananya dikembalikan kepadamu.")
    expect(sesudahOwner.confirmText).toBe("Pesanan dibatalkan dan dana dikembalikan ke pelanggan.")
  })
})

describe("getViewer", () => {
  it("client", () => {
    expect(getViewer(orderIn("PAID"), ME.client)).toMatchObject({ isClient: true, isOwner: false, isAssignee: false, providerType: null })
  })

  it("pemilik VERIFIED usaha yang sama, bukan usaha lain", () => {
    expect(getViewer(orderIn("PAID"), ME.owner)).toMatchObject({ isOwner: true, providerType: "BUSINESS", isAssignee: false })
    const lain = orderIn("PAID", { provider: { id: IDS.otherProvider, business_name: null } })
    expect(getViewer(lain, ME.owner).isOwner).toBe(false)
  })

  it("profil usaha PENDING bukan pemilik dalam arti order", () => {
    expect(getViewer(orderIn("PAID"), ME.pendingOwner).isOwner).toBe(false)
  })

  it("penanggung jawab dan pendamping", () => {
    expect(getViewer(orderIn("PAID"), ME.worker)).toMatchObject({ isAssignee: true, isCrew: false })
    expect(getViewer(orderIn("PAID"), ME.crew)).toMatchObject({ isAssignee: false, isCrew: true })
  })

  it("penerima tawaran: pekerja usaha itu pada order Sekarang yang masih menunggu", () => {
    expect(getViewer(orderIn("PENDING_ACCEPTANCE", NOW_MODE), ME.worker).isOfferRecipient).toBe(true)
    expect(getViewer(orderIn("PENDING_ACCEPTANCE"), ME.worker).isOfferRecipient).toBe(false)
    expect(getViewer(orderIn("ACCEPTED", NOW_MODE), ME.worker).isOfferRecipient).toBe(false)
    const lain = orderIn("PENDING_ACCEPTANCE", { ...NOW_MODE, provider: { id: IDS.otherProvider, business_name: null } })
    expect(getViewer(lain, ME.worker).isOfferRecipient).toBe(false)
  })

  it("pemilik hanya penerima tawaran kalau ada petunjuk offered", () => {
    const order = orderIn("PENDING_ACCEPTANCE", NOW_MODE)
    expect(getViewer(order, ME.owner).isOfferRecipient).toBe(false)
    expect(getViewer(order, ME.owner, { offered: true }).isOfferRecipient).toBe(true)
  })

  it("admin", () => {
    expect(getViewer(orderIn("PAID"), ME.admin)).toMatchObject({ isAdmin: true, isClient: false })
  })
})
