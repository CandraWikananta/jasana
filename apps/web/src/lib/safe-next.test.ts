import { describe, expect, it } from "vitest"
import { loginHref, safeNext } from "./safe-next"

describe("safeNext (open redirect)", () => {
  it("menerima path relatif di origin sendiri beserta query", () => {
    expect(safeNext("/pesanan")).toBe("/pesanan")
    expect(safeNext("/pesan/abc?mode=SCHEDULED#ringkasan")).toBe("/pesan/abc?mode=SCHEDULED#ringkasan")
  })

  it("menolak URL ke host lain dalam berbagai bentuk", () => {
    for (const value of [
      "https://jahat.test",
      "//jahat.test",
      "/\\jahat.test",
      "javascript:alert(1)",
      "/\t/jahat.test",
      "pesanan",
      "",
      null,
      undefined,
    ]) {
      expect(safeNext(value)).toBeNull()
    }
  })

  it("loginHref meng-encode path tujuan", () => {
    expect(loginHref("/pesanan?tab=aktif")).toBe("/masuk?next=%2Fpesanan%3Ftab%3Daktif")
  })
})
