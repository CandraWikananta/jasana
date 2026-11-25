"use client"

import { useState } from "react"
import { MapPicker } from "@/components/shared/map-picker"
import { MapView } from "@/components/shared/map-view"
import type { Point } from "@/lib/geo"

export function MapDemo() {
  const [point, setPoint] = useState<Point | null>(null)
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <MapView
        label="Lokasi layanan, posisi penanggung jawab, dan lokasi usaha di Renon"
        markers={[
          { kind: "service", lat: -8.6705, lng: 115.2346 },
          { kind: "worker", lat: -8.6752, lng: 115.2291 },
          { kind: "provider", lat: -8.6668, lng: 115.2262 },
        ]}
      />
      <MapPicker label="Peta peraga" value={point} onChange={setPoint} />
    </div>
  )
}
