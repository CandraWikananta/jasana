/**
 * Menyiapkan data demo untuk collection Postman Fase 4 (Listing dan pemetaan).
 *
 *   npm run postman:seed:fase-4
 *
 * Kenapa perlu skrip:
 *   1. Listing hanya untuk provider VERIFIED. Tanpa skrip, setiap putaran
 *      harus melewati e-KYC lengkap lebih dulu.
 *   2. Pemetaan dari dua arah butuh usaha BUSINESS yang sudah punya pekerja
 *      ACTIVE dan pelamar PENDING.
 *   3. Listing dibuat di katalog Lampiran B, jadi katalognya harus ada.
 *
 * Yang dibuat (semua email @postman.jasana.test, password sama dengan Fase 2):
 *   ladmin     role ADMIN, untuk folder perubahan definisi (H48)
 *   lindiv     provider INDIVIDUAL VERIFIED "Cuci Kilat Made"
 *   lbiz       provider BUSINESS VERIFIED "Bengkel Bersama"
 *   lpekerja   pekerja ACTIVE di Bengkel Bersama
 *   lpelamar   pelamar PENDING di Bengkel Bersama, tidak perlu login
 *   lklien     user biasa
 *
 * Akunnya SENGAJA berbeda dari seed Fase 2 dan 3, supaya seed tidak saling
 * menghapus. Setiap kali dijalankan:
 *   - akun di atas beserta listing-nya dihapus lalu dibuat ulang
 *   - kategori dan sub-kategori berawalan `postman-f4-` buatan collection
 *     ikut dihapus
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
const SLUG_PREFIX = 'postman-f4-';

const ACTORS = [
  { key: 'ladmin', fullName: 'Admin Listing', phone: '+628990000021', role: 'ADMIN' },
  { key: 'lindiv', fullName: 'Made Kilat', phone: '+628990000022', provider: 'INDIVIDUAL', business: 'Cuci Kilat Made' },
  { key: 'lbiz', fullName: 'Nyoman Bengkel', phone: '+628990000023', provider: 'BUSINESS', business: 'Bengkel Bersama' },
  { key: 'lpekerja', fullName: 'Gede Pekerja', phone: '+628990000024', worker: 'ACTIVE' },
  { key: 'lpelamar', fullName: 'Putu Pelamar', phone: '+628990000025', worker: 'PENDING' },
  { key: 'lklien', fullName: 'Ayu Klien', phone: '+628990000026' },
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
        // Foto, FAQ, harga opsi, dan pemetaan ikut lewat cascade.
        await tx.listing.deleteMany({ where: ownProviders });
        await tx.user.deleteMany({ where: { id: { in: ids } } });
      }
      // listings.subcategory_id memakai `restrict`: listing di sub-kategori
      // demo sudah terhapus di atas karena milik akun demo.
      await tx.subcategory.deleteMany({ where: { slug: { startsWith: SLUG_PREFIX } } });
      await tx.category.deleteMany({ where: { slug: { startsWith: SLUG_PREFIX } } });

      // ---- Katalog Lampiran B -------------------------------------------------
      const catalog = await seedCatalog(tx);

      // ---- Akun ---------------------------------------------------------------
      const now = new Date();
      const users = {};
      for (const actor of ACTORS) {
        users[actor.key] = await tx.user.create({
          data: {
            fullName: actor.fullName,
            email: emailOf(actor.key),
            phone: actor.phone,
            passwordHash,
            role: actor.role ?? 'CLIENT',
            emailVerifiedAt: now,
          },
        });
      }

      // Keadaan persis hasil persetujuan admin (D33): wallet dan baris pekerja
      // pemilik ACTIVE yang bersedia ditugaskan, jadi V6 tetap nol.
      const profiles = {};
      for (const actor of ACTORS.filter((a) => a.provider)) {
        const user = users[actor.key];
        profiles[actor.key] = await tx.providerProfile.create({
          data: {
            userId: user.id,
            providerType: actor.provider,
            businessName: actor.business,
            verificationStatus: 'VERIFIED',
            verifiedAt: now,
            verifiedBy: users.ladmin.id,
            wallet: { create: {} },
          },
        });
        await tx.providerWorker.create({
          data: {
            providerProfileId: profiles[actor.key].id,
            userId: user.id,
            displayName: user.fullName,
            isOwner: true,
            membershipStatus: 'ACTIVE',
            acceptsAssignments: true,
            approvedAt: now,
          },
        });
      }

      for (const actor of ACTORS.filter((a) => a.worker)) {
        const user = users[actor.key];
        await tx.providerWorker.create({
          data: {
            providerProfileId: profiles.lbiz.id,
            userId: user.id,
            displayName: user.fullName,
            experienceNote: actor.worker === 'PENDING' ? 'Setahun di bengkel cuci' : null,
            membershipStatus: actor.worker,
            ...(actor.worker === 'ACTIVE' ? { approvedBy: users.lbiz.id, approvedAt: now } : {}),
          },
        });
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
  const notes = {
    ladmin: '(ADMIN)',
    lindiv: '(INDIVIDUAL VERIFIED, Cuci Kilat Made)',
    lbiz: '(BUSINESS VERIFIED, Bengkel Bersama)',
    lpekerja: '(pekerja ACTIVE di Bengkel Bersama)',
    lpelamar: '(pelamar PENDING di Bengkel Bersama)',
    lklien: '',
  };
  for (const actor of ACTORS) console.log(`  ${actor.key.padEnd(9)} ${emailOf(actor.key)}  ${notes[actor.key]}`);
  console.log('\nLanjutkan dengan menjalankan collection "Jasana Backend - Fase 4" dari folder 00.');
}

main()
  .catch((error) => {
    console.error('\nSeed gagal:', error.message ?? error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
