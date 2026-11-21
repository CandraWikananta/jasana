// Matriks tombol DS 6.1 dan 6.4: enam varian dalam state normal, hover, ditekan, nonaktif, dan
// fokus. Hover, ditekan, dan fokus dipaksa lewat data-demo supaya terlihat tanpa interaksi.
import { Button } from "../ui/button"
import { Catatan } from "./markers"

const VARIANTS = [
  { variant: "primary", label: "Bayar sekarang", note: null },
  { variant: "secondary", label: "Lihat detail", note: "A10" },
  { variant: "outline", label: "Ubah alamat", note: "A14" },
  { variant: "ghost", label: "Kembali", note: "A10" },
  { variant: "destructive", label: "Tolak pesanan", note: "A10" },
  { variant: "now", label: "Ambil", note: null },
] as const

const STATES = [
  { key: "normal", label: "Normal" },
  { key: "hover", label: "Hover" },
  { key: "pressed", label: "Ditekan" },
  { key: "disabled", label: "Nonaktif" },
  { key: "focus", label: "Fokus" },
] as const

export function ButtonMatrix() {
  return (
    <div className="flex flex-col gap-4">
      {VARIANTS.map((v) => (
        <div key={v.variant} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
          <p className="flex items-center gap-3 text-sm font-semibold">
            <code className="font-mono text-sm">{v.variant}</code>
            {v.note ? <Catatan id={v.note} /> : null}
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-3">
            {STATES.map((s) => (
              <li key={s.key} className="flex flex-col items-start gap-1.5">
                <Button
                  variant={v.variant}
                  disabled={s.key === "disabled"}
                  data-demo={s.key === "hover" || s.key === "pressed" || s.key === "focus" ? s.key : undefined}
                  tabIndex={-1}
                >
                  {v.variant === "now" && s.key === "disabled" ? "Waktu respons habis" : v.label}
                </Button>
                <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-semibold">Ukuran dan memproses</p>
        <ul className="flex flex-wrap items-end gap-x-4 gap-y-3">
          {(["sm", "md", "lg"] as const).map((size) => (
            <li key={size} className="flex flex-col items-start gap-1.5">
              <Button size={size}>Pesan jasa</Button>
              <span className="text-xs font-medium text-muted-foreground">
                {size} {size === "sm" ? "36" : size === "md" ? "40" : "48"} px
              </span>
            </li>
          ))}
          <li className="flex flex-col items-start gap-1.5">
            <Button size="lg" loading>
              Membayar
            </Button>
            <span className="text-xs font-medium text-muted-foreground">loading</span>
          </li>
          <li className="flex flex-col items-start gap-1.5">
            <Button variant="now" size="lg" loading>
              Mengambil
            </Button>
            <span className="text-xs font-medium text-muted-foreground">now, loading</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
