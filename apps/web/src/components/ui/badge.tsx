import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// Bentuk akhir components/ui/badge.tsx untuk DS v2.1 (Bagian 14). Nada status memakai pasangan
// subtle (1.4): pill berwarna selalu berarti status. `now` pill putih bergaris --brand, isinya titik
// live dan "Sekarang", bentuk yang sama di semua tempat (D242). `outline` untuk mode Terjadwal.
// Tinggi 28 px, teks caption 12 px bobot 600 (D247).
const badgeVariants = cva(
  "inline-flex h-7 w-fit shrink-0 items-center gap-1.5 rounded-full pr-3 pl-2.5 text-xs font-semibold whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3.5 [&>svg]:shrink-0",
  {
    variants: {
      tone: {
        warning: "bg-warning-subtle text-warning-subtle-foreground",
        info: "bg-info-subtle text-info-subtle-foreground",
        success: "bg-success-subtle text-success-subtle-foreground",
        destructive: "bg-destructive-subtle text-destructive-subtle-foreground",
        neutral: "bg-neutral-subtle text-neutral-subtle-foreground",
        now: "border border-brand bg-card text-foreground",
        outline: "border border-border bg-card text-muted-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
)

type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>

function Badge({
  className,
  tone = "neutral",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-tone={tone}
      className={cn(badgeVariants({ tone }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants, type BadgeTone }
