import Link from "next/link"
import { ShieldX } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

// 403 berbahasa Indonesia untuk layout area (PRD Frontend 4.3). Penentu akhirnya tetap Express.
export function ForbiddenView() {
  return (
    <EmptyState
      icon={ShieldX}
      title="Kamu tidak punya akses ke halaman ini"
      description="Halaman ini hanya untuk akun dengan peran tertentu. Pindah area lewat menu akun di kanan atas."
      className="py-20"
      titleAs="h1"
      action={
        <Button asChild>
          <Link href="/">Kembali ke beranda</Link>
        </Button>
      }
    />
  )
}
