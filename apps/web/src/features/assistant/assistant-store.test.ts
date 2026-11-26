import { afterEach, describe, expect, it } from "vitest"
import { clearSession, resetSessionForTests } from "@/lib/session"
import { getAssistantState, notifySessionChangeForTests, resetAssistantForTests, updateAssistant } from "./assistant-store"

afterEach(() => resetSessionForTests())

describe("assistant store", () => {
  it("keluar membuang percakapan akun dan draf", () => {
    resetAssistantForTests("authenticated")
    updateAssistant({ panelOpen: true, accountSessionId: "s1", handoffDraft: "rahasia", claimEnded: true })
    clearSession()
    notifySessionChangeForTests()
    expect(getAssistantState()).toEqual({ panelOpen: false, accountSessionId: null, handoffDraft: "", claimEnded: false })
  })

  it("tamu sejak awal: serahan draf tamu tidak ikut terbuang", () => {
    resetAssistantForTests("unknown")
    updateAssistant({ handoffDraft: "dari panel" })
    clearSession()
    notifySessionChangeForTests()
    expect(getAssistantState().handoffDraft).toBe("dari panel")
  })
})
