/**
 * Menyiapkan data demo untuk collection Postman Fase 10: folder 01 (Notifikasi, sesi 10a),
 * folder 02 (Pesan dalam order) dan 03 (Review), sesi 10b.
 *
 *   npm run postman:seed:fase-10
 *
 * HANYA untuk jasana_test. Skrip menolak jalan kalau DATABASE_URL bukan
 * jasana_test, karena baris email FAILED di bawah akan dikirim ulang oleh cron
 * retry di basis data tujuan.
 *
 *   hpenerima  client terverifikasi dengan pengajuan provider DRAFT (target
 *              referensi email FAILED). Notifikasi IN_APP: tiga (satu sudah
 *              dibaca), satu baris EMAIL SENT, satu email FAILED provider_profile
 *              (di-retry), satu email FAILED verification_token (tidak pernah di-retry)
 *   hlain      client terverifikasi dengan satu notifikasi IN_APP, untuk uji 404
 *
 * Sesi 10b, usaha BUSINESS "Teknik Renon" dengan listing servis AC:
 *   hklien       client pemilik seluruh order di bawah
 *   hpemilik     pemilik usaha
 *   hpekerja     penanggung jawab
 *   hpendamping  pendamping order AKTIF (tidak boleh ikut percakapan)
 *   hrekan       pekerja lain di usaha yang sama (tidak boleh ikut percakapan)
 *   hadmin       admin, membaca pesan dan mengatur visibilitas review
 * Order dengan id tetap (ORDER_IDS, sama dengan variabel collection):
 *   AKTIF     PAID, pendamping hpendamping              pesan terbuka
 *   SELESAI   COMPLETED, settlement_due_at besok        pesan terbuka, review boleh
 *   SENGKETA  DISPUTED (dispute OPEN)                   pesan read-only
 *   LAMA      SETTLED, selesai 20 hari lalu             review lewat batas 14 hari
 *   KEDUA     SETTLED, selesai kemarin                  review kedua untuk cache rata-rata
 *
 * Akunnya @postman.jasana.test berawalan `h`. Setiap kali dijalankan, akun
 * beserta notifikasi, order, dan listingnya dihapus lalu dibuat ulang.
 */

import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { seedCatalog } from './seed-catalog.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
loadDotenv({ path: resolve(root, '.env') });

