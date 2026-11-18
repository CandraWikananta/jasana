import type { NextRequest } from "next/server"
import {
  callApi,
  clearSessionCookies,
  errorResponse,
  jsonNoStore,
  passThrough,
  readRefreshCookie,
  rejectCrossOrigin,
  setSessionCookies,
  unreachable,
  upstreamHeaders,
} from "@/lib/session-server"

interface ApiRefreshData {
  access_token: string
  expires_in: number
  refresh_token: string
  refresh_token_expires_at: string
}

// POST /api/session/refresh -> POST /auth/refresh, sekaligus merotasi cookie (D76, D212).
// Pemanggilnya selalu lib/session.ts di dalam navigator.locks, jadi satu refresh per waktu
// untuk seluruh tab, dan request berikutnya otomatis membawa cookie hasil rotasi terbaru.
export async function POST(req: NextRequest) {
  const rejected = rejectCrossOrigin(req)
  if (rejected) return rejected

  const refreshToken = readRefreshCookie(req)
  if (!refreshToken) {
    // Penanda tanpa refresh token (misalnya cookie refresh sudah kedaluwarsa) ikut dihapus.
    const res = errorResponse(401, "UNAUTHORIZED", "Belum masuk")
    clearSessionCookies(res)
    return res
  }

  const upstream = await callApi("/auth/refresh", { refresh_token: refreshToken }, upstreamHeaders(req))
  // API tidak terjangkau atau 5xx: sesinya belum tentu mati, jadi cookie dibiarkan.
  if (!upstream) return unreachable()
  if (!upstream.ok) {
    const res = passThrough(upstream)
    if (upstream.status === 401) clearSessionCookies(res)
    return res
  }

  const data = upstream.body?.data as ApiRefreshData
  const res = jsonNoStore({ success: true, data: { access_token: data.access_token, expires_in: data.expires_in } })
  setSessionCookies(res, data.refresh_token, data.refresh_token_expires_at)
  return res
}
