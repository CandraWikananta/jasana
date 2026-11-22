import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Check } from "lucide-react"
import type { OrderStatus } from "@jasana/shared"
import { ORDER_STATUS_META } from "@/lib/order-status"
import { formatRupiah } from "@/lib/format"
import { AvailabilityToggle } from "./components/availability-toggle"
import { ButtonMatrix } from "./components/button-matrix"
import { ListingCard, OrderCard } from "./components/cards"
import { Countdown } from "./components/countdown"
import { FilterChip } from "@/components/shared/filter-chip"
import { FormDemo } from "./components/form-demo"
import { HeroSearch } from "./components/hero-search"
import { LINK_CLASS, LiveDot, ModeBadge, StatusBadge } from "./components/markers"
import { BottomNav, PublicHeader, SidebarSnippet } from "./components/navigation"
import { OfferCard } from "./components/offer-card"
import { StatusBanner } from "./components/status-banner"
import { TabsDemo } from "./components/tabs-demo"
import { ContrastTable, TokenSwatches } from "./components/tokens-panel"
import { ActiveFiltersDemo } from "./components/active-filters-demo"
import { COMPACT_LISTINGS, LISTINGS, ORDERS } from "./data"
import { ListingCard as SharedListingCard } from "@/components/shared/listing-card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { EscrowNote } from "@/components/shared/escrow-note"

export const metadata: Metadata = { title: "Design System v2.1" }

const STATUSES = Object.keys(ORDER_STATUS_META) as OrderStatus[]

const TYPE_SCALE = [
  { token: "display", size: "30/36 px, 40/48 px mulai md", weight: "700", cls: "text-display font-bold @3xl:text-display-lg", sample: "Servis AC di Denpasar" },
  { token: "h1", size: "28/36 px", weight: "700", cls: "text-h1 font-bold", sample: "Pesanan saya" },
  { token: "h2", size: "22/30 px", weight: "600", cls: "text-h2 font-semibold", sample: "Rincian harga" },
  { token: "h3", size: "18/26 px", weight: "600", cls: "text-h3 font-semibold", sample: "Perbaikan pipa bocor" },
  { token: "body", size: "16/24 px", weight: "400", cls: "text-base", sample: "Penanggung jawab sedang menuju lokasimu." },
  { token: "body-sm", size: "14/20 px", weight: "400", cls: "text-sm", sample: "Tukang Ledeng Sanur · Sanur" },
  { token: "caption", size: "12/16 px", weight: "500", cls: "text-xs font-medium", sample: "Dipesan Sab, 21 Nov 2026" },
]

