"use client"

import { useId, useState } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "../ui/switch"
import { ModeBadge } from "./markers"

// AvailabilityToggle DS 1.3b dan 6.2 (D242): kartu putih biasa, tanpa garis tepi kiri. Menyala:
// baris status berisi badge Sekarang lalu "Lokasi aktif", switch --brand-hover (D244). Mati: tanpa
// badge, switch --muted bergaris --input. Area sentuh switch 44 px.
export function AvailabilityToggle({ defaultOn }: { defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn)
  const id = useId()

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Label htmlFor={id} className="text-base leading-6 font-semibold">
          Siap terima pesanan sekarang
        </Label>
        {on ? (
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
            <ModeBadge mode="AVAILABLE_NOW" />
            Lokasi aktif
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
