"use client"

import { useId, useState } from "react"
import { Check, MapPin, Search } from "lucide-react"
import { cn } from "cn"
import { Label } from "@/components/ui/label"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { CATEGORIES, LOCATIONS } from "../data"

// Hero beranda: judul `display` 30/36 (Bagian 2), kolom pencarian berlabel, Select lokasi, satu
// tombol primary (P2), dan chip kategori. Chip aktif pucat dengan ikon Check (6.4).
// A15: chip tidak aktif tidak diatur dokumen.
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
        <h2 className="max-w-2xl text-3xl font-bold">Jasa rumah tepercaya, dikerjakan di lokasimu</h2>
        <p className="max-w-prose text-base text-muted-foreground">
          Pesan untuk jadwal tertentu, atau panggil yang bisa datang sekarang. Dana ditahan sampai pekerjaan selesai.
        </p>
      </div>

      <form role="search" className="flex flex-col gap-2 @2xl:flex-row" onSubmit={(e) => e.preventDefault()}>
        <Label htmlFor={`${id}-q`} className="sr-only">
          Cari jasa
        </Label>
        <Input id={`${id}-q`} type="search" placeholder="Cari jasa, misalnya servis AC" className="@2xl:flex-1" />
        <Select defaultValue="Denpasar">
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
          {CATEGORIES.map((c) => {
            const on = c.label === active
            const Icon = on ? Check : c.icon
            return (
              <li key={c.label}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setActive(c.label)}
                  className={cn(
                    "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                    on
                      ? "border-transparent bg-brand-subtle font-bold text-brand-subtle-foreground"
                      : "border-input bg-card font-medium text-foreground hover:bg-muted"
                  )}
                >
                  <Icon aria-hidden className={cn("size-4", !on && "text-muted-foreground")} />
                  {c.label}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
