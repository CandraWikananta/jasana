import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { LoaderCircle } from "lucide-react"
import { cn } from "cn"
import { Slot } from "radix-ui"

// Pratinjau Button DS v2.0 (6.1 dan 6.4) untuk migrasi components/ui/button.tsx. Nama varian,
// ukuran, dan props sama dengan aslinya. `data-demo` hanya untuk peraga state statis di /dev/ds.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card data-[demo=focus]:ring-2 data-[demo=focus]:ring-ring data-[demo=focus]:ring-offset-2 data-[demo=focus]:ring-offset-card disabled:pointer-events-none disabled:bg-muted disabled:text-disabled-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:translate-y-px active:bg-primary-pressed data-[demo=hover]:bg-primary-hover data-[demo=pressed]:translate-y-px data-[demo=pressed]:bg-primary-pressed",
        // A10: hover dan ditekan untuk secondary, ghost, dan destructive tidak diatur v2.0, dibawa dari v1.6.
        secondary: "bg-secondary text-secondary-foreground hover:brightness-95 data-[demo=hover]:brightness-95",
        // A14: nonaktif mengikuti tabel 6.4 (garis --border, latar tetap --card).
        outline:
          "border border-input bg-card text-foreground hover:bg-muted active:translate-y-px active:bg-muted disabled:border-border disabled:bg-card data-[demo=hover]:bg-muted data-[demo=pressed]:translate-y-px data-[demo=pressed]:bg-muted",
        ghost: "text-foreground hover:bg-accent data-[demo=hover]:bg-accent",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 data-[demo=hover]:bg-destructive/90",
        now: "bg-brand text-brand-foreground hover:bg-brand-hover active:translate-y-px active:bg-brand-hover active:shadow-inner data-[demo=hover]:bg-brand-hover data-[demo=pressed]:translate-y-px data-[demo=pressed]:bg-brand-hover data-[demo=pressed]:shadow-inner",
      },
      size: {
        sm: "h-9 px-3 text-sm [&_svg:not([class*='size-'])]:size-4",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Label tetap tampil, ditambah spinner, dan tombol dinonaktifkan supaya tidak terkirim dua kali. */
    loading?: boolean
  }

function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <LoaderCircle aria-hidden className="motion-safe:animate-spin" />}
          {children}
        </>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
