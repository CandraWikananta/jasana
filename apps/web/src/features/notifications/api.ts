import { apiFetch } from "@/lib/api-client"

/**
 * Jumlah notifikasi in-app belum dibaca. GET /notifications menaruhnya di `meta.unread_count`, jadi
 * cukup minta satu baris. PaginationMeta di packages/shared belum memuat field ini.
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const { meta } = await apiFetch<unknown[]>("/notifications", { query: { limit: 1 } })
  const unread = (meta as { unread_count?: unknown } | undefined)?.unread_count
  return typeof unread === "number" ? unread : 0
}
