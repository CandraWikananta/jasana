/**
 * Fase 6 sesi 6f: sweep response deadline (T3) dan payment deadline (T6).
 *
 *   PRD 7.1                    FOR UPDATE SKIP LOCKED, dua sweep bersamaan, satu gagal tidak menular
 *   balapan                    cron vs accept, cron vs penolakan terakhir, cron vs simulate-payment
 *   H95, D102 no. 4, D57       SLA miss hanya untuk penerima yang belum menolak
 *   H26, D43                   slot yang dilepas T6 bisa dipesan lagi
 *   D104                       invoice yang selesai setelah T6 langsung di-expire
 *   usulan D115, D116          decline setelah deadline, notifikasi toggle dimatikan
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma, type OrderStatus } from '@jasana/database';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { paymentGateway } from '../src/lib/payment-gateway';
import { sweepPaymentDeadlines, sweepResponseDeadlines, type SweepResult } from '../src/modules/orders/order-expiry.service';
import { issueInvoice } from '../src/modules/orders/order-payment.service';
import { presence } from '../src/realtime/presence';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import { HOUR, MINUTE, auth, newUser, newWorld, waitForLockWaiters, type User, type Worker, type World } from './helpers/orders';

describe.skipIf(!hasTestDatabase)('sweep deadline T3 dan T6 (6f)', () => {
  let app: Express;
  let w: World;
  const T = new Date(Math.ceil((Date.now() + 3 * 24 * HOUR) / HOUR) * HOUR);
  const at = (offsetMinutes: number) => new Date(T.getTime() + offsetMinutes * MINUTE).toISOString();

  async function createOrder(mode: 'SCHEDULED' | 'AVAILABLE_NOW' = 'SCHEDULED', offsetMinutes = 0) {
    const res = await request(app)
      .post('/api/v1/orders')
      .set(...auth(w.client))
      .send({
        listing_id: w.listingId,
        booking_mode: mode,
        ...(mode === 'SCHEDULED' ? { scheduled_at: at(offsetMinutes) } : {}),
        location_source: 'SAVED_ADDRESS',
        address_id: w.addressId,
        selected_options: { durasi_liputan: '2 Jam' },
      });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body.data as { id: string };
  }

  const accept = (orderId: string, assigned: string, crew: string[] = []) =>
    request(app).post(`/api/v1/orders/${orderId}/accept`).set(...auth(w.owner)).send({ assigned_worker_id: assigned, crew_worker_ids: crew });

  async function acceptedOrder(offsetMinutes: number, assigned: string, crew: string[] = []) {
    const order = await createOrder('SCHEDULED', offsetMinutes);
    const res = await accept(order.id, assigned, crew);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    return order;
  }

  const decline = (orderId: string, as: User) => request(app).post(`/api/v1/orders/${orderId}/decline-offer`).set(...auth(as)).send({});
  const simulate = (orderId: string) => request(app).post(`/api/v1/dev/orders/${orderId}/simulate-payment`).set(...auth(w.client));
  const online = (...workers: Worker[]) => workers.forEach((x) => presence.connect(x.workerId));

  const ago = (ms: number) => new Date(Date.now() - ms);
  const setDeadline = (orderId: string, data: { responseDeadlineAt?: Date; paymentDeadlineAt?: Date }) =>
    prisma.order.update({ where: { id: orderId }, data });
  const statusOf = async (orderId: string) => (await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).status;
  const historyTo = (orderId: string, toStatus: OrderStatus) => prisma.orderStatusHistory.count({ where: { orderId, toStatus } });
  const sleepUntil = (time: number) => new Promise((resolve) => setTimeout(resolve, Math.max(0, time - Date.now() + 50)));

  beforeEach(async () => {
    await resetDatabase();
    presence.reset();
    app = createApp();
    w = await newWorld();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dua sweep bersamaan: tiap order yang lewat deadline berubah tepat sekali', async () => {
    const pending = await Promise.all([0, 1, 2, 3, 4].map(() => createOrder()));
    const accepted = [await acceptedOrder(0, w.w2.workerId), await acceptedOrder(300, w.w2.workerId), await acceptedOrder(600, w.w2.workerId)];
    for (const o of pending) await setDeadline(o.id, { responseDeadlineAt: ago(1000) });
    for (const o of accepted) await setDeadline(o.id, { paymentDeadlineAt: ago(1000) });

    const t3 = await Promise.all([sweepResponseDeadlines(), sweepResponseDeadlines()]);
    const t6 = await Promise.all([sweepPaymentDeadlines(), sweepPaymentDeadlines()]);

    expect(t3[0].expired + t3[1].expired).toBe(5);
    expect(t6[0].expired + t6[1].expired).toBe(3);
    expect([...t3, ...t6].every((r) => r.failed === 0)).toBe(true);
    for (const o of pending) expect(await historyTo(o.id, 'EXPIRED')).toBe(1);
    for (const o of accepted) expect(await historyTo(o.id, 'PAYMENT_EXPIRED')).toBe(1);
  });

  it('order yang belum lewat deadline tidak tersentuh', async () => {
    const pending = await createOrder();
    const accepted = await acceptedOrder(300, w.w2.workerId);

    expect(await sweepResponseDeadlines()).toMatchObject({ candidates: 0, expired: 0 });
    expect(await sweepPaymentDeadlines()).toMatchObject({ candidates: 0, expired: 0 });
    expect(await statusOf(pending.id)).toBe('PENDING_ACCEPTANCE');
    expect(await statusOf(accepted.id)).toBe('ACCEPTED');
  });

  // -------------------------------------------------------------------------
  // Balapan: tahan kunci, jalankan keduanya, lepas
  // -------------------------------------------------------------------------

  it('T3 vs accept di detik terakhir: accept yang sudah memegang order menang, cron melewatinya', async () => {
    const order = await createOrder();
    const deadline = Date.now() + 1500;
    await setDeadline(order.id, { responseDeadlineAt: new Date(deadline) });

    let accepting!: Promise<request.Response>;
    let swept!: SweepResult;
    await prisma.$transaction(
      async (tx) => {
        // Accept lolos guard deadline, mengunci order, lalu tertahan di kunci pekerja.
        await tx.$queryRaw`SELECT id FROM provider_workers WHERE id = ${w.w2.workerId}::uuid FOR UPDATE`;
        accepting = accept(order.id, w.w2.workerId).then((res) => res);
        await waitForLockWaiters(1);
        await sleepUntil(deadline);
        swept = await sweepResponseDeadlines();
      },
      { timeout: 15_000 },
    );
    const res = await accepting;

    expect(swept).toMatchObject({ candidates: 1, expired: 0, failed: 0 });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(await statusOf(order.id)).toBe('ACCEPTED');
    expect(await historyTo(order.id, 'EXPIRED')).toBe(0);
    expect((await sweepResponseDeadlines()).candidates).toBe(0);
  });

  it('T3 vs penolakan terakhir di detik terakhir: tepat satu EXPIRED, yang menolak tidak kena SLA miss', async () => {
    online(w.w2, w.w3);
    const order = await createOrder('AVAILABLE_NOW');
    await decline(order.id, w.w3).expect(200);
    const deadline = Date.now() + 1500;
    await setDeadline(order.id, { responseDeadlineAt: new Date(deadline) });

    let declining!: Promise<request.Response>;
    let swept!: SweepResult;
    await prisma.$transaction(
      async (tx) => {
        // Penolakan lolos guard deadline (D115), mengunci order, lalu tertahan di baris tawarannya.
        await tx.$queryRaw`SELECT id FROM order_offers WHERE order_id = ${order.id}::uuid AND worker_id = ${w.w2.workerId}::uuid FOR UPDATE`;
        declining = decline(order.id, w.w2).then((res) => res);
        await waitForLockWaiters(1);
        await sleepUntil(deadline);
        swept = await sweepResponseDeadlines();
      },
      { timeout: 15_000 },
    );
    const res = await declining;

    expect(swept).toMatchObject({ candidates: 1, expired: 0, failed: 0 });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data.order_status).toBe('EXPIRED');
    expect(await historyTo(order.id, 'EXPIRED')).toBe(1);
    expect(await prisma.orderOffer.count({ where: { orderId: order.id, slaMissedAt: { not: null } } })).toBe(0);
    expect((await prisma.providerWorker.findUniqueOrThrow({ where: { id: w.w2.workerId } })).isAvailable).toBe(true);
  });

  it('T6 vs simulate-payment: cron memegang order, pembayaran yang datang belakangan ditolak 409', async () => {
    const order = await acceptedOrder(0, w.w2.workerId);
    await setDeadline(order.id, { paymentDeadlineAt: ago(1000) });
    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } });

    let sweeping!: Promise<SweepResult>;
    let paying!: Promise<request.Response>;
    await prisma.$transaction(
      async (tx) => {
        // Cron mengunci order lalu tertahan saat meng-expire payment.
        await tx.$queryRaw`SELECT id FROM payments WHERE id = ${payment.id}::uuid FOR UPDATE`;
        sweeping = sweepPaymentDeadlines();
        await waitForLockWaiters(1);
        paying = simulate(order.id).then((res) => res);
        await waitForLockWaiters(2);
      },
      { timeout: 15_000 },
    );
    const [swept, paid] = await Promise.all([sweeping, paying]);

    expect(swept).toMatchObject({ expired: 1, failed: 0 });
    expect(paid.status).toBe(409);
    expect(await statusOf(order.id)).toBe('PAYMENT_EXPIRED');
    expect(await historyTo(order.id, 'PAYMENT_EXPIRED')).toBe(1);
    expect(await historyTo(order.id, 'PAID')).toBe(0);
    expect((await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } })).status).toBe('EXPIRED');
  });

  // -------------------------------------------------------------------------
  // Efek samping
  // -------------------------------------------------------------------------

  it('H95, usulan D116: SLA miss, toggle mati, dan notifikasi hanya untuk penerima yang belum menolak', async () => {
    online(w.w2, w.w3);
    const order = await createOrder('AVAILABLE_NOW');
    await decline(order.id, w.w3).expect(200);
    await setDeadline(order.id, { responseDeadlineAt: ago(1000) });

    expect(await sweepResponseDeadlines()).toMatchObject({ candidates: 1, expired: 1, failed: 0, sla_missed: 1 });

    expect(await prisma.orderStatusHistory.findFirst({ where: { orderId: order.id, toStatus: 'EXPIRED' } })).toMatchObject({ actor: 'SYSTEM' });
    const offers = await prisma.orderOffer.findMany({ where: { orderId: order.id } });
    expect(offers.find((o) => o.workerId === w.w2.workerId)?.slaMissedAt).not.toBeNull();
    expect(offers.find((o) => o.workerId === w.w3.workerId)?.slaMissedAt).toBeNull();
    const available = async (x: Worker) => (await prisma.providerWorker.findUniqueOrThrow({ where: { id: x.workerId } })).isAvailable;
    expect(await available(w.w2)).toBe(false);
    expect(await available(w.w3)).toBe(true);

    const toggleNotice = (x: Worker) => prisma.notification.count({ where: { userId: x.id, title: { startsWith: 'Toggle Available Now dimatikan' } } });
    expect(await toggleNotice(w.w2)).toBeGreaterThan(0);
    expect(await toggleNotice(w.w3)).toBe(0);
    for (const userId of [w.client.id, w.owner.id]) {
      expect(await prisma.notification.count({ where: { userId, title: { startsWith: 'Order kedaluwarsa' } } })).toBeGreaterThan(0);
    }
  });

  it('usulan D115: decline setelah deadline ditolak 409 dan tetap kena SLA miss', async () => {
    online(w.w2, w.w3);
    const order = await createOrder('AVAILABLE_NOW');
    await setDeadline(order.id, { responseDeadlineAt: ago(1000) });

    const res = await decline(order.id, w.w2);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('RESPONSE_DEADLINE_PASSED');

    expect(await sweepResponseDeadlines()).toMatchObject({ expired: 1, sla_missed: 2 });
    expect(await prisma.orderOffer.count({ where: { orderId: order.id, declinedAt: null, slaMissedAt: { not: null } } })).toBe(2);
  });

  it('T6 meng-expire invoice dan slotnya bisa dipesan lagi oleh pekerja dan pendamping yang sama (H26)', async () => {
    const expire = vi.spyOn(paymentGateway, 'expireInvoice');
    const order = await acceptedOrder(0, w.w2.workerId, [w.w3.workerId]);
    const again = await createOrder();
    expect((await accept(again.id, w.w2.workerId, [w.w3.workerId])).status).toBe(409);

    await setDeadline(order.id, { paymentDeadlineAt: ago(1000) });
    expect(await sweepPaymentDeadlines()).toMatchObject({ expired: 1, failed: 0 });

    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } });
    expect(payment.status).toBe('EXPIRED');
    expect(expire).toHaveBeenCalledWith(`fake-inv-${payment.xenditExternalId}`);
    for (const userId of [w.client.id, w.owner.id, w.w2.id]) {
      expect(await prisma.notification.count({ where: { userId, title: { startsWith: 'Pembayaran kedaluwarsa' } } })).toBeGreaterThan(0);
    }
    expect((await accept(again.id, w.w2.workerId, [w.w3.workerId])).status).toBe(200);
  });

  it('D104: invoice yang baru jadi setelah T6 langsung di-expire', async () => {
    const create = vi.spyOn(paymentGateway, 'createInvoice').mockRejectedValueOnce(new Error('timeout'));
    const order = await acceptedOrder(0, w.w2.workerId);
    await setDeadline(order.id, { paymentDeadlineAt: ago(1000) });
    await sweepPaymentDeadlines();
    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } });
    expect(payment.status).toBe('EXPIRED');

    create.mockRestore();
    const expire = vi.spyOn(paymentGateway, 'expireInvoice');
    await issueInvoice(payment.id);

    expect(expire).toHaveBeenCalledWith(`fake-inv-${payment.xenditExternalId}`);
    expect(await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } })).toMatchObject({ status: 'EXPIRED', invoiceUrl: null });
  });

  it('satu order yang gagal di tengah batch tidak menggagalkan order lain', async () => {
    const a = await acceptedOrder(0, w.w2.workerId);
    const b = await acceptedOrder(0, w.w3.workerId);
    const c = await acceptedOrder(300, w.w2.workerId);
    // b macet: payment sudah PAID tapi T5 tidak pernah jalan. Guard T6 menolaknya.
    const paymentB = await prisma.payment.findFirstOrThrow({ where: { orderId: b.id } });
    await prisma.payment.update({ where: { id: paymentB.id }, data: { status: 'PAID', paidAt: new Date(), paidAmount: paymentB.amount } });
    await setDeadline(a.id, { paymentDeadlineAt: ago(3000) });
    await setDeadline(b.id, { paymentDeadlineAt: ago(2000) });
    await setDeadline(c.id, { paymentDeadlineAt: ago(1000) });

    expect(await sweepPaymentDeadlines()).toMatchObject({ candidates: 3, expired: 2, failed: 1 });
    expect(await statusOf(a.id)).toBe('PAYMENT_EXPIRED');
    expect(await statusOf(b.id)).toBe('ACCEPTED');
    expect(await statusOf(c.id)).toBe('PAYMENT_EXPIRED');
  });

  // -------------------------------------------------------------------------
  // Pemicu dev untuk Postman
  // -------------------------------------------------------------------------

  describe('router /dev', () => {
    const patch = (orderId: string, as: User, field: string) =>
      request(app).patch(`/api/v1/dev/orders/${orderId}/deadline`).set(...auth(as)).send({ field });
    const run = (job: string, as: User = w.client, target = app) => request(target).post(`/api/v1/dev/jobs/${job}/run`).set(...auth(as));

    it('memundurkan deadline sesuai status, lalu menjalankan sweep yang sama dengan cron', async () => {
      const order = await createOrder();
      expect((await patch(order.id, w.client, 'payment_deadline_at')).status).toBe(409);
      expect((await patch(order.id, await newUser(), 'response_deadline_at')).status).toBe(403);
      expect((await patch(order.id, w.client, 'scheduled_at')).status).toBe(422);
      expect((await run('settlement')).status).toBe(422);

      expect((await patch(order.id, w.client, 'response_deadline_at')).status).toBe(200);
      const res = await run('response-deadline');
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data).toEqual({ candidates: 1, expired: 1, failed: 0, sla_missed: 0 });
      expect(await statusOf(order.id)).toBe('EXPIRED');
    });

    it('tidak terdaftar saat PAYMENT_GATEWAY=xendit', async () => {
      const order = await createOrder();
      const original = env.PAYMENT_GATEWAY;
      env.PAYMENT_GATEWAY = 'xendit';
      try {
        const xenditApp = createApp();
        expect((await request(xenditApp).patch(`/api/v1/dev/orders/${order.id}/deadline`).set(...auth(w.client)).send({ field: 'response_deadline_at' })).status).toBe(404);
        expect((await run('response-deadline', w.client, xenditApp)).status).toBe(404);
      } finally {
        env.PAYMENT_GATEWAY = original;
      }
    });
  });
});
