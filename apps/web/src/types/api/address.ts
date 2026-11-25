// Bentuk JSON /users/me/addresses (apps/api/src/modules/users/addresses.service.ts). snake_case.

export interface AddressDto {
  id: string
  label: string | null
  address_line: string
  district: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  latitude: number
  longitude: number
  is_default: boolean
  created_at: string
  updated_at: string
}

/** Body POST dan PATCH. Alamat utama dipindah lewat PATCH { is_default: true } tersendiri. */
export type AddressInput = Omit<AddressDto, "id" | "is_default" | "created_at" | "updated_at">
