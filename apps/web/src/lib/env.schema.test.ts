import { describe, expect, it } from "vitest"
import { parseEnv, publicEnvSchema, serverEnvSchema } from "./env.schema"

const validServer = {
  API_INTERNAL_BASE_URL: "http://localhost:3000/api/v1/",
  SESSION_COOKIE_NAME: "jasana_refresh",
  SESSION_COOKIE_SECURE: "false",
}

describe("env (PRD Frontend 9.4)", () => {
  it("variabel publik wajib URL, garis miring akhir dibuang", () => {
    const env = parseEnv(publicEnvSchema, {
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:3000/api/v1/",
      NEXT_PUBLIC_SOCKET_URL: "http://localhost:3000",
    })
    expect(env.NEXT_PUBLIC_API_BASE_URL).toBe("http://localhost:3000/api/v1")
  })

  it("variabel kosong atau hilang membuat aplikasi gagal start", () => {
    expect(() => parseEnv(publicEnvSchema, { NEXT_PUBLIC_API_BASE_URL: "http://x.test" })).toThrow(
      /NEXT_PUBLIC_SOCKET_URL wajib diisi/,
    )
    expect(() => parseEnv(serverEnvSchema, { ...validServer, API_INTERNAL_BASE_URL: "  " })).toThrow(
      /API_INTERNAL_BASE_URL wajib diisi/,
    )
    expect(() => parseEnv(serverEnvSchema, { ...validServer, API_INTERNAL_BASE_URL: "localhost:3000" })).toThrow(
      /harus URL lengkap/,
    )
  })

  it("SESSION_COOKIE_SECURE hanya true atau false, tanpa coerce", () => {
    expect(parseEnv(serverEnvSchema, validServer).SESSION_COOKIE_SECURE).toBe(false)
    expect(parseEnv(serverEnvSchema, { ...validServer, SESSION_COOKIE_SECURE: "true" }).SESSION_COOKIE_SECURE).toBe(true)
    for (const value of ["", "1", "yes", undefined]) {
      expect(() => parseEnv(serverEnvSchema, { ...validServer, SESSION_COOKIE_SECURE: value })).toThrow(
        /SESSION_COOKIE_SECURE/,
      )
    }
  })

  it("SESSION_COOKIE_NAME hanya karakter token cookie", () => {
    expect(() => parseEnv(serverEnvSchema, { ...validServer, SESSION_COOKIE_NAME: "sesi jasana" })).toThrow(
      /SESSION_COOKIE_NAME hanya boleh/,
    )
    expect(() => parseEnv(serverEnvSchema, { ...validServer, SESSION_COOKIE_NAME: "a;b" })).toThrow()
  })
})
