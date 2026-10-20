/**
 * Menyiapkan data demo untuk collection Postman Fase 3 (Katalog).
 *
 *   npm run postman:seed:fase-3
 *
 * Kenapa perlu skrip:
 *   1. Tidak ada endpoint untuk menjadikan akun ADMIN. Itu disengaja.
 *   2. Usulan taksonomi hanya untuk provider VERIFIED (D74). Tanpa skrip,
 *      setiap putaran harus melewati e-KYC lengkap lebih dulu.
 *   3. Katalog Lampiran B harus ada supaya folder katalog publik punya isi.
 *
 * Yang dibuat (semua email @postman.jasana.test, password sama dengan Fase 2):
 *   kadmin    role ADMIN
 *   kprov1    provider VERIFIED "Kilau Sofa Bersih", pengusul utama
 *   kprov2    provider VERIFIED "Bengkel Dua Roda", untuk batas per provider
 *             dan contoh MERGED
 *   kpending  sudah apply, masih PENDING. Usulannya harus ditolak 403
 *   kklien    user biasa
 *
 * Akunnya SENGAJA berbeda dari seed Fase 2, supaya kedua seed tidak saling
 * menghapus. Setiap kali dijalankan:
 *   - akun di atas beserta usulan taksonominya dihapus lalu dibuat ulang
 *   - kategori dan sub-kategori berawalan `postman-f3-` buatan collection
 *     ikut dihapus (atributnya ikut lewat cascade)
 *   - katalog Lampiran B dipastikan ada lewat seedCatalog (idempotent)
 *
 * Basis data tujuannya DATABASE_URL (dari shell, atau dari .env).
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { seedCatalog } from './seed-catalog.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
loadDotenv({ path: resolve(root, '.env') });

if (process.env.NODE_ENV === 'production') {
  console.error('Skrip demo tidak boleh dijalankan dengan NODE_ENV=production.');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL kosong. Isi .env lebih dulu.');
  process.exit(1);
}

const DOMAIN = '@postman.jasana.test';
/** Sama dengan `seed_password` di environment Jasana Lokal. */
const PASSWORD = 'Postman-Jasana-123';
/** PRD 5.1, sama dengan lib/crypto.ts. */
const BCRYPT_COST = 10;
/** Awalan slug katalog buatan collection, dihapus setiap putaran. */
const SLUG_PREFIX = 'postman-f3-';

const ACTORS = [
  { key: 'kadmin', fullName: 'Admin Katalog', phone: '+628990000011', role: 'ADMIN' },
  { key: 'kprov1', fullName: 'Wayan Sofa', phone: '+628990000012', business: 'Kilau Sofa Bersih' },
  { key: 'kprov2', fullName: 'Komang Bengkel', phone: '+628990000013', business: 'Bengkel Dua Roda' },
  { key: 'kpending', fullName: 'Kadek Menunggu', phone: '+628990000014', pending: true },
  { key: 'kklien', fullName: 'Luh Klien', phone: '+628990000015' },
];

const emailOf = (key) => `${key}${DOMAIN}`;

function describeTarget(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}:${parsed.port || 5432}${parsed.pathname}`;
  } catch {
    return '(URL tidak terbaca)';
  }
}

const prisma = new PrismaClient();

async function main() {
  console.log(`Basis data tujuan: ${describeTarget(process.env.DATABASE_URL)}`);
  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_COST);
  const emails = ACTORS.map((actor) => emailOf(actor.key));
  const phones = ACTORS.map((actor) => actor.phone);

  const counts = await prisma.$transaction(
    async (tx) => {
      // ---- Bersihkan putaran sebelumnya --------------------------------------
      const old = await tx.user.findMany({
        where: { OR: [{ email: { in: emails } }, { phone: { in: phones } }] },
        select: { id: true, email: true },
      });
      const foreign = old.filter((user) => !user.email.endsWith(DOMAIN));
      if (foreign.length > 0) {
        throw new Error(
          `Nomor ponsel demo sudah dipakai akun lain (${foreign.map((u) => u.email).join(', ')}). ` +
            'Skrip berhenti supaya tidak menyentuh akun sungguhan.',
        );
      }
      const ids = old.map((user) => user.id);
      if (ids.length > 0) {
        const ownProviders = { providerProfile: { userId: { in: ids } } };
        // provider_workers.user_id memakai `restrict`, jadi dihapus lebih dulu.
        await tx.providerWorker.deleteMany({ where: { OR: [{ userId: { in: ids } }, ownProviders] } });
        await tx.listing.deleteMany({ where: ownProviders });
        // Profil, wallet, usulan taksonomi, token, dan notifikasi ikut lewat cascade.
        await tx.user.deleteMany({ where: { id: { in: ids } } });
      }
      await tx.subcategory.deleteMany({ where: { slug: { startsWith: SLUG_PREFIX } } });
      await tx.category.deleteMany({ where: { slug: { startsWith: SLUG_PREFIX } } });

      // ---- Katalog Lampiran B -------------------------------------------------
      const catalog = await seedCatalog(tx);

      // ---- Akun ---------------------------------------------------------------
      const now = new Date();
      let admin = null;
      for (const actor of ACTORS) {
        const user = await tx.user.create({
          data: {
            fullName: actor.fullName,
            email: emailOf(actor.key),
            phone: actor.phone,
            passwordHash,
            role: actor.role ?? 'CLIENT',
            emailVerifiedAt: now,
          },
        });
        if (actor.role === 'ADMIN') admin = user;

        if (actor.pending) {
          // Seperti hasil apply + unggah e-KYC: menunggu tinjauan admin.
          await tx.providerProfile.create({
            data: { userId: user.id, providerType: 'INDIVIDUAL', verificationStatus: 'PENDING' },
          });
        }

        if (actor.business) {
          // Keadaan persis hasil persetujuan admin (D33): wallet dan baris
          // pekerja pemilik ACTIVE yang bersedia ditugaskan, jadi V6 tetap nol.
          const profile = await tx.providerProfile.create({
            data: {
              userId: user.id,
              providerType: 'INDIVIDUAL',
              businessName: actor.business,
              verificationStatus: 'VERIFIED',
              verifiedAt: now,
              verifiedBy: admin.id,
              wallet: { create: {} },
            },
          });
          await tx.providerWorker.create({
            data: {
              providerProfileId: profile.id,
              userId: user.id,
              displayName: user.fullName,
              isOwner: true,
              membershipStatus: 'ACTIVE',
              acceptsAssignments: true,
              approvedAt: now,
            },
          });
        }
      }
      return catalog;
    },
    { timeout: 60_000 },
  );

  console.log(
    `\nKatalog Lampiran B: ${counts.categories} kategori, ${counts.subcategories} sub-kategori, ` +
      `${counts.attributes} atribut.`,
  );
  console.log('Akun demo siap. Password seluruhnya:', PASSWORD);
  for (const actor of ACTORS) {
    const note = actor.role ? '  (ADMIN)' : actor.business ? `  (VERIFIED, ${actor.business})` : actor.pending ? '  (provider PENDING)' : '';
    console.log(`  ${actor.key.padEnd(9)} ${emailOf(actor.key)}${note}`);
  }
  console.log('\nLanjutkan dengan menjalankan collection "Jasana Backend - Fase 3" dari folder 00.');
}

main()
  .catch((error) => {
    console.error('\nSeed gagal:', error.message ?? error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
