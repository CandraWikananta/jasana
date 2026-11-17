import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight, MapPin, PackageOpen, Star, Store } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { getProvider } from "@/features/providers/api"
import { isNotFound } from "@/lib/api-client"
import { PROVIDER_TYPE_LABEL } from "@/lib/enum-labels"
import { formatRating } from "@/lib/format"
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
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-6 md:px-6">
      <header className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary-subtle-foreground">
            <Store aria-hidden className="size-7" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-2xl font-bold break-words">{provider.display_name}</h1>
            <p className="text-sm text-muted-foreground">
              {PROVIDER_TYPE_LABEL[provider.provider_type]}
              {provider.verified_at && ` · Terverifikasi sejak ${formatTanggal(provider.verified_at)}`}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label="Rating">
            {provider.rating_count > 0 ? (
              <span className="flex items-center gap-1">
                <Star aria-hidden className="size-4 fill-foreground" />
                {formatRating(provider.rating_average)}
                <span className="text-sm font-normal text-muted-foreground">({provider.rating_count})</span>
              </span>
            ) : (
              <span className="text-base font-normal text-muted-foreground">Belum ada</span>
            )}
          </Stat>
          <Stat label="Pesanan selesai">{provider.completed_orders_count}</Stat>
          {provider.service_radius_km !== null && (
            <Stat label="Jangkauan">
              <span className="flex items-center gap-1">
                <MapPin aria-hidden className="size-4" />
                {provider.service_radius_km} km
              </span>
            </Stat>
          )}
        </dl>

        {provider.bio && <p className="max-w-prose text-base whitespace-pre-line">{provider.bio}</p>}

        {provider.accepts_worker_applications && (
          <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Usaha ini sedang menerima pekerja baru.</p>
            {/* Alur lamaran butuh login; halamannya menyusul di fase pekerja. */}
            <Button asChild variant="outline">
              <Link href={`/masuk?next=${encodeURIComponent(`/penyedia/${provider.id}`)}`}>Lamar jadi pekerja di sini</Link>
            </Button>
          </div>
        )}
      </header>

      <section aria-labelledby="judul-jasa" className="flex flex-col gap-3">
        <h2 id="judul-jasa" className="text-xl font-semibold">
          Jasa dari {provider.display_name}
        </h2>
        {provider.listings.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="Belum ada jasa yang tayang"
            description="Jasa dari penyedia ini akan tampil di sini."
            className="rounded-lg border border-border bg-card"
          />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {provider.listings.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/listing/${l.id}`}
                  className="flex min-h-14 items-center justify-between gap-4 px-4 py-3 font-semibold outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  {l.title}
                  <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums">{children}</dd>
    </div>
  )
}
