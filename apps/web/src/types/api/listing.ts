// Bentuk JSON apps/api/src/modules/listings/listings.mapper.ts (tampilan publik).
import type { BookingMode } from "@jasana/shared"
import type { AttributeDataType, PricingMode } from "./catalog"
import type { ProviderType } from "./provider"
import type { PublicReview } from "./review"

export type PriceUnit = "PER_JOB" | "PER_HOUR" | "PER_UNIT"
export type SearchSort = "distance" | "price_asc" | "price_desc" | "rating" | "popular"

/** Butir GET /listings. `price` adalah harga "mulai dari", tanpa delta opsi. */
export interface ListingCard {
  id: string
  title: string
  price: number
  price_unit: PriceUnit
  estimated_duration_minutes: number | null
  supports_scheduled: boolean
  supports_available_now: boolean
  rating_average: number
  rating_count: number
  order_count: number
  subcategory: { id: string; name: string }
  /** business_name null untuk INDIVIDUAL tanpa nama usaha. */
  provider: { id: string; business_name: string | null; rating_average: number; rating_count: number }
  primary_photo_url: string | null
  /** Kilometer, bukan meter. Null kalau pencarian tanpa lat/lng (D98). */
  distance_km: number | null
}

/** Query GET /listings (listings.schema.ts searchListingsQuerySchema). */
export interface SearchListingsParams {
  page?: number
  limit?: number
  q?: string
  category_id?: string
  subcategory_id?: string
  lat?: number
  lng?: number
  radius_km?: number
  available_now?: boolean
  booking_mode?: BookingMode
  price_min?: number
  price_max?: number
  sort?: SearchSort
}

export interface ListingPhoto {
  id: string
  file_url: string
  caption: string | null
  display_order: number
  is_primary: boolean
}

export interface Faq {
  id: string
  question: string
  answer: string
  display_order: number
}

/** Opsi berbayar yang dilayani. `option_value` null untuk PER_UNIT. */
export interface OptionPrice {
  attribute_key: string
  label: string
  data_type: AttributeDataType
  pricing_mode: PricingMode
  unit: string | null
  option_value: string | null
  price_delta: number
  duration_minutes: number | null
}

/** GET /listings/:id. */
export interface ListingDetail {
  id: string
  subcategory: { id: string; name: string }
  provider: {
    id: string
    business_name: string | null
    provider_type: ProviderType
    rating_average: number
    rating_count: number
  }
  title: string
  description: string | null
  price: number
  price_unit: PriceUnit
  estimated_duration_minutes: number | null
  attributes: Record<string, unknown>
  supports_scheduled: boolean
  supports_available_now: boolean
  rating_average: number
  rating_count: number
  order_count: number
  photos: ListingPhoto[]
  faqs: Faq[]
  option_prices: OptionPrice[]
  /** Tiga ulasan tampil terbaru. Daftar lengkap lewat GET /listings/:id/reviews. */
  reviews: PublicReview[]
  created_at: string
  updated_at: string
}
