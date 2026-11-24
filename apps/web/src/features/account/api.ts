import { apiFetch } from "@/lib/api-client"
import type { ActiveSession, EmailChangeResult, UpdateMeInput, UserDto } from "@/types/api/auth"

function send<T>(method: "POST" | "PATCH", path: string, body: unknown) {
  return apiFetch<T>(path, { method, body: JSON.stringify(body) })
}

export async function updateMe(input: UpdateMeInput): Promise<UserDto> {
  return (await send<UserDto>("PATCH", "/users/me", input)).data
}

/** Server mencabut SELURUH sesi, termasuk sesi pemanggil (D76, H65). */
export async function changePassword(input: { current_password: string; new_password: string }): Promise<void> {
  await send<{ sessions_revoked: number }>("POST", "/users/me/change-password", input)
}

export async function requestEmailChange(input: {
  current_password: string
  new_email: string
}): Promise<EmailChangeResult> {
  return (await send<EmailChangeResult>("PATCH", "/users/me/email", input)).data
}

/** `cancelled: false` kalau sudah tidak ada yang menunggu, misalnya link-nya keburu dikonfirmasi. */
export async function cancelEmailChange(): Promise<{ cancelled: boolean }> {
  return (await apiFetch<{ cancelled: boolean }>("/users/me/email-change", { method: "DELETE" })).data
}

export async function getSessions(): Promise<ActiveSession[]> {
  return (await apiFetch<ActiveSession[]>("/auth/sessions")).data
}

/** Mencabut refresh token semua perangkat. Cookie di browser ini dihapus oleh logout() setelahnya. */
export async function logoutAll(): Promise<void> {
  await apiFetch<unknown>("/auth/logout-all", { method: "POST" })
}
