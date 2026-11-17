import { useQuery } from "@tanstack/react-query"
import { qk } from "@/lib/query-keys"
import type { SearchListingsParams } from "@/types/api/listing"
import { searchListings } from "./api"

export function useListingSearch(params: SearchListingsParams) {
  return useQuery({ queryKey: qk.listings.search(params), queryFn: () => searchListings(params) })
}
