/**
 * Seed katalog contoh Lampiran B: 4 kategori, 12 sub-kategori, dan
 * atributnya (D71).
 *
 *   npm run db:seed:catalog
 *
 * IDEMPOTENT: aman dijalankan berulang. Baris yang sudah ada TIDAK
 * ditimpa (`update: {}`), hanya yang belum ada yang dibuat. Menimpa justru
 * berbahaya setelah katalog dipakai: option yang ditambahkan admin lewat
 * usulan taksonomi akan hilang (D67 poin 3), dan tipe atribut yang sudah
 * dikunci bisa berubah diam-diam.
 *
 * Basis data tujuannya DATABASE_URL (dari shell, atau dari .env).
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CATALOG } from './catalog-data.mjs';

/** Menerima PrismaClient atau transaction client, dipakai juga oleh uji dan seed Postman. */
export async function seedCatalog(prisma) {
  let attributeCount = 0;

  for (const [categoryOrder, category] of CATALOG.entries()) {
    const categoryRow = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: { name: category.name, slug: category.slug, displayOrder: categoryOrder },
    });

    for (const [subOrder, sub] of category.subcategories.entries()) {
      const subRow = await prisma.subcategory.upsert({
        where: { categoryId_slug: { categoryId: categoryRow.id, slug: sub.slug } },
        update: {},
        create: {
          categoryId: categoryRow.id,
          name: sub.name,
          slug: sub.slug,
          suggestedPriceMin: sub.suggested_price_min,
          suggestedPriceMax: sub.suggested_price_max,
          displayOrder: subOrder,
        },
      });

      for (const [attrOrder, attr] of sub.attributes.entries()) {
        await prisma.subcategoryAttribute.upsert({
          where: {
            subcategoryId_attributeKey: { subcategoryId: subRow.id, attributeKey: attr.attribute_key },
          },
          update: {},
          create: {
            subcategoryId: subRow.id,
            attributeKey: attr.attribute_key,
            label: attr.label,
            dataType: attr.data_type,
            attributeRole: attr.attribute_role,
            pricingMode: attr.pricing_mode,
            options: attr.options ?? undefined,
            unit: attr.unit ?? null,
            isRequired: attr.is_required,
            isFilterable: attr.is_filterable,
            validationRule: attr.validation_rule ?? undefined,
            displayOrder: attrOrder,
          },
        });
        attributeCount += 1;
      }
    }
  }

  return {
    categories: CATALOG.length,
    subcategories: CATALOG.reduce((sum, category) => sum + category.subcategories.length, 0),
    attributes: attributeCount,
  };
}

async function main() {
  const { config: loadDotenv } = await import('dotenv');
  loadDotenv({ path: resolve(dirname(fileURLToPath(import.meta.url)), '..', '.env') });
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL kosong. Isi .env lebih dulu.');
    process.exit(1);
  }

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  try {
    // Sekitar 70 upsert berurutan; batas bawaan 5 detik tidak cukup ke Supabase.
    const counts = await prisma.$transaction((tx) => seedCatalog(tx), { timeout: 60_000 });
    console.log(
      `Katalog siap: ${counts.categories} kategori, ${counts.subcategories} sub-kategori, ` +
        `${counts.attributes} atribut (yang sudah ada tidak diubah).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error('Seed katalog gagal:', error.message ?? error);
    process.exitCode = 1;
  });
}