function Section({ id, n, title, desc, children }: { id: string; n: number; title: string; desc?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-judul`} className="flex scroll-mt-6 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={`${id}-judul`} className="text-h2 font-semibold">
          {n}. {title}
        </h2>
        {desc ? <p className="max-w-lg text-sm text-muted-foreground">{desc}</p> : null}
      </div>
      {children}
    </section>
  )
}

function Sub({ children }: { children: React.ReactNode }) {
  return <h3 className="text-h3 font-semibold">{children}</h3>
}

/** Nama kelas di teks penjelasan, tidak dipatahkan di tanda hubung. */
function Tok({ children }: { children: string }) {
  return <code className="font-mono whitespace-nowrap text-foreground">{children}</code>
}

function Caption({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-muted-foreground">{children}</p>
}

export default function DevDsPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <div className="bg-background text-foreground">
      <main id="konten" tabIndex={-1} className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8 outline-none md:px-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-h1 font-bold">Design System v2.1</h1>
          <p className="max-w-lg text-sm text-muted-foreground">
            Halaman peraga dan acuan visual DS v2.1 (D242 sampai D250). Token dari globals.css, komponen dasar dari
            components/ui, dan penanda dari components/shared, sama dengan yang dipakai aplikasi. Foto listing sengaja berupa
            placeholder ikon.
          </p>
        </header>

        <Section id="hero" n={1} title="Hero beranda" desc="Judul berisi fakta (D249). Satu tombol primary per tampilan (P2). Chip kategori radius 10 px, aktif pucat dengan ikon Check.">
          <div className="@container rounded-xl border border-border bg-card px-4 py-4 md:px-6">
            <HeroSearch />
          </div>
        </Section>

        <Section id="listing" n={2} title="Kartu listing" desc="Hanya mode Sekarang yang diberi badge, karena Terjadwal adalah mode bawaan (D246). Judul paling banyak dua baris.">
          <div className="@container">
            <div className="grid gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3">
              {LISTINGS.map((l) => (
                <ListingCard key={l.id} l={l} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Sub>Varian compact (D254)</Sub>
            <Caption>Hasil /cari selama daftar lebih sempit dari 36rem: foto 112 px di kiri, satu tautan. Beranda tetap varian biasa.</Caption>
            {/* Kartu compact membaca lebar wadah @container, jadi bingkai 390 px menampilkan bentuk HP. */}
            <div className="@container max-w-97.5">
              <div className="flex flex-col gap-3">
                {COMPACT_LISTINGS.map((l) => (
                  <SharedListingCard key={l.id} listing={l} variant="compact" />
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section id="pesanan" n={3} title="Kartu pesanan" desc="Kedua mode tetap tampil. Nada status Bagian 7: kuning menunggu, biru berjalan, teal selesai, merah komplain.">
          <div className="@container">
            <div className="grid gap-4 @3xl:grid-cols-2">
              {ORDERS.map((o) => (
                <OrderCard key={o.number} o={o} />
              ))}
            </div>
          </div>
        </Section>

        <Section
          id="tawaran"
          n={4}
          title="Kartu tawaran mode Sekarang"
          desc="Kartu putih biasa dengan badge Sekarang, tanpa garis tepi kiri dan tanpa bayangan (D242). Pekerja melihat Ambil dan Lewati, pemilik usaha Terima dan Tolak. Hitung mundur merah di bawah 5 menit."
        >
          <div className="@container">
            <div className="grid gap-4 @3xl:grid-cols-2 @5xl:grid-cols-3">
              <OfferCard announce viewer="pekerja" seconds={570} title="Perbaikan pipa bocor" area="Sanur Kaja" distance="850 m" duration="1 jam" options="Pipa PVC 1/2 inci, 1 titik bocor" />
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

        <Section id="ketersediaan" n={5} title="AvailabilityToggle" desc="Menyala: badge Sekarang lalu Lokasi aktif (D242), switch --brand-hover (D244). Mati: tanpa badge. Keduanya bisa ditekan.">
          <div className="grid max-w-xl gap-4">
            <AvailabilityToggle defaultOn />
            <AvailabilityToggle defaultOn={false} />
          </div>
        </Section>

        <Section id="tombol" n={6} title="Tombol" desc="State per varian sesuai tabel 6.4. Hover, ditekan, dan fokus dipaksa tampil untuk peraga. Tombol asli tetap bereaksi saat disentuh atau lewat keyboard.">
          <ButtonMatrix />
        </Section>

        <Section id="badge" n={7} title="Badge mode dan status" desc="Pill berwarna selalu berarti status. Terjadwal tampil bergaris, Sekarang putih bergaris hijau dengan titik live. SETTLED berlabel Dana cair (D245).">
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
          </div>
        </Section>

        <Section id="tipografi" n={8} title="Tipografi" desc={
            <>
              Skala D247 lewat token <Tok>text-display</Tok> sampai <Tok>text-h3</Tok>. Judul <Tok>text-balance</Tok>, paragraf{" "}
              <Tok>text-pretty</Tok>. Paragraf body paling lebar <Tok>max-w-xl</Tok>, body-sm <Tok>max-w-lg</Tok>.
            </>
          }>
          <div className="@container flex flex-col gap-6 rounded-lg border border-border bg-card p-4 md:p-6">
            <ul className="flex flex-col divide-y divide-border">
              {TYPE_SCALE.map((t) => (
                <li key={t.token} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 @2xl:flex-row @2xl:items-baseline @2xl:gap-6">
                  <span className="flex w-48 shrink-0 flex-col text-xs font-medium text-muted-foreground">
                    <code className="font-mono text-foreground">{t.token}</code>
                    <span className="tabular-nums">
                      {t.size}, {t.weight}
                    </span>
                  </span>
                  <span className={t.cls}>{t.sample}</span>
                </li>
              ))}
              <li className="flex flex-col gap-1 pt-3 @2xl:flex-row @2xl:items-baseline @2xl:gap-6">
                <span className="flex w-48 shrink-0 flex-col text-xs font-medium text-muted-foreground">
                  <code className="font-mono text-foreground">code-xl</code>
                  <span className="tabular-nums">32/40 px, 700, jarak 0,2em</span>
                </span>
                <span translate="no" className="text-code-xl font-bold tracking-code tabular-nums">482913</span>
              </li>
            </ul>
            <div className="grid gap-4 border-t border-border pt-4 @3xl:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Caption>body, max-w-xl (sekitar 72 karakter)</Caption>
                <p className="max-w-xl text-base">
                  Penanggung jawab akan datang sesuai jadwal. Kalau ada perubahan, kamu mendapat pemberitahuan di halaman pesanan dan
                  lewat email. Dana ditahan sampai pekerjaan selesai.
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <Caption>body-sm, max-w-lg</Caption>
                <p className="max-w-lg text-sm text-muted-foreground">
                  Kode verifikasi hanya berlaku 30 menit dan dibuka di aplikasimu. Berikan kode ke penanggung jawab setelah pekerjaan
                  selesai dan kamu sudah memeriksanya.
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Section id="formulir" n={9} title="Formulir" desc={
            <>
              Atribut field sesuai DS 6.1b. Input dan Select 16 px dan 44 px. Error <Tok>body-sm</Tok> 500 dengan ikon 16 px. Tekan
              Simpan: fokus pindah ke field error pertama (D248).
            </>
          }>
          <FormDemo />
        </Section>

        <Section id="banner" n={10} title="Banner status" desc="Satu bentuk untuk empat nada (1.4b). Banner status pesanan tidak punya tombol tutup. Banner PAID memuat EscrowNote.">
          <div className="grid gap-3">
            <StatusBanner tone="success" title="Pesanan selesai">
              Terima kasih. Beri ulasan supaya pelanggan lain terbantu.
            </StatusBanner>
            <StatusBanner tone="warning" title="Menunggu pembayaran">
              Bayar sebelum Sab, 22 Nov 2026, 10.30 WITA supaya pesanan tidak batal.
            </StatusBanner>
            <StatusBanner tone="info" title="Sudah dibayar">
              <p>Komang Arta datang Sen, 24 Nov 2026, 09.00 WITA.</p>
              <EscrowNote className="pt-1" />
            </StatusBanner>
            <StatusBanner tone="info" title="Penanggung jawab sedang menuju lokasimu">
              Komang Arta diperkirakan tiba sekitar 14.20 WITA.
            </StatusBanner>
            <StatusBanner tone="destructive" title="Pesanan dalam komplain">
              Admin sedang meninjau komplainmu. Dana ditahan sampai ada putusan.
            </StatusBanner>
          </div>
        </Section>

        <Section id="escrow" n={11} title="EscrowNote" desc="Satu kalimat bernada netral, tanpa kotak berwarna (D250). Dipakai di form pesan, halaman bayar, dan banner PAID.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
              <Caption>Halaman bayar</Caption>
              <dl className="flex items-baseline justify-between gap-4">
                <dt className="text-sm text-muted-foreground">Total</dt>
                <dd className="text-h3 font-semibold tabular-nums">{formatRupiah(135000)}</dd>
              </dl>
              <Button size="lg" className="w-full">
                Bayar sekarang
              </Button>
              <EscrowNote />
            </div>
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
              <Caption>Form pesan, di atas tombol kirim</Caption>
              <dl className="flex items-baseline justify-between gap-4">
                <dt className="text-sm text-muted-foreground">Perkiraan total</dt>
                <dd className="text-h3 font-semibold tabular-nums">{formatRupiah(110000)}</dd>
              </dl>
              <EscrowNote />
              <Button size="lg" className="w-full">
                Pesan jasa
              </Button>
            </div>
          </div>
        </Section>

        <Section id="penanda" n={12} title="Penanda aktif dan terpilih" desc="Tiga intensitas hijau terang (6.4). Solid hanya untuk aksi mode Sekarang. Penanda posisi pucat (D243).">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <Sub>Filter aktif (D253)</Sub>
              <Caption>Chip removable di atas hasil /cari. Seluruh chip satu tombol; kata kunci tidak ikut.</Caption>
              <ActiveFiltersDemo />
            </div>
            <div className="flex flex-col gap-3">
              <Sub>Solid</Sub>
              <div className="flex flex-wrap items-center gap-6">
                <Button variant="now" size="lg" tabIndex={-1}>
                  Ambil
                </Button>
                <span className="flex items-center gap-3">
                  <Switch defaultChecked aria-label="Switch menyala" />
                  <span className="text-sm font-medium">Switch menyala, --brand-hover (D244)</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Sub>Pucat</Sub>
              <div className="flex flex-wrap items-start gap-6">
                <div className="flex flex-col gap-2">
                  <SidebarSnippet />
                  <Caption>Pesanan aktif, Ringkasan hover, Jasa Saya fokus</Caption>
                </div>
                <div className="flex w-full max-w-97.5 flex-col gap-2">
                  <div className="overflow-hidden rounded-lg border border-border">
                    <BottomNav />
                  </div>
                  <Caption>Navigasi bawah, Beranda aktif</Caption>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Suspense fallback={<div className="h-11 w-full max-w-xl rounded-lg bg-muted" />}>
                  <TabsDemo />
                </Suspense>
                <Caption>Tab aktif pucat, tinggi 44 px, tersimpan di query URL</Caption>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <FilterChip label="Bisa datang sekarang" active />
                <FilterChip label="Rating 4 ke atas" active={false} />
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
                <div className="flex min-h-11 items-center justify-between gap-3 rounded-md border-2 border-brand bg-brand-subtle px-4 py-3 text-sm font-semibold text-brand-subtle-foreground">
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
            </div>

            <div className="flex flex-col gap-3">
              <Sub>Garis</Sub>
              <div className="flex flex-wrap items-center gap-6">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <LiveDot />
                  Titik live
                </span>
                <ModeBadge mode="AVAILABLE_NOW" />
                <span className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-brand-subtle text-brand-subtle-foreground">
                    <Check aria-hidden className="size-4" />
                  </span>
                  <span className="h-0.5 w-10 bg-brand" aria-hidden />
                  <span className="flex size-8 items-center justify-center rounded-full border-2 border-brand bg-card text-sm font-bold">2</span>
                  <span className="h-0.5 w-10 bg-border" aria-hidden />
                  <span className="flex size-8 items-center justify-center rounded-full border border-input bg-card text-sm font-medium text-muted-foreground">3</span>
                  <span className="sr-only">Langkah 2 aktif dari 3</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="flex size-11 items-center justify-center rounded-md border-2 border-brand bg-card text-lg font-bold ring-3 ring-brand-subtle tabular-nums">4</span>
                  <span className="sr-only">Kotak kode yang sedang diisi</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Sub>Tautan</Sub>
              <p className="text-sm">
                Belum punya akun? <a href="#penanda" className={LINK_CLASS}>Daftar sekarang</a>
              </p>
              <div className="@container max-w-4xl overflow-hidden rounded-lg border border-border">
                <PublicHeader />
              </div>
              <Caption>Tautan aktif header publik: --brand-strong tebal bergaris bawah, pengecualian dari penanda pucat</Caption>
            </div>
          </div>
        </Section>

        <Section id="token" n={13} title="Token dan kontras" desc="Rasio dihitung di halaman ini dengan rumus WCAG 2.1 dari nilai token, dibulatkan dua desimal, lalu dibandingkan dengan angka di DS 1.5.">
          <div className="@container flex flex-col gap-8">
            <TokenSwatches />
            <ContrastTable />
          </div>
        </Section>

        <Section id="responsif" n={14} title="Mobile 390 px dan desktop" desc="Komponen memakai container query, jadi bingkai 390 px menampilkan tata letak HP walaupun dibuka di layar lebar.">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <Caption>Bingkai 390 px (pelanggan di HP)</Caption>
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
              <Caption>Bingkai lebar (desktop, selebar konten)</Caption>
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
      </main>
    </div>
  )
}
