"use client"

import { CircleAlert, SearchX } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { ListingCard, ListingCardSkeleton } from "@/components/shared/listing-card"
import { Button } from "@/components/ui/button"
import { useListingSearch } from "@/features/listings/queries"

const GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"

// Data asli GET /listings, empat state (CLAUDE.md aturan 10).
export function ListingDemo() {
  const { data, isPending, isError, error, refetch, isRefetching } = useListingSearch({ sort: "popular", limit: 6 })

  if (isPending) {
    return (
      <div className={GRID}>
        {[0, 1, 2].map((i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    )
  }
  if (isError) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="Jasa gagal dimuat"
        description={error.message}
        action={
          <Button variant="outline" loading={isRefetching} onClick={() => refetch()}>
            Coba lagi
          </Button>
        }
      />
    )
  }
  if (data.data.length === 0) {
    return <EmptyState icon={SearchX} title="Belum ada jasa" description="Belum ada jasa yang tayang saat ini." />
  }
  return (
    <div className={GRID}>
      {data.data.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}
