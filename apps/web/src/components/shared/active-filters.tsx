"use client"

import { useEffect, useRef } from "react"
import { RemovableChip } from "@/components/shared/filter-chip"

export interface ActiveFilterItem {
  key: string
  label: string
  onRemove: () => void
}

/**
 * Chip yang mendapat fokus setelah chip ke-`removedIndex` dihapus: yang menggantikan posisinya, atau yang terakhir
 * kalau yang dihapus paling ujung. `null` berarti tidak ada chip tersisa, jadi fokus pindah ke elemen cadangan.
 */
export function nextFocusIndex(removedIndex: number, remainingCount: number): number | null {
  if (remainingCount <= 0) return null
  return Math.min(removedIndex, remainingCount - 1)
}

// ActiveFilters DS 6.2 (D253): baris chip removable untuk setiap filter aktif. Penghapusan mengubah URL, jadi chip
// hilang setelah render berikutnya; fokus dipindah saat itu supaya tidak jatuh ke body (DS 10).
export function ActiveFilters({ items, fallbackFocusId }: { items: ActiveFilterItem[]; fallbackFocusId: string }) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const pending = useRef<{ index: number; count: number } | null>(null)

  useEffect(() => {
    const p = pending.current
    if (!p || items.length === p.count) return
    pending.current = null
    const next = nextFocusIndex(p.index, items.length)
    if (next === null) document.getElementById(fallbackFocusId)?.focus()
    else buttons.current[next]?.focus()
  }, [items.length, fallbackFocusId])

  if (items.length === 0) return null
  return (
    <ul aria-label="Filter aktif" className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <li key={item.key}>
          <RemovableChip
            ref={(el) => {
              buttons.current[i] = el
            }}
            label={item.label}
            onRemove={() => {
              pending.current = { index: i, count: items.length }
              item.onRemove()
            }}
          />
        </li>
      ))}
    </ul>
  )
}
