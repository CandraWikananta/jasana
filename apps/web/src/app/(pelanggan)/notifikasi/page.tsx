import type { Metadata } from "next"
import { Bell } from "lucide-react"
import { PlaceholderPage } from "@/components/shared/placeholder-page"

export const metadata: Metadata = { title: "Notifikasi" }

export default function NotifikasiPage() {
  return (
    <PlaceholderPage
      title="Notifikasi"
      icon={Bell}
      description="Kabar terbaru tentang pesanan dan akunmu akan muncul di sini."
    />
  )
}
