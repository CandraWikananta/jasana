import { cn } from "@/lib/utils"

// Diubah dari bawaan shadcn: latar --muted (Design System 1.1) dan denyut hanya
// kalau pengguna tidak meminta gerak dikurangi (Bagian 11).
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("rounded-md bg-muted motion-safe:animate-pulse", className)}
      {...props}
    />
  )
}

export { Skeleton }
