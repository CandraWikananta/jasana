import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Clock, ImageOff, MessageSquareText, Star, Store } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { ModeBadge } from "@/components/shared/mode-badge"
import { MoneyText } from "@/components/shared/money-text"
import { RatingStars } from "@/components/shared/rating-stars"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { listAttributes } from "@/features/catalog/api"
import { getListing } from "@/features/listings/api"
import { isNotFound } from "@/lib/api-client"
import { PRICE_UNIT_SUFFIX, PROVIDER_TYPE_LABEL } from "@/lib/enum-labels"
import { formatDelta, formatDurasi, formatNilaiAtribut, formatRating } from "@/lib/format"
import { formatTanggal } from "@/lib/time"
import type { ListingDetail, OptionPrice } from "@/types/api/listing"

// FE2: Server Component. loading.tsx memberi Suspense untuk params dan fetch, jadi notFound()
// terjadi setelah streaming mulai: statusnya 200 + noindex, bukan 404 (diterima, dicatat di laporan W2).

async function loadListing(id: string): Promise<ListingDetail> {
  try {
    return (await getListing(id)).data
  } catch (err) {
    if (isNotFound(err)) notFound()
    throw err
  }
}

export async function generateMetadata({ params }: PageProps<"/listing/[id]">): Promise<Metadata> {
  const { id } = await params
  try {
    const { data } = await getListing(id)
    return { title: data.title, description: data.description?.slice(0, 160) ?? undefined }
  } catch (err) {
    // Error selain 404 ditangani halaman (error.tsx); metadata cukup jatuh ke bawaan.
    return isNotFound(err) ? { title: "Jasa tidak ditemukan" } : {}
  }
}

