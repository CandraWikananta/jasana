"use client"

import { useId, useState } from "react"
import type { BookingMode, OrderStatus } from "@jasana/shared"
import {
  AirVent,
  CircleAlert,
  CircleCheck,
  CircleX,
  Droplets,
  Info,
  MapPin,
  Plug,
  SprayCan,
  Star,
  Trees,
  TriangleAlert,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDurasi, formatJarak, formatRating, formatRupiah } from "@/lib/format"
import { BOOKING_MODE_META, ORDER_STATUS_META } from "@/lib/order-status"
import { formatTanggalJam } from "@/lib/time"
import { ARAH_META, type ArahId } from "./meta"

type Pair = { label: string; fg: string; bg: string; ratio: number; need: number; note?: string }
type ArahData = { tokens: Record<string, { hex: string; oklch: string }>; contrast: Pair[]; paleDelta: Record<string, number> }

const SWATCHES: { title: string; items: [token: string, cls: string][] }[] = [
  {
    title: "Primary",
    items: [
      ["primary", "bg-primary"],
      ["primary-hover", "bg-primary-hover"],
      ["primary-subtle", "bg-primary-subtle"],
      ["primary-subtle-foreground", "bg-primary-subtle-foreground"],
    ],
  },
  {
    title: "Aksen Sekarang",
    items: [
      ["now", "bg-now"],
      ["now-foreground", "bg-now-foreground"],
      ["now-strong", "bg-now-strong"],
      ["now-subtle", "bg-now-subtle"],
    ],
  },
  {
    title: "Netral dan permukaan",
    items: [
      ["background", "bg-background"],
      ["card", "bg-card"],
      ["muted", "bg-muted"],
      ["border", "bg-border"],
      ["input", "bg-input"],
      ["muted-foreground", "bg-muted-foreground"],
      ["foreground", "bg-foreground"],
    ],
  },
  {
    title: "Semantik",
    items: [
      ["success", "bg-success"],
      ["success-subtle", "bg-success-subtle"],
      ["warning", "bg-warning"],
      ["warning-subtle", "bg-warning-subtle"],
      ["destructive", "bg-destructive"],
      ["destructive-subtle", "bg-destructive-subtle"],
      ["info", "bg-info"],
      ["info-subtle", "bg-info-subtle"],
      ["neutral", "bg-neutral"],
      ["neutral-subtle", "bg-neutral-subtle"],
    ],
  },
]

const CATEGORIES: { label: string; icon: LucideIcon }[] = [
  { label: "Servis AC", icon: AirVent },
  { label: "Kebersihan", icon: SprayCan },
  { label: "Ledeng", icon: Droplets },
  { label: "Listrik", icon: Plug },
  { label: "Taman", icon: Trees },
  { label: "Pindahan", icon: Truck },
]

const LISTINGS: {
  title: string
  provider: string
  area: string
  price: number
  rating: number
  reviews: number
  meter: number
  minutes: number
  mode: BookingMode
  icon: LucideIcon
}[] = [
  { title: "Servis AC split", provider: "Sejuk Jaya Teknik", area: "Denpasar Selatan", price: 150000, rating: 4.8, reviews: 126, meter: 2400, minutes: 60, mode: "SCHEDULED", icon: AirVent },
  { title: "Bersih rumah 3 jam", provider: "Rapi Bali Clean", area: "Ubud", price: 225000, rating: 4.9, reviews: 88, meter: 5100, minutes: 180, mode: "SCHEDULED", icon: SprayCan },
  { title: "Tukang ledeng darurat", provider: "Pak Wayan Plumbing", area: "Kuta", price: 120000, rating: 4.7, reviews: 54, meter: 1300, minutes: 45, mode: "AVAILABLE_NOW", icon: Droplets },
]

