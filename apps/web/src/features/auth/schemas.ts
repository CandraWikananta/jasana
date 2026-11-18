import { z } from "zod"
import type { ApiError } from "@/lib/api-error"
import { getErrorMessage, LOGIN_UNAUTHORIZED_MESSAGE, retryAfterMessage } from "@/lib/error-messages"
import type { LoginInput } from "@/types/api/auth"

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
    const wait = retryAfterMessage(error.retryAfterSeconds)
    const base = getErrorMessage(error.code)
    return { fields: {}, form: wait ? `${base} ${wait}` : base }
  }

  return { fields: {}, form: error.message }
}
