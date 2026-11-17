import { apiFetch } from "@/lib/api-client"
import type { Attribute, Category } from "@/types/api/catalog"

export function listCategories() {
  return apiFetch<Category[]>("/categories")
}

export function listAttributes(subcategoryId: string) {
  return apiFetch<Attribute[]>(`/subcategories/${encodeURIComponent(subcategoryId)}/attributes`)
}
