import type { NextRequest } from "next/server"
import type { UserDto } from "@/types/api/auth"
import {
  callApi,
  errorResponse,
  jsonNoStore,
  passThrough,
  rejectCrossOrigin,
  setSessionCookies,
  unreachable,
  upstreamHeaders,
} from "@/lib/session-server"

interface ApiLoginData {
  access_token: string
  expires_in: number
  refresh_token: string
  refresh_token_expires_at: string
  user: UserDto
}

/** Hanya field kredensial yang diteruskan. Validasi isinya tetap milik Express. */
function pickCredentials(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null) return {}
  const source = body as Record<string, unknown>
  const picked: Record<string, unknown> = {}
  for (const key of ["email", "phone", "password"] as const) {
    if (key in source) picked[key] = source[key]
  }
  return picked
}

// POST /api/session/login -> POST /auth/login (D212).
export async function POST(req: NextRequest) {
  const rejected = rejectCrossOrigin(req)
  if (rejected) return rejected

  // Form HTML lintas situs tidak bisa mengirim application/json tanpa preflight.
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return errorResponse(415, "INVALID_JSON", "Body harus application/json")
  }
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return errorResponse(400, "INVALID_JSON", "Body bukan JSON yang sah")
  }

  const upstream = await callApi("/auth/login", pickCredentials(body), upstreamHeaders(req))
  if (!upstream) return unreachable()
  if (!upstream.ok) return passThrough(upstream)

  const data = upstream.body?.data as ApiLoginData
  // Refresh token dibuang dari body: JavaScript tidak pernah memegangnya.
  const res = jsonNoStore({
    success: true,
    data: { access_token: data.access_token, expires_in: data.expires_in, user: data.user },
  })
  setSessionCookies(res, data.refresh_token, data.refresh_token_expires_at)
  return res
}
