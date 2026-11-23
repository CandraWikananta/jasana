import type { Metadata } from "next"
import { NotFoundView } from "@/components/shared/not-found-view"

// 404 di dalam area pelanggan, untuk notFound() dari halamannya (mulai /pesanan/[id] di W3). URL yang
// tidak cocok dengan rute mana pun tetap memakai 404 global.
export const metadata: Metadata = { title: "Halaman tidak ditemukan" }

export default function NotFound() {
  return <NotFoundView />
}
