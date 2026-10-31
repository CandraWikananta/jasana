/**
 * Sekali jalan, penerapan D100 di basis data yang sudah ter-seed sebelumnya.
 * `seed-catalog.mjs` tidak menimpa baris lama, jadi durasinya tidak ikut.
 *
 *   - `duration_minutes` diisi dari `catalog-data.mjs` (B.5 dan B.6), hanya
 *     kalau belum ada. Durasi yang sudah diubah admin tidak ditimpa
 *   - opsi "Dua Hari" dinonaktifkan (`is_active = false`, D67), BUKAN dihapus
 *
 * Aman dijalankan berulang, putaran kedua mengubah nol baris. Atribut yang
 * masih punya opsi aktif tanpa durasi setelahnya (misalnya opsi tambahan
 * admin) dilewati dan dilaporkan, karena akan melanggar D100 aturan (3).
 *
 *   node scripts/apply-d100-durations.mjs
 *
 * Basis data tujuannya DATABASE_URL (dari shell, atau dari .env).
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { CATALOG } from './catalog-data.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
loadDotenv({ path: resolve(root, '.env') });

const target = new URL(process.env.DATABASE_URL);
console.log(`Basis data tujuan: ${target.host}${target.pathname}`);

const DEACTIVATE = new Set(['Dua Hari']);

const timedAttributes = CATALOG.flatMap((category) =>
  category.subcategories.flatMap((sub) =>
    sub.attributes
      .filter((attr) => attr.options?.some((option) => option.duration_minutes != null))
      .map((attr) => ({
        categorySlug: category.slug,
        subSlug: sub.slug,
        key: attr.attribute_key,
        minutes: new Map(attr.options.map((option) => [option.value, option.duration_minutes])),
      })),
  ),
);

const prisma = new PrismaClient();
try {
  await prisma.$transaction(async (tx) => {
    for (const attr of timedAttributes) {
      const label = `${attr.subSlug}.${attr.key}`;
      const row = await tx.subcategoryAttribute.findFirst({
        where: { attributeKey: attr.key, subcategory: { slug: attr.subSlug, category: { slug: attr.categorySlug } } },
      });
      if (!row) {
        console.log(`${label}: tidak ada, dilewati.`);
        continue;
      }

      let changed = 0;
      const options = (row.options ?? []).map((option) => {
        if (DEACTIVATE.has(option.value) && option.is_active) {
          changed += 1;
          return { ...option, is_active: false };
        }
        const minutes = attr.minutes.get(option.value);
        if (minutes != null && option.duration_minutes == null) {
          changed += 1;
          return { ...option, duration_minutes: minutes };
        }
        return option;
      });

      const missing = options.filter((option) => option.is_active && option.duration_minutes == null);
      if (missing.length > 0) {
        console.log(`${label}: opsi aktif tanpa durasi (${missing.map((o) => o.value).join(', ')}), dilewati.`);
        continue;
      }
      if (changed > 0) await tx.subcategoryAttribute.update({ where: { id: row.id }, data: { options } });
      console.log(`${label}: ${changed} opsi diubah.`);
    }
  });
} finally {
  await prisma.$disconnect();
}
