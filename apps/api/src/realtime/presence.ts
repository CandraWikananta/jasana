/**
 * Pelacak pekerja online di memori proses (D65, D99).
 *
 * Online = punya koneksi Socket.IO yang hidup, ATAU denyut terakhir masih di
 * dalam `worker_presence_timeout_minutes` (toleransi putus sinyal sesaat).
 * Toleransinya dikirim pemanggil dari `platform_settings`, tidak disimpan di sini.
 *
 * shortcut: memori satu proses, valid karena API berjalan satu instance (D99).
 * Upgrade ke Redis kalau API dijalankan di beberapa server.
 */

import { getNumberSetting } from '../modules/settings/settings.service';

interface Presence {
  sockets: number;
  lastSeen: number;
}

const MINUTE = 60_000;
const workers = new Map<string, Presence>();
let startedAt = Date.now();

const fresh = (lastSeen: number, timeoutMinutes: number) => Date.now() - lastSeen < timeoutMinutes * MINUTE;

export const presence = {
  connect(workerId: string): void {
    const entry = workers.get(workerId);
    workers.set(workerId, { sockets: (entry?.sockets ?? 0) + 1, lastSeen: Date.now() });
  },

  disconnect(workerId: string): void {
    const entry = workers.get(workerId);
    if (entry) workers.set(workerId, { sockets: Math.max(0, entry.sockets - 1), lastSeen: Date.now() });
  },

  /** Event `worker:presence`, dan endpoint dev H92. */
  touch(workerId: string): void {
    workers.set(workerId, { sockets: workers.get(workerId)?.sockets ?? 0, lastSeen: Date.now() });
  },

  /** Untuk `id = ANY(...)` di pencocokan dan pencarian (D99). */
  onlineWorkerIds(timeoutMinutes: number): string[] {
    return [...workers].filter(([, p]) => p.sockets > 0 || fresh(p.lastSeen, timeoutMinutes)).map(([id]) => id);
  },

  /**
   * Untuk cron sweep (H40). Pekerja yang belum pernah terlihat dihitung sejak
   * proses mulai, supaya restart tidak langsung mematikan toggle semua orang
   * sebelum mereka sempat tersambung ulang.
   */
  isStale(workerId: string, timeoutMinutes: number): boolean {
    const entry = workers.get(workerId);
    if (entry?.sockets) return false;
    return !fresh(entry?.lastSeen ?? startedAt, timeoutMinutes);
  },

  /** Hanya untuk test. */
  reset(now = Date.now()): void {
    workers.clear();
    startedAt = now;
  },
};

/** Daftar online dengan toleransi dari `platform_settings` (PRD 3.5). */
export async function currentOnlineWorkerIds(): Promise<string[]> {
  return presence.onlineWorkerIds(await getNumberSetting('worker_presence_timeout_minutes'));
}