const ORDERS: { no: string; status: OrderStatus; title: string; provider: string; mode: BookingMode; at: string; amount: number; assignee: string }[] = [
  { no: "ORD-20261121-0014", status: "PENDING_ACCEPTANCE", title: "Servis AC split", provider: "Sejuk Jaya Teknik", mode: "SCHEDULED", at: "2026-11-24T02:00:00.000Z", amount: 175000, assignee: "Belum ditugaskan" },
  { no: "ORD-20261121-0009", status: "IN_PROGRESS", title: "Bersih rumah 3 jam", provider: "Rapi Bali Clean", mode: "SCHEDULED", at: "2026-11-21T01:00:00.000Z", amount: 225000, assignee: "Kadek Ayu" },
  { no: "ORD-20261118-0003", status: "COMPLETED", title: "Tukang ledeng darurat", provider: "Pak Wayan Plumbing", mode: "AVAILABLE_NOW", at: "2026-11-18T07:30:00.000Z", amount: 120000, assignee: "Wayan Sudarma" },
  { no: "ORD-20261115-0021", status: "DISPUTED", title: "Servis AC split", provider: "Sejuk Jaya Teknik", mode: "SCHEDULED", at: "2026-11-15T06:00:00.000Z", amount: 150000, assignee: "Gede Arta" },
]

const BUTTONS = [
  { variant: "primary", name: "Default (primary)", label: "Bayar sekarang", hover: "bg-primary-hover" },
  { variant: "secondary", name: "Secondary", label: "Lihat detail", hover: "brightness-95" },
  { variant: "outline", name: "Outline", label: "Ubah alamat", hover: "bg-accent" },
  { variant: "ghost", name: "Ghost", label: "Kembali", hover: "bg-accent" },
  { variant: "destructive", name: "Destructive", label: "Tolak pesanan", hover: "bg-destructive/90" },
  { variant: "now", name: "Sekarang", label: "Ambil tawaran", hover: "brightness-95" },
] as const

const ALERTS = [
  {
    key: "warning",
    title: "Menunggu pembayaran",
    body: `Bayar sebelum ${formatTanggalJam("2026-11-21T08:00:00.000Z")} supaya pesanan tidak batal.`,
    icon: TriangleAlert,
    cls: "border-warning-border bg-warning-surface text-warning-subtle-foreground [&>svg]:text-warning",
    desc: "text-warning-subtle-foreground",
  },
  {
    key: "destructive",
    title: "Pesanan dalam komplain",
    body: "Dana ditahan sampai admin memutus komplain. Kabarnya dikirim lewat email.",
    icon: CircleX,
    cls: "border-destructive-border bg-destructive-surface text-destructive-subtle-foreground [&>svg]:text-destructive",
    desc: "text-destructive-subtle-foreground",
  },
  {
    key: "success",
    title: "Dana cair",
    body: `${formatRupiah(150000)} sudah masuk ke saldo tersedia.`,
    icon: CircleCheck,
    cls: "border-success-border bg-success-surface text-success-subtle-foreground [&>svg]:text-success",
    desc: "text-success-subtle-foreground",
  },
  {
    key: "info",
    title: "Pekerja sedang menuju lokasimu",
    body: "Penanggung jawab diperkirakan tiba sekitar 15 menit lagi.",
    icon: Info,
    cls: "border-info-border bg-info-surface text-info-subtle-foreground [&>svg]:text-info",
    desc: "text-info-subtle-foreground",
  },
]

const ratio = (n: number) => n.toFixed(2).replace(".", ",")
const delta = (n: number) => n.toFixed(3).replace(".", ",")

function ModeBadge({ mode }: { mode: BookingMode }) {
  const m = BOOKING_MODE_META[mode]
  return (
    <Badge tone={m.tone}>
      <m.icon aria-hidden />
      {m.label}
    </Badge>
  )
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const m = ORDER_STATUS_META[status]
  return (
    <Badge tone={m.tone}>
      <m.icon aria-hidden />
      {m.label}
    </Badge>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {children}
    </section>
  )
}

