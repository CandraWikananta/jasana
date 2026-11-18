import type { AccessTokenResult, LoginInput, LoginResult, UserDto } from "@/types/api/auth"
import { ApiError, parseRetryAfter } from "./api-error"
import { REFRESH_LOCK_NAME, SESSION_FLAG_COOKIE, SESSION_ROUTES } from "./session-constants"

// Sesi D212 di sisi browser. Access token HANYA di variabel modul ini (aturan web nomor 7), hilang
// saat tab dimuat ulang, lalu dipulihkan lewat /api/session/refresh yang membaca cookie httpOnly.
//
// Rotasi refresh token D76 tanpa jeda toleransi: dua refresh dengan cookie yang sama = pemakaian
// ulang, dan seluruh family dicabut. Karena itu (CLAUDE.md web jebakan 2):
//  1. di dalam tab, semua pemanggil menunggu SATU promise refresh (single-flight)
//  2. antar tab, refresh dibungkus navigator.locks. Tab yang menunggu kunci mengirim cookie
//     hasil rotasi tab sebelumnya, karena browser membaca cookie saat request dibuat
//
// Di server (Server Component publik) modul ini tidak pernah memegang token: seluruh fungsi
// yang mengubah state hanya dipanggil dari browser.

export type SessionStatus = "unknown" | "authenticated" | "guest"

/** Token dianggap kedaluwarsa sedikit lebih awal supaya tidak habis di tengah jalan. */
const EXPIRY_SKEW_MS = 30_000

let accessToken: string | null = null
let expiresAt = 0
let status: SessionStatus = "unknown"
let refreshPromise: Promise<boolean> | null = null
let bootPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

const isBrowser = () => typeof window !== "undefined"

function setStatus(next: SessionStatus) {
  if (status === next) return
  status = next
  for (const listener of listeners) listener()
}

function applyToken(result: AccessTokenResult) {
  accessToken = result.access_token
  expiresAt = Date.now() + result.expires_in * 1000
  setStatus("authenticated")
}

/** Menghapus state di memori. Cookie dihapus oleh Route Handler, bukan di sini (httpOnly). */
export function clearSession() {
  accessToken = null
  expiresAt = 0
  setStatus("guest")
}

export function getAccessToken(): string | null {
  return accessToken
}

export function getSessionStatus(): SessionStatus {
  return status
}

export function hasFreshAccessToken(now: number = Date.now()): boolean {
  return accessToken !== null && now < expiresAt - EXPIRY_SKEW_MS
}

/** Cookie penanda dibaca, bukan refresh token (yang httpOnly dan tidak terkirim ke halaman). */
export function hasSessionFlag(): boolean {
  if (!isBrowser()) return false
  return document.cookie.split(";").some((part) => part.trim().startsWith(`${SESSION_FLAG_COOKIE}=`))
}

async function postSession(path: string, body?: unknown, bearer?: string | null): Promise<Response> {
  const headers = new Headers({ Accept: "application/json" })
  if (body !== undefined) headers.set("Content-Type", "application/json")
  if (bearer) headers.set("Authorization", `Bearer ${bearer}`)
  try {
    return await fetch(path, {
      method: "POST",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
      cache: "no-store",
    })
  } catch {
    throw new ApiError(0, null)
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  const body = (await res.json().catch(() => null)) as {
    error?: { code?: string; details?: ApiError["details"] }
  } | null
  return new ApiError(
    res.status,
    body?.error?.code ?? null,
    body?.error?.details ?? [],
    parseRetryAfter(res.headers.get("retry-after")),
  )
}

/** Kunci antar tab. Tanpa navigator.locks (browser lama) hanya single-flight dalam tab yang berlaku. */
function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  const locks = isBrowser() ? navigator.locks : undefined
  if (!locks) return task()
  return locks.request(REFRESH_LOCK_NAME, task) as Promise<T>
}

async function doRefresh(): Promise<boolean> {
  const res = await postSession(SESSION_ROUTES.refresh)
  if (res.ok) {
    const body = (await res.json()) as { data: AccessTokenResult }
    applyToken(body.data)
    return true
  }
  // 401: refresh token ditolak dan cookie sudah dihapus handler. Sesi berakhir.
  if (res.status === 401) {
    clearSession()
    return false
  }
  // 5xx atau jaringan: sesi belum tentu mati, jadi state dibiarkan.
  throw await toApiError(res)
}

