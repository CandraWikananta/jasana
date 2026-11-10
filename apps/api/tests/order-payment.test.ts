/**
 * Sesi 7a: GET dan POST /orders/:id/payment, jalur pemulihan D104.
 *
 *   D104, PRD 6.4        invoice gagal di T1 dipulihkan, gateway gagal dibalas 502
 *   usulan D123          aturan status, deadline, payment EXPIRED, dan GET
 *   usulan D124          satu baris payment hanya memegang satu invoice
 *   H96                  secret key tidak bocor ke balasan maupun log
 *
 * Gateway tetap palsu (PAYMENT_GATEWAY=fake). Kasus yang perlu adapter Xendit
 * mengarahkan `createInvoice` ke `xenditGateway` asli dengan `fetch` di-mock.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import type { AppError } from '../src/lib/errors';
import { logger } from '../src/lib/logger';
import { paymentGateway, xenditGateway } from '../src/lib/payment-gateway';
import { issueInvoice } from '../src/modules/orders/order-payment.service';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import { HOUR, auth, newWorld, waitForLockWaiters, type User, type World } from './helpers/orders';

const KEY = env.XENDIT_SECRET_KEY;
const KEY_B64 = Buffer.from(`${KEY}:`).toString('base64');

describe.skipIf(!hasTestDatabase)('pembayaran order (7a)', () => {
  let app: Express;
  let w: World;

  async function createOrder() {
    const res = await request(app).post('/api/v1/orders').set(...auth(w.client)).send({
      listing_id: w.listingId,
      booking_mode: 'SCHEDULED',
      scheduled_at: new Date(Date.now() + 3 * 24 * HOUR).toISOString(),
      location_source: 'SAVED_ADDRESS',
      address_id: w.addressId,
      selected_options: { durasi_liputan: '2 Jam' },
    });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body.data.id as string;
  }

  async function acceptedOrder() {
    const id = await createOrder();
    const res = await request(app).post(`/api/v1/orders/${id}/accept`).set(...auth(w.owner)).send({ assigned_worker_id: w.w2.workerId });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    return id;
  }

  const renew = (id: string, as: User = w.client) => request(app).post(`/api/v1/orders/${id}/payment`).set(...auth(as));
  const read = (id: string, as: User = w.client) => request(app).get(`/api/v1/orders/${id}/payment`).set(...auth(as));
  const payments = (orderId: string) => prisma.payment.findMany({ where: { orderId }, orderBy: { createdAt: 'asc' } });

  beforeEach(async () => {
    await resetDatabase();
    app = createApp();
    w = await newWorld();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /orders/:id/payment', () => {
    it('invoice yang gagal dibuat di T1 dibuat ulang untuk baris payment yang sama (D104)', async () => {
      vi.spyOn(paymentGateway, 'createInvoice').mockRejectedValueOnce(new Error('gateway mati'));
      const id = await acceptedOrder();
      const [before] = await payments(id);
      expect(before).toMatchObject({ status: 'PENDING', invoiceUrl: null, xenditInvoiceId: null });

      const res = await renew(id);
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data).toMatchObject({ status: 'PENDING', amount: 500000, invoice_url: `https://fake-gateway.invalid/invoices/fake-inv-${before!.xenditExternalId}` });

      const after = await payments(id);
      expect(after).toHaveLength(1);
      expect(after[0]).toMatchObject({ id: before!.id, xenditInvoiceId: `fake-inv-${before!.xenditExternalId}` });
    });

    it('invoice yang masih berlaku dikembalikan tanpa membuat invoice baru', async () => {
      const id = await acceptedOrder();
      const [payment] = await payments(id);
      const create = vi.spyOn(paymentGateway, 'createInvoice');

      const res = await renew(id);
      expect(res.status).toBe(200);
      expect(res.body.data.invoice_url).toBe(payment!.invoiceUrl);
      expect(create).not.toHaveBeenCalled();
      expect(await payments(id)).toHaveLength(1);
    });

    it('order ACCEPTED tanpa payment PENDING dibuatkan baris baru dengan external_id baru (usulan D123 no. 2)', async () => {
      const id = await acceptedOrder();
      const [old] = await payments(id);
      // Keadaan setelah webhook EXPIRED (D122) untuk invoice yang di-expire sebelum deadline.
      await prisma.payment.update({ where: { id: old!.id }, data: { status: 'EXPIRED' } });

      const res = await renew(id);
      expect(res.status, JSON.stringify(res.body)).toBe(200);

      const rows = await payments(id);
      expect(rows).toHaveLength(2);
      const [expired, fresh] = rows;
      expect(expired).toMatchObject({ id: old!.id, status: 'EXPIRED', xenditInvoiceId: old!.xenditInvoiceId });
      expect(fresh!.xenditExternalId).not.toBe(old!.xenditExternalId);
      const order = await prisma.order.findUniqueOrThrow({ where: { id } });
      expect(fresh).toMatchObject({ status: 'PENDING', invoiceUrl: res.body.data.invoice_url, expiresAt: order.paymentDeadlineAt });
      expect(fresh!.amount.toNumber()).toBe(order.totalAmount.toNumber());
    });

    it('pembatalan yang commit lebih dulu tidak meninggalkan baris PENDING untuk order batal', async () => {
      const id = await acceptedOrder();
      await prisma.payment.updateMany({ where: { orderId: id }, data: { status: 'EXPIRED' } });

      // Test memegang kunci order seperti transaksi cancel. Tanpa lockOrder, request
      // membaca status ACCEPTED yang belum berubah lalu membuat baris PENDING baru.
      let pending!: Promise<request.Response>;
      await prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM orders WHERE id = ${id}::uuid FOR UPDATE`;
          pending = renew(id).then((r) => r); // supertest baru mengirim saat .then dipanggil
          await waitForLockWaiters(1);
          await tx.order.update({ where: { id }, data: { status: 'CANCELLED' } });
        },
        { timeout: 15_000 },
      );

      const res = await pending;
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ORDER_TRANSITION_NOT_ALLOWED');
      expect((await payments(id)).filter((p) => p.status === 'PENDING')).toHaveLength(0);
    });

    it('order yang bukan ACCEPTED ditolak 409', async () => {
      const pending = await createOrder();
      const paid = await acceptedOrder();
      await request(app).post(`/api/v1/dev/orders/${paid}/simulate-payment`).set(...auth(w.client)).expect(200);

      for (const id of [pending, paid]) {
        const res = await renew(id);
        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe('ORDER_TRANSITION_NOT_ALLOWED');
      }
    });

    it('batas pembayaran yang lewat ditolak 409 tanpa memanggil gateway', async () => {
      vi.spyOn(paymentGateway, 'createInvoice').mockRejectedValueOnce(new Error('gateway mati'));
      const id = await acceptedOrder();
      await prisma.order.update({ where: { id }, data: { paymentDeadlineAt: new Date(Date.now() - 1000) } });
      const create = vi.spyOn(paymentGateway, 'createInvoice');

      const res = await renew(id);
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PAYMENT_DEADLINE_PASSED');
      expect(create).not.toHaveBeenCalled();
    });

    it('selain client pemilik order ditolak 403, POST maupun GET', async () => {
      const id = await acceptedOrder();
      for (const as of [w.owner, w.w2]) {
        expect((await renew(id, as)).status).toBe(403);
        expect((await read(id, as)).status).toBe(403);
      }
    });

    it('gateway gagal dibalas 502 PAYMENT_GATEWAY_ERROR tanpa kunci maupun isi balasan Xendit (PRD 6.4)', async () => {
      vi.spyOn(paymentGateway, 'createInvoice').mockRejectedValueOnce(new Error('gateway mati'));
      const id = await acceptedOrder();
      vi.spyOn(paymentGateway, 'createInvoice').mockImplementation(xenditGateway.createInvoice);
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ error_code: 'SERVER_ERROR', message: `rahasia ${KEY}` }), { status: 500 }),
      );

      const res = await renew(id);
      expect(res.status).toBe(502);
      expect(res.body.error.code).toBe('PAYMENT_GATEWAY_ERROR');
      expect(res.text).not.toContain(KEY);
      expect(res.text).not.toContain(KEY_B64);
      expect(res.text).not.toContain('rahasia');
      expect((await payments(id))[0]).toMatchObject({ status: 'PENDING', invoiceUrl: null });
    });
  });

  it('timeout Xendit di T1 tercatat di log tanpa kunci (H96)', async () => {
    const logged = vi.spyOn(logger, 'error');
    vi.spyOn(paymentGateway, 'createInvoice').mockImplementation(xenditGateway.createInvoice);
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException(`aborted ${KEY}`, 'TimeoutError'));

    const id = await acceptedOrder();

    expect(logged).toHaveBeenCalledTimes(1);
    const [payload] = logged.mock.calls[0]! as unknown as [{ err: AppError }];
    expect(payload.err).toMatchObject({ code: 'PAYMENT_GATEWAY_ERROR', context: { gateway_timeout: true } });
    const exposed = `${payload.err.message} ${payload.err.stack} ${JSON.stringify(logged.mock.calls)}`;
    expect(exposed).not.toContain(KEY);
    expect(exposed).not.toContain(KEY_B64);
    expect((await payments(id))[0]).toMatchObject({ status: 'PENDING', invoiceUrl: null });
  });

  it('invoice kedua untuk baris yang sudah memegang invoice langsung di-expire, baris tidak ditimpa (usulan D124)', async () => {
    const id = await acceptedOrder();
    const [first] = await payments(id);
    // Pemanggil yang kalah balapan: gateway-nya menghasilkan invoice lain.
    vi.spyOn(paymentGateway, 'createInvoice').mockResolvedValueOnce({
      invoiceId: 'inv-kalah',
      invoiceUrl: 'https://fake-gateway.invalid/invoices/inv-kalah',
      expiresAt: first!.expiresAt!,
      raw: {},
    });
    const expire = vi.spyOn(paymentGateway, 'expireInvoice');

    await issueInvoice(first!.id);

    expect(expire).toHaveBeenCalledWith('inv-kalah');
    expect(await prisma.payment.findUniqueOrThrow({ where: { id: first!.id } })).toMatchObject({
      status: 'PENDING',
      xenditInvoiceId: first!.xenditInvoiceId,
      invoiceUrl: first!.invoiceUrl,
    });
  });

  it('POST tetap 200 dengan invoice pemenang walaupun expire invoice yang kalah gagal', async () => {
    // T1 gagal, jadi baris PENDING belum punya invoice dan POST akan membuatnya.
    vi.spyOn(paymentGateway, 'createInvoice').mockRejectedValueOnce(new Error('gateway mati'));
    const id = await acceptedOrder();
    const [payment] = await payments(id);
    const winner = { xenditInvoiceId: 'inv-menang', invoiceUrl: 'https://fake-gateway.invalid/invoices/inv-menang' };
    // afterCommit T1 yang lambat mengisi baris tepat saat gateway POST masih membuat invoicenya.
    vi.spyOn(paymentGateway, 'createInvoice').mockImplementationOnce(async (input) => {
      await prisma.payment.update({ where: { id: payment!.id }, data: winner });
      return { invoiceId: 'inv-kalah', invoiceUrl: 'https://fake-gateway.invalid/invoices/inv-kalah', expiresAt: input.expiresAt, raw: {} };
    });
    vi.spyOn(paymentGateway, 'expireInvoice').mockRejectedValueOnce(new Error('gateway mati'));
    const logged = vi.spyOn(logger, 'error');

    const res = await renew(id);

    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data.invoice_url).toBe(winner.invoiceUrl);
    expect(logged).toHaveBeenCalledWith(expect.objectContaining({ invoice_id: 'inv-kalah', payment_id: payment!.id }), expect.any(String));
    expect(await prisma.payment.findUniqueOrThrow({ where: { id: payment!.id } })).toMatchObject(winner);
  });

  describe('GET /orders/:id/payment', () => {
    it('client mendapat payment terbaru beserta invoice_url, expires_at, dan status', async () => {
      const id = await acceptedOrder();
      const [payment] = await payments(id);
      const res = await read(id);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        status: 'PENDING',
        amount: 500000,
        invoice_url: payment!.invoiceUrl,
        expires_at: payment!.expiresAt!.toISOString(),
        paid_at: null,
      });
    });

    it('order yang belum punya payment dibalas 404 (usulan D123 no. 3)', async () => {
      const id = await createOrder();
      const res = await read(id);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
