/**
 * Menyiapkan data demo untuk collection Postman Fase 10 folder 01 (Notifikasi, sesi 10a).
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
 * Akunnya @postman.jasana.test berawalan `h`. Setiap kali dijalankan, akun
 * beserta notifikasinya dihapus lalu dibuat ulang.
 */

import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

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
const ACTORS = [
  { key: 'hpenerima', fullName: 'Putu Penerima', phone: '+628990000101' },
  { key: 'hlain', fullName: 'Kadek Lain', phone: '+628990000102' },
];
const emailOf = (key) => `${key}${DOMAIN}`;

const prisma = new PrismaClient();

async function main() {
  console.log('Basis data tujuan: jasana_test');
  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_COST);
  const emails = ACTORS.map((a) => emailOf(a.key));
  const phones = ACTORS.map((a) => a.phone);

  await prisma.$transaction(async (tx) => {
    const old = await tx.user.findMany({ where: { OR: [{ email: { in: emails } }, { phone: { in: phones } }] }, select: { id: true, email: true } });
    const foreign = old.filter((u) => !u.email.endsWith(DOMAIN));
    if (foreign.length > 0) throw new Error(`Nomor ponsel demo sudah dipakai akun lain (${foreign.map((u) => u.email).join(', ')}).`);
    // notifications dan provider_profiles ikut terhapus cascade dari users.
    if (old.length > 0) await tx.user.deleteMany({ where: { id: { in: old.map((u) => u.id) } } });

    const now = Date.now();
    const users = {};
    for (const a of ACTORS) {
      users[a.key] = await tx.user.create({
        data: { fullName: a.fullName, email: emailOf(a.key), phone: a.phone, passwordHash, emailVerifiedAt: new Date(now) },
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
  });

  console.log('Akun demo siap. Password seluruhnya:', PASSWORD);
  console.log('  hpenerima  3 notifikasi in-app (2 belum dibaca), 1 email SENT, 2 email FAILED (satu bertoken)');
  console.log('  hlain      1 notifikasi in-app');
  console.log('\nJalankan collection "Jasana Backend - Fase 10" dengan server PAYMENT_GATEWAY=fake.');
}

main()
  .catch((error) => {
    console.error('\nSeed gagal:', error.message ?? error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
