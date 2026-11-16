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

const DAY_MS = 24 * 60 * 60 * 1000;

export interface WitaPeriod {
  /** `YYYY-MM-DD` hari WITA, inklusif. */
  from: string;
  to: string;
  /** 00.00 WITA hari `from`, dalam UTC. */
  start: Date;
  /** 00.00 WITA hari SESUDAH `to`, dalam UTC (eksklusif). */
  end: Date;
  days: number;
}

/**
 * Batas UTC periode laporan per hari kalender WITA (D180, usulan D200). `from` dan `to` sudah
 * divalidasi berformat `YYYY-MM-DD`. Filter laporan `kolom >= start AND kolom < end`.
 */
export function witaPeriod(from: string, to: string): WitaPeriod {
  const start = new Date(Date.parse(`${from}T00:00:00Z`) - WITA_OFFSET_MS);
  const end = new Date(Date.parse(`${to}T00:00:00Z`) + DAY_MS - WITA_OFFSET_MS);
  return { from, to, start, end, days: Math.round((end.getTime() - start.getTime()) / DAY_MS) };
}
