import type { BookingMode } from "@jasana/shared"
import type { SearchListingsParams, SearchSort } from "@/types/api/listing"

export const SEARCH_PAGE_SIZE = 12

const SORTS: readonly SearchSort[] = ["rating", "popular", "price_asc", "price_desc", "distance"]
const MODES: readonly BookingMode[] = ["SCHEDULED", "AVAILABLE_NOW"]
// token-check-ignore: regex UUID, bukan kelas Tailwind
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Query URL /cari (PRD 5.1) ke parameter GET /listings. Nilai yang tidak sah dibuang, bukan diteruskan,
 * supaya URL rusak atau lama tetap menampilkan hasil alih-alih error 422.
 */
export function parseSearchParams(sp: URLSearchParams): SearchListingsParams {
  const lat = Number(sp.get("lat"))
  const lng = Number(sp.get("lng"))
  // D98: lat dan lng wajib berpasangan.
  const located =
    !!sp.get("lat") && !!sp.get("lng") && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  const sort = SORTS.find((s) => s === sp.get("sort"))
  const mode = MODES.find((m) => m === sp.get("booking_mode"))
  const q = sp.get("q")?.trim().slice(0, 100)
  const page = Number(sp.get("page"))
  const categoryId = sp.get("category_id")

  return {
    q: q || undefined,
    category_id: categoryId && UUID.test(categoryId) ? categoryId : undefined,
    booking_mode: mode,
    available_now: sp.get("available_now") === "true" || undefined,
    lat: located ? lat : undefined,
    lng: located ? lng : undefined,
    // sort=distance tanpa lokasi ditolak server; tanpa sort server memakai jarak atau rating.
    sort: sort === "distance" && !located ? undefined : sort,
    page: Number.isInteger(page) && page > 1 ? page : undefined,
    limit: SEARCH_PAGE_SIZE,
  }
}
