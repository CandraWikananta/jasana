"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { MapMarker } from "./map/leaflet-map"

const LeafletMap = dynamic(() => import("./map/leaflet-map"), {
  ssr: false,
  loading: () => <Skeleton className="size-full" />,
})

/** Peta baca saja (DS 6.2): tanpa gestur, selalu memuat seluruh penanda. */
export function MapView({
  label,
  markers,
  className,
}: {
  /** Isi peta dalam satu kalimat, untuk pembaca layar. */
  label: string
  markers: [MapMarker, ...MapMarker[]]
  className?: string
}) {
  return (
    <div className={cn("h-72", className)}>
      <LeafletMap label={label} center={markers[0]} zoom={16} markers={markers} />
    </div>
  )
}
