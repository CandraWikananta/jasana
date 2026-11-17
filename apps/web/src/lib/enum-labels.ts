import type { PriceUnit, SearchSort } from "@/types/api/listing"
import type { ProviderType } from "@/types/api/provider"

// Satu-satunya tabel label enum non-order (Design System 7.2). Label status order di order-status.ts.

/** Akhiran harga: `Mulai Rp50.000 / jam`. PER_JOB tanpa akhiran. */
export const PRICE_UNIT_SUFFIX: Record<PriceUnit, string> = {
  PER_JOB: "",
  PER_HOUR: "/ jam",
  PER_UNIT: "/ unit",
}

export const SORT_LABEL: Record<SearchSort, string> = {
  rating: "Rating tertinggi",
  popular: "Paling populer",
  price_asc: "Harga terendah",
  price_desc: "Harga tertinggi",
  distance: "Terdekat",
}

export const PROVIDER_TYPE_LABEL: Record<ProviderType, string> = {
  INDIVIDUAL: "Perorangan",
  BUSINESS: "Usaha",
}