/**
 * true kalau access token baru didapat, false kalau sesi berakhir.
 * Melempar ApiError untuk kegagalan lain (jaringan, 5xx).
 */
export function refreshSession(): Promise<boolean> {
  refreshPromise ??= withRefreshLock(doRefresh).finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

/** Sekali per tab, saat aplikasi dimuat. Tamu tanpa cookie penanda tidak memanggil refresh sama sekali. */
export function bootstrapSession(): Promise<void> {
  if (!isBrowser()) return Promise.resolve()
  bootPromise ??= (async () => {
    if (!hasSessionFlag()) {
      clearSession()
      return
    }
    try {
      await refreshSession()
    } catch {
      // API tidak terjangkau. Tampil sebagai tamu, cookie dibiarkan supaya muat ulang bisa memulihkan.
      setStatus("guest")
    }
  })()
  return bootPromise
}

/** Menunggu bootstrap, supaya request pertama halaman sudah membawa access token. */
export function sessionReady(): Promise<void> {
  if (!isBrowser()) return Promise.resolve()
  return bootPromise ?? bootstrapSession()
}

/**
 * Access token yang masih berlaku, me-refresh dulu kalau sudah (hampir) kedaluwarsa.
 * null kalau tidak ada sesi.
 */
export async function ensureAccessToken(): Promise<string | null> {
  if (!isBrowser()) return null
  await sessionReady()
  if (hasFreshAccessToken()) return accessToken
  if (accessToken === null && !hasSessionFlag()) return null
  return (await refreshSession()) ? accessToken : null
}

export async function login(input: LoginInput): Promise<UserDto> {
  const res = await postSession(SESSION_ROUTES.login, input)
  if (!res.ok) throw await toApiError(res)
  const body = (await res.json()) as { data: LoginResult }
  applyToken(body.data)
  bootPromise = Promise.resolve()
  return body.data.user
}

/**
 * Logout wajib mencabut refresh token di server, dan Express mewajibkan Bearer yang berlaku.
 * Kalau access token tidak ada atau kedaluwarsa, refresh dulu. Pemanggilan logout memakai kunci
 * yang sama dengan refresh, supaya cookie yang dikirim adalah hasil rotasi terbaru dari tab mana pun.
 */
export async function logout(): Promise<{ revoked: boolean | null }> {
  let bearer: string | null = null
  try {
    bearer = await ensureAccessToken()
  } catch {
    bearer = null
  }

  let revoked: boolean | null = null
  try {
    const res = await withRefreshLock(() => postSession(SESSION_ROUTES.logout, undefined, bearer))
    if (res.ok) revoked = ((await res.json()) as { data: { revoked: boolean | null } }).data.revoked
  } finally {
    clearSession()
    broadcastLogout()
  }
  return { revoked }
}

/** Tab lain diberi tahu supaya tidak tetap tampil masuk sampai access token-nya habis. */
const CHANNEL_NAME = "jasana-sesi"

function broadcastLogout() {
  if (!isBrowser() || typeof BroadcastChannel === "undefined") return
  const channel = new BroadcastChannel(CHANNEL_NAME)
  channel.postMessage("logout")
  channel.close()
}

export function listenForLogout(): () => void {
  if (!isBrowser() || typeof BroadcastChannel === "undefined") return () => {}
  const channel = new BroadcastChannel(CHANNEL_NAME)
  channel.onmessage = (event) => {
    if (event.data === "logout") clearSession()
  }
  return () => channel.close()
}

export function redirectToLogin() {
  if (!isBrowser() || window.location.pathname === "/masuk") return
  const next = window.location.pathname + window.location.search
  // Navigasi penuh disengaja: dipanggil dari api-client di luar komponen, dan seluruh state tab
  // (cache query, token) memang harus dibuang.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/masuk?next=${encodeURIComponent(next)}`)
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Hanya untuk unit test. */
export function resetSessionForTests() {
  accessToken = null
  expiresAt = 0
  status = "unknown"
  refreshPromise = null
  bootPromise = null
  listeners.clear()
}
