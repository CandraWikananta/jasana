/**
 * Waktu untuk dibaca manusia, dalam WITA (UTC+8 tetap, tanpa daylight saving, D154).
 * Ditulis manual, bukan Intl, supaya keluarannya tidak bergantung versi ICU Node.
 */

const WITA_OFFSET_MS = 8 * 60 * 60 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const pad = (n: number) => String(n).padStart(2, '0');

/** `18 Nov 2026 pukul 00.24 WITA`, untuk isi notifikasi, email, dan pesan galat. */
export function formatWita(date: Date): string {
  const w = new Date(date.getTime() + WITA_OFFSET_MS);
  return `${w.getUTCDate()} ${MONTHS[w.getUTCMonth()]} ${w.getUTCFullYear()} pukul ${pad(w.getUTCHours())}.${pad(w.getUTCMinutes())} WITA`;
}

/** `YYYYMMDD` menurut hari kalender WITA. */
export function witaDateKey(date: Date): string {
  return new Date(date.getTime() + WITA_OFFSET_MS).toISOString().slice(0, 10).replace(/-/g, '');
}
