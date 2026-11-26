import { apiFetch } from "@/lib/api-client"
import type { ChatMessage, ChatSession, GuestSessionResult, SendMessageInput, SendMessageResult } from "@/types/api/chat"

/** Tamu dikenali lewat X-Guest-Token, akun lewat Bearer dari apiFetch (D162). */
export type ChatScope = "guest" | "account"

export interface ChatTarget {
  sessionId: string
  /** null untuk akun. */
  guestToken: string | null
}

const MESSAGES_PER_PAGE = 100
export const SESSIONS_PER_PAGE = 20

const guestHeaders = (token: string | null): HeadersInit | undefined => (token ? { "X-Guest-Token": token } : undefined)
const messagesPath = (target: ChatTarget) => `/chat/sessions/${encodeURIComponent(target.sessionId)}/messages`

export async function startSession(scope: ChatScope): Promise<ChatTarget> {
  if (scope === "account") {
    const { data } = await apiFetch<ChatSession>("/chat/sessions", { method: "POST" })
    return { sessionId: data.id, guestToken: null }
  }
  const { data } = await apiFetch<GuestSessionResult>("/chat/guest-sessions", { method: "POST" })
  return { sessionId: data.session.id, guestToken: data.guest_token }
}

export async function sendMessage(target: ChatTarget, input: SendMessageInput): Promise<SendMessageResult> {
  return (
    await apiFetch<SendMessageResult>(messagesPath(target), {
      method: "POST",
      body: JSON.stringify(input),
      headers: guestHeaders(target.guestToken),
    })
  ).data
}

/** Seluruh pesan, lama ke baru. */
export async function listMessages(target: ChatTarget): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = []
  // shortcut: semua halaman dimuat berurutan. Ganti "Muat pesan sebelumnya" kalau satu percakapan mencapai ratusan pesan.
  for (let page = 1; ; page++) {
    const { data, meta } = await apiFetch<ChatMessage[]>(messagesPath(target), {
      query: { page, limit: MESSAGES_PER_PAGE },
      headers: guestHeaders(target.guestToken),
    })
    messages.push(...data)
    if (data.length === 0 || messages.length >= (meta?.total ?? 0)) return messages
  }
}

/** D77: sesi tamu jadi milik akun. Butuh Bearer (dari apiFetch) dan token tamunya sekaligus (usulan D170). */
export async function claimSession(sessionId: string, guestToken: string): Promise<ChatSession> {
  return (
    await apiFetch<ChatSession>(`/chat/sessions/${encodeURIComponent(sessionId)}/claim`, {
      method: "POST",
      headers: guestHeaders(guestToken),
    })
  ).data
}

export function listSessions(page: number) {
  return apiFetch<ChatSession[]>("/chat/sessions", { query: { page, limit: SESSIONS_PER_PAGE } })
}
