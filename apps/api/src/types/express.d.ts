/**
 * Perluasan tipe Express.
 *
 * `req.id` dan `req.log` dipasang pino-http saat berjalan, tapi tipenya tidak
 * ikut terpasang di `Express.Request`. Tanpa deklarasi ini, `strict: true`
 * menolak setiap pemakaian keduanya.
 *
 * Fase selanjutnya menambahkan `req.user` dan `req.provider` di sini.
 */

import type { Logger } from 'pino';

declare global {
  namespace Express {
    interface Request {
      /** `request_id` untuk korelasi log, lihat lib/logger.ts. */
      id: string;
      /** Logger anak yang sudah membawa `request_id`. */
      log: Logger;
    }
  }
}

export {};
