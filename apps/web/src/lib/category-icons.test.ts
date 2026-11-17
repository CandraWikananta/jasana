import { Camera, Cog, PerfumeBottle, Shapes, SprayCan, Wrench } from "lucide-react"
import { describe, expect, it } from "vitest"
import { getCategoryIcon } from "./category-icons"

describe("getCategoryIcon", () => {
  it("nama di whitelist", () => {
    expect(getCategoryIcon("cog")).toBe(Cog)
    expect(getCategoryIcon("camera")).toBe(Camera)
    expect(getCategoryIcon("perfume-bottle")).toBe(PerfumeBottle)
    expect(getCategoryIcon("wrench")).toBe(Wrench)
    expect(getCategoryIcon("spray-can")).toBe(SprayCan)
  })

  it("kosong, tidak dikenal, atau kunci prototipe jatuh ke Shapes", () => {
    for (const name of [null, "", "tidak-ada", "Cog", "constructor", "__proto__", "toString"]) {
      expect(getCategoryIcon(name)).toBe(Shapes)
    }
  })
})
