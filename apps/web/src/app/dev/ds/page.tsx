import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Check, CircleAlert, KeyRound } from "lucide-react"
import { Label } from "@/components/ui/label"
import { AvailabilityToggle } from "./components/availability-toggle"
import { ButtonMatrix } from "./components/button-matrix"
import { ListingCard, OrderCard } from "./components/cards"
import { Countdown } from "./components/countdown"
import { HeroSearch } from "./components/hero-search"
import { Catatan, LINK_CLASS, LiveDot, ModeBadge, StatusBadge } from "./components/markers"
import { BottomNav, PublicHeader, SidebarSnippet } from "./components/navigation"
import { OfferCard } from "./components/offer-card"
import { StatusBanner } from "./components/status-banner"
import { TabsDemo } from "./components/tabs-demo"
import { ContrastTable, TokenSwatches } from "./components/tokens-panel"
import { tokenCss } from "./contrast"
import { FINDINGS, LISTINGS, LOCATIONS, ORDERS } from "./data"
import { ExploreSection } from "./eksplorasi/explore-section"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { ORDER_STATUS_META } from "@/lib/order-status"
import type { OrderStatus } from "@jasana/shared"
import "./ds.css"

export const metadata: Metadata = { title: "Design System v2.0" }

// Token v2.0 hanya aktif selama halaman ini terpasang. Selector :has() menjangkau isi portal
// Radix (Select) yang dirender di luar wrapper. Nilainya dari ds-tokens.json.
const TOKEN_STYLE = tokenCss(":root:has(.ds-v2)")

const STATUSES = Object.keys(ORDER_STATUS_META) as OrderStatus[]

