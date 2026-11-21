"use client"

// EKSPLORASI, bukan bagian DS v2.0. AvailabilityToggle menyala dengan empat penanda Sekarang yang
// sejalan dengan varian OfferCard. Saat dimatikan, keempatnya kembali ke kartu putih biasa.
// AvailabilityToggle sesuai DS ada di ../components/availability-toggle.tsx dan tidak diubah.
import { useId, useState } from "react"
import { cn } from "cn"
import { Label } from "@/components/ui/label"
import { Switch } from "../ui/switch"
import { LiveDot } from "../components/markers"
import { NowPill, type MarkerVariant } from "./offer-variants"

const SHELL_ON: Record<MarkerVariant, string> = {
  A: "border-l-4 border-l-brand",
  B: "",
  C: "border-brand",
  D: "",
}

export function ToggleVariant({ variant }: { variant: MarkerVariant }) {
  const [on, setOn] = useState(true)
  const id = useId()

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-lg border border-border bg-card", on && SHELL_ON[variant])}>
      {on && variant === "D" ? (
        <p className="flex items-center gap-2 bg-brand-subtle px-4 py-2.5 text-sm font-bold text-brand-subtle-foreground">
          <LiveDot />
          Lokasi aktif · Sekarang
        </p>
      ) : null}
      <div className="flex items-center gap-4 p-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Label htmlFor={id} className="text-base leading-6 font-semibold">
            Siap terima pesanan sekarang
          </Label>
          {!on ? (
            <p className="text-sm text-muted-foreground">Mati. Nyalakan supaya tawaran mode Sekarang bisa masuk.</p>
          ) : variant === "B" ? (
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <NowPill />
              <span>
                <span className="font-semibold text-foreground">Lokasi aktif</span> · Tawaran baru muncul di sini
              </span>
            </p>
          ) : variant === "D" ? (
            <p className="text-sm text-muted-foreground">Tawaran baru muncul di sini</p>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LiveDot />
              <span>
                <span className="font-semibold text-foreground">Lokasi aktif</span> · Tawaran baru muncul di sini
              </span>
            </p>
          )}
        </div>
        <div className="flex min-h-11 min-w-11 items-center justify-center">
          <Switch id={id} checked={on} onCheckedChange={setOn} />
        </div>
      </div>
    </div>
  )
}
