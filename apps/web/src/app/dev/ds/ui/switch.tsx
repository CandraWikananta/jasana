"use client"

import * as React from "react"
import { cn } from "cn"
import { Switch as SwitchPrimitive } from "radix-ui"

// Bentuk akhir components/ui/switch.tsx untuk DS v2.1 (Bagian 14). Menyala: trek dan garis
// --brand-hover, karena --brand hanya 2,28:1 terhadap kartu dan thumb putih, di bawah syarat 3:1
// komponen UI (D244, menjadi 3,30:1). Mati: trek --muted bergaris --input. Thumb selalu --card.
// Area sentuh 44 px disediakan pembungkus bersama labelnya (DS 6.1).
function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-brand-hover data-[state=checked]:bg-brand-hover data-[state=unchecked]:border-input data-[state=unchecked]:bg-muted",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-5 rounded-full bg-card shadow-sm transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
