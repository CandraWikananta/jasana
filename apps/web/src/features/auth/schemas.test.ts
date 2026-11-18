import { describe, expect, it } from "vitest"
import { ApiError } from "@/lib/api-error"
import { LOGIN_UNAUTHORIZED_MESSAGE } from "@/lib/error-messages"
import { loginFormSchema, mapLoginError, toLoginInput } from "./schemas"

describe("formulir masuk", () => {
  it("identitas berisi @ dikirim sebagai email, selain itu sebagai phone", () => {
    expect(toLoginInput({ identifier: " budi@jasana.test ", password: "x" })).toEqual({
      email: "budi@jasana.test",
      password: "x",
    })
    expect(toLoginInput({ identifier: "0812 3456 7890", password: "x" })).toEqual({
      phone: "0812 3456 7890",
      password: "x",
    })
  })

  it("isian kosong ditolak di client", () => {
    expect(loginFormSchema.safeParse({ identifier: "  ", password: "" }).success).toBe(false)
  })

  it("401 memakai pesan khusus masuk, bukan 'Sesimu sudah berakhir'", () => {
    expect(mapLoginError(new ApiError(401, "UNAUTHORIZED"))).toEqual({ fields: {}, form: LOGIN_UNAUTHORIZED_MESSAGE })
  })

  it("422 dipetakan ke field (email dan phone ke isian identitas)", () => {
    const view = mapLoginError(
      new ApiError(422, "VALIDATION_ERROR", [{ path: "phone", message: "phone harus nomor ponsel Indonesia yang sah" }]),
    )
    expect(view.form).toBeNull()
    expect(view.fields.identifier).toBe("Periksa lagi email atau nomor ponselmu.")
  })

  it("429 menyebut kapan bisa mencoba lagi kalau ada Retry-After", () => {
    const view = mapLoginError(new ApiError(429, "RATE_LIMIT_EXCEEDED", [], 540))
    expect(view.form).toBe("Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi. Coba lagi dalam 9 menit.")
    expect(mapLoginError(new ApiError(429, "RATE_LIMIT_EXCEEDED")).form).toBe(
      "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.",
    )
  })

  it("jaringan putus memakai pesan umum", () => {
    expect(mapLoginError(new ApiError(0, null)).form).toBe("Terjadi kesalahan. Coba lagi.")
  })
})
