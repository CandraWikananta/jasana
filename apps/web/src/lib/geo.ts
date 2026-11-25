export interface Point {
  lat: number
  lng: number
}

/** Di bawah zoom ini satu piksel sudah lebih dari 2 meter, jadi titiknya terlalu kasar untuk check-in pekerja. */
export const MIN_PIN_ZOOM = 16

const round = (degrees: number) => Number(degrees.toFixed(6))
/** Sekitar setengah meter. */
const SAME_SPOT = 5e-6

/**
 * Titik pin setelah peta berhenti bergerak. Memperbesar atau memperkecil saja tidak mengubah titik;
 * menggeser saat peta belum cukup dekat membatalkannya, karena pin sudah tidak di tempat semula.
 */
export function pickPoint(center: Point, zoom: number, current: Point | null): Point | null {
  if (current && Math.abs(center.lat - current.lat) < SAME_SPOT && Math.abs(center.lng - current.lng) < SAME_SPOT) {
    return current
  }
  return zoom >= MIN_PIN_ZOOM ? { lat: round(center.lat), lng: round(center.lng) } : null
}

/** Lokasi perangkat sekali baca. Ditolak, kehabisan waktu, atau tidak didukung: promise ditolak. */
export function getCurrentPoint(): Promise<Point> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("geolocation"))
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  })
}
