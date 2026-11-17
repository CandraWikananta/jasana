// Bentuk JSON GET /providers/:id (providers.service.ts getPublicProvider).
// Tanpa alamat dan koordinat basis usaha (D78).

export type ProviderType = "INDIVIDUAL" | "BUSINESS"

export interface PublicProvider {
  id: string
  /** business_name, atau nama pemilik untuk INDIVIDUAL tanpa nama usaha. */
  display_name: string
  business_name: string | null
  bio: string | null
  provider_type: ProviderType
  service_radius_km: number | null
  rating_average: number
  rating_count: number
  completed_orders_count: number
  verified_at: string | null
  accepts_worker_applications: boolean
  listings: { id: string; title: string }[]
}
