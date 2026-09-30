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