function databaseName(url) {
  try {
    return new URL(url).pathname.replace(/^\//, '');
  } catch {
    return '';
  }
}

if (process.env.NODE_ENV === 'production') {
  console.error('Skrip demo tidak boleh dijalankan dengan NODE_ENV=production.');
  process.exit(1);
}
if (databaseName(process.env.DATABASE_URL ?? '') !== 'jasana_test') {
  console.error('Seed Fase 10 hanya untuk jasana_test. Arahkan DATABASE_URL ke TEST_DATABASE_URL lebih dulu.');
  process.exit(1);
}

const DOMAIN = '@postman.jasana.test';
/** Sama dengan `seed_password` di environment Jasana Lokal. */
const PASSWORD = 'Postman-Jasana-123';
const BCRYPT_COST = 10;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const RENON = { lat: -8.6725, lng: 115.234 };
const ACTORS = [
  { key: 'hpenerima', fullName: 'Putu Penerima', phone: '+628990000101' },
  { key: 'hlain', fullName: 'Kadek Lain', phone: '+628990000102' },
  { key: 'hklien', fullName: 'Komang Klien Sari', phone: '+628990000103' },
  { key: 'hpemilik', fullName: 'Made Pemilik', phone: '+628990000104' },
  { key: 'hpekerja', fullName: 'Wayan Pekerja', phone: '+628990000105' },
  { key: 'hpendamping', fullName: 'Nyoman Pendamping', phone: '+628990000106' },
  { key: 'hrekan', fullName: 'Ketut Rekan', phone: '+628990000107' },
  { key: 'hadmin', fullName: 'Admin Fase Sepuluh', phone: '+628990000108', role: 'ADMIN' },
];
const ORDER_IDS = {
  AKTIF: '10b00000-0000-4000-8000-000000000001',
  SELESAI: '10b00000-0000-4000-8000-000000000002',
  SENGKETA: '10b00000-0000-4000-8000-000000000003',
  LAMA: '10b00000-0000-4000-8000-000000000004',
  KEDUA: '10b00000-0000-4000-8000-000000000005',
};
const emailOf = (key) => `${key}${DOMAIN}`;

const prisma = new PrismaClient();

async function main() {
  console.log('Basis data tujuan: jasana_test');
  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_COST);
  const emails = ACTORS.map((a) => emailOf(a.key));
  const phones = ACTORS.map((a) => a.phone);

  const listingId = await prisma.$transaction(async (tx) => {
    const old = await tx.user.findMany({ where: { OR: [{ email: { in: emails } }, { phone: { in: phones } }] }, select: { id: true, email: true } });
    const foreign = old.filter((u) => !u.email.endsWith(DOMAIN));
    if (foreign.length > 0) throw new Error(`Nomor ponsel demo sudah dipakai akun lain (${foreign.map((u) => u.email).join(', ')}).`);
    const ids = old.map((u) => u.id);
    // Order, review, sengketa, riwayat, dan pekerja restrict ke user dan listing, jadi dihapus lebih dulu.
    // notifications, provider_profiles, order_messages, dan order_crew ikut terhapus cascade.
    const own = { providerProfile: { userId: { in: ids } } };
    const orders = { OR: [{ clientId: { in: ids } }, own, { id: { in: Object.values(ORDER_IDS) } }] };
    await tx.review.deleteMany({ where: { order: orders } });
    await tx.dispute.deleteMany({ where: { order: orders } });
    await tx.orderStatusHistory.deleteMany({ where: { order: orders } });
    await tx.order.deleteMany({ where: orders });
    if (ids.length > 0) {
      await tx.providerWorker.deleteMany({ where: { OR: [{ userId: { in: ids } }, own] } });
      await tx.listing.deleteMany({ where: own });
      await tx.user.deleteMany({ where: { id: { in: ids } } });
    }
    await seedCatalog(tx);
    const sub = await tx.subcategory.findFirstOrThrow({ where: { slug: 'servis-ac', category: { slug: 'perbaikan' } } });

    const now = Date.now();
    const users = {};
    for (const a of ACTORS) {
      users[a.key] = await tx.user.create({
        data: { fullName: a.fullName, email: emailOf(a.key), phone: a.phone, passwordHash, emailVerifiedAt: new Date(now), role: a.role ?? 'CLIENT' },
      });
    }
    const profile = await tx.providerProfile.create({ data: { userId: users.hpenerima.id } });

    const at = (minutesAgo) => new Date(now - minutesAgo * MINUTE);
    const inApp = (userId, title, minutesAgo, read = false) => ({
      userId, type: 'ORDER_STATUS', channel: 'IN_APP', title, body: `Isi ${title}`, createdAt: at(minutesAgo),
      ...(read ? { isRead: true, readAt: at(minutesAgo - 1) } : {}),
    });
    await tx.notification.createMany({
      data: [
        inApp(users.hpenerima.id, 'Demo satu', 30),
        inApp(users.hpenerima.id, 'Demo dua', 20, true),
        inApp(users.hpenerima.id, 'Demo tiga', 10),
        inApp(users.hlain.id, 'Milik hlain', 10),
        { userId: users.hpenerima.id, type: 'ACCOUNT', channel: 'EMAIL', title: 'Email terkirim', emailStatus: 'SENT', sentAt: at(40), createdAt: at(40) },
        {
          userId: users.hpenerima.id, type: 'KYC', channel: 'EMAIL', title: 'Pengajuan provider ditolak', body: 'Alasan: foto KTP buram',
          emailStatus: 'FAILED', emailError: 'SMTP mati (seed)', referenceType: 'provider_profile', referenceId: profile.id, createdAt: at(50),
        },
        {
          userId: users.hpenerima.id, type: 'ACCOUNT', channel: 'EMAIL', title: 'Verifikasi alamat email', body: 'Tautan verifikasi dikirim.',
          emailStatus: 'FAILED', emailError: 'SMTP mati (seed)', referenceType: 'verification_token', referenceId: randomUUID(), createdAt: at(50),
        },
      ],
    });

    // Sesi 10b: usaha, pekerja, listing, dan lima order.
    const provider = await tx.providerProfile.create({
      data: {
        userId: users.hpemilik.id, providerType: 'BUSINESS', businessName: 'Teknik Renon', verificationStatus: 'VERIFIED',
        verifiedAt: new Date(now), baseAddress: 'Teknik Renon, Bali', baseLatitude: RENON.lat, baseLongitude: RENON.lng,
        serviceRadiusKm: 10, wallet: { create: {} },
      },
    });
    const workers = {};
    for (const key of ['hpemilik', 'hpekerja', 'hpendamping', 'hrekan']) {
      workers[key] = await tx.providerWorker.create({
        data: {
          providerProfileId: provider.id, userId: users[key].id, displayName: users[key].fullName, isOwner: key === 'hpemilik',
          membershipStatus: 'ACTIVE', acceptsAssignments: true, approvedAt: new Date(now),
        },
      });
    }
    const listing = await tx.listing.create({
      data: {
        providerProfileId: provider.id, subcategoryId: sub.id, title: 'Servis AC Teknik Renon', price: 150000,
        estimatedDurationMinutes: 60, attributes: { merek_dilayani: ['Daikin'] }, supportsScheduled: true, status: 'ACTIVE',
        optionPrices: { create: [{ attributeKey: 'jenis_pekerjaan', optionValue: 'Cuci AC', priceDelta: 0 }] },
      },
    });
    await tx.workerListing.createMany({ data: Object.values(workers).map((w) => ({ workerId: w.id, listingId: listing.id })) });

    // Langsung ke basis data, pola seed Fase 9. Hanya kolom yang dibaca pesan dan review.
    const order = (key, status, extra) => tx.order.create({
      data: {
        id: ORDER_IDS[key], orderNumber: `ORD-POSTMAN-F10-${key}`, clientId: users.hklien.id, providerProfileId: provider.id,
        listingId: listing.id, assignedWorkerId: workers.hpekerja.id, bookingMode: 'SCHEDULED', status,
        serviceAddress: 'Jl. Raya Puputan, Renon', serviceLatitude: RENON.lat, serviceLongitude: RENON.lng, locationSource: 'SAVED_ADDRESS',
        snapshotListingTitle: listing.title, snapshotAssigneeName: users.hpekerja.fullName,
        listingBaseAmount: 150000, platformFee: 15000, totalAmount: 150000, providerEarning: 135000,
        acceptedAt: new Date(now), ...extra,
      },
    });
    const ago = (ms) => new Date(now - ms);
    await order('AKTIF', 'PAID', { scheduledAt: new Date(now + 2 * HOUR), paidAt: new Date(now) });
    await tx.orderCrew.create({ data: { orderId: ORDER_IDS.AKTIF, workerId: workers.hpendamping.id, addedBy: users.hpemilik.id } });
    await order('SELESAI', 'COMPLETED', {
      scheduledAt: ago(3 * HOUR), paidAt: ago(4 * HOUR), startedAt: ago(3 * HOUR), completedAt: ago(HOUR), settlementDueAt: new Date(now + 23 * HOUR),
    });
    await order('SENGKETA', 'DISPUTED', { scheduledAt: ago(2 * HOUR), paidAt: ago(3 * HOUR), startedAt: ago(2 * HOUR) });
    await tx.dispute.create({
      data: { orderId: ORDER_IDS.SENGKETA, raisedByUserId: users.hklien.id, raisedByRole: 'CLIENT', category: 'WORK_NOT_DONE', description: 'Pekerja pulang sebelum selesai (seed)' },
    });
    await order('LAMA', 'SETTLED', { scheduledAt: ago(21 * DAY), paidAt: ago(21 * DAY), startedAt: ago(21 * DAY), completedAt: ago(20 * DAY), settledAt: ago(19 * DAY) });
    await order('KEDUA', 'SETTLED', { scheduledAt: ago(2 * DAY), paidAt: ago(2 * DAY), startedAt: ago(2 * DAY), completedAt: ago(2 * DAY), settledAt: ago(DAY) });
    return listing.id;
  }, { timeout: 60_000 });

  console.log('Akun demo siap. Password seluruhnya:', PASSWORD);
  console.log('  hpenerima  3 notifikasi in-app (2 belum dibaca), 1 email SENT, 2 email FAILED (satu bertoken)');
  console.log('  hlain      1 notifikasi in-app');
  console.log('  hklien, hpemilik, hpekerja, hpendamping, hrekan, hadmin  usaha Teknik Renon, listing', listingId);
  console.log('  order', JSON.stringify(ORDER_IDS));
  console.log('\nJalankan collection "Jasana Backend - Fase 10" dengan server PAYMENT_GATEWAY=fake.');
}

main()
  .catch((error) => {
    console.error('\nSeed gagal:', error.message ?? error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
