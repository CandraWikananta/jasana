/**
 * Menyiapkan data demo untuk collection Postman Fase 9 (Chatbot, sesi 9b).
 *
 *   npm run postman:seed:fase-9
 *
 * Collection WAJIB dijalankan dengan LLM_GATEWAY=fake (D151): fake memetakan
 * kata kunci ke sub-kategori Lampiran B, jadi jenis intent bisa ditebak.
 *
 *   gklien      client terverifikasi, alamat default di Puputan Renon
 *   gservis     INDIVIDUAL "Servis AC Renon" (nama karangan), basis Renon,
 *               radius 10 km, satu listing servis AC 80 ribu, pemilik terpetakan
 *   gservis2    INDIVIDUAL "AC Premium Sumerta" (9c), basis 2 km utara Renon,
 *               radius 10 km, satu listing servis AC 300 ribu
 *   gpelanggan  client (9c), alamat default Renon, satu order SETTLED servis AC
 *               300 ribu ke gservis2 beserta ulasan bintang 5. Riwayat ini
 *               mengisi personalization_snapshot saat klaim (usulan D168)
 *
 * Sesi tamu kedaluwarsa dengan id dan token mentah tetap (9c), untuk uji klaim
 * 409 CHAT_SESSION_ENDED. Nilainya sama dengan EXPIRED_SESSION di collection.
 *
 * BATAS TAMU DITURUNKAN supaya ketiga lapis bisa diuji dengan sedikit request:
 *   guest_chat_message_limit      = 3
 *   guest_chat_ip_hourly_limit    = 10
 *   guest_chat_daily_global_limit = pesan USER tamu hari ini WITA + 6
 * Nilai global dihitung dari isi basis data, jadi seed bisa diulang tanpa
 * menghapus sesi tamu lama. Ini mengubah parameter untuk SELURUH tamu di basis
 * data tujuan, jadi jalankan hanya ke jasana_test, bukan dev Supabase.
 *
 * Akunnya @postman.jasana.test berawalan `g`. Setiap kali dijalankan, akun
 * beserta listing dan sesi chat-nya dihapus lalu dibuat ulang.
 */

