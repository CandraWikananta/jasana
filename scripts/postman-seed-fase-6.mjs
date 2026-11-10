/**
 * Menyiapkan data demo untuk collection Postman Fase 6 (Order Scheduled).
 *
 *   npm run postman:seed:fase-6
 *
 * Satu usaha BUSINESS dengan dua pekerja dan satu listing Dokumentasi Acara
 * (B.6) yang punya opsi berdurasi (D100) dan menerima kedua mode, ditambah dua
 * client. Order sendiri dibuat oleh collection lewat API, bukan oleh skrip ini.
 *
 * Available Now (sesi 6d): dfoto1 dan dfoto2 toggle-nya menyala dengan posisi
 * dekat Renon, tapi baru dianggap online setelah collection memanggil
 * POST /dev/workers/presence (H92). Pemilik tidak pernah online.
 *
 *   downer   pemilik "Lensa Sanur Dokumentasi", basis Sanur, radius 15 km
 *   dfoto1   pekerja, terpetakan ke listing
 *   dfoto2   pekerja, terpetakan ke listing
 *   dklien   client, alamat tersimpan di Renon (sekitar 3,6 km dari Sanur)
 *   dasing   client lain, untuk uji akses 403
 *
 * Akunnya @postman.jasana.test berawalan `d`, berbeda dari seed fase lain.
 * Setiap kali dijalankan, akun beserta listing, order, dan payment-nya dihapus
 * lalu dibuat ulang. Katalog Lampiran B dipastikan ada lewat seedCatalog.
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
const BCRYPT_COST = 10;

const SANUR = { lat: -8.6885, lng: 115.262 };
const RENON = { lat: -8.6725, lng: 115.234 };
/** Posisi pekerja untuk Available Now, sekitar 0,4 dan 1 km dari alamat dklien. */
const WORKER_AT = { dfoto1: { lat: -8.669, lng: 115.235 }, dfoto2: { lat: -8.6635, lng: 115.237 } };

const ACTORS = [
  { key: 'downer', fullName: 'Wayan Lensa', phone: '+628990000061' },
  { key: 'dfoto1', fullName: 'Made Fotografer', phone: '+628990000062' },
  { key: 'dfoto2', fullName: 'Komang Videografer', phone: '+628990000063' },
  { key: 'dklien', fullName: 'Ayu Pemesan', phone: '+628990000064' },
  { key: 'dasing', fullName: 'Ketut Orang Lain', phone: '+628990000065' },
];

/** [attribute_key, option_value | null, price_delta] */
const OPTIONS = [
  ['jenis_acara', 'Seminar', 0],
  ['jenis_acara', 'Pernikahan', 500000],
  ['durasi_liputan', '2 Jam', 0],
  ['durasi_liputan', '4 Jam', 600000],
  ['durasi_liputan', '8 Jam', 1500000],
  ['tambahan', 'Drone', 750000],
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

  await prisma.$transaction(
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
        const orders = { OR: [{ clientId: { in: ids } }, ownProviders] };
        // D130: SATU-SATUNYA pengecualian aturan ledger append-only (CLAUDE.md aturan 3).
        // Sejak 7b simulate-payment menulis ESCROW_HOLD, dan menghapus akun demo ikut menghapus
        // wallet lewat cascade padahal wallet_transactions restrict, jadi seed tidak bisa diulang.
        // Diizinkan karena yang dihapus hanya ledger wallet milik akun demo seed ini (email persis
        // dari ACTORS), datanya buatan tanpa nilai audit, dan NODE_ENV=production sudah ditolak di atas.
        await tx.walletTransaction.deleteMany({ where: { wallet: { providerProfile: { user: { email: { in: emails } } } } } });
        // payments.order_id dan refunds restrict, jadi dihapus sebelum order.
        await tx.payment.deleteMany({ where: { order: orders } });
        await tx.order.deleteMany({ where: orders });
        await tx.providerWorker.deleteMany({ where: { OR: [{ userId: { in: ids } }, ownProviders] } });
        await tx.listing.deleteMany({ where: ownProviders });
        await tx.user.deleteMany({ where: { id: { in: ids } } });
      }

      await seedCatalog(tx);
      const subcategory = await tx.subcategory.findFirstOrThrow({ where: { slug: 'dokumentasi-acara' }, select: { id: true } });

      // ---- Akun ---------------------------------------------------------------
      const now = new Date();
      const users = {};
      for (const actor of ACTORS) {
        users[actor.key] = await tx.user.create({
          data: { fullName: actor.fullName, email: emailOf(actor.key), phone: actor.phone, passwordHash, emailVerifiedAt: now },
        });
      }
      await tx.userAddress.create({
        data: { userId: users.dklien.id, label: 'Rumah', addressLine: 'Jl. Raya Puputan, Renon', latitude: RENON.lat, longitude: RENON.lng, isDefault: true },
      });

      // ---- Usaha dan pekerja (keadaan hasil persetujuan admin, D33) -----------
      const provider = await tx.providerProfile.create({
        data: {
          userId: users.downer.id,
          providerType: 'BUSINESS',
          businessName: 'Lensa Sanur Dokumentasi',
          verificationStatus: 'VERIFIED',
          verifiedAt: now,
          baseAddress: 'Sanur, Bali',
          baseLatitude: SANUR.lat,
          baseLongitude: SANUR.lng,
          serviceRadiusKm: 15,
          wallet: { create: {} },
        },
      });
      const workers = [];
      for (const key of ['downer', 'dfoto1', 'dfoto2']) {
        workers.push(
          await tx.providerWorker.create({
            data: {
              providerProfileId: provider.id,
              userId: users[key].id,
              displayName: users[key].fullName,
              isOwner: key === 'downer',
              membershipStatus: 'ACTIVE',
              acceptsAssignments: true,
              ...(WORKER_AT[key]
                ? { isAvailable: true, currentLatitude: WORKER_AT[key].lat, currentLongitude: WORKER_AT[key].lng, locationUpdatedAt: now }
                : {}),
              approvedBy: key === 'downer' ? null : users.downer.id,
              approvedAt: now,
            },
          }),
        );
      }

      // ---- Listing B.6 --------------------------------------------------------
      const listing = await tx.listing.create({
        data: {
          providerProfileId: provider.id,
          subcategoryId: subcategory.id,
          title: 'Liputan Acara Lensa Sanur',
          price: 1500000,
          estimatedDurationMinutes: 120,
          attributes: { jenis_dokumentasi: ['Foto dan Video'], waktu_pengerjaan_hari: 7 },
          supportsScheduled: true,
          supportsAvailableNow: true,
          status: 'ACTIVE',
          optionPrices: { create: OPTIONS.map(([attributeKey, optionValue, priceDelta]) => ({ attributeKey, optionValue, priceDelta })) },
        },
      });
      await tx.workerListing.createMany({ data: workers.map((w) => ({ workerId: w.id, listingId: listing.id })) });
    },
    { timeout: 60_000 },
  );

  console.log('Akun demo siap. Password seluruhnya:', PASSWORD);
  console.log('  downer  pemilik Lensa Sanur Dokumentasi (BUSINESS), basis Sanur radius 15 km');
  console.log('  dfoto1, dfoto2  pekerja, terpetakan ke "Liputan Acara Lensa Sanur"');
  console.log('  dklien  client, alamat Renon');
  console.log('  dasing  client lain');
  console.log('\nJalankan dev server dengan PAYMENT_GATEWAY=fake, lalu collection "Jasana Backend - Fase 6" dari folder 00.');
}

main()
  .catch((error) => {
    console.error('\nSeed gagal:', error.message ?? error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
