import { describe, expect, it } from "vitest"
import { ApiError, shouldRetry } from "./api-client"

describe("shouldRetry", () => {
  it("jaringan putus dan 5xx diulang sekali saja", () => {
    expect(shouldRetry(0, new ApiError(0, null))).toBe(true)
    expect(shouldRetry(1, new ApiError(0, null))).toBe(false)
    expect(shouldRetry(0, new ApiError(503, "SERVICE_UNAVAILABLE"))).toBe(true)
    expect(shouldRetry(0, new Error("lain"))).toBe(true)
  })

  it("4xx tidak diulang", () => {
    expect(shouldRetry(0, new ApiError(404, "NOT_FOUND"))).toBe(false)
    expect(shouldRetry(0, new ApiError(422, "VALIDATION_ERROR"))).toBe(false)
    expect(shouldRetry(0, new ApiError(429, "RATE_LIMIT_EXCEEDED"))).toBe(false)
  })
})
