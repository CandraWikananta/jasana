import { apiFetch } from "@/lib/api-client"
import type { Me } from "@/types/api/auth"

export async function getMe(): Promise<Me> {
  return (await apiFetch<Me>("/auth/me")).data
}

/** POST /auth/resend-verification (D62). Email sudah terverifikasi dijawab `sent: false`. */
export async function resendVerification(): Promise<{ sent: boolean; email_verified: boolean }> {
  return (await apiFetch<{ sent: boolean; email_verified: boolean }>("/auth/resend-verification", { method: "POST" })).data
}