function Hero() {
  const id = useId()
  return (
    <section className="flex flex-col gap-6 py-4 @3xl:py-10">
      <div className="flex max-w-2xl flex-col gap-3">
        <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <MapPin aria-hidden className="size-4" />
          Seluruh Bali, waktu WITA
        </p>
        <h2 className="text-3xl leading-tight @3xl:text-5xl @3xl:leading-tight">Jasa rumah tepercaya, dikerjakan di lokasimu</h2>
        <p className="text-base text-muted-foreground @3xl:text-lg">
          Pesan untuk jadwal tertentu atau minta pekerja datang sekarang. Pembayaranmu ditahan Jasana sampai pekerjaan selesai.
        </p>
      </div>
      <form role="search" className="flex flex-col gap-2 @2xl:flex-row" onSubmit={(e) => e.preventDefault()}>
        <Label htmlFor={`${id}-q`} className="sr-only">
          Cari jasa
        </Label>
        <Input id={`${id}-q`} type="search" placeholder="Cari jasa, misalnya servis AC" className="@2xl:flex-1" />
        <Select defaultValue="denpasar">
          <SelectTrigger aria-label="Lokasi" className="h-11 w-full text-base @2xl:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="denpasar">Denpasar</SelectItem>
            <SelectItem value="badung">Badung</SelectItem>
            <SelectItem value="gianyar">Gianyar</SelectItem>
            <SelectItem value="tabanan">Tabanan</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" size="lg" className="h-11">
          Cari jasa
        </Button>
      </form>
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">Kategori</p>
        <ul className="flex flex-wrap gap-2">
          {CATEGORIES.map(({ label, icon: Icon }) => (
            <li key={label}>
              <Button variant="outline" size="sm">
                <Icon aria-hidden />
                {label}
              </Button>
            </li>
          ))}
        </ul>
        <a href="#jasa" className="w-fit text-sm font-semibold text-primary">
          Lihat jasa yang bisa datang sekarang
        </a>
      </div>
    </section>
  )
}

function ListingCard({ l }: { l: (typeof LISTINGS)[number] }) {
  return (
    <Card
      data-kartu
      className="relative gap-0 overflow-hidden py-0 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2"
    >
      <div className="flex aspect-4/3 items-center justify-center bg-muted text-muted-foreground">
        <l.icon aria-hidden className="size-8" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-lg leading-6.5 font-semibold">
            {/* Tautan merentang: seluruh kartu bisa ditekan, judul tetap tautan aslinya. */}
            <a href="#jasa" className="outline-none after:absolute after:inset-0">
              {l.title}
            </a>
          </h3>
          <p className="text-sm text-muted-foreground">
            {l.provider}, {l.area}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="flex items-center gap-1">
            <Star aria-hidden className="size-4 fill-foreground" />
            <span className="font-semibold tabular-nums">{formatRating(l.rating)}</span>
            <span className="text-muted-foreground tabular-nums">({l.reviews})</span>
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPin aria-hidden className="size-4" />
            {formatJarak(l.meter)}
          </span>
          <span className="text-muted-foreground">{formatDurasi(l.minutes)}</span>
        </div>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-1">
          <p className="text-sm text-muted-foreground">
            Mulai <span className="text-base font-semibold text-foreground tabular-nums">{formatRupiah(l.price)}</span>
          </p>
          <ModeBadge mode={l.mode} />
        </div>
      </div>
    </Card>
  )
}

function Listings() {
  return (
    <div className="grid gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3">
      {LISTINGS.map((l) => (
        <ListingCard key={l.title} l={l} />
      ))}
    </div>
  )
}

function OrderCard({ o }: { o: (typeof ORDERS)[number] }) {
  return (
    <Card
      data-kartu
      className="relative gap-3 p-4 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground tabular-nums">{o.no}</span>
        <StatusBadge status={o.status} />
      </div>
      <div className="flex flex-col gap-0.5">
        <h3 className="font-semibold">
          <a href="#pesanan" className="outline-none after:absolute after:inset-0">
            {o.title}
          </a>
        </h3>
        <p className="text-sm text-muted-foreground">{o.provider}</p>
      </div>
      <dl className="grid gap-1 text-sm">
        <div className="flex flex-wrap justify-between gap-x-3">
          <dt className="text-muted-foreground">Jadwal</dt>
          <dd className="tabular-nums">{formatTanggalJam(o.at)}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-x-3">
          <dt className="text-muted-foreground">Penanggung jawab</dt>
          <dd>{o.assignee}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-x-3">
          <dt className="text-muted-foreground">Total</dt>
          <dd className="font-semibold tabular-nums">{formatRupiah(o.amount)}</dd>
        </div>
      </dl>
      <ModeBadge mode={o.mode} />
    </Card>
  )
}

