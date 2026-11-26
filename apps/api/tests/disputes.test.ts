/**
 * Sesi 8d: sengketa T13, T15, T17, T19 dan putusan T20, T21.
 *
 *   guard       jendela settlement_due_at, satu dispute per order, pekerja tidak berhak
 *   H78, H79    bukti multipart: magic bytes, Storage dulu baru baris
 *   usulan D148 lima bukti per pihak
 *   D133        PARTIAL: pembulatan fee, ledger pas sampai rupiah terakhir, pending kembali 0
 *   D132        REFUND_DEDUCTION di transisi pemicu, T22 tidak berlaku (D146)
 *   usulan D149 reason Xendit OTHERS untuk refund putusan
 *   usulan D150 RELEASE sebelum COMPLETED tidak menaikkan penghitung T16
 *   H100        balapan T19 lawan sweep T18, dan guard dispute di settleOrder
 *   V1          ledger dan cache saldo tetap rekonsiliasi setelah tiap test
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma, Prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { paymentGateway } from '../src/lib/payment-gateway';
import { partialSplit } from '../src/modules/disputes/disputes.service';
import { settleOrder, sweepSettlements } from '../src/modules/orders/order-expiry.service';
import { findBusyWorkers } from '../src/modules/orders/order-schedule';
import { withOrderTransaction } from '../src/modules/orders/order-transition.service';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import {
  RENON,
  auth,
  completedOrder,
  newUser,
  newWorld,
  paidScheduledOrder,
  waitForLockWaiters,
  type User,
  type World,
} from './helpers/orders';
import { FILES, mockStorage, runVerificationQuery, type StorageMocks } from './helpers/providers';

type Stage = 'ARRIVED' | 'IN_PROGRESS' | 'AWAITING_VERIFICATION' | 'COMPLETED';
const STEPS: Record<Exclude<Stage, 'COMPLETED'>, string[]> = {
  ARRIVED: ['depart', 'check-in'],
  IN_PROGRESS: ['depart', 'check-in', 'start'],
  AWAITING_VERIFICATION: ['depart', 'check-in', 'start', 'finish'],
};
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));

describe.skipIf(!hasTestDatabase)('sengketa (8d)', () => {
  let app: Express;
  let w: World;
  let admin: User;
  let storage: StorageMocks;

  const open = (id: string, as: User = w.client, body: object = { category: 'POOR_QUALITY', description: 'Hasil foto buram' }) =>
    request(app).post(`/api/v1/orders/${id}/disputes`).set(...auth(as)).send(body);
  const evidence = (disputeId: string, as: User, file: Buffer = FILES.jpeg, filename = 'bukti.jpg') =>
    request(app).post(`/api/v1/disputes/${disputeId}/evidences`).set(...auth(as)).attach('file', file, { filename, contentType: 'image/jpeg' });
  const detail = (disputeId: string, as: User) => request(app).get(`/api/v1/disputes/${disputeId}`).set(...auth(as));
  const review = (disputeId: string, as: User = admin) => request(app).post(`/api/v1/admin/disputes/${disputeId}/review`).set(...auth(as)).send({});
  const resolve = (disputeId: string, body: object, as: User = admin) =>
    request(app).post(`/api/v1/admin/disputes/${disputeId}/resolve`).set(...auth(as)).send(body);
  const refundWebhook = (refundId: string) =>
    request(app)
      .post('/api/v1/webhooks/xendit/refund')
      .set('x-callback-token', env.XENDIT_CALLBACK_TOKEN)
      .send({ event: 'refund.succeeded', data: { id: `fake-ref-${refundId}`, reference_id: refundId, status: 'SUCCEEDED' } });

  const orderOf = (id: string) => prisma.order.findUniqueOrThrow({ where: { id } });
  const ledger = (orderId: string) => prisma.walletTransaction.findMany({ where: { orderId }, orderBy: { id: 'asc' } });
  const wallet = () => prisma.wallet.findUniqueOrThrow({ where: { providerProfileId: w.provider.id } });
  const due = (orderId: string, at = new Date(Date.now() - 1000)) => prisma.order.update({ where: { id: orderId }, data: { settlementDueAt: at } });

  /** Order PAID lalu dijalankan penanggung jawab w2 sampai `stage`. */
  async function orderAt(stage: Stage): Promise<string> {
    if (stage === 'COMPLETED') return (await completedOrder(app, w)).id;
    const { id } = await paidScheduledOrder(app, w);
    for (const action of STEPS[stage]) {
      const body = action === 'check-in' ? { latitude: RENON.lat, longitude: RENON.lng } : {};
      const res = await request(app).post(`/api/v1/orders/${id}/${action}`).set(...auth(w.w2)).send(body);
      if (res.status !== 200) throw new Error(`${action} ${res.status}: ${JSON.stringify(res.body)}`);
    }
    return id;
  }

  async function opened(stage: Stage = 'COMPLETED', as: User = w.client) {
    const orderId = await orderAt(stage);
    const res = await open(orderId, as);
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return { orderId, disputeId: res.body.data.id as string };
  }

  async function underReview(stage: Stage = 'COMPLETED') {
    const d = await opened(stage);
    expect((await review(d.disputeId)).status).toBe(200);
    return d;
  }

  beforeEach(async () => {
    await resetDatabase();
    app = createApp();
    storage = mockStorage();
    w = await newWorld();
    admin = await newUser({ admin: true });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    expect(await runVerificationQuery('V1')).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // T13, T15, T17, T19
  // -------------------------------------------------------------------------

  describe('POST /orders/:id/disputes', () => {
    it.each([
      ['T13', 'ARRIVED', 'client'],
      ['T15', 'IN_PROGRESS', 'owner'],
      ['T17', 'AWAITING_VERIFICATION', 'client'],
      ['T19', 'COMPLETED', 'owner'],
    ] as const)('%s dari %s oleh %s: DISPUTED, dispute OPEN, histori, notifikasi admin dan pihak lawan', async (_t, stage, who) => {
      const orderId = await orderAt(stage);
      const as = who === 'client' ? w.client : w.owner;
      const res = await open(orderId, as);
      expect(res.status, JSON.stringify(res.body)).toBe(201);
      expect(res.body.data).toMatchObject({
        order_id: orderId,
        order_status: 'DISPUTED',
        status: 'OPEN',
        raised_by_user_id: as.id,
        raised_by_role: who === 'client' ? 'CLIENT' : 'PROVIDER',
        category: 'POOR_QUALITY',
      });
      expect((await orderOf(orderId)).status).toBe('DISPUTED');
      // H131: id komplain tersedia di DTO untuk tambah bukti.
      const dto = (await request(app).get(`/api/v1/orders/${orderId}`).set(...auth(as))).body.data;
      expect(dto.dispute).toEqual({ id: res.body.data.id, status: 'OPEN' });
      const history = await prisma.orderStatusHistory.findFirstOrThrow({ where: { orderId, toStatus: 'DISPUTED' } });
      expect(history).toMatchObject({ fromStatus: stage, actor: who === 'client' ? 'CLIENT' : 'PROVIDER', changedByUserId: as.id });
      const notified = await prisma.notification.findMany({ where: { channel: 'EMAIL', referenceId: orderId, title: { startsWith: 'Sengketa dibuka' } } });
      // D178: pihak lawan ikut diberi tahu, bukan hanya admin.
      const counterpart = who === 'client' ? w.owner.id : w.client.id;
      expect(notified.map((n) => [n.userId, n.type]).sort()).toEqual([[admin.id, 'DISPUTE'], [counterpart, 'DISPUTE']].sort());
      expect(await prisma.notification.count({ where: { channel: 'IN_APP', userId: counterpart, referenceId: orderId, title: { startsWith: 'Sengketa dibuka' } } })).toBe(1);
    });

    it('penanggung jawab dan orang luar: 403, tanpa baris dispute', async () => {
      const orderId = await orderAt('ARRIVED');
      const worker = await open(orderId, w.w2);
      expect(worker.status).toBe(403);
      expect(worker.body.error.code).toBe('FORBIDDEN_ACTOR');
      expect((await open(orderId, await newUser())).status).toBe(403);
      expect(await prisma.dispute.count()).toBe(0);
      expect((await orderOf(orderId)).status).toBe('ARRIVED');
    });

    it('jendela: due sedetik lagi masih boleh, due sedetik lalu DISPUTE_WINDOW_CLOSED', async () => {
      const inWindow = await orderAt('COMPLETED');
      await due(inWindow, new Date(Date.now() + 1000));
      expect((await open(inWindow)).status).toBe(201);

      const closed = await orderAt('COMPLETED');
      await due(closed);
      const res = await open(closed);
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DISPUTE_WINDOW_CLOSED');
      expect((await orderOf(closed)).status).toBe('COMPLETED');
    });

    it('duplikat: DISPUTE_ALREADY_EXISTS, dan unique order_id menolak sisipan langsung', async () => {
      const { orderId } = await opened('ARRIVED');
      const again = await open(orderId, w.owner);
      expect(again.status).toBe(409);
      expect(again.body.error.code).toBe('DISPUTE_ALREADY_EXISTS');
      await expect(
        prisma.dispute.create({ data: { orderId, raisedByUserId: w.owner.id, raisedByRole: 'PROVIDER', category: 'OTHER', description: 'x' } }),
      ).rejects.toMatchObject({ code: 'P2002' });
    });

    it('dari status di luar ARRIVED sampai COMPLETED: ORDER_TRANSITION_NOT_ALLOWED', async () => {
      const { id } = await paidScheduledOrder(app, w);
      const res = await open(id);
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ORDER_TRANSITION_NOT_ALLOWED');
    });

    it('T13 melepas kunci in-flight penanggung jawab (DISPUTED bukan in-flight, PRD 3.4)', async () => {
      const busy = () => prisma.$transaction((tx) => findBusyWorkers(tx, [w.w2.workerId], { start: new Date(), minutes: 60, excludeOrderId: '00000000-0000-0000-0000-000000000000' }));
      const orderId = await orderAt('ARRIVED');
      expect((await busy()).inflight.has(w.w2.workerId)).toBe(true);
      await open(orderId);
      expect((await busy()).inflight.size).toBe(0);
    });

    it('T17: kode verifikasi tetap tersimpan, tapi dibaca dan dipakai ditolak 409', async () => {
      const orderId = await orderAt('AWAITING_VERIFICATION');
      const code = await request(app).get(`/api/v1/orders/${orderId}/verification-code`).set(...auth(w.client));
      expect(code.status).toBe(200);
      await open(orderId);
      expect((await orderOf(orderId)).verificationCodeEncrypted).not.toBeNull();
      expect((await request(app).get(`/api/v1/orders/${orderId}/verification-code`).set(...auth(w.client))).status).toBe(409);
      const verify = await request(app).post(`/api/v1/orders/${orderId}/verify`).set(...auth(w.w2)).send({ code: code.body.data.code });
      expect(verify.status).toBe(409);
      expect((await orderOf(orderId)).status).toBe('DISPUTED');
    });
  });

  // -------------------------------------------------------------------------
  // Bukti (H78, H79, usulan D148)
  // -------------------------------------------------------------------------

  describe('POST /disputes/:id/evidences', () => {
    it('client: Storage dulu, baru baris dengan mime terdeteksi; path di bucket private', async () => {
      const { disputeId } = await opened();
      const res = await evidence(disputeId, w.client, FILES.png, 'layar.jpg');
      expect(res.status, JSON.stringify(res.body)).toBe(201);
      expect(res.body.data).toMatchObject({ uploaded_by_user_id: w.client.id, file_type: 'image/png' });
      expect(res.body.data.file_url).toBeUndefined();
      expect(storage.upload).toHaveBeenCalledOnce();
      const [bucket, path, , mime] = storage.upload.mock.calls[0]!;
      expect(bucket).toBe('dispute-evidences');
      expect(path).toMatch(new RegExp(`^${disputeId}/[0-9a-f-]{36}\\.png$`));
      expect(mime).toBe('image/png');
      const row = await prisma.disputeEvidence.findFirstOrThrow({ where: { disputeId } });
      expect(row.fileUrl).toBe(`dispute-evidences/${path}`);
    });

    it('H78: berkas bukan gambar bernama .jpg dengan Content-Type image/jpeg ditolak 422, tanpa Storage dan tanpa baris', async () => {
      const { disputeId } = await opened();
      const res = await evidence(disputeId, w.client, FILES.exe, 'bukti.jpg');
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('UNSUPPORTED_FILE_TYPE');
      expect(storage.upload).not.toHaveBeenCalled();
      expect(await prisma.disputeEvidence.count()).toBe(0);
    });

    it('H79: Storage gagal memberi 502 tanpa baris setengah jadi', async () => {
      const { disputeId } = await opened();
      storage.upload.mockRejectedValueOnce(new Error('storage mati'));
      const res = await evidence(disputeId, w.owner);
      expect(res.status).toBe(502);
      expect(res.body.error.code).toBe('STORAGE_UPLOAD_FAILED');
      expect(await prisma.disputeEvidence.count()).toBe(0);
    });

    it('usulan D148: bukti keenam dari pihak yang sama ditolak, pihak lain masih boleh', async () => {
      const { disputeId } = await opened();
      for (let i = 0; i < 5; i += 1) expect((await evidence(disputeId, w.client)).status).toBe(201);
      const sixth = await evidence(disputeId, w.client);
      expect(sixth.status).toBe(409);
      expect(sixth.body.error.code).toBe('DISPUTE_EVIDENCE_LIMIT_REACHED');
      expect(storage.upload).toHaveBeenCalledTimes(5);
      expect((await evidence(disputeId, w.owner)).status).toBe(201);
    });

    it('pekerja dan orang luar 403; dispute yang sudah diputus menolak bukti 409', async () => {
      const { disputeId } = await underReview();
      expect((await evidence(disputeId, w.w2)).status).toBe(403);
      expect((await evidence(disputeId, await newUser())).status).toBe(403);
      expect((await evidence(disputeId, w.owner)).status).toBe(201);
      expect((await resolve(disputeId, { decision: 'RELEASE', resolution_note: 'Hasil sesuai' })).status).toBe(200);
      const late = await evidence(disputeId, w.client);
      expect(late.status).toBe(409);
      expect(late.body.error.code).toBe('DISPUTE_STATE_CONFLICT');
    });
  });

  // -------------------------------------------------------------------------
  // Detail
  // -------------------------------------------------------------------------

  describe('GET /disputes/:id', () => {
    it('client, pemilik, admin: bukti dengan signed URL dan seluruh pesan dalam order; pekerja dan orang luar 403', async () => {
      const { orderId, disputeId } = await opened('IN_PROGRESS');
      await evidence(disputeId, w.client);
      await prisma.orderMessage.create({ data: { orderId, senderUserId: w.client.id, senderRole: 'CLIENT', content: 'Kok belum mulai?' } });

      for (const as of [w.client, w.owner, admin]) {
        const res = await detail(disputeId, as);
        expect(res.status, JSON.stringify(res.body)).toBe(200);
        expect(res.body.data.evidences).toHaveLength(1);
        expect(res.body.data.evidences[0].signed_url).toMatch(/^https:\/\/storage\.test\/sign\/dispute-evidences\//);
        expect(res.body.data.order_messages).toEqual([expect.objectContaining({ sender_role: 'CLIENT', content: 'Kok belum mulai?' })]);
        expect(res.body.data.order).toMatchObject({ status: 'DISPUTED', total_amount: 500000, platform_fee: 50000, provider_earning: 450000 });
      }
      expect((await detail(disputeId, w.w2)).status).toBe(403);
      expect((await detail(disputeId, await newUser())).status).toBe(403);
    });
  });

  // -------------------------------------------------------------------------
  // Admin
  // -------------------------------------------------------------------------

  describe('admin', () => {
    it('antrean bisa disaring status; non-admin 403', async () => {
      const a = await opened('ARRIVED');
      const b = await opened('IN_PROGRESS');
      await review(b.disputeId);
      const list = await request(app).get('/api/v1/admin/disputes?status=OPEN').set(...auth(admin));
      expect(list.status).toBe(200);
      expect(list.body.data.map((d: { id: string }) => d.id)).toEqual([a.disputeId]);
      expect(list.body.meta.total).toBe(1);
      expect((await request(app).get('/api/v1/admin/disputes').set(...auth(w.owner))).status).toBe(403);
      expect((await review(a.disputeId, w.owner)).status).toBe(403);
    });

    it('review OPEN ke UNDER_REVIEW sekali; resolve dari OPEN ditolak', async () => {
      const { orderId, disputeId } = await opened();
      const early = await resolve(disputeId, { decision: 'RELEASE', resolution_note: 'Terlalu cepat' });
      expect(early.status).toBe(409);
      expect(early.body.error.code).toBe('DISPUTE_STATE_CONFLICT');
      expect((await orderOf(orderId)).status).toBe('DISPUTED');

      const first = await review(disputeId);
      expect(first.body.data.status).toBe('UNDER_REVIEW');
      const second = await review(disputeId);
      expect(second.status).toBe(409);
      expect(second.body.error.code).toBe('DISPUTE_STATE_CONFLICT');
    });

    it('validasi body putusan', async () => {
      const { disputeId } = await underReview();
      const cases: object[] = [
        { decision: 'PARTIAL', resolution_note: 'x' },
        { decision: 'PARTIAL', resolution_note: 'x', refund_amount: 0 },
        { decision: 'PARTIAL', resolution_note: 'x', refund_amount: 1000.5 },
        { decision: 'PARTIAL', resolution_note: 'x', refund_amount: 500000 },
        { decision: 'PARTIAL', resolution_note: 'x', refund_amount: 600000 },
        { decision: 'RELEASE', resolution_note: 'x', refund_amount: 1000 },
        { decision: 'RELEASE' },
        { decision: 'SEBAGIAN', resolution_note: 'x' },
      ];
      for (const body of cases) {
        const res = await resolve(disputeId, body);
        expect(res.status, JSON.stringify(body)).toBe(422);
      }
      expect((await prisma.dispute.findUniqueOrThrow({ where: { id: disputeId } })).status).toBe('UNDER_REVIEW');
    });

    it('T20 RELEASE: SETTLED, satu ESCROW_RELEASE sebesar earning, pending 0, notifikasi client dan pemilik', async () => {
      const { orderId, disputeId } = await underReview();
      const res = await resolve(disputeId, { decision: 'RELEASE', resolution_note: 'Hasil sesuai pesanan' });
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data).toMatchObject({ status: 'RESOLVED_RELEASE', order_status: 'SETTLED', resolved_by: admin.id, resolution_note: 'Hasil sesuai pesanan', refund_amount: null });
      expect(res.body.data.resolved_at).not.toBeNull();

      const order = await orderOf(orderId);
      expect(order.settledAt).not.toBeNull();
      expect(order.platformFeeRefunded.equals(0)).toBe(true);
      const rows = await ledger(orderId);
      expect(rows.map((r) => [r.type, r.amountAvailableDelta.toNumber(), r.amountPendingDelta.toNumber()])).toEqual([
        ['ESCROW_HOLD', 0, 450000],
        ['ESCROW_RELEASE', 450000, -450000],
      ]);
      expect(await prisma.refund.count()).toBe(0);
      const after = await wallet();
      expect([after.balanceAvailable.toNumber(), after.balancePending.toNumber()]).toEqual([450000, 0]);
      const history = await prisma.orderStatusHistory.findFirstOrThrow({ where: { orderId, toStatus: 'SETTLED' } });
      expect(history).toMatchObject({ fromStatus: 'DISPUTED', actor: 'ADMIN', changedByUserId: admin.id });
      const notified = await prisma.notification.findMany({ where: { channel: 'EMAIL', referenceId: orderId, title: { startsWith: 'Sengketa diputus' } } });
      expect(notified.map((n) => n.userId).sort()).toEqual([w.client.id, w.owner.id].sort());
    });

    it('usulan D150: RELEASE dari IN_PROGRESS tidak menaikkan order_count dan completed_orders_count', async () => {
      const counts = async () => [
        (await prisma.listing.findUniqueOrThrow({ where: { id: w.listingId } })).orderCount,
        (await prisma.providerProfile.findUniqueOrThrow({ where: { id: w.provider.id } })).completedOrdersCount,
      ];
      const before = await counts();
      const { disputeId } = await underReview('IN_PROGRESS');
      expect((await resolve(disputeId, { decision: 'RELEASE', resolution_note: 'Pekerjaan diterima' })).status).toBe(200);
      expect(await counts()).toEqual(before);
    });

    it('T20 PARTIAL: pembulatan fee, ledger pas sampai rupiah terakhir, pending 0, refund PARTIAL dengan reason OTHERS', async () => {
      const { orderId, disputeId } = await underReview('IN_PROGRESS');
      const refundApi = vi.spyOn(paymentGateway, 'refund');
      const res = await resolve(disputeId, { decision: 'PARTIAL', resolution_note: 'Separuh pekerjaan', refund_amount: 123457 });
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data).toMatchObject({ status: 'RESOLVED_PARTIAL', order_status: 'SETTLED', refund_amount: 123457 });

      // round(50000 * 123457 / 500000) = round(12345,7) = 12346 (floor memberi 12345).
      const order = await orderOf(orderId);
      expect(order.platformFeeRefunded.toNumber()).toBe(12346);
      expect(order.settledAt).not.toBeNull();
      const rows = await ledger(orderId);
      expect(rows.map((r) => [r.type, r.amountAvailableDelta.toNumber(), r.amountPendingDelta.toNumber()])).toEqual([
        ['ESCROW_HOLD', 0, 450000],
        ['REFUND_DEDUCTION', 0, -111111],
        ['ESCROW_RELEASE', 338889, -338889],
      ]);
      const pendingSum = rows.reduce((sum, r) => sum + r.amountPendingDelta.toNumber(), 0);
      expect(pendingSum).toBe(0);
      expect(order.platformFeeRefunded.toNumber() + 111111).toBe(123457);
      const after = await wallet();
      expect([after.balanceAvailable.toNumber(), after.balancePending.toNumber()]).toEqual([338889, 0]);

      const refund = await prisma.refund.findFirstOrThrow({ where: { orderId }, include: { payment: true } });
      expect(refund).toMatchObject({ type: 'PARTIAL', status: 'PROCESSING', initiatedBy: admin.id });
      expect(refund.amount.toNumber()).toBe(123457);
      expect(refundApi).toHaveBeenCalledWith({ referenceId: refund.id, invoiceId: refund.payment.xenditInvoiceId, amount: 123457, reason: 'OTHERS' });

      // D146: order bukan CANCELLED, jadi webhook hanya menyelesaikan refund.
      expect((await refundWebhook(refund.id)).status).toBe(200);
      expect((await prisma.refund.findUniqueOrThrow({ where: { id: refund.id } })).status).toBe('COMPLETED');
      expect((await orderOf(orderId)).status).toBe('SETTLED');
    });

    it('partialSplit: fee + bagian provider selalu tepat refund_amount, release positif', () => {
      const dec = (n: number) => new Prisma.Decimal(n);
      for (const x of [1, 5, 99999, 123457, 499999]) {
        const order = { totalAmount: dec(500000), platformFee: dec(50000), providerEarning: dec(450000) };
        const s = partialSplit(order, x);
        expect(s.feeRefunded.plus(s.providerShare).toNumber()).toBe(x);
        expect(s.release.gt(0)).toBe(true);
        expect(s.providerShare.plus(s.release).toNumber()).toBe(450000);
      }
    });

    it('T21 REFUND: REFUNDED, fee dikembalikan penuh, deduction sebesar earning, refund FULL; webhook tanpa T22', async () => {
      const { orderId, disputeId } = await underReview('AWAITING_VERIFICATION');
      const refundApi = vi.spyOn(paymentGateway, 'refund');
      const res = await resolve(disputeId, { decision: 'REFUND', resolution_note: 'Pekerjaan tidak selesai' });
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data).toMatchObject({ status: 'RESOLVED_REFUND', order_status: 'REFUNDED' });

      const order = await orderOf(orderId);
      expect(order.platformFeeRefunded.toNumber()).toBe(50000);
      expect(order.settledAt).toBeNull();
      const rows = await ledger(orderId);
      expect(rows.map((r) => [r.type, r.amountAvailableDelta.toNumber(), r.amountPendingDelta.toNumber()])).toEqual([
        ['ESCROW_HOLD', 0, 450000],
        ['REFUND_DEDUCTION', 0, -450000],
      ]);
      const after = await wallet();
      expect([after.balanceAvailable.toNumber(), after.balancePending.toNumber()]).toEqual([0, 0]);

      const refund = await prisma.refund.findFirstOrThrow({ where: { orderId } });
      expect(refund).toMatchObject({ type: 'FULL', status: 'PROCESSING' });
      expect(refund.amount.toNumber()).toBe(500000);
      expect(refundApi.mock.calls[0]![0]).toMatchObject({ amount: 500000, reason: 'OTHERS' });

      expect((await refundWebhook(refund.id)).status).toBe(200);
      expect((await prisma.refund.findUniqueOrThrow({ where: { id: refund.id } })).status).toBe('COMPLETED');
      expect(await prisma.orderStatusHistory.count({ where: { orderId, toStatus: 'REFUNDED' } })).toBe(1);
    });

    it('putusan kedua ditolak, ledger tidak bertambah', async () => {
      const { orderId, disputeId } = await underReview();
      await resolve(disputeId, { decision: 'RELEASE', resolution_note: 'ok' });
      const again = await resolve(disputeId, { decision: 'REFUND', resolution_note: 'berubah pikiran' });
      expect(again.status).toBe(409);
      expect(again.body.error.code).toBe('DISPUTE_STATE_CONFLICT');
      expect(await ledger(orderId)).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // Settlement dan H100
  // -------------------------------------------------------------------------

  describe('settlement', () => {
    it('sweep melewati order DISPUTED walau settlement_due_at lewat', async () => {
      const { orderId } = await opened('COMPLETED');
      await prisma.order.update({ where: { id: orderId }, data: { settlementDueAt: new Date(Date.now() - 1000) } });
      expect(await sweepSettlements()).toEqual({ candidates: 0, settled: 0, failed: 0 });
      expect((await ledger(orderId)).map((r) => r.type)).toEqual(['ESCROW_HOLD']);
    });

    it('H100 A: sweep memegang order lebih dulu, T19 yang menunggu ditolak, RELEASE tepat satu', async () => {
      const orderId = await orderAt('COMPLETED');
      const dueAt = Date.now() + 1500;
      await due(orderId, new Date(dueAt));
      let opening!: Promise<request.Response>;
      await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId}::uuid FOR UPDATE`;
        // Masih di dalam jendela saat dikirim.
        opening = open(orderId).then((res) => res);
        await waitForLockWaiters(1);
        await sleep(dueAt - Date.now() + 50);
        await settleOrder(tx, () => undefined, orderId);
      });
      const res = await opening;
      expect(res.status).toBe(409);
      expect(await prisma.dispute.count({ where: { orderId } })).toBe(0);
      expect((await orderOf(orderId)).status).toBe('SETTLED');
      expect((await ledger(orderId)).filter((r) => r.type === 'ESCROW_RELEASE')).toHaveLength(1);
    });

    it('H100 B: T19 memegang order saat due lewat, sweep melewatinya, DISPUTED tanpa ESCROW_RELEASE', async () => {
      const orderId = await orderAt('COMPLETED');
      const dueAt = Date.now() + 1500;
      await due(orderId, new Date(dueAt));
      let opening!: Promise<request.Response>;
      let swept: Awaited<ReturnType<typeof sweepSettlements>> | undefined;
      await prisma.$transaction(async (tx) => {
        // API melewati guard jendela dan memegang kunci order, lalu tertahan saat menulis
        // notifikasi admin (FK ke users butuh FOR KEY SHARE pada baris yang dikunci di sini).
        await tx.$queryRaw`SELECT id FROM users WHERE id = ${admin.id}::uuid FOR UPDATE`;
        opening = open(orderId).then((res) => res);
        await waitForLockWaiters(1);
        await sleep(dueAt - Date.now() + 50);
        swept = await sweepSettlements();
      });
      // Kandidat karena DISPUTED belum ter-commit, tapi SKIP LOCKED melewatinya.
      expect(swept).toEqual({ candidates: 1, settled: 0, failed: 0 });
      const res = await opening;
      expect(res.status, JSON.stringify(res.body)).toBe(201);
      expect((await orderOf(orderId)).status).toBe('DISPUTED');
      expect(await sweepSettlements()).toEqual({ candidates: 0, settled: 0, failed: 0 });
      expect((await ledger(orderId)).map((r) => r.type)).toEqual(['ESCROW_HOLD']);
    });

    it('H100 C: guard dispute di settleOrder menolak order COMPLETED yang punya dispute OPEN', async () => {
      const orderId = await orderAt('COMPLETED');
      await due(orderId);
      await prisma.dispute.create({ data: { orderId, raisedByUserId: w.client.id, raisedByRole: 'CLIENT', category: 'OTHER', description: 'langsung' } });
      await expect(withOrderTransaction((tx, afterCommit) => settleOrder(tx, afterCommit, orderId))).rejects.toThrow('sedang dalam sengketa');
      expect((await orderOf(orderId)).status).toBe('COMPLETED');
      expect((await ledger(orderId)).map((r) => r.type)).toEqual(['ESCROW_HOLD']);
    });
  });
});
