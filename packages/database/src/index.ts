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

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
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
