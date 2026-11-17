"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, LocateFixed, MapPin, SearchX, SlidersHorizontal, X, type LucideIcon } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { ListingCard, ListingCardSkeleton } from "@/components/shared/listing-card"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useCategories } from "@/features/catalog/queries"
import { ApiError } from "@/lib/api-client"
import { getCategoryIcon } from "@/lib/category-icons"
import { getErrorMessage } from "@/lib/error-messages"
import { SORT_LABEL } from "@/lib/enum-labels"
import { BOOKING_MODE_META } from "@/lib/order-status"
import { cn } from "@/lib/utils"
import type { SearchListingsParams, SearchSort } from "@/types/api/listing"
import { useListingSearch } from "../queries"
import { parseSearchParams, SEARCH_PAGE_SIZE } from "../search-params"

type Patch = Record<string, string | null>
type GeoState = "idle" | "locating" | "failed"

// PRD 5.1: seluruh state filter di query URL, supaya bisa dibagikan dan tombol kembali bekerja.
export function SearchPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = parseSearchParams(searchParams)
  const search = useListingSearch(params)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [geo, setGeo] = useState<GeoState>("idle")

  function update(patch: Patch) {
    const next = new URLSearchParams(searchParams)
    // Filter berubah berarti daftar berubah, jadi kembali ke halaman pertama kecuali yang diubah halamannya.
    if (!("page" in patch)) next.delete("page")
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) next.delete(key)
      else next.set(key, value)
    }
    const qs = next.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: "page" in patch })
  }

  function locate() {
    if (!("geolocation" in navigator)) return setGeo("failed")
    setGeo("locating")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo("idle")
        // sort dikosongkan: dengan lokasi, urutan bawaan server adalah jarak.
        update({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6), sort: null })
      },
      // Ditolak, timeout, atau tidak tersedia: pencarian jalan terus tanpa jarak.
      () => setGeo("failed"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    )
  }

  const total = search.data?.meta?.total ?? 0
  const page = params.page ?? 1
  const pageCount = Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE))
  const activeCount = [params.category_id, params.booking_mode, params.available_now, params.lat, params.sort].filter(
    (v) => v !== undefined,
  ).length

  const panel = <FilterPanel params={params} geo={geo} onLocate={locate} onChange={update} />

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <div className="grid gap-8 lg:grid-cols-4">
        <aside aria-label="Filter" className="hidden lg:block">
          <div className="sticky top-24">{panel}</div>
        </aside>

        <section aria-labelledby="judul-hasil" className="flex min-w-0 flex-col gap-4 lg:col-span-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <h1 id="judul-hasil" className="text-2xl font-bold break-words">
                {params.q ? `Hasil untuk "${params.q}"` : "Cari jasa"}
              </h1>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {search.isPending ? "Mencari jasa..." : search.isSuccess ? `${total} jasa` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              {params.q && (
                <Button variant="ghost" size="sm" onClick={() => update({ q: null })}>
                  <X aria-hidden />
                  Hapus kata kunci
                </Button>
              )}
              <Button variant="outline" className="lg:hidden" onClick={() => setSheetOpen(true)}>
                <SlidersHorizontal aria-hidden />
                Filter{activeCount > 0 && ` (${activeCount})`}
              </Button>
            </div>
          </div>

          {search.isPending ? (
            <ResultGrid>
              {Array.from({ length: 6 }, (_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </ResultGrid>
          ) : search.isError ? (
            <ErrorState
              message={search.error instanceof ApiError ? search.error.message : getErrorMessage(null)}
              onRetry={() => search.refetch()}
            />
          ) : search.data.data.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Tidak ada jasa yang cocok"
              description="Coba longgarkan filter, atau ceritakan kebutuhanmu ke Asisten Jasana."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" onClick={() => router.push(pathname)}>
                    Hapus semua filter
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href="/asisten">Tanya Asisten</Link>
                  </Button>
                </div>
              }
            />
          ) : (
            <>
              <ResultGrid>
                {search.data.data.map((l, i) => (
                  <ListingCard key={l.id} listing={l} eager={i < 3} />
                ))}
              </ResultGrid>
              {pageCount > 1 && (
                <nav aria-label={`Halaman ${page} dari ${pageCount}`} className="flex items-center justify-between gap-2 pt-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => update({ page: page > 2 ? String(page - 1) : null })}>
                    <ChevronLeft aria-hidden />
                    Sebelumnya
                  </Button>
                  <span className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                    {page} / {pageCount}
                  </span>
                  <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => update({ page: String(page + 1) })}>
                    Berikutnya
                    <ChevronRight aria-hidden />
                  </Button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>

      {/* HP: panel yang sama di Sheet bawah (PRD 5.1). Filter langsung berlaku, tombol bawah hanya menutup. */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" aria-describedby={undefined} className="lg:hidden">
          <SheetHeader className="pb-0">
            <SheetTitle>Filter</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto px-4">{panel}</div>
          <SheetFooter className="border-t border-border">
            <Button size="lg" className="w-full" onClick={() => setSheetOpen(false)}>
              {search.isSuccess ? `Lihat ${total} jasa` : "Lihat hasil"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function ResultGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
}

function FilterPanel({
  params,
  geo,
  onLocate,
  onChange,
}: {
  params: SearchListingsParams
  geo: GeoState
  onLocate: () => void
  onChange: (patch: Patch) => void
}) {
  const categories = useCategories()
  const located = params.lat !== undefined
  // Tanpa sort di URL, tampilkan urutan bawaan server: jarak kalau ada lokasi, selain itu rating.
  const sortValue: SearchSort = params.sort ?? (located ? "distance" : "rating")
  const sortOptions = (Object.keys(SORT_LABEL) as SearchSort[]).filter((s) => s !== "distance" || located)

  return (
    <div className="flex flex-col gap-6 pb-2">
      <FilterGroup title="Lokasi">
        {located ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-sm">
              <MapPin aria-hidden className="size-4 text-primary" />
              Memakai lokasimu
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange({ lat: null, lng: null, ...(params.sort === "distance" ? { sort: null } : {}) })}
            >
              Hapus lokasi
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full" loading={geo === "locating"} onClick={onLocate}>
              <LocateFixed aria-hidden />
              Pakai lokasiku
            </Button>
            {geo === "failed" ? (
              <p role="status" className="text-sm text-muted-foreground">
                Lokasimu belum terbaca. Hasil tetap tampil tanpa jarak.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Untuk melihat jarak dan mengurutkan dari yang terdekat.</p>
            )}
          </div>
        )}
      </FilterGroup>

      <FilterGroup title="Kategori">
        {categories.isPending ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-11 w-24 rounded-full" />
            ))}
          </div>
        ) : categories.isError ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            Kategori gagal dimuat.
            <Button variant="ghost" size="sm" onClick={() => categories.refetch()}>
              Coba lagi
            </Button>
          </div>
        ) : (
          <ChipGroup
            label="Kategori"
            value={params.category_id ?? null}
            options={[{ value: null, label: "Semua" }, ...categories.data.data.map((c) => ({ value: c.id, label: c.name, icon: getCategoryIcon(c.icon_name) }))]}
            onSelect={(v) => onChange({ category_id: v })}
          />
        )}
      </FilterGroup>

      <FilterGroup title="Mode">
        <ChipGroup
          label="Mode"
          value={params.booking_mode ?? null}
          options={[
            { value: null, label: "Semua" },
            { value: "SCHEDULED", label: BOOKING_MODE_META.SCHEDULED.label },
            { value: "AVAILABLE_NOW", label: BOOKING_MODE_META.AVAILABLE_NOW.label },
          ]}
          onSelect={(v) => onChange({ booking_mode: v })}
        />
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
          <span className="flex flex-col">
            <span className="text-base font-medium">Bisa datang sekarang</span>
            <span className="text-sm text-muted-foreground">Ada pekerja yang sedang siap menerima pesanan.</span>
          </span>
          <Switch
            checked={params.available_now === true}
            onCheckedChange={(on) => onChange({ available_now: on ? "true" : null })}
          />
        </label>
      </FilterGroup>

      <FilterGroup title="Urutan">
        <label htmlFor="urutan" className="sr-only">
          Urutkan hasil
        </label>
        <select
          id="urutan"
          value={sortValue}
          onChange={(e) => onChange({ sort: e.target.value })}
          className="h-11 w-full rounded-md border border-input bg-card px-3 text-base text-foreground outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary-subtle"
        >
          {sortOptions.map((s) => (
            <option key={s} value={s}>
              {SORT_LABEL[s]}
            </option>
          ))}
        </select>
      </FilterGroup>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </div>
  )
}

function ChipGroup({
  label,
  value,
  options,
  onSelect,
}: {
  label: string
  value: string | null
  options: { value: string | null; label: string; icon?: LucideIcon }[]
  onSelect: (value: string | null) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value ?? "semua"}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(o.value)}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              active
                ? "border-primary bg-primary-subtle text-primary-subtle-foreground"
                : "border-border bg-card text-foreground hover:bg-accent",
            )}
          >
            {o.icon && <o.icon aria-hidden className="size-4" />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
