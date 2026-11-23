import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight, MapPin, PackageOpen, Store } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { PageSection } from "@/components/shared/page-section"
import { RatingSummary } from "@/components/shared/rating-stars"
import { Button } from "@/components/ui/button"
import { getProvider } from "@/features/providers/api"
import { isNotFound } from "@/lib/api-client"
import { PROVIDER_TYPE_LABEL } from "@/lib/enum-labels"
import { formatTanggal } from "@/lib/time"
import type { PublicProvider } from "@/types/api/provider"

// FE2: Server Component, pola sama dengan /listing/[id] (loading.tsx, not-found.tsx, soft-404).
// Tanpa alamat, koordinat basis, atau kontak usaha (D78).

async function loadProvider(id: string): Promise<PublicProvider> {
  try {
    return (await getProvider(id)).data
  } catch (err) {
    if (isNotFound(err)) notFound()
    throw err
  }
}

export async function generateMetadata({ params }: PageProps<"/penyedia/[id]">): Promise<Metadata> {
  const { id } = await params
  try {
    const { data } = await getProvider(id)
    return { title: data.display_name, description: data.bio?.slice(0, 160) ?? undefined }
  } catch (err) {
    return isNotFound(err) ? { title: "Penyedia tidak ditemukan" } : {}
  }
}

export default async function PenyediaPage({ params }: PageProps<"/penyedia/[id]">) {
  const { id } = await params
  const provider = await loadProvider(id)

  return (
    // Tepi kiri dan lebar kolom sama dengan kolom utama /listing/[id], supaya kedua halaman satu keluarga.
    // min-h-dvh sama dengan skeleton: profil sering lebih pendek dari layar, tanpanya footer naik saat isi datang (CLS).
    <div className="mx-auto min-h-dvh max-w-6xl px-4 pt-6 pb-16 md:px-6">
      <div className="flex flex-col gap-8 lg:w-2/3">
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-brand-subtle-foreground">
              <Store aria-hidden className="size-7" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="text-h1 font-bold text-balance break-words">{provider.display_name}</h1>
              <p className="text-sm text-muted-foreground">
                {PROVIDER_TYPE_LABEL[provider.provider_type]}
                {provider.verified_at && ` · Terverifikasi sejak ${formatTanggal(provider.verified_at)}`}
              </p>
            </div>
          </div>
          {/* Satu baris meta seperti header /listing/[id], bukan statistik angka besar. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <RatingSummary average={provider.rating_average} count={provider.rating_count} />
            {/* Nol disembunyikan, sama dengan "kali dipesan" di /listing/[id]. */}
            {provider.completed_orders_count > 0 && (
              <span className="text-muted-foreground tabular-nums">{provider.completed_orders_count} pesanan selesai</span>
            )}
            {provider.service_radius_km !== null && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin aria-hidden className="size-4" />
                Jangkauan {provider.service_radius_km} km
              </span>
            )}
          </div>
        </header>

        {provider.bio && (
          <PageSection title="Tentang penyedia">
            {/* Konten pengguna dirender sebagai teks (CLAUDE.md jebakan 14). */}
            <p className="max-w-xl text-base break-words whitespace-pre-line">{provider.bio}</p>
          </PageSection>
        )}

        <PageSection title="Jasa">
          {provider.listings.length === 0 ? (
            <EmptyState
              icon={PackageOpen}
              title="Belum ada jasa yang tayang"
              description="Jasa dari penyedia ini akan tampil di sini."
              className="rounded-lg border border-border bg-card"
              action={
                <Button asChild variant="outline">
                  <Link href="/cari">Cari jasa lain</Link>
                </Button>
              }
            />
          ) : (
            // GET /providers/:id hanya membawa id dan judul, jadi belum bisa memakai ListingCard (celah backend).
            <ul className="divide-y divide-border rounded-lg border border-border bg-card">
              {provider.listings.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/listing/${l.id}`}
                    className="flex min-h-14 items-center justify-between gap-4 px-4 py-3 font-semibold break-words outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <span className="min-w-0">{l.title}</span>
                    <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </PageSection>

        {/* Untuk calon pekerja, bukan pelanggan: panel tenang di akhir halaman. */}
        {provider.accepts_worker_applications && (
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Usaha ini sedang menerima pekerja baru.</p>
            {/* Alur lamaran butuh login; halamannya menyusul di fase pekerja. */}
            <Button asChild variant="outline">
              <Link href={`/masuk?next=${encodeURIComponent(`/penyedia/${provider.id}`)}`}>Lamar jadi pekerja di sini</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
