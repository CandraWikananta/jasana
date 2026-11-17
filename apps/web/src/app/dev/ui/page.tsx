import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { OrderStatus } from "@jasana/shared"
import { CircleAlert, CircleCheck, CircleX, Inbox, Info, TriangleAlert, Zap, type LucideIcon } from "lucide-react"
import { Badge, type BadgeTone } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { ModeBadge } from "@/components/shared/mode-badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { ORDER_STATUS_META } from "@/lib/order-status"

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

const TONES: { tone: BadgeTone; label: string; icon: LucideIcon }[] = [
  { tone: "warning", label: "Menunggu", icon: TriangleAlert },
  { tone: "info", label: "Informasi", icon: Info },
  { tone: "success", label: "Berhasil", icon: CircleCheck },
  { tone: "destructive", label: "Gagal", icon: CircleX },
  { tone: "neutral", label: "Berakhir", icon: CircleX },
  { tone: "now", label: "Sekarang", icon: Zap },
]

const STATUSES = Object.keys(ORDER_STATUS_META) as OrderStatus[]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  )
}

// Galeri komponen (Design System 6.3). Hanya hidup di development.
export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-10 md:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Galeri komponen</h1>
        <p className="text-sm text-muted-foreground">Design System v1.4. Hanya tampil di development.</p>
      </header>

      <Section title="Tipografi">
        <div className="flex flex-col gap-3">
          <p className="text-3xl font-bold">display 30/36 Cari jasa di sekitarmu</p>
          <p className="text-2xl font-bold">h1 24/32 Pesanan saya</p>
          <p className="text-xl font-semibold">h2 20/28 Rincian harga</p>
          <p className="text-lg leading-6.5 font-semibold">h3 18/26 Servis AC split</p>
          <p className="text-base">body 16/24 Pekerja sedang menuju lokasimu.</p>
          <p className="text-sm">body-sm 14/20 Dikerjakan oleh penanggung jawab yang ditugaskan usaha.</p>
          <p className="text-xs font-medium text-muted-foreground">caption 12/16 Terakhir diperbarui 5 menit lalu</p>
          <p className="font-mono text-sm tabular-nums">ORD-20261117-0001</p>
        </div>
      </Section>

      <Section title="Tombol">
        <div className="flex flex-col gap-4">
          {SIZES.map((size) => (
            <div key={size} className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">Ukuran {size}</p>
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
            <p className="text-xs font-medium text-muted-foreground">Memproses dan nonaktif</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button loading>Bayar sekarang</Button>
              <Button variant="now" size="lg" loading>
                Ambil
              </Button>
              <Button disabled>Bayar sekarang</Button>
              <Button variant="outline" disabled>
                Ubah alamat
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Badge nada">
        <div className="flex flex-wrap gap-2">
          {TONES.map(({ tone, label, icon: Icon }) => (
            <Badge key={tone} tone={tone}>
              <Icon aria-hidden />
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

      <Section title="Mode pesanan">
        <div className="flex flex-wrap gap-2">
          <ModeBadge mode="SCHEDULED" />
          <ModeBadge mode="AVAILABLE_NOW" />
        </div>
      </Section>

      <Section title="Kartu">
        <Card className="max-w-md">
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
      </Section>

      <Section title="Input">
        <div className="grid max-w-xl gap-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dev-nama" className="text-sm font-semibold">
              Nama lengkap
            </label>
            <Input id="dev-nama" placeholder="Contoh: Made Wirawan" aria-describedby="dev-nama-ket" />
            <p id="dev-nama-ket" className="text-xs font-medium text-muted-foreground">
              Sesuai KTP.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dev-email" className="text-sm font-semibold">
              Email
            </label>
            <Input id="dev-email" type="email" defaultValue="made@" aria-invalid aria-describedby="dev-email-err" />
            <p id="dev-email-err" className="flex items-center gap-1 text-xs font-medium text-destructive">
              <CircleAlert aria-hidden className="size-4" />
              Format email belum benar.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dev-off" className="text-sm font-semibold">
              Kode usaha
            </label>
            <Input id="dev-off" defaultValue="USH-0012" disabled />
          </div>
        </div>
      </Section>

      <Section title="Skeleton">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3">
              <Skeleton className="aspect-4/3 w-full rounded-md" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Empty state">
        <Card className="max-w-md">
          <EmptyState
            icon={Inbox}
            title="Belum ada pesanan"
            description="Pesanan yang kamu buat akan muncul di sini."
            action={
              <Button asChild>
                <Link href="/cari">Cari jasa</Link>
              </Button>
            }
          />
        </Card>
      </Section>
    </main>
  )
}
