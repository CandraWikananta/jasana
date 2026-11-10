/**
 * Fase 6 sesi 6c: order Scheduled sampai PAID lewat gateway palsu.
 *
 *   jebakan 4, PRD 8.2 no. 5   nominal dari body diabaikan
 *   PRD 8.2 no. 3              pekerja in-flight, guard dan constraint
 *   PRD 8.2 no. 7, H25, H89    bentrok jadwal dan kasus batas lewat HTTP
 *   H45                        pendamping ikut terblokir
 *   H26                        slot lepas setelah cancel
 *   H93, D100, D103            durasi opsi dan opsi nonaktif
 *   PRD 5.2                    requireOrderParticipant, pendamping tidak lolos
 *   usulan D104 sampai D106
 *
 * Data dibuat langsung lewat Prisma, token ditandatangani langsung: yang diuji
 * alur order, bukan login dan e-KYC yang sudah diuji fase sebelumnya.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { paymentGateway } from '../src/lib/payment-gateway';
import { isInflightViolation } from '../src/lib/prisma-errors';
import { issueInvoice } from '../src/modules/orders/order-payment.service';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import { runVerificationQuery } from './helpers/providers';
import { HOUR, KUTA, MINUTE, RENON, auth, newProvider, newUser, newWorld, waitForLockWaiters, type User, type World } from './helpers/orders';

describe.skipIf(!hasTestDatabase)('order Scheduled (6c)', () => {
  let app: Express;
  let w: World;
  /** Jam bulat 3 hari lagi, supaya rentang waktu mudah dibaca. */
  const T = new Date(Math.ceil((Date.now() + 3 * 24 * HOUR) / HOUR) * HOUR);
  const at = (offsetMinutes: number) => new Date(T.getTime() + offsetMinutes * MINUTE).toISOString();

  const orderBody = (overrides: Record<string, unknown> = {}) => ({
    listing_id: w.listingId,
    booking_mode: 'SCHEDULED',
    scheduled_at: at(0),
    location_source: 'SAVED_ADDRESS',
    address_id: w.addressId,
    selected_options: { durasi_liputan: '2 Jam' },
    ...overrides,
  });

  async function createOrder(overrides: Record<string, unknown> = {}, as: User = w.client) {
    const res = await request(app).post('/api/v1/orders').set(...auth(as)).send(orderBody(overrides));
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body.data as { id: string; [key: string]: unknown };
  }

  const accept = (orderId: string, assigned: string, crew: string[] = [], as: User = w.owner) =>
    request(app).post(`/api/v1/orders/${orderId}/accept`).set(...auth(as)).send({ assigned_worker_id: assigned, crew_worker_ids: crew });

  async function acceptedOrder(offsetMinutes: number, assigned: string, crew: string[] = [], options: Record<string, unknown> = {}) {
    const order = await createOrder({ scheduled_at: at(offsetMinutes), ...options });
    const res = await accept(order.id, assigned, crew);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    return res.body.data;
  }

  const post = (path: string, as: User, body: object = {}) => request(app).post(`/api/v1/orders${path}`).set(...auth(as)).send(body);

  beforeEach(async () => {
    await resetDatabase();
    app = createApp();
    w = await newWorld();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // POST /orders
  // -------------------------------------------------------------------------

  describe('POST /orders', () => {
    it('menghitung harga di server dan mengabaikan nominal dari body (PRD 8.2 no. 5)', async () => {
      const order = await createOrder({
        selected_options: { durasi_liputan: '4 Jam', tambahan: ['Album'], jumlah_orang: 2, cetak: true },
        total_amount: 1000,
        platform_fee: 0,
        provider_earning: 1000,
      });

      expect(order).toMatchObject({
        status: 'PENDING_ACCEPTANCE',
        duration_minutes: 240,
        assigned_worker: null,
        price: {
          listing_base_amount: 500000,
          options_amount: 200000 + 150000 + 100000 + 75000,
          total_amount: 1025000,
          platform_fee: 102500,
          provider_earning: 922500,
        },
      });
      expect((order.price as { options: unknown[] }).options).toHaveLength(4);
      // D58: order Scheduled masuk memberi tahu pemilik.
      expect(await prisma.notification.count({ where: { userId: w.owner.id, referenceId: order.id } })).toBe(1);
      expect(await prisma.orderStatusHistory.count({ where: { orderId: order.id, toStatus: 'PENDING_ACCEPTANCE' } })).toBe(1);
    });

    it('opsi "8 Jam" mengunci 480 menit (H93)', async () => {
      expect((await createOrder({ selected_options: { durasi_liputan: '8 Jam' } })).duration_minutes).toBe(480);
    });

    it('menolak opsi nonaktif "Dua Hari" walaupun barisnya masih is_offered (D67, D103)', async () => {
      const res = await post('', w.client, orderBody({ selected_options: { durasi_liputan: 'Dua Hari' } }));
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('ATTRIBUTE_VALIDATION_FAILED');
    });

    it('menolak opsi yang tidak dilayani penyedia', async () => {
      const res = await post('', w.client, orderBody({ selected_options: { durasi_liputan: '2 Jam', tambahan: ['Drone'] } }));
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('OPTION_NOT_OFFERED');
    });

    it('wajib email terverifikasi (D62)', async () => {
      const res = await post('', await newUser({ verified: false }), orderBody());
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('AVAILABLE_NOW tanpa pekerja online ditolak 409, dan scheduled_at hanya untuk SCHEDULED', async () => {
      const now = await post('', w.client, orderBody({ booking_mode: 'AVAILABLE_NOW', scheduled_at: undefined }));
      expect(now.status).toBe(409);
      expect(now.body.error.code).toBe('LISTING_NOT_AVAILABLE');
      const mixed = await post('', w.client, orderBody({ booking_mode: 'AVAILABLE_NOW' }));
      expect(mixed.body.error.details[0].path).toBe('scheduled_at');
      const missing = await post('', w.client, orderBody({ scheduled_at: undefined }));
      expect(missing.body.error.details[0].path).toBe('scheduled_at');
    });

    it('usulan D106 no. 1: pemilik dan pekerja usaha itu tidak bisa memesan', async () => {
      for (const insider of [w.owner, w.w2]) {
        const res = await post('', insider, orderBody({ location_source: 'MAP_PIN', address_id: undefined, service_address: 'Renon', service_latitude: RENON.lat, service_longitude: RENON.lng }));
        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('FORBIDDEN_ACTOR');
      }
    });

    it('usulan D106 no. 4: lokasi di luar radius usaha ditolak', async () => {
      const res = await post('', w.client, orderBody({ location_source: 'MAP_PIN', address_id: undefined, service_address: 'Kuta', service_latitude: KUTA.lat, service_longitude: KUTA.lng }));
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('LISTING_NOT_AVAILABLE');
    });

    it('usulan D106 no. 2: batas respons sebelum jadwal dikurangi jendela bayar', async () => {
      const soon = new Date(Date.now() + 3 * HOUR);
      const order = await createOrder({ scheduled_at: soon.toISOString() });
      expect(order.response_deadline_at).toBe(new Date(soon.getTime() - 10 * MINUTE).toISOString());

      const tooSoon = await post('', w.client, orderBody({ scheduled_at: new Date(Date.now() + 5 * MINUTE).toISOString() }));
      expect(tooSoon.status).toBe(422);
      expect(tooSoon.body.error.details[0].path).toBe('scheduled_at');
    });
  });

  // -------------------------------------------------------------------------
  // requireOrderParticipant
  // -------------------------------------------------------------------------

  describe('akses order (PRD 5.2)', () => {
    it('client lain tidak bisa membaca atau membatalkan, admin bisa membaca', async () => {
      const order = await createOrder();
      const stranger = await newUser();
      expect((await request(app).get(`/api/v1/orders/${order.id}`).set(...auth(stranger))).status).toBe(403);
      expect((await post(`/${order.id}/cancel`, stranger)).status).toBe(403);
      expect((await request(app).get(`/api/v1/orders/${order.id}/history`).set(...auth(await newUser({ admin: true })))).status).toBe(200);
    });

    it('pemilik usaha lain tidak bisa menerima order usaha ini', async () => {
      const order = await createOrder();
      const other = await newProvider();
      const res = await accept(order.id, other.owner.workerId, [], other.owner);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_ACTOR');
    });

    it('client dan penanggung jawab bukan pemilik tidak bisa menerima', async () => {
      const order = await createOrder();
      expect((await accept(order.id, w.w2.workerId, [], w.client)).status).toBe(403);
    });

    it('pendamping tidak bisa menerima, membatalkan, membaca, atau mengubah order', async () => {
      const order = await acceptedOrder(0, w.w2.workerId, [w.w3.workerId]);
      const crew = w.w3;
      const attempts = [
        await accept(order.id, w.w3.workerId, [], crew),
        await post(`/${order.id}/cancel`, crew),
        await request(app).get(`/api/v1/orders/${order.id}`).set(...auth(crew)),
        await request(app).patch(`/api/v1/orders/${order.id}/assignment`).set(...auth(crew)).send({ assigned_worker_id: w.w3.workerId }),
        await request(app).put(`/api/v1/orders/${order.id}/crew`).set(...auth(crew)).send({ crew_worker_ids: [] }),
      ];
      for (const res of attempts) expect(res.status, JSON.stringify(res.body)).toBe(403);
    });

    it('penanggung jawab yang bukan pemilik tidak bisa membatalkan', async () => {
      const order = await acceptedOrder(0, w.w2.workerId);
      const res = await post(`/${order.id}/cancel`, w.w2);
      expect(res.status).toBe(403);
    });

    it('GET /orders sesuai peran, pendamping melihat order di daftarnya sendiri', async () => {
      const order = await acceptedOrder(0, w.w2.workerId, [w.w3.workerId]);
      const list = (user: User, as: string) => request(app).get('/api/v1/orders').query({ as }).set(...auth(user));
      expect((await list(w.client, 'client')).body.data.map((o: { id: string }) => o.id)).toEqual([order.id]);
      expect((await list(w.owner, 'provider')).body.meta.total).toBe(1);
      expect((await list(w.w3, 'worker')).body.data[0].id).toBe(order.id);
      expect((await list(w.client, 'provider')).status).toBe(403);
    });
  });

  // -------------------------------------------------------------------------
  // T1 accept
  // -------------------------------------------------------------------------

  describe('POST /orders/:id/accept (T1)', () => {
    it('menugaskan pekerja dan pendamping, membuat invoice setelah commit', async () => {
      const order = await acceptedOrder(0, w.w2.workerId, [w.w4.workerId]);
      expect(order).toMatchObject({
        status: 'ACCEPTED',
        assigned_worker: { id: w.w2.workerId },
        crew: [{ id: w.w4.workerId }],
        payment: { status: 'PENDING', amount: 500000 },
      });
      expect(order.payment.invoice_url).toMatch(/^https:\/\/fake-gateway/);
      expect(order.payment_deadline_at).not.toBeNull();
      // D58: client, pemilik, dan pekerja.
      expect(await prisma.notification.count({ where: { referenceId: order.id, title: { startsWith: 'Order diterima' } } })).toBe(3);
    });

    it('invoice gagal dibuat tidak membatalkan T1 (usulan D104)', async () => {
      vi.spyOn(paymentGateway, 'createInvoice').mockRejectedValue(new Error('gateway mati'));
      const order = await acceptedOrder(0, w.w2.workerId);
      expect(order.status).toBe('ACCEPTED');
      expect(order.payment).toMatchObject({ status: 'PENDING', invoice_url: null });
    });

    it('pekerja yang tidak terpetakan ke listing ditolak 422', async () => {
      const order = await createOrder();
      const res = await accept(order.id, w.w4.workerId);
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('WORKER_NOT_MAPPED_TO_LISTING');
    });

    it('batas respons yang lewat ditolak 409', async () => {
      const order = await createOrder();
      await prisma.order.update({ where: { id: order.id }, data: { responseDeadlineAt: new Date(Date.now() - 1000) } });
      expect((await accept(order.id, w.w2.workerId)).body.error.code).toBe('RESPONSE_DEADLINE_PASSED');
    });

    it('PRD 8.2 no. 3: pekerja yang sedang in-flight ditolak, dan constraint menahan order in-flight kedua', async () => {
      const busy = await acceptedOrder(24 * 60, w.w2.workerId);
      await prisma.order.update({ where: { id: busy.id }, data: { status: 'ON_THE_WAY' } });

      const order = await createOrder();
      const res = await accept(order.id, w.w2.workerId);
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('WORKER_HAS_INFLIGHT_ORDER');

      // Lapis basis data: dua order in-flight untuk satu pekerja.
      const second = await acceptedOrder(48 * 60, w.w3.workerId);
      const error = await prisma.order
        .update({ where: { id: second.id }, data: { assignedWorkerId: w.w2.workerId, status: 'ON_THE_WAY' } })
        .catch((e: unknown) => e);
      expect(isInflightViolation(error)).toBe(true);
    });

    describe('bentrok jadwal (PRD 8.2 no. 7, H25)', () => {
      // A: T selama 2 jam, buffer 30 menit, jadi rentangnya sampai T + 150 menit.
      beforeEach(async () => {
        await acceptedOrder(0, w.w2.workerId);
      });

      it('beririsan langsung ditolak 409', async () => {
        const order = await createOrder({ scheduled_at: at(60) });
        expect((await accept(order.id, w.w2.workerId)).body.error.code).toBe('WORKER_SCHEDULE_CONFLICT');
      });

      it('berdempetan persis dan hanya beririsan di buffer ditolak, lewat buffer diterima', async () => {
        for (const offset of [120, 140]) {
          const order = await createOrder({ scheduled_at: at(offset) });
          expect((await accept(order.id, w.w2.workerId)).status, `mulai T+${offset}`).toBe(409);
        }
        const free = await createOrder({ scheduled_at: at(150) });
        expect((await accept(free.id, w.w2.workerId)).status).toBe(200);
      });

      it('buffer 0: berdempetan persis diterima (H89)', async () => {
        await prisma.platformSetting.create({ data: { key: 'schedule_conflict_buffer_minutes', value: 0 } });
        const order = await createOrder({ scheduled_at: at(120) });
        expect((await accept(order.id, w.w2.workerId)).status).toBe(200);
      });

      it('"8 Jam" mengunci 480 menit plus buffer (H93)', async () => {
        const long = await acceptedOrder(24 * 60, w.w3.workerId, [], { selected_options: { durasi_liputan: '8 Jam' } });
        expect(long.duration_minutes).toBe(480);
        const clash = await createOrder({ scheduled_at: at(24 * 60 + 480) });
        expect((await accept(clash.id, w.w3.workerId)).status).toBe(409);
        const free = await createOrder({ scheduled_at: at(24 * 60 + 510) });
        expect((await accept(free.id, w.w3.workerId)).status).toBe(200);
      });

      it('listing tanpa atribut berdurasi memakai kolom listing, bukan attributes (H85, H93)', async () => {
        const sub = await prisma.subcategory.create({
          data: { categoryId: (await prisma.category.findFirstOrThrow({ where: { slug: { startsWith: 'uji-' } } })).id, name: 'Tanpa Durasi', slug: `uji-sub-tanpa-durasi-${Date.now()}` },
        });
        // `durasi_estimasi` sengaja dipasang sebagai umpan: durasi tidak boleh dibaca dari sini (D90).
        const listing = await prisma.listing.create({
          data: {
            providerProfileId: w.provider.id, subcategoryId: sub.id, title: 'Konsultasi', price: 300000,
            estimatedDurationMinutes: 90, attributes: { durasi_estimasi: '180' }, status: 'ACTIVE', supportsScheduled: true,
          },
        });
        await prisma.workerListing.create({ data: { workerId: w.w3.workerId, listingId: listing.id } });

        const plain = await acceptedOrder(24 * 60, w.w3.workerId, [], { listing_id: listing.id, selected_options: {} });
        expect(plain.duration_minutes).toBe(90);
        const clash = await createOrder({ scheduled_at: at(24 * 60 + 90) });
        expect((await accept(clash.id, w.w3.workerId)).status).toBe(409);
        const free = await createOrder({ scheduled_at: at(24 * 60 + 120) });
        expect((await accept(free.id, w.w3.workerId)).status).toBe(200);
      });
    });

    it('dua accept bersamaan untuk pekerja dan jam yang sama: tepat satu berhasil', async () => {
      const [first, second] = [await createOrder(), await createOrder({ scheduled_at: at(60) })];

      // Baris pekerja dipegang test, jadi kedua request tertahan di titik yang sama.
      // Tanpa lockWorkers keduanya lolos pemeriksaan jadwal, lalu baru tertahan di
      // cek FK saat UPDATE, dan setelah kunci dilepas keduanya sama-sama berhasil.
      let both!: Promise<request.Response[]>;
      await prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM provider_workers WHERE id = ${w.w2.workerId}::uuid FOR UPDATE`;
          both = Promise.all([accept(first.id, w.w2.workerId), accept(second.id, w.w2.workerId)]);
          await waitForLockWaiters(2);
          // Tidak menunggu `both` di sini: request menunggu kunci transaksi ini.
        },
        { timeout: 15_000 },
      );
      const results = await both;

      expect(results.map((res) => res.status).sort()).toEqual([200, 409]);
      expect(results.find((res) => res.status === 409)!.body.error.code).toBe('WORKER_SCHEDULE_CONFLICT');
    });

    it('pendamping ikut terblokir di order lain (H45)', async () => {
      await acceptedOrder(0, w.owner.workerId, [w.w2.workerId]);
      const order = await createOrder({ scheduled_at: at(30) });
      expect((await accept(order.id, w.w2.workerId)).body.error.code).toBe('WORKER_SCHEDULE_CONFLICT');
      expect((await accept(order.id, w.w3.workerId, [w.w2.workerId])).body.error.code).toBe('WORKER_SCHEDULE_CONFLICT');
    });

    it('penanggung jawab tidak bisa sekaligus jadi pendamping', async () => {
      const order = await createOrder();
      expect((await accept(order.id, w.w2.workerId, [w.w2.workerId])).body.error.code).toBe('WORKER_NOT_ASSIGNABLE');
    });
  });

  // -------------------------------------------------------------------------
  // T2, T4, T7
  // -------------------------------------------------------------------------

  describe('reject dan cancel', () => {
    it('T2 hanya pemilik, mengisi cancelled_by PROVIDER', async () => {
      const order = await createOrder();
      expect((await post(`/${order.id}/reject`, w.client)).status).toBe(403);
      const res = await post(`/${order.id}/reject`, w.owner, { reason: 'Penuh' });
      expect(res.body.data).toMatchObject({ status: 'REJECTED', cancelled_by: 'PROVIDER', cancellation_reason: 'Penuh' });
    });

    it('T4 oleh client, dan pemilik tidak bisa membatalkan order yang belum diterima', async () => {
      const order = await createOrder();
      expect((await post(`/${order.id}/cancel`, w.owner)).status).toBe(403);
      const res = await post(`/${order.id}/cancel`, w.client);
      expect(res.body.data).toMatchObject({ status: 'CANCELLED', cancelled_by: 'CLIENT' });
      // Usulan D106 no. 3: pemilik diberi tahu.
      expect(await prisma.notification.count({ where: { userId: w.owner.id, title: { startsWith: 'Order dibatalkan' } } })).toBe(1);
    });

    it('T7 meng-expire invoice dan melepas slot pekerja serta pendamping (H26)', async () => {
      const expire = vi.spyOn(paymentGateway, 'expireInvoice');
      const order = await acceptedOrder(0, w.w2.workerId, [w.w3.workerId]);
      const res = await post(`/${order.id}/cancel`, w.owner, { reason: 'Alat rusak' });
      expect(res.body.data).toMatchObject({ status: 'CANCELLED', payment: { status: 'EXPIRED' } });
      expect(expire).toHaveBeenCalledWith(`fake-inv-${(await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } })).xenditExternalId}`);

      // Slot yang sama bisa dipesan lagi untuk pekerja dan pendamping yang sama.
      const again = await createOrder();
      expect((await accept(again.id, w.w2.workerId, [w.w3.workerId])).status).toBe(200);
    });

    it('invoice yang baru jadi setelah order batal langsung di-expire, bukan dibiarkan bisa dibayar', async () => {
      // Gateway lambat: saat accept invoice belum ada, client keburu membatalkan.
      const create = vi.spyOn(paymentGateway, 'createInvoice').mockRejectedValueOnce(new Error('timeout'));
      const order = await acceptedOrder(0, w.w2.workerId);
      await post(`/${order.id}/cancel`, w.client).expect(200);
      const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } });
      expect(payment.status).toBe('EXPIRED');

      create.mockRestore();
      const expire = vi.spyOn(paymentGateway, 'expireInvoice');
      await issueInvoice(payment.id);

      expect(expire).toHaveBeenCalledWith(`fake-inv-${payment.xenditExternalId}`);
      expect(await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } })).toMatchObject({
        status: 'EXPIRED',
        invoiceUrl: null,
        xenditInvoiceId: `fake-inv-${payment.xenditExternalId}`,
      });
    });

    it('order PAID belum bisa dibatalkan sampai Fase 8 (D101)', async () => {
      const order = await acceptedOrder(0, w.w2.workerId);
      await request(app).post(`/api/v1/dev/orders/${order.id}/simulate-payment`).set(...auth(w.client)).expect(200);
      const res = await post(`/${order.id}/cancel`, w.client);
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ORDER_TRANSITION_NOT_ALLOWED');
    });
  });

  // -------------------------------------------------------------------------
  // Bagian 4: assignment dan crew
  // -------------------------------------------------------------------------

  describe('PATCH /orders/:id/assignment (D44)', () => {
    const reassign = (orderId: string, workerId: string, as: User = w.owner) =>
      request(app).patch(`/api/v1/orders/${orderId}/assignment`).set(...auth(as)).send({ assigned_worker_id: workerId });

    it('mengganti penanggung jawab, mencatat histori, dan memberi tahu pekerja lama dan baru', async () => {
      const order = await acceptedOrder(0, w.w2.workerId);
      const res = await reassign(order.id, w.w3.workerId);
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data.assigned_worker.id).toBe(w.w3.workerId);

      const history = await prisma.orderStatusHistory.findFirstOrThrow({ where: { orderId: order.id }, orderBy: { id: 'desc' } });
      expect(history).toMatchObject({ fromStatus: 'ACCEPTED', toStatus: 'ACCEPTED', metadata: { operation: 'ASSIGNMENT_CHANGED', to_worker_id: w.w3.workerId } });
      for (const user of [w.client, w.w2, w.w3]) {
        expect(await prisma.notification.count({ where: { userId: user.id, title: { startsWith: 'Penanggung jawab diganti' } } })).toBe(1);
      }
    });

    it('menolak pengganti yang tidak terpetakan, bentrok, atau sedang jadi pendamping', async () => {
      const order = await acceptedOrder(0, w.w2.workerId, [w.w4.workerId]);
      await acceptedOrder(30, w.w3.workerId);
      expect((await reassign(order.id, w.w4.workerId)).body.error.code).toBe('WORKER_NOT_ASSIGNABLE');
      expect((await reassign(order.id, w.w3.workerId)).body.error.code).toBe('WORKER_SCHEDULE_CONFLICT');
      await prisma.orderCrew.deleteMany({ where: { orderId: order.id } });
      expect((await reassign(order.id, w.w4.workerId)).body.error.code).toBe('WORKER_NOT_MAPPED_TO_LISTING');
    });

    it('order yang belum diterima tidak punya penanggung jawab untuk diganti', async () => {
      const order = await createOrder();
      expect((await reassign(order.id, w.w2.workerId)).status).toBe(409);
    });
  });

  describe('PUT /orders/:id/crew (D69)', () => {
    const setCrew = (orderId: string, ids: string[]) =>
      request(app).put(`/api/v1/orders/${orderId}/crew`).set(...auth(w.owner)).send({ crew_worker_ids: ids });

    it('menulis ulang pendamping; pendamping tidak wajib terpetakan', async () => {
      const order = await acceptedOrder(0, w.w2.workerId, [w.w3.workerId]);
      const res = await setCrew(order.id, [w.w4.workerId]);
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data.crew).toEqual([{ id: w.w4.workerId, display_name: expect.any(String) }]);
    });

    it('menolak penanggung jawab dan pendamping yang bentrok', async () => {
      const order = await acceptedOrder(0, w.w2.workerId);
      await acceptedOrder(60, w.w3.workerId);
      expect((await setCrew(order.id, [w.w2.workerId])).body.error.code).toBe('WORKER_NOT_ASSIGNABLE');
      expect((await setCrew(order.id, [w.w3.workerId])).body.error.code).toBe('WORKER_SCHEDULE_CONFLICT');
    });
  });

  // -------------------------------------------------------------------------
  // T5 lewat gateway palsu
  // -------------------------------------------------------------------------

  describe('POST /dev/orders/:id/simulate-payment (D101)', () => {
    const simulate = (orderId: string, as: User) =>
      request(app).post(`/api/v1/dev/orders/${orderId}/simulate-payment`).set(...auth(as));

    it('client menjalankan T5: payment PAID, simulasi kedua ditolak 409', async () => {
      const order = await acceptedOrder(0, w.w2.workerId);
      expect((await simulate(order.id, w.owner)).status).toBe(403);

      const res = await simulate(order.id, w.client);
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data).toMatchObject({ status: 'PAID', payment: { status: 'PAID' } });
      expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(1);
      expect((await simulate(order.id, w.client)).status).toBe(409);

      // 7b: simulate memakai fungsi T5 yang sama dengan webhook, jadi ikut menulis tepat satu ESCROW_HOLD.
      const { providerEarning } = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
      const holds = await prisma.walletTransaction.findMany({ where: { orderId: order.id } });
      expect(holds).toHaveLength(1);
      expect(holds[0]).toMatchObject({ type: 'ESCROW_HOLD' });
      expect(holds[0]!.amountPendingDelta.equals(providerEarning)).toBe(true);
      expect(await runVerificationQuery('V1')).toEqual([]);
    });

    it('tidak terdaftar saat PAYMENT_GATEWAY=xendit', async () => {
      const order = await acceptedOrder(0, w.w2.workerId);
      const original = env.PAYMENT_GATEWAY;
      env.PAYMENT_GATEWAY = 'xendit';
      try {
        const xenditApp = createApp();
        const res = await request(xenditApp).post(`/api/v1/dev/orders/${order.id}/simulate-payment`).set(...auth(w.client));
        expect(res.status).toBe(404);
      } finally {
        env.PAYMENT_GATEWAY = original;
      }
    });
  });

  // -------------------------------------------------------------------------
  // Listing
  // -------------------------------------------------------------------------

  describe('listing', () => {
    it('usulan D105 (H88): listing dengan order belum selesai tidak bisa dihapus', async () => {
      const order = await createOrder();
      const remove = () => request(app).delete(`/api/v1/providers/me/listings/${w.listingId}`).set(...auth(w.owner));
      const blocked = await remove();
      expect(blocked.status).toBe(409);
      expect(blocked.body.error.code).toBe('LISTING_HAS_ACTIVE_ORDERS');

      await post(`/${order.id}/cancel`, w.client).expect(200);
      expect((await remove()).status).toBe(200);
    });

    it('detail publik memuat duration_minutes per nilai opsi (D100)', async () => {
      const res = await request(app).get(`/api/v1/listings/${w.listingId}`);
      const options = res.body.data.option_prices as { option_value: string | null; duration_minutes: number | null }[];
      expect(options.find((o) => o.option_value === '8 Jam')?.duration_minutes).toBe(480);
      expect(options.find((o) => o.option_value === 'Album')?.duration_minutes).toBeNull();
      expect(options.some((o) => o.option_value === 'Dua Hari')).toBe(false);
    });
  });
});
