// EKSPLORASI penanda mode Sekarang, bukan bagian DS v2.0. Empat varian OfferCard dan
// AvailabilityToggle (menyala) berdampingan di bingkai 390 px dan bingkai lebar, ditambah kontras
// teks varian D yang dihitung dari ds-tokens.json.
import { FlaskConical } from "lucide-react"
import { TOKEN_MAP, contrastRatio, formatRasio } from "../contrast"
import { OfferVariant, type MarkerVariant } from "./offer-variants"
import { ToggleVariant } from "./toggle-variants"

const VARIANTS: { id: MarkerVariant; title: string; desc: string; violates?: string }[] = [
  { id: "A", title: "Garis tepi kiri", desc: "Seperti DS v2.0 sekarang: garis tepi kiri 4 px --brand." },
  { id: "B", title: "Tanpa garis, badge Sekarang", desc: "Label \"Tawaran baru\" di kiri atas, pill putih bergaris --brand dengan titik live di kanan atas." },
  { id: "C", title: "Garis tepi penuh", desc: "Garis 1 px --brand di seluruh tepi kartu.", violates: "Melanggar DS 1.3: --brand tidak boleh jadi garis tipis di atas latar terang (2,28:1)." },
  { id: "D", title: "Kepala kartu pucat", desc: "Kepala tipis berlatar --brand-subtle dengan titik live, label --brand-subtle-foreground, dan hitung mundur di kanan." },
]

// Teks dan penanda yang tampil di atas --brand-subtle pada varian D.
const D_PAIRS: { fg: string; what: string; min: number }[] = [
  { fg: "brand-subtle-foreground", what: "Label \"Tawaran baru · Sekarang\" dan \"Lokasi aktif · Sekarang\"", min: 4.5 },
  { fg: "foreground", what: "Angka hitung mundur", min: 4.5 },
  { fg: "destructive", what: "Angka hitung mundur di bawah 5 menit", min: 4.5 },
  { fg: "muted-foreground", what: "Teks \"Sisa waktu\" dan ikon Clock", min: 4.5 },
  { fg: "brand", what: "Titik live (penanda grafis)", min: 3 },
]

function VariantBlock({ v }: { v: (typeof VARIANTS)[number] }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-bold">
          {v.id}. {v.title}
        </p>
        <p className="text-xs font-medium text-muted-foreground">{v.desc}</p>
        {v.violates ? <p className="text-xs font-semibold text-destructive">{v.violates}</p> : null}
      </div>
      <OfferVariant variant={v.id} />
      <ToggleVariant variant={v.id} />
    </div>
  )
}

export function ExploreSection() {
  return (
    <section id="eksplorasi" aria-labelledby="eksplorasi-judul" className="flex scroll-mt-6 flex-col gap-4 rounded-xl border-2 border-dashed border-input p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <p className="flex w-fit items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold">
          <FlaskConical aria-hidden className="size-4" />
          Eksplorasi, bukan bagian DS v2.0
        </p>
        <h2 id="eksplorasi-judul" className="text-xl font-semibold">
          13. Eksplorasi penanda Sekarang
        </h2>
        <p className="max-w-prose text-sm text-muted-foreground">
          Empat cara menandai mode Sekarang pada kartu tawaran dan toggle ketersediaan. Isi, tombol, dan bayangan kartu sama di keempatnya.
          Komponen sesuai DS v2.0 di bagian 4 dan 5 tidak berubah.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">Bingkai 390 px</p>
        <div className="@container w-full max-w-97.5 rounded-xl border border-border bg-background p-4">
          <div className="flex flex-col gap-8">
            {VARIANTS.map((v) => (
              <VariantBlock key={v.id} v={v} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">Bingkai lebar</p>
        <div className="@container w-full rounded-xl border border-border bg-background p-4 md:p-6">
          <div className="grid gap-x-6 gap-y-8 @2xl:grid-cols-2">
            {VARIANTS.map((v) => (
              <VariantBlock key={v.id} v={v} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-lg leading-6.5 font-semibold">Kontras varian D di atas --brand-subtle</h3>
        <ul className="flex max-w-2xl flex-col gap-2">
          {D_PAIRS.map((p) => {
            const r = contrastRatio(TOKEN_MAP[p.fg], TOKEN_MAP["brand-subtle"])
            const ok = r >= p.min
            return (
              <li key={p.fg} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-md border border-border bg-card px-3 py-2 text-sm">
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium">--{p.fg}</span>
                  <span className="text-xs text-muted-foreground">{p.what}</span>
                </span>
                <span className="flex items-center gap-3 tabular-nums">
                  <span className="font-semibold">{formatRasio(r)}:1</span>
                  <span className={ok ? "text-xs font-semibold text-success" : "text-xs font-semibold text-destructive"}>
                    {ok ? `Lolos ${p.min}:1` : `Di bawah ${p.min}:1`}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
