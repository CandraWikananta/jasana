import { useQuery } from "@tanstack/react-query"
import { qk } from "@/lib/query-keys"
import { listCategories } from "./api"

export function useCategories() {
  return useQuery({ queryKey: qk.categories, queryFn: listCategories, staleTime: 5 * 60_000 })
}
