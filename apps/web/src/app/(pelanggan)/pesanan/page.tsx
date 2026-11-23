import type { Metadata } from "next"
import Link from "next/link"
import { ClipboardList } from "lucide-react"
import { PlaceholderPage } from "@/components/shared/placeholder-page"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Pesanan saya" }

export default function PesananPage() {
  return (
    <PlaceholderPage
      title="Pesanan saya"
      icon={ClipboardList}
      description="Pesanan yang kamu buat akan muncul di sini."
      action={
        <Button asChild variant="outline">
          <Link href="/cari">Cari jasa</Link>
        </Button>
      }
    />
  )
}
