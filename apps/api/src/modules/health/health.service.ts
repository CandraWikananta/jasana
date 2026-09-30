/**
 * Service health check.
 *
 * Tidak menyentuh `req` atau `res` sama sekali: yang dikembalikan objek
 * biasa, dan controller yang mengubahnya jadi respons. Karena itu service
 * ini bisa diuji tanpa HTTP.
 */

import { checkDatabaseConnection } from '@jasana/database';
import { HEALTH_DB_TIMEOUT_MS } from '../../config/constants';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  /** `up` kalau `SELECT 1` berhasil dalam batas waktu. */
  database: 'up' | 'down';
  /** Detik sejak proses mulai, dibulatkan. */
  uptime_seconds: number;
  timestamp: string;
  /** Hanya terisi kalau basis data gagal, untuk log dan diagnosis. */
  database_error?: string;
}

/**
 * Membatasi waktu tunggu pemeriksaan basis data.
 *
 * Perlu karena koneksi yang menggantung tidak pernah reject sendiri: pool
 * akan menunggu selama masih ada harapan dapat koneksi. Health check yang
 * menggantung tidak lebih berguna daripada yang salah.
 */
async function withTimeout<T>(task: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      task,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Basis data tidak menjawab dalam ${ms} ms`)),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Status API beserta basis datanya.
 *
 * Sengaja TIDAK melempar saat basis data mati. Health check yang melempar
 * akan jatuh ke errorHandler sebagai 500 INTERNAL_ERROR, padahal yang benar
 * 503 SERVICE_UNAVAILABLE (Lampiran A.2). Jadi kegagalan dikembalikan
 * sebagai data, dan controller yang memutuskan statusnya.
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  const base = {
    uptime_seconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };

  try {
    await withTimeout(checkDatabaseConnection(), HEALTH_DB_TIMEOUT_MS);
    return { status: 'ok', database: 'up', ...base };
  } catch (error) {
    return {
      status: 'degraded',
      database: 'down',
      ...base,
      database_error: error instanceof Error ? error.message : 'Penyebab tidak diketahui',
    };
  }
}
