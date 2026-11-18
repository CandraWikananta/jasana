import type { Metadata } from "next"
import { LayoutDashboard } from "lucide-react"
import { PlaceholderPage } from "@/components/shared/placeholder-page"

export const metadata: Metadata = { title: "Ringkasan" }

export default function AdminPage() {
  return (
    <PlaceholderPage
      title="Ringkasan"
      icon={LayoutDashboard}
      description="Antrean verifikasi, pencairan, komplain, dan laporan singkat akan tampil di sini."
    />
  )
}
