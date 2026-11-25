"use client"

import type { LeafletMouseEvent, Map as LeafletMapInstance } from "leaflet"
import { LocateFixed } from "lucide-react"
import dynamic from "next/dynamic"
import { useEffect, useEffectEvent, useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrentPoint, MIN_PIN_ZOOM, pickPoint, type Point } from "@/lib/geo"

const LeafletMap = dynamic(() => import("./map/leaflet-map"), {
  ssr: false,
  loading: () => <Skeleton className="size-full" />,
})

const DENPASAR: Point = { lat: -8.65, lng: 115.2167 }
const CITY_ZOOM = 12
const STREET_ZOOM = 17

/**
 * Pemilih titik (D265): pin diam di tengah dan petanya yang digeser, jadi jari tidak menutupi
 * pin dan tombol panah langsung berfungsi. Mengetuk peta adalah alternatif selain menyeret (WCAG 2.5.7).
 */
export function MapPicker({
  value,
  onChange,
  label,
  invalid,
  errorId,
  ref,
}: {
  /** Titik awal; sesudahnya mengikuti peta. */
  value: Point | null
  onChange: (point: Point | null) => void
  label: string
  invalid?: boolean
  /** Id pesan galat formulir, kalau sedang tampil. */
  errorId?: string
  /** Tombol "Pakai lokasiku", tujuan fokus saat titik belum ditentukan. */
  ref?: React.Ref<HTMLButtonElement>
}) {
  const [map, setMap] = useState<LeafletMapInstance | null>(null)
  const [geo, setGeo] = useState<"idle" | "locating" | "failed">("idle")
  const statusId = useId()

  const settle = useEffectEvent((instance: LeafletMapInstance) => {
    // Peta sudah digeser sendiri, jadi pesan gagal membaca lokasi tidak relevan lagi.
    setGeo((current) => (current === "failed" ? "idle" : current))
    const next = pickPoint(instance.getCenter().wrap(), instance.getZoom(), value)
    if (next !== value) onChange(next)
  })

  useEffect(() => {
    if (!map) return
    const onMoveEnd = () => settle(map)
    const onClick = (event: LeafletMouseEvent) => {
      map.setView(event.latlng, Math.max(map.getZoom(), MIN_PIN_ZOOM))
    }
    map.on("moveend", onMoveEnd)
    map.on("click", onClick)
    return () => {
      map.off("moveend", onMoveEnd)
      map.off("click", onClick)
    }
  }, [map])

  async function locate() {
    setGeo("locating")
    try {
      const { lat, lng } = await getCurrentPoint()
      map?.setView([lat, lng], STREET_ZOOM)
      setGeo("idle")
    } catch {
      setGeo("failed")
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        ref={ref}
        type="button"
        variant="outline"
        className="w-full sm:w-auto sm:self-start"
        loading={geo === "locating"}
        aria-describedby={errorId}
        onClick={() => void locate()}
      >
        {geo !== "locating" && <LocateFixed aria-hidden />}
        {geo === "locating" ? "Mencari…" : "Pakai lokasiku"}
      </Button>
      <div className="h-72">
        <LeafletMap
          label={`${label}. Geser dengan tombol panah, perbesar dengan plus, perkecil dengan minus.`}
          center={value ?? DENPASAR}
          zoom={value ? STREET_ZOOM : CITY_ZOOM}
          picker
          invalid={invalid}
          describedBy={statusId}
          onMap={setMap}
        />
      </div>
      <p id={statusId} role="status" className="text-sm text-muted-foreground">
        {geo === "failed"
          ? "Lokasimu belum terbaca. Izinkan akses lokasi lalu coba lagi."
          : value
            ? "Titik lokasi sudah ditentukan. Geser peta kalau belum tepat."
            : "Perbesar dan geser peta sampai pin tepat di lokasimu."}
      </p>
    </div>
  )
}
