/**
 * Menyiapkan data demo untuk collection Postman Fase 7 (Pembayaran).
 *
 *   npm run postman:seed:fase-7
 *
 * Satu usaha BUSINESS dengan dua pekerja dan satu listing Dokumentasi Acara
 * (B.6), ditambah satu client. Order, webhook, dan settlement dijalankan
 * collection lewat API, bukan oleh skrip ini.
 *
 *   eowner   pemilik "Kilau Kuta Dokumentasi", basis Sanur, radius 15 km
 *   efoto1   pekerja, terpetakan ke listing (penanggung jawab alur T1 sampai T18)
 *   efoto2   pekerja, terpetakan ke listing (order D119, D120, D122)
 *   eklien   client, alamat tersimpan di Renon
 *
 * Akunnya @postman.jasana.test berawalan `e`, berbeda dari seed fase lain.
 * Setiap kali dijalankan, akun beserta listing, order, payment, dan ledger-nya
 * dihapus lalu dibuat ulang. Katalog Lampiran B dipastikan ada lewat seedCatalog.
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

const ACTORS = [
  { key: 'eowner', fullName: 'Nyoman Kilau', phone: '+628990000071' },
  { key: 'efoto1', fullName: 'Gede Fotografer', phone: '+628990000072' },
  { key: 'efoto2', fullName: 'Putu Videografer', phone: '+628990000073' },
  { key: 'eklien', fullName: 'Sari Pemesan', phone: '+628990000074' },
];

/** [attribute_key, option_value | null, price_delta] */
const OPTIONS = [
  ['jenis_acara', 'Seminar', 0],
  ['durasi_liputan', '2 Jam', 0],
  ['durasi_liputan', '4 Jam', 600000],
  ['durasi_liputan', '8 Jam', 1500000],
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
        // Menghapus akun demo ikut menghapus wallet lewat cascade padahal wallet_transactions
        // restrict, jadi tanpa ini seed tidak bisa diulang setelah collection menulis ESCROW_HOLD.
        // Diizinkan karena yang dihapus hanya ledger wallet milik akun demo seed ini (email persis
        // dari ACTORS), datanya buatan tanpa nilai audit, dan NODE_ENV=production sudah ditolak di atas.
        await tx.walletTransaction.deleteMany({ where: { wallet: { providerProfile: { user: { email: { in: emails } } } } } });
        // payments.order_id restrict, jadi dihapus sebelum order.
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
        data: { userId: users.eklien.id, label: 'Rumah', addressLine: 'Jl. Raya Puputan, Renon', latitude: RENON.lat, longitude: RENON.lng, isDefault: true },
      });

      // ---- Usaha dan pekerja (keadaan hasil persetujuan admin, D33) -----------
      const provider = await tx.providerProfile.create({
        data: {
          userId: users.eowner.id,
          providerType: 'BUSINESS',
          businessName: 'Kilau Kuta Dokumentasi',
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
      for (const key of ['eowner', 'efoto1', 'efoto2']) {
        workers.push(
          await tx.providerWorker.create({
            data: {
              providerProfileId: provider.id,
              userId: users[key].id,
              displayName: users[key].fullName,
              isOwner: key === 'eowner',
              membershipStatus: 'ACTIVE',
              acceptsAssignments: true,
              approvedBy: key === 'eowner' ? null : users.eowner.id,
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
          title: 'Liputan Acara Kilau Kuta',
          price: 1500000,
          estimatedDurationMinutes: 120,
          attributes: { jenis_dokumentasi: ['Foto dan Video'], waktu_pengerjaan_hari: 7 },
          supportsScheduled: true,
          supportsAvailableNow: false,
          status: 'ACTIVE',
          optionPrices: { create: OPTIONS.map(([attributeKey, optionValue, priceDelta]) => ({ attributeKey, optionValue, priceDelta })) },
        },
      });
      await tx.workerListing.createMany({ data: workers.map((w) => ({ workerId: w.id, listingId: listing.id })) });
    },
    { timeout: 60_000 },
  );

  console.log('Akun demo siap. Password seluruhnya:', PASSWORD);
  console.log('  eowner  pemilik Kilau Kuta Dokumentasi (BUSINESS), basis Sanur radius 15 km');
  console.log('  efoto1, efoto2  pekerja, terpetakan ke "Liputan Acara Kilau Kuta"');
  console.log('  eklien  client, alamat Renon');
  console.log('\nJalankan dev server dengan PAYMENT_GATEWAY=fake dan XENDIT_CALLBACK_TOKEN sama dengan');
  console.log('xendit_callback_token di environment, lalu collection "Jasana Backend - Fase 7" dari folder 00.');
}

main()
  .catch((error) => {
    console.error('\nSeed gagal:', error.message ?? error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
