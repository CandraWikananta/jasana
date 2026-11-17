import { formatRupiah } from "@/lib/format"
import { cn } from "@/lib/utils"

// Design System 6.2: seluruh angka uang lewat komponen ini, tabular supaya tidak bergoyang.
export function MoneyText({ amount, className }: { amount: number; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{formatRupiah(amount)}</span>
}
