/**
 * Perlengkapan uji order Fase 6: akun bertoken, usaha BUSINESS dengan empat
 * pekerja, dan listing mirip B.6 yang mendukung kedua mode.
 *
 * Data dibuat langsung lewat Prisma dan token ditandatangani langsung: yang
 * diuji alur order, bukan login dan e-KYC yang sudah diuji fase sebelumnya.
 */

import { randomInt } from 'node:crypto';
import request from 'supertest';
import { prisma } from '@jasana/database';
import { signAccessToken } from '../../src/lib/jwt';
import { sweepSettlements } from '../../src/modules/orders/order-expiry.service';

/** Puputan Renon, Denpasar. */
export const RENON = { lat: -8.6725, lng: 115.234 };
export const KUTA = { lat: -8.7215, lng: 115.169 };
export const HOUR = 3_600_000;
export const MINUTE = 60_000;
/** Derajat lintang per km. */
export const LAT_PER_KM = 1 / 111.195;
export const northOfRenon = (km: number) => ({ lat: RENON.lat + km * LAT_PER_KM, lng: RENON.lng });

export type User = { id: string; token: string };
export type Worker = User & { workerId: string };

export const auth = (user: User): [string, string] => ['Authorization', `Bearer ${user.token}`];

export async function newUser(options: { verified?: boolean; admin?: boolean } = {}): Promise<User> {
  const n = randomInt(1e9);
  const user = await prisma.user.create({
    data: {
      fullName: `Uji ${n}`,
      email: `order-${n}@uji.test`,
      phone: `+6283${n}`,
      passwordHash: 'x',
      emailVerifiedAt: options.verified === false ? null : new Date(),
      role: options.admin ? 'ADMIN' : 'CLIENT',
    },
  });
  const token = signAccessToken({ user_id: user.id, role: user.role, provider_profile_id: null, worker_id: null });
  return { id: user.id, token };
}

/** Usaha BUSINESS VERIFIED berbasis di Renon, radius 5 km, beserta pekerja pemiliknya. */
export async function newProvider() {
  const owner = await newUser();
  const provider = await prisma.providerProfile.create({
    data: {
      userId: owner.id,
      providerType: 'BUSINESS',
      businessName: `Studio ${randomInt(1e6)}`,
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
      baseLatitude: RENON.lat,
      baseLongitude: RENON.lng,
      serviceRadiusKm: 5,
      // Provider sungguhan selalu punya wallet sejak disetujui. T5 menulis ESCROW_HOLD ke sini (7b).
      wallet: { create: {} },
    },
  });
  /** Pekerja ACTIVE dengan toggle menyala di `at`. Online-nya diatur uji lewat `presence`. */
  const worker = async (user: User, isOwner = false, at = RENON): Promise<Worker> => ({
    ...user,
    workerId: (
      await prisma.providerWorker.create({
        data: {
          providerProfileId: provider.id,
          userId: user.id,
          displayName: `Pekerja ${user.id.slice(0, 4)}`,
          isOwner,
          membershipStatus: 'ACTIVE',
          isAvailable: true,
          currentLatitude: at.lat,
          currentLongitude: at.lng,
        },
      })
    ).id,
  });
  return { provider, owner: await worker(owner, true), worker };
}

/**
 * Usaha dengan empat pekerja: owner, w2, w3 terpetakan ke listing, w4 tidak.
 * Jaraknya dari client 0, 0,5, 1, dan 1,5 km ke utara. Listing mirip B.6.
 */
export async function newWorld() {
  const { provider, owner, worker } = await newProvider();
  const w2 = await worker(await newUser(), false, northOfRenon(0.5));
  const w3 = await worker(await newUser(), false, northOfRenon(1));
  const w4 = await worker(await newUser(), false, northOfRenon(1.5));

  const n = randomInt(1e9);
  const category = await prisma.category.create({ data: { name: `Kat ${n}`, slug: `uji-kat-${n}` } });
  const sub = await prisma.subcategory.create({ data: { categoryId: category.id, name: `Sub ${n}`, slug: `uji-sub-${n}` } });
  const option = (value: string, minutes?: number, is_active = true) => ({ value, is_active, ...(minutes ? { duration_minutes: minutes } : {}) });
  await prisma.subcategoryAttribute.createMany({
    data: [
      {
        subcategoryId: sub.id, attributeKey: 'durasi_liputan', label: 'Durasi liputan', dataType: 'SELECT', attributeRole: 'OPTION',
        pricingMode: 'FLAT_PER_OPTION', isRequired: true,
        options: [option('2 Jam', 120), option('4 Jam', 240), option('8 Jam', 480), option('Dua Hari', undefined, false)],
      },
      { subcategoryId: sub.id, attributeKey: 'tambahan', label: 'Tambahan', dataType: 'MULTISELECT', attributeRole: 'OPTION', pricingMode: 'FLAT_PER_OPTION', options: [option('Album'), option('Drone')] },
      { subcategoryId: sub.id, attributeKey: 'jumlah_orang', label: 'Jumlah orang', dataType: 'NUMBER', attributeRole: 'OPTION', pricingMode: 'PER_UNIT', validationRule: { min: 1, max: 10 } },
      { subcategoryId: sub.id, attributeKey: 'cetak', label: 'Cetak', dataType: 'BOOLEAN', attributeRole: 'OPTION', pricingMode: 'FLAT_PER_OPTION' },
    ],
  });
  const listing = await prisma.listing.create({
    data: {
      providerProfileId: provider.id, subcategoryId: sub.id, title: 'Liputan Acara', price: 500000,
      estimatedDurationMinutes: 60, attributes: {}, status: 'ACTIVE', supportsScheduled: true, supportsAvailableNow: true,
    },
  });
  await prisma.listingOptionPrice.createMany({
    data: [
      ['durasi_liputan', '2 Jam', 0], ['durasi_liputan', '4 Jam', 200000], ['durasi_liputan', '8 Jam', 500000],
      // D103: barisnya masih dilayani, tapi nilainya sudah nonaktif di taksonomi.
      ['durasi_liputan', 'Dua Hari', 900000],
      ['tambahan', 'Album', 150000], ['jumlah_orang', null, 50000], ['cetak', null, 75000],
    ].map(([attributeKey, optionValue, priceDelta]) => ({
      listingId: listing.id, attributeKey: attributeKey as string, optionValue: optionValue as string | null, priceDelta: priceDelta as number,
    })),
  });
  await prisma.workerListing.createMany({
    data: [owner, w2, w3].map((x) => ({ workerId: x.workerId, listingId: listing.id })),
  });

  const client = await newUser();
  const address = await prisma.userAddress.create({
    data: { userId: client.id, addressLine: 'Jl. Raya Puputan', latitude: RENON.lat, longitude: RENON.lng },
  });
  return { provider, owner, w2, w3, w4, listingId: listing.id, client, addressId: address.id };
}

