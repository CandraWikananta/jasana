import { describe, expect, it } from "vitest"
import { formatJam, formatTanggal, formatTanggalJam } from "./time"

describe("format waktu WITA", () => {
  it("contoh Design System Bagian 8", () => {
    const iso = "2026-11-17T06:00:00.000Z" // 14.00 WITA
    expect(formatTanggal(iso)).toBe("Sel, 17 Nov 2026")
    expect(formatJam(iso)).toBe("14.00 WITA")
    expect(formatTanggalJam(iso)).toBe("Sel, 17 Nov 2026, 14.00 WITA")
  })

  it("pergantian tanggal: 16.30 UTC sudah hari berikutnya di WITA", () => {
    const iso = "2026-11-17T16:30:00.000Z"
    expect(formatTanggalJam(iso)).toBe("Rab, 18 Nov 2026, 00.30 WITA")
  })

  it("tengah malam WITA tampil 00.00, bukan 24.00", () => {
    expect(formatJam("2026-11-17T16:00:00.000Z")).toBe("00.00 WITA")
  })
})
