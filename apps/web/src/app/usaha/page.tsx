import type { Metadata } from "next"
import { LayoutDashboard } from "lucide-react"
import { PlaceholderPage } from "@/components/shared/placeholder-page"
import { PublicProfileLink } from "@/features/providers/components/public-profile-link"

export const metadata: Metadata = { title: "Usaha saya" }

export default function UsahaPage() {
  return (
    <PlaceholderPage
      title="Usaha saya"
      icon={LayoutDashboard}
      description="Pesanan masuk, tawaran, dan ringkasan saldo akan tampil di sini."
      action={<PublicProfileLink />}
    />
  )
}
