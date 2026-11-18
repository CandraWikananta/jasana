import type { ErrorEnvelope, PaginationMeta, SuccessEnvelope } from "@jasana/shared"
import { ApiError, parseRetryAfter } from "./api-error"
import { publicEnv } from "./env"
import { clearSession, ensureAccessToken, hasSessionFlag, redirectToLogin, refreshSession } from "./session"

// PRD Frontend 7.1. Body dan respons snake_case apa adanya.
export { ApiError } from "./api-error"

export type QueryParams = Record<string, string | number | boolean | null | undefined>

type ApiInit = RequestInit & { query?: QueryParams }

const isBrowser = () => typeof window !== "undefined"

function buildUrl(path: string, query: QueryParams | undefined): URL {
  const url = new URL(publicEnv.NEXT_PUBLIC_API_BASE_URL + path)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value))
  }
  return url
}

async function send(url: URL, init: RequestInit, bearer: string | null): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set("Accept", "application/json")
  if (init.body !== undefined && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  if (bearer) headers.set("Authorization", `Bearer ${bearer}`)
  try {
    return await fetch(url, { ...init, headers })
  } catch {
    throw new ApiError(0, null)
  }
}

/** Token sebelum request. Kegagalan refresh karena jaringan tidak menggagalkan request publik. */
async function currentBearer(): Promise<string | null> {
  if (!isBrowser()) return null
  try {
    return await ensureAccessToken()
  } catch {
    return null
  }
}

export async function apiFetch<T>(
  path: string,
  { query, ...init }: ApiInit = {},
): Promise<{ data: T; meta?: PaginationMeta }> {
  const url = buildUrl(path, query)

  const bearer = await currentBearer()
  let res = await send(url, init, bearer)

  // 401: refresh sekali (single-flight, D212), lalu ulangi. Hanya kalau memang ada sesi, supaya
  // tamu di halaman publik tidak pernah dialihkan ke /masuk.
  if (res.status === 401 && isBrowser() && (bearer !== null || hasSessionFlag())) {
    let refreshed = false
    try {
      refreshed = await refreshSession()
    } catch {
      refreshed = false
    }
    if (refreshed) res = await send(url, init, await currentBearer())
    if (!refreshed || res.status === 401) {
      clearSession()
      redirectToLogin()
    }
  }

  const body = (await res.json().catch(() => null)) as SuccessEnvelope<T> | ErrorEnvelope | null
  if (res.ok && body?.success === true) return { data: body.data, meta: body.meta }
  const retryAfter = parseRetryAfter(res.headers.get("retry-after"))
  if (body?.success === false) throw new ApiError(res.status, body.error.code, body.error.details ?? [], retryAfter)
  throw new ApiError(res.status, null, [], retryAfter)
}

/**
 * 404, atau 422 VALIDATION_ERROR karena id di URL bukan UUID: keduanya "tidak ditemukan".
 * Hanya untuk GET berdasarkan id, yang satu-satunya inputnya adalah id itu.
 */
export function isNotFound(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 404 || err.code === "VALIDATION_ERROR")
}

/** Kebijakan retry TanStack Query: sekali untuk jaringan putus atau 5xx. 4xx tidak berubah kalau diulang, jadi langsung error state. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
  return failureCount < 1
}
