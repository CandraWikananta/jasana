import { describe, expect, it } from "vitest"
import { cn } from "./utils"

describe("cn", () => {
  it("token ukuran teks tidak dibuang saat digabung dengan warna teks", () => {
    expect(cn("text-logo", "text-foreground")).toBe("text-logo text-foreground")
    expect(cn("text-h3 font-semibold", "text-muted-foreground")).toBe("text-h3 font-semibold text-muted-foreground")
    expect(cn("text-display md:text-display-lg", "text-brand-strong")).toBe("text-display md:text-display-lg text-brand-strong")
  })

  it("token ukuran teks tetap saling menggantikan", () => {
    expect(cn("text-h3", "text-h1")).toBe("text-h1")
    expect(cn("text-sm", "text-h2")).toBe("text-h2")
  })
})
