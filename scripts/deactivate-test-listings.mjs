/**
 * Menonaktifkan listing ACTIVE sisa uji Postman dan sandbox sebelum UAT (lingkup B
 * sesi data simulasi, usulan D208). DIJALANKAN PENYUSUN, ke basis data DATABASE_URL.
 *
 *   npm run listings:deactivate-test              dry-run, hanya mencetak target
 *   npm run listings:deactivate-test -- --apply   status target menjadi INACTIVE
 *
 * Target, salah satu:
 *   1. Pemilik usahanya ber-email domain uji `.test` (contoh @postman.jasana.test,
 *      @uji.test), KECUALI data simulasi @sim.jasana.test dan admin @uat.jasana.test
 *   2. Sub-kategori atau kategorinya sudah nonaktif (dua listing temuan sandbox 9c)
 *
 * Akunnya dibiarkan, jadi login dan regresi Postman tetap jalan. Tidak ada baris yang
 * dihapus. Seed Postman yang dijalankan lagi ke basis data yang sama akan membuat
 * listing uji ACTIVE baru, jadi jalankan ulang skrip ini sesudahnya.
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import { PrismaClient } from '@prisma/client';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const apply = process.argv.includes('--apply');
const KEEP = ['@sim.jasana.test', '@uat.jasana.test'];

/** Murni: alasan listing jadi target, atau null. */
export function targetReason(listing) {
  const email = listing.providerProfile.user.email.toLowerCase();
  if (!listing.subcategory.isActive || !listing.subcategory.category.isActive) return 'taksonomi nonaktif';
  if (email.endsWith('.test') && !KEEP.some((d) => email.endsWith(d))) return 'akun uji';
  return null;
}

async function main() {
  loadDotenv({ path: resolve(root, '.env') });
  if (process.env.NODE_ENV === 'production') {
    console.error('Tidak untuk NODE_ENV=production.');
    process.exitCode = 1;
    return;
  }
  let target;
  try {
    const url = new URL(process.env.DATABASE_URL ?? '');
    target = `${url.hostname}${url.pathname}`;
  } catch {
    console.error('DATABASE_URL kosong atau bukan URL.');
    process.exitCode = 1;
    return;
  }
  const prisma = new PrismaClient();
  try {
    console.log(`Basis data tujuan: ${target}`);
    console.log(`Mode: ${apply ? 'APPLY, target menjadi INACTIVE' : 'dry-run, tidak ada yang diubah'}\n`);
    const listings = await prisma.listing.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, title: true,
        providerProfile: { select: { businessName: true, user: { select: { email: true } } } },
        subcategory: { select: { slug: true, isActive: true, category: { select: { slug: true, isActive: true } } } },
      },
    });
    const targets = listings
      .map((l) => ({ l, alasan: targetReason(l) }))
      .filter((x) => x.alasan !== null)
      .map(({ l, alasan }) => ({
        id: l.id, judul: l.title, usaha: l.providerProfile.businessName, pemilik: l.providerProfile.user.email,
        taksonomi: `${l.subcategory.category.slug}/${l.subcategory.slug}`, alasan,
      }));
    if (targets.length === 0) {
      console.log('Tidak ada target.');
      return;
    }
    console.table(targets);
    if (!apply) {
      console.log(`\n${targets.length} listing akan dinonaktifkan. Jalankan dengan --apply untuk menerapkan.`);
      return;
    }
    const { count } = await prisma.listing.updateMany({ where: { id: { in: targets.map((t) => t.id) }, status: 'ACTIVE' }, data: { status: 'INACTIVE' } });
    console.log(`\n${count} listing menjadi INACTIVE.`);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
