import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import type { OrderStatus } from "@jasana/shared"
import { Bell, CalendarClock, CircleCheck, CircleX, Inbox, Info, Menu, TriangleAlert, type LucideIcon } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge, type BadgeTone } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { EmptyState } from "@/components/shared/empty-state"
import { EscrowNote } from "@/components/shared/escrow-note"
import { ListingCard } from "@/components/shared/listing-card"
import { LiveDot } from "@/components/shared/live-dot"
import { ModeBadge } from "@/components/shared/mode-badge"
import { MoneyText } from "@/components/shared/money-text"
import { RatingStars, RatingSummary } from "@/components/shared/rating-stars"
import { EnumBadge, StatusBadge } from "@/components/shared/status-badge"
import { ENUM_META_GROUPS } from "@/lib/enum-labels"
import { ORDER_STATUS_META } from "@/lib/order-status"
import { ButtonMatrix } from "../ds/components/button-matrix"
import { FormDemo } from "../ds/components/form-demo"
import { TabsDemo } from "../ds/components/tabs-demo"
import { COMPACT_LISTINGS } from "../ds/data"
import { AssistantDemo } from "./assistant-demo"
import { FeedbackDemo } from "./feedback-demo"
import { ListingDemo } from "./listing-demo"
import { MapDemo } from "./map-demo"
import { ChipsDemo, ErrorStateDemo, NavMarkersDemo } from "./markers-demo"
import { OrderActionsDemo } from "./order-actions-demo"

export const metadata: Metadata = { title: "Galeri komponen" }

const VARIANTS = [
  { variant: "primary", label: "Bayar sekarang" },
  { variant: "secondary", label: "Lihat detail" },
  { variant: "outline", label: "Ubah alamat" },
  { variant: "ghost", label: "Kembali" },
  { variant: "destructive", label: "Tolak pesanan" },
  { variant: "now", label: "Ambil" },
] as const
const SIZES = ["sm", "md", "lg"] as const

// `now` tanpa ikon: isinya titik live (DS 6.1, D242).
const TONES: { tone: BadgeTone; label: string; icon?: LucideIcon }[] = [
  { tone: "warning", label: "Menunggu", icon: TriangleAlert },
  { tone: "info", label: "Informasi", icon: Info },
  { tone: "success", label: "Berhasil", icon: CircleCheck },
  { tone: "destructive", label: "Gagal", icon: CircleX },
  { tone: "neutral", label: "Berakhir", icon: CircleX },
  { tone: "now", label: "Sekarang" },
  { tone: "outline", label: "Label", icon: CalendarClock },
]

const STATUSES = Object.keys(ORDER_STATUS_META) as OrderStatus[]
const CAPTION = "text-xs font-medium text-muted-foreground"

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-h2 font-semibold text-balance">{title}</h2>
        {note && <p className="max-w-lg text-sm text-pretty text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  )
}

