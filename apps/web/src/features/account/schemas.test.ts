import { describe, expect, it } from "vitest"
import { ApiError } from "@/lib/api-error"
import { getErrorMessage, RATE_LIMITED_MESSAGE } from "@/lib/error-messages"
import {
  addressFormSchema,
  changePasswordFormSchema,
  mapAddressError,
  mapChangeEmailError,
  mapChangePasswordError,
  mapProfileError,
  toAddressFormValues,
  toAddressInput,
} from "./schemas"

const invalid = (path: string, message: string) => new ApiError(422, "VALIDATION_ERROR", [{ path, message }])

describe("formulir akun", () => {
  it("nomor ponsel milik akun lain dibedakan dari nomor yang salah bentuk", () => {
    expect(mapProfileError(invalid("phone", "Nomor ponsel sudah terdaftar")).fields.phone).toMatch(/akun lain/)
    expect(mapProfileError(invalid("phone", "phone harus nomor ponsel Indonesia yang sah")).fields.phone).toBe(
      "Periksa lagi nomor ponselmu.",
    )
  })

  it("tiga galat email baru punya pesan sendiri", () => {
    const message = (text: string) => mapChangeEmailError(invalid("new_email", text)).fields.new_email
    expect(message("Alamat baru sama dengan alamat saat ini")).toMatch(/sudah email akunmu/)
    expect(message("Alamat email sudah dipakai akun lain")).toMatch(/akun lain/)
    expect(message("email tidak sah")).toBe("Periksa lagi emailmu.")
  })

  it("kata sandi saat ini yang salah (422) jatuh ke isiannya", () => {
    const error = invalid("current_password", "Password saat ini salah")
    const expected = "Kata sandi salah. Periksa lagi."
    expect(mapChangeEmailError(error)).toEqual({ fields: { current_password: expected }, form: null })
    expect(mapChangePasswordError(error)).toEqual({ fields: { current_password: expected }, form: null })
  })

  it("429 ganti email memakai jam, bukan ratusan menit", () => {
    expect(mapChangeEmailError(new ApiError(429, "RATE_LIMIT_EXCEEDED", [], 82_800)).form).toBe(
      `${RATE_LIMITED_MESSAGE} Coba lagi dalam 23 jam.`,
    )
    expect(mapChangeEmailError(new ApiError(429, "RATE_LIMIT_EXCEEDED")).form).toBe(getErrorMessage("RATE_LIMIT_EXCEEDED"))
  })

  it("kata sandi baru wajib berbeda", () => {
    const result = changePasswordFormSchema.safeParse({ current_password: "sama-sama-1", new_password: "sama-sama-1" })
    expect(result.error?.issues[0]?.path).toEqual(["new_password"])
  })
})

describe("formulir alamat", () => {
  const valid = { ...toAddressFormValues(null), address_line: "Jl. Uji No. 1", point: { lat: -8.67, lng: 115.23 } }
  const pathsOf = (values: unknown) => addressFormSchema.safeParse(values).error?.issues.map((issue) => issue.path[0])

  it("hanya alamat lengkap dan titik yang wajib", () => {
    expect(pathsOf(valid)).toBeUndefined()
    expect(pathsOf(toAddressFormValues(null))).toEqual(["address_line", "point"])
  })

  it("kode pos kosong atau tepat lima angka", () => {
    expect(pathsOf({ ...valid, postal_code: "80226" })).toBeUndefined()
    expect(pathsOf({ ...valid, postal_code: "8022" })).toEqual(["postal_code"])
  })

  it("isian kosong dikirim null, bukan string kosong yang ditolak backend", () => {
    expect(toAddressInput({ ...valid, label: "  " }, valid.point)).toEqual({
      label: null,
      address_line: "Jl. Uji No. 1",
      district: null,
      city: null,
      province: null,
      postal_code: null,
      latitude: -8.67,
      longitude: 115.23,
    })
  })

  it("galat koordinat dari server jatuh ke peta", () => {
    expect(mapAddressError(invalid("latitude", "latitude wajib diisi")).fields.point).toMatch(/peta/)
  })
})
