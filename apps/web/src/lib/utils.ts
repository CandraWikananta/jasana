import { createCn } from "cn/config"

// Token ukuran teks DS 13 (D247, D251) didaftarkan sebagai font-size. Tanpa ini, `cn("text-h3",
// "text-muted-foreground")` membuang text-h3, karena keduanya terbaca sebagai warna teks.
export const cn = createCn({
  extend: { classGroups: { "font-size": [{ text: ["display", "display-lg", "h1", "h2", "h3", "logo", "code-xl"] }] } },
})
