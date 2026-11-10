/**
 * Sesi 7c: sweep settlement T18 (PRD 7.1, State Machine 3) dan ESCROW_RELEASE.
 *
 *   H3      satu order satu ESCROW_RELEASE, termasuk dua sweep bersamaan
 *   T18     guard holding window dan dispute OPEN atau UNDER_REVIEW
 *   D101    T1 sampai T18 end-to-end dengan T5 lewat webhook sungguhan
 *   V1      ledger dan cache saldo tetap rekonsiliasi setelah tiap test
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma, Prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { logger } from '../src/lib/logger';
import { sweepSettlements } from '../src/modules/orders/order-expiry.service';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import { MINUTE, auth, completedOrder, newUser, newWorld, runExecution, type User, type World } from './helpers/orders';
import { runVerificationQuery } from './helpers/providers';

describe.skipIf(!hasTestDatabase)('settlement T18 (7c)', () => {
  let app: Express;
  let w: World;

  const due = (orderId: string, at = new Date(Date.now() - 1000)) =>
    prisma.order.update({ where: { id: orderId }, data: { settlementDueAt: at } });
  const ledger = (orderId: string) =>
    prisma.walletTransaction.findMany({ where: { orderId }, orderBy: { id: 'asc' } });
  const wallet = () => prisma.wallet.findUniqueOrThrow({ where: { providerProfileId: w.provider.id } });
  const orderOf = (id: string) => prisma.order.findUniqueOrThrow({ where: { id } });

  beforeEach(async () => {
    await resetDatabase();
    app = createApp();
    w = await newWorld();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    expect(await runVerificationQuery('V1')).toEqual([]);
  });

  it('T18: SETTLED, settled_at, tepat satu ESCROW_RELEASE, saldo pindah, notifikasi pemilik', async () => {
    const { id } = await completedOrder(app, w);
    await due(id);
    const info = vi.spyOn(logger, 'info');

    expect(await sweepSettlements()).toEqual({ candidates: 1, settled: 1, failed: 0 });
    // Log ringkasan menyebut order yang cair, bukan expired.
    expect(info).toHaveBeenCalledWith({ job: 'settlement-sweep', candidates: 1, failed: 0, settled: 1 }, 'Sweep deadline selesai');

    const order = await orderOf(id);
    expect(order.status).toBe('SETTLED');
    expect(order.settledAt).not.toBeNull();
    const earning = order.providerEarning;

    const rows = await ledger(id);
    expect(rows.map((r) => r.type)).toEqual(['ESCROW_HOLD', 'ESCROW_RELEASE']);
    const release = rows[1];
    expect(release.amountAvailableDelta.equals(earning)).toBe(true);
    expect(release.amountPendingDelta.equals(earning.negated())).toBe(true);
    expect(release.balanceAvailableAfter.equals(earning)).toBe(true);
    expect(release.balancePendingAfter.equals(0)).toBe(true);

    const after = await wallet();
    expect(after.balanceAvailable.equals(earning)).toBe(true);
    expect(after.balancePending.equals(0)).toBe(true);

    const history = await prisma.orderStatusHistory.findFirstOrThrow({ where: { orderId: id, toStatus: 'SETTLED' } });
    expect(history).toMatchObject({ fromStatus: 'COMPLETED', actor: 'SYSTEM', changedByUserId: null });
    const notified = await prisma.notification.findMany({ where: { referenceId: id, title: { startsWith: 'Dana order cair' } } });
    expect(notified.map((n) => n.userId)).toEqual([w.owner.id]);
  });

  it.each(['OPEN', 'UNDER_REVIEW'] as const)('dispute %s menahan settlement', async (status) => {
    const { id } = await completedOrder(app, w);
    await due(id);
    // Endpoint dispute milik Fase 8, jadi barisnya ditulis langsung.
    await prisma.dispute.create({
      data: { orderId: id, raisedByUserId: w.client.id, raisedByRole: 'CLIENT', category: 'POOR_QUALITY', description: 'Uji 7c', status },
    });

    expect(await sweepSettlements()).toEqual({ candidates: 0, settled: 0, failed: 0 });
    expect((await orderOf(id)).status).toBe('COMPLETED');
    expect((await ledger(id)).map((r) => r.type)).toEqual(['ESCROW_HOLD']);
  });

  it('dispute yang sudah selesai tidak menahan settlement', async () => {
    const { id } = await completedOrder(app, w);
    await due(id);
    await prisma.dispute.create({
      data: { orderId: id, raisedByUserId: w.client.id, raisedByRole: 'CLIENT', category: 'OTHER', description: 'Uji 7c', status: 'CLOSED' },
    });
    expect(await sweepSettlements()).toMatchObject({ settled: 1, failed: 0 });
  });

  it('order yang belum lewat settlement_due_at tidak tersentuh', async () => {
    const { id } = await completedOrder(app, w);
    expect((await orderOf(id)).settlementDueAt!.getTime()).toBeGreaterThan(Date.now());

    expect(await sweepSettlements()).toEqual({ candidates: 0, settled: 0, failed: 0 });
    expect((await orderOf(id)).status).toBe('COMPLETED');
    expect((await ledger(id)).map((r) => r.type)).toEqual(['ESCROW_HOLD']);
  });

  it('dua sweep bersamaan: tiap order tepat satu ESCROW_RELEASE', async () => {
    const orders = [
      await completedOrder(app, w, { assigned: w.w2 }),
      await completedOrder(app, w, { assigned: w.w3 }),
      await completedOrder(app, w, { assigned: w.owner }),
    ];
    for (const o of orders) await due(o.id);

    const results = await Promise.all([sweepSettlements(), sweepSettlements()]);

    expect(results[0].settled + results[1].settled).toBe(3);
    expect(results.every((r) => r.failed === 0)).toBe(true);
    for (const o of orders) {
      expect((await orderOf(o.id)).status).toBe('SETTLED');
      expect(await prisma.walletTransaction.count({ where: { orderId: o.id, type: 'ESCROW_RELEASE' } })).toBe(1);
      expect(await prisma.orderStatusHistory.count({ where: { orderId: o.id, toStatus: 'SETTLED' } })).toBe(1);
    }
  });

  it('satu order yang gagal di tengah batch tidak menggagalkan order lain', async () => {
    const a = await completedOrder(app, w, { assigned: w.w2 });
    const b = await completedOrder(app, w, { assigned: w.w3 });
    const c = await completedOrder(app, w, { assigned: w.owner });
    // b macet: dana sudah dilepas tapi statusnya tidak pernah pindah. Ledger tetap
    // rekonsiliasi (V1), dan RELEASE kedua ditolak uniq_escrow_event_per_order.
    const orderB = await orderOf(b.id);
    const walletB = await prisma.wallet.update({
      where: { providerProfileId: w.provider.id },
      data: { balanceAvailable: { increment: orderB.providerEarning }, balancePending: { decrement: orderB.providerEarning } },
    });
    await prisma.walletTransaction.create({
      data: {
        walletId: walletB.id, orderId: b.id, type: 'ESCROW_RELEASE',
        amountAvailableDelta: orderB.providerEarning, amountPendingDelta: orderB.providerEarning.negated(),
        balanceAvailableAfter: walletB.balanceAvailable, balancePendingAfter: walletB.balancePending,
      },
    });
    await due(a.id, new Date(Date.now() - 3000));
    await due(b.id, new Date(Date.now() - 2000));
    await due(c.id, new Date(Date.now() - 1000));

    expect(await sweepSettlements()).toEqual({ candidates: 3, settled: 2, failed: 1 });
    expect((await orderOf(a.id)).status).toBe('SETTLED');
    expect((await orderOf(b.id)).status).toBe('COMPLETED');
    expect((await orderOf(c.id)).status).toBe('SETTLED');
    expect(await prisma.walletTransaction.count({ where: { orderId: b.id, type: 'ESCROW_RELEASE' } })).toBe(1);
  });

  it('D101: T1 sampai T18 dengan T5 lewat webhook, saldo akhir available = provider_earning, pending 0', async () => {
    const created = await request(app).post('/api/v1/orders').set(...auth(w.client)).send({
      listing_id: w.listingId,
      booking_mode: 'SCHEDULED',
      scheduled_at: new Date(Date.now() + 30 * MINUTE).toISOString(),
      location_source: 'SAVED_ADDRESS',
      address_id: w.addressId,
      selected_options: { durasi_liputan: '2 Jam' },
    });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    const id = created.body.data.id as string;
    const accepted = await request(app).post(`/api/v1/orders/${id}/accept`).set(...auth(w.owner)).send({ assigned_worker_id: w.w2.workerId });
    expect(accepted.status, JSON.stringify(accepted.body)).toBe(200);

    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: id } });
    const paid = await request(app)
      .post('/api/v1/webhooks/xendit/invoice')
      .set('x-callback-token', env.XENDIT_CALLBACK_TOKEN)
      .send({ id: payment.xenditInvoiceId, external_id: payment.xenditExternalId, status: 'PAID', paid_amount: payment.amount.toNumber() });
    expect(paid.status, JSON.stringify(paid.body)).toBe(200);
    expect((await orderOf(id)).status).toBe('PAID');

    await runExecution(app, w, id, w.w2);
    expect((await orderOf(id)).status).toBe('COMPLETED');
    await due(id);
    expect(await sweepSettlements()).toMatchObject({ settled: 1, failed: 0 });

    const order = await orderOf(id);
    expect(order.status).toBe('SETTLED');
    expect((await ledger(id)).map((r) => r.type)).toEqual(['ESCROW_HOLD', 'ESCROW_RELEASE']);
    const after = await wallet();
    expect(after.balanceAvailable.equals(order.providerEarning)).toBe(true);
    expect(after.balancePending.equals(new Prisma.Decimal(0))).toBe(true);

    const path = (await prisma.orderStatusHistory.findMany({ where: { orderId: id }, orderBy: { id: 'asc' } })).map((h) => h.toStatus);
    expect(path).toEqual(['PENDING_ACCEPTANCE', 'ACCEPTED', 'PAID', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'COMPLETED', 'SETTLED']);
    expect(await runVerificationQuery('V1')).toEqual([]);
  });

  describe('router /dev', () => {
    const patch = (orderId: string, as: User) =>
      request(app).patch(`/api/v1/dev/orders/${orderId}/deadline`).set(...auth(as)).send({ field: 'settlement_due_at' });
    const run = (job: string) => request(app).post(`/api/v1/dev/jobs/${job}/run`).set(...auth(w.client));

    it('settlement_due_at hanya untuk order COMPLETED, lalu sweep settlement dan pemulihan webhook bisa dipicu', async () => {
      const { id } = await completedOrder(app, w);
      expect((await patch(id, await newUser())).status).toBe(403);
      expect((await patch(id, w.client)).status).toBe(200);
      expect((await orderOf(id)).settlementDueAt!.getTime()).toBeLessThan(Date.now());

      const res = await run('settlement');
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data).toEqual({ candidates: 1, settled: 1, failed: 0 });
      expect((await patch(id, w.client)).status).toBe(409);

      const recovery = await run('webhook-recovery');
      expect(recovery.status).toBe(200);
      expect(recovery.body.data).toEqual({ stuck: 0, retried: 0, processed: 0, failed: 0 });
    });
  });
});
