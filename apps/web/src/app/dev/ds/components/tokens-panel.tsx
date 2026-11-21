// Swatch seluruh token v2.1 dan tabel kontras. Rasio dihitung dari ds-tokens.json dengan rumus
// WCAG 2.1, lalu dibandingkan dengan angka yang tertulis di Design System 1.5.
import { CircleCheck, CircleX, Equal, TriangleAlert, type LucideIcon } from "lucide-react"
import tokens from "../ds-tokens.json"
import { TOKEN_MAP, contrastRatio, formatRasio } from "../contrast"
import { Badge, type BadgeTone } from "../ui/badge"

export function TokenSwatches() {
  return (
    <div className="flex flex-col gap-6">
      {tokens.groups.map((g) => (
        <div key={g.id} className="flex flex-col gap-3">
          <h3 className="text-h3 font-semibold">
            {g.section} {g.title}
          </h3>
          <ul className="grid gap-2 @2xl:grid-cols-2 @5xl:grid-cols-3">
            {g.tokens.map((t) => (
              <li key={t.name} className="flex items-center gap-3 rounded-md border border-border bg-card p-2">
                {/* Nilai warna berasal dari JSON, bukan literal di kode. */}
                <span className="size-10 shrink-0 rounded-md border border-border" style={{ background: t.value }} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold">
                    --{t.name}
                    {"jasana" in t && t.jasana ? <span className="font-medium text-muted-foreground"> (Jasana)</span> : null}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">{t.value}</span>
                  <span className="text-xs text-muted-foreground">{t.use}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

type Verdict = { tone: BadgeTone; icon: LucideIcon; label: string }

type Pair = (typeof tokens.contrast)[number] & { doc?: number; justified?: boolean; note?: string }

function verdict(p: Pair, r: number): Verdict {
  if (p.kind === "dilarang") {
    return r < p.min
      ? { tone: "neutral", icon: CircleX, label: "Dilarang, sesuai dokumen" }
      : { tone: "destructive", icon: TriangleAlert, label: "Lolos, padahal dilarang" }
  }
  if (p.min <= 1) return { tone: "neutral", icon: Equal, label: "Tidak wajib" }
  if (r >= p.min) return { tone: "success", icon: CircleCheck, label: "Lolos" }
  // DS 1.5: penanda grafis di bawah 3:1 dibenarkan karena maknanya dibawa teks di sebelahnya.
  if (p.justified) return { tone: "warning", icon: TriangleAlert, label: `Di bawah ${p.min}:1, dibenarkan dokumen` }
  return { tone: "destructive", icon: CircleX, label: "Tidak lolos" }
}

/** Angka dokumen dibandingkan dengan hitungan yang dibulatkan dua desimal, seperti DS 1.5. */
function docCompare(p: Pair, r: number): { text: string; same: boolean | null } {
  if (p.doc === undefined) return { text: "Tidak tercantum", same: null }
  const same = Math.abs(Math.round(r * 100) / 100 - p.doc) < 0.005
  return { text: `${formatRasio(p.doc)}, ${same ? "sama" : "beda"}`, same }
}

export function ContrastTable() {
  const rows = (tokens.contrast as Pair[]).map((p) => {
    const r = contrastRatio(TOKEN_MAP[p.fg], TOKEN_MAP[p.bg])
    return { p, r, v: verdict(p, r), d: docCompare(p, r) }
  })

  return (
    <div role="region" aria-label="Tabel kontras" tabIndex={0} className="overflow-x-auto rounded-lg border border-border bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      <table className="w-full min-w-180 text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {["Contoh", "Teks atau penanda", "Latar", "Jenis", "Hitungan", "DS 1.5", "Hasil"].map((h) => (
              <th key={h} scope="col" className="px-3 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ p, r, v, d }, i) => {
            const Icon = v.icon
            return (
              <tr key={i} className="border-b border-border last:border-b-0">
                <td className="px-3 py-2">
                  <span
                    className="inline-flex h-8 w-12 items-center justify-center rounded-sm border border-border font-semibold"
                    style={{ color: TOKEN_MAP[p.fg], background: TOKEN_MAP[p.bg] }}
                  >
                    Aa
                  </span>
                </td>
                <td className="px-3 py-2 font-medium">--{p.fg}</td>
                <td className="px-3 py-2">--{p.bg}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {p.kind}
                  {p.note ? <span className="block text-xs">{p.note}</span> : null}
                </td>
                <td className="px-3 py-2 font-semibold tabular-nums">{formatRasio(r)}:1</td>
                <td className={d.same === false ? "px-3 py-2 font-semibold text-destructive tabular-nums" : "px-3 py-2 tabular-nums"}>
                  {d.text}
                </td>
                <td className="px-3 py-2">
                  <Badge tone={v.tone}>
                    <Icon aria-hidden />
                    {v.label}
                  </Badge>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
