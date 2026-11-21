"use client"

import { useState } from "react"
import { cn } from "cn"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"

// Tab aktif solid (6.4). Lencana angka pucat saat tab tidak aktif. A11: di tab aktif lencana
// mengikuti aturan menu aktif (--primary, teks putih) karena dokumen tidak mengaturnya.
const TABS = [
  { value: "semua", label: "Semua" },
  { value: "berjalan", label: "Berjalan", count: 2 },
  { value: "selesai", label: "Selesai" },
  { value: "komplain", label: "Komplain", count: 1 },
]

export function TabsDemo() {
  const [value, setValue] = useState("berjalan")
  return (
    <Tabs value={value} onValueChange={setValue}>
      <TabsList className="w-full max-w-xl">
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold tabular-nums",
                  value === t.value ? "bg-primary text-primary-foreground" : "bg-brand-subtle text-brand-subtle-foreground"
                )}
              >
                {t.count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map((t) => (
        <TabsContent key={t.value} value={t.value} className="pt-2 text-sm text-muted-foreground">
          Isi tab {t.label.toLowerCase()}.
        </TabsContent>
      ))}
    </Tabs>
  )
}