function Section({ id, n, title, desc, children }: { id: string; n: number; title: string; desc?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-judul`} className="flex scroll-mt-6 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={`${id}-judul`} className="text-xl font-semibold">
          {n}. {title}
        </h2>
        {desc ? <p className="max-w-prose text-sm text-muted-foreground">{desc}</p> : null}
      </div>
      {children}
    </section>
  )
}

export default function DevDsPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <div className="ds-v2 bg-background text-foreground">
      <style>{TOKEN_STYLE}</style>
      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8 md:px-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Design System v2.0</h1>
          <p className="max-w-prose text-sm text-muted-foreground">
            Peraga DS v2.0 (D241) apa adanya. Token v2.0 hanya berlaku di halaman ini, halaman lain masih v1.6. Bagian yang
            ditandai &quot;catatan A#&quot; dirender dari aturan dokumen yang ambigu atau bertentangan, daftarnya di bagian akhir.
            Foto listing sengaja berupa placeholder ikon.
          </p>
        </header>

        <Section id="hero" n={1} title="Hero beranda" desc="Satu tombol primary per tampilan (P2). Chip kategori aktif berupa penanda pucat.">
          <div className="@container rounded-xl border border-border bg-card px-4 py-4 md:px-6">
            <HeroSearch />
          </div>
          <Catatan id="A15" />
        </Section>

        <Section id="listing" n={2} title="Kartu listing" desc="Dua mode Terjadwal dan satu mode Sekarang. Mode Sekarang dibedakan lewat bentuk badge, bukan warna kartu.">
          <div className="@container">
            <div className="grid gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3">
              {LISTINGS.map((l) => (
                <ListingCard key={l.id} l={l} />
              ))}
            </div>
          </div>
          <Catatan id="A19" />
        </Section>

        <Section id="pesanan" n={3} title="Kartu pesanan" desc="Nada status Bagian 7: kuning menunggu, biru berjalan, teal selesai, merah komplain.">
          <div className="@container">
            <div className="grid gap-4 @3xl:grid-cols-2">
              {ORDERS.map((o) => (
                <OrderCard key={o.number} o={o} />
              ))}
            </div>
          </div>
        </Section>

        <Section id="tawaran" n={4} title="Kartu tawaran mode Sekarang" desc="Pekerja melihat Ambil dan Lewati, pemilik usaha melihat Terima dan Tolak. Hitung mundur merah di bawah 5 menit.">
          <div className="@container">
            <div className="grid gap-4 @3xl:grid-cols-2 @5xl:grid-cols-3">
              <OfferCard viewer="pekerja" seconds={570} title="Perbaikan pipa bocor" area="Sanur Kaja" distance="850 m" duration="1 jam" options="Pipa PVC 1/2 inci, 1 titik bocor" />
              <OfferCard viewer="pemilik" seconds={250} title="Servis AC split 1 PK" area="Renon" distance="2,1 km" duration="1 jam 30 menit" options="Cuci AC, tambah freon" />
              <OfferCard viewer="pekerja" seconds={0} title="Bersih kamar mandi" area="Kerobokan" distance="3,4 km" duration="2 jam" options="2 kamar mandi" />
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-semibold">Countdown di berbagai sisa waktu</p>
            <ul className="flex flex-col gap-2">
              <li><Countdown seconds={83700} label="Batas komplain" running={false} /></li>
              <li><Countdown seconds={760} label="Batas bayar" running={false} /></li>
              <li><Countdown seconds={299} label="Kode berlaku" running={false} /></li>
              <li><Countdown seconds={0} label="Kode berlaku" expiredText="Kode kedaluwarsa" running={false} /></li>
            </ul>
          </div>
        </Section>

        <Section id="ketersediaan" n={5} title="AvailabilityToggle" desc="Menyala dan mati. Keduanya bisa ditekan.">
          <div className="grid max-w-xl gap-4">
            <AvailabilityToggle defaultOn />
            <AvailabilityToggle defaultOn={false} />
          </div>
          <Catatan id="A20" />
        </Section>

        <Section id="tombol" n={6} title="Tombol" desc="Hover, ditekan, dan fokus dipaksa tampil untuk peraga. Tombol asli tetap bereaksi saat disentuh atau lewat keyboard.">
          <ButtonMatrix />
        </Section>

        <Section id="badge" n={7} title="Badge mode dan status" desc="Pill berwarna selalu berarti status. Mode tampil bergaris (Terjadwal) atau putih bergaris hijau dengan titik (Sekarang).">
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap gap-2">
              <ModeBadge mode="SCHEDULED" />
              <ModeBadge mode="AVAILABLE_NOW" />
            </div>
            <ul className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <li key={s}>
                  <StatusBadge status={s} />
                </li>
              ))}
            </ul>
            <Catatan id="A9" />
          </div>
        </Section>

        <Section id="formulir" n={8} title="Input, Select, dan pesan error" desc="Label selalu terlihat di atas input. Input dan Select 16 px dan 44 px.">
          <form className="flex max-w-xl flex-col gap-5 rounded-lg border border-border bg-card p-4 md:p-6" noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ds-nama">Nama lengkap</Label>
              <Input id="ds-nama" defaultValue="Ni Luh Putu Ayu" autoComplete="name" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ds-alamat">Alamat (fokus dipaksa tampil)</Label>
              <Input id="ds-alamat" data-demo="focus" defaultValue="Jl. Tukad Badung No. 12" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ds-kec">Kabupaten atau kota</Label>
              <Select defaultValue="Denpasar">
                <SelectTrigger id="ds-kec" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ds-hp">Nomor HP</Label>
              <Input id="ds-hp" type="tel" inputMode="tel" defaultValue="0812345" aria-invalid aria-describedby="ds-hp-error" />
              <p id="ds-hp-error" className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                <CircleAlert aria-hidden className="size-4 shrink-0" />
                Nomor HP diawali 08 dan berisi 10 sampai 13 digit.
              </p>
            </div>
            <Catatan id="A12" />
          </form>
        </Section>

        <Section id="banner" n={9} title="Banner status" desc="Satu bentuk untuk empat nada (1.4b). Banner status pesanan tidak punya tombol tutup.">
          <div className="grid gap-3 @container">
            <StatusBanner tone="success" title="Pesanan selesai">
              Terima kasih. Beri ulasan supaya pelanggan lain terbantu.
            </StatusBanner>
            <StatusBanner tone="warning" title="Menunggu pembayaran">
              Bayar sebelum Sab, 22 Nov 2026, 10.30 WITA supaya pesanan tidak batal.
            </StatusBanner>
            <StatusBanner tone="info" title="Penanggung jawab sedang menuju lokasimu">
              Komang Arta diperkirakan tiba sekitar 14.20 WITA.
            </StatusBanner>
            <StatusBanner tone="destructive" title="Pesanan dalam komplain">
              Admin sedang meninjau komplainmu. Dana ditahan sampai ada putusan.
            </StatusBanner>
          </div>
        </Section>

        <Section id="penanda" n={10} title="Penanda aktif dan terpilih" desc="Tiga intensitas hijau terang (6.4): solid, pucat, dan garis.">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg leading-6.5 font-semibold">Solid</h3>
              <div className="flex flex-wrap items-start gap-6">
                <div className="flex flex-col gap-2">
                  <SidebarSnippet />
                  <p className="text-xs font-medium text-muted-foreground">Pesanan aktif, Ringkasan hover, Jasa Saya fokus</p>
                </div>
                <div className="flex w-full max-w-97.5 flex-col gap-2">
                  <div className="overflow-hidden rounded-lg border border-border">
                    <BottomNav />
                  </div>
                  <span className="flex gap-3 text-xs font-medium text-muted-foreground">
                    Navigasi bawah, Beranda aktif <Catatan id="A8" />
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <TabsDemo />
                <span className="flex gap-3 text-xs font-medium text-muted-foreground">
                  Tab aktif solid <Catatan id="A11" /> <Catatan id="A18" />
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-lg leading-6.5 font-semibold">Pucat</h3>
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-subtle px-4 text-sm font-bold text-brand-subtle-foreground">
                  <Check aria-hidden className="size-4" />
                  Bisa datang sekarang
                </span>
                <span className="flex size-10 items-center justify-center rounded-full bg-brand-subtle text-sm font-bold text-brand-subtle-foreground">
                  KA
                </span>
                <span className="flex size-8 items-center justify-center rounded-full bg-brand-subtle text-brand-subtle-foreground">
                  <Check aria-hidden className="size-4" />
                  <span className="sr-only">Langkah selesai</span>
                </span>
              </div>
              <div className="flex max-w-xl flex-col gap-2">
                <p className="pb-1 text-sm font-medium">Opsi terpilih di formulir (tampilan statis)</p>
                <div className="flex min-h-11 items-center justify-between gap-3 rounded-md border-2 border-brand bg-brand-subtle px-4 py-3 text-sm font-bold text-brand-subtle-foreground">
                  <span className="flex items-center gap-2">
                    <Check aria-hidden className="size-4" />
                    1/2 sampai 1 PK
                    <span className="sr-only">(terpilih)</span>
                  </span>
                  <span className="tabular-nums">Termasuk</span>
                </div>
                <div className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-input bg-card px-4 py-3 text-sm font-medium">
                  <span>1,5 sampai 2 PK</span>
                  <span className="tabular-nums">+Rp25.000</span>
                </div>
              </div>
              <Catatan id="A7" />
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-lg leading-6.5 font-semibold">Garis</h3>
              <div className="flex flex-wrap items-center gap-6">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <LiveDot />
                  Titik live
                </span>
                <span className="flex h-12 w-40 items-center rounded-lg border border-border border-l-4 border-l-brand bg-card px-3 text-sm font-semibold">
                  Garis tepi kiri
                </span>
                <span className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full border-2 border-brand bg-card text-sm font-bold">2</span>
                  <span className="h-0.5 w-10 bg-brand" aria-hidden />
                  <span className="flex size-8 items-center justify-center rounded-full border border-input bg-card text-sm font-medium text-muted-foreground">3</span>
                  <span className="sr-only">Langkah 2 aktif dari 3</span>
                </span>
                <span className="flex items-center gap-2">
                  <KeyRound aria-hidden className="size-4 text-muted-foreground" />
                  <span className="flex size-11 items-center justify-center rounded-md border-2 border-brand bg-card text-lg font-bold ring-3 ring-brand-subtle tabular-nums">4</span>
                  <span className="sr-only">Kotak kode yang sedang diisi</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-lg leading-6.5 font-semibold">Tautan</h3>
              <p className="text-sm">
                Belum punya akun? <a href="#penanda" className={LINK_CLASS}>Daftar sekarang</a>
              </p>
            </div>
          </div>
        </Section>

        <Section id="token" n={11} title="Token dan kontras" desc="Rasio dihitung di halaman ini dengan rumus WCAG 2.1 dari nilai token, lalu dibandingkan dengan angka di DS 1.5.">
          <div className="@container flex flex-col gap-8">
            <TokenSwatches />
            <ContrastTable />
          </div>
        </Section>

        <Section id="responsif" n={12} title="Mobile 390 px dan desktop" desc="Komponen memakai container query, jadi bingkai 390 px menampilkan tata letak HP walaupun dibuka di layar lebar.">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">Bingkai 390 px (pelanggan di HP)</p>
              <div className="@container w-full max-w-97.5 overflow-hidden rounded-xl border border-border bg-background">
                <PublicHeader compact />
                <div className="flex flex-col gap-6 px-4 py-4">
                  <HeroSearch />
                  <div className="grid gap-4">
                    {LISTINGS.map((l) => (
                      <ListingCard key={l.id} l={l} />
                    ))}
                  </div>
                </div>
                <BottomNav active="Beranda" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="flex gap-3 text-xs font-medium text-muted-foreground">
                Bingkai lebar (desktop, selebar konten) <Catatan id="A13" />
              </p>
              <div className="@container w-full overflow-hidden rounded-xl border border-border bg-background">
                <PublicHeader />
                <div className="flex flex-col gap-6 px-4 py-4 md:px-6">
                  <HeroSearch />
                  <div className="grid gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3">
                    {LISTINGS.map((l) => (
                      <ListingCard key={l.id} l={l} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <ExploreSection />

        <section id="catatan" aria-labelledby="catatan-judul" className="flex scroll-mt-6 flex-col gap-4">
          <h2 id="catatan-judul" className="text-xl font-semibold">
            Catatan untuk ditinjau
          </h2>
          <p className="max-w-prose text-sm text-muted-foreground">
            Aturan dokumen yang ambigu, bertentangan, atau hasil hitungnya berbeda. Halaman ini tidak memutuskannya. Kolom
            &quot;Dirender&quot; menjelaskan pilihan sementara di halaman ini.
          </p>
          <ol className="flex flex-col gap-3">
            {FINDINGS.map((f) => (
              <li key={f.id} id={`catatan-${f.id}`} className="flex scroll-mt-6 flex-col gap-1 rounded-lg border border-border bg-card p-4 target:border-foreground">
                <p className="flex flex-wrap items-baseline gap-x-3 text-sm">
                  <span className="font-bold">{f.id}</span>
                  <span className="text-xs font-medium text-muted-foreground">DS {f.section}</span>
                </p>
                <p className="max-w-prose text-sm">{f.text}</p>
                <p className="max-w-prose text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Dirender: </span>
                  {f.rendered}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  )
}
