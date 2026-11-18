import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ApiError, apiFetch, shouldRetry } from "./api-client"
import { getAccessToken, getSessionStatus, resetSessionForTests } from "./session"

describe("shouldRetry", () => {
  it("jaringan putus dan 5xx diulang sekali saja", () => {
    expect(shouldRetry(0, new ApiError(0, null))).toBe(true)
    expect(shouldRetry(1, new ApiError(0, null))).toBe(false)
    expect(shouldRetry(0, new ApiError(503, "SERVICE_UNAVAILABLE"))).toBe(true)
    expect(shouldRetry(0, new Error("lain"))).toBe(true)
  })

  it("4xx tidak diulang", () => {
    expect(shouldRetry(0, new ApiError(404, "NOT_FOUND"))).toBe(false)
    expect(shouldRetry(0, new ApiError(422, "VALIDATION_ERROR"))).toBe(false)
    expect(shouldRetry(0, new ApiError(429, "RATE_LIMIT_EXCEEDED"))).toBe(false)
  })
})

// --- Retry 401 (PRD Frontend 7.1) -------------------------------------------------------------

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })
}
const ok = (data: unknown) => json(200, { success: true, data })
const unauthorized = () => json(401, { success: false, error: { code: "UNAUTHORIZED", message: "x", details: [] } })

let assign: ReturnType<typeof vi.fn>
let fetchMock: ReturnType<typeof vi.fn>

function installBrowser(cookie: string) {
  assign = vi.fn()
  vi.stubGlobal("window", { location: { pathname: "/pesanan", search: "?tab=aktif", assign } })
  vi.stubGlobal("document", { cookie })
  vi.stubGlobal("navigator", {})
}

/** apiResponses dipakai berurutan untuk request ke API; refresh selalu menerbitkan token baru. */
function route(apiResponses: Array<() => Response>, refreshResponse?: () => Response) {
  let issued = 0
  fetchMock = vi.fn((input: string | URL) => {
    if (String(input).endsWith("/api/session/refresh")) {
      return Promise.resolve(refreshResponse ? refreshResponse() : ok({ access_token: `akses-${++issued}`, expires_in: 900 }))
    }
    const next = apiResponses.shift()
    if (!next) throw new Error(`request tak terduga ke ${String(input)}`)
    return Promise.resolve(next())
  })
  vi.stubGlobal("fetch", fetchMock)
}

const apiCalls = () => fetchMock.mock.calls.filter(([url]) => String(url).startsWith("http://api.test"))
const bearerOf = (call: unknown[]) => new Headers((call[1] as RequestInit).headers).get("authorization")

describe("apiFetch dengan sesi", () => {
  beforeEach(() => resetSessionForTests())
  afterEach(() => vi.unstubAllGlobals())

  it("memasang Authorization dari memori pada request pertama", async () => {
    installBrowser("jasana_sesi=1")
    route([() => ok({ id: "u1" })])
    await apiFetch("/auth/me")
    expect(bearerOf(apiCalls()[0]!)).toBe("Bearer akses-1")
  })

  it("401: refresh sekali lalu ulangi dengan token baru", async () => {
    installBrowser("jasana_sesi=1")
    route([unauthorized, () => ok({ id: "u1" })])

    await expect(apiFetch("/auth/me")).resolves.toEqual({ data: { id: "u1" }, meta: undefined })

    const calls = apiCalls()
    expect(calls).toHaveLength(2)
    expect(bearerOf(calls[0]!)).toBe("Bearer akses-1")
    expect(bearerOf(calls[1]!)).toBe("Bearer akses-2")
    expect(assign).not.toHaveBeenCalled()
  })

  it("401 kedua: sesi dihapus dan diarahkan ke /masuk?next= halaman saat ini", async () => {
    installBrowser("jasana_sesi=1")
    route([unauthorized, unauthorized])

    await expect(apiFetch("/auth/me")).rejects.toMatchObject({ status: 401 })
    expect(apiCalls()).toHaveLength(2)
    expect(getAccessToken()).toBeNull()
    expect(getSessionStatus()).toBe("guest")
    expect(assign).toHaveBeenCalledWith("/masuk?next=%2Fpesanan%3Ftab%3Daktif")
  })

  it("refresh ditolak: tidak mengulang request, langsung ke /masuk", async () => {
    installBrowser("jasana_sesi=1")
    let first = true
    route([unauthorized], () => {
      if (first) {
        first = false
        return ok({ access_token: "akses-1", expires_in: 900 })
      }
      return unauthorized()
    })

    await expect(apiFetch("/auth/me")).rejects.toMatchObject({ status: 401 })
    expect(apiCalls()).toHaveLength(1)
    expect(assign).toHaveBeenCalledTimes(1)
  })

  it("tamu tanpa sesi: 401 tidak memicu refresh maupun pengalihan", async () => {
    installBrowser("")
    route([unauthorized])
    await expect(apiFetch("/auth/me")).rejects.toMatchObject({ status: 401, code: "UNAUTHORIZED" })
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/api/session/"))).toBe(false)
    expect(assign).not.toHaveBeenCalled()
  })
})
