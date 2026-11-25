import { describe, expect, it } from "vitest"
import { ApiError } from "@/lib/api-error"
import { resolveChatFailure, splitMessage } from "./chat-failure"

const fail = (status: number, code: string | null, retryAfter: number | null = null) =>
  new ApiError(status, code, [], retryAfter)

describe("resolveChatFailure", () => {
  it.each([
    [429, "GUEST_CHAT_LIMIT_REACHED", "limit"],
    [503, "CHATBOT_TEMPORARILY_UNAVAILABLE", "resting"],
    [502, "GEMINI_UNAVAILABLE", "gemini"],
    [409, "CHAT_SESSION_ENDED", "ended"],
    [409, "CHAT_SESSION_ALREADY_CLAIMED", "ended"],
    [404, "NOT_FOUND", "ended"],
    [422, "VALIDATION_ERROR", "invalid"],
    [429, "RATE_LIMIT_EXCEEDED", "retry"],
    [500, "INTERNAL_ERROR", "retry"],
    [0, null, "retry"],
  ])("%i %s menjadi %s", (status, code, kind) => {
    expect(resolveChatFailure(fail(status, code), "guest").kind).toBe(kind)
  })

  it("401 tamu berarti percakapan berakhir, bukan ajakan masuk lagi", () => {
    const failure = resolveChatFailure(fail(401, "UNAUTHORIZED"), "guest")
    expect(failure.kind).toBe("ended")
    expect(failure.message).not.toContain("masuk lagi")
    expect(resolveChatFailure(fail(401, "UNAUTHORIZED"), "account").kind).toBe("retry")
  })

  it("429 menyebut kapan bisa mencoba lagi", () => {
    expect(resolveChatFailure(fail(429, "RATE_LIMIT_EXCEEDED", 600), "guest").message).toBe(
      "Terlalu banyak permintaan. Coba lagi dalam 10 menit.",
    )
    expect(resolveChatFailure(fail(429, "RATE_LIMIT_EXCEEDED"), "guest").message).toBe(
      "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.",
    )
  })

  it("galat bukan ApiError bisa dikirim lagi", () => {
    expect(resolveChatFailure(new Error("x"), "guest")).toEqual({ kind: "retry", message: "Terjadi kesalahan. Coba lagi." })
  })
})

describe("splitMessage", () => {
  it("memisah kalimat pertama dari sisanya", () => {
    expect(splitMessage("Asisten sedang tidak tersedia. Kamu tetap bisa mencari.")).toEqual({
      title: "Asisten sedang tidak tersedia",
      body: "Kamu tetap bisa mencari.",
    })
    expect(splitMessage("Data tidak ditemukan.")).toEqual({ title: "Data tidak ditemukan", body: "" })
  })
})
