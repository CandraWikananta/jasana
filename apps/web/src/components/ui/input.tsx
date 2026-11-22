import * as React from "react"
import { cn } from "cn"

// Bentuk akhir components/ui/input.tsx untuk DS v2.1 (Bagian 14). Selalu 16 px supaya Safari iOS
// tidak memperbesar halaman, dan 44 px untuk area sentuh. Fokus: garis --foreground ditambah
// cincin --ring 2 px berjarak 2 px (6.4). Saat error garisnya tetap --destructive walaupun
// sedang difokus, cincinnya tetap --ring.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        "aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
