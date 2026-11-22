// Rasio kontras WCAG 2.1 dihitung dari nilai token di ds-tokens.json, bukan disalin dari dokumen.
import tokens from "./ds-tokens.json"

export const TOKEN_MAP: Record<string, string> = Object.fromEntries(
  tokens.groups.flatMap((g) => g.tokens.map((t) => [t.name, t.value]))
)

function channel(v: number): number {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const h = hex.replace("#", "")
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(h.slice(i, i + 2), 16)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(fgHex: string, bgHex: string): number {
  const [a, b] = [luminance(fgHex), luminance(bgHex)]
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** Dua desimal dengan koma, seperti penulisan di dokumen: `17,49`. */
export function formatRasio(r: number): string {
  return r.toFixed(2).replace(".", ",")
}
