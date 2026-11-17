// Bentuk JSON apps/api/src/modules/catalog/catalog.mapper.ts.

export type AttributeDataType = "TEXT" | "NUMBER" | "BOOLEAN" | "SELECT" | "MULTISELECT" | "DATE"
export type AttributeRole = "SPEC" | "OPTION"
export type PricingMode = "NONE" | "FLAT_PER_OPTION" | "PER_UNIT"

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon_name: string | null
  icon_url: string | null
  display_order: number
  is_active: boolean
}

export interface Subcategory {
  id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  suggested_price_min: number | null
  suggested_price_max: number | null
  estimated_duration_minutes: number | null
  display_order: number
  is_active: boolean
}

export interface AttributeOption {
  value: string
  is_active: boolean
  /** D100: lama pekerjaan kalau opsi ini dipilih. */
  duration_minutes: number | null
}

/** GET /subcategories/:id/attributes. Opsi nonaktif sudah disembunyikan server (D67). */
export interface Attribute {
  id: string
  subcategory_id: string
  attribute_key: string
  label: string
  data_type: AttributeDataType
  attribute_role: AttributeRole
  pricing_mode: PricingMode
  options: AttributeOption[] | null
  validation_rule: { min?: number; max?: number; regex?: string } | null
  unit: string | null
  is_required: boolean
  is_active: boolean
  is_filterable: boolean
  display_order: number
}
