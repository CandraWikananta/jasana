/**
 * Titik masuk proses.
 *
 * `./config/env` diimpor PALING AWAL dan itu disengaja: modul tersebut
 * memvalidasi environment saat diimpor, jadi konfigurasi yang kurang
 * menghentikan proses sebelum Express dan Prisma dibentuk.
 */

import { env } from './config/env';
import { createApp } from './app';
import { logger } from './lib/logger';
import { disconnectDatabase } from '@jasana/database';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV, base_url: `http://localhost:${env.PORT}` },
    'Jasana API berjalan',
  );
});

/**
 * Penutupan tertib.
 *
 * Koneksi Prisma ditutup SETELAH server berhenti menerima permintaan, bukan
 * sebelumnya. Kalau dibalik, permintaan yang sedang jalan kehilangan koneksi
 * di tengah transaksi.
 */
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Sinyal berhenti diterima, menutup server');

  const forceExit = setTimeout(() => {
    logger.error('Penutupan tertib melewati batas waktu, proses dihentikan paksa');
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  server.close(async (error) => {
    if (error) {
      logger.error({ err: error }, 'Gagal menutup server HTTP');
    }
    try {
      await disconnectDatabase();
      logger.info('Koneksi basis data ditutup');
    } catch (disconnectError) {
      logger.error({ err: disconnectError }, 'Gagal menutup koneksi basis data');
    }
    process.exit(error ? 1 : 0);
  });
}

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => void shutdown(signal));
}

/**
 * Error yang tidak tertangani dicatat lalu proses dihentikan.
 *
 * Membiarkan proses hidup setelah `uncaughtException` berarti menjalankan
 * aplikasi dengan state yang tidak bisa dipastikan, dan untuk sistem yang
 * memegang uang itu lebih berbahaya daripada mati.
 */
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'uncaughtException, proses dihentikan');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'unhandledRejection, proses dihentikan');
  process.exit(1);
});
