import { z } from "zod"
import type { ApiError } from "@/lib/api-error"
import {
  getErrorMessage,
  LOGIN_RATE_LIMITED_MESSAGE,
  LOGIN_UNAUTHORIZED_MESSAGE,
  RATE_LIMITED_MESSAGE,
  retryAfterMessage,
} from "@/lib/error-messages"
import type { LoginInput, RegisterInput } from "@/types/api/auth"

// Aturan isi diserahkan ke server. Di sini hanya memastikan tidak kosong, supaya pesan galat
// tidak membocorkan kebijakan kata sandi (sama dengan loginSchema backend).
export const loginFormSchema = z.object({
  identifier: z.string().trim().min(1, "Isi email atau nomor ponselmu."),
  password: z.string().min(1, "Isi kata sandimu."),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>

/** Backend menerima email ATAU phone, persis salah satu. */
export function toLoginInput(values: LoginFormValues): LoginInput {
  const identifier = values.identifier.trim()
  return identifier.includes("@")
    ? { email: identifier, password: values.password }
    : { phone: identifier, password: values.password }
}

export interface LoginErrorView {
  fields: Partial<Record<keyof LoginFormValues, string>>
  form: string | null
}

const FIELD_FROM_PATH: Record<string, keyof LoginFormValues> = {
  email: "identifier",
  phone: "identifier",
  password: "password",
}

const FIELD_MESSAGES: Record<keyof LoginFormValues, string> = {
  identifier: "Periksa lagi email atau nomor ponselmu.",
  password: "Periksa lagi kata sandimu.",
}

/** PRD Frontend 7.2: 422 ke field, 401 dan 429 di atas formulir. */
export function mapLoginError(error: ApiError): LoginErrorView {
  if (error.status === 401) return { fields: {}, form: LOGIN_UNAUTHORIZED_MESSAGE }

  if (error.code === "VALIDATION_ERROR") {
    const fields: LoginErrorView["fields"] = {}
    for (const detail of error.details) {
      const field = FIELD_FROM_PATH[detail.path]
      if (field) fields[field] = FIELD_MESSAGES[field]
    }
    if (Object.keys(fields).length > 0) return { fields, form: null }
  }

  if (error.status === 429) {
    const wait = retryAfterMessage(error.retryAfterSeconds) ?? "Tunggu sebentar lalu coba lagi."
    return { fields: {}, form: `${LOGIN_RATE_LIMITED_MESSAGE} ${wait}` }
  }

  return { fields: {}, form: error.message }
}

// ---------------------------------------------------------------------------
// Daftar, lupa sandi, atur ulang sandi, dan link token
// ---------------------------------------------------------------------------

// Aturan di bawah mencerminkan registerSchema dan resetPasswordSchema backend, supaya galat muncul
// saat isian ditinggalkan, bukan setelah bolak-balik ke server. Server tetap penentu akhirnya.

/** Sama dengan phoneField backend: 0812…, 62812…, dan +62 812-… adalah satu nomor. */
export function normalizePhone(value: string): string {
  const compact = value.replace(/[\s\-().]/g, "")
  if (compact.startsWith("+62")) return compact
  if (compact.startsWith("62")) return `+${compact}`
  if (compact.startsWith("0")) return `+62${compact.slice(1)}`
  return compact
}

const PHONE_PATTERN = /^\+628\d{7,11}$/

/** bcrypt hanya membaca 72 byte pertama, jadi backend menolak yang lebih panjang. */
const newPasswordField = z
  .string()
  .min(8, "Kata sandi minimal 8 karakter.")
  .refine((value) => new TextEncoder().encode(value).length <= 72, "Kata sandi terlalu panjang. Pakai yang lebih pendek.")

const emailField = z.string().trim().min(1, "Isi emailmu.").email("Periksa lagi emailmu, contohnya nama@gmail.com.")

export const registerFormSchema = z.object({
  full_name: z.string().trim().min(2, "Isi nama lengkapmu, minimal 2 huruf.").max(100, "Nama maksimal 100 karakter."),
  email: emailField,
  phone: z
    .string()
    .trim()
    .min(1, "Isi nomor ponselmu.")
    .refine((value) => PHONE_PATTERN.test(normalizePhone(value)), "Pakai nomor ponsel Indonesia, contohnya 0812 3456 7890."),
  password: newPasswordField,
})

export type RegisterFormValues = z.infer<typeof registerFormSchema>

export function toRegisterInput(values: RegisterFormValues): RegisterInput {
  return {
    full_name: values.full_name.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    password: values.password,
  }
}

export const forgotPasswordFormSchema = z.object({ email: emailField })
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>

export const resetPasswordFormSchema = z.object({ password: newPasswordField })
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>

export interface FormErrorView<F extends string> {
  fields: Partial<Record<F, string>>
  form: string | null
}

/**
 * PRD Frontend 7.2 untuk formulir selain masuk: 422 ke field lewat `details[].path`, sisanya di atas
 * formulir. Pesan field dari frontend, bukan dari server: pesan Zod backend memakai nama kolom
 * ("phone harus nomor ponsel…").
 */
export function mapFormError<F extends string>(
  error: ApiError,
  fieldFromPath: Record<string, F>,
  messageFor: (field: F, serverMessage: string) => string,
): FormErrorView<F> {
  if (error.code === "VALIDATION_ERROR") {
    const fields: Partial<Record<F, string>> = {}
    for (const detail of error.details) {
      const field = fieldFromPath[detail.path]
      if (field && !fields[field]) fields[field] = messageFor(field, detail.message)
    }
    if (Object.keys(fields).length > 0) return { fields, form: null }
  }
  if (error.status === 429) {
    const wait = retryAfterMessage(error.retryAfterSeconds)
    return { fields: {}, form: wait ? `${RATE_LIMITED_MESSAGE} ${wait}` : error.message }
  }
  return { fields: {}, form: error.message }
}

type RegisterField = keyof RegisterFormValues

const REGISTER_FIELD_MESSAGES: Record<RegisterField, string> = {
  full_name: "Periksa lagi namamu.",
  email: "Periksa lagi emailmu.",
  phone: "Periksa lagi nomor ponselmu.",
  password: "Periksa lagi kata sandimu.",
}

// Satu-satunya pembeda duplikat dari galat bentuk adalah kalimat server ("Email sudah terdaftar",
// "Nomor ponsel sudah terdaftar", auth.service duplicateError). Kodenya sama-sama VALIDATION_ERROR.
const DUPLICATE_MESSAGES: Partial<Record<RegisterField, string>> = {
  email: "Email ini sudah terdaftar. Masuk, atau pakai email lain.",
  phone: "Nomor ponsel ini sudah terdaftar. Masuk, atau pakai nomor lain.",
}

export function mapRegisterError(error: ApiError): FormErrorView<RegisterField> {
  return mapFormError(
    error,
    { full_name: "full_name", email: "email", phone: "phone", password: "password" },
    (field, serverMessage) =>
      (/sudah terdaftar/i.test(serverMessage) ? DUPLICATE_MESSAGES[field] : undefined) ?? REGISTER_FIELD_MESSAGES[field],
  )
}

export function mapForgotPasswordError(error: ApiError): FormErrorView<"email"> {
  return mapFormError(error, { email: "email" }, () => "Periksa lagi emailmu.")
}

export function mapResetPasswordError(error: ApiError): FormErrorView<"password"> {
  return mapFormError(error, { new_password: "password" }, () => "Periksa lagi kata sandi barumu.")
}

/** Token dari query link email. Kosong berarti link terpotong atau dibuka tanpa token. */
export function readLinkToken(value: string | null): string | null {
  const token = value?.trim()
  return token ? token : null
}

/**
 * Link email yang tidak bisa dipakai lagi: tiga kode token, atau 422 pada `token` itu sendiri
 * (lebih dari 256 karakter karena link rusak). Halaman lalu menawarkan link baru, bukan Coba lagi.
 */
export function isLinkTokenError(error: ApiError): boolean {
  if (error.code === "TOKEN_INVALID" || error.code === "TOKEN_EXPIRED" || error.code === "TOKEN_ALREADY_USED") return true
  return error.code === "VALIDATION_ERROR" && error.details.some((detail) => detail.path === "token")
}

/** Pesan untuk link yang tidak bisa dipakai. 422 pada `token` dibaca sebagai link tidak valid. */
export function linkTokenMessage(error: ApiError | null): string {
  if (error && error.code !== "VALIDATION_ERROR" && isLinkTokenError(error)) return error.message
  return getErrorMessage("TOKEN_INVALID")
}
