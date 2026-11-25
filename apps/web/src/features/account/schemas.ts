import { z } from "zod"
import { mapFormError, registerFormSchema } from "@/features/auth/schemas"
import type { ApiError } from "@/lib/api-error"
import type { Point } from "@/lib/geo"
import type { AddressDto, AddressInput } from "@/types/api/address"

// Aturan isi sama dengan pendaftaran (backend memakai field Zod yang sama), jadi diambil dari sana.
// Server tetap penentu akhirnya.

export const profileFormSchema = registerFormSchema.pick({ full_name: true, phone: true })
export type ProfileFormValues = z.infer<typeof profileFormSchema>

const currentPasswordField = z.string().min(1, "Isi kata sandimu saat ini.")

export const changeEmailFormSchema = z.object({
  new_email: registerFormSchema.shape.email,
  current_password: currentPasswordField,
})
export type ChangeEmailFormValues = z.infer<typeof changeEmailFormSchema>

export const changePasswordFormSchema = z
  .object({ current_password: currentPasswordField, new_password: registerFormSchema.shape.password })
  .refine((values) => values.current_password !== values.new_password, {
    message: "Pakai kata sandi yang berbeda dari yang sekarang.",
    path: ["new_password"],
  })
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>

// Kata sandi salah dijawab 422 di current_password, bukan 401, jadi sesi tidak ikut terbuang.
const WRONG_PASSWORD = "Kata sandi salah. Periksa lagi."

// Seperti di pendaftaran, pembeda duplikat dari galat bentuk hanya kalimat server (users.service).
export function mapProfileError(error: ApiError) {
  return mapFormError<keyof ProfileFormValues>(
    error,
    { full_name: "full_name", phone: "phone" },
    (field, serverMessage) => {
      if (field === "full_name") return "Periksa lagi namamu."
      return /sudah terdaftar/i.test(serverMessage)
        ? "Nomor ponsel ini sudah dipakai akun lain. Pakai nomor lain."
        : "Periksa lagi nomor ponselmu."
    },
  )
}

export function mapChangeEmailError(error: ApiError) {
  return mapFormError<keyof ChangeEmailFormValues>(
    error,
    { new_email: "new_email", current_password: "current_password" },
    (field, serverMessage) => {
      if (field === "current_password") return WRONG_PASSWORD
      if (/sama dengan/i.test(serverMessage)) return "Ini sudah email akunmu. Isi alamat lain."
      if (/sudah dipakai/i.test(serverMessage)) return "Email ini sudah dipakai akun lain. Pakai email lain."
      return "Periksa lagi emailmu."
    },
  )
}

export function mapChangePasswordError(error: ApiError) {
  return mapFormError<keyof ChangePasswordFormValues>(
    error,
    { current_password: "current_password", new_password: "new_password" },
    (field) => (field === "current_password" ? WRONG_PASSWORD : "Periksa lagi kata sandi barumu."),
  )
}

// ---------------------------------------------------------------------------
// Alamat (createAddressSchema backend)
// ---------------------------------------------------------------------------

const optionalText = (max: number, name: string) => z.string().trim().max(max, `${name} maksimal ${max} karakter.`)

export const addressFormSchema = z.object({
  label: optionalText(50, "Nama alamat"),
  address_line: z
    .string()
    .trim()
    .min(5, "Isi alamat lengkapmu, minimal 5 karakter.")
    .max(500, "Alamat maksimal 500 karakter."),
  // boolean eksplisit: tanpa itu tipenya menyempit jadi Point, padahal formulir dimulai dari null.
  point: z.custom<Point | null>().refine((value): boolean => value !== null, "Tentukan titik lokasinya di peta."),
  district: optionalText(100, "Kecamatan"),
  city: optionalText(100, "Kota atau kabupaten"),
  province: optionalText(100, "Provinsi"),
  postal_code: z.string().trim().regex(/^(\d{5})?$/, "Kode pos berisi 5 angka."),
})
export type AddressFormValues = z.infer<typeof addressFormSchema>

export function toAddressFormValues(address: AddressDto | null): AddressFormValues {
  return {
    label: address?.label ?? "",
    address_line: address?.address_line ?? "",
    point: address && { lat: address.latitude, lng: address.longitude },
    district: address?.district ?? "",
    city: address?.city ?? "",
    province: address?.province ?? "",
    postal_code: address?.postal_code ?? "",
  }
}

/** Isian kosong dikirim null, supaya nilai lama benar-benar terhapus saat diubah. */
export function toAddressInput(values: AddressFormValues, point: Point): AddressInput {
  const text = (value: string) => value.trim() || null
  return {
    label: text(values.label),
    address_line: values.address_line.trim(),
    district: text(values.district),
    city: text(values.city),
    province: text(values.province),
    postal_code: text(values.postal_code),
    latitude: point.lat,
    longitude: point.lng,
  }
}

const ADDRESS_FIELD_MESSAGES: Record<keyof AddressFormValues, string> = {
  label: "Periksa lagi nama alamatnya.",
  address_line: "Periksa lagi alamat lengkapnya.",
  point: "Tentukan lagi titik lokasinya di peta.",
  district: "Periksa lagi kecamatannya.",
  city: "Periksa lagi kota atau kabupatennya.",
  province: "Periksa lagi provinsinya.",
  postal_code: "Kode pos berisi 5 angka.",
}

export function mapAddressError(error: ApiError) {
  return mapFormError<keyof AddressFormValues>(
    error,
    {
      label: "label",
      address_line: "address_line",
      latitude: "point",
      longitude: "point",
      district: "district",
      city: "city",
      province: "province",
      postal_code: "postal_code",
    },
    (field) => ADDRESS_FIELD_MESSAGES[field],
  )
}
