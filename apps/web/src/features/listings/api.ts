import { apiFetch } from "@/lib/api-client"
import type { ListingCard, SearchListingsParams } from "@/types/api/listing"

export function searchListings(params: SearchListingsParams) {
  return apiFetch<ListingCard[]>("/listings", { query: { ...params } })
}
