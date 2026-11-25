import { describe, expect, it } from "vitest"
import type { ChatMessage, SendMessageResult } from "@/types/api/chat"
import type { ListingDetail } from "@/types/api/listing"
import { addSending, answerScrollTop, applyFailure, applyReply, isFailedReply, needsLocation, toListingCard } from "./conversation"

const message = (over: Partial<ChatMessage>): ChatMessage => ({
  id: "1",
  role: "USER",
  content: "halo",
  intent: null,
  recommended_listing_ids: [],
  created_at: "2026-11-25T00:00:00.000Z",
  ...over,
})
const REPLY: SendMessageResult = {
  user_message: message({ id: "10" }),
  assistant_message: message({ id: "11", role: "ASSISTANT", content: "Halo!", intent: "sapaan" }),
  intent: "sapaan",
  recommendations: [],
  guest_quota: { limit: 20, used: 1, remaining: 19 },
}

describe("percakapan", () => {
  it("pesan lokal diganti pasangan dari server, tanpa ganda", () => {
    const sent = addSending([message({ id: "9" })], "lokal", "halo")
    expect(sent.map((m) => [m.id, m.state])).toEqual([
      ["9", undefined],
      ["lokal", "sending"],
    ])
    const done = applyReply(sent, "lokal", REPLY, true)
    expect(done.map((m) => m.id)).toEqual(["9", "10", "11"])
    expect(done[2]).toMatchObject({ live: true, sentWithLocation: true, quota: { remaining: 19 } })
  })

  it("kegagalan Gemini tercatat sebagai pasangan seperti di riwayat (D161), lalu diganti saat dikirim lagi", () => {
    const failed = applyFailure(addSending([], "lokal", "halo"), "lokal", { kind: "gemini", message: "x" })
    expect(failed).toHaveLength(2)
    expect(failed[0]!.state).toBeUndefined()
    expect(isFailedReply(failed[1]!)).toBe(true)
    const again = addSending(failed, "lokal2", "halo", failed.map((m) => m.id))
    expect(again.map((m) => m.id)).toEqual(["lokal2"])
  })

  it("kegagalan lain menandai pesannya saja", () => {
    const failed = applyFailure(addSending([], "lokal", "halo"), "lokal", { kind: "retry", message: "x" })
    expect(failed).toMatchObject([{ id: "lokal", state: "failed", failure: { kind: "retry" } }])
    expect(applyFailure(failed, "lain", { kind: "ended", message: "y" })).toEqual(failed)
  })

  it("butuh lokasi hanya untuk cari_jasa tanpa hasil yang dikirim tanpa koordinat", () => {
    const base = message({ role: "ASSISTANT", intent: "cari_jasa" })
    expect(needsLocation(base)).toBe(true)
    expect(needsLocation({ ...base, sentWithLocation: true })).toBe(false)
    expect(needsLocation({ ...base, recommended_listing_ids: ["a"] })).toBe(false)
    expect(needsLocation({ ...base, intent: "perlu_klarifikasi" })).toBe(false)
  })
})

describe("answerScrollTop", () => {
  const area = { height: 500, padding: 16 }
  it("jawaban pendek sampai ke bawah, jawaban tinggi dari awalnya, dan tidak pernah negatif", () => {
    expect(answerScrollTop(area, { top: 800, height: 100 })).toBe(416)
    expect(answerScrollTop(area, { top: 800, height: 900 })).toBe(784)
    expect(answerScrollTop(area, { top: 20, height: 100 })).toBe(0)
  })
})

describe("toListingCard", () => {
  it("memilih foto utama, dan jarak kosong karena detail tidak membawanya", () => {
    const detail = {
      id: "l1",
      title: "Servis AC",
      price: 75000,
      provider: { id: "p1", business_name: null, provider_type: "INDIVIDUAL", rating_average: 4.5, rating_count: 2 },
      photos: [
        { id: "a", file_url: "a.png", is_primary: false },
        { id: "b", file_url: "b.png", is_primary: true },
      ],
    } as unknown as ListingDetail
    expect(toListingCard(detail)).toMatchObject({ id: "l1", price: 75000, primary_photo_url: "b.png", distance_km: null })
    expect(toListingCard({ ...detail, photos: [] }).primary_photo_url).toBeNull()
  })
})
