"use client"

import { useId, useState } from "react"
import { cn } from "cn"
import { Label } from "@/components/ui/label"
import { Switch } from "../ui/switch"
import { LiveDot } from "./markers"

// AvailabilityToggle DS 1.3b dan 6.2. Menyala: kartu putih, garis tepi kiri --brand, titik live di
// samping "Lokasi aktif", switch --brand. Mati: kartu putih biasa, switch --muted bergaris --input.
export function AvailabilityToggle({ defaultOn }: { defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn)
  const id = useId()

  return (
    <div className={cn("flex items-center gap-4 rounded-lg border border-border bg-card p-4", on && "border-l-4 border-l-brand")}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Label htmlFor={id} className="text-base leading-6 font-semibold">
          Siap terima pesanan sekarang
        </Label>
        {on ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LiveDot />
            <span>
              <span className="font-semibold text-foreground">Lokasi aktif</span> · Tawaran baru muncul di sini
            </span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Mati. Nyalakan supaya tawaran mode Sekarang bisa masuk.</p>
        )}
      </div>
      <div className="flex min-h-11 min-w-11 items-center justify-center">
        <Switch id={id} checked={on} onCheckedChange={setOn} />
      </div>
    </div>
  )
}
