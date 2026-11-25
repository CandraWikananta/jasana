import { describe, expect, it } from "vitest"
import { MIN_PIN_ZOOM, pickPoint } from "./geo"

const RENON = { lat: -8.6705, lng: 115.2346 }

describe("pickPoint", () => {
  it("menerima titik hanya kalau peta sudah cukup dekat", () => {
    expect(pickPoint(RENON, MIN_PIN_ZOOM, null)).toEqual(RENON)
    expect(pickPoint(RENON, MIN_PIN_ZOOM - 1, null)).toBeNull()
  })

  it("memperkecil peta tanpa menggeser mempertahankan titik apa adanya", () => {
    const saved = { lat: -8.67051234, lng: 115.23461234 }
    expect(pickPoint({ lat: saved.lat + 1e-6, lng: saved.lng }, 12, saved)).toBe(saved)
  })

  it("menggeser saat peta jauh membatalkan titik lama", () => {
    expect(pickPoint({ lat: -8.7, lng: 115.2 }, 12, RENON)).toBeNull()
  })

  it("membulatkan ke enam desimal", () => {
    expect(pickPoint({ lat: -8.67050001234, lng: 115.234600009 }, 18, null)).toEqual(RENON)
  })
})
