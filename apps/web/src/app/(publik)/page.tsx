import { Suspense } from "react"
import Link from "next/link"
import { ArrowRight, MessagesSquare, PackageOpen, Search, Shapes } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { ListingCard, ListingCardSkeleton } from "@/components/shared/listing-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { listCategories } from "@/features/catalog/api"
import { searchListings } from "@/features/listings/api"
import { getCategoryIcon } from "@/lib/category-icons"

// FE2: Server Component. Data diambil tanpa `use cache` di dalam Suspense, jadi selalu segar dan
// `next build` tidak butuh API hidup. Kegagalan fetch ditangkap (publik)/error.tsx.
export default function BerandaPage() {
  return (
    <div className="flex flex-col gap-12 pb-16">
      <section className="border-b border-border bg-brand-subtle">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 md:px-6 md:py-16">
          <div className="flex max-w-2xl flex-col gap-2">
            <h1 className="text-3xl font-bold text-brand-subtle-foreground">Cari jasa di sekitarmu</h1>
            <p className="text-base text-muted-foreground">
              Pesan jasa terjadwal, atau minta pekerja datang sekarang.
            </p>
          </div>
          <form role="search" action="/cari" method="get" className="flex w-full max-w-2xl gap-2">
            <label htmlFor="cari-beranda" className="sr-only">
              Cari jasa
            </label>
            <div className="relative flex-1">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="cari-beranda"
                name="q"
                type="search"
                placeholder="Servis AC, potong rambut, foto wisuda"
                className="h-12 pl-10"
              />
            </div>
            <Button type="submit" size="lg">
              Cari
            </Button>
          </form>
        </div>
      </section>

      <section aria-labelledby="judul-kategori" className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 md:px-6">
        <h2 id="judul-kategori" className="text-xl font-semibold">
          Kategori
        </h2>
        <Suspense fallback={<CategoryGridSkeleton />}>
          <CategoryGrid />
        </Suspense>
      </section>

      <section aria-labelledby="judul-populer" className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 md:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 id="judul-populer" className="text-xl font-semibold">
            Jasa populer
          </h2>
          <Link
            href="/cari?sort=popular"
            className="flex items-center gap-1 rounded-sm text-sm font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Lihat semua
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
        <Suspense fallback={<ListingGridSkeleton />}>
          <PopularListings />
        </Suspense>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-brand-subtle-foreground">
              <MessagesSquare aria-hidden className="size-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Bingung pilih jasa?</h2>
              <p className="text-sm text-muted-foreground">
                Ceritakan kebutuhanmu ke Asisten Jasana, nanti dibantu mencarikan jasa yang cocok.
              </p>
            </div>
          </div>
          {/* Tautan saja; halaman dan widget Asisten dibangun di W8. */}
          <Button asChild variant="outline" className="md:shrink-0">
            <Link href="/asisten">Tanya Asisten</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

async function CategoryGrid() {
  const { data: categories } = await listCategories()
  if (categories.length === 0) {
    return <EmptyState icon={Shapes} title="Belum ada kategori" description="Kategori jasa akan tampil di sini." />
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {categories.map((c) => {
        const Icon = getCategoryIcon(c.icon_name)
        return (
          <li key={c.id}>
            {/* /kategori/[id] belum dibuat, jadi ubin langsung membuka pencarian berfilter. */}
            <Link
              href={`/cari?category_id=${c.id}`}
              className="flex h-full items-center gap-3 rounded-lg border border-border bg-card p-4 font-semibold outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-brand-subtle-foreground">
                <Icon aria-hidden className="size-5" />
              </span>
              <span className="min-w-0 truncate">{c.name}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-18 rounded-lg" />
      ))}
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {listings.map((l, i) => (
        <ListingCard key={l.id} listing={l} eager={i < 4} />
      ))}
    </div>
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
