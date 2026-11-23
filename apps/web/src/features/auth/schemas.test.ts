import { describe, expect, it } from "vitest"
import { ApiError } from "@/lib/api-error"
import { getErrorMessage, LOGIN_UNAUTHORIZED_MESSAGE } from "@/lib/error-messages"
import {
  isLinkTokenError,
  linkTokenMessage,
  loginFormSchema,
  mapForgotPasswordError,
  mapLoginError,
  mapRegisterError,
  mapResetPasswordError,
  normalizePhone,
  readLinkToken,
  registerFormSchema,
  resetPasswordFormSchema,
  toLoginInput,
  toRegisterInput,
} from "./schemas"

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
    expect(view.form).toBe("Terlalu banyak percobaan masuk. Coba lagi dalam 9 menit.")
    expect(mapLoginError(new ApiError(429, "RATE_LIMIT_EXCEEDED")).form).toBe(
      "Terlalu banyak percobaan masuk. Tunggu sebentar lalu coba lagi.",
    )
  })

  it("jaringan putus memakai pesan umum", () => {
    expect(mapLoginError(new ApiError(0, null)).form).toBe("Terjadi kesalahan. Coba lagi.")
  })
})

describe("formulir daftar", () => {
  const valid = { full_name: "Budi Santoso", email: "Budi@Sim.Jasana.Test ", phone: "0812 3456 7890", password: "rahasia123" }

  it("nomor ponsel dinormalisasi sama dengan backend", () => {
    expect(normalizePhone("0812-3456-7890")).toBe("+6281234567890")
    expect(normalizePhone("62812 3456 7890")).toBe("+6281234567890")
    expect(normalizePhone("+62 (812) 3456.7890")).toBe("+6281234567890")
  })

  it("isian sah lolos dan email dikirim huruf kecil tanpa spasi", () => {
    const parsed = registerFormSchema.parse(valid)
    expect(toRegisterInput(parsed)).toEqual({
      full_name: "Budi Santoso",
      email: "budi@sim.jasana.test",
      phone: "0812 3456 7890",
      password: "rahasia123",
    })
  })

  it("nomor bukan ponsel Indonesia, nama satu huruf, dan sandi pendek ditolak", () => {
    expect(registerFormSchema.safeParse({ ...valid, phone: "021 555 1234" }).success).toBe(false)
    expect(registerFormSchema.safeParse({ ...valid, full_name: " B " }).success).toBe(false)
    expect(registerFormSchema.safeParse({ ...valid, password: "1234567" }).success).toBe(false)
  })

  it("kata sandi dibatasi 72 byte, bukan 72 karakter (bcrypt)", () => {
    expect(resetPasswordFormSchema.safeParse({ password: "a".repeat(72) }).success).toBe(true)
    // 25 huruf beraksen dua byte = 50 byte, ditambah 23 = 73 byte walau hanya 48 karakter.
    expect(resetPasswordFormSchema.safeParse({ password: "é".repeat(25) + "a".repeat(23) }).success).toBe(false)
  })

  it("422 duplikat dari server menjadi pesan sudah terdaftar di field yang benar", () => {
    const view = mapRegisterError(
      new ApiError(422, "VALIDATION_ERROR", [{ path: "phone", message: "Nomor ponsel sudah terdaftar" }]),
    )
    expect(view).toEqual({ fields: { phone: "Nomor ponsel ini sudah terdaftar. Masuk, atau pakai nomor lain." }, form: null })
  })

  it("422 bentuk biasa memakai pesan frontend, bukan kalimat Zod backend", () => {
    const view = mapRegisterError(new ApiError(422, "VALIDATION_ERROR", [{ path: "email", message: "email tidak sah" }]))
    expect(view.fields.email).toBe("Periksa lagi emailmu.")
  })

  it("galat tanpa field tampil di atas formulir", () => {
    expect(mapRegisterError(new ApiError(503, "SERVICE_UNAVAILABLE")).form).toBe(getErrorMessage("SERVICE_UNAVAILABLE"))
  })
})

describe("lupa dan atur ulang sandi", () => {
  it("429 lupa sandi menyebut kapan bisa mencoba lagi, tanpa ajakan menunggu yang dobel", () => {
    const view = mapForgotPasswordError(new ApiError(429, "RATE_LIMIT_EXCEEDED", [], 1800))
    expect(view.form).toBe("Terlalu banyak permintaan. Coba lagi dalam 30 menit.")
  })

  it("429 tanpa Retry-After (tidak diekspos CORS) memakai pesan peta", () => {
    expect(mapForgotPasswordError(new ApiError(429, "RATE_LIMIT_EXCEEDED")).form).toBe(getErrorMessage("RATE_LIMIT_EXCEEDED"))
  })

  it("422 new_password dipetakan ke isian kata sandi", () => {
    const view = mapResetPasswordError(
      new ApiError(422, "VALIDATION_ERROR", [{ path: "new_password", message: "password minimal 8 karakter" }]),
    )
    expect(view.fields.password).toBe("Periksa lagi kata sandi barumu.")
  })
})

describe("link token dari email", () => {
  it("token kosong atau spasi dianggap tidak ada", () => {
    expect(readLinkToken(null)).toBeNull()
    expect(readLinkToken("  ")).toBeNull()
    expect(readLinkToken(" abc ")).toBe("abc")
  })

  it("tiga kode token dan 422 pada token dikenali sebagai link yang tidak bisa dipakai", () => {
    for (const code of ["TOKEN_INVALID", "TOKEN_EXPIRED", "TOKEN_ALREADY_USED"]) {
      expect(isLinkTokenError(new ApiError(422, code))).toBe(true)
    }
    expect(isLinkTokenError(new ApiError(422, "VALIDATION_ERROR", [{ path: "token", message: "x" }]))).toBe(true)
    expect(isLinkTokenError(new ApiError(422, "VALIDATION_ERROR", [{ path: "new_password", message: "x" }]))).toBe(false)
    expect(isLinkTokenError(new ApiError(503, "SERVICE_UNAVAILABLE"))).toBe(false)
  })

  it("pesan link mengikuti kodenya, dan link rusak dibaca tidak valid", () => {
    expect(linkTokenMessage(new ApiError(422, "TOKEN_EXPIRED"))).toBe(getErrorMessage("TOKEN_EXPIRED"))
    expect(linkTokenMessage(new ApiError(422, "VALIDATION_ERROR", [{ path: "token", message: "x" }]))).toBe(
      getErrorMessage("TOKEN_INVALID"),
    )
    expect(linkTokenMessage(null)).toBe(getErrorMessage("TOKEN_INVALID"))
  })
})
