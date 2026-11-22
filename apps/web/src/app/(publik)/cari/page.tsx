import type { Metadata } from "next"
import { Suspense } from "react"
import { ListingCardSkeleton } from "@/components/shared/listing-card"
import { Skeleton } from "@/components/ui/skeleton"
import { SearchPage } from "@/features/listings/components/search-page"

// Client Component karena butuh geolokasi browser (PRD 4.2). Suspense wajib untuk useSearchParams.
export const metadata: Metadata = { title: "Cari jasa" }

export default function CariPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchPage />
    </Suspense>
  )
}

// Kerangka sebentuk halaman: baris judul, lalu grid hasil (kolom filter baru muncul setelah hidrasi).
function SearchFallback() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
