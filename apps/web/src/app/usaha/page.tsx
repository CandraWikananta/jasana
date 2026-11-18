import type { Metadata } from "next"
import { LayoutDashboard } from "lucide-react"
import { PlaceholderPage } from "@/components/shared/placeholder-page"

export const metadata: Metadata = { title: "Usaha saya" }

export default function UsahaPage() {
  return (
    <PlaceholderPage
      title="Usaha saya"
      icon={LayoutDashboard}
      description="Pesanan masuk, tawaran, dan ringkasan saldo akan tampil di sini."
    />
  )
}
