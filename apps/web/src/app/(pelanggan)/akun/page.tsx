import type { Metadata } from "next"
import { UserRound } from "lucide-react"
import { PlaceholderPage } from "@/components/shared/placeholder-page"

export const metadata: Metadata = { title: "Akun" }

export default function AkunPage() {
  return (
    <PlaceholderPage
      title="Akun"
      icon={UserRound}
      description="Profil, alamat, dan keamanan akun akan diatur di sini."
    />
  )
}
