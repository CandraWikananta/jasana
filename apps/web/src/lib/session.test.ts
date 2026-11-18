import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ApiError } from "./api-error"
import {
  bootstrapSession,
  ensureAccessToken,
  getAccessToken,
  getSessionStatus,
  isSessionSuspended,
  login,
  logout,
  refreshSession,
  resetSessionForTests,
} from "./session"

// Browser tiruan: window, document.cookie, navigator.locks (mutex FIFO seperti aslinya).

type Handler = (url: string, init: RequestInit) => Response | Promise<Response>

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })
}

const ok = (data: unknown) => json(200, { success: true, data })
const unauthorized = () => json(401, { success: false, error: { code: "UNAUTHORIZED", message: "x", details: [] } })

let fetchMock: ReturnType<typeof vi.fn>
let lockRequest: ReturnType<typeof vi.fn>

function installBrowser({ cookie = "jasana_sesi=1", locks = true } = {}) {
  let tail: Promise<unknown> = Promise.resolve()
  lockRequest = vi.fn((_name: string, task: () => Promise<unknown>) => {
    const run = tail.then(task)
    tail = run.catch(() => undefined)
    return run
  })
  vi.stubGlobal("window", { location: { pathname: "/pesanan", search: "", assign: vi.fn() } })
  vi.stubGlobal("document", { cookie })
  vi.stubGlobal("navigator", locks ? { locks: { request: lockRequest } } : {})
}

function route(handler: Handler) {
  fetchMock = vi.fn((input: string | URL, init: RequestInit = {}) => Promise.resolve(handler(String(input), init)))
  vi.stubGlobal("fetch", fetchMock)
}

const calls = (path: string) => fetchMock.mock.calls.filter(([url]) => String(url).endsWith(path))

beforeEach(() => {
  resetSessionForTests()
  installBrowser()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("refreshSession (D212, CLAUDE.md web jebakan 2)", () => {
  it("single-flight: refresh bersamaan dalam satu tab hanya mengirim satu request", async () => {
    let issued = 0
    route(() => ok({ access_token: `akses-${++issued}`, expires_in: 900 }))

    const results = await Promise.all([refreshSession(), refreshSession(), refreshSession()])

    expect(results).toEqual([true, true, true])
    expect(calls("/api/session/refresh")).toHaveLength(1)
    expect(getAccessToken()).toBe("akses-1")
    expect(getSessionStatus()).toBe("authenticated")
  })

  it("dibungkus navigator.locks dengan nama jasana-refresh, supaya antar tab bergiliran", async () => {
    route(() => ok({ access_token: "a", expires_in: 900 }))
    await refreshSession()
    expect(lockRequest).toHaveBeenCalledTimes(1)
    expect(lockRequest.mock.calls[0]![0]).toBe("jasana-refresh")
  })

  it("refresh berikutnya setelah selesai mengirim request baru (promise tidak disimpan selamanya)", async () => {
    route(() => ok({ access_token: "a", expires_in: 900 }))
    await refreshSession()
    await refreshSession()
    expect(calls("/api/session/refresh")).toHaveLength(2)
  })

  it("tanpa navigator.locks tetap berjalan (single-flight saja)", async () => {
    installBrowser({ locks: false })
    route(() => ok({ access_token: "a", expires_in: 900 }))
    await expect(Promise.all([refreshSession(), refreshSession()])).resolves.toEqual([true, true])
    expect(calls("/api/session/refresh")).toHaveLength(1)
  })

  it("401: sesi berakhir, token di memori dihapus", async () => {
    route(() => ok({ access_token: "a", expires_in: 900 }))
    await refreshSession()
    route(() => unauthorized())

    await expect(refreshSession()).resolves.toBe(false)
    expect(getAccessToken()).toBeNull()
    expect(getSessionStatus()).toBe("guest")
  })

  it("5xx: melempar ApiError tanpa menghapus sesi", async () => {
    route(() => ok({ access_token: "a", expires_in: 900 }))
    await refreshSession()
    route(() => json(503, { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "x", details: [] } }))

    await expect(refreshSession()).rejects.toBeInstanceOf(ApiError)
    expect(getAccessToken()).toBe("a")
    expect(getSessionStatus()).toBe("authenticated")
  })
})

describe("bootstrapSession", () => {
  it("tamu tanpa cookie penanda: tidak memanggil refresh", async () => {
    installBrowser({ cookie: "lain=1" })
    route(() => ok({}))
    await bootstrapSession()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(getSessionStatus()).toBe("guest")
  })

  it("ada penanda: memulihkan access token sekali per tab", async () => {
    route(() => ok({ access_token: "pulih", expires_in: 900 }))
    await Promise.all([bootstrapSession(), bootstrapSession()])
    expect(calls("/api/session/refresh")).toHaveLength(1)
    expect(getAccessToken()).toBe("pulih")
  })

  it("API tidak terjangkau: tampil sebagai tamu, tidak melempar", async () => {
    route(() => {
      throw new TypeError("fetch failed")
    })
    await expect(bootstrapSession()).resolves.toBeUndefined()
    expect(getSessionStatus()).toBe("guest")
  })

  // H137: AreaGate hanya mengalihkan ke /masuk kalau sesinya benar-benar berakhir.
  it("5xx saat bootstrap: tertunda (penanda dibiarkan), bukan berakhir", async () => {
    route(() => json(503, { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "x", details: [] } }))
    await bootstrapSession()
    expect(getSessionStatus()).toBe("guest")
    expect(isSessionSuspended()).toBe(true)
  })

  it("refresh ditolak 401: handler menghapus penanda, sesi berakhir", async () => {
    route(() => {
      document.cookie = ""
      return unauthorized()
    })
    await bootstrapSession()
    expect(getSessionStatus()).toBe("guest")
    expect(isSessionSuspended()).toBe(false)
  })

  it("login berhasil: tidak tertunda", async () => {
    route(() => ok({ access_token: "a", expires_in: 900 }))
    await bootstrapSession()
    expect(isSessionSuspended()).toBe(false)
  })
})

