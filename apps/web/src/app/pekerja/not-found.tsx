import type { Metadata } from "next"
import { NotFoundView } from "@/components/shared/not-found-view"

// 404 di dalam area pekerja: tampil di dalam layout area, jadi navigasi bawah tetap ada.
export const metadata: Metadata = { title: "Halaman tidak ditemukan" }

export default function NotFound() {
  return <NotFoundView href="/pekerja" actionLabel="Ke Beranda pekerja" />
}
