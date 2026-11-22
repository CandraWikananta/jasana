import { describe, expect, it } from "vitest"
import { HERO_TITLE_FALLBACK, heroTitle } from "./hero-title"

describe("heroTitle", () => {
  it("memakai judul cadangan tanpa kategori", () => {
    expect(heroTitle([])).toBe(HERO_TITLE_FALLBACK)
    expect(heroTitle(["  ", ""])).toBe(HERO_TITLE_FALLBACK)
  })

  it("satu dan dua kategori", () => {
    expect(heroTitle(["Otomotif"])).toBe("Jasa otomotif yang datang ke tempatmu")
    expect(heroTitle(["Otomotif", "Fotografi"])).toBe("Jasa otomotif dan fotografi yang datang ke tempatmu")
  })

  it("empat kategori ditulis semua", () => {
    expect(heroTitle(["Otomotif", "Fotografi", "Kecantikan", "Perbaikan"])).toBe(
      "Jasa otomotif, fotografi, kecantikan, dan perbaikan yang datang ke tempatmu",
    )
  })

  it("lebih dari empat diringkas dan lainnya", () => {
    expect(heroTitle(["Otomotif", "Fotografi", "Kecantikan", "Perbaikan", "Kebersihan"])).toBe(
      "Jasa otomotif, fotografi, kecantikan, perbaikan, dan lainnya yang datang ke tempatmu",
    )
  })

  it("hanya huruf pertama yang dikecilkan, singkatan utuh", () => {
    expect(heroTitle(["Servis AC", "AC dan Kulkas"])).toBe("Jasa servis AC dan AC dan Kulkas yang datang ke tempatmu")
  })
})
