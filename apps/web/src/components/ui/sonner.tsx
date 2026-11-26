"use client"

import { CircleCheck, CircleX, Info } from "lucide-react"
import { Toaster as Sonner } from "sonner"

// Diubah dari bawaan shadcn: tanpa next-themes (tidak ada mode gelap, FE13) dan tanpa gaya bawaan
// sonner, supaya warna, radius, dan huruf dari token. Kanan bawah di desktop; di HP selebar layar di
// bawah (DS 6.1), di atas navigasi bawah lewat --toast-offset-bottom. Keduanya bergeser saat tombol atau
// panel Asisten tampil (globals.css, usulan D272).
const OFFSET = { bottom: "var(--toast-offset-bottom)", right: "var(--toast-offset-right)" }

function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      offset={OFFSET}
      mobileOffset={OFFSET}
      containerAriaLabel="Pemberitahuan"
      icons={{
        success: <CircleCheck aria-hidden className="size-5 text-success" />,
        error: <CircleX aria-hidden className="size-5 text-destructive" />,
        info: <Info aria-hidden className="size-5 text-info" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          // "!" karena CSS sonner tidak berlapis, sehingga cincin fokusnya yang samar mengalahkan token.
          toast:
            "focus-visible:ring-2! focus-visible:ring-ring focus-visible:ring-offset-2! flex w-full items-center gap-3 rounded-lg border border-border bg-popover p-4 font-sans text-sm font-medium text-popover-foreground shadow-lg",
          icon: "shrink-0",
        },
      }}
    />
  )
}

export { Toaster }