export default async function ListingPage({ params }: PageProps<"/listing/[id]">) {
  const { id } = await params
  const listing = await loadListing(id)
  const specs = await loadSpecs(listing)
  const pesanHref = `/masuk?next=${encodeURIComponent(`/pesan/${listing.id}`)}`
  const unit = PRICE_UNIT_SUFFIX[listing.price_unit]

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-28 md:px-6 lg:pb-16">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-2">
          <Gallery listing={listing} />

          <header className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">{listing.subcategory.name}</p>
            <h1 className="text-2xl font-bold">{listing.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {listing.rating_count > 0 ? (
                <span className="flex items-center gap-1">
                  <Star aria-hidden className="size-4 fill-foreground" />
                  <span className="font-semibold tabular-nums">{formatRating(listing.rating_average)}</span>
                  <span className="text-muted-foreground tabular-nums">({listing.rating_count} ulasan)</span>
                </span>
              ) : (
                <span className="text-muted-foreground">Belum ada ulasan</span>
              )}
              {listing.order_count > 0 && (
                <span className="text-muted-foreground tabular-nums">{listing.order_count} kali dipesan</span>
              )}
              {listing.estimated_duration_minutes !== null && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock aria-hidden className="size-4" />
                  Perkiraan {formatDurasi(listing.estimated_duration_minutes)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {listing.supports_available_now && <ModeBadge mode="AVAILABLE_NOW" />}
              {listing.supports_scheduled && <ModeBadge mode="SCHEDULED" />}
            </div>
          </header>

          <ProviderCard provider={listing.provider} />

          {listing.description && (
            <Section title="Deskripsi">
              {/* Konten pengguna dirender sebagai teks (CLAUDE.md jebakan 14). */}
              <p className="max-w-xl text-base whitespace-pre-line">{listing.description}</p>
            </Section>
          )}

          {specs.length > 0 && (
            <Section title="Spesifikasi">
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {specs.map((s) => (
                  <div key={s.label} className="flex flex-col gap-0.5">
                    <dt className="text-sm text-muted-foreground">{s.label}</dt>
                    <dd className="text-base font-medium">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          {listing.option_prices.length > 0 && (
            <Section title="Pilihan dan harga" description="Tambahan dari harga mulai. Pilihannya ditentukan saat memesan.">
              <div className="flex flex-col gap-4">
                {groupOptions(listing.option_prices).map((group) => (
                  <div key={group.key} className="rounded-lg border border-border bg-card">
                    <h3 className="border-b border-border px-4 py-3 text-base font-semibold">{group.label}</h3>
                    <ul className="divide-y divide-border">
                      {group.rows.map((o) => (
                        <li key={o.option_value ?? "per-unit"} className="flex items-start justify-between gap-4 px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-base">{o.option_value ?? `Per ${o.unit ?? "unit"}`}</span>
                            {o.duration_minutes !== null && (
                              <span className="text-sm text-muted-foreground">
                                Lama pengerjaan {formatDurasi(o.duration_minutes)}
                              </span>
                            )}
                          </div>
                          <span className="shrink-0 text-base font-semibold tabular-nums">{formatOptionDelta(o)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {listing.faqs.length > 0 && (
            <Section title="Pertanyaan umum">
              <Accordion type="single" collapsible className="rounded-lg border border-border bg-card px-4">
                {listing.faqs.map((f) => (
                  <AccordionItem key={f.id} value={f.id}>
                    <AccordionTrigger>{f.question}</AccordionTrigger>
                    <AccordionContent className="text-base whitespace-pre-line text-muted-foreground">
                      {f.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Section>
          )}

          <Section title="Ulasan">
            {listing.reviews.length === 0 ? (
              <EmptyState
                icon={MessageSquareText}
                title="Belum ada ulasan"
                description="Ulasan muncul setelah pelanggan menyelesaikan pesanan."
                className="rounded-lg border border-border bg-card"
              />
            ) : (
              <div className="flex flex-col gap-3">
                <ul className="flex flex-col gap-3">
                  {listing.reviews.map((r) => (
                    <li key={r.id} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold">{r.reviewer_name}</span>
                        <span className="text-sm text-muted-foreground">{formatTanggal(r.created_at)}</span>
                      </div>
                      <RatingStars rating={r.rating} />
                      {r.comment && <p className="text-base whitespace-pre-line">{r.comment}</p>}
                      {r.provider_reply && (
                        <div className="flex flex-col gap-1 rounded-md bg-muted p-3">
                          <span className="text-sm font-semibold">Balasan penyedia</span>
                          <p className="text-sm whitespace-pre-line">{r.provider_reply}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                {listing.rating_count > listing.reviews.length && (
                  <p className="text-sm text-muted-foreground">
                    Menampilkan {listing.reviews.length} ulasan terbaru dari {listing.rating_count}.
                  </p>
                )}
              </div>
            )}
          </Section>
        </div>

        {/* Desktop: kartu harga menempel di kolom kanan. HP: bar bawah. Satu tombol primary per lebar layar. */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
            <PriceLine price={listing.price} unit={unit} />
            <Button asChild size="lg" className="w-full">
              <Link href={pesanHref}>Pesan</Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Total dihitung dari pilihanmu saat memesan. Bayar setelah penyedia menerima pesanan.
            </p>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card shadow-sm lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <PriceLine price={listing.price} unit={unit} />
          <Button asChild size="lg" className="min-w-32">
            <Link href={pesanHref}>Pesan</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Label atribut SPEC dari definisi sub-kategori; detail listing hanya membawa key dan nilai. */
async function loadSpecs(listing: ListingDetail): Promise<{ label: string; value: string }[]> {
  // Gagal memuat definisi tidak menggagalkan halaman: bagian Spesifikasi saja yang tidak tampil.
  const defs = await listAttributes(listing.subcategory.id).then((r) => r.data, () => [])
  return defs
    .filter((a) => a.attribute_role === "SPEC" && a.is_active)
    .sort((a, b) => a.display_order - b.display_order)
    .flatMap((a) => {
      const value = formatNilaiAtribut(listing.attributes[a.attribute_key], a.unit)
      return value === null ? [] : [{ label: a.label, value }]
    })
}

function groupOptions(options: OptionPrice[]) {
  const groups = new Map<string, { key: string; label: string; rows: OptionPrice[] }>()
  for (const o of options) {
    const g = groups.get(o.attribute_key) ?? { key: o.attribute_key, label: o.label, rows: [] }
    g.rows.push(o)
    groups.set(o.attribute_key, g)
  }
  return [...groups.values()]
}

/** DS 8: `+Rp75.000 / unit` untuk PER_UNIT, delta nol tetap `Termasuk`. */
function formatOptionDelta(o: OptionPrice): string {
  const delta = formatDelta(o.price_delta)
  return o.pricing_mode === "PER_UNIT" && o.price_delta !== 0 ? `${delta} / ${o.unit ?? "unit"}` : delta
}

function PriceLine({ price, unit }: { price: number; unit: string }) {
  return (
    <p className="flex flex-col">
      <span className="text-sm text-muted-foreground">Mulai</span>
      <span>
        <MoneyText amount={price} className="text-xl font-bold" />
        {unit && <span className="text-sm text-muted-foreground"> {unit}</span>}
      </span>
    </p>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function ProviderCard({ provider }: { provider: ListingDetail["provider"] }) {
  // Detail listing belum membawa display_name, jadi INDIVIDUAL tanpa nama usaha tidak punya nama (celah backend, laporan W2).
  const name = provider.business_name ?? "Penyedia perorangan"
  return (
    <Link
      href={`/penyedia/${provider.id}`}
      className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-brand-subtle-foreground">
        <Store aria-hidden className="size-6" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-semibold">{name}</span>
        <span className="text-sm text-muted-foreground">
          {PROVIDER_TYPE_LABEL[provider.provider_type]}
          {provider.rating_count > 0 && (
            <>
              {" · "}
              <span className="tabular-nums">
                {formatRating(provider.rating_average)} ({provider.rating_count} ulasan)
              </span>
            </>
          )}
        </span>
      </span>
    </Link>
  )
}

function Gallery({ listing }: { listing: ListingDetail }) {
  const photos = [...listing.photos].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.display_order - b.display_order,
  )
  const [main, ...rest] = photos
  if (!main) {
    return (
      <div className="flex aspect-4/3 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <ImageOff aria-hidden className="size-8" />
        <span className="sr-only">Belum ada foto</span>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-muted">
        <Image
          src={main.file_url}
          alt={main.caption ?? listing.title}
          fill
          // `priority` usang sejak Next 16; foto utama adalah LCP halaman ini (PRD 9.1).
          loading="eager"
          fetchPriority="high"
          sizes="(min-width: 1152px) 752px, (min-width: 1024px) 66vw, 100vw"
          className="object-cover"
        />
      </div>
      {rest.length > 0 && (
        <ul className="grid grid-cols-4 gap-2">
          {rest.slice(0, 4).map((p) => (
            <li key={p.id} className="relative aspect-4/3 overflow-hidden rounded-md bg-muted">
              <Image src={p.file_url} alt={p.caption ?? ""} fill sizes="(min-width: 1024px) 180px, 25vw" className="object-cover" />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
