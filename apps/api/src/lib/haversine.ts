/**
 * Geometri pencarian lokasi (D6, D98): bounding box lebih dulu supaya
 * index terpakai, baru Haversine presisi pada baris yang lolos.
 *
 * Koordinat tersimpan `Decimal`, dan perhitungan di sini memakai float8
 * hanya untuk trigonometri, tidak pernah disimpan balik.
 */

import { Prisma } from '@jasana/database';

export const EARTH_RADIUS_KM = 6371;

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/**
 * Kotak terkecil yang pasti memuat seluruh titik berjarak `km` dari pusat.
 * Selisih bujur memakai `asin(sin(d) / cos(lat))`, bukan `d / cos(lat)`,
 * karena titik bujur terjauh lingkaran tidak berada di lintang pusat.
 *
 * shortcut: tidak menangani antimeridian dan kutub, lingkupnya Bali. Pecah
 * kotak jadi dua kalau layanan meluas ke bujur ±180.
 */
export function boundingBox(lat: number, lng: number, km: number): BoundingBox {
  const d = km / EARTH_RADIUS_KM;
  const dLat = toDeg(d);
  const dLng = toDeg(Math.asin(Math.min(1, Math.sin(d) / Math.cos(toRad(lat)))));
  return { minLat: lat - dLat, maxLat: lat + dLat, minLng: lng - dLng, maxLng: lng + dLng };
}

/**
 * Jarak Haversine dalam km sebagai ekspresi SQL. `latCol` dan `lngCol`
 * adalah potongan konstan dari kode, titik client masuk sebagai parameter.
 */
export function haversineKmSql(latCol: Prisma.Sql, lngCol: Prisma.Sql, lat: number, lng: number): Prisma.Sql {
  return Prisma.sql`(2 * ${EARTH_RADIUS_KM}::float8 * asin(sqrt(
    power(sin(radians(${latCol}::float8 - ${lat}::float8) / 2), 2) +
    cos(radians(${lat}::float8)) * cos(radians(${latCol}::float8)) *
    power(sin(radians(${lngCol}::float8 - ${lng}::float8) / 2), 2)
  )))`;
}

/**
 * Kembaran JS dari `haversineKmSql`, rumus dan jari-jari yang sama, supaya
 * pemeriksaan radius di server (D106, check-in di 6e) setuju dengan pencarian.
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const a =
    Math.sin(toRad(lat1 - lat2) / 2) ** 2 +
    Math.cos(toRad(lat2)) * Math.cos(toRad(lat1)) * Math.sin(toRad(lng1 - lng2) / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}
