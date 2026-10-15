/**
 * Menyiapkan akun demo untuk collection Postman Fase 2.
 *
 *   npm run postman:seed
 *
 * Kenapa perlu skrip, bukan murni lewat API:
 *   1. Tidak ada endpoint untuk menjadikan akun ADMIN. Itu disengaja.
 *   2. Lamaran pekerja wajib mencentang listing ACTIVE (D52), padahal
 *      listing baru bisa dibuat lewat API di Fase 4.
 *   3. Pengajuan provider dan lamaran pekerja butuh email terverifikasi
 *      (D62). Tanpa skrip, setiap aktor harus membuka inbox Ethereal.
 *
 * Yang dibuat (semua email @postman.jasana.test, satu password bersama):
 *   admin      role ADMIN
 *   pemohon    user biasa, belum punya profil provider. Dipakai untuk
 *              mendemokan apply, e-KYC, dan persetujuan admin lewat API
 *   pemilik1   pemilik "Cuci Mobil Bersaudara", BUSINESS, sudah VERIFIED
 *   pemilik2   pemilik "Kilap Motor Kedua", BUSINESS, sudah VERIFIED
 *   kru1       calon pekerja
 *   kru2       calon pekerja
 *
 * Dua usaha VERIFIED dibuat dalam keadaan yang SAMA PERSIS dengan hasil
 * persetujuan admin: wallet ada, baris pekerja pemilik ACTIVE dengan
 * accepts_assignments = true, ditambah satu listing ACTIVE yang dipetakan
 * ke pemiliknya. V6 dan V7 tetap nol baris.
 *
 * SETIAP KALI DIJALANKAN, akun demo lama beserta seluruh data Fase 2-nya
 * DIHAPUS lalu dibuat ulang, supaya collection bisa diulang dari awal. Yang
 * disentuh hanya akun berakhiran @postman.jasana.test.
 *
 * Basis data tujuannya DATABASE_URL (dari shell, atau dari .env).
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Tidak menimpa variabel yang sudah ada di shell.
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

const ACTORS = [
  { key: 'admin', fullName: 'Admin Jasana', phone: '+628990000001', role: 'ADMIN' },
  { key: 'pemohon', fullName: 'Putu Pemohon', phone: '+628990000002' },
  { key: 'pemilik1', fullName: 'Made Pemilik', phone: '+628990000003' },
  { key: 'pemilik2', fullName: 'Nyoman Pemilik', phone: '+628990000004' },
  { key: 'kru1', fullName: 'Ketut Kru', phone: '+628990000005' },
  { key: 'kru2', fullName: 'Gede Kru', phone: '+628990000006' },
];

const BUSINESSES = [
  {
    owner: 'pemilik1',
    businessName: 'Cuci Mobil Bersaudara',
    listingTitle: 'Cuci Mobil Panggilan Lengkap',
    price: 85000,
    latitude: -8.65,
    longitude: 115.2167,
  },
  {
    owner: 'pemilik2',
    businessName: 'Kilap Motor Kedua',
    listingTitle: 'Cuci Motor Panggilan',
    price: 35000,
    latitude: -8.6705,
    longitude: 115.2126,
  },
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

/**
 * Berkas e-KYC yang diunggah putaran Postman sebelumnya ikut dihapus dari
 * Storage, supaya bucket tidak menumpuk berkas yatim setiap kali seed
 * diulang. Gagal di sini hanya peringatan, seed tetap berjalan.
 */
