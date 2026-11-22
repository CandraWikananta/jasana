// Judul hero beranda dari nama kategori (D249: fakta, bukan klaim). Paling banyak empat nama,
// sisanya diringkas "dan lainnya". Tanpa kategori, judul cadangan tanpa daftar.
export const HERO_TITLE_FALLBACK = "Jasa yang datang ke tempatmu"
const MAX_NAMES = 4

/** Huruf pertama dikecilkan, sisanya apa adanya. Singkatan ("AC", "TV") dibiarkan utuh. */
function lowerFirst(name: string): string {
  if (/^\p{Lu}{2}/u.test(name)) return name
  return name.charAt(0).toLocaleLowerCase("id") + name.slice(1)
}

export function heroTitle(categoryNames: readonly string[]): string {
  const names = categoryNames.map((n) => n.trim()).filter(Boolean).map(lowerFirst)
  if (names.length === 0) return HERO_TITLE_FALLBACK
  let list: string
  if (names.length > MAX_NAMES) list = `${names.slice(0, MAX_NAMES).join(", ")}, dan lainnya`
  else if (names.length === 1) list = names[0]
  else if (names.length === 2) list = `${names[0]} dan ${names[1]}`
  else list = `${names.slice(0, -1).join(", ")}, dan ${names.at(-1)}`
  return `Jasa ${list} yang datang ke tempatmu`
}
