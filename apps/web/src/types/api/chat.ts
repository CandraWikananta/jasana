// Bentuk JSON apps/api/src/modules/chat (chat.service.ts, chat-message.service.ts).
import type { ListingCard } from "./listing"

export interface ChatSession {
  id: string
  type: "GUEST" | "REGISTERED"
  status: "ACTIVE" | "ENDED"
  /** Belum pernah diisi server (calon H154). */
  title: string | null
  /** Jumlah pesan pengguna, tanpa balasan Asisten. */
  message_count: number
  expires_at: string | null
  claimed_at: string | null
  started_at: string
  ended_at: string | null
}

/** POST /chat/guest-sessions. Token mentah hanya ada di respons ini. */
export interface GuestSessionResult {
  session: ChatSession
  guest_token: string
  message_limit: number
}

export type ChatIntent = "cari_jasa" | "perlu_klarifikasi" | "jasa_tidak_tersedia" | "sapaan" | "di_luar_cakupan"

export interface ChatMessage {
  id: string
  role: "USER" | "ASSISTANT" | "SYSTEM"
  content: string
  /** null untuk pesan pengguna dan untuk balasan ASSISTANT yang gagal (D161). */
  intent: ChatIntent | null
  recommended_listing_ids: string[]
  created_at: string
}

export interface GuestQuota {
  limit: number
  used: number
  remaining: number
}

export interface SendMessageInput {
  content: string
  latitude?: number
  longitude?: number
}

/** POST /chat/sessions/:id/messages. */
export interface SendMessageResult {
  user_message: ChatMessage
  assistant_message: ChatMessage
  intent: ChatIntent
  recommendations: ListingCard[]
  /** null untuk pengguna terdaftar. */
  guest_quota: GuestQuota | null
}