export type World = Awaited<ReturnType<typeof newWorld>>;

/** Menunggu sampai `count` sesi basis data tertahan kunci (pola balapan 6c). */
export async function waitForLockWaiters(count: number): Promise<void> {
  for (let i = 0; i < 100; i += 1) {
    const [{ waiting }] = await prisma.$queryRaw<[{ waiting: number }]>`
      SELECT count(*)::int AS waiting FROM pg_stat_activity
      WHERE datname = current_database() AND wait_event_type = 'Lock'
    `;
    if (waiting >= count) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Tidak ada ${count} sesi yang tertahan kunci`);
}

/**
 * Order Scheduled berstatus PAID lewat API (create, accept, simulate-payment),
 * dijadwalkan 30 menit lagi supaya sudah boleh berangkat (State Machine 7).
 */
export async function paidScheduledOrder(
  app: Parameters<typeof request>[0],
  w: World,
  options: { assigned?: Worker; crew?: Worker[]; scheduledAt?: Date } = {},
): Promise<{ id: string }> {
  const scheduledAt = options.scheduledAt ?? new Date(Date.now() + 30 * MINUTE);
  const created = await request(app).post('/api/v1/orders').set(...auth(w.client)).send({
    listing_id: w.listingId,
    booking_mode: 'SCHEDULED',
    scheduled_at: scheduledAt.toISOString(),
    location_source: 'SAVED_ADDRESS',
    address_id: w.addressId,
    selected_options: { durasi_liputan: '2 Jam' },
  });
  if (created.status !== 201) throw new Error(`create ${created.status}: ${JSON.stringify(created.body)}`);
  const id = created.body.data.id as string;
  const accepted = await request(app).post(`/api/v1/orders/${id}/accept`).set(...auth(w.owner)).send({
    assigned_worker_id: (options.assigned ?? w.w2).workerId,
    crew_worker_ids: (options.crew ?? []).map((c) => c.workerId),
  });
  if (accepted.status !== 200) throw new Error(`accept ${accepted.status}: ${JSON.stringify(accepted.body)}`);
  const paid = await request(app).post(`/api/v1/dev/orders/${id}/simulate-payment`).set(...auth(w.client));
  if (paid.status !== 200) throw new Error(`pay ${paid.status}: ${JSON.stringify(paid.body)}`);
  return { id };
}

/** Order berstatus COMPLETED lewat API (T8 sampai T16 oleh penanggung jawab). */
export async function completedOrder(
  app: Parameters<typeof request>[0],
  w: World,
  options: { assigned?: Worker; scheduledAt?: Date } = {},
): Promise<{ id: string }> {
  const { id } = await paidScheduledOrder(app, w, options);
  await runExecution(app, w, id, options.assigned ?? w.w2);
  return { id };
}

/** Depart sampai verify untuk order yang sudah PAID. */
export async function runExecution(app: Parameters<typeof request>[0], w: World, id: string, assignee: Worker): Promise<void> {
  const step = async (action: string, body: object = {}) => {
    const res = await request(app).post(`/api/v1/orders/${id}/${action}`).set(...auth(assignee)).send(body);
    if (res.status !== 200) throw new Error(`${action} ${res.status}: ${JSON.stringify(res.body)}`);
  };
  await step('depart');
  await step('check-in', { latitude: RENON.lat, longitude: RENON.lng });
  await step('start');
  await step('finish');
  const code = await request(app).get(`/api/v1/orders/${id}/verification-code`).set(...auth(w.client));
  if (code.status !== 200) throw new Error(`code ${code.status}: ${JSON.stringify(code.body)}`);
  await step('verify', { code: code.body.data.code });
}

/**
 * Saldo available usaha w sebesar provider_earning satu order, seluruhnya lewat
 * kode produksi: T1 sampai T16, lalu T18 oleh sweep settlement (sesi 8b).
 */
export async function fundWallet(app: Parameters<typeof request>[0], w: World): Promise<number> {
  const { id } = await completedOrder(app, w);
  await prisma.order.update({ where: { id }, data: { settlementDueAt: new Date(Date.now() - 1000) } });
  const swept = await sweepSettlements();
  if (swept.settled !== 1) throw new Error(`settlement ${JSON.stringify(swept)}`);
  return (await prisma.order.findUniqueOrThrow({ where: { id } })).providerEarning.toNumber();
}
