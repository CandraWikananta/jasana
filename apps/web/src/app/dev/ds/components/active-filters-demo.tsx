"use client"

import { useState } from "react"
import { ActiveFilters } from "@/components/shared/active-filters"
import { Button } from "@/components/ui/button"

// Peraga D253 dengan state lokal (di /cari penghapusan mengubah URL). Setelah chip dihapus, fokus pindah ke chip
// berikutnya, lalu ke judul peraga kalau semua habis.
const ITEMS = ["Dekat lokasimu", "Otomotif", "Mode Sekarang"]

export function ActiveFiltersDemo() {
  const [labels, setLabels] = useState(ITEMS)
  return (
    <div className="flex flex-col gap-3">
      <p id="ds-filter-aktif" tabIndex={-1} className="text-sm font-medium text-muted-foreground outline-none">
        {labels.length} filter aktif
      </p>
      <ActiveFilters
        fallbackFocusId="ds-filter-aktif"
        items={labels.map((label) => ({ key: label, label, onRemove: () => setLabels((l) => l.filter((x) => x !== label)) }))}
      />
      {labels.length < ITEMS.length && (
        <Button variant="ghost" className="-ml-5 self-start" onClick={() => setLabels(ITEMS)}>
          Kembalikan contoh
        </Button>
      )}
    </div>
  )
}
