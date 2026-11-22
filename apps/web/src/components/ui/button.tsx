import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { LoaderCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// Bentuk akhir components/ui/button.tsx untuk DS v2.1 (Bagian 14). Nama varian, ukuran, dan props
// sama dengan aslinya. State per varian mengikuti tabel DS 6.4, termasuk secondary, ghost, dan
// destructive yang baru diatur di v2.1. Cincin fokus 2 px berjarak 2 px supaya terlihat di atas
// tombol hitam, tombol hijau, maupun latar putih.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:pointer-events-none disabled:bg-muted disabled:text-disabled-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover active:translate-y-px active:bg-primary-pressed",
        secondary: "bg-secondary text-secondary-foreground hover:bg-border active:translate-y-px active:bg-border",
        // Nonaktif tetap latar --card dengan garis --border, bukan --muted seperti varian lain (6.4).
        outline:
          "border border-input bg-card text-foreground hover:bg-muted active:translate-y-px active:bg-muted disabled:border-border disabled:bg-card",
        // Nonaktif tetap transparan, hanya teksnya yang meredup (6.4).
        ghost: "text-foreground hover:bg-muted active:translate-y-px active:bg-muted disabled:bg-transparent",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover active:translate-y-px active:bg-destructive-hover",
        // Khusus aksi mode Sekarang (Ambil, Terima). Teks selalu hitam: putih di atas --brand hanya 2,28:1.
        now: "bg-brand text-brand-foreground hover:bg-brand-hover active:translate-y-px active:bg-brand-hover active:shadow-inner",
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
    /** Spinner ditambahkan dan tombol dinonaktifkan supaya tidak terkirim dua kali. Label bentuk proses ("Membayar…") dari pemanggil. */
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
