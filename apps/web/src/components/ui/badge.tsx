import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

// Diubah dari bawaan shadcn: varian berupa nada Design System 1.4 dan 7
// (pasangan subtle), now yang selalu solid lime (1.3), dan outline (DS v1.5 6.1).
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
        now: "bg-now text-now-foreground",
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
