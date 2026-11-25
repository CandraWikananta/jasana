import type { SearchListingsParams } from "@/types/api/listing"

// Satu-satunya pembuat kunci query (PRD Frontend 7.3). Awalan yang sama dipakai untuk invalidasi.
export const qk = {
  me: ["me"] as const,
  sessions: ["sessions"] as const,
  addresses: ["addresses"] as const,
  orders: {
    all: ["orders"] as const,
    lists: ["orders", "list"] as const,
    list: (filter: Record<string, unknown>) => ["orders", "list", filter] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
    messages: (id: string) => ["orders", "messages", id] as const,
  },
  worker: { orders: ["worker", "orders"] as const },
  wallet: ["wallet"] as const,
  notifications: ["notifications"] as const,
  notificationsUnread: ["notifications", "unread"] as const,
  listings: {
    all: ["listings"] as const,
    search: (params: SearchListingsParams) => ["listings", "search", params] as const,
    detail: (id: string) => ["listings", "detail", id] as const,
  },
  categories: ["categories"] as const,
}
