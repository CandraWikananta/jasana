import type { Metadata } from "next"
import { ClipboardList } from "lucide-react"
import { PlaceholderPage } from "@/components/shared/placeholder-page"

export const metadata: Metadata = { title: "Pesanan saya" }

export default function PesananPage() {
  return (
    <PlaceholderPage
      title="Pesanan saya"
      icon={ClipboardList}
      description="Pesanan yang kamu buat akan muncul di sini."
    />
  )
}
