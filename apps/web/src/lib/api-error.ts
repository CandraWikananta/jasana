import type { ErrorDetail } from "@jasana/shared"
import { getErrorMessage } from "./error-messages"

// Dipisah dari api-client supaya session.ts bisa memakainya tanpa impor melingkar.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    /** null kalau respons bukan envelope API, misalnya jaringan putus atau proxy. */
    readonly code: string | null,
    readonly details: ErrorDetail[] = [],
    /** Detik dari header Retry-After, untuk pesan 429 (PRD Frontend 7.2). */
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(getErrorMessage(code))
    this.name = "ApiError"
  }
}

export function parseRetryAfter(value: string | null): number | null {
  if (!value) return null
  const seconds = Number(value)
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds) : null
}