async function removeDemoKycFiles(emails) {
  const documents = await prisma.kycDocument.findMany({
    where: { providerProfile: { user: { email: { in: emails } } } },
    select: { fileUrl: true },
  });
  const byBucket = new Map();
  for (const { fileUrl } of documents) {
    const slash = fileUrl.indexOf('/');
    if (slash <= 0) continue;
    const bucket = fileUrl.slice(0, slash);
    byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), fileUrl.slice(slash + 1)]);
  }
  if (byBucket.size === 0) return;

  const base = `${(process.env.SUPABASE_URL ?? '').replace(/\/+$/, '')}/storage/v1`;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  for (const [bucket, prefixes] of byBucket) {
    try {
      const response = await fetch(`${base}/object/${encodeURIComponent(bucket)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefixes }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`status ${response.status}`);
      console.log(`Menghapus ${prefixes.length} berkas e-KYC demo lama dari bucket ${bucket}`);
    } catch (error) {
      console.warn(`Peringatan: berkas e-KYC demo lama di bucket ${bucket} gagal dihapus (${error.message})`);
    }
  }
}

async function main() {
  console.log(`Basis data tujuan: ${describeTarget(process.env.DATABASE_URL)}`);
  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_COST);
  const emails = ACTORS.map((actor) => emailOf(actor.key));
  const phones = ACTORS.map((actor) => actor.phone);

  await removeDemoKycFiles(emails);

  await prisma.$transaction(async (tx) => {
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
      // Profil, wallet, dokumen e-KYC, token, alamat, dan notifikasi ikut
      // terhapus lewat cascade.
      await tx.user.deleteMany({ where: { id: { in: ids } } });
    }

    // ---- Akun ---------------------------------------------------------------
    const users = {};
    for (const actor of ACTORS) {
      users[actor.key] = await tx.user.create({
        data: {
          fullName: actor.fullName,
          email: emailOf(actor.key),
          phone: actor.phone,
          passwordHash,
          role: actor.role ?? 'CLIENT',
          emailVerifiedAt: new Date(),
        },
      });
    }

    // ---- Katalog contoh (Fase 3 belum ada) ---------------------------------
    const category = await tx.category.upsert({
      where: { slug: 'postman-otomotif' },
      update: {},
      create: { name: 'Otomotif (Demo Postman)', slug: 'postman-otomotif' },
    });
    const subcategory =
      (await tx.subcategory.findFirst({
        where: { categoryId: category.id, slug: 'postman-cuci-kendaraan' },
      })) ??
      (await tx.subcategory.create({
        data: {
          categoryId: category.id,
          name: 'Cuci Kendaraan Panggilan (Demo Postman)',
          slug: 'postman-cuci-kendaraan',
        },
      }));

    // ---- Dua usaha VERIFIED, persis hasil persetujuan admin -----------------
    const now = new Date();
    for (const business of BUSINESSES) {
      const owner = users[business.owner];
      const profile = await tx.providerProfile.create({
        data: {
          userId: owner.id,
          providerType: 'BUSINESS',
          businessName: business.businessName,
          bio: 'Usaha demo untuk collection Postman Fase 2.',
          verificationStatus: 'VERIFIED',
          verifiedAt: now,
          verifiedBy: users.admin.id,
          baseLatitude: business.latitude,
          baseLongitude: business.longitude,
          wallet: { create: {} },
        },
      });
      const ownerWorker = await tx.providerWorker.create({
        data: {
          providerProfileId: profile.id,
          userId: owner.id,
          displayName: owner.fullName,
          isOwner: true,
          membershipStatus: 'ACTIVE',
          acceptsAssignments: true,
          isAvailable: false,
          approvedAt: now,
        },
      });
      await tx.listing.create({
        data: {
          providerProfileId: profile.id,
          subcategoryId: subcategory.id,
          title: business.listingTitle,
          price: business.price,
          attributes: {},
          status: 'ACTIVE',
          workers: { create: { workerId: ownerWorker.id } },
        },
      });
    }
  });

  console.log('\nAkun demo siap. Password seluruhnya:', PASSWORD);
  for (const actor of ACTORS) {
    console.log(`  ${actor.key.padEnd(9)} ${emailOf(actor.key)}${actor.role ? '  (ADMIN)' : ''}`);
  }
  console.log('\nLanjutkan dengan menjalankan collection "Jasana Backend - Fase 2" dari folder 00.');
}

main()
  .catch((error) => {
    console.error('\nSeed gagal:', error.message ?? error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
