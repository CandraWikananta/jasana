/**
 * Menonaktifkan kategori dan sub-kategori demo (H16, usulan D173) sebelum
 * evaluasi akurasi dan UAT. DIJALANKAN PENYUSUN, ke basis data DATABASE_URL.
 *
 *   node scripts/deactivate-demo-taxonomy.mjs           dry-run, hanya mencetak target
 *   node scripts/deactivate-demo-taxonomy.mjs --apply   menonaktifkan target
 *
 * Kriteria: setiap kategori atau sub-kategori AKTIF yang pasangan slug-nya
 * tidak ada di taksonomi resmi `scripts/catalog-data.mjs` (Lampiran B, empat
 * kategori dan dua belas sub-kategori). Kriteria ini tidak menebak dari nama,
 * jadi menangkap sisa seed Postman (slug `postman-*`), nama "(Demo ...)", dan
 * kategori ganda seperti "Otomotif" kedua, apa pun slug-nya.
 *
 * Hanya `is_active = false`. Tidak ada baris yang dihapus, karena listing dan
 * order lama masih merujuknya. Sub-kategori resmi di bawah kategori demo tidak
 * mungkin ada, karena kategori resmi dicocokkan dari slug-nya sendiri.
 *
 * Server API menyimpan daftar sub-kategori aktif untuk prompt chatbot di cache
 * 5 menit. Setelah --apply, restart server atau tunggu 5 menit.
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { CATALOG } from './catalog-data.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const apply = process.argv.includes('--apply');

function describeTarget(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}:${parsed.port || 5432}${parsed.pathname}`;
  } catch {
    return '(URL tidak terbaca)';
  }
}

/** Pasangan resmi, diekspor untuk diuji. */
export const OFFICIAL_CATEGORIES = new Set(CATALOG.map((c) => c.slug));
export const OFFICIAL_SUBCATEGORIES = new Set(CATALOG.flatMap((c) => c.subcategories.map((s) => `${c.slug}/${s.slug}`)));

/** Murni, supaya kriterianya bisa diuji tanpa basis data. */
export function demoTargets(categories) {
  const targets = [];
  for (const category of categories) {
    const officialCategory = OFFICIAL_CATEGORIES.has(category.slug);
    if (category.isActive && !officialCategory) {
      targets.push({ jenis: 'kategori', id: category.id, nama: category.name, slug: category.slug, induk: '-', dibuat: category.createdAt, listingAktif: category.activeListings, alasan: 'slug kategori bukan taksonomi resmi' });
    }
    for (const sub of category.subcategories) {
      if (!sub.isActive || OFFICIAL_SUBCATEGORIES.has(`${category.slug}/${sub.slug}`)) continue;
      targets.push({
        jenis: 'sub-kategori', id: sub.id, nama: sub.name, slug: sub.slug, induk: `${category.name} (${category.slug})`, dibuat: sub.createdAt,
        listingAktif: sub.activeListings,
        alasan: officialCategory ? 'sub-kategori bukan taksonomi resmi' : 'di bawah kategori bukan taksonomi resmi',
      });
    }
  }
  return targets;
}

async function main() {
  loadDotenv({ path: resolve(root, '.env') });
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL kosong. Isi .env lebih dulu.');
    process.exitCode = 1;
    return;
  }
  const prisma = new PrismaClient();
  try {
    console.log(`Basis data tujuan: ${describeTarget(process.env.DATABASE_URL)}`);
    console.log(`Mode: ${apply ? 'APPLY, target akan dinonaktifkan' : 'dry-run, tidak ada yang diubah'}\n`);

    const activeListing = { where: { status: 'ACTIVE', deletedAt: null } };
    const rows = await prisma.category.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true, name: true, slug: true, isActive: true, createdAt: true,
        subcategories: {
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
          select: { id: true, name: true, slug: true, isActive: true, createdAt: true, _count: { select: { listings: activeListing } } },
        },
      },
    });
    const categories = rows.map((c) => ({
      ...c,
      activeListings: c.subcategories.reduce((sum, s) => sum + s._count.listings, 0),
      subcategories: c.subcategories.map((s) => ({ ...s, activeListings: s._count.listings })),
    }));

    const missing = [...OFFICIAL_SUBCATEGORIES].filter(
      (key) => !categories.some((c) => c.subcategories.some((s) => `${c.slug}/${s.slug}` === key && s.isActive && c.isActive)),
    );
    if (missing.length) console.log(`PERHATIAN: sub-kategori resmi yang tidak aktif atau belum ada: ${missing.join(', ')}\n`);

    const targets = demoTargets(categories);
    if (targets.length === 0) {
      console.log('Tidak ada kategori atau sub-kategori demo yang aktif.');
      return;
    }
    console.table(
      targets.map((t) => ({ jenis: t.jenis, nama: t.nama, slug: t.slug, induk: t.induk, dibuat: t.dibuat.toISOString().slice(0, 10), listing_aktif: t.listingAktif, alasan: t.alasan })),
    );

    if (!apply) {
      console.log(`\n${targets.length} target. Periksa daftarnya, lalu jalankan ulang dengan --apply.`);
      return;
    }
    await prisma.$transaction([
      prisma.category.updateMany({ where: { id: { in: targets.filter((t) => t.jenis === 'kategori').map((t) => t.id) } }, data: { isActive: false } }),
      prisma.subcategory.updateMany({ where: { id: { in: targets.filter((t) => t.jenis === 'sub-kategori').map((t) => t.id) } }, data: { isActive: false } }),
    ]);
    console.log(`\n${targets.length} target dinonaktifkan. Restart server API atau tunggu 5 menit (cache sub-kategori chatbot).`);
  } finally {
    await prisma.$disconnect();
  }
}

// Hanya jalan kalau dipanggil langsung, supaya test bisa mengimpor demoTargets.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
