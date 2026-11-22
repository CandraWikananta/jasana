import { describe, expect, it } from "vitest"
import { nextFocusIndex } from "./active-filters"

describe("nextFocusIndex", () => {
  it("chip pengganti di posisi yang sama", () => {
    expect(nextFocusIndex(0, 2)).toBe(0)
    expect(nextFocusIndex(1, 2)).toBe(1)
  })

  it("chip terakhir dihapus: fokus ke chip sebelumnya", () => {
    expect(nextFocusIndex(2, 2)).toBe(1)
  })

  it("tidak ada chip tersisa: fokus ke elemen cadangan", () => {
    expect(nextFocusIndex(0, 0)).toBeNull()
  })
})
