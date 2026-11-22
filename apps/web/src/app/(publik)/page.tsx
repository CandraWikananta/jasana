import { Suspense, cache } from "react"
import Link from "next/link"
import { MessagesSquare, PackageOpen, Search } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { chipIconClass, filterChipClass } from "@/components/shared/filter-chip"
import { LINK_CLASS } from "@/components/shared/link-class"
import { ListingCard, ListingCardSkeleton } from "@/components/shared/listing-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { listCategories } from "@/features/catalog/api"
import { heroTitle } from "@/features/catalog/hero-title"
import { searchListings } from "@/features/listings/api"
import { getCategoryIcon } from "@/lib/category-icons"
import { cn } from "@/lib/utils"

// Titik masuk Asisten (W8). Tautan di hero dan panel di bawah menuju tempat yang sama.
const ASISTEN_HREF = "/asisten"

// Judul dan chip memakai daftar kategori yang sama; cache() membuat satu render cukup satu fetch.
// Kegagalan tidak menjatuhkan hero: judul jatuh ke cadangan dan chip disembunyikan.
const getCategories = cache(async () => {
  try {
    return (await listCategories()).data
  } catch {
    return []
  }
})

// FE2: Server Component. Data diambil tanpa `use cache` di dalam Suspense, jadi selalu segar dan
// `next build` tidak butuh API hidup. Kegagalan jasa populer ditangkap (publik)/error.tsx.
export default function BerandaPage() {
  return (
    <div className="flex flex-col gap-12 pb-16">
      <section aria-labelledby="judul-beranda" className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:px-6 md:py-16">
          <div className="flex flex-col gap-3">
            <Suspense fallback={<HeroTitleSkeleton />}>
              <HeroTitle />
            </Suspense>
            <p className="max-w-xl text-base text-muted-foreground">
              Pesan untuk jadwal tertentu, atau panggil pekerja yang bisa datang sekarang.
            </p>
          </div>

          <div className="flex max-w-2xl flex-col gap-3">
            <form role="search" action="/cari" method="get" className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="cari-beranda" className="sr-only">
                Cari jasa
              </label>
              <Input
                id="cari-beranda"
                name="q"
                type="search"
                autoComplete="off"
                placeholder="Servis motor, rias pengantin, foto produk…"
                className="sm:flex-1"
              />
              <Button type="submit">
                <Search aria-hidden />
                Cari jasa
              </Button>
            </form>
            <p className="text-sm text-muted-foreground">
              Belum tahu butuh jasa apa?{" "}
              <Link href={ASISTEN_HREF} className={LINK_CLASS}>
                Tanya Asisten Jasana
              </Link>
            </p>
          </div>

          <Suspense fallback={<CategoryChipsSkeleton />}>
            <CategoryChips />
          </Suspense>
        </div>
      </section>

      <section aria-labelledby="judul-populer" className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 md:px-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="judul-populer" className="text-h2 font-semibold">
            Jasa populer
          </h2>
          <Link href="/cari?sort=popular" className={cn(LINK_CLASS, "hidden text-sm sm:inline")}>
            Lihat semua
          </Link>
        </div>
        <Suspense fallback={<ListingGridSkeleton />}>
          <PopularListings />
        </Suspense>
      </section>

      <section aria-labelledby="judul-asisten" className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <MessagesSquare aria-hidden className="size-6" />
            </span>
            <div className="flex flex-col gap-1">
              <h2 id="judul-asisten" className="text-h3 font-semibold">
                Bingung pilih jasa?
              </h2>
              <p className="max-w-lg text-sm text-muted-foreground">
                Ceritakan kebutuhanmu ke Asisten Jasana, nanti dibantu mencarikan jasa yang cocok.
              </p>
              <p className="text-sm text-foreground">Contoh: “Motor mogok di Sanur, bisa datang sore ini?”</p>
            </div>
          </div>
          {/* Halaman dan widget Asisten dibangun di W8. */}
          <Button asChild variant="outline" className="md:shrink-0">
            <Link href={ASISTEN_HREF}>Tanya Asisten</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

async function HeroTitle() {
  const categories = await getCategories()
  return (
    <h1 id="judul-beranda" className="max-w-3xl text-display font-bold md:text-display-lg">
      {heroTitle(categories.map((c) => c.name))}
    </h1>
  )
}

function HeroTitleSkeleton() {
  return (
    <div className="flex max-w-3xl flex-col gap-2">
      <Skeleton className="h-9 w-full md:h-12" />
      <Skeleton className="h-9 w-2/3 md:h-12" />
    </div>
  )
}

async function CategoryChips() {
  const categories = await getCategories()
  if (categories.length === 0) return null
  return (
    <div className="flex flex-col gap-3">
      <p id="label-kategori" className="text-sm font-semibold">
        Kategori
      </p>
      <ul aria-labelledby="label-kategori" className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const Icon = getCategoryIcon(c.icon_name)
          return (
            <li key={c.id}>
              {/* /kategori/[id] belum dibuat, jadi chip langsung membuka pencarian berfilter. */}
              <Link href={`/cari?category_id=${c.id}`} className={filterChipClass(false)}>
                <Icon aria-hidden className={chipIconClass(false)} />
                {c.name}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function CategoryChipsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-5 w-20" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-11 w-32 rounded-md" />
        ))}
      </div>
    </div>
  )
}

async function PopularListings() {
  const { data: listings } = await searchListings({ sort: "popular", limit: 8 })
  if (listings.length === 0) {
    return (
      <EmptyState icon={PackageOpen} title="Belum ada jasa" description="Jasa yang sudah tayang akan tampil di sini." />
    )
  }
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {listings.map((l, i) => (
          // Di HP cukup empat kartu, sisanya lewat "Lihat semua" (konten inti dulu).
          <div key={l.id} className={cn("grid", i >= 4 && "hidden sm:grid")}>
            <ListingCard listing={l} eager={i < 4} />
          </div>
        ))}
      </div>
      <Button asChild variant="outline" className="w-full sm:hidden">
        <Link href="/cari?sort=popular">Lihat semua jasa populer</Link>
      </Button>
    </>
  )
}

function ListingGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  )
}
