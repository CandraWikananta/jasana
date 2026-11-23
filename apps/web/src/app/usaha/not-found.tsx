import type { Metadata } from "next"
import { NotFoundView } from "@/components/shared/not-found-view"

// 404 di dalam area usaha: tampil di dalam layout area, jadi sidebar tetap ada.
export const metadata: Metadata = { title: "Halaman tidak ditemukan" }

export default function NotFound() {
  return <NotFoundView href="/usaha" actionLabel="Ke Beranda usaha" />
}
