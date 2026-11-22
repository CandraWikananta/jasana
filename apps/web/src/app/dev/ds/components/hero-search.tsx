"use client"

import { useId, useState } from "react"
import { MapPin, Search } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CATEGORIES, LOCATIONS } from "../data"
import { FilterChip } from "./filter-chip"

// Hero beranda: judul berisi fakta, bukan klaim (D249), skala `display` (D247), kolom pencarian
// berlabel, Select lokasi, satu tombol primary (P2), dan chip kategori.
//
// Judul memakai container query @3xl (48rem, setara titik henti `md`) supaya bingkai 390 px di
// halaman ini tetap menampilkan ukuran HP. Di aplikasi asli: `text-display md:text-display-lg`.
export function HeroSearch() {
  const id = useId()
  const [active, setActive] = useState("Servis AC")

  return (
    <div className="flex flex-col gap-6 py-2 @3xl:py-6">
      <div className="flex flex-col gap-3">
        <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <MapPin aria-hidden className="size-4" />
          Denpasar, Bali
        </p>
        <h2 className="max-w-2xl text-display font-bold @3xl:text-display-lg">
          Servis AC, ledeng, dan kebersihan rumah di Denpasar
        </h2>
        <p className="max-w-xl text-base text-muted-foreground">
          Pesan untuk jadwal tertentu, atau panggil pekerja yang bisa datang sekarang.
        </p>
      </div>

      <form role="search" className="flex flex-col gap-2 @2xl:flex-row" onSubmit={(e) => e.preventDefault()}>
        <Label htmlFor={`${id}-q`} className="sr-only">
          Cari jasa
        </Label>
        <Input
          id={`${id}-q`}
          name="q"
          type="search"
          autoComplete="off"
          placeholder="Servis AC, pipa bocor, bersih rumah…"
          className="@2xl:flex-1"
        />
        <Select defaultValue="Denpasar" name="lokasi">
          <SelectTrigger aria-label="Lokasi" className="w-full @2xl:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOCATIONS.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" size="lg" className="h-11">
          <Search aria-hidden />
          Cari jasa
        </Button>
      </form>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">Kategori</p>
        <ul className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <li key={c.label}>
              <FilterChip
                label={c.label}
                icon={c.icon}
                active={c.label === active}
                onClick={() => setActive(c.label)}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
