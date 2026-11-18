import "server-only"
import type { ErrorCode, ErrorEnvelope } from "@jasana/shared"
import { NextResponse, type NextRequest } from "next/server"
import { serverEnv } from "./env.server"
import { SESSION_FLAG_COOKIE } from "./session-constants"

// Bagian bersama tiga Route Handler sesi (D212). Satu-satunya kode Next yang memanggil Express
// dari server, dan hanya untuk /auth/login, /auth/refresh, /auth/logout (D210 aturan 2).

/** Cookie refresh token hanya terkirim ke /api/session/*, tidak ke halaman (path sesempit mungkin). */
export const REFRESH_COOKIE_PATH = "/api/session"

const UPSTREAM_TIMEOUT_MS = 10_000

/**
 * Next 16 hanya mengisi x-forwarded-for kalau header itu belum ada (base-server.js), jadi isi
 * kiriman browser lolos utuh. Yang diteruskan hanya entri paling kanan, yaitu yang ditambahkan
 * hop terdekat di depan Next (atau oleh Next sendiri kalau tidak ada proxy). Express membacanya
 * lewat TRUST_PROXY (D117). Tanpa ini seluruh login terhitung dari IP server Next dan rate
 * limit 10 per 15 menit habis untuk semua pengguna sekaligus (CLAUDE.md web jebakan 3).
 */
export function lastForwardedFor(value: string | null): string | null {
  if (!value) return null
  const entries = value.split(",").map((entry) => entry.trim()).filter(Boolean)
  return entries.at(-1) ?? null
}

export function upstreamHeaders(req: Request, extra: Record<string, string> = {}): Headers {
  const headers = new Headers({ Accept: "application/json", "Content-Type": "application/json", ...extra })
  // User-Agent asli yang tampil di halaman Perangkat aktif, bukan "node".
  const userAgent = req.headers.get("user-agent")
  if (userAgent) headers.set("User-Agent", userAgent)
  const forwardedFor = lastForwardedFor(req.headers.get("x-forwarded-for"))
  if (forwardedFor) headers.set("X-Forwarded-For", forwardedFor)
  return headers
}

/**
 * Seluruh Route Handler sesi hanya menerima request dari origin Next sendiri. SameSite=Lax sudah
 * menahan cookie pada POST lintas situs, pemeriksaan ini lapis kedua, sekaligus menutup login CSRF
 * (situs lain memasukkan korban ke akun penyerang). Tanpa header Origin juga ditolak: browser
 * selalu mengirimnya pada fetch POST.
 */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin")
  return origin !== null && origin === req.nextUrl.origin
}

export function jsonNoStore(body: unknown, init: ResponseInit = {}): NextResponse {
  const res = NextResponse.json(body, init)
  res.headers.set("Cache-Control", "no-store")
  return res
}

export function errorResponse(status: number, code: ErrorCode, message: string): NextResponse {
  const body: ErrorEnvelope = { success: false, error: { code, message, details: [] } }
  return jsonNoStore(body, { status })
}

export function rejectCrossOrigin(req: NextRequest): NextResponse | null {
  if (isSameOrigin(req)) return null
  return errorResponse(403, "CORS_ORIGIN_NOT_ALLOWED", "Permintaan dari origin lain ditolak")
}

function cookieBase() {
  return { sameSite: "lax" as const, secure: serverEnv.SESSION_COOKIE_SECURE }
}

export function setSessionCookies(res: NextResponse, refreshToken: string, expiresAtIso: string): void {
  const expires = new Date(expiresAtIso)
  res.cookies.set(serverEnv.SESSION_COOKIE_NAME, refreshToken, {
    ...cookieBase(),
    httpOnly: true,
    path: REFRESH_COOKIE_PATH,
    expires,
  })
  res.cookies.set(SESSION_FLAG_COOKIE, "1", { ...cookieBase(), httpOnly: false, path: "/", expires })
}

/** Penanda selalu ikut dihapus, supaya proxy.ts tidak menganggap sesi yang sudah mati masih masuk. */
export function clearSessionCookies(res: NextResponse): void {
  res.cookies.set(serverEnv.SESSION_COOKIE_NAME, "", {
    ...cookieBase(),
    httpOnly: true,
    path: REFRESH_COOKIE_PATH,
    maxAge: 0,
  })
  res.cookies.set(SESSION_FLAG_COOKIE, "", { ...cookieBase(), httpOnly: false, path: "/", maxAge: 0 })
}

export function readRefreshCookie(req: NextRequest): string | null {
  return req.cookies.get(serverEnv.SESSION_COOKIE_NAME)?.value || null
}

export interface UpstreamResult {
  status: number
  ok: boolean
  /** Envelope API, atau null kalau balasan bukan JSON (proxy, halaman error). */
  body: { success: boolean; data?: unknown; error?: unknown } | null
  retryAfter: string | null
}

/** null berarti API tidak terjangkau (jaringan putus atau timeout). */
export async function callApi(path: string, body: unknown, headers: Headers): Promise<UpstreamResult | null> {
  let res: Response
  try {
    res = await fetch(`${serverEnv.API_INTERNAL_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })
  } catch {
    return null
  }
  const parsed = (await res.json().catch(() => null)) as UpstreamResult["body"]
  const isEnvelope = parsed !== null && typeof parsed === "object" && typeof parsed.success === "boolean"
  return {
    status: res.status,
    ok: res.ok && isEnvelope && parsed.success === true,
    body: isEnvelope ? parsed : null,
    retryAfter: res.headers.get("retry-after"),
  }
}

/** Kegagalan API diteruskan apa adanya (status, envelope, Retry-After) supaya peta pesan client tetap berlaku. */
export function passThrough(upstream: UpstreamResult): NextResponse {
  if (!upstream.body || upstream.status < 400) {
    return errorResponse(503, "SERVICE_UNAVAILABLE", "Layanan sedang tidak tersedia")
  }
  const res = jsonNoStore(upstream.body, { status: upstream.status })
  if (upstream.retryAfter) res.headers.set("Retry-After", upstream.retryAfter)
  return res
}

export const unreachable = () => errorResponse(503, "SERVICE_UNAVAILABLE", "Layanan sedang tidak tersedia")
