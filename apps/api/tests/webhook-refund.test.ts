/**
 * Sesi 8c: POST /webhooks/xendit/refund (D136 no. 4), T22, dan cron pemulihannya (D121).
 * Menggantikan test stub 8a.
 *
 *   H13     token callback, gagal tertutup
 *   D136    dicocokkan lewat data.reference_id = refunds.id
 *   T22     SUCCEEDED untuk order batal T9/T11 menjadi REFUNDED, tanpa ledger (D132)
 *   D135    refund pembayaran telat tidak memicu T22
 *   fixture payload sungguhan dari sandbox 8a
 *   V1      ledger dan cache saldo tetap rekonsiliasi setelah tiap test
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma, type Prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { AppError } from '../src/lib/errors';
import { paymentGateway } from '../src/lib/payment-gateway';
import { recoverWebhookEvents } from '../src/modules/webhooks/webhooks.service';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import { acceptedScheduledOrder, auth, newWorld, paidScheduledOrder, type World } from './helpers/orders';
import { runVerificationQuery } from './helpers/providers';

type Payload = { event: string; data: { id: string; reference_id: string; status: string; [key: string]: Prisma.InputJsonValue | null } };
const fixture = JSON.parse(readFileSync(resolve(__dirname, 'fixtures/xendit-sandbox-8a.json'), 'utf8')) as Record<string, Payload>;

describe.skipIf(!hasTestDatabase)('webhook refund Xendit (8c)', () => {
  let app: Express;
  let w: World;

  const send = (body: object, token: string | null = env.XENDIT_CALLBACK_TOKEN) => {
    const req = request(app).post('/api/v1/webhooks/xendit/refund');
    return (token === null ? req : req.set('x-callback-token', token)).send(body);
  };
  const refundEvent = (refundId: string, status: string, data: Record<string, string> = {}): Payload => ({
    event: `refund.${status.toLowerCase()}`,
    data: { id: `rfd-${refundId}`, reference_id: refundId, status, amount: 500000, payment_method_type: 'EWALLET', ...data },
  });
  const eventOf = (body: Payload) => prisma.webhookEvent.findUniqueOrThrow({ where: { eventId: `refund:${body.data.id}:${body.data.status}` } });
  const orderStatus = async (id: string) => (await prisma.order.findUniqueOrThrow({ where: { id } })).status;
  const refundOf = (orderId: string) => prisma.refund.findFirstOrThrow({ where: { orderId } });
  const ledger = (orderId: string) => prisma.walletTransaction.count({ where: { orderId } });
  const t22 = (orderId: string) => prisma.orderStatusHistory.count({ where: { orderId, fromStatus: 'CANCELLED', toStatus: 'REFUNDED' } });

  /** T9 dengan gateway fake: refund PROCESSING. */
  async function cancelledPaid() {
    const { id } = await paidScheduledOrder(app, w);
    expect((await request(app).post(`/api/v1/orders/${id}/cancel`).set(...auth(w.client)).send({})).status).toBe(200);
    return { id, refund: await refundOf(id) };
  }

  beforeEach(async () => {
    await resetDatabase();
    app = createApp();
    w = await newWorld();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    expect(await runVerificationQuery('V1')).toEqual([]);
  });

  it.each([
    ['salah', 'token-salah'],
    ['tidak ada', null],
  ])('token %s ditolak 401 tanpa mencatat apa pun', async (_label, token) => {
    const { refund } = await cancelledPaid();
    expect((await send(refundEvent(refund.id, 'SUCCEEDED'), token)).status).toBe(401);
    expect(await prisma.webhookEvent.count()).toBe(0);
  });

  it('body tanpa data.reference_id ditolak 422 sebelum dicatat', async () => {
    expect((await send({ event: 'refund.succeeded', data: { id: 'rfd-x', status: 'SUCCEEDED' } })).status).toBe(422);
    expect(await prisma.webhookEvent.count()).toBe(0);
  });

  it('SUCCEEDED dari PROCESSING: COMPLETED dan T22 beraktor SYSTEM, tanpa ledger baru; dikirim dua kali tetap satu efek', async () => {
    const { id, refund } = await cancelledPaid();
    const ledgerBefore = await ledger(id);
    const body = refundEvent(refund.id, 'SUCCEEDED');

    const res = await send(body);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ received: true });

    const after = await refundOf(id);
    expect(after).toMatchObject({ status: 'COMPLETED', xenditRefundId: `fake-ref-${refund.id}`, completedBy: null });
    expect(after.completedAt).not.toBeNull();
    expect(await orderStatus(id)).toBe('REFUNDED');
    expect(await prisma.orderStatusHistory.findFirstOrThrow({ where: { orderId: id, toStatus: 'REFUNDED' } })).toMatchObject({ actor: 'SYSTEM', metadata: null });
    expect(await ledger(id)).toBe(ledgerBefore);
    expect(await eventOf(body)).toMatchObject({ domain: 'REFUND', eventType: 'SUCCEEDED', referenceId: body.data.id, processingStatus: 'PROCESSED' });

    // Kiriman ulang Xendit: event_id sama, tidak diproses lagi.
    expect((await send(body)).status).toBe(200);
    expect(await prisma.webhookEvent.count()).toBe(1);
    expect(await t22(id)).toBe(1);
    expect(await prisma.notification.count({ where: { channel: 'EMAIL', userId: w.client.id, title: { startsWith: 'Refund selesai' } } })).toBe(1);
  });

  it('fixture sandbox refund_succeeded_ewallet dengan reference_id diganti: diproses, id Xendit mengisi refund yang timeout', async () => {
    vi.spyOn(paymentGateway, 'refund').mockRejectedValueOnce(
      new AppError('PAYMENT_GATEWAY_ERROR', 'uji', { context: { gateway_operation: 'refund', gateway_timeout: true } }),
    );
    const { id, refund } = await cancelledPaid();
    expect(refund).toMatchObject({ status: 'PROCESSING', xenditRefundId: null });

    const base = fixture.refund_succeeded_ewallet!;
    const body: Payload = { ...base, data: { ...base.data, reference_id: refund.id } };
    expect((await send(body)).status).toBe(200);

    expect(await refundOf(id)).toMatchObject({ status: 'COMPLETED', xenditRefundId: base.data.id });
    expect(await orderStatus(id)).toBe('REFUNDED');
    expect((await eventOf(body)).processingStatus).toBe('PROCESSED');
  });

  it('SUCCEEDED yang mendahului respons API saat refund masih REQUESTED: COMPLETED dan tidak ditimpa PROCESSING', async () => {
    vi.spyOn(paymentGateway, 'refund').mockImplementationOnce(async (input) => {
      expect((await send(refundEvent(input.referenceId, 'SUCCEEDED'))).status).toBe(200);
      return { refundId: `rfd-${input.referenceId}`, status: 'PENDING', raw: {} };
    });
    const { id, refund } = await cancelledPaid();
    expect(refund).toMatchObject({ status: 'COMPLETED', xenditRefundId: `rfd-${refund.id}` });
    expect(await orderStatus(id)).toBe('REFUNDED');
  });

  it('FAILED: refund FAILED, order tetap CANCELLED, failure_code di pesan event; SUCCEEDED sesudahnya IGNORED', async () => {
    const { id, refund } = await cancelledPaid();
    const failed = refundEvent(refund.id, 'FAILED', { failure_code: 'INSUFFICIENT_BALANCE' });
    expect((await send(failed)).status).toBe(200);
    expect((await refundOf(id)).status).toBe('FAILED');
    expect(await orderStatus(id)).toBe('CANCELLED');
    expect((await eventOf(failed)).errorMessage).toContain('INSUFFICIENT_BALANCE');

    const late = refundEvent(refund.id, 'SUCCEEDED');
    expect((await send(late)).status).toBe(200);
    expect((await eventOf(late)).processingStatus).toBe('IGNORED');
    expect((await refundOf(id)).status).toBe('FAILED');
    expect(await t22(id)).toBe(0);
  });

  it.each([
    ['status PENDING', (refundId: string) => refundEvent(refundId, 'PENDING')],
    ['reference_id bukan uuid', () => refundEvent('bukan-uuid', 'SUCCEEDED')],
    ['reference_id uuid yang tidak dikenal', () => refundEvent('00000000-0000-4000-8000-000000000000', 'SUCCEEDED')],
  ])('%s: IGNORED tanpa perubahan', async (_label, make) => {
    const { id, refund } = await cancelledPaid();
    const body = make(refund.id);
    expect((await send(body)).status).toBe(200);
    expect((await eventOf(body)).processingStatus).toBe('IGNORED');
    expect((await refundOf(id)).status).toBe('PROCESSING');
    expect(await orderStatus(id)).toBe('CANCELLED');
  });

  it('D135: refund pembayaran telat untuk order yang batal lewat T7 selesai tanpa T22', async () => {
    const { id } = await acceptedScheduledOrder(app, w);
    expect((await request(app).post(`/api/v1/orders/${id}/cancel`).set(...auth(w.client)).send({})).status).toBe(200);
    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: id } });
    const paid = await request(app)
      .post('/api/v1/webhooks/xendit/invoice')
      .set('x-callback-token', env.XENDIT_CALLBACK_TOKEN)
      .send({
        id: payment.xenditInvoiceId,
        external_id: payment.xenditExternalId,
        status: 'PAID',
        paid_amount: payment.amount.toNumber(),
        payment_method: 'EWALLET',
        payment_channel: 'GOPAY',
        paid_at: new Date().toISOString(),
      });
    expect(paid.status).toBe(200);
    const refund = await refundOf(id);
    expect(refund).toMatchObject({ status: 'PROCESSING', initiatedBy: null });

    expect((await send(refundEvent(refund.id, 'SUCCEEDED'))).status).toBe(200);
    expect((await refundOf(id)).status).toBe('COMPLETED');
    expect(await orderStatus(id)).toBe('CANCELLED');
    expect(await t22(id)).toBe(0);
    expect(await ledger(id)).toBe(0);
  });

  it('D121: event REFUND yang FAILED diulang cron pemulihan dari payload tersimpan', async () => {
    const { id, refund } = await cancelledPaid();
    const body = refundEvent(refund.id, 'SUCCEEDED');
    await prisma.webhookEvent.create({
      data: {
        domain: 'REFUND',
        eventId: `refund:${body.data.id}:SUCCEEDED`,
        eventType: 'SUCCEEDED',
        referenceId: body.data.id,
        payload: body as unknown as Prisma.InputJsonValue,
        signatureValid: true,
        processingStatus: 'FAILED',
        errorMessage: 'galat sementara (uji)',
      },
    });

    expect(await recoverWebhookEvents()).toMatchObject({ retried: 1, processed: 1, failed: 0 });
    expect((await eventOf(body)).processingStatus).toBe('PROCESSED');
    expect(await orderStatus(id)).toBe('REFUNDED');
  });
});
