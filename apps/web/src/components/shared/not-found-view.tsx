import Link from "next/link"
import { SearchX } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

// Halaman "tidak ditemukan" berbahasa Indonesia (Design System 10). Dipakai not-found global, per rute,
// dan per area (tujuan kembali ke beranda area itu).
export function NotFoundView({
  title = "Halaman tidak ditemukan",
  description = "Alamat yang kamu buka tidak ada atau belum tersedia.",
  href = "/",
  actionLabel = "Kembali ke beranda",
}: {
  title?: string
  description?: string
  href?: string
  actionLabel?: string
}) {
  return (
    <EmptyState
      icon={SearchX}
      title={title}
      description={description}
      className="py-20"
      titleAs="h1"
      action={
        <Button asChild>
          <Link href={href}>{actionLabel}</Link>
        </Button>
      }
    />
  )
}
