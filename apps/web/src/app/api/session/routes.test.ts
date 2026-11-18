import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { POST as login } from "./login/route"
import { POST as logout } from "./logout/route"
import { POST as refresh } from "./refresh/route"

// Env uji dari vitest.setup.ts: API_INTERNAL_BASE_URL=http://internal.test/api/v1,
// SESSION_COOKIE_NAME=jasana_refresh, SESSION_COOKIE_SECURE=false.

const ORIGIN = "http://localhost:3100"
const API = "http://internal.test/api/v1"

function request(
  path: string,
  { origin = ORIGIN, headers = {}, body, cookie }: { origin?: string | null; headers?: Record<string, string>; body?: unknown; cookie?: string } = {},
) {
  const h = new Headers(headers)
  if (origin !== null) h.set("origin", origin)
  if (cookie) h.set("cookie", cookie)
  if (body !== undefined && !h.has("content-type")) h.set("content-type", "application/json")
  return new NextRequest(`${ORIGIN}${path}`, {
    method: "POST",
    headers: h,
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  })
}

function apiReply(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } })
}

const tokens = {
  access_token: "akses-baru",
  token_type: "Bearer",
  expires_in: 900,
  refresh_token: "refresh-baru",
  refresh_token_expires_at: "2026-12-18T00:00:00.000Z",
}

