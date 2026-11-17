import { describe, expect, it } from "vitest"
import { ERROR_STATUS } from "@jasana/shared"
import { ERROR_MESSAGES, getErrorMessage, UNKNOWN_ERROR_MESSAGE } from "./error-messages"

describe("error-messages", () => {
  it("setiap kode di @jasana/shared punya pesan", () => {
    for (const code of Object.keys(ERROR_STATUS)) expect(ERROR_MESSAGES).toHaveProperty(code)
  })
  it("kode dikenal, tak dikenal, dan kosong", () => {
    expect(getErrorMessage("ORDER_ALREADY_CLAIMED")).toBe("Pesanan ini sudah diambil.")
    expect(getErrorMessage("KODE_BARU")).toBe(UNKNOWN_ERROR_MESSAGE)
    expect(getErrorMessage("toString")).toBe(UNKNOWN_ERROR_MESSAGE)
    expect(getErrorMessage(null)).toBe(UNKNOWN_ERROR_MESSAGE)
  })
})
