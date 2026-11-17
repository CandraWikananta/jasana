import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { LoaderCircle } from "lucide-react"
import { cn } from "cn"
import { Slot } from "radix-ui"

// Diubah dari bawaan shadcn mengikuti Design System 6.1: varian primary dan now,
// ukuran sm/md/lg (36/40/48 px), cincin fokus 2 px berjarak 2 px (Bagian 11),
// tanpa varian mode gelap (FE13) dan tanpa nilai arbitrer.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary: "bg-secondary text-secondary-foreground hover:brightness-95",
        outline: "border border-input bg-card text-foreground hover:bg-accent",
        ghost: "text-foreground hover:bg-accent",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        now: "bg-now text-now-foreground hover:brightness-95",
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
