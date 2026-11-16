/**
 * Satu-satunya tempat PrismaClient dibuat.
 *
 * Modul lain mengimpor `prisma` dari sini, tidak pernah `new PrismaClient()`
 * sendiri. Dua instance berarti dua connection pool, dan pada Supabase itu
 * cepat menghabiskan batas koneksi.
 *
 * Ingat aturan lapisan: hanya service yang boleh menyentuh `prisma`,
 * controller tidak boleh.
 */

import { PrismaClient, Prisma } from '@prisma/client';

export { Prisma, PrismaClient };
export * from '@prisma/client';

/**
 * Di mode development, `tsx watch` memuat ulang modul setiap kali berkas
 * berubah. Tanpa cache di globalThis, setiap reload menambah pool baru
 * sampai basis data menolak koneksi.
 */
const globalForPrisma = globalThis as unknown as {
  __jasanaPrisma?: PrismaClient;
};

/**
 * Batas transaksi interaktif (`prisma.$transaction(async (tx) => ...)`) untuk
 * seluruh aplikasi. Bawaan Prisma 5000 ms tidak cukup saat API lokal terhubung
 * ke basis data jarak jauh (Supabase dev): accept Scheduled kena P2028 di 5123 ms.
 * Waktunya habis di latensi jaringan per kueri, bukan pekerjaan berat, jadi yang
 * dinaikkan batasnya, logika transaksi tidak diubah. Diekspor ulang lewat
 * `apps/api/src/config/constants.ts`; nilainya di sini karena paket ini tidak
 * boleh bergantung pada aplikasi.
 */
export const TRANSACTION_TIMEOUT_MS = 15_000;
/** Lama menunggu koneksi dari pool sebelum transaksi dimulai. */
export const TRANSACTION_MAX_WAIT_MS = 5_000;

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    transactionOptions: { timeout: TRANSACTION_TIMEOUT_MS, maxWait: TRANSACTION_MAX_WAIT_MS },
    log:
      // Env test ikut, supaya test bisa menghitung kueri per giliran chat (H111).
      process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ]
        : [
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ],
  });
}

export const prisma: PrismaClient =
  globalForPrisma.__jasanaPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__jasanaPrisma = prisma;
}

/**
 * Cek kesehatan koneksi basis data, dipakai `GET /health`.
 *
 * Sengaja `SELECT 1` dan bukan kueri ke tabel mana pun: yang diperiksa
 * ketersambungan pool, bukan isi data.
 */
export async function checkDatabaseConnection(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
