import type { ErrorDetail, ErrorEnvelope, PaginationMeta, SuccessEnvelope } from "@jasana/shared"
import { getErrorMessage } from "./error-messages"

// PRD Frontend 7.1. Body dan respons snake_case apa adanya.
// Sesi (Authorization dan retry 401) menyusul di bagian sesi W0.

export type QueryParams = Record<string, string | number | boolean | null | undefined>

export class ApiError extends Error {
  constructor(
    readonly status: number,
    /** null kalau respons bukan envelope API, misalnya jaringan putus atau proxy. */
    readonly code: string | null,
    readonly details: ErrorDetail[] = [],
  ) {
    super(getErrorMessage(code))
    this.name = "ApiError"
  }
}

export async function apiFetch<T>(
  path: string,
  { query, ...init }: RequestInit & { query?: QueryParams } = {},
): Promise<{ data: T; meta?: PaginationMeta }> {
  // Dicek saat dipanggil, bukan saat modul dimuat, supaya next build dan halaman tanpa API tetap jalan.
  const base = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL kosong. Salin apps/web/.env.example ke .env.local")

  const url = new URL(base.replace(/\/$/, "") + path)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value))
  }

  const headers = new Headers(init.headers)
  headers.set("Accept", "application/json")
  if (init.body !== undefined && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")

  let res: Response
  try {
    res = await fetch(url, { ...init, headers })
  } catch {
    throw new ApiError(0, null)
  }

  const body = (await res.json().catch(() => null)) as SuccessEnvelope<T> | ErrorEnvelope | null
  if (res.ok && body?.success === true) return { data: body.data, meta: body.meta }
  if (body?.success === false) throw new ApiError(res.status, body.error.code, body.error.details ?? [])
  throw new ApiError(res.status, null)
}
