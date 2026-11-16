/**
 * Fase 6 sesi 6d: Available Now sampai ACCEPTED.
 *
 *   D55, D102, H45, H28    penerima tawaran dan yang tidak ikut ditawari
 *   usulan D107, D108      radius dari pekerja, ACCEPTED dan PAID sama-sama memblokir
 *   PRD 8.2 no. 2, H38     dua klaim paralel, tepat satu berhasil
 *   H41                    guard diperiksa ulang setelah klaim
 *   H95                    penolakan, penolakan terakhir, dan balapannya dengan klaim
 *   H92                    endpoint dev presence
 */

import { randomInt } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma, type OrderStatus } from '@jasana/database';
import { createApp } from '../src/app';
import { formatWita } from '../src/lib/wita';
import { presence } from '../src/realtime/presence';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import { MINUTE, RENON, auth, newProvider, newWorld, northOfRenon, waitForLockWaiters, type User, type Worker, type World } from './helpers/orders';

describe.skipIf(!hasTestDatabase)('order Available Now (6d)', () => {
  let app: Express;
  let w: World;

  const online = (...workers: Worker[]) => workers.forEach((x) => presence.connect(x.workerId));

  const body = (overrides: Record<string, unknown> = {}) => ({
    listing_id: w.listingId,
    booking_mode: 'AVAILABLE_NOW',
    location_source: 'SAVED_ADDRESS',
    address_id: w.addressId,
    selected_options: { durasi_liputan: '2 Jam' },
    ...overrides,
  });

  const create = () => request(app).post('/api/v1/orders').set(...auth(w.client)).send(body());

  async function createOrder() {
    const res = await create();
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body.data as { id: string; response_deadline_at: string };
  }

  const claim = (orderId: string, as: User, assigned?: string) =>
    request(app).post(`/api/v1/orders/${orderId}/accept`).set(...auth(as)).send(assigned ? { assigned_worker_id: assigned } : {});
  const decline = (orderId: string, as: User) =>
    request(app).post(`/api/v1/orders/${orderId}/decline-offer`).set(...auth(as)).send({});

  const offeredTo = async (orderId: string) =>
    (await prisma.orderOffer.findMany({ where: { orderId }, orderBy: { distanceMeters: 'asc' } })).map((o) => o.workerId);

  /** Order lain yang ditulis langsung, untuk membuat pekerja sibuk. */
  async function otherOrder(status: OrderStatus, assignedWorkerId: string, options: { scheduledAt?: Date; crew?: string[] } = {}) {
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-UJI-${randomInt(1e9)}`,
        clientId: w.client.id,
        providerProfileId: w.provider.id,
        listingId: w.listingId,
        assignedWorkerId,
        bookingMode: 'SCHEDULED',
        status,
        scheduledAt: options.scheduledAt ?? new Date(Date.now() + 3 * 24 * 60 * MINUTE),
        serviceAddress: 'Jl. Uji',
        serviceLatitude: RENON.lat,
        serviceLongitude: RENON.lng,
        locationSource: 'MAP_PIN',
        snapshotListingTitle: 'Liputan Acara',
        snapshotDurationMinutes: 120,
        listingBaseAmount: 500000,
        platformFee: 50000,
        totalAmount: 500000,
        providerEarning: 450000,
      },
    });
    if (options.crew?.length) {
      await prisma.orderCrew.createMany({ data: options.crew.map((workerId) => ({ orderId: order.id, workerId, addedBy: w.owner.id })) });
    }
    return order.id;
  }

  beforeEach(async () => {
    await resetDatabase();
    presence.reset();
    app = createApp();
    w = await newWorld();
  });

  // -------------------------------------------------------------------------
  // Penerima tawaran
  // -------------------------------------------------------------------------

  describe('POST /orders mode AVAILABLE_NOW', () => {
    it('menawarkan ke pekerja online terdekat, menulis order_offers di transaksi yang sama (D102)', async () => {
      online(w.owner, w.w2, w.w3, w.w4);
      const order = await createOrder();

      // w4 online tapi tidak terpetakan ke listing.
      expect(await offeredTo(order.id)).toEqual([w.owner.workerId, w.w2.workerId, w.w3.workerId]);
      const deadline = new Date(order.response_deadline_at).getTime() - Date.now();
      expect(deadline).toBeGreaterThan(4 * MINUTE);
      expect(deadline).toBeLessThanOrEqual(5 * MINUTE);
      expect(await prisma.notification.count({ where: { channel: 'EMAIL', referenceId: order.id, title: { startsWith: 'Tawaran order sekarang' } } })).toBe(3);
      // Sandbox 10a: batas waktu di isi tawaran ditulis WITA.
      const offer = await prisma.notification.findFirstOrThrow({ where: { channel: 'IN_APP', referenceId: order.id, title: { startsWith: 'Tawaran order sekarang' } } });
      expect(offer.body).toContain(`Ambil sebelum ${formatWita(new Date(order.response_deadline_at))}.`);
    });

    it('dibatasi available_now_offer_limit', async () => {
      online(w.owner, w.w2, w.w3);
      await prisma.platformSetting.create({ data: { key: 'available_now_offer_limit', value: 2 } });
      const order = await createOrder();
      expect(await offeredTo(order.id)).toEqual([w.owner.workerId, w.w2.workerId]);
      await prisma.platformSetting.delete({ where: { key: 'available_now_offer_limit' } });
    });

    it('tanpa pekerja online yang memenuhi syarat ditolak 409, dan toggle mati tidak ikut', async () => {
      expect((await create()).body.error.code).toBe('LISTING_NOT_AVAILABLE');
      online(w.w2);
      await prisma.providerWorker.update({ where: { id: w.w2.workerId }, data: { isAvailable: false } });
      expect((await create()).status).toBe(409);
    });

    it('usulan D107: pekerja di luar service_radius_km dari client tidak ditawari', async () => {
      online(w.w2, w.w3);
      const far = northOfRenon(6);
      await prisma.providerWorker.update({ where: { id: w.w3.workerId }, data: { currentLatitude: far.lat, currentLongitude: far.lng } });
      const order = await createOrder();
      expect(await offeredTo(order.id)).toEqual([w.w2.workerId]);
    });

    it('H45: penanggung jawab dan pendamping order in-flight tidak ditawari', async () => {
      online(w.owner, w.w2, w.w3);
      await otherOrder('ON_THE_WAY', w.owner.workerId, { crew: [w.w2.workerId] });
      const order = await createOrder();
      expect(await offeredTo(order.id)).toEqual([w.w3.workerId]);
    });

    it('H28, usulan D108: jadwal Scheduled ACCEPTED atau PAID dalam rentang now + durasi + buffer memblokir', async () => {
      online(w.w2, w.w3);
      // 2 jam + buffer 30 menit dari sekarang. Yang di luar rentang tidak memblokir.
      await otherOrder('PAID', w.w2.workerId, { scheduledAt: new Date(Date.now() + 60 * MINUTE) });
      await otherOrder('ACCEPTED', w.w3.workerId, { scheduledAt: new Date(Date.now() + 140 * MINUTE) });
      expect((await create()).body.error.code).toBe('LISTING_NOT_AVAILABLE');

      await prisma.order.updateMany({ where: { assignedWorkerId: w.w3.workerId }, data: { scheduledAt: new Date(Date.now() + 160 * MINUTE) } });
      const order = await createOrder();
      expect(await offeredTo(order.id)).toEqual([w.w3.workerId]);
    });

    it('H92: endpoint dev presence membuat pekerja online', async () => {
      const res = await request(app).post('/api/v1/dev/workers/presence').set(...auth(w.client)).send({ worker_ids: [w.w2.workerId] });
      expect(res.body.data).toEqual({ touched: 1 });
      expect(await offeredTo((await createOrder()).id)).toEqual([w.w2.workerId]);
    });
  });

  // -------------------------------------------------------------------------
  // Klaim T1 (jebakan 6)
  // -------------------------------------------------------------------------

  describe('POST /orders/:id/accept Available Now', () => {
    it('pekerja yang ditawari mengklaim untuk dirinya sendiri', async () => {
      online(w.w2, w.w3);
      const order = await createOrder();
      const res = await claim(order.id, w.w2);
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data).toMatchObject({ status: 'ACCEPTED', assigned_worker: { id: w.w2.workerId }, payment: { status: 'PENDING' } });

      const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
      expect(saved.acceptedBy).toBe(w.w2.id);
      expect(await prisma.orderStatusHistory.findFirst({ where: { orderId: order.id, toStatus: 'ACCEPTED' } })).toMatchObject({ actor: 'WORKER' });
      // Yang kalah kehilangan akses, alamat client tidak terbuka.
      expect((await request(app).get(`/api/v1/orders/${order.id}`).set(...auth(w.w3))).status).toBe(403);
    });

    it('pemilik memilih dari daftar penerima, dan ditolak kalau di luar daftar (D70, H95)', async () => {
      online(w.w2, w.w3);
      const order = await createOrder();
      const outside = await claim(order.id, w.owner, w.w4.workerId);
      expect(outside.status).toBe(422);
      expect(outside.body.error.code).toBe('WORKER_NOT_ASSIGNABLE');

      const res = await claim(order.id, w.owner, w.w3.workerId);
      expect(res.body.data).toMatchObject({ status: 'ACCEPTED', assigned_worker: { id: w.w3.workerId } });
      expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).acceptedBy).toBe(w.owner.id);
    });

    it('pekerja yang tidak ditawari atau sudah menolak tidak bisa mengklaim (H95)', async () => {
      online(w.w2, w.w3);
      const order = await createOrder();
      expect((await claim(order.id, w.w4)).status).toBe(403);
      await decline(order.id, w.w2).expect(200);
      expect((await claim(order.id, w.w2)).status).toBe(403);
    });

    it('pekerja yang sudah memegang order lain ditolak 409 dari index in-flight (raw query P2010)', async () => {
      online(w.w2);
      // w2 ditawari dua order sebelum mengambil salah satunya.
      const [first, second] = [await createOrder(), await createOrder()];
      await claim(first.id, w.w2).expect(200);
      const res = await claim(second.id, w.w2);
      expect(res.status, JSON.stringify(res.body)).toBe(409);
      expect(res.body.error.code).toBe('WORKER_HAS_INFLIGHT_ORDER');
    });

    it('pekerja usaha lain dibalas sama apa pun status sibuknya, tidak membocorkan in-flight', async () => {
      online(w.w2);
      const order = await createOrder();
      const other = await newProvider();
      await otherOrder('ON_THE_WAY', other.owner.workerId);
      const res = await claim(order.id, w.owner, other.owner.workerId);
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('WORKER_NOT_ASSIGNABLE');
    });

    it('pendamping tidak tersedia pada Available Now (H47)', async () => {
      online(w.w2);
      const order = await createOrder();
      const res = await request(app).post(`/api/v1/orders/${order.id}/accept`).set(...auth(w.owner))
        .send({ assigned_worker_id: w.w2.workerId, crew_worker_ids: [w.w3.workerId] });
      expect(res.body.error.code).toBe('CREW_NOT_ALLOWED_FOR_MODE');
    });

    it('H41: guard diperiksa ulang saat klaim, kegagalannya membatalkan klaim', async () => {
      online(w.w2);
      const order = await createOrder();
      // Sejak tawaran dikirim, pekerja mendapat jadwal Scheduled yang bentrok.
      await otherOrder('PAID', w.w2.workerId, { scheduledAt: new Date(Date.now() + 30 * MINUTE) });
      const res = await claim(order.id, w.w2);
      expect(res.body.error.code).toBe('WORKER_SCHEDULE_CONFLICT');
      expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('PENDING_ACCEPTANCE');
    });

    it('PRD 8.2 no. 2 (H38): dua klaim paralel, tepat satu berhasil', async () => {
      online(w.w2, w.w3);
      const order = await createOrder();

      // Baris order dipegang test, jadi kedua klaim tertahan di UPDATE bersyarat yang sama.
      let both!: Promise<[request.Response, request.Response]>;
      await prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM orders WHERE id = ${order.id}::uuid FOR UPDATE`;
          both = Promise.all([claim(order.id, w.w2), claim(order.id, w.w3)]);
          await waitForLockWaiters(2);
        },
        { timeout: 15_000 },
      );
      const results = await both;

      expect(results.map((res) => res.status).sort()).toEqual([200, 409]);
      expect(results.find((res) => res.status === 409)!.body.error.code).toBe('ORDER_ALREADY_CLAIMED');
      expect(await prisma.orderStatusHistory.count({ where: { orderId: order.id, toStatus: 'ACCEPTED' } })).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // decline-offer (D102)
  // -------------------------------------------------------------------------

  describe('POST /orders/:id/decline-offer', () => {
    it('penolakan hanya mengisi declined_at, penolakan terakhir langsung EXPIRED oleh SYSTEM (H95)', async () => {
      online(w.w2, w.w3);
      const order = await createOrder();
      const first = await decline(order.id, w.w2);
      expect(first.body.data).toEqual({ order_id: order.id, declined: true, order_status: 'PENDING_ACCEPTANCE' });
      expect(await prisma.orderStatusHistory.count({ where: { orderId: order.id } })).toBe(1);

      expect((await decline(order.id, w.w3)).body.data.order_status).toBe('EXPIRED');
      expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('EXPIRED');
      expect(await prisma.orderStatusHistory.findFirst({ where: { orderId: order.id, toStatus: 'EXPIRED' } })).toMatchObject({ actor: 'SYSTEM' });
      // Yang menolak tidak kena SLA miss (D102 no. 4).
      expect(await prisma.orderOffer.count({ where: { orderId: order.id, slaMissedAt: { not: null } } })).toBe(0);
    });

    it('penolakan terakhir bersamaan dengan klaim pemilik: tepat satu hasil (H95)', async () => {
      online(w.w2, w.w3);
      const order = await createOrder();
      await decline(order.id, w.w3).expect(200);

      let both!: Promise<[request.Response, request.Response]>;
      await prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM orders WHERE id = ${order.id}::uuid FOR UPDATE`;
          both = Promise.all([decline(order.id, w.w2), claim(order.id, w.owner, w.w2.workerId)]);
          await waitForLockWaiters(2);
        },
        { timeout: 15_000 },
      );
      const [declined, claimed] = await both;

      expect([declined.status, claimed.status].sort()).toEqual([200, 409]);
      const { status } = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
      expect(status).toBe(claimed.status === 200 ? 'ACCEPTED' : 'EXPIRED');
      expect(await prisma.orderStatusHistory.count({ where: { orderId: order.id, toStatus: { in: ['ACCEPTED', 'EXPIRED'] } } })).toBe(1);
    });
  });
});
