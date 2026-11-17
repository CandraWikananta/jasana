import type { Metadata } from "next"
import { Suspense } from "react"
import { ListingCardSkeleton } from "@/components/shared/listing-card"
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

function SearchFallback() {
  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:grid-cols-2 md:px-6 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  )
}
