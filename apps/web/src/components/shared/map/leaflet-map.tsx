"use client"

import L from "leaflet"
import { MapPin, Minus, Plus, RotateCw, Store } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import type { Point } from "@/lib/geo"
import { cn } from "@/lib/utils"
import "./leaflet.css"

// Satu-satunya berkas yang memuat Leaflet, dan membaca window saat diimpor: pakai lewat MapView atau
// MapPicker, yang memuatnya dinamis tanpa SSR. Tanpa react-leaflet (D264): MapContainer-nya
// menghapus peta saat halaman disembunyikan Next dan tidak membuatnya lagi saat halaman kembali.

export type MarkerKind = "service" | "worker" | "provider"

export interface MapMarker extends Point {
  kind: MarkerKind
}

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
const MAX_ZOOM = 19

// Penanda DS 5. Jangkar dalam piksel: ujung pin untuk lokasi layanan, pusat lingkaran untuk dua lainnya.
const MARKERS: Record<MarkerKind, { anchor: [number, number]; icon: React.ReactNode }> = {
  service: {
    anchor: [20, 38],
    icon: (
      <MapPin aria-hidden className="size-10 fill-primary text-primary-foreground [&_circle]:fill-primary-foreground" />
    ),
  },
  worker: {
    anchor: [8, 8],
    icon: <span className="live-dot block size-4 rounded-full border-2 border-brand-foreground bg-brand glow-brand" />,
  },
  provider: {
    anchor: [18, 18],
    icon: (
      <span className="flex size-9 items-center justify-center rounded-full border-2 border-card bg-neutral text-primary-foreground">
        <Store aria-hidden className="size-5" />
      </span>
    ),
  },
}

function Marker({ map, marker: { kind, lat, lng } }: { map: L.Map; marker: MapMarker }) {
  const [element] = useState(() => document.createElement("div"))
  useEffect(() => {
    const icon = L.divIcon({ html: element, className: "", iconAnchor: MARKERS[kind].anchor })
    const layer = L.marker([lat, lng], { icon, interactive: false, keyboard: false }).addTo(map)
    return () => {
      layer.remove()
    }
  }, [map, element, kind, lat, lng])
  return createPortal(MARKERS[kind].icon, element)
}

export default function LeafletMap({
  label,
  center,
  zoom,
  markers = [],
  picker = false,
  invalid = false,
  describedBy,
  onMap,
}: {
  label: string
  /** Pusat dan zoom awal. Sesudahnya posisi peta milik Leaflet. */
  center: Point
  zoom: number
  markers?: MapMarker[]
  /** Bisa digeser, dengan pin lokasi layanan diam di tengah. */
  picker?: boolean
  invalid?: boolean
  describedBy?: string
  /** Peta yang siap dipakai, atau null saat dilepas (halaman ditinggalkan). Harus fungsi yang stabil. */
  onMap?: (map: L.Map | null) => void
}) {
  const [map, setMap] = useState<L.Map | null>(null)
  const [failed, setFailed] = useState(false)
  const tilesRef = useRef<L.TileLayer | null>(null)
  // Posisi terakhir bertahan saat halaman disembunyikan, supaya peta yang dibuat ulang tidak kembali ke awal.
  const viewRef = useRef({ center, zoom })

  const attach = useCallback(
    (box: HTMLDivElement) => {
      const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      const next = L.map(box, {
        // Kontrol bawaan membawa warna sendiri; penggantinya di bawah memakai token (D265).
        zoomControl: false,
        attributionControl: false,
        // Roda mouse menggulir halaman, bukan memperbesar peta.
        scrollWheelZoom: false,
        boxZoom: false,
        dragging: picker,
        touchZoom: picker,
        doubleClickZoom: picker,
        keyboard: picker,
        zoomAnimation: animate,
        fadeAnimation: animate,
        markerZoomAnimation: animate,
        inertia: animate,
      })
      let loaded = 0
      let errors = 0
      const tiles = L.tileLayer(TILE_URL, { maxZoom: MAX_ZOOM })
      tiles.on("loading", () => {
        loaded = 0
        errors = 0
      })
      tiles.on("tileload", () => {
        loaded += 1
      })
      tiles.on("tileerror", () => {
        errors += 1
      })
      // Satu ubin gagal di tepi bukan masalah; semua gagal berarti peta kosong.
      tiles.on("load", () => setFailed(errors > 0 && loaded === 0))
      next.on("moveend", () => {
        viewRef.current = { center: next.getCenter(), zoom: next.getZoom() }
      })
      next.setView(viewRef.current.center, viewRef.current.zoom)
      tiles.addTo(next)
      tilesRef.current = tiles
      setMap(next)
      onMap?.(next)
      return () => {
        onMap?.(null)
        setMap(null)
        tilesRef.current = null
        next.remove()
      }
    },
    [picker, onMap],
  )

  // Peta baca saja selalu memuat seluruh penandanya.
  const spots = picker ? "" : markers.map((m) => `${m.lat},${m.lng}`).join(" ")
  useEffect(() => {
    if (!map || !spots) return
    const points = spots.split(" ").map((pair) => pair.split(",").map(Number) as [number, number])
    map.fitBounds(points, { padding: [40, 40], maxZoom: zoom, animate: false })
  }, [map, spots, zoom])

  return (
    <div
      className={cn("relative isolate size-full rounded-md border border-input bg-muted", invalid && "border-destructive")}
    >
      {/* className tetap: Leaflet menambahkan kelasnya sendiri ke elemen ini. */}
      <div
        ref={attach}
        role={picker ? "application" : "img"}
        aria-label={label}
        aria-describedby={describedBy}
        className="relative z-0 size-full rounded-md bg-muted font-sans outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
      />
      {map && markers.map((marker, i) => <Marker key={i} map={map} marker={marker} />)}

      {picker && (
        <>
          {/* Ujung pin 2 px di atas tepi bawah ikonnya. Tanpa ubin, pin tidak menunjuk apa pun. */}
          {!failed && (
            <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 mt-0.5 -translate-x-1/2 -translate-y-full">
              {MARKERS.service.icon}
            </div>
          )}
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
            <Button type="button" variant="outline" size="icon" aria-label="Perbesar peta" onClick={() => map?.zoomIn()}>
              <Plus aria-hidden />
            </Button>
            <Button type="button" variant="outline" size="icon" aria-label="Perkecil peta" onClick={() => map?.zoomOut()}>
              <Minus aria-hidden />
            </Button>
          </div>
        </>
      )}

      {failed && (
        <div
          role="alert"
          className="absolute top-2 left-2 z-10 flex max-w-56 flex-col items-start gap-2 rounded-md border border-border bg-card p-3 text-sm"
        >
          Peta belum termuat. Periksa koneksimu.
          <Button type="button" variant="outline" onClick={() => tilesRef.current?.redraw()}>
            <RotateCw aria-hidden />
            Coba lagi
          </Button>
        </div>
      )}

      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        className="absolute right-0 bottom-0 z-10 rounded-tl-md rounded-br-md bg-card px-2 py-1 text-xs font-medium text-muted-foreground underline-offset-3 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        © OpenStreetMap contributors
      </a>
    </div>
  )
}
