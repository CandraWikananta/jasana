/**
 * Sesi 7b: POST /webhooks/xendit/invoice dan cron pemulihan webhook.
 *
 *   H13            token callback, gagal tertutup
 *   H10, H11       dua transaksi, kunci UPDATE bersyarat, duplikat paralel
 *   H12, H3        kolom pembayaran dari payload, tepat satu ESCROW_HOLD
 *   D119 - D122    pembayaran telat, selisih nominal, pemulihan, EXPIRED
 *   D125           invoice yatim, bayar dobel, external_id tidak dikenal
 *   usulan D126    bayar dobel lewat baris payment lain
 *   usulan D127    SETTLED setelah PAID bukan bayar dobel
 *   V1             ledger dan cache saldo tetap rekonsiliasi setelah tiap test
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma, type Payment } from '@jasana/database';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { paymentGateway } from '../src/lib/payment-gateway';
import { sweepPaymentDeadlines } from '../src/modules/orders/order-expiry.service';
import { issueInvoice } from '../src/modules/orders/order-payment.service';
import { recoverWebhookEvents } from '../src/modules/webhooks/webhooks.service';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import { HOUR, MINUTE, auth, newWorld, waitForLockWaiters, type World } from './helpers/orders';
import { runVerificationQuery } from './helpers/providers';

describe.skipIf(!hasTestDatabase)('webhook invoice Xendit (7b)', () => {
  let app: Express;
  let w: World;

  const TOKEN = env.XENDIT_CALLBACK_TOKEN;
  const send = (body: object, token: string | null = TOKEN) => {
    const req = request(app).post('/api/v1/webhooks/xendit/invoice');
    return (token === null ? req : req.set('x-callback-token', token)).send(body);
  };

  /** `days` berbeda per order supaya w2 tidak bentrok jadwal. */
  async function acceptedOrder(days = 3) {
    const created = await request(app).post('/api/v1/orders').set(...auth(w.client)).send({
      listing_id: w.listingId,
      booking_mode: 'SCHEDULED',
      scheduled_at: new Date(Date.now() + days * 24 * HOUR).toISOString(),
      location_source: 'SAVED_ADDRESS',
      address_id: w.addressId,
      selected_options: { durasi_liputan: '2 Jam' },
    });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    const id = created.body.data.id as string;
    const accepted = await request(app).post(`/api/v1/orders/${id}/accept`).set(...auth(w.owner)).send({ assigned_worker_id: w.w2.workerId });
    expect(accepted.status, JSON.stringify(accepted.body)).toBe(200);
    return { id, payment: await prisma.payment.findFirstOrThrow({ where: { orderId: id } }) };
  }

  const paid = (payment: Payment, overrides: Record<string, unknown> = {}) => ({
    id: payment.xenditInvoiceId,
    external_id: payment.xenditExternalId,
    status: 'PAID',
    paid_amount: payment.amount.toNumber(),
    payment_method: 'BANK_TRANSFER',
    payment_channel: 'BCA',
    paid_at: '2026-11-10T08:15:03.404Z',
    payer_email: 'pembayar@jasana.test',
    ...overrides,
  });

  const event = (eventId: string) => prisma.webhookEvent.findUniqueOrThrow({ where: { eventId } });
  const holds = (orderId: string) => prisma.walletTransaction.count({ where: { orderId, type: 'ESCROW_HOLD' } });
  const orderStatus = async (id: string) => (await prisma.order.findUniqueOrThrow({ where: { id } })).status;
  const paymentOf = (id: string) => prisma.payment.findUniqueOrThrow({ where: { id } });

  beforeEach(async () => {
    await resetDatabase();
    app = createApp();
    w = await newWorld();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    // V1 setelah setiap skenario: cache saldo sama dengan jumlah delta ledger.
    expect(await runVerificationQuery('V1')).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // H13
  // -------------------------------------------------------------------------

  describe('token callback (H13)', () => {
    it.each([
      ['salah', 'token-salah'],
      ['kosong', ''],
      ['tidak ada', null],
    ])('token %s ditolak 401 tanpa mencatat apa pun', async (_label, token) => {
      const { payment } = await acceptedOrder();
      const res = await send(paid(payment), token);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(await prisma.webhookEvent.count()).toBe(0);
      expect((await paymentOf(payment.id)).status).toBe('PENDING');
    });

    it('gagal tertutup kalau XENDIT_CALLBACK_TOKEN kosong, walaupun header juga kosong', async () => {
      const { payment } = await acceptedOrder();
      const original = env.XENDIT_CALLBACK_TOKEN;
      env.XENDIT_CALLBACK_TOKEN = '';
      try {
        expect((await send(paid(payment), '')).status).toBe(401);
        expect((await send(paid(payment), null)).status).toBe(401);
      } finally {
        env.XENDIT_CALLBACK_TOKEN = original;
      }
      expect(await prisma.webhookEvent.count()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // T5 lewat webhook, H10 sampai H12
  // -------------------------------------------------------------------------

  describe('PAID', () => {
    it('T5: order PAID, kolom H12 dari payload, tepat satu ESCROW_HOLD dengan saldo sesudahnya', async () => {
      const { id, payment } = await acceptedOrder();
      const res = await send(paid(payment));
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data).toEqual({ received: true });

      const order = await prisma.order.findUniqueOrThrow({ where: { id } });
      expect(order.status).toBe('PAID');
      const after = await paymentOf(payment.id);
      expect(after).toMatchObject({ status: 'PAID', paymentMethod: 'BANK_TRANSFER', paymentChannel: 'BCA' });
      expect(after.paidAmount!.toNumber()).toBe(500000);
      expect(after.paidAt!.toISOString()).toBe('2026-11-10T08:15:03.404Z');

      const ledger = await prisma.walletTransaction.findMany({ where: { orderId: id } });
      expect(ledger).toHaveLength(1);
      const wallet = await prisma.wallet.findUniqueOrThrow({ where: { providerProfileId: w.provider.id } });
      expect(ledger[0]).toMatchObject({ type: 'ESCROW_HOLD', walletId: wallet.id });
      expect(ledger[0]!.amountPendingDelta.equals(order.providerEarning)).toBe(true);
      expect(ledger[0]!.amountAvailableDelta.toNumber()).toBe(0);
      expect(ledger[0]!.balancePendingAfter.equals(wallet.balancePending)).toBe(true);
      expect(wallet.balancePending.equals(order.providerEarning)).toBe(true);
      expect(wallet.balanceAvailable.toNumber()).toBe(0);

      const recorded = await event(`invoice:${payment.xenditInvoiceId}:PAID`);
      expect(recorded).toMatchObject({ domain: 'PAYMENT', processingStatus: 'PROCESSED', signatureValid: true, referenceId: payment.xenditInvoiceId });
      // Payload utuh tersimpan untuk pemrosesan ulang (D121), termasuk field yang tidak divalidasi.
      expect(recorded.payload).toMatchObject({ payer_email: 'pembayar@jasana.test' });
    });

    it('kiriman kedua dari event yang sama dibalas 200 tanpa efek (PRD 8.2 no. 1)', async () => {
      const { id, payment } = await acceptedOrder();
      expect((await send(paid(payment))).status).toBe(200);
      expect((await send(paid(payment))).status).toBe(200);
      expect(await holds(id)).toBe(1);
      expect(await prisma.orderStatusHistory.count({ where: { orderId: id, toStatus: 'PAID' } })).toBe(1);
      expect(await prisma.webhookEvent.count()).toBe(1);
    });

    it('dua kiriman PARALEL: tepat satu ESCROW_HOLD, kunci UPDATE bersyarat hanya dimenangkan satu (H11)', async () => {
      const { id, payment } = await acceptedOrder();
      const body = paid(payment);
      const eventId = `invoice:${payment.xenditInvoiceId}:PAID`;
      // Transaksi 1 kedua kiriman tidak berbuat apa-apa: barisnya sudah ada.
      await prisma.webhookEvent.create({ data: { domain: 'PAYMENT', eventId, eventType: 'PAID', referenceId: payment.xenditInvoiceId, payload: body } });

      let first!: Promise<request.Response>;
      let second!: Promise<request.Response>;
      await prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM webhook_events WHERE event_id = ${eventId} FOR UPDATE`;
          first = send(body).then((res) => res);
          second = send(body).then((res) => res);
          // Keduanya tertahan di langkah kunci, lalu dilepas bersamaan.
          await waitForLockWaiters(2);
        },
        { timeout: 15_000 },
      );
      const responses = await Promise.all([first, second]);

      expect(responses.map((res) => res.status)).toEqual([200, 200]);
      expect(await holds(id)).toBe(1);
      expect(await prisma.orderStatusHistory.count({ where: { orderId: id, toStatus: 'PAID' } })).toBe(1);
      // Dengan pola baca lalu cek, kiriman kedua ikut memproses dan menimpa event ini menjadi IGNORED.
      expect(await event(eventId)).toMatchObject({ processingStatus: 'PROCESSED', errorMessage: null });
    });

    it('usulan D127: PAID lalu SETTLED untuk invoice yang sama, satu ESCROW_HOLD dan event kedua IGNORED tanpa penanda bayar dobel', async () => {
      const { id, payment } = await acceptedOrder();
      expect((await send(paid(payment))).status).toBe(200);
      expect((await send(paid(payment, { status: 'SETTLED' }))).status).toBe(200);

      expect(await holds(id)).toBe(1);
      const settled = await event(`invoice:${payment.xenditInvoiceId}:SETTLED`);
      expect(settled.processingStatus).toBe('IGNORED');
      expect(settled.errorMessage).not.toMatch(/DOUBLE_PAYMENT/);
    });

    it('usulan D127: SETTLED tanpa PAID sebelumnya tetap menjalankan T5', async () => {
      const { id, payment } = await acceptedOrder();
      expect((await send(paid(payment, { status: 'SETTLED' }))).status).toBe(200);
      expect(await orderStatus(id)).toBe('PAID');
      expect(await holds(id)).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // D119, D120
  // -------------------------------------------------------------------------

  it('D119: pembayaran setelah T6 sungguhan menandai payment EXPIRED jadi PAID tanpa transisi dan tanpa ledger', async () => {
    const { id, payment } = await acceptedOrder();
    await prisma.order.update({ where: { id }, data: { paymentDeadlineAt: new Date(Date.now() - 1000) } });
    expect(await sweepPaymentDeadlines()).toMatchObject({ expired: 1, failed: 0 });
    expect(await orderStatus(id)).toBe('PAYMENT_EXPIRED');
    expect((await paymentOf(payment.id)).status).toBe('EXPIRED');

    expect((await send(paid(payment))).status).toBe(200);

    expect(await orderStatus(id)).toBe('PAYMENT_EXPIRED');
    const after = await paymentOf(payment.id);
    expect(after).toMatchObject({ status: 'PAID', paymentChannel: 'BCA' });
    expect(after.paidAmount!.toNumber()).toBe(500000);
    expect(await holds(id)).toBe(0);
    expect(await prisma.orderStatusHistory.count({ where: { orderId: id, toStatus: 'PAID' } })).toBe(0);
    expect((await event(`invoice:${payment.xenditInvoiceId}:PAID`)).processingStatus).toBe('PROCESSED');
  });

  it('D135, H99: pembayaran telat VA di-refund penuh lewat jalur manual, tanpa ledger, tanpa transisi, initiated_by null', async () => {
    const { id, payment } = await acceptedOrder();
    await prisma.order.update({ where: { id }, data: { paymentDeadlineAt: new Date(Date.now() - 1000) } });
    await sweepPaymentDeadlines();
    const refundApi = vi.spyOn(paymentGateway, 'refund');

    expect((await send(paid(payment))).status).toBe(200);

    const refunds = await prisma.refund.findMany({ where: { orderId: id } });
    expect(refunds).toHaveLength(1);
    expect(refunds[0]).toMatchObject({ paymentId: payment.id, type: 'FULL', status: 'REQUESTED', includesPlatformFee: true, initiatedBy: null, xenditRefundId: null });
    expect(refunds[0]!.amount.toNumber()).toBe(500000);
    // BANK_TRANSFER: jalur manual, API tidak dipanggil (D136 no. 2).
    expect(refundApi).not.toHaveBeenCalled();
    expect(await orderStatus(id)).toBe('PAYMENT_EXPIRED');
    expect(await prisma.walletTransaction.count({ where: { orderId: id } })).toBe(0);
    expect((await event(`invoice:${payment.xenditInvoiceId}:PAID`)).errorMessage).toContain(refunds[0]!.id);
  });

  it('D135: pembayaran telat e-wallet untuk order yang dibatalkan (T7) di-refund lewat API setelah commit, sebesar paid_amount', async () => {
    const { id, payment } = await acceptedOrder();
    expect((await request(app).post(`/api/v1/orders/${id}/cancel`).set(...auth(w.client)).send({})).status).toBe(200);
    const refundApi = vi.spyOn(paymentGateway, 'refund').mockImplementationOnce(async (input) => {
      // Setelah commit: baris refund sudah terlihat dari koneksi lain.
      expect(await prisma.refund.count({ where: { id: input.referenceId } })).toBe(1);
      return { refundId: `rfd-${input.referenceId}`, status: 'PENDING', raw: {} };
    });

    expect((await send(paid(payment, { payment_method: 'EWALLET', payment_channel: 'GOPAY' }))).status).toBe(200);

    const refund = await prisma.refund.findFirstOrThrow({ where: { orderId: id } });
    expect(refundApi).toHaveBeenCalledWith({ referenceId: refund.id, invoiceId: payment.xenditInvoiceId, amount: 500000, reason: 'CANCELLATION' });
    expect(refund).toMatchObject({ status: 'PROCESSING', xenditRefundId: `rfd-${refund.id}`, initiatedBy: null });
    expect(await orderStatus(id)).toBe('CANCELLED');
    expect(await prisma.walletTransaction.count({ where: { orderId: id } })).toBe(0);
  });

  describe('D120: nominal dibandingkan sebagai angka', () => {
    async function orderAt150k() {
      await prisma.listing.update({ where: { id: w.listingId }, data: { price: 150000 } });
      const accepted = await acceptedOrder();
      expect(accepted.payment.amount.toFixed(2)).toBe('150000.00');
      return accepted;
    }

    it('amount 150000.00 dengan paid_amount 150000 lolos T5', async () => {
      const { id, payment } = await orderAt150k();
      expect((await send(paid(payment, { paid_amount: 150000 }))).status).toBe(200);
      expect(await orderStatus(id)).toBe('PAID');
      expect(await holds(id)).toBe(1);
    });

    it('paid_amount 149999 menjadi AMOUNT_MISMATCH: payment tetap PENDING dengan paid_amount tersimpan', async () => {
      const { id, payment } = await orderAt150k();
      expect((await send(paid(payment, { paid_amount: 149999 }))).status).toBe(200);

      expect(await orderStatus(id)).toBe('ACCEPTED');
      const after = await paymentOf(payment.id);
      expect(after.status).toBe('PENDING');
      expect(after.paidAmount!.toNumber()).toBe(149999);
      expect(await holds(id)).toBe(0);
      const recorded = await event(`invoice:${payment.xenditInvoiceId}:PAID`);
      expect(recorded.processingStatus).toBe('FAILED');
      expect(recorded.errorMessage).toMatch(/^AMOUNT_MISMATCH/);
    });

    it('paid_amount yang tidak dikirim juga AMOUNT_MISMATCH, tidak dianggap lunas', async () => {
      const { id, payment } = await acceptedOrder();
      const { paid_amount: _omitted, ...body } = paid(payment);
      expect((await send(body)).status).toBe(200);
      expect(await orderStatus(id)).toBe('ACCEPTED');
      expect((await event(`invoice:${payment.xenditInvoiceId}:PAID`)).errorMessage).toMatch(/^AMOUNT_MISMATCH/);
    });
  });

  // -------------------------------------------------------------------------
  // D122
  // -------------------------------------------------------------------------

  describe('EXPIRED (D122)', () => {
    it('invoice yang cocok dan PENDING jadi EXPIRED, order tetap ACCEPTED', async () => {
      const { id, payment } = await acceptedOrder();
      expect((await send({ ...paid(payment), status: 'EXPIRED' })).status).toBe(200);
      expect((await paymentOf(payment.id)).status).toBe('EXPIRED');
      expect(await orderStatus(id)).toBe('ACCEPTED');
      expect((await event(`invoice:${payment.xenditInvoiceId}:EXPIRED`)).processingStatus).toBe('PROCESSED');
    });

    it('EXPIRED untuk invoice lain dengan external_id yang sama tidak mematikan payment baru', async () => {
      const { id, payment } = await acceptedOrder();
      await send({ ...paid(payment), status: 'EXPIRED' });
      const renewed = await request(app).post(`/api/v1/orders/${id}/payment`).set(...auth(w.client));
      expect(renewed.status, JSON.stringify(renewed.body)).toBe(200);
      const fresh = await prisma.payment.findFirstOrThrow({ where: { orderId: id, status: 'PENDING' } });

      // Invoice yatim dari baris baru (D124) kedaluwarsa di Xendit.
      expect((await send({ ...paid(fresh), id: 'inv-yatim-expired', status: 'EXPIRED' })).status).toBe(200);
      expect((await paymentOf(fresh.id)).status).toBe('PENDING');
      expect((await event('invoice:inv-yatim-expired:EXPIRED')).processingStatus).toBe('IGNORED');
    });
  });

  // -------------------------------------------------------------------------
  // D125, usulan D126
  // -------------------------------------------------------------------------

  describe('invoice yatim (D125)', () => {
    it('no. 1: payment belum PAID dipindah ke invoice yang dibayar, invoice lama di-expire, lalu T5', async () => {
      const expire = vi.spyOn(paymentGateway, 'expireInvoice');
      const { id, payment } = await acceptedOrder();
      expect((await send(paid(payment, { id: 'inv-yatim-1' }))).status).toBe(200);

      const after = await paymentOf(payment.id);
      expect(after).toMatchObject({ status: 'PAID', xenditInvoiceId: 'inv-yatim-1' });
      expect(expire).toHaveBeenCalledWith(payment.xenditInvoiceId);
      expect(await orderStatus(id)).toBe('PAID');
      expect(await holds(id)).toBe(1);
      expect(await prisma.payment.count({ where: { orderId: id } })).toBe(1);
    });

    it('no. 1 vs issueInvoice bersamaan: invoice baru di-expire, baris memegang invoice yatim yang dibayar', async () => {
      // T1 timeout: baris PENDING tanpa invoice, padahal Xendit sudah membuat invoice yatim.
      vi.spyOn(paymentGateway, 'createInvoice').mockRejectedValueOnce(new Error('timeout'));
      const { id, payment } = await acceptedOrder();
      expect(payment.xenditInvoiceId).toBeNull();
      const expire = vi.spyOn(paymentGateway, 'expireInvoice');
      const fresh = `fake-inv-${payment.xenditExternalId}`;

      let issuing!: Promise<void>;
      let paying!: Promise<request.Response>;
      await prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM payments WHERE id = ${payment.id}::uuid FOR UPDATE`;
          // issueInvoice antre lebih dulu, jadi menulis invoice barunya lebih dulu saat kunci dilepas.
          issuing = issueInvoice(payment.id);
          await waitForLockWaiters(1);
          // Webhook sudah memegang kunci order dan antre di baris payment. Tanpa FOR UPDATE di sana,
          // ia membaca baris sebelum invoice baru masuk lalu menimpanya tanpa meng-expire.
          paying = send(paid(payment, { id: 'inv-yatim-balapan' })).then((res) => res);
          await waitForLockWaiters(2);
        },
        { timeout: 15_000 },
      );
      await issuing;
      expect((await paying).status).toBe(200);

      expect(await paymentOf(payment.id)).toMatchObject({ status: 'PAID', xenditInvoiceId: 'inv-yatim-balapan' });
      expect(expire).toHaveBeenCalledWith(fresh);
      expect(await orderStatus(id)).toBe('PAID');
      expect(await holds(id)).toBe(1);
    });

    it('no. 2: payment sudah PAID, bayar dobel FAILED dengan penanda, tanpa baris baru, tetap satu ESCROW_HOLD', async () => {
      const { id, payment } = await acceptedOrder();
      await send(paid(payment));
      expect((await send(paid(payment, { id: 'inv-yatim-2' }))).status).toBe(200);

      const recorded = await event('invoice:inv-yatim-2:PAID');
      expect(recorded.processingStatus).toBe('FAILED');
      expect(recorded.errorMessage).toMatch(/^DOUBLE_PAYMENT/);
      expect(await prisma.payment.count({ where: { orderId: id } })).toBe(1);
      expect((await paymentOf(payment.id)).xenditInvoiceId).toBe(payment.xenditInvoiceId);
      expect(await holds(id)).toBe(1);
    });

    it('usulan D126: invoice yatim dari baris payment lama dibayar setelah baris baru PAID, juga bayar dobel', async () => {
      const { id, payment: old } = await acceptedOrder();
      await send({ ...paid(old), status: 'EXPIRED' });
      await request(app).post(`/api/v1/orders/${id}/payment`).set(...auth(w.client)).expect(200);
      const fresh = await prisma.payment.findFirstOrThrow({ where: { orderId: id, status: 'PENDING' } });
      await send(paid(fresh));
      expect(await orderStatus(id)).toBe('PAID');

      expect((await send(paid(old, { id: 'inv-yatim-lama' }))).status).toBe(200);
      const recorded = await event('invoice:inv-yatim-lama:PAID');
      expect(recorded.processingStatus).toBe('FAILED');
      expect(recorded.errorMessage).toMatch(/^DOUBLE_PAYMENT/);
      expect((await paymentOf(old.id)).status).toBe('EXPIRED');
      expect(await holds(id)).toBe(1);
    });

    it('no. 3: external_id tidak dikenal dicatat IGNORED dan dibalas 200', async () => {
      const res = await send({ id: 'inv-asing', external_id: 'PAY-tidak-ada', status: 'PAID', paid_amount: 1000 });
      expect(res.status).toBe(200);
      expect((await event('invoice:inv-asing:PAID')).processingStatus).toBe('IGNORED');
      expect(await prisma.payment.count()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Cron pemulihan (PRD 7.1, D121)
  // -------------------------------------------------------------------------

  describe('cron pemulihan webhook (D121)', () => {
    it('galat sementara: event FAILED, lalu cron memprosesnya ulang dari payload dan berhasil', async () => {
      const { id, payment } = await acceptedOrder();
      // Wallet hilang membuat transaksi 2 gagal di ESCROW_HOLD, seluruhnya rollback.
      await prisma.wallet.delete({ where: { providerProfileId: w.provider.id } });
      expect((await send(paid(payment))).status).toBe(200);

      const eventId = `invoice:${payment.xenditInvoiceId}:PAID`;
      expect(await event(eventId)).toMatchObject({ processingStatus: 'FAILED', retryCount: 0 });
      expect(await orderStatus(id)).toBe('ACCEPTED');
      expect((await paymentOf(payment.id)).status).toBe('PENDING');

      await prisma.wallet.create({ data: { providerProfileId: w.provider.id } });
      expect(await recoverWebhookEvents()).toMatchObject({ retried: 1, processed: 1, failed: 0 });

      expect(await event(eventId)).toMatchObject({ processingStatus: 'PROCESSED', retryCount: 1, errorMessage: null });
      expect(await orderStatus(id)).toBe('PAID');
      expect(await holds(id)).toBe(1);
    });

    it('PROCESSING yang macet lebih dari 5 menit dikembalikan ke FAILED lalu diproses ulang', async () => {
      const { id, payment } = await acceptedOrder();
      const eventId = `invoice:${payment.xenditInvoiceId}:PAID`;
      await prisma.webhookEvent.create({
        data: { domain: 'PAYMENT', eventId, eventType: 'PAID', referenceId: payment.xenditInvoiceId, payload: paid(payment), processingStatus: 'PROCESSING', lockedAt: new Date(Date.now() - 6 * MINUTE) },
      });
      // Yang baru dikunci belum dianggap macet.
      const fresh = await prisma.webhookEvent.create({
        data: { domain: 'PAYMENT', eventId: 'invoice:inv-baru:PAID', eventType: 'PAID', payload: {}, processingStatus: 'PROCESSING', lockedAt: new Date() },
      });

      expect(await recoverWebhookEvents()).toMatchObject({ stuck: 1, retried: 1, processed: 1 });
      expect(await event(eventId)).toMatchObject({ processingStatus: 'PROCESSED', retryCount: 1 });
      expect(await holds(id)).toBe(1);
      expect((await prisma.webhookEvent.findUniqueOrThrow({ where: { id: fresh.id } })).processingStatus).toBe('PROCESSING');
    });

    it('event yang sudah gagal 3 kali tidak diulang lagi', async () => {
      const { id, payment } = await acceptedOrder();
      const eventId = `invoice:${payment.xenditInvoiceId}:PAID`;
      await prisma.webhookEvent.create({
        data: { domain: 'PAYMENT', eventId, eventType: 'PAID', payload: paid(payment), processingStatus: 'FAILED', retryCount: 3, errorMessage: 'koneksi putus' },
      });

      expect(await recoverWebhookEvents()).toMatchObject({ retried: 0 });
      expect(await event(eventId)).toMatchObject({ processingStatus: 'FAILED', retryCount: 3 });
      expect(await orderStatus(id)).toBe('ACCEPTED');
    });

    it('event D120 dan bayar dobel tidak pernah diulang', async () => {
      const mismatch = await acceptedOrder();
      await send(paid(mismatch.payment, { paid_amount: 1 }));
      const double = await acceptedOrder(4);
      await send(paid(double.payment));
      await send(paid(double.payment, { id: 'inv-yatim-dobel' }));

      expect(await recoverWebhookEvents()).toMatchObject({ retried: 0 });
      expect(await event(`invoice:${mismatch.payment.xenditInvoiceId}:PAID`)).toMatchObject({ processingStatus: 'FAILED', retryCount: 0 });
      expect(await event('invoice:inv-yatim-dobel:PAID')).toMatchObject({ processingStatus: 'FAILED', retryCount: 0 });
    });
  });
});
