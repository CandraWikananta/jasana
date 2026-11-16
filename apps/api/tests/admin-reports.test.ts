/**
 * Sesi 10c: laporan admin (D180, usulan D200 sampai D203).
 *
 *   revenue       total identik dengan V4 (teks kueri dari verification-queries.sql) dan ledger
 *   H121          V4 per bulan WITA: baris V4 satu bulan = laporan revenue bulan itu, termasuk
 *                 order settled 23.59 WITA tanggal terakhir dan 00.00 WITA tanggal 1
 *   transactions  cocok dengan payments, ledger ESCROW_HOLD, riwayat status
 *   providers     SLA miss: Scheduled dan Available Now lewat deadline, bukan ALL_DECLINED
 *   workers       check-in identik dengan V2, SLA miss hanya penerima yang belum menolak
 *   periode       hari WITA, from/to inklusif, maks 366 hari, injeksi ditolak 422
 *
 * Seluruh data dibangun lewat alur produksi (API dan fungsi service), gateway fake.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { witaDateKey } from '../src/lib/wita';
import { presence } from '../src/realtime/presence';
import { sweepResponseDeadlines, sweepSettlements } from '../src/modules/orders/order-expiry.service';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import {
  KUTA,
  MINUTE,
  RENON,
  auth,
  completedOrder,
  newUser,
  newWorld,
  paidScheduledOrder,
  type User,
  type Worker,
  type World,
} from './helpers/orders';
import { mockStorage, runVerificationQuery } from './helpers/providers';

const DAY = 24 * 60 * MINUTE;
const isoDay = (date: Date) => {
  const key = witaDateKey(date);
  return `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`;
};
const V4_KEYS = ['jumlah_order', 'nilai_harga_dasar', 'nilai_opsi_tambahan', 'nilai_transaksi', 'fee_dipungut', 'fee_dikembalikan', 'pendapatan_bersih'] as const;

type Row = Record<string, unknown>;
const sumV4 = (rows: Row[]) => Object.fromEntries(V4_KEYS.map((key) => [key, rows.reduce((total, row) => total + Number(row[key]), 0)]));

describe.skipIf(!hasTestDatabase)('laporan admin (10c)', () => {
  let app: Express;
  let w: World;
  let admin: User;

  const today = () => isoDay(new Date());
  const wide = () => ({ from: isoDay(new Date(Date.now() - DAY)), to: isoDay(new Date(Date.now() + DAY)) });
  const report = (name: string, query: Record<string, unknown>, as: User = admin) =>
    request(app).get(`/api/v1/admin/reports/${name}`).query(query).set(...auth(as));
  async function ok(name: string, query: Record<string, unknown>) {
    const res = await report(name, query);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    return res.body;
  }

  /** T18 lewat sweep settlement produksi. */
  async function settle(id: string) {
    await prisma.order.update({ where: { id }, data: { settlementDueAt: new Date(Date.now() - 1000) } });
    const swept = await sweepSettlements();
    if (swept.settled !== 1) throw new Error(`settlement ${JSON.stringify(swept)}`);
  }
  async function settledOrder(): Promise<string> {
    const { id } = await completedOrder(app, w);
    await settle(id);
    return id;
  }
  /** T19 lalu putusan admin (T20 atau T21). */
  async function disputed(decision: 'RELEASE' | 'PARTIAL' | 'REFUND', refundAmount?: number): Promise<string> {
    const { id } = await completedOrder(app, w);
    const opened = await request(app).post(`/api/v1/orders/${id}/disputes`).set(...auth(w.client)).send({ category: 'POOR_QUALITY', description: 'Hasil kurang' });
    expect(opened.status, JSON.stringify(opened.body)).toBe(201);
    const disputeId = opened.body.data.id as string;
    expect((await request(app).post(`/api/v1/admin/disputes/${disputeId}/review`).set(...auth(admin)).send({})).status).toBe(200);
    const resolved = await request(app)
      .post(`/api/v1/admin/disputes/${disputeId}/resolve`)
      .set(...auth(admin))
      .send({ decision, resolution_note: 'Putusan uji', ...(refundAmount ? { refund_amount: refundAmount } : {}) });
    expect(resolved.status, JSON.stringify(resolved.body)).toBe(200);
    return id;
  }

  beforeEach(async () => {
    await resetDatabase();
    presence.reset();
    app = createApp();
    mockStorage();
    w = await newWorld();
    admin = await newUser({ admin: true });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    expect(await runVerificationQuery('V1')).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // Revenue: V4 dan ledger
  // -------------------------------------------------------------------------

  describe('GET /admin/reports/revenue', () => {
    it('total identik dengan V4 dan ledger: RELEASE, PARTIAL masuk; REFUND dan COMPLETED belum settle tidak', async () => {
      await settledOrder();
      await disputed('RELEASE');
      await disputed('PARTIAL', 123457);
      await disputed('REFUND');
      await completedOrder(app, w);

      const body = await ok('revenue', wide());
      expect(body.data.period).toMatchObject({ ...wide(), timezone: 'WITA', days: 3 });
      expect(body.data.rows.map((r: Row) => r.tanggal)).toEqual([wide().from, today(), wide().to]);
      const totals = body.data.totals;
      expect(totals.jumlah_order).toBe(3);

      // Sumber sama dengan V4: teks kueri dijalankan apa adanya dari verification-queries.sql.
      const v4 = sumV4(await runVerificationQuery('V4') as Row[]);
      expect(Object.fromEntries(V4_KEYS.map((key) => [key, totals[key]]))).toEqual(v4);
      expect(totals.fee_dikembalikan).toBe(12346);

      // Ledger: dana dilepas = seluruh ESCROW_RELEASE, dikembalikan = refund order SETTLED.
      const release = await prisma.walletTransaction.aggregate({ where: { type: 'ESCROW_RELEASE' }, _sum: { amountAvailableDelta: true } });
      expect(totals.dana_dilepas_ke_penyedia).toBe(release._sum.amountAvailableDelta!.toNumber());
      const refunds = await prisma.refund.aggregate({ where: { order: { status: 'SETTLED' } }, _sum: { amount: true } });
      expect(totals.dikembalikan_ke_client).toBe(refunds._sum.amount!.toNumber());
      expect(totals.dikembalikan_ke_client).toBe(123457);
      expect(totals.nilai_transaksi).toBe(totals.pendapatan_bersih + totals.dana_dilepas_ke_penyedia + totals.dikembalikan_ke_client);

      const sameDay = body.data.rows.find((r: Row) => r.tanggal === today());
      expect(sameDay).toEqual({ tanggal: today(), ...totals });
    });

    it('H121: satu bulan WITA identik dengan baris V4 bulan itu, termasuk 23.59 WITA tanggal 31 dan 00.00 WITA tanggal 1', async () => {
      const [a, b, c] = [await settledOrder(), await settledOrder(), await disputed('PARTIAL', 100000)];
      // a: 31 Okt 23.59.59 WITA; b: 1 Nov 00.00 WITA (masih 31 Okt menurut UTC); c: 1 Okt 00.00 WITA (30 Sep UTC).
      await prisma.order.update({ where: { id: a }, data: { settledAt: new Date('2025-10-31T15:59:59Z') } });
      await prisma.order.update({ where: { id: b }, data: { settledAt: new Date('2025-10-31T16:00:00Z') } });
      await prisma.order.update({ where: { id: c }, data: { settledAt: new Date('2025-09-30T16:00:00Z') } });

      const v4 = (await runVerificationQuery('V4')) as Row[];
      const month = (key: string) => v4.filter((row) => (row.bulan as Date).toISOString().startsWith(key));
      const october = await ok('revenue', { from: '2025-10-01', to: '2025-10-31' });
      const november = await ok('revenue', { from: '2025-11-01', to: '2025-11-30' });

      expect(month('2025-10-01')).toHaveLength(1);
      expect(month('2025-11-01')).toHaveLength(1);
      expect(Object.fromEntries(V4_KEYS.map((key) => [key, october.data.totals[key]]))).toEqual(sumV4(month('2025-10-01')));
      expect(Object.fromEntries(V4_KEYS.map((key) => [key, november.data.totals[key]]))).toEqual(sumV4(month('2025-11-01')));
      expect(october.data.totals.jumlah_order).toBe(2);
      expect(november.data.totals.jumlah_order).toBe(1);

      // Batas hari: 23.59.59 WITA dan 00.00 WITA jatuh di dua baris berbeda.
      const edge = await ok('revenue', { from: '2025-10-31', to: '2025-11-01' });
      expect(edge.data.rows.map((r: Row) => [r.tanggal, r.jumlah_order])).toEqual([
        ['2025-10-31', 1],
        ['2025-11-01', 1],
      ]);
      expect(october.data.rows).toHaveLength(31);
      expect(october.data.rows[0]).toMatchObject({ tanggal: '2025-10-01', jumlah_order: 1 });

      // Ledger digabung lewat order_id, bukan waktu ledger: identitas tetap utuh walau settled_at digeser.
      const t = october.data.totals;
      expect(t.nilai_transaksi).toBe(t.pendapatan_bersih + t.dana_dilepas_ke_penyedia + t.dikembalikan_ke_client);
      expect(t.dikembalikan_ke_client).toBe(100000);

      // Laporan penyedia memakai batas periode yang sama (b di batas akhir Oktober tidak ikut).
      const providers = await ok('providers', { from: '2025-10-01', to: '2025-10-31' });
      expect(providers.data.totals).toMatchObject({ nilai_transaksi_settled: t.nilai_transaksi, dana_dilepas: t.dana_dilepas_ke_penyedia });
    });
  });

  // -------------------------------------------------------------------------
  // Transaksi
  // -------------------------------------------------------------------------

  describe('GET /admin/reports/transactions', () => {
    it('cocok dengan payments, ledger ESCROW_HOLD, dan riwayat status; order di luar periode tidak ikut', async () => {
      await settledOrder();
      await disputed('REFUND');
      await paidScheduledOrder(app, w);

      // Ditolak pemilik (T2) dan kedaluwarsa karena SLA (T3).
      const create = () =>
        request(app).post('/api/v1/orders').set(...auth(w.client)).send({
          listing_id: w.listingId,
          booking_mode: 'SCHEDULED',
          scheduled_at: new Date(Date.now() + 2 * DAY).toISOString(),
          location_source: 'SAVED_ADDRESS',
          address_id: w.addressId,
          selected_options: { durasi_liputan: '2 Jam' },
        });
      const rejected = (await create()).body.data.id as string;
      expect((await request(app).post(`/api/v1/orders/${rejected}/reject`).set(...auth(w.owner)).send({ reason: 'Penuh' })).status).toBe(200);
      const expired = (await create()).body.data.id as string;
      await prisma.order.update({ where: { id: expired }, data: { responseDeadlineAt: new Date(Date.now() - 1000) } });
      expect((await sweepResponseDeadlines()).expired).toBe(1);

      const totals = (await ok('transactions', wide())).data.totals;
      expect(totals).toMatchObject({
        order_masuk: 5,
        order_masuk_scheduled: 5,
        order_masuk_available_now: 0,
        order_dibayar: 3,
        order_selesai: 2,
        order_batal: 2,
        order_direfund: 1,
      });

      const payments = await prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { paidAmount: true } });
      expect(totals.nilai_dibayar).toBe(payments._sum.paidAmount!.toNumber());
      const holds = await prisma.walletTransaction.findMany({ where: { type: 'ESCROW_HOLD' }, include: { order: true } });
      expect(holds).toHaveLength(3);
      expect(totals.nilai_dibayar).toBe(holds.reduce((sum, h) => sum + h.amountPendingDelta.toNumber() + h.order!.platformFee.toNumber(), 0));
      const histories = await prisma.orderStatusHistory.count({ where: { toStatus: { in: ['EXPIRED', 'REJECTED'] } } });
      expect(totals.order_batal).toBe(histories);

      // Order yang dibuat jauh sebelum periode tidak ikut dihitung masuk.
      await prisma.order.update({ where: { id: rejected }, data: { createdAt: new Date('2025-01-01T00:00:00Z') } });
      expect((await ok('transactions', wide())).data.totals.order_masuk).toBe(4);
      const old = await ok('transactions', { from: '2025-01-01', to: '2025-01-01' });
      expect(old.data.rows).toEqual([expect.objectContaining({ tanggal: '2025-01-01', order_masuk: 1, order_batal: 0 })]);
    });
  });

  // -------------------------------------------------------------------------
  // SLA miss penyedia dan pekerja
  // -------------------------------------------------------------------------

  describe('SLA miss', () => {
    const online = (...workers: Worker[]) => workers.forEach((x) => presence.connect(x.workerId));
    const createNow = async () => {
      const res = await request(app).post('/api/v1/orders').set(...auth(w.client)).send({
        listing_id: w.listingId,
        booking_mode: 'AVAILABLE_NOW',
        location_source: 'SAVED_ADDRESS',
        address_id: w.addressId,
        selected_options: { durasi_liputan: '2 Jam' },
      });
      expect(res.status, JSON.stringify(res.body)).toBe(201);
      return res.body.data.id as string;
    };
    const decline = (id: string, as: Worker) => request(app).post(`/api/v1/orders/${id}/decline-offer`).set(...auth(as)).send({});

    it('Scheduled dan Available Now lewat deadline = miss penyedia; ALL_DECLINED bukan; pekerja yang menolak bukan miss', async () => {
      // 1. Available Now, satu-satunya penerima menolak: ALL_DECLINED.
      online(w.w2);
      const allDeclined = await createNow();
      expect((await decline(allDeclined, w.w2)).status).toBe(200);
      expect((await prisma.order.findUniqueOrThrow({ where: { id: allDeclined } })).status).toBe('EXPIRED');

      // 2. Available Now ke w2 dan w3, w2 menolak, w3 diam sampai deadline.
      online(w.w2, w.w3);
      const deadline = await createNow();
      expect((await decline(deadline, w.w2)).status).toBe(200);
      await prisma.order.update({ where: { id: deadline }, data: { responseDeadlineAt: new Date(Date.now() - 1000) } });

      // 3. Scheduled tidak direspons pemilik.
      const scheduled = await request(app).post('/api/v1/orders').set(...auth(w.client)).send({
        listing_id: w.listingId,
        booking_mode: 'SCHEDULED',
        scheduled_at: new Date(Date.now() + 2 * DAY).toISOString(),
        location_source: 'SAVED_ADDRESS',
        address_id: w.addressId,
        selected_options: { durasi_liputan: '2 Jam' },
      });
      await prisma.order.update({ where: { id: scheduled.body.data.id }, data: { responseDeadlineAt: new Date(Date.now() - 1000) } });
      expect((await sweepResponseDeadlines()).expired).toBe(2);

      const providers = await ok('providers', wide());
      expect(providers.meta).toEqual({ page: 1, limit: 20, total: 1 });
      expect(providers.data.rows[0]).toMatchObject({
        provider_profile_id: w.provider.id,
        order_masuk: 3,
        order_diterima: 0,
        order_ditolak: 0,
        sla_miss: 2,
        persen_sla_miss: 100,
      });

      const workers = await ok('workers', wide());
      const of = (x: Worker) => workers.data.rows.find((r: Row) => r.worker_id === x.workerId);
      expect(of(w.w2)).toMatchObject({ tawaran_masuk: 2, tawaran_ditolak: 2, sla_miss: 0, persen_sla_miss: 0 });
      expect(of(w.w3)).toMatchObject({ tawaran_masuk: 1, tawaran_ditolak: 0, sla_miss: 1, persen_sla_miss: 100 });
      expect(workers.data.totals).toMatchObject({ tawaran_masuk: 3, tawaran_ditolak: 2, sla_miss: 1 });
    });
  });

  // -------------------------------------------------------------------------
  // Pekerja: V2
  // -------------------------------------------------------------------------

  describe('GET /admin/reports/workers', () => {
    it('check-in identik dengan V2, per pekerja dan totalnya; entitas tanpa kejadian tidak muncul; paginasi', async () => {
      await completedOrder(app, w, { assigned: w.w2 });
      const { id } = await paidScheduledOrder(app, w, { assigned: w.w3 });
      expect((await request(app).post(`/api/v1/orders/${id}/depart`).set(...auth(w.w3)).send({})).status).toBe(200);
      const far = await request(app).post(`/api/v1/orders/${id}/check-in`).set(...auth(w.w3)).send({ latitude: KUTA.lat, longitude: KUTA.lng, accuracy_meters: 12 });
      expect(far.status).not.toBe(200);
      const near = await request(app).post(`/api/v1/orders/${id}/check-in`).set(...auth(w.w3)).send({ latitude: RENON.lat, longitude: RENON.lng, accuracy_meters: 8 });
      expect(near.status, JSON.stringify(near.body)).toBe(200);
      await newWorld(); // usaha lain tanpa kejadian

      const body = await ok('workers', wide());
      const v2 = (await runVerificationQuery('V2')) as Row[];
      const v2Total = v2.reduce((sum, row) => sum + Number(row.total_percobaan), 0);
      const v2Valid = v2.reduce((sum, row) => sum + Number(row.valid), 0);
      expect(body.data.totals).toMatchObject({ checkin_total: v2Total, checkin_valid: v2Valid });
      expect(v2Total).toBe(3);
      const checkins = await prisma.orderCheckin.aggregate({ _avg: { distanceMeters: true } });
      expect(body.data.totals.rata_jarak_meter).toBe(Number(checkins._avg.distanceMeters!.toFixed(2)));

      expect(body.meta).toEqual({ page: 1, limit: 20, total: 2 });
      const w3 = body.data.rows.find((r: Row) => r.worker_id === w.w3.workerId);
      expect(w3).toMatchObject({ checkin_total: 2, checkin_valid: 1, persen_valid: 50, rata_akurasi_gps: 10, order_selesai_sebagai_pj: 0 });
      const w2 = body.data.rows.find((r: Row) => r.worker_id === w.w2.workerId);
      expect(w2).toMatchObject({ checkin_total: 1, checkin_valid: 1, persen_valid: 100, order_selesai_sebagai_pj: 1 });
      expect(body.data.rows.some((r: Row) => r.worker_id === w.w4.workerId || r.worker_id === w.owner.workerId)).toBe(false);

      const page2 = await ok('workers', { ...wide(), limit: 1, page: 2 });
      expect(page2.meta).toEqual({ page: 2, limit: 1, total: 2 });
      expect(page2.data.rows).toHaveLength(1);
      expect(page2.data.rows[0].worker_id).toBe(body.data.rows[1].worker_id);

      // Di luar periode: tidak ada pekerja sama sekali, totals nol.
      const empty = await ok('workers', { from: '2025-01-01', to: '2025-01-31' });
      expect(empty.meta.total).toBe(0);
      expect(empty.data.totals).toMatchObject({ checkin_total: 0, persen_valid: null, rata_jarak_meter: null });
    });
  });

  // -------------------------------------------------------------------------
  // Validasi, injeksi, RBAC
  // -------------------------------------------------------------------------

  describe('validasi periode', () => {
    const NAMES = ['transactions', 'revenue', 'providers', 'workers'];

    it.each(NAMES)('%s: from/to wajib, urutan, maks 366 hari, tanggal sah, injeksi 422', async (name) => {
      const bad = [
        {},
        { from: '2026-01-02', to: '2026-01-01' },
        { from: '2025-01-01', to: '2026-01-02' },
        // V8 menggulung 30 Februari ke 2 Maret; tanpa refine tanggal sah ini lolos sebagai rentang 3 hari.
        { from: '2026-02-28', to: '2026-02-30' },
        { from: '2026-02-30', to: '2026-03-01' },
        { from: '2026-1-1', to: '2026-01-02' },
        { from: "2026-01-01' OR 1=1--", to: '2026-01-02' },
      ];
      for (const query of bad) {
        const res = await report(name, query);
        expect(res.status, `${name} ${JSON.stringify(query)}`).toBe(422);
      }
      // 366 hari (tahun kabisat 2028) masih boleh.
      expect((await report(name, { from: '2028-01-01', to: '2028-12-31' })).status).toBe(200);
    });

    it.each(['providers', 'workers'])('%s: page dan limit berisi SQL ditolak 422', async (name) => {
      for (const query of [{ page: '1; DROP TABLE orders' }, { limit: '1 OR 1=1' }, { limit: 101 }]) {
        expect((await report(name, { from: '2026-01-01', to: '2026-01-02', ...query })).status).toBe(422);
      }
    });

    it.each(NAMES)('%s: non-admin 403, tanpa token 401', async (name) => {
      expect((await report(name, wide(), w.client)).status).toBe(403);
      expect((await request(app).get(`/api/v1/admin/reports/${name}`).query(wide())).status).toBe(401);
    });
  });
});
