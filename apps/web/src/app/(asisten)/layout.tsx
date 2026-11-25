import type { Viewport } from "next"
import { SiteHeader } from "@/components/layout/site-header"

// resizes-content: keyboard HP mengecilkan halaman, sehingga kotak tulis naik ke atasnya dan daftar pesan
// tetap bisa digulir (Chrome dan Firefox Android; Safari menggeser halaman sendiri). viewportFit sama dengan akar (D256).
export const viewport: Viewport = { viewportFit: "cover", interactiveWidget: "resizes-content" }

// Kerangka layar penuh Asisten (usulan D267): setinggi layar, tanpa footer dan navigasi bawah. min-h-96 menjaga
// percakapan tetap terbaca di layar pendek (HP miring); di situ halamannya yang menggulir.
export default function AsistenLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex h-dvh flex-col bg-card">
      <SiteHeader />
      <main id="konten" tabIndex={-1} className="flex min-h-96 flex-1 flex-col bg-card outline-none">
        {children}
      </main>
    </div>
  )
}
