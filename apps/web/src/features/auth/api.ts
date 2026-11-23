import { apiFetch } from "@/lib/api-client"
import type { Me, RegisterInput, RegisterResult, UserDto } from "@/types/api/auth"

export async function getMe(): Promise<Me> {
  return (await apiFetch<Me>("/auth/me")).data
}

/** POST /auth/resend-verification (D62). Email sudah terverifikasi dijawab `sent: false`. */
export async function resendVerification(): Promise<{ sent: boolean; email_verified: boolean }> {
  return (await apiFetch<{ sent: boolean; email_verified: boolean }>("/auth/resend-verification", { method: "POST" })).data
}

function post<T>(path: string, body: unknown) {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) })
}

export async function register(input: RegisterInput): Promise<UserDto> {
  return (await post<RegisterResult>("/auth/register", input)).data.user
}

// Tiga endpoint token di bawah publik: token dari link email yang menentukan akunnya, bukan sesi.

export async function verifyEmail(token: string): Promise<{ email_verified_at: string }> {
  return (await post<{ email_verified_at: string }>("/auth/verify-email", { token })).data
}

/** Selalu dijawab sukses, terdaftar atau tidak (PRD Backend 5.4), supaya email tidak bisa ditebak. */
export async function forgotPassword(email: string): Promise<void> {
  await post<{ message: string }>("/auth/forgot-password", { email })
}

/** Server ikut mencabut seluruh sesi akun itu (H65). */
export async function resetPassword(token: string, newPassword: string): Promise<{ sessions_revoked: number }> {
  return (await post<{ sessions_revoked: number }>("/auth/reset-password", { token, new_password: newPassword })).data
}

export async function confirmEmailChange(token: string): Promise<UserDto> {
  return (await post<UserDto>("/auth/confirm-email-change", { token })).data
}
