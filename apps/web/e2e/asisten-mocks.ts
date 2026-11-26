import type { Page, Route } from "@playwright/test"
import type { ErrorCode } from "@jasana/shared"
import type { ChatMessage, ChatSession, SendMessageResult } from "../src/types/api/chat"
import type { ListingCard } from "../src/types/api/listing"

// Tiruan seluruh /chat/* (dan sesi login) lewat page.route: kuota Gemini terbatas, jadi uji antarmuka
// tidak pernah memanggil server sungguhan.

export const GUEST_TOKEN = "ab".repeat(32)
export const GUEST_SESSION_ID = "11111111-1111-4111-8111-111111111111"
export const ACCOUNT_SESSION_ID = "22222222-2222-4222-8222-222222222222"

const CORS = {
  "access-control-allow-origin": "http://localhost:3100",
  "access-control-allow-credentials": "true",
  "access-control-allow-headers": "content-type,authorization,x-guest-token",
  "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "access-control-expose-headers": "Retry-After",
}

export function ok(route: Route, data: unknown, meta?: unknown, status = 200) {
  return route.fulfill({ status, headers: CORS, json: { success: true, data, ...(meta ? { meta } : {}) } })
}

export function fail(route: Route, status: number, code: ErrorCode, headers: Record<string, string> = {}) {
  return route.fulfill({
    status,
    headers: { ...CORS, ...headers },
    json: { success: false, error: { code, message: code, details: [] }, request_id: "uji" },
  })
}

export function card(n: number, over: Partial<ListingCard> = {}): ListingCard {
  return {
    id: `aaaaaaaa-aaaa-4aaa-8aaa-00000000000${n}`,
    title: `Servis AC panggilan ${n}`,
    price: 75000 * n,
    price_unit: "PER_JOB",
    estimated_duration_minutes: 60,
    supports_scheduled: true,
    supports_available_now: n === 1,
    rating_average: 4.8,
    rating_count: 12,
    order_count: 30,
    subcategory: { id: "sub", name: "Servis AC" },
    provider: { id: "p", business_name: "Sejuk Jaya Teknik", rating_average: 4.8, rating_count: 12 },
    primary_photo_url: null,
    distance_km: 1.2 * n,
    ...over,
  }
}

let counter = 100

export function message(role: ChatMessage["role"], content: string, over: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: String(++counter),
    role,
    content,
    intent: null,
    recommended_listing_ids: [],
    created_at: "2026-11-25T06:00:00.000Z",
    ...over,
  }
}

export function reply(
  content: string,
  answer: string,
  over: { intent?: SendMessageResult["intent"]; cards?: ListingCard[]; remaining?: number } = {},
): SendMessageResult {
  const { intent = "sapaan", cards = [], remaining } = over
  return {
    user_message: message("USER", content),
    assistant_message: message("ASSISTANT", answer, { intent, recommended_listing_ids: cards.map((c) => c.id) }),
    intent,
    recommendations: cards,
    guest_quota: remaining === undefined ? null : { limit: 20, used: 20 - remaining, remaining },
  }
}

export function session(id: string, over: Partial<ChatSession> = {}): ChatSession {
  return {
    id,
    type: "REGISTERED",
    status: "ACTIVE",
    title: null,
    message_count: 3,
    expires_at: null,
    claimed_at: null,
    started_at: "2026-11-24T06:00:00.000Z",
    ended_at: null,
    ...over,
  }
}

export interface SentMessage {
  content: string
  latitude?: number
  longitude?: number
  /** Header X-Guest-Token. */
  token: string | null
}

export interface ClaimRequest {
  sessionId: string
  /** Header X-Guest-Token. */
  token: string | null
  /** Header Authorization. */
  bearer: string | null
}

export interface ChatMock {
  sent: SentMessage[]
  created: number
  claims: ClaimRequest[]
  /** Balasan untuk POST claim. Bawaan: berhasil. */
  onClaim: (route: Route, claim: ClaimRequest, index: number) => unknown
  /** Balasan untuk POST messages. Diganti per uji. */
  onSend: (route: Route, sent: SentMessage, index: number) => unknown
  /** Balasan untuk GET messages. `token`: X-Guest-Token, null untuk akun. */
  onHistory: (route: Route, sessionId: string, token: string | null) => unknown
  onSessions: (route: Route, page: number) => unknown
}

