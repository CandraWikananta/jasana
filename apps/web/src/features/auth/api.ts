import { apiFetch } from "@/lib/api-client"
import type { Me } from "@/types/api/auth"

export async function getMe(): Promise<Me> {
  return (await apiFetch<Me>("/auth/me")).data
}
