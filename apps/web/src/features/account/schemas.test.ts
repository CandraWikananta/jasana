import { describe, expect, it } from "vitest"
import { ApiError } from "@/lib/api-error"
import { getErrorMessage, RATE_LIMITED_MESSAGE } from "@/lib/error-messages"
import { changePasswordFormSchema, mapChangeEmailError, mapChangePasswordError, mapProfileError } from "./schemas"

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