import { createHash } from 'node:crypto';
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
const RENON = { lat: -8.6725, lng: 115.234 };
const WITA_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const ACTORS = [
  { key: 'gklien', fullName: 'Ayu Penanya', phone: '+628990000091' },
  { key: 'gservis', fullName: 'Wayan Dingin', phone: '+628990000092' },
  { key: 'gservis2', fullName: 'Made Sejuk', phone: '+628990000093' },
  { key: 'gpelanggan', fullName: 'Komang Langganan', phone: '+628990000094' },
];
/** 2 km ke utara Renon: rekomendasi bawaan (urut jarak) menaruh listing ini di urutan kedua. */
const SUMERTA = { lat: RENON.lat + 2 / 111.195, lng: RENON.lng };
/** Sesi tamu kedaluwarsa (9c). Token mentah 64 hex, yang disimpan hash SHA-256-nya (pola D63). */
const EXPIRED_SESSION = { id: '9c9c9c9c-0000-4000-8000-00000000c9c9', token: 'c9'.repeat(32) };
const sha256 = (value) => createHash('sha256').update(value, 'utf8').digest('hex');
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
  console.log('PERINGATAN: batas chatbot tamu di basis data ini diturunkan untuk pengujian.');
  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_COST);
  const emails = ACTORS.map((a) => emailOf(a.key));
  const phones = ACTORS.map((a) => a.phone);

  const limits = await prisma.$transaction(
    async (tx) => {
      const old = await tx.user.findMany({
        where: { OR: [{ email: { in: emails } }, { phone: { in: phones } }] },
        select: { id: true, email: true },
      });
      const foreign = old.filter((u) => !u.email.endsWith(DOMAIN));
      if (foreign.length > 0) {
        throw new Error(`Nomor ponsel demo sudah dipakai akun lain (${foreign.map((u) => u.email).join(', ')}).`);
      }
      const ids = old.map((u) => u.id);
      if (ids.length > 0) {
        const own = { providerProfile: { userId: { in: ids } } };
        // Order dan ulasan restrict ke user dan listing, jadi dihapus lebih dulu (9c).
        const orders = { OR: [{ clientId: { in: ids } }, own] };
        await tx.review.deleteMany({ where: { order: orders } });
        await tx.order.deleteMany({ where: orders });
        await tx.providerWorker.deleteMany({ where: { OR: [{ userId: { in: ids } }, own] } });
        await tx.listing.deleteMany({ where: own });
        // chat_sessions dan alamat ikut terhapus cascade dari users.
        await tx.user.deleteMany({ where: { id: { in: ids } } });
      }

      await seedCatalog(tx);
      const sub = await tx.subcategory.findFirstOrThrow({ where: { slug: 'servis-ac', category: { slug: 'perbaikan' } } });

      const now = new Date();
      const users = {};
      for (const a of ACTORS) {
        users[a.key] = await tx.user.create({
          data: { fullName: a.fullName, email: emailOf(a.key), phone: a.phone, passwordHash, emailVerifiedAt: now },
        });
      }
      await tx.userAddress.create({
        data: { userId: users.gklien.id, label: 'Rumah', addressLine: 'Jl. Raya Puputan, Renon', latitude: RENON.lat, longitude: RENON.lng, isDefault: true },
      });

      const provider = await tx.providerProfile.create({
        data: {
          userId: users.gservis.id,
          providerType: 'INDIVIDUAL',
          businessName: 'Servis AC Renon',
          verificationStatus: 'VERIFIED',
          verifiedAt: now,
          baseAddress: 'Servis AC Renon, Bali',
          baseLatitude: RENON.lat,
          baseLongitude: RENON.lng,
          serviceRadiusKm: 10,
          wallet: { create: {} },
        },
      });
      const owner = await tx.providerWorker.create({
        data: {
          providerProfileId: provider.id, userId: users.gservis.id, displayName: users.gservis.fullName,
          isOwner: true, membershipStatus: 'ACTIVE', acceptsAssignments: true, approvedAt: now,
        },
      });
      const listing = await tx.listing.create({
        data: {
          providerProfileId: provider.id, subcategoryId: sub.id, title: 'Cuci AC Panggilan Renon', price: 80000,
          estimatedDurationMinutes: 60, attributes: { merek_dilayani: ['Daikin', 'Panasonic'] },
          supportsScheduled: true, supportsAvailableNow: true, status: 'ACTIVE',
          optionPrices: { create: [{ attributeKey: 'jenis_pekerjaan', optionValue: 'Cuci AC', priceDelta: 0 }] },
        },
      });
      await tx.workerListing.create({ data: { workerId: owner.id, listingId: listing.id } });

      // 9c: penyedia kedua yang lebih jauh dan lebih mahal, untuk membuktikan urutan ulang menurut rentang harga.
      const provider2 = await tx.providerProfile.create({
        data: {
          userId: users.gservis2.id, providerType: 'INDIVIDUAL', businessName: 'AC Premium Sumerta', verificationStatus: 'VERIFIED',
          verifiedAt: now, baseAddress: 'AC Premium Sumerta, Bali', baseLatitude: SUMERTA.lat, baseLongitude: SUMERTA.lng,
          serviceRadiusKm: 10, wallet: { create: {} },
        },
      });
      const owner2 = await tx.providerWorker.create({
        data: {
          providerProfileId: provider2.id, userId: users.gservis2.id, displayName: users.gservis2.fullName,
          isOwner: true, membershipStatus: 'ACTIVE', acceptsAssignments: true, approvedAt: now,
        },
      });
      const listing2 = await tx.listing.create({
        data: {
          providerProfileId: provider2.id, subcategoryId: sub.id, title: 'Servis AC Premium Sumerta', price: 300000,
          estimatedDurationMinutes: 90, attributes: { merek_dilayani: ['Daikin'] },
          supportsScheduled: true, supportsAvailableNow: true, status: 'ACTIVE',
          optionPrices: { create: [{ attributeKey: 'jenis_pekerjaan', optionValue: 'Cuci AC', priceDelta: 0 }] },
        },
      });
      await tx.workerListing.create({ data: { workerId: owner2.id, listingId: listing2.id } });

      await tx.userAddress.create({
        data: { userId: users.gpelanggan.id, label: 'Rumah', addressLine: 'Jl. Tukad Badung, Renon', city: 'Denpasar', latitude: RENON.lat, longitude: RENON.lng, isDefault: true },
      });
      // Order lampau langsung ke basis data, pola seed Fase 5. Status SETTLED, harga dasar 300 ribu.
      const order = await tx.order.create({
        data: {
          orderNumber: 'ORD-POSTMAN-F9-1', clientId: users.gpelanggan.id, providerProfileId: provider2.id, listingId: listing2.id,
          assignedWorkerId: owner2.id, bookingMode: 'SCHEDULED', status: 'SETTLED', scheduledAt: new Date(now.getTime() - 7 * DAY_MS),
          serviceAddress: 'Jl. Tukad Badung, Renon', serviceLatitude: RENON.lat, serviceLongitude: RENON.lng, locationSource: 'SAVED_ADDRESS',
          snapshotListingTitle: listing2.title, snapshotAssigneeName: users.gservis2.fullName,
          listingBaseAmount: 300000, platformFee: 30000, totalAmount: 300000, providerEarning: 270000,
          acceptedAt: now, paidAt: now, startedAt: now, completedAt: now, settledAt: now,
        },
      });
      await tx.review.create({
        data: { orderId: order.id, clientId: users.gpelanggan.id, providerProfileId: provider2.id, listingId: listing2.id, rating: 5 },
      });

      // Sesi tamu kedaluwarsa dengan token tetap, dihapus dulu supaya seed bisa diulang.
      await tx.chatSession.deleteMany({ where: { OR: [{ id: EXPIRED_SESSION.id }, { guestToken: sha256(EXPIRED_SESSION.token) }] } });
      await tx.chatSession.create({
        data: { id: EXPIRED_SESSION.id, guestToken: sha256(EXPIRED_SESSION.token), expiresAt: new Date(now.getTime() - 60 * 60 * 1000) },
      });

      // Sesi tamu = user_id NULL, sama dengan rem global di service dan V3.
      const dayStart = new Date(Math.floor((now.getTime() + WITA_OFFSET_MS) / DAY_MS) * DAY_MS - WITA_OFFSET_MS);
      const usedToday = await tx.chatMessage.count({ where: { role: 'USER', createdAt: { gte: dayStart }, session: { userId: null } } });
      const values = { guest_chat_message_limit: 3, guest_chat_ip_hourly_limit: 10, guest_chat_daily_global_limit: usedToday + 6 };
      for (const [key, value] of Object.entries(values)) {
        await tx.platformSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
      }
      return values;
    },
    { timeout: 60_000 },
  );

  console.log('Akun demo siap. Password seluruhnya:', PASSWORD);
  console.log('  gklien   client, alamat default Renon');
  console.log('  gservis  Servis AC Renon, radius 10 km, listing servis AC 80 ribu');
  console.log('  gservis2    AC Premium Sumerta, 2 km utara Renon, listing servis AC 300 ribu');
  console.log('  gpelanggan  client, alamat default Renon, satu order SETTLED servis AC 300 ribu');
  console.log(`  sesi tamu kedaluwarsa ${EXPIRED_SESSION.id}`);
  console.log('Batas tamu:', JSON.stringify(limits));
  console.log('\nJalankan collection "Jasana Backend - Fase 9" dengan server LLM_GATEWAY=fake.');
}

main()
  .catch((error) => {
    console.error('\nSeed gagal:', error.message ?? error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
