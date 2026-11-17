import { describe, expect, it } from "vitest"
import { formatDelta, formatDurasi, formatJarak, formatNilaiAtribut, formatRating, formatRupiah } from "./format"

describe("formatRupiah", () => {
  it("memformat integer rupiah tanpa spasi", () => {
    expect(formatRupiah(150000)).toBe("Rp150.000")
    expect(formatRupiah(1250000)).toBe("Rp1.250.000")
  })
  it("nol dan negatif", () => {
    expect(formatRupiah(0)).toBe("Rp0")
    expect(formatRupiah(-50000)).toBe("-Rp50.000")
  })
})

describe("formatDelta", () => {
  it("positif, nol, negatif", () => {
    expect(formatDelta(25000)).toBe("+Rp25.000")
    expect(formatDelta(0)).toBe("Termasuk")
    expect(formatDelta(-10000)).toBe("-Rp10.000")
  })
})

describe("formatJarak", () => {
  it("meter di bawah 1 km, km dengan koma di atasnya", () => {
    expect(formatJarak(0)).toBe("0 m")
    expect(formatJarak(350.4)).toBe("350 m")
    expect(formatJarak(1200)).toBe("1,2 km")
    expect(formatJarak(12345)).toBe("12,3 km")
  })
  it("999,6 m dibulatkan jadi 1,0 km, bukan 1000 m", () => {
    expect(formatJarak(999.6)).toBe("1,0 km")
  })
})

describe("formatRating", () => {
  it("satu desimal dengan koma", () => {
    expect(formatRating(4.8)).toBe("4,8")
    expect(formatRating(5)).toBe("5,0")
    expect(formatRating(4.25)).toBe("4,3")
  })
})

describe("formatDurasi", () => {
  it("menit, jam bulat, jam dan menit", () => {
    expect(formatDurasi(0)).toBe("0 menit")
    expect(formatDurasi(45)).toBe("45 menit")
    expect(formatDurasi(120)).toBe("2 jam")
    expect(formatDurasi(90)).toBe("1 jam 30 menit")
  })
})

describe("formatNilaiAtribut", () => {
  it("daftar, boolean, angka bersatuan, kosong", () => {
    expect(formatNilaiAtribut(["Sport", "Matic"], null)).toBe("Sport, Matic")
    expect(formatNilaiAtribut(true, null)).toBe("Ya")
    expect(formatNilaiAtribut(false, null)).toBe("Tidak")
    expect(formatNilaiAtribut(2, "PK")).toBe("2 PK")
    expect(formatNilaiAtribut("Keduanya bisa", null)).toBe("Keduanya bisa")
    expect(formatNilaiAtribut([], null)).toBeNull()
    expect(formatNilaiAtribut("", null)).toBeNull()
    expect(formatNilaiAtribut(undefined, null)).toBeNull()
  })
})
