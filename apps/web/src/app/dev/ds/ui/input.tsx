import * as React from "react"
import { cn } from "cn"

// Pratinjau Input DS v2.0 untuk migrasi components/ui/input.tsx. Tetap 16 px dan 44 px.
// Fokus jadi garis --foreground ditambah cincin --ring 2 px berjarak 2 px (6.4 dan 1.2).
// A12: lebar cincin dan garis error tidak disebut eksplisit di v2.0. Garis error dibawa dari v1.6.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        "data-[demo=focus]:border-foreground data-[demo=focus]:ring-2 data-[demo=focus]:ring-ring data-[demo=focus]:ring-offset-2 data-[demo=focus]:ring-offset-card",
        "aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