// Galeri komponen (Design System 6.3, v2.6). Hanya komponen yang sudah menjadi bagian aplikasi; peraga
// yang belum dibangun (PriceBreakdown, Countdown, OfferCard) tetap di /dev/ds. Hanya hidup di development.
export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <main id="konten" tabIndex={-1} className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-10 outline-none md:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 font-bold">Galeri komponen</h1>
        <p className="text-sm text-muted-foreground">
          Design System v2.6. Hanya tampil di development. Acuan peraga: <Link href="/dev/ds" className="text-brand-strong underline underline-offset-3 hover:text-brand-subtle-foreground">/dev/ds</Link>
        </p>
      </header>

      <Section title="Tipografi" note="Token D247 dan D251. Judul text-balance, paragraf text-pretty.">
        <div className="flex flex-col gap-3">
          <p className="text-display font-bold md:text-display-lg">display 30/36, 40/48 mulai md</p>
          <p className="text-h1 font-bold">h1 28/36 Pesanan saya</p>
          <p className="text-h2 font-semibold">h2 22/30 Rincian harga</p>
          <p className="text-h3 font-semibold">h3 18/26 Servis AC split</p>
          <p className="text-base">body 16/24 Pekerja sedang menuju lokasimu.</p>
          <p className="text-sm">body-sm 14/20 Dikerjakan oleh penanggung jawab yang ditugaskan usaha.</p>
          <p className={CAPTION}>caption 12/16 Terakhir diperbarui 5 menit lalu</p>
          <p translate="no" className="text-logo font-bold">
            logo 22/28 Jasana
          </p>
          <p translate="no" className="text-sm tabular-nums">
            ORD-20261117-0001
          </p>
          <p className="text-code-xl font-bold tracking-code tabular-nums">482915</p>
          <p className={CAPTION}>code-xl 32/40 kode verifikasi</p>
        </div>
      </Section>

      <Section title="Tombol" note="Satu primary per tampilan. sm hanya di area usaha dan admin (D252). icon 44 x 44 untuk tombol berisi ikon saja (D257).">
        <div className="flex flex-col gap-4">
          {SIZES.map((size) => (
            <div key={size} className="flex flex-col gap-2">
              <p className={CAPTION}>Ukuran {size}</p>
              <div className="flex flex-wrap items-center gap-3">
                {VARIANTS.map(({ variant, label }) => (
                  <Button key={variant} variant={variant} size={size}>
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          <div className="flex flex-col gap-2">
            <p className={CAPTION}>Ukuran icon</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="ghost" size="icon" aria-label="Buka menu">
                <Menu aria-hidden />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Notifikasi">
                <Bell aria-hidden />
              </Button>
              <Button variant="outline" size="icon" aria-label="Notifikasi">
                <Bell aria-hidden />
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className={CAPTION}>Memproses</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button loading>Membayar…</Button>
              <Button variant="now" size="lg" loading>
                Mengambil…
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="State tombol" note="Hover, ditekan, dan fokus dipaksa tampil untuk peraga (DS 6.4).">
        <ButtonMatrix />
      </Section>

      <Section title="Badge nada">
        <div className="flex flex-wrap gap-2">
          {TONES.map(({ tone, label, icon: Icon }) => (
            <Badge key={tone} tone={tone}>
              {Icon ? <Icon aria-hidden /> : <LiveDot className="size-1.5" />}
              {label}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Status pesanan (15)">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STATUSES.map((status) => (
            <li key={status} className="flex flex-col items-start gap-1">
              <StatusBadge status={status} />
              <code className="text-xs text-muted-foreground">{status}</code>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Badge enum lain">
        <div className="flex flex-col gap-4">
          {ENUM_META_GROUPS.map(({ name, meta }) => (
            <div key={name} className="flex flex-col gap-2">
              <p className={CAPTION}>{name}</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(meta).map(([value, m]) => (
                  <EnumBadge key={value} meta={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Mode pesanan" note="Pill berwarna berarti status; Terjadwal bergaris, Sekarang putih bergaris hijau dengan titik live (DS 7.1, D242).">
        <div className="flex flex-wrap gap-2">
          <ModeBadge mode="SCHEDULED" />
          <ModeBadge mode="AVAILABLE_NOW" />
          <StatusBadge status="PAID" />
        </div>
      </Section>

      <Section title="Penanda aktif dan terpilih" note="Penanda posisi pucat (D243). Solid hanya tombol now dan titik live.">
        <NavMarkersDemo />
        <ChipsDemo />
        <div className="flex flex-col gap-2">
          <p className={CAPTION}>Tab, tersimpan di query URL</p>
          {/* useSearchParams butuh batas Suspense (Cache Components). */}
          <Suspense fallback={null}>
            <TabsDemo />
          </Suspense>
        </div>
        <div className="flex flex-col gap-2">
          <p className={CAPTION}>Switch menyala dan mati (D244)</p>
          <div className="flex items-center gap-4">
            <Switch defaultChecked aria-label="Contoh switch menyala" />
            <Switch aria-label="Contoh switch mati" />
          </div>
        </div>
      </Section>

      <Section title="Kartu jasa" note="Varian biasa dan compact (D254). Compact dipilih container query di bawah 36rem.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className={CAPTION}>Biasa</p>
            <ListingCard listing={COMPACT_LISTINGS[0]!} />
          </div>
          <div className="flex flex-col gap-2">
            <p className={CAPTION}>Compact</p>
            <ul className="flex flex-col gap-3">
              {COMPACT_LISTINGS.map((l) => (
                <li key={l.id}>
                  <ListingCard listing={l} variant="compact" />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className={CAPTION}>Data asli GET /listings, empat state</p>
        <ListingDemo />
      </Section>

      <Section title="Aksi pesanan (getOrderActions)">
        <OrderActionsDemo />
      </Section>

      <Section title="Angka, rating, dan escrow">
        <div className="flex flex-col gap-3">
          <MoneyText amount={1250000} className="text-h3 font-semibold" />
          <RatingStars rating={4.6} />
          <RatingSummary average={4.8} count={37} />
          <EscrowNote />
        </div>
      </Section>

      <Section title="Formulir" note="Atribut field DS 6.1b, error body-sm 500, fokus ke error pertama (D248).">
        <FormDemo />
      </Section>

      <Section title="Peta" note="MapView baca saja dengan tiga penanda DS 5, dan MapPicker dengan pin diam di tengah.">
        <MapDemo />
      </Section>

      <Section title="Percakapan Asisten" note="Usulan D266 dan D268: gelembung, kartu dengan baris aksi, indikator mengetik, pemberitahuan, dan kotak tulis.">
        <AssistantDemo />
      </Section>

      <Section title="Kartu, banner, dan akordeon">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Servis AC split</CardTitle>
              <CardDescription>Sejuk Jaya Teknik, Denpasar</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <ModeBadge mode="SCHEDULED" />
              <StatusBadge status="ON_THE_WAY" />
            </CardContent>
            <CardFooter className="gap-3">
              <Button>Lihat pesanan</Button>
              <Button variant="ghost">Kembali</Button>
            </CardFooter>
          </Card>
          <div className="flex flex-col gap-4">
            <Alert>
              <Info aria-hidden />
              <AlertTitle>Pembayaran diterima</AlertTitle>
              <AlertDescription>Usaha akan menugaskan penanggung jawab.</AlertDescription>
            </Alert>
            <Accordion type="single" collapsible className="rounded-lg border border-border bg-card px-4">
              <AccordionItem value="garansi">
                <AccordionTrigger>Apakah ada garansi?</AccordionTrigger>
                <AccordionContent>Garansi pengerjaan 7 hari setelah pesanan selesai.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </Section>

      <Section title="Dialog dan toast" note="Konfirmasi aksi yang tidak bisa dibatalkan; di HP menempel di bawah. Toast satu kalimat.">
        <FeedbackDemo />
      </Section>

      <Section title="Memuat, kosong, dan error" note="Empat state halaman data (aturan 10). Aksi empty state satu, varian outline.">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3">
            <Skeleton className="aspect-4/3 w-full rounded-md" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="rounded-lg border border-border bg-card">
            <EmptyState
              icon={Inbox}
              title="Belum ada pesanan"
              description="Pesanan yang kamu buat akan muncul di sini."
              action={
                <Button asChild variant="outline">
                  <Link href="/cari">Cari jasa</Link>
                </Button>
              }
            />
          </div>
          <div className="rounded-lg border border-border bg-card">
            <ErrorStateDemo />
          </div>
        </div>
      </Section>
    </main>
  )
}
