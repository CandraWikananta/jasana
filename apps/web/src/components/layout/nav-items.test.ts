import { describe, expect, it } from "vitest"
import { assistantWidgetAt, bottomNavAt, findNavItem, navSlugs } from "./nav-items"

describe("bottomNavAt", () => {
  it("pekerja di semua lebar, termasuk halaman anaknya", () => {
    expect(bottomNavAt("/pekerja")).toBe("all")
    expect(bottomNavAt("/pekerja/tugas/abc")).toBe("all")
  })

  it("pelanggan hanya di HP: area pelanggan, Beranda, dan Cari", () => {
    for (const path of ["/", "/cari", "/pesanan", "/pesanan/abc", "/notifikasi", "/akun/alamat", "/pesan/abc"]) {
      expect(bottomNavAt(path), path).toBe("mobile")
    }
  })

  it("tidak ada di detail jasa, profil penyedia, usaha, admin, dan /pekerjaan", () => {
    for (const path of ["/listing/abc", "/penyedia/abc", "/usaha", "/admin/penyedia", "/pekerjaan", "/masuk"]) {
      expect(bottomNavAt(path), path).toBeNull()
    }
  })
})

describe("assistantWidgetAt", () => {
  it("publik dan pelanggan", () => {
    for (const path of ["/", "/cari", "/penyedia/abc", "/akun", "/akun/alamat", "/notifikasi", "/pesanan", "/pesanan/abc"]) {
      expect(assistantWidgetAt(path), path).toBe("all")
    }
  })

  it("detail jasa mulai lg, karena bar Pesan", () => {
    expect(assistantWidgetAt("/listing/abc")).toBe("lg")
  })

  it("tidak di /asisten dan form pesan", () => {
    expect(assistantWidgetAt("/asisten")).toBeNull()
    expect(assistantWidgetAt("/pesan/abc")).toBeNull()
  })
})

describe("halaman penampung", () => {
  it("menemukan item menu dari slug dan menolak slug lain", () => {
    expect(findNavItem("admin", ["penyedia"])?.label).toBe("Penyedia")
    expect(findNavItem("usaha", ["saldo"])?.label).toBe("Saldo")
    expect(findNavItem("usaha", ["apa"])).toBeUndefined()
    expect(findNavItem("usaha", ["saldo", "lain"])).toBeUndefined()
  })

  it("slug statis tanpa akar area", () => {
    expect(navSlugs("pekerja")).toEqual([{ slug: ["tugas"] }, { slug: ["profil"] }])
  })
})
