import type { Metadata } from "next"
import { House } from "lucide-react"
import { PlaceholderPage } from "@/components/shared/placeholder-page"

export const metadata: Metadata = { title: "Beranda pekerja" }

export default function PekerjaPage() {
  return (
    <PlaceholderPage
      title="Beranda pekerja"
      icon={House}
      description="Ketersediaan, tawaran masuk, dan tugas aktif akan tampil di sini."
    />
  )
}
