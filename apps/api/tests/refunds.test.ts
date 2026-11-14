/**
 * Sesi 8c: pembatalan berbayar T9 dan T11, eksekusi refund, jalur manual, dan sync.
 *
 *   D131        refund penuh termasuk platform fee, siapa pun yang membatalkan
 *   D132, H101  tepat satu REFUND_DEDUCTION per order, sisipan kedua ditolak basis data
 *   D136        jalur dipilih dari payment_method, bukan dari error_code
 *   usulan D140 diterima PROCESSING, timeout/5xx/409 PROCESSING tanpa id, 4xx FAILED
 *   complete manual dari FAILED, atau REQUESTED non-API saja
 *   H106        sync refund lewat applyRefundEvent yang sama dengan webhook
 *   V1          ledger dan cache saldo tetap rekonsiliasi setelah tiap test
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma, Prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { AppError } from '../src/lib/errors';
import { paymentGateway } from '../src/lib/payment-gateway';
import { createRefund } from '../src/modules/refunds/refunds.service';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import { auth, newUser, newWorld, paidScheduledOrder, type User, type World } from './helpers/orders';
import { runVerificationQuery } from './helpers/providers';

describe.skipIf(!hasTestDatabase)('refund (8c)', () => {
  let app: Express;
  let w: World;
  let admin: User;

  const cancel = (id: string, as: User, body: object = {}) => request(app).post(`/api/v1/orders/${id}/cancel`).set(...auth(as)).send(body);
  const depart = (id: string) => request(app).post(`/api/v1/orders/${id}/depart`).set(...auth(w.w2)).send({});
  const complete = (id: string, body: object = { completion_note: 'Transfer BCA ref 12345' }, as: User = admin) =>
    request(app).post(`/api/v1/admin/refunds/${id}/complete`).set(...auth(as)).send(body);
  const sync = (id: string) => request(app).post(`/api/v1/admin/refunds/${id}/sync`).set(...auth(admin));

  const orderOf = (id: string) => prisma.order.findUniqueOrThrow({ where: { id } });
  const refundOf = (orderId: string) => prisma.refund.findFirstOrThrow({ where: { orderId } });
  const deductions = (orderId: string) => prisma.walletTransaction.findMany({ where: { orderId, type: 'REFUND_DEDUCTION' } });
  const wallet = () => prisma.wallet.findUniqueOrThrow({ where: { providerProfileId: w.provider.id } });
  const gatewayError = (context: Record<string, unknown>) =>
    new AppError('PAYMENT_GATEWAY_ERROR', 'Gateway pembayaran gagal (uji)', { context: { gateway_operation: 'refund', ...context } });

  /** Order PAID lalu dibatalkan client (T9). */
  async function cancelledPaid(paymentMethod = 'FAKE') {
    const { id } = await paidScheduledOrder(app, w, { paymentMethod });
    const res = await cancel(id, w.client);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    return { id, refund: await refundOf(id) };
  }

  beforeEach(async () => {
    await resetDatabase();
    app = createApp();
    w = await newWorld();
    admin = await newUser({ admin: true });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    expect(await runVerificationQuery('V1')).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // T9, T11
  // -------------------------------------------------------------------------

  describe('pembatalan setelah bayar', () => {
    async function expectPaidCancellation(id: string, initiatedBy: string, cancelledBy: string) {
      const order = await orderOf(id);
      expect(order).toMatchObject({ status: 'CANCELLED', cancelledBy });
      expect(order.cancelledAt).not.toBeNull();
      // D131: platform fee ikut dikembalikan.
      expect(order.platformFeeRefunded.toNumber()).toBe(order.platformFee.toNumber());
      expect(order.platformFee.toNumber()).toBeGreaterThan(0);

      // D132: tepat satu REFUND_DEDUCTION, pending -= provider_earning, available tidak tersentuh.
      const rows = await deductions(id);
      expect(rows).toHaveLength(1);
      expect(rows[0]!.amountPendingDelta.toNumber()).toBe(-order.providerEarning.toNumber());
      expect(rows[0]!.amountAvailableDelta.toNumber()).toBe(0);
      const balance = await wallet();
      expect(balance.balancePending.toNumber()).toBe(0);
      expect(balance.balanceAvailable.toNumber()).toBe(0);

      const refunds = await prisma.refund.findMany({ where: { orderId: id } });
      expect(refunds).toHaveLength(1);
      expect(refunds[0]).toMatchObject({ type: 'FULL', includesPlatformFee: true, initiatedBy });
      expect(refunds[0]!.amount.toNumber()).toBe(order.totalAmount.toNumber());
      return refunds[0]!;
    }

    it('T9 oleh client: refund FULL, satu REFUND_DEDUCTION, fee penuh, jalur API PROCESSING, slot pekerja lepas', async () => {
      const scheduledAt = new Date(Date.now() + 60 * 60_000);
      const { id } = await paidScheduledOrder(app, w, { scheduledAt });
      const refundApi = vi.spyOn(paymentGateway, 'refund');

      const res = await cancel(id, w.client, { reason: 'Acara batal' });
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');

      const refund = await expectPaidCancellation(id, w.client.id, 'CLIENT');
      const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: id, status: 'PAID' } });
      expect(refundApi).toHaveBeenCalledOnce();
      expect(refundApi).toHaveBeenCalledWith({ referenceId: refund.id, invoiceId: payment.xenditInvoiceId, amount: refund.amount.toNumber(), reason: 'CANCELLATION' });
      expect(refund).toMatchObject({ status: 'PROCESSING', xenditRefundId: `fake-ref-${refund.id}`, reason: 'Acara batal' });

      // Slot w2 lepas (H26): order baru di jam yang sama bisa ditugaskan ke w2.
      await expect(paidScheduledOrder(app, w, { scheduledAt })).resolves.toBeTruthy();
    });

    it('T11 oleh pemilik setelah berangkat: efek sama, pendamping ikut lepas', async () => {
      const scheduledAt = new Date(Date.now() + 30 * 60_000);
      const { id } = await paidScheduledOrder(app, w, { scheduledAt, crew: [w.w3] });
      expect((await depart(id)).status).toBe(200);

      const res = await cancel(id, w.owner, { reason: 'Kendaraan rusak' });
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      await expectPaidCancellation(id, w.owner.id, 'PROVIDER');
      expect(await prisma.orderStatusHistory.count({ where: { orderId: id, fromStatus: 'ON_THE_WAY', toStatus: 'CANCELLED', actor: 'PROVIDER' } })).toBe(1);

      // Pendamping w3 bebas lagi di jam itu.
      await expect(paidScheduledOrder(app, w, { scheduledAt, assigned: w.w3 })).resolves.toBeTruthy();
    });

    it('T9 oleh admin: aktor ADMIN, initiated_by admin', async () => {
      const { id } = await paidScheduledOrder(app, w);
      const res = await cancel(id, admin, { reason: 'Laporan penipuan' });
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      await expectPaidCancellation(id, admin.id, 'ADMIN');
    });

    it('pekerja penanggung jawab tidak bisa membatalkan order PAID (403), tanpa refund dan tanpa ledger', async () => {
      const { id } = await paidScheduledOrder(app, w);
      const res = await cancel(id, w.w2);
      expect(res.status).toBe(403);
      expect((await orderOf(id)).status).toBe('PAID');
      expect(await prisma.refund.count({ where: { orderId: id } })).toBe(0);
      expect(await deductions(id)).toHaveLength(0);
    });

    it('H101: REFUND_DEDUCTION kedua untuk order yang sama ditolak basis data', async () => {
      const { id } = await cancelledPaid();
      const [first] = await deductions(id);
      await expect(
        prisma.walletTransaction.create({
          data: {
            walletId: first!.walletId,
            orderId: id,
            type: 'REFUND_DEDUCTION',
            amountPendingDelta: -1,
            balanceAvailableAfter: 0,
            balancePendingAfter: 0,
            description: 'Deduction kedua (uji H101)',
          },
        }),
      ).rejects.toMatchObject({ code: 'P2002' });
      expect(await deductions(id)).toHaveLength(1);
    });
  });

  describe('nominal refund', () => {
    it('memakai paid_amount (uang yang benar-benar masuk), amount hanya cadangan kalau null', async () => {
      const { id } = await paidScheduledOrder(app, w);
      const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: id, status: 'PAID' } });
      const make = (paidAmount: Prisma.Decimal | null) =>
        prisma.$transaction((tx) => createRefund(tx, () => {}, { orderId: id, payment: { ...payment, paidAmount }, initiatedBy: null, reason: 'uji nominal' }));
      expect((await make(new Prisma.Decimal(499000))).amount.toNumber()).toBe(499000);
      expect((await make(null)).amount.toNumber()).toBe(payment.amount.toNumber());
    });
  });

  // -------------------------------------------------------------------------
  // Eksekusi (usulan D140)
  // -------------------------------------------------------------------------

  describe('eksekusi refund setelah commit', () => {
    it('EWALLET lewat API: diterima, PROCESSING dengan id Xendit', async () => {
      vi.spyOn(paymentGateway, 'refund').mockImplementationOnce(async (input) => ({ refundId: `rfd-${input.referenceId}`, status: 'PENDING', raw: {} }));
      const { refund } = await cancelledPaid('EWALLET');
      expect(refund).toMatchObject({ status: 'PROCESSING', xenditRefundId: `rfd-${refund.id}` });
    });

    it.each([
      ['timeout', { gateway_timeout: true }],
      ['galat jaringan', { gateway_timeout: false }],
      ['5xx', { gateway_status: 503, gateway_error_code: null }],
      ['409 key sudah dipakai, pola D139', { gateway_status: 409, gateway_error_code: 'DUPLICATE_ERROR' }],
    ])('%s: PROCESSING tanpa id, status belum pasti', async (_label, context) => {
      vi.spyOn(paymentGateway, 'refund').mockRejectedValueOnce(gatewayError(context));
      const { refund } = await cancelledPaid();
      expect(refund).toMatchObject({ status: 'PROCESSING', xenditRefundId: null });
    });

    it.each([
      ['400', { gateway_status: 400, gateway_error_code: 'REFUND_NOT_SUPPORTED' }],
      ['404', { gateway_status: 404, gateway_error_code: 'TRANSACTION_NOT_FOUND' }],
    ])('ditolak %s: FAILED, jalur manual', async (_label, context) => {
      vi.spyOn(paymentGateway, 'refund').mockRejectedValueOnce(gatewayError(context));
      const { id, refund } = await cancelledPaid();
      expect(refund).toMatchObject({ status: 'FAILED', xenditRefundId: null });
      // Ledger tetap ditulis di T9, lepas dari nasib panggilan API (D132).
      expect(await deductions(id)).toHaveLength(1);
    });

    it('BANK_TRANSFER: tidak memanggil gateway, tetap REQUESTED (jalur manual)', async () => {
      const refundApi = vi.spyOn(paymentGateway, 'refund');
      const { refund } = await cancelledPaid('BANK_TRANSFER');
      expect(refundApi).not.toHaveBeenCalled();
      expect(refund).toMatchObject({ status: 'REQUESTED', xenditRefundId: null });
    });
  });

  // -------------------------------------------------------------------------
  // Jalur manual
  // -------------------------------------------------------------------------

  describe('POST /admin/refunds/:id/complete', () => {
    it('REQUESTED non-API: catatan wajib, COMPLETED, T22 beraktor SYSTEM dengan admin di metadata, tanpa ledger baru', async () => {
      const { id, refund } = await cancelledPaid('BANK_TRANSFER');
      const ledgerBefore = await prisma.walletTransaction.count({ where: { orderId: id } });

      const missing = await complete(refund.id, {});
      expect(missing.status).toBe(422);
      expect((await complete(refund.id, { completion_note: '  ' })).status).toBe(422);

      const res = await complete(refund.id);
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data).toMatchObject({ status: 'COMPLETED', completed_by: admin.id, completion_note: 'Transfer BCA ref 12345', payment_method: 'BANK_TRANSFER' });
      expect(res.body.data.completed_at).not.toBeNull();

      expect((await orderOf(id)).status).toBe('REFUNDED');
      const t22 = await prisma.orderStatusHistory.findFirstOrThrow({ where: { orderId: id, toStatus: 'REFUNDED' } });
      expect(t22).toMatchObject({ fromStatus: 'CANCELLED', actor: 'SYSTEM', changedByUserId: null });
      expect(t22.metadata).toEqual({ operation: 'REFUND_COMPLETED_MANUALLY', admin_user_id: admin.id, refund_id: refund.id });
      expect(await prisma.walletTransaction.count({ where: { orderId: id } })).toBe(ledgerBefore);
      expect(await prisma.notification.count({ where: { userId: w.client.id, title: { startsWith: 'Refund selesai' } } })).toBe(1);

      const again = await complete(refund.id);
      expect(again.status).toBe(409);
      expect(again.body.error.code).toBe('REFUND_STATE_CONFLICT');
    });

    it('FAILED (jalur API buntu) bisa diselesaikan manual', async () => {
      vi.spyOn(paymentGateway, 'refund').mockRejectedValueOnce(gatewayError({ gateway_status: 400, gateway_error_code: 'API_VALIDATION_ERROR' }));
      const { id, refund } = await cancelledPaid();
      const res = await complete(refund.id);
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');
      expect((await orderOf(id)).status).toBe('REFUNDED');
    });

    it('PROCESSING ditolak 409: diselesaikan webhook atau sync', async () => {
      const { id, refund } = await cancelledPaid();
      expect(refund.status).toBe('PROCESSING');
      const res = await complete(refund.id);
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('REFUND_STATE_CONFLICT');
      expect((await orderOf(id)).status).toBe('CANCELLED');
    });

    it('REQUESTED untuk metode API ditolak 409: panggilan API mungkin belum dijawab', async () => {
      const { refund } = await cancelledPaid('EWALLET');
      await prisma.refund.update({ where: { id: refund.id }, data: { status: 'REQUESTED', xenditRefundId: null } });
      const res = await complete(refund.id);
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('REFUND_STATE_CONFLICT');
    });

    it('hanya admin', async () => {
      const { refund } = await cancelledPaid('BANK_TRANSFER');
      expect((await complete(refund.id, undefined, w.owner)).status).toBe(403);
      expect((await request(app).get('/api/v1/admin/refunds').set(...auth(w.owner))).status).toBe(403);
    });
  });

  describe('GET /admin/refunds', () => {
    it('filter status, memuat order_number dan payment_method, dipaginasi', async () => {
      const api = await cancelledPaid();
      const manual = await cancelledPaid('BANK_TRANSFER');

      const all = await request(app).get('/api/v1/admin/refunds').set(...auth(admin));
      expect(all.status).toBe(200);
      expect(all.body.meta).toMatchObject({ page: 1, total: 2 });

      const requested = await request(app).get('/api/v1/admin/refunds?status=REQUESTED').set(...auth(admin));
      expect(requested.body.data).toHaveLength(1);
      const { orderNumber } = await orderOf(manual.id);
      expect(requested.body.data[0]).toMatchObject({ id: manual.refund.id, order_number: orderNumber, payment_method: 'BANK_TRANSFER', status: 'REQUESTED' });

      const processing = await request(app).get('/api/v1/admin/refunds?status=PROCESSING&limit=1').set(...auth(admin));
      expect(processing.body.data.map((r: { id: string }) => r.id)).toEqual([api.refund.id]);
      expect((await request(app).get('/api/v1/admin/refunds?status=SALAH').set(...auth(admin))).status).toBe(422);
    });
  });

  // -------------------------------------------------------------------------
  // Sync (H106)
  // -------------------------------------------------------------------------

  describe('POST /admin/refunds/:id/sync', () => {
    const record = (referenceId: string, status: string, id = `rfd-${referenceId}`) => ({ id, status, reference_id: referenceId, failure_code: null });

    it('PROCESSING dengan id: dibaca lewat id, SUCCEEDED diterapkan seperti webhook (COMPLETED dan T22)', async () => {
      const { id, refund } = await cancelledPaid();
      const get = vi.spyOn(paymentGateway, 'getRefund');
      const res = await sync(refund.id);
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(get).toHaveBeenCalledWith(expect.objectContaining({ refundId: `fake-ref-${refund.id}`, referenceId: refund.id }));
      expect(res.body.data.sync).toMatchObject({ gateway_status: 'SUCCEEDED', outcome: 'PROCESSED' });
      expect(res.body.data.refund).toMatchObject({ status: 'COMPLETED', xendit_refund_id: `fake-ref-${refund.id}` });
      expect((await orderOf(id)).status).toBe('REFUNDED');
      expect(await prisma.orderStatusHistory.count({ where: { orderId: id, toStatus: 'REFUNDED', actor: 'SYSTEM' } })).toBe(1);
    });

    it('PROCESSING tanpa id (timeout): dicari lewat invoice dan reference_id, id Xendit terisi', async () => {
      vi.spyOn(paymentGateway, 'refund').mockRejectedValueOnce(gatewayError({ gateway_timeout: true }));
      const { id, refund } = await cancelledPaid();
      const payment = await prisma.payment.findUniqueOrThrow({ where: { id: refund.paymentId } });
      const get = vi.spyOn(paymentGateway, 'getRefund').mockResolvedValueOnce(record(refund.id, 'SUCCEEDED'));

      const res = await sync(refund.id);
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(get).toHaveBeenCalledWith({ refundId: null, invoiceId: payment.xenditInvoiceId, referenceId: refund.id });
      expect(res.body.data.refund).toMatchObject({ status: 'COMPLETED', xendit_refund_id: `rfd-${refund.id}` });
      expect((await orderOf(id)).status).toBe('REFUNDED');
    });

    it('FAILED dari Xendit: refund FAILED, order tetap CANCELLED', async () => {
      const { id, refund } = await cancelledPaid();
      vi.spyOn(paymentGateway, 'getRefund').mockResolvedValueOnce(record(refund.id, 'FAILED', `fake-ref-${refund.id}`));
      const res = await sync(refund.id);
      expect(res.body.data.refund.status).toBe('FAILED');
      expect((await orderOf(id)).status).toBe('CANCELLED');
    });

    it('PROCESSING yang tidak ditemukan: tanpa perubahan', async () => {
      const { refund } = await cancelledPaid();
      vi.spyOn(paymentGateway, 'getRefund').mockResolvedValueOnce(null);
      const refundApi = vi.spyOn(paymentGateway, 'refund');
      const res = await sync(refund.id);
      expect(res.status).toBe(200);
      expect(res.body.data.sync).toMatchObject({ outcome: 'NOT_FOUND', gateway_status: null });
      expect(res.body.data.refund.status).toBe('PROCESSING');
      expect(refundApi).not.toHaveBeenCalled();
    });

    it('H108: PROCESSING tanpa id (timeout) yang tidak ditemukan Xendit: kembali REQUESTED lalu dieksekusi ulang dengan key yang sama', async () => {
      vi.spyOn(paymentGateway, 'refund').mockRejectedValueOnce(gatewayError({ gateway_timeout: true }));
      const { refund } = await cancelledPaid();
      expect(await refundOf(refund.orderId)).toMatchObject({ status: 'PROCESSING', xenditRefundId: null });
      vi.spyOn(paymentGateway, 'getRefund').mockResolvedValueOnce(null);
      const refundApi = vi.spyOn(paymentGateway, 'refund');
      refundApi.mockClear();

      const res = await sync(refund.id);
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data.sync).toMatchObject({ outcome: 'RETRIED', gateway_status: null });
      expect(refundApi).toHaveBeenCalledOnce();
      expect(refundApi.mock.calls[0]![0].referenceId).toBe(refund.id);
      expect(res.body.data.refund).toMatchObject({ status: 'PROCESSING', xendit_refund_id: `fake-ref-${refund.id}` });
    });

    it('eksekusi setelah commit tidak pernah jalan (REQUESTED, metode API): tidak ditemukan, eksekusi diulang dengan key yang sama', async () => {
      const { refund } = await cancelledPaid();
      // Proses mati di antara commit T9 dan panggilan API.
      await prisma.refund.update({ where: { id: refund.id }, data: { status: 'REQUESTED', xenditRefundId: null } });
      vi.spyOn(paymentGateway, 'getRefund').mockResolvedValueOnce(null);
      const refundApi = vi.spyOn(paymentGateway, 'refund');

      const res = await sync(refund.id);
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data.sync.outcome).toBe('RETRIED');
      expect(refundApi).toHaveBeenCalledOnce();
      expect(refundApi.mock.calls[0]![0].referenceId).toBe(refund.id);
      expect(res.body.data.refund).toMatchObject({ status: 'PROCESSING', xendit_refund_id: `fake-ref-${refund.id}` });
    });

    it('REQUESTED metode API yang ternyata sudah ada di Xendit: diterapkan, tidak dieksekusi ulang', async () => {
      const { id, refund } = await cancelledPaid();
      await prisma.refund.update({ where: { id: refund.id }, data: { status: 'REQUESTED', xenditRefundId: null } });
      vi.spyOn(paymentGateway, 'getRefund').mockResolvedValueOnce(record(refund.id, 'SUCCEEDED'));
      const refundApi = vi.spyOn(paymentGateway, 'refund');

      const res = await sync(refund.id);
      expect(refundApi).not.toHaveBeenCalled();
      expect(res.body.data.refund.status).toBe('COMPLETED');
      expect((await orderOf(id)).status).toBe('REFUNDED');
    });

    it('REQUESTED non-API dan refund final ditolak 409; galat gateway jadi 502', async () => {
      const manual = await cancelledPaid('BANK_TRANSFER');
      expect((await sync(manual.refund.id)).body.error.code).toBe('REFUND_STATE_CONFLICT');

      const api = await cancelledPaid();
      vi.spyOn(paymentGateway, 'getRefund').mockRejectedValueOnce(gatewayError({ gateway_status: 500 }));
      const failed = await sync(api.refund.id);
      expect(failed.status).toBe(502);
      expect((await refundOf(api.id)).status).toBe('PROCESSING');

      expect((await sync(api.refund.id)).status).toBe(200);
      const final = await sync(api.refund.id);
      expect(final.status).toBe(409);
      expect(final.body.error.code).toBe('REFUND_STATE_CONFLICT');
    });
  });
});
