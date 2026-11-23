"use client"

import { Car, Camera, Sparkles, Wrench } from "lucide-react"
import { useState } from "react"
import { NavList } from "@/components/layout/bottom-nav"
import { NAV } from "@/components/layout/nav-items"
import { NavLinks } from "@/components/layout/sidebar-shell"
import { ErrorState } from "@/components/shared/error-state"
import { FilterChip, RemovableChip } from "@/components/shared/filter-chip"
import { Button } from "@/components/ui/button"

const CAPTION = "text-xs font-medium text-muted-foreground"

// DS 6.4: navigasi asli dari components/layout dengan pathname tetap, supaya galeri ikut berubah kalau
// komponennya berubah.
export function NavMarkersDemo() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <p className={CAPTION}>Sidebar usaha, Pesanan aktif</p>
        <nav aria-label="Contoh menu usaha" className="w-62 max-w-full rounded-lg border border-border bg-card py-3">
          <NavLinks items={NAV.usaha} pathname="/usaha/pesanan" />
        </nav>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className={CAPTION}>Navigasi bawah pelanggan, Pesanan aktif</p>
          <nav aria-label="Contoh navigasi bawah pelanggan" className="rounded-lg border border-border bg-card">
            <NavList items={NAV.pelanggan} pathname="/pesanan" />
          </nav>
        </div>
        <div className="flex flex-col gap-2">
          <p className={CAPTION}>Navigasi bawah pekerja, Tugas aktif</p>
          <nav aria-label="Contoh navigasi bawah pekerja" className="rounded-lg border border-border bg-card">
            <NavList items={NAV.pekerja} pathname="/pekerja/tugas" />
          </nav>
        </div>
      </div>
    </div>
  )
}

/** ErrorState dengan Coba lagi; onRetry tidak bisa dikirim dari Server Component. */
export function ErrorStateDemo() {
  return <ErrorState message="Server sedang sibuk. Coba lagi sebentar lagi." onRetry={() => undefined} />
}

const CATEGORIES = [
  { label: "Otomotif", icon: Car },
  { label: "Fotografi", icon: Camera },
  { label: "Kecantikan", icon: Sparkles },
  { label: "Perbaikan", icon: Wrench },
]
const ACTIVE_FILTERS = ["Denpasar", "Servis AC", "Bisa datang sekarang"]

// Chip pilihan (aktif pucat dengan Check) dan chip removable (D253).
export function ChipsDemo() {
  const [picked, setPicked] = useState("Fotografi")
  const [filters, setFilters] = useState(ACTIVE_FILTERS)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className={CAPTION}>Chip pilihan</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <FilterChip key={c.label} label={c.label} icon={c.icon} active={picked === c.label} onClick={() => setPicked(c.label)} />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className={CAPTION}>Chip removable</p>
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <RemovableChip key={f} label={f} onRemove={() => setFilters((all) => all.filter((x) => x !== f))} />
          ))}
          {filters.length < ACTIVE_FILTERS.length && (
            <Button variant="ghost" onClick={() => setFilters(ACTIVE_FILTERS)}>
              Kembalikan contoh
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
