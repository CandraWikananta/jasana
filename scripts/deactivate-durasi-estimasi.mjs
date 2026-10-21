/**
 * Sekali jalan, penerapan D90 di basis data yang sudah ter-seed Fase 3.
 *
 * Atribut `durasi_estimasi` dinonaktifkan (`is_active = false`), BUKAN
 * dihapus (D67 poin 3): nilai lama di `listings.attributes` tetap punya arti.
 * Aman dijalankan berulang, putaran kedua mengubah nol baris.
 *
 *   node scripts/deactivate-durasi-estimasi.mjs
 *
 * Basis data tujuannya DATABASE_URL (dari shell, atau dari .env).
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import { PrismaClient } from '@prisma/client';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
loadDotenv({ path: resolve(root, '.env') });

const target = new URL(process.env.DATABASE_URL);
console.log(`Basis data tujuan: ${target.host}${target.pathname}`);

const prisma = new PrismaClient();
try {
  const result = await prisma.subcategoryAttribute.updateMany({
    where: { attributeKey: 'durasi_estimasi', isActive: true },
    data: { isActive: false },
  });
  const total = await prisma.subcategoryAttribute.count({ where: { attributeKey: 'durasi_estimasi' } });
  console.log(`Dinonaktifkan ${result.count} baris, total baris durasi_estimasi ${total} (tidak ada yang dihapus).`);
} finally {
  await prisma.$disconnect();
}
