/**
 * Pengenal galat Prisma yang punya arti bisnis.
 *
 * Pemeriksaan keunikan di service (misalnya email sudah terdaftar) hanya
 * untuk pesan yang ramah. Penjaga yang sebenarnya tetap unique index, karena
 * dua pendaftaran bersamaan bisa sama-sama lolos pemeriksaan awal. Galat
 * P2002 dari jalur balapan itu diterjemahkan lewat fungsi ini, bukan
 * dibiarkan jadi 500.
 */

import { Prisma } from '@jasana/database';

/** `true` kalau galatnya pelanggaran unique pada kolom `field`. */
export function isUniqueViolation(error: unknown, field: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false;
  }
  const target = error.meta?.target;
  if (Array.isArray(target)) return target.includes(field);
  if (typeof target === 'string') return target.includes(field);
  return false;
}

/**
 * Pelanggaran partial unique index eksklusivitas keanggotaan (H23, D36).
 *
 * Index itu dibuat lewat migrasi SQL manual, jadi `meta.target` bisa berisi
 * nama kolom atau nama index, tergantung cara Prisma membaca pesan
 * PostgreSQL. Keduanya dikenali.
 */
export function isActiveMembershipViolation(error: unknown): boolean {
  return (
    isUniqueViolation(error, 'user_id') ||
    isUniqueViolation(error, 'userId') ||
    isUniqueViolation(error, 'uniq_active_worker_membership')
  );
}

/**
 * Pelanggaran `uniq_inflight_order_per_worker` (H4). Index manual, jadi
 * `meta.target` bisa berupa nama kolom atau nama index.
 */
export function isInflightViolation(error: unknown): boolean {
  // Klaim atomik Available Now memakai $queryRaw, yang membungkus 23505 sebagai P2010
  // dengan pesan `Key (assigned_worker_id)=(...) already exists`, tanpa nama index.
  // Di tabel orders, satu-satunya unique pada kolom itu adalah index in-flight.
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2010') {
    const meta = (error.meta ?? {}) as { code?: string; message?: string };
    return meta.code === '23505' && /\(assigned_worker_id\)|uniq_inflight_order_per_worker/.test(meta.message ?? '');
  }
  return (
    isUniqueViolation(error, 'assigned_worker_id') ||
    isUniqueViolation(error, 'assignedWorkerId') ||
    isUniqueViolation(error, 'uniq_inflight_order_per_worker')
  );
}