function Swatch({ token, cls, value }: { token: string; cls: string; value: { hex: string; oklch: string } }) {
  return (
    <li className="flex flex-col gap-1.5">
      <div className={`${cls} h-12 rounded-md border border-border`} />
      <div className="flex flex-col text-xs">
        <span className="font-semibold">{token}</span>
        <span className="font-mono text-muted-foreground">{value.hex}</span>
        <span className="font-mono text-muted-foreground">{value.oklch}</span>
      </div>
    </li>
  )
}

function ContrastTable({ pairs }: { pairs: Pair[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground uppercase">
            <th className="px-3 py-2 font-medium">Contoh</th>
            <th className="px-3 py-2 font-medium">Pasangan</th>
            <th className="px-3 py-2 text-right font-medium">Rasio</th>
            <th className="px-3 py-2 font-medium">AA</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((p) => {
            const pass = p.ratio >= p.need
            return (
              <tr key={p.label} className="border-b border-border last:border-0">
                <td className="px-3 py-2">
                  {/* Warna dari arah.json supaya contoh selalu sama dengan rasio yang dihitung. */}
                  <span className="inline-flex size-8 items-center justify-center rounded-sm border border-border font-semibold" style={{ color: p.fg, backgroundColor: p.bg }}>
                    Aa
                  </span>
                </td>
                <td className="px-3 py-2">{p.label}</td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{ratio(p.ratio)}:1</td>
                <td className="px-3 py-2">
                  <Badge tone={pass ? "success" : "destructive"}>
                    {pass ? <CircleCheck aria-hidden /> : <CircleX aria-hidden />}
                    {pass ? `Lolos (${p.need}:1)` : p.note ? `Gagal, ${p.note.toLowerCase()}` : "Gagal"}
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

export function Showcase({ id, data }: { id: ArahId; data: ArahData }) {
  const meta = ARAH_META[id]
  const [fontIndex, setFontIndex] = useState(0)
  const font = meta.fonts[fontIndex]
  const formId = useId()
  const r = meta.radius

  const style = {
    ...Object.fromEntries(Object.entries(data.tokens).map(([k, v]) => [`--${k}`, v.hex])),
    "--radius": `${r}px`,
    "--arah-dur": meta.dur,
    "--arah-heading": `var(${font.heading})`,
    "--arah-body": `var(${font.body})`,
    "--arah-heading-weight": font.weight,
    "--arah-heading-tracking": font.tracking,
  } as React.CSSProperties

  return (
    <div data-arah={id} className="arah flex flex-col gap-12 rounded-xl border border-border p-4 md:p-8" style={style}>
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl leading-tight">
            {id}. {meta.name}
          </h2>
          <p className="text-lg text-muted-foreground">{meta.tagline}</p>
          <p className="max-w-prose">{meta.reason}</p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Huruf</p>
          <div role="group" aria-label="Pilih huruf" className="flex flex-wrap gap-2">
            {meta.fonts.map((f, i) => (
              <Button key={f.label} size="sm" variant={i === fontIndex ? "secondary" : "outline"} aria-pressed={i === fontIndex} onClick={() => setFontIndex(i)}>
                {f.label}
              </Button>
            ))}
          </div>
          <p className="max-w-prose text-sm text-muted-foreground">{meta.fontReason}.</p>
        </div>

        {SWATCHES.map((g) => (
          <div key={g.title} className="flex flex-col gap-2">
            <p className="text-sm font-semibold">{g.title}</p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {g.items.map(([token, cls]) => (
                <Swatch key={token} token={token} cls={cls} value={data.tokens[token]} />
              ))}
            </ul>
          </div>
        ))}

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Kontras WCAG AA</p>
          <ContrastTable pairs={data.contrast} />
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold">Radius</dt>
            <dd className="text-muted-foreground tabular-nums">
              sm {Math.max(0, r - 4)} px, dasar {r} px, lg {r + 4} px, xl {r + 10} px, badge penuh
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Garis</dt>
            <dd className="text-muted-foreground">{meta.garis}</dd>
          </div>
          <div>
            <dt className="font-semibold">Bayangan</dt>
            <dd className="text-muted-foreground">{meta.bayangan}</dd>
          </div>
          <div>
            <dt className="font-semibold">Gerak</dt>
            <dd className="text-muted-foreground">{meta.gerak}</dd>
          </div>
        </dl>

        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
          {meta.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
          <li className="tabular-nums">
            Jarak pucat peringatan ke bahaya (ΔE OKLab): latar badge {delta(data.paleDelta["warning-subtle vs destructive-subtle"])}, latar alert{" "}
            {delta(data.paleDelta["warning-surface vs destructive-surface"])}.
          </li>
        </ul>
      </section>

      <Block title="Hero dan kartu jasa, mobile 390 px">
        <div className="@container w-97.5 max-w-full rounded-2xl border border-border bg-background p-4">
          <Hero />
          <Listings />
        </div>
      </Block>

      <Block title="Hero dan kartu jasa, desktop">
        <div className="@container rounded-xl border border-border bg-background p-4 md:p-6">
          <Hero />
          <Listings />
        </div>
      </Block>

      <Block title="Kartu pesanan">
        <div className="grid gap-4 sm:grid-cols-2">
          {ORDERS.map((o) => (
            <OrderCard key={o.no} o={o} />
          ))}
        </div>
      </Block>

      <Block title="Tombol">
        <div className="flex flex-col gap-4">
          {BUTTONS.map((b) => (
            <div key={b.variant} className="flex flex-wrap items-end gap-x-6 gap-y-2">
              <p className="w-40 text-sm font-semibold">{b.name}</p>
              {(["Normal", "Hover", "Nonaktif"] as const).map((state) => (
                <div key={state} className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">{state}</span>
                  <Button
                    variant={b.variant}
                    disabled={state === "Nonaktif"}
                    className={state === "Hover" ? b.hover : undefined}
                    tabIndex={state === "Hover" ? -1 : undefined}
                  >
                    {b.label}
                  </Button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Block>

      <Block title="Badge mode dan status">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <ModeBadge mode="SCHEDULED" />
            <ModeBadge mode="AVAILABLE_NOW" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">Berdampingan: menunggu dan komplain</p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="PENDING_ACCEPTANCE" />
              <StatusBadge status="DISPUTED" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">Seluruh status pesanan</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ORDER_STATUS_META) as OrderStatus[]).map((s) => (
                <StatusBadge key={s} status={s} />
              ))}
            </div>
          </div>
        </div>
      </Block>

      <Block title="Formulir">
        <form className="grid max-w-xl gap-5" noValidate onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-nama`} className="text-sm font-semibold">
              Nama lengkap
            </Label>
            <Input id={`${formId}-nama`} placeholder="Contoh: Made Wirawan" aria-describedby={`${formId}-nama-ket`} />
            <p id={`${formId}-nama-ket`} className="text-xs font-medium text-muted-foreground">
              Dipakai penanggung jawab saat menghubungimu.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-kat`} className="text-sm font-semibold">
              Jenis jasa
            </Label>
            <Select>
              <SelectTrigger id={`${formId}-kat`} className="h-11 w-full text-base">
                <SelectValue placeholder="Pilih jenis jasa" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.label} value={c.label}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-email`} className="text-sm font-semibold">
              Email
            </Label>
            <Input id={`${formId}-email`} type="email" defaultValue="made@" aria-invalid aria-describedby={`${formId}-email-err`} />
            <p id={`${formId}-email-err`} className="flex items-center gap-1 text-xs font-medium text-destructive">
              <CircleAlert aria-hidden className="size-4" />
              Format email belum benar. Contoh: made@contoh.id
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-off`} className="text-sm font-semibold">
              Kode usaha
            </Label>
            <Input id={`${formId}-off`} defaultValue="USH-0012" disabled />
          </div>
          <Button type="submit" className="w-fit">
            <Wrench aria-hidden />
            Simpan profil
          </Button>
        </form>
      </Block>

      <Block title="Alert (peringatan dan bahaya berdampingan)">
        <div className="grid gap-4 sm:grid-cols-2">
          {ALERTS.map((a) => (
            <Alert key={a.key} className={a.cls}>
              <a.icon aria-hidden />
              <AlertTitle className="font-semibold">{a.title}</AlertTitle>
              <AlertDescription className={a.desc}>{a.body}</AlertDescription>
            </Alert>
          ))}
        </div>
      </Block>
    </div>
  )
}
