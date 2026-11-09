/**
 * Menyiapkan data demo untuk collection Postman Fase 5 (Pencarian).
 *
 *   npm run postman:seed:fase-5
 *
 * Kenapa perlu skrip: pencarian lokasi butuh usaha VERIFIED dengan basis dan
 * radius layanan berbeda, pekerja online di koordinat tertentu, dan satu
 * pekerja yang sedang in-flight. Order baru ada di Fase 6, jadi order
 * in-flight ditulis langsung.
 *
 * Seluruhnya di sekitar Denpasar (nama usaha karangan):
 *
 *   crenon    INDIVIDUAL "Cuci Mobil Renon", basis Renon, radius 3 km.
 *             Pemilik online di Renon. Listing cuci mobil (Available Now)
 *   csanur    BUSINESS "Dingin Sanur Teknik", basis Sanur, radius 15 km.
 *             Dua listing servis AC (Available Now). Teknisi 1 online di
 *             Renon timur tapi sedang mengerjakan order, teknisi 2 online di
 *             Panjer. Jarak Available Now dari Renon jadi milik teknisi 2
 *   ckuta     INDIVIDUAL "Oli Kilat Kuta", basis Kuta, radius 8 km.
 *             Pemilik online tapi sedang mengerjakan order
 *   cubud     BUSINESS "Studio Ubud Visual", basis Ubud, radius 30 km.
 *             Listing foto produk, hanya Scheduled
 *   cgianyar  SUSPENDED "Cuci Mobil Gianyar", listingnya ACTIVE tapi tidak
 *             boleh muncul (D96)
 *   cteknisi1, cteknisi2  pekerja Dingin Sanur Teknik
 *   cklien    client pemilik order in-flight
 *
 * Titik client di collection: Puputan Renon (-8.6725, 115.2340) dan
 * Pantai Kuta (-8.7215, 115.1690). Dari Renon, Kuta berjarak sekitar 8,7 km
 * sehingga di luar radius 8 km usaha Kuta.
 *
 * Akunnya @postman.jasana.test berawalan `c`, berbeda dari seed fase lain.
 * Setiap kali dijalankan, akun beserta listing dan order-nya dihapus lalu
 * dibuat ulang. Katalog Lampiran B dipastikan ada lewat seedCatalog.
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

const PLACES = {
  renon: { lat: -8.6705, lng: 115.237 },
  sanur: { lat: -8.6885, lng: 115.262 },
  kuta: { lat: -8.718, lng: 115.17 },
  ubud: { lat: -8.5069, lng: 115.2625 },
  denpasar: { lat: -8.6575, lng: 115.2165 },
  panjer: { lat: -8.682, lng: 115.225 },
  renonTimur: { lat: -8.674, lng: 115.24 },
};

const PROVIDERS = [
  { key: 'crenon', fullName: 'Wayan Renon', phone: '+628990000051', type: 'INDIVIDUAL', business: 'Cuci Mobil Renon', base: PLACES.renon, radius: 3, ownerAt: { lat: -8.673, lng: 115.2345 } },
  { key: 'csanur', fullName: 'Made Sanur', phone: '+628990000052', type: 'BUSINESS', business: 'Dingin Sanur Teknik', base: PLACES.sanur, radius: 15 },
  { key: 'ckuta', fullName: 'Komang Kuta', phone: '+628990000053', type: 'INDIVIDUAL', business: 'Oli Kilat Kuta', base: PLACES.kuta, radius: 8, ownerAt: PLACES.kuta },
  { key: 'cubud', fullName: 'Ketut Ubud', phone: '+628990000054', type: 'BUSINESS', business: 'Studio Ubud Visual', base: PLACES.ubud, radius: 30 },
  { key: 'cgianyar', fullName: 'Nyoman Gianyar', phone: '+628990000055', type: 'INDIVIDUAL', business: 'Cuci Mobil Gianyar', base: PLACES.denpasar, radius: 20, status: 'SUSPENDED', ownerAt: PLACES.denpasar },
];
const OTHERS = [
  { key: 'cteknisi1', fullName: 'Putu Teknisi', phone: '+628990000056' },
  { key: 'cteknisi2', fullName: 'Gede Teknisi', phone: '+628990000057' },
  { key: 'cklien', fullName: 'Ayu Pencari', phone: '+628990000058' },
];
const ACTORS = [...PROVIDERS, ...OTHERS];

/** Listing per usaha. `options`: [attribute_key, option_value | null, price_delta]. */
const LISTINGS = [
  {
    provider: 'crenon', sub: 'cuci-mobil-panggilan', title: 'Cuci Mobil Panggilan Renon', price: 60000, duration: 60, availableNow: true,
    attributes: { sumber_air: 'Dibawa penyedia' },
    options: [['jenis_kendaraan', 'Sedan', 0], ['jenis_kendaraan', 'SUV', 20000], ['layanan_tambahan', 'Poles Body', 50000]],
  },
  {
    provider: 'csanur', sub: 'servis-ac', title: 'Cuci AC Sanur Teknik', price: 75000, duration: 60, availableNow: true,
    attributes: { merek_dilayani: ['Daikin', 'Panasonic', 'LG'] },
    options: [['jenis_pekerjaan', 'Cuci AC', 0], ['jenis_pekerjaan', 'Isi Freon', 150000], ['jumlah_unit', null, 50000], ['kapasitas_pk', '1 PK', 0], ['kapasitas_pk', '2 PK', 25000]],
  },
  {
    provider: 'csanur', sub: 'servis-ac', title: 'Perbaikan AC Sharp dan Gree', price: 150000, duration: 120, availableNow: true,
    attributes: { merek_dilayani: ['Sharp', 'Gree'] },
    options: [['jenis_pekerjaan', 'Perbaikan', 0], ['jumlah_unit', null, 100000], ['kapasitas_pk', '1 PK', 0]],
  },
  {
    provider: 'ckuta', sub: 'ganti-oli-panggilan', title: 'Ganti Oli Motor Kuta', price: 45000, duration: 30, availableNow: true,
    attributes: { jenis_kendaraan: 'Motor' },
    options: [['oli_disediakan', null, 40000]],
  },
  {
    provider: 'cubud', sub: 'foto-produk', title: 'Foto Produk Katalog Ubud', price: 300000, duration: 180, availableNow: false,
    attributes: {},
    options: [['jumlah_item', null, 15000], ['gaya_foto', 'Katalog Latar Putih', 0], ['gaya_foto', 'Lifestyle', 100000]],
  },
  {
    provider: 'cgianyar', sub: 'cuci-mobil-panggilan', title: 'Cuci Mobil Gianyar (ditangguhkan)', price: 55000, duration: 60, availableNow: true,
    attributes: { sumber_air: 'Disediakan client' },
    options: [['jenis_kendaraan', 'Sedan', 0]],
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
        await tx.order.deleteMany({ where: { OR: [{ clientId: { in: ids } }, ownProviders] } });
        await tx.providerWorker.deleteMany({ where: { OR: [{ userId: { in: ids } }, ownProviders] } });
        await tx.listing.deleteMany({ where: ownProviders });
        await tx.user.deleteMany({ where: { id: { in: ids } } });
      }

      await seedCatalog(tx);
      const subcategories = new Map(
        (await tx.subcategory.findMany({ where: { slug: { in: LISTINGS.map((l) => l.sub) } }, select: { id: true, slug: true } })).map(
          (s) => [s.slug, s.id],
        ),
      );

      // ---- Akun ---------------------------------------------------------------
      const now = new Date();
      const users = {};
      for (const actor of ACTORS) {
        users[actor.key] = await tx.user.create({
          data: { fullName: actor.fullName, email: emailOf(actor.key), phone: actor.phone, passwordHash, emailVerifiedAt: now },
        });
      }

      // ---- Usaha dan pekerja --------------------------------------------------
      // Keadaan persis hasil persetujuan admin (D33): wallet dan pekerja pemilik.
      const providers = {};
      const owners = {};
      for (const p of PROVIDERS) {
        providers[p.key] = await tx.providerProfile.create({
          data: {
            userId: users[p.key].id,
            providerType: p.type,
            businessName: p.business,
            verificationStatus: p.status ?? 'VERIFIED',
            verifiedAt: now,
            baseAddress: `${p.business}, Bali`,
            baseLatitude: p.base.lat,
            baseLongitude: p.base.lng,
            serviceRadiusKm: p.radius,
            wallet: { create: {} },
          },
        });
        owners[p.key] = await tx.providerWorker.create({
          data: {
            providerProfileId: providers[p.key].id,
            userId: users[p.key].id,
            displayName: users[p.key].fullName,
            isOwner: true,
            membershipStatus: 'ACTIVE',
            acceptsAssignments: true,
            approvedAt: now,
            // Toggle saja tidak membuat pekerja online: sejak 6d available_now juga membaca presence
            // Socket.IO (D99). Di Postman, tandai online lewat POST /dev/workers/presence (H92).
            ...(p.ownerAt
              ? { isAvailable: true, currentLatitude: p.ownerAt.lat, currentLongitude: p.ownerAt.lng, locationUpdatedAt: now }
              : {}),
          },
        });
      }

      const teknisi = {};
      for (const [key, at] of [['cteknisi1', PLACES.renonTimur], ['cteknisi2', PLACES.panjer]]) {
        teknisi[key] = await tx.providerWorker.create({
          data: {
            providerProfileId: providers.csanur.id,
            userId: users[key].id,
            displayName: users[key].fullName,
            membershipStatus: 'ACTIVE',
            acceptsAssignments: true,
            isAvailable: true,
            currentLatitude: at.lat,
            currentLongitude: at.lng,
            locationUpdatedAt: now,
            approvedBy: users.csanur.id,
            approvedAt: now,
          },
        });
      }

      // ---- Listing, harga opsi, pemetaan --------------------------------------
      const listings = {};
      for (const l of LISTINGS) {
        const listing = await tx.listing.create({
          data: {
            providerProfileId: providers[l.provider].id,
            subcategoryId: subcategories.get(l.sub),
            title: l.title,
            price: l.price,
            estimatedDurationMinutes: l.duration,
            attributes: l.attributes,
            supportsScheduled: true,
            supportsAvailableNow: l.availableNow,
            status: 'ACTIVE',
            optionPrices: {
              create: l.options.map(([attributeKey, optionValue, priceDelta]) => ({ attributeKey, optionValue, priceDelta })),
            },
          },
        });
        listings[l.title] = listing;
        const workers = l.provider === 'csanur' ? [teknisi.cteknisi1, teknisi.cteknisi2] : [owners[l.provider]];
        await tx.workerListing.createMany({ data: workers.map((w) => ({ workerId: w.id, listingId: listing.id })) });
      }

      // ---- Order in-flight (Fase 6 belum ada, jadi ditulis langsung) ----------
      const inflight = [
        ['csanur', teknisi.cteknisi1, 'Cuci AC Sanur Teknik', PLACES.renonTimur],
        ['ckuta', owners.ckuta, 'Ganti Oli Motor Kuta', PLACES.kuta],
      ];
      for (const [i, [provider, worker, title, at]] of inflight.entries()) {
        const listing = listings[title];
        await tx.order.create({
          data: {
            orderNumber: `ORD-POSTMAN-F5-${i + 1}`,
            clientId: users.cklien.id,
            providerProfileId: providers[provider].id,
            listingId: listing.id,
            assignedWorkerId: worker.id,
            bookingMode: 'SCHEDULED',
            status: 'IN_PROGRESS',
            scheduledAt: now,
            serviceAddress: 'Alamat demo pencarian',
            serviceLatitude: at.lat,
            serviceLongitude: at.lng,
            locationSource: 'MAP_PIN',
            snapshotListingTitle: title,
            snapshotAssigneeName: worker.displayName,
            listingBaseAmount: listing.price,
            platformFee: listing.price.mul(0.1),
            totalAmount: listing.price,
            providerEarning: listing.price.mul(0.9),
            acceptedAt: now,
            paidAt: now,
            startedAt: now,
          },
        });
      }
    },
    { timeout: 60_000 },
  );

  console.log('Akun demo siap. Password seluruhnya:', PASSWORD);
  for (const p of PROVIDERS) {
    console.log(`  ${p.key.padEnd(9)} ${p.business.padEnd(20)} radius ${String(p.radius).padStart(2)} km  ${p.status ?? 'VERIFIED'}`);
  }
  console.log('  cteknisi1 online di Renon timur, sedang mengerjakan order (in-flight)');
  console.log('  cteknisi2 online di Panjer');
  console.log('  ckuta     pemilik online di Kuta, sedang mengerjakan order (in-flight)');
  console.log('\nLanjutkan dengan menjalankan collection "Jasana Backend - Fase 5" dari folder 00.');
}

main()
  .catch((error) => {
    console.error('\nSeed gagal:', error.message ?? error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
