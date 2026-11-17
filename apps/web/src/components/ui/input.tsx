import * as React from "react"
import { cn } from "cn"

// Diubah dari bawaan shadcn: selalu 16 px (Safari iOS memperbesar halaman di bawah itu,
// Design System 2), tinggi 44 px (area sentuh, Bagian 11), fokus berupa garis primary
// dan cincin primary-subtle (Bagian 1.2, mockup acuan).
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary-subtle",
        "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive-subtle",
        className
      )}
      {...props}
    />
  )
}

export { Input }
