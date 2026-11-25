import type { Metadata } from "next"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { LINK_CLASS } from "@/components/shared/link-class"
import { AddressesView } from "@/features/account/components/addresses-view"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Alamat" }

export default function AlamatPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-h1 font-bold">Alamat</h1>
        {/* Letak dan area sentuh sama dengan /akun/keamanan. */}
        <Link href="/akun" className={cn(LINK_CLASS, "-my-3 inline-flex items-center gap-1 py-3 text-sm")}>
          <ChevronLeft aria-hidden className="-ml-1 size-4" />
          Kembali ke akun
        </Link>
      </div>
      <AddressesView />
    </div>
  )
}
