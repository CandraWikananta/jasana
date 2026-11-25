import type { ChatMessage, GuestQuota, SendMessageResult } from "@/types/api/chat"
import type { ListingCard, ListingDetail } from "@/types/api/listing"
import type { ChatFailure } from "./chat-failure"

// Fungsi murni atas daftar pesan satu percakapan. Daftarnya satu sumber di cache query, termasuk pesan
// yang sedang dikirim, supaya pesan tidak pernah tampil dua kali.

export interface ConversationMessage extends ChatMessage {
  /** Hanya pesan pengguna yang belum dikonfirmasi server. */
  state?: "sending" | "failed"
  failure?: ChatFailure
  /** Kartu dari respons kirim. Riwayat dari server hanya membawa id-nya (calon H153). */
  recommendations?: ListingCard[]
  sentWithLocation?: boolean
  /** Balasan yang tiba selama halaman terbuka: diumumkan dan digulirkan. Riwayat tidak. */
  live?: boolean
  quota?: GuestQuota
}

function localMessage(id: string, role: ChatMessage["role"], content: string): ConversationMessage {
  return { id, role, content, intent: null, recommended_listing_ids: [], created_at: "" }
}

/** Pesan pengguna baru. `replaceIds`: pesan gagal yang dikirim ulang, diganti di layar. */
export function addSending(
  messages: ConversationMessage[],
  id: string,
  content: string,
  replaceIds: readonly string[] = [],
): ConversationMessage[] {
  return [
    ...messages.filter((m) => !replaceIds.includes(m.id)),
    { ...localMessage(id, "USER", content), state: "sending" },
  ]
}

export function applyReply(
  messages: ConversationMessage[],
  id: string,
  result: SendMessageResult,
  sentWithLocation: boolean,
): ConversationMessage[] {
  return messages.flatMap((m) =>
    m.id !== id
      ? [m]
      : [
          result.user_message,
          {
            ...result.assistant_message,
            recommendations: result.recommendations,
            sentWithLocation,
            live: true,
            quota: result.guest_quota ?? undefined,
          },
        ],
  )
}

export function applyFailure(messages: ConversationMessage[], id: string, failure: ChatFailure): ConversationMessage[] {
  return messages.flatMap((m) => {
    if (m.id !== id) return [m]
    // D161: pesan pengguna dan balasan gagal sudah tercatat di server, jadi bentuknya sama dengan riwayat.
    if (failure.kind === "gemini") {
      return [{ ...m, state: undefined }, { ...localMessage(`${id}-gagal`, "ASSISTANT", failure.message), live: true }]
    }
    return [{ ...m, state: "failed" as const, failure }]
  })
}

/** Balasan ASSISTANT tanpa intent adalah kegagalan Gemini yang tercatat (D161). */
export function isFailedReply(message: ConversationMessage): boolean {
  return message.role === "ASSISTANT" && message.intent === null
}

/** Server tidak mencari tanpa koordinat: `cari_jasa` tanpa hasil padahal lokasi tidak ikut terkirim. */
export function needsLocation(message: ConversationMessage): boolean {
  return message.intent === "cari_jasa" && message.recommended_listing_ids.length === 0 && !message.sentWithLocation
}

/** Posisi gulir supaya jawaban terbaca dari awal: yang lebih tinggi dari area disejajarkan ke atas, sisanya ke bawah. */
export function answerScrollTop(area: { height: number; padding: number }, answer: { top: number; height: number }): number {
  const top = answer.top - area.padding
  const bottom = answer.top + answer.height + area.padding - area.height
  return Math.max(0, Math.min(top, bottom))
}

/** Kartu dari detail jasa, untuk percakapan lama. Detail tidak membawa jarak. */
export function toListingCard(detail: ListingDetail): ListingCard {
  const { provider } = detail
  const primary = detail.photos.find((p) => p.is_primary) ?? detail.photos[0]
  return {
    id: detail.id,
    title: detail.title,
    price: detail.price,
    price_unit: detail.price_unit,
    estimated_duration_minutes: detail.estimated_duration_minutes,
    supports_scheduled: detail.supports_scheduled,
    supports_available_now: detail.supports_available_now,
    rating_average: detail.rating_average,
    rating_count: detail.rating_count,
    order_count: detail.order_count,
    subcategory: detail.subcategory,
    provider: {
      id: provider.id,
      business_name: provider.business_name,
      rating_average: provider.rating_average,
      rating_count: provider.rating_count,
    },
    primary_photo_url: primary?.file_url ?? null,
    distance_km: null,
  }
}
