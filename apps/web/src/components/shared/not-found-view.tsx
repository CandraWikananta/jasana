import Link from "next/link"
import { SearchX } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

// Halaman "tidak ditemukan" berbahasa Indonesia (Design System 10). Dipakai not-found global dan per rute.
export function NotFoundView({
  title = "Halaman tidak ditemukan",
  description = "Alamat yang kamu buka tidak ada atau belum tersedia.",
}: {
  title?: string
  description?: string
}) {
  return (
    <EmptyState
      icon={SearchX}
      title={title}
      description={description}
      className="py-20"
      action={
        <Button asChild>
          <Link href="/">Kembali ke beranda</Link>
        </Button>
      }
    />
  )
}
