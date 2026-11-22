import { ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

// EscrowNote DS 6.2 (D250): pola kepercayaan untuk transaksi uang. Nada netral dan tanpa kotak
// berwarna, supaya tidak bersaing dengan tombol atau terbaca sebagai status.
export function EscrowNote({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <ShieldCheck aria-hidden className="size-4 shrink-0" />
      Dana ditahan sampai pekerjaan selesai
    </p>
  )
}
