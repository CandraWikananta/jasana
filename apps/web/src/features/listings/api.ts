import { cache } from "react"
import { apiFetch } from "@/lib/api-client"
import type { ListingCard, ListingDetail, SearchListingsParams } from "@/types/api/listing"

export function searchListings(params: SearchListingsParams) {
  return apiFetch<ListingCard[]>("/listings", { query: { ...params } })
}

// React.cache: generateMetadata dan halaman detail memakai satu fetch per request.
export const getListing = cache((id: string) => apiFetch<ListingDetail>(`/listings/${encodeURIComponent(id)}`))
