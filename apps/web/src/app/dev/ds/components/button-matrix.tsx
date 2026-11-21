// Matriks tombol DS 6.1 dan 6.4: enam varian dalam state normal, hover, ditekan, nonaktif, dan
// fokus. Hover, ditekan, dan fokus dipaksa lewat className dari peta di bawah, supaya ui/button.tsx
// tetap bersih dari kait peraga. `cn` menggabungkan kelas seperti tailwind-merge, jadi
// `bg-primary-hover` menggantikan `bg-primary`.
import { Button } from "../ui/button"

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "now"

const FOCUS = "ring-2 ring-ring ring-offset-2 ring-offset-card"

const VARIANTS: { variant: Variant; label: string; hover: string; pressed: string }[] = [
  { variant: "primary", label: "Bayar sekarang", hover: "bg-primary-hover", pressed: "translate-y-px bg-primary-pressed" },
  { variant: "secondary", label: "Lihat detail", hover: "bg-border", pressed: "translate-y-px bg-border" },
  { variant: "outline", label: "Ubah alamat", hover: "bg-muted", pressed: "translate-y-px bg-muted" },
  { variant: "ghost", label: "Kembali", hover: "bg-muted", pressed: "translate-y-px bg-muted" },
  { variant: "destructive", label: "Tolak pesanan", hover: "bg-destructive-hover", pressed: "translate-y-px bg-destructive-hover" },
  { variant: "now", label: "Ambil", hover: "bg-brand-hover", pressed: "translate-y-px bg-brand-hover shadow-inner" },
]

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
          <p className="text-sm font-semibold">
            <code className="font-mono text-sm">{v.variant}</code>
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-3">
            {STATES.map((s) => (
              <li key={s.key} className="flex flex-col items-start gap-1.5">
                <Button
                  variant={v.variant}
                  disabled={s.key === "disabled"}
                  className={s.key === "hover" ? v.hover : s.key === "pressed" ? v.pressed : s.key === "focus" ? FOCUS : undefined}
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
              Membayar…
            </Button>
            <span className="text-xs font-medium text-muted-foreground">Memproses</span>
          </li>
          <li className="flex flex-col items-start gap-1.5">
            <Button variant="now" size="lg" loading>
              Mengambil…
            </Button>
            <span className="text-xs font-medium text-muted-foreground">now, memproses</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
