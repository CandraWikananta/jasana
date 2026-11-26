import { QueryClient } from "@tanstack/react-query"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ApiError } from "@/lib/api-error"
import { qk } from "@/lib/query-keys"
import { claimSession } from "./api"
import { getAssistantState, resetAssistantForTests, updateAssistant } from "./assistant-store"
import type { ConversationMessage } from "./conversation"
import { classifyClaimError, heldDraft, runGuestClaim } from "./claim"
import { forgetGuestSessionForTests, getGuestSession, setGuestSession } from "./guest-session"

vi.mock("./api", () => ({ claimSession: vi.fn() }))
const claim = vi.mocked(claimSession)

const TOKEN = "ab".repeat(32)
const ID = "11111111-1111-4111-8111-111111111111"
const KEY = qk.chat.messages("guest", ID)

const user = (content: string, over: Partial<ConversationMessage> = {}): ConversationMessage => ({
  id: content,
  role: "USER",
  content,
  intent: null,
  recommended_listing_ids: [],
  created_at: "",
  ...over,
})
const blocked = (content: string, kind: "limit" | "resting" | "retry") =>
  user(content, { state: "failed", failure: { kind, message: "x" } })

function storage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  }
}

let queryClient: QueryClient

beforeEach(() => {
  forgetGuestSessionForTests()
  resetAssistantForTests()
  vi.stubGlobal("window", { sessionStorage: storage() })
  queryClient = new QueryClient()
  claim.mockReset()
})
afterEach(() => vi.unstubAllGlobals())

describe("classifyClaimError", () => {
  it.each([
    [409, "CHAT_SESSION_ALREADY_CLAIMED", "taken"],
    [409, "CHAT_SESSION_ENDED", "gone"],
    [404, "NOT_FOUND", "gone"],
    [500, "INTERNAL_ERROR", "retry"],
    [429, "RATE_LIMIT_EXCEEDED", "retry"],
    [0, null, "retry"],
  ])("%i %s menjadi %s", (status, code, kind) => {
    expect(classifyClaimError(new ApiError(status, code))).toBe(kind)
  })

  it("galat di luar API dianggap sementara", () => {
    expect(classifyClaimError(new Error("x"))).toBe("retry")
  })
})

describe("heldDraft", () => {
  it("pertanyaan yang tertahan batas atau rem harian tamu", () => {
    expect(heldDraft([user("halo"), blocked("servis AC", "limit")])).toBe("servis AC")
    expect(heldDraft([blocked("cuci mobil", "resting")])).toBe("cuci mobil")
  })

  it("bukan pesan terakhir, kegagalan lain, atau tanpa cache: kosong", () => {
    expect(heldDraft([blocked("lama", "limit"), user("baru")])).toBe("")
    expect(heldDraft([blocked("putus", "retry")])).toBe("")
    expect(heldDraft([])).toBe("")
    expect(heldDraft(undefined)).toBe("")
  })
})

describe("runGuestClaim", () => {
  beforeEach(() => {
    setGuestSession({ sessionId: ID, token: TOKEN, resume: true })
    queryClient.setQueryData(KEY, [user("halo"), blocked("servis AC besok", "limit")])
  })

  it("berhasil: sesi tamu dibuang, percakapan akun aktif, pertanyaan tertahan pindah ke kotak tulis", async () => {
    claim.mockResolvedValue({} as never)
    expect(await runGuestClaim(queryClient)).toEqual({ kind: "claimed", sessionId: ID, resume: true })
    expect(claim).toHaveBeenCalledWith(ID, TOKEN)
    expect(getGuestSession()).toBeNull()
    expect(queryClient.getQueryData(KEY)).toBeUndefined()
    expect(getAssistantState()).toMatchObject({ accountSessionId: ID, handoffDraft: "servis AC besok", claimEnded: false })
  })

  it("panggilan bersamaan berbagi satu permintaan", async () => {
    claim.mockResolvedValue({} as never)
    const [a, b] = await Promise.all([runGuestClaim(queryClient), runGuestClaim(queryClient)])
    expect(a).toBe(b)
    expect(claim).toHaveBeenCalledTimes(1)
  })

  it("sudah diklaim: tetap dibuka sebagai akun", async () => {
    claim.mockRejectedValue(new ApiError(409, "CHAT_SESSION_ALREADY_CLAIMED"))
    expect((await runGuestClaim(queryClient)).kind).toBe("taken")
    expect(getGuestSession()).toBeNull()
    expect(getAssistantState().accountSessionId).toBe(ID)
  })

  it("berakhir: percakapan akun baru dengan pemberitahuan, pertanyaan tetap dibawa", async () => {
    claim.mockRejectedValue(new ApiError(409, "CHAT_SESSION_ENDED"))
    expect((await runGuestClaim(queryClient)).kind).toBe("gone")
    expect(getGuestSession()).toBeNull()
    expect(getAssistantState()).toMatchObject({ accountSessionId: null, handoffDraft: "servis AC besok", claimEnded: true })
  })

  it("gagal sementara: sesi tamu dan cache tetap ada untuk dicoba lagi", async () => {
    const error = new ApiError(503, "SERVICE_UNAVAILABLE")
    claim.mockRejectedValueOnce(error).mockResolvedValueOnce({} as never)
    expect(await runGuestClaim(queryClient)).toEqual({ kind: "retry", error })
    expect(getGuestSession()).not.toBeNull()
    expect(queryClient.getQueryData(KEY)).toHaveLength(2)
    expect(getAssistantState().accountSessionId).toBeNull()
    expect((await runGuestClaim(queryClient)).kind).toBe("claimed")
  })

  it("token rusak tidak dikirim, karena 401-nya mengeluarkan akun", async () => {
    setGuestSession({ sessionId: ID, token: "rusak" })
    expect((await runGuestClaim(queryClient)).kind).toBe("gone")
    expect(claim).not.toHaveBeenCalled()
  })

  it("tanpa pertanyaan tertahan, draf serahan yang sudah ada tidak ditimpa", async () => {
    queryClient.setQueryData(KEY, [user("halo")])
    updateAssistant({ handoffDraft: "dari panel" })
    claim.mockResolvedValue({} as never)
    await runGuestClaim(queryClient)
    expect(getAssistantState().handoffDraft).toBe("dari panel")
  })

  it("tanpa sesi tamu tidak ada yang dikirim", async () => {
    setGuestSession(null)
    expect(await runGuestClaim(queryClient)).toEqual({ kind: "none" })
    expect(claim).not.toHaveBeenCalled()
  })
})
