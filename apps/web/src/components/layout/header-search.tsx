"use client"

import { Search } from "lucide-react"
import { usePathname } from "next/navigation"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Kotak cari header publik. Di beranda disembunyikan karena hero sudah memuat kotak cari, supaya
// satu layar hanya punya satu aksi utama (P2). Form GET biasa ke /cari, tetap jalan tanpa JavaScript.
export function HeaderSearch() {
  // usePathname di rute dinamis butuh batas Suspense (Cache Components). Fallback-nya form itu sendiri,
  // karena hanya "/" yang menyembunyikannya dan "/" statis.
  return (
    <Suspense fallback={<SearchForm />}>
      <HeaderSearchInner />
    </Suspense>
  )
}

function HeaderSearchInner() {
  return usePathname() === "/" ? null : <SearchForm />
}

function SearchForm() {
  return (
    <form
      role="search"
      action="/cari"
      method="get"
      className="order-last flex w-full gap-2 md:order-none md:max-w-xl md:flex-1"
    >
      <label htmlFor="cari-jasa" className="sr-only">
        Cari jasa
      </label>
      <div className="relative flex-1">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="cari-jasa"
          name="q"
          type="search"
          autoComplete="off"
          placeholder="Cari jasa, misalnya servis AC…"
          className="pl-10"
        />
      </div>
      <Button type="submit" variant="secondary" className="h-11">
        Cari
      </Button>
    </form>
  )
}