/** Seluruh Set-Cookie per nama. */
function setCookies(res: Response): Record<string, string> {
  return Object.fromEntries(res.headers.getSetCookie().map((line) => [line.split("=")[0], line]))
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("Origin (ketiga Route Handler)", () => {
  const cases = [
    ["login", login, { body: { email: "a@b.test", password: "x" } }],
    ["refresh", refresh, { cookie: "jasana_refresh=token-lama" }],
    ["logout", logout, { cookie: "jasana_refresh=token-lama", headers: { authorization: "Bearer a" } }],
  ] as const

  for (const [name, handler, extra] of cases) {
    it(`${name}: origin lain ditolak 403 tanpa memanggil API`, async () => {
      const res = await handler(request(`/api/session/${name}`, { ...extra, origin: "https://jahat.test" }))
      expect(res.status).toBe(403)
      expect((await res.json()).error.code).toBe("CORS_ORIGIN_NOT_ALLOWED")
      expect(fetchMock).not.toHaveBeenCalled()
      expect(res.headers.getSetCookie()).toEqual([])
    })

    it(`${name}: tanpa header Origin juga ditolak 403`, async () => {
      const res = await handler(request(`/api/session/${name}`, { ...extra, origin: null }))
      expect(res.status).toBe(403)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it(`${name}: origin beda port dianggap origin lain`, async () => {
      const res = await handler(request(`/api/session/${name}`, { ...extra, origin: "http://localhost:3000" }))
      expect(res.status).toBe(403)
    })
  }
})

describe("POST /api/session/login", () => {
  it("meneruskan kredensial, User-Agent, dan X-Forwarded-For paling kanan", async () => {
    fetchMock.mockResolvedValue(apiReply(200, { success: true, data: { ...tokens, user: { id: "u1" } } }))
    await login(
      request("/api/session/login", {
        body: { email: "a@b.test", password: "rahasia", role: "ADMIN", total_amount: 1 },
        headers: { "user-agent": "Mozilla/5.0 Uji", "x-forwarded-for": "6.6.6.6, 203.0.113.7" },
      }),
    )

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${API}/auth/login`)
    expect(JSON.parse(init.body as string)).toEqual({ email: "a@b.test", password: "rahasia" })
    const headers = init.headers as Headers
    expect(headers.get("user-agent")).toBe("Mozilla/5.0 Uji")
    expect(headers.get("x-forwarded-for")).toBe("203.0.113.7")
  })

  it("refresh token masuk cookie httpOnly Path=/api/session, tidak ada di body", async () => {
    fetchMock.mockResolvedValue(apiReply(200, { success: true, data: { ...tokens, user: { id: "u1" } } }))
    const res = await login(request("/api/session/login", { body: { email: "a@b.test", password: "x" } }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual({ access_token: "akses-baru", expires_in: 900, user: { id: "u1" } })
    expect(JSON.stringify(body)).not.toContain("refresh-baru")
    expect(res.headers.get("cache-control")).toBe("no-store")

    const cookies = setCookies(res)
    expect(cookies.jasana_refresh).toMatch(/^jasana_refresh=refresh-baru;/)
    expect(cookies.jasana_refresh).toMatch(/Path=\/api\/session/)
    expect(cookies.jasana_refresh).toMatch(/HttpOnly/i)
    expect(cookies.jasana_refresh).toMatch(/SameSite=lax/i)
    expect(cookies.jasana_refresh).not.toMatch(/Secure/i)
    expect(cookies.jasana_refresh).toMatch(/Expires=Fri, 18 Dec 2026/)
    // Penanda: tanpa isi rahasia, Path=/ supaya terbaca proxy.ts, tidak httpOnly.
    expect(cookies.jasana_sesi).toMatch(/^jasana_sesi=1;/)
    expect(cookies.jasana_sesi).toMatch(/Path=\/;/)
    expect(cookies.jasana_sesi).not.toMatch(/HttpOnly/i)
  })

  it("401 dan 429 diteruskan apa adanya beserta Retry-After, tanpa cookie", async () => {
    fetchMock.mockResolvedValueOnce(
      apiReply(401, { success: false, error: { code: "UNAUTHORIZED", message: "salah", details: [] } }),
    )
    const wrong = await login(request("/api/session/login", { body: { email: "a@b.test", password: "x" } }))
    expect(wrong.status).toBe(401)
    expect((await wrong.json()).error.code).toBe("UNAUTHORIZED")
    expect(wrong.headers.getSetCookie()).toEqual([])

    fetchMock.mockResolvedValueOnce(
      apiReply(429, { success: false, error: { code: "RATE_LIMIT_EXCEEDED", message: "x", details: [] } }, { "retry-after": "540" }),
    )
    const limited = await login(request("/api/session/login", { body: { email: "a@b.test", password: "x" } }))
    expect(limited.status).toBe(429)
    expect(limited.headers.get("retry-after")).toBe("540")
  })

  it("body bukan JSON ditolak tanpa memanggil API", async () => {
    const res = await login(
      request("/api/session/login", { body: "email=a", headers: { "content-type": "application/x-www-form-urlencoded" } }),
    )
    expect(res.status).toBe(415)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("API tidak terjangkau dibalas 503", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"))
    const res = await login(request("/api/session/login", { body: { email: "a@b.test", password: "x" } }))
    expect(res.status).toBe(503)
    expect((await res.json()).error.code).toBe("SERVICE_UNAVAILABLE")
  })
})

describe("POST /api/session/refresh", () => {
  it("menukar cookie lama dengan yang baru, access token di body", async () => {
    fetchMock.mockResolvedValue(apiReply(200, { success: true, data: tokens }))
    const res = await refresh(request("/api/session/refresh", { cookie: "jasana_refresh=token-lama; jasana_sesi=1" }))

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${API}/auth/refresh`)
    expect(JSON.parse(init.body as string)).toEqual({ refresh_token: "token-lama" })
    expect((await res.json()).data).toEqual({ access_token: "akses-baru", expires_in: 900 })
    expect(setCookies(res).jasana_refresh).toMatch(/^jasana_refresh=refresh-baru;/)
  })

  it("tanpa cookie refresh: 401 tanpa memanggil API, penanda basi ikut dihapus", async () => {
    const res = await refresh(request("/api/session/refresh", { cookie: "jasana_sesi=1" }))
    expect(res.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
    const cookies = setCookies(res)
    expect(cookies.jasana_sesi).toMatch(/^jasana_sesi=;.*Max-Age=0/)
    expect(cookies.jasana_refresh).toMatch(/^jasana_refresh=;.*Path=\/api\/session.*Max-Age=0|Max-Age=0.*Path=\/api\/session/)
  })

  it("401 dari API (token dicabut atau dipakai ulang): kedua cookie dihapus", async () => {
    fetchMock.mockResolvedValue(
      apiReply(401, { success: false, error: { code: "UNAUTHORIZED", message: "dicabut", details: [] } }),
    )
    const res = await refresh(request("/api/session/refresh", { cookie: "jasana_refresh=token-lama; jasana_sesi=1" }))
    expect(res.status).toBe(401)
    const cookies = setCookies(res)
    expect(cookies.jasana_refresh).toMatch(/Max-Age=0/)
    expect(cookies.jasana_sesi).toMatch(/Max-Age=0/)
  })

  it("API mati atau 5xx: cookie dibiarkan karena sesi belum tentu mati", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"))
    const down = await refresh(request("/api/session/refresh", { cookie: "jasana_refresh=token-lama" }))
    expect(down.status).toBe(503)
    expect(down.headers.getSetCookie()).toEqual([])

    fetchMock.mockResolvedValueOnce(
      apiReply(500, { success: false, error: { code: "INTERNAL_ERROR", message: "x", details: [] } }),
    )
    const broken = await refresh(request("/api/session/refresh", { cookie: "jasana_refresh=token-lama" }))
    expect(broken.status).toBe(500)
    expect(broken.headers.getSetCookie()).toEqual([])
  })
})

describe("POST /api/session/logout", () => {
  it("mencabut refresh token di API dengan Bearer dari client, lalu menghapus kedua cookie", async () => {
    fetchMock.mockResolvedValue(apiReply(200, { success: true, data: { revoked: true } }))
    const res = await logout(
      request("/api/session/logout", {
        cookie: "jasana_refresh=token-lama; jasana_sesi=1",
        headers: { authorization: "Bearer akses" },
      }),
    )

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${API}/auth/logout`)
    expect(JSON.parse(init.body as string)).toEqual({ refresh_token: "token-lama" })
    expect((init.headers as Headers).get("authorization")).toBe("Bearer akses")
    expect((await res.json()).data).toEqual({ revoked: true })
    const cookies = setCookies(res)
    expect(cookies.jasana_refresh).toMatch(/Max-Age=0/)
    expect(cookies.jasana_sesi).toMatch(/Max-Age=0/)
  })

  it("tanpa Bearer: tidak memanggil API (revoked null), cookie tetap dihapus", async () => {
    const res = await logout(request("/api/session/logout", { cookie: "jasana_refresh=token-lama; jasana_sesi=1" }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect((await res.json()).data).toEqual({ revoked: null })
    expect(setCookies(res).jasana_sesi).toMatch(/Max-Age=0/)
  })

  it("API menolak (Bearer kedaluwarsa): revoked false, cookie tetap dihapus", async () => {
    fetchMock.mockResolvedValue(
      apiReply(401, { success: false, error: { code: "UNAUTHORIZED", message: "x", details: [] } }),
    )
    const res = await logout(
      request("/api/session/logout", { cookie: "jasana_refresh=token-lama", headers: { authorization: "Bearer basi" } }),
    )
    expect((await res.json()).data).toEqual({ revoked: false })
    expect(setCookies(res).jasana_refresh).toMatch(/Max-Age=0/)
  })
})
