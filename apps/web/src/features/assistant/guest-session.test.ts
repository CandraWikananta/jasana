import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { forgetGuestSessionForTests, getGuestSession, setGuestSession } from "./guest-session"

const SESSION = { sessionId: "s1", token: "a".repeat(64) }

function fakeStorage(overrides: Record<string, unknown> = {}) {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    ...overrides,
  }
}

beforeEach(() => forgetGuestSessionForTests())
afterEach(() => vi.unstubAllGlobals())

describe("guest session", () => {
  it("bertahan saat tab dimuat ulang, dan hanya di sessionStorage", () => {
    const sessionStorage = fakeStorage()
    const localStorage = fakeStorage({ setItem: vi.fn() })
    vi.stubGlobal("window", { sessionStorage, localStorage })
    setGuestSession(SESSION)
    forgetGuestSessionForTests()
    expect(getGuestSession()).toEqual(SESSION)
    expect(localStorage.setItem).not.toHaveBeenCalled()
    setGuestSession(null)
    forgetGuestSessionForTests()
    expect(getGuestSession()).toBeNull()
  })

  it("tetap jalan dari memori kalau storage diblokir", () => {
    const blocked = () => {
      throw new Error("SecurityError")
    }
    vi.stubGlobal("window", { sessionStorage: { getItem: blocked, setItem: blocked, removeItem: blocked } })
    expect(getGuestSession()).toBeNull()
    setGuestSession(SESSION)
    expect(getGuestSession()).toEqual(SESSION)
  })

  it.each(["bukan json", '{"sessionId":1,"token":"x"}', '"teks"', "{}"])("mengabaikan isi storage yang rusak: %s", (raw) => {
    vi.stubGlobal("window", { sessionStorage: fakeStorage({ getItem: () => raw }) })
    expect(getGuestSession()).toBeNull()
  })
})
