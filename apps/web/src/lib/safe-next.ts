// Tujuan setelah masuk. Hanya path relatif di origin sendiri, supaya /masuk?next= tidak bisa
// dipakai mengalihkan pengguna ke situs lain (open redirect).
export function safeNext(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/")) return null
  // "//evil.com" dan "/\evil.com" dibaca browser sebagai URL tanpa skema ke host lain.
  if (value.startsWith("//") || value.startsWith("/\\")) return null
  // Karakter kontrol (tab, baris baru) dibuang browser saat parsing URL, jadi "/\t/evil.com" berbahaya.
  if (/[\u0000-\u001f\u007f]/.test(value)) return null
  try {
    const url = new URL(value, "http://jasana.invalid")
    if (url.origin !== "http://jasana.invalid") return null
    return url.pathname + url.search + url.hash
  } catch {
    return null
  }
}

export function loginHref(next: string): string {
  return `/masuk?next=${encodeURIComponent(next)}`
}