describe("ensureAccessToken", () => {
  it("me-refresh dulu kalau access token sudah (hampir) kedaluwarsa", async () => {
    const start = 1_800_000_000_000
    const now = vi.spyOn(Date, "now").mockReturnValue(start)
    let issued = 0
    route(() => ok({ access_token: `akses-${++issued}`, expires_in: 900 }))

    await bootstrapSession()
    expect(await ensureAccessToken()).toBe("akses-1")
    expect(calls("/api/session/refresh")).toHaveLength(1)

    // 30 detik sebelum habis sudah dianggap kedaluwarsa.
    now.mockReturnValue(start + 871_000)
    expect(await ensureAccessToken()).toBe("akses-2")
    expect(calls("/api/session/refresh")).toHaveLength(2)
  })
})

describe("login", () => {
  it("menyimpan access token di memori, tidak di storage", async () => {
    installBrowser({ cookie: "" })
    route(() => ok({ access_token: "dari-login", expires_in: 900, user: { id: "u1" } }))
    const user = await login({ email: "a@b.test", password: "x" })
    expect(user).toEqual({ id: "u1" })
    expect(getAccessToken()).toBe("dari-login")
    const [, init] = calls("/api/session/login")[0]!
    expect(JSON.parse(init.body)).toEqual({ email: "a@b.test", password: "x" })
  })

  it("gagal: ApiError dengan kode dan Retry-After dari handler", async () => {
    route(() =>
      new Response(JSON.stringify({ success: false, error: { code: "RATE_LIMIT_EXCEEDED", message: "x", details: [] } }), {
        status: 429,
        headers: { "retry-after": "120" },
      }),
    )
    const error = await login({ email: "a@b.test", password: "x" }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).code).toBe("RATE_LIMIT_EXCEEDED")
    expect((error as ApiError).retryAfterSeconds).toBe(120)
  })
})

describe("logout (wajib mencabut refresh token di server)", () => {
  it("access token kedaluwarsa: refresh dulu, lalu logout dengan Bearer yang baru", async () => {
    const start = 1_800_000_000_000
    const now = vi.spyOn(Date, "now").mockReturnValue(start)
    let issued = 0
    route((url) =>
      url.endsWith("/logout") ? ok({ revoked: true }) : ok({ access_token: `akses-${++issued}`, expires_in: 900 }),
    )
    await bootstrapSession()
    now.mockReturnValue(start + 20 * 60_000)

    await expect(logout()).resolves.toEqual({ revoked: true })

    const paths = fetchMock.mock.calls.map(([url]) => String(url))
    expect(paths).toEqual(["/api/session/refresh", "/api/session/refresh", "/api/session/logout"])
    const [, init] = calls("/api/session/logout")[0]!
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer akses-2")
    expect(getAccessToken()).toBeNull()
    expect(getSessionStatus()).toBe("guest")
  })

  it("access token masih berlaku: langsung logout tanpa refresh", async () => {
    route((url) => (url.endsWith("/logout") ? ok({ revoked: true }) : ok({ access_token: "a", expires_in: 900 })))
    await bootstrapSession()
    await logout()
    expect(calls("/api/session/refresh")).toHaveLength(1)
    expect(new Headers(calls("/api/session/logout")[0]![1].headers).get("authorization")).toBe("Bearer a")
  })

  it("logout ikut antre di kunci yang sama dengan refresh", async () => {
    route((url) => (url.endsWith("/logout") ? ok({ revoked: true }) : ok({ access_token: "a", expires_in: 900 })))
    await bootstrapSession()
    lockRequest.mockClear()
    await logout()
    expect(lockRequest).toHaveBeenCalledTimes(1)
  })

  it("sesi sudah mati di server: handler tetap dipanggil tanpa Bearer supaya cookie terhapus", async () => {
    route((url) => (url.endsWith("/logout") ? ok({ revoked: null }) : unauthorized()))
    await logout()
    const [, init] = calls("/api/session/logout")[0]!
    expect(new Headers(init.headers).has("authorization")).toBe(false)
    expect(getSessionStatus()).toBe("guest")
  })
})
