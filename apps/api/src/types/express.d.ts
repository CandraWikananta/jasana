/**
 * Perluasan tipe Express.
 *
 * `req.id` dan `req.log` dipasang pino-http saat berjalan, tapi tipenya tidak
 * ikut terpasang di `Express.Request`. Tanpa deklarasi ini, `strict: true`
 * menolak setiap pemakaian keduanya.
 *
 * `req.user` diisi requireAuth dari klaim access token. Fase selanjutnya
 * menambahkan `req.provider` di sini.
 */

import type { Logger } from 'pino';
import type { UserRole } from '@jasana/database';

declare global {
  namespace Express {
    interface Request {
      /** `request_id` untuk korelasi log, lihat lib/logger.ts. */
      id: string;
      /** Logger anak yang sudah membawa `request_id`. */
      log: Logger;
      /**
       * Pemanggil yang sudah terautentikasi. Peran provider dan pekerja
       * ditandai lewat id relasinya, bukan lewat `role` (D4, D35).
       */
      user?: {
        id: string;
        role: UserRole;
        providerProfileId: string | null;
        workerId: string | null;
      };
    }
  }
}

export {};
