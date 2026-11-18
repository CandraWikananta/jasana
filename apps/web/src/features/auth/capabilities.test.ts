import { describe, expect, it } from "vitest"
import type { Me } from "@/types/api/auth"
import { getCapabilities } from "./capabilities"

const base: Me = {
  id: "u1",
  full_name: "Budi Santoso",
  email: "budi@jasana.test",
  pending_email: null,
  phone: "+6281234567890",
  role: "CLIENT",
  avatar_url: null,
  email_verified: true,
  email_verified_at: "2026-11-01T00:00:00.000Z",
  created_at: "2026-11-01T00:00:00.000Z",
  provider: null,
  worker: null,
}

describe("getCapabilities (D220)", () => {
  it("tamu: tanpa area", () => {
    expect(getCapabilities(null).areas).toEqual([])
    expect(getCapabilities(undefined).isAdmin).toBe(false)
  })

  it("client biasa: hanya area pelanggan", () => {
    const caps = getCapabilities(base)
    expect(caps.areas).toEqual(["pelanggan"])
    expect(caps.isEmailVerified).toBe(true)
    expect(caps.isVerifiedProvider).toBe(false)
  })

  it("pemilik INDIVIDUAL terverifikasi juga pekerja di usahanya sendiri (D33): area usaha DAN pekerja", () => {
    const caps = getCapabilities({
      ...base,
      provider: { id: "p1", provider_type: "INDIVIDUAL", verification_status: "VERIFIED" },
      worker: { id: "w1", provider_profile_id: "p1", is_owner: true },
    })
    expect(caps.areas).toEqual(["pelanggan", "usaha", "pekerja"])
    expect(caps.isVerifiedProvider).toBe(true)
    expect(caps.isOwnerWorker).toBe(true)
    expect(caps.providerType).toBe("INDIVIDUAL")
  })

  it("provider yang masih mendaftar (PENDING) tetap masuk area usaha, tapi bukan provider terverifikasi", () => {
    const caps = getCapabilities({
      ...base,
      provider: { id: "p1", provider_type: "BUSINESS", verification_status: "PENDING" },
    })
    expect(caps.areas).toEqual(["pelanggan", "usaha"])
    expect(caps.hasProviderProfile).toBe(true)
    expect(caps.isVerifiedProvider).toBe(false)
  })

  it("pekerja di usaha orang lain: pelanggan dan pekerja, bukan pemilik", () => {
    const caps = getCapabilities({ ...base, worker: { id: "w2", provider_profile_id: "p9", is_owner: false } })
    expect(caps.areas).toEqual(["pelanggan", "pekerja"])
    expect(caps.isOwnerWorker).toBe(false)
  })

  it("admin dari role, email belum terverifikasi terbaca", () => {
    const caps = getCapabilities({ ...base, role: "ADMIN", email_verified: false, email_verified_at: null })
    expect(caps.areas).toEqual(["pelanggan", "admin"])
    expect(caps.isAdmin).toBe(true)
    expect(caps.isEmailVerified).toBe(false)
  })
})