export async function mockChat(page: Page): Promise<ChatMock> {
  const mock: ChatMock = {
    sent: [],
    created: 0,
    claims: [],
    onClaim: (route, { sessionId }) => ok(route, session(sessionId, { claimed_at: "2026-11-26T06:00:00.000Z" })),
    onSend: (route, { content }) => ok(route, reply(content, "Halo! Aku asisten Jasana.", { remaining: 19 }), undefined, 201),
    onHistory: (route) => ok(route, [], { page: 1, limit: 100, total: 0 }),
    onSessions: (route) => ok(route, [], { page: 1, limit: 20, total: 0 }),
  }
  await page.route("**/api/v1/chat/**", async (route) => {
    const request = route.request()
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS })
    const url = new URL(request.url())
    const path = url.pathname.replace("/api/v1/chat", "")
    if (path === "/guest-sessions") {
      mock.created++
      return ok(
        route,
        { session: session(GUEST_SESSION_ID, { type: "GUEST" }), guest_token: GUEST_TOKEN, message_limit: 20 },
        undefined,
        201,
      )
    }
    if (path === "/sessions" && request.method() === "POST") {
      mock.created++
      return ok(route, session(ACCOUNT_SESSION_ID, { message_count: 0 }), undefined, 201)
    }
    if (path === "/sessions") return mock.onSessions(route, Number(url.searchParams.get("page") ?? 1))
    const id = path.split("/")[2]!
    const token = (await request.headerValue("x-guest-token")) ?? null
    if (path.endsWith("/claim")) {
      const claim = { sessionId: id, token, bearer: (await request.headerValue("authorization")) ?? null }
      mock.claims.push(claim)
      return mock.onClaim(route, claim, mock.claims.length - 1)
    }
    if (request.method() === "GET") return mock.onHistory(route, id, token)
    const sent: SentMessage = { ...(request.postDataJSON() as Omit<SentMessage, "token">), token }
    mock.sent.push(sent)
    return mock.onSend(route, sent, mock.sent.length - 1)
  })
  return mock
}

export const USER = {
  id: "u1",
  full_name: "Putu Ayu",
  email: "putu@contoh.id",
  pending_email: null,
  phone: "+6281234567890",
  role: "CLIENT",
  avatar_url: null,
  email_verified: true,
  email_verified_at: "2026-11-01T00:00:00.000Z",
  created_at: "2026-11-01T00:00:00.000Z",
} as const

/** Sesi login tiruan: cookie penanda, refresh, dan /auth/me. Tidak memakai jatah login server. */
export async function mockLogin(page: Page) {
  await page.context().addCookies([{ name: "jasana_sesi", value: "1", url: "http://localhost:3100" }])
  await mockAccountRoutes(page)
}

/**
 * Daftar dan masuk tiruan untuk alur tamu yang mendaftar (D260): mulai sebagai tamu, lalu /auth/register
 * dan /api/session/login memasang cookie penanda seperti Route Handler aslinya.
 */
export async function mockSignup(page: Page) {
  const calls = { register: 0, login: 0 }
  await page.route("**/api/v1/auth/register", (route) => {
    calls.register++
    return ok(route, { user: { ...USER, email_verified: false, email_verified_at: null }, message: "ok" }, undefined, 201)
  })
  await page.route("**/api/session/login", (route) => {
    calls.login++
    return route.fulfill({
      headers: { "set-cookie": "jasana_sesi=1; Path=/" },
      json: { success: true, data: { access_token: "uji", expires_in: 900, user: USER } },
    })
  })
  await mockAccountRoutes(page)
  return calls
}

async function mockAccountRoutes(page: Page) {
  await page.route("**/api/session/refresh", (route) =>
    route.fulfill({ json: { success: true, data: { access_token: "uji", expires_in: 900 } } }),
  )
  await page.route("**/api/v1/auth/me", (route) => ok(route, { ...USER, provider: null, worker: null }))
  await page.route("**/api/v1/notifications**", (route) => ok(route, [], { page: 1, limit: 1, total: 0 }))
  // Koneksi realtime dengan token tiruan pasti ditolak, dan indikatornya mengganggu screenshot.
  await page.route("**/socket.io/**", () => undefined)
}
