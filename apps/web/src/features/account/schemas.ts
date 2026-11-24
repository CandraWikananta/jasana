import { z } from "zod"
import { mapFormError, registerFormSchema } from "@/features/auth/schemas"
import type { ApiError } from "@/lib/api-error"

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
