import { describe, expect, it } from "vitest"
import { lastForwardedFor, upstreamHeaders } from "./session-server"

describe("lastForwardedFor (CLAUDE.md web jebakan 3)", () => {
  it("mengambil entri paling kanan, yang ditambahkan hop terdekat di depan Next", () => {
    expect(lastForwardedFor("203.0.113.7")).toBe("203.0.113.7")
    // Entri kiri bisa dipalsukan browser, karena Next tidak menimpa header yang sudah ada.
    expect(lastForwardedFor("1.1.1.1, 2.2.2.2 , 203.0.113.7")).toBe("203.0.113.7")
    expect(lastForwardedFor(" , ")).toBeNull()
    expect(lastForwardedFor(null)).toBeNull()
  })

  it("upstreamHeaders meneruskan User-Agent asli dan menambahkan header tambahan", () => {
    const req = new Request("http://localhost:3100/api/session/login", {
      headers: { "user-agent": "Mozilla/5.0 (iPhone)", "x-forwarded-for": "6.6.6.6, ::1" },
    })
    const headers = upstreamHeaders(req, { Authorization: "Bearer x" })
    expect(headers.get("user-agent")).toBe("Mozilla/5.0 (iPhone)")
    expect(headers.get("x-forwarded-for")).toBe("::1")
    expect(headers.get("authorization")).toBe("Bearer x")
    expect(headers.get("content-type")).toBe("application/json")
  })

  it("tanpa X-Forwarded-For masuk, tidak ada yang dikarang", () => {
    const headers = upstreamHeaders(new Request("http://localhost:3100/"))
    expect(headers.has("x-forwarded-for")).toBe(false)
  })
})
