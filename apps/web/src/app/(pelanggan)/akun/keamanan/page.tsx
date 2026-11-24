import type { Metadata } from "next"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { LINK_CLASS } from "@/components/shared/link-class"
import { SecurityView } from "@/features/account/components/security-view"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Keamanan akun" }

export default function KeamananPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-h1 font-bold">Keamanan akun</h1>
        {/* Di bawah judul, supaya judul tidak bergeser dari kerangka AreaGate. Padding vertikal
            dikembalikan margin negatif: area sentuh 44 px. */}
        <Link href="/akun" className={cn(LINK_CLASS, "-my-3 inline-flex items-center gap-1 py-3 text-sm")}>
          <ChevronLeft aria-hidden className="-ml-1 size-4" />
          Kembali ke akun
        </Link>
      </div>
      <SecurityView />
    </div>
  )
}
