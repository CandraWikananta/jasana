import type { NextRequest } from "next/server"
import {
  callApi,
  clearSessionCookies,
  jsonNoStore,
  readRefreshCookie,
  rejectCrossOrigin,
  upstreamHeaders,
} from "@/lib/session-server"

// POST /api/session/logout -> POST /auth/logout. Express mewajibkan Bearer DAN refresh token,
// jadi lib/session.ts memastikan access token masih berlaku (refresh dulu kalau perlu) sebelum
// memanggil ini. Cookie selalu dihapus, apa pun jawaban API.
export async function POST(req: NextRequest) {
  const rejected = rejectCrossOrigin(req)
  if (rejected) return rejected

  const refreshToken = readRefreshCookie(req)
  const authorization = req.headers.get("authorization")

  // null: pencabutan tidak dicoba (tanpa cookie atau tanpa Bearer). false: API menolak atau tidak terjangkau.
  let revoked: boolean | null = null
  if (refreshToken && authorization?.startsWith("Bearer ")) {
    const upstream = await callApi(
      "/auth/logout",
      { refresh_token: refreshToken },
      upstreamHeaders(req, { Authorization: authorization }),
    )
    const data = upstream?.ok ? (upstream.body?.data as { revoked?: unknown }) : null
    revoked = data?.revoked === true
  }

  const res = jsonNoStore({ success: true, data: { revoked } })
  clearSessionCookies(res)
  return res
}
