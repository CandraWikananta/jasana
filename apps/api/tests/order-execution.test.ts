/**
 * Fase 6 sesi 6e: pelaksanaan order PAID sampai COMPLETED (T8 sampai T16).
 *
 *   PRD 8.2 no. 4   pekerja lain di usaha yang sama menekan Berangkat, 403
 *   PRD 8.2 no. 6   kode salah enam kali, yang keenam 429 karena lockout
 *   PRD 4.4         baris check-in gagal dan kenaikan attempts TETAP tersimpan
 *   D60             kode hanya terbaca client, tidak di DTO lain maupun notifikasi
 *   D69             pendamping tidak punya hak transisi, daftar dibekukan saat berangkat
 *   usulan D110 sampai D114
 */

import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import { HOUR, KUTA, MINUTE, RENON, auth, northOfRenon, paidScheduledOrder, type User, type Worker, type World, newWorld } from './helpers/orders';

describe.skipIf(!hasTestDatabase)('pelaksanaan order (6e)', () => {
  let app: Express;
  let w: World;

  const post = (orderId: string, action: string, as: User, body: object = {}) =>
    request(app).post(`/api/v1/orders/${orderId}/${action}`).set(...auth(as)).send(body);
  const readCode = (orderId: string, as: User) => request(app).get(`/api/v1/orders/${orderId}/verification-code`).set(...auth(as));
  const statusOf = async (orderId: string) => (await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).status;
  const wrongCode = (code: string) => String((Number(code) + 1) % 1_000_000).padStart(6, '0');
  const at = (point: { lat: number; lng: number }) => ({ latitude: point.lat, longitude: point.lng });

  async function ok(res: request.Response) {
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    return res.body.data;
  }

  /** Order milik `assignee` sampai `stop`, lewat API. Mengembalikan kode kalau sudah AWAITING_VERIFICATION. */
  async function runTo(stop: 'ON_THE_WAY' | 'ARRIVED' | 'IN_PROGRESS' | 'AWAITING_VERIFICATION', options: { assigned?: Worker; crew?: Worker[] } = {}) {
    const assignee = options.assigned ?? w.w2;
    const { id } = await paidScheduledOrder(app, w, options);
    await ok(await post(id, 'depart', assignee));
    if (stop === 'ON_THE_WAY') return { id, code: '' };
    await ok(await post(id, 'check-in', assignee, at(RENON)));
    if (stop === 'ARRIVED') return { id, code: '' };
    await ok(await post(id, 'start', assignee));
    if (stop === 'IN_PROGRESS') return { id, code: '' };
    await ok(await post(id, 'finish', assignee));
    return { id, code: (await ok(await readCode(id, w.client))).code as string };
  }

  beforeEach(async () => {
    await resetDatabase();
    app = createApp();
    w = await newWorld();
  });

  // -------------------------------------------------------------------------
  // T8
  // -------------------------------------------------------------------------

  describe('T8 depart', () => {
    it('PRD 8.2 no. 4: rekan seusaha dan pemilik yang bukan penanggung jawab ditolak 403', async () => {
      const { id } = await paidScheduledOrder(app, w, { assigned: w.w2 });

      const coworker = await post(id, 'depart', w.w3);
      expect(coworker.status).toBe(403);
      const owner = await post(id, 'depart', w.owner);
      expect(owner.status).toBe(403);
      expect(owner.body.error.code).toBe('NOT_ASSIGNED_WORKER');
      expect(await statusOf(id)).toBe('PAID');

      const departed = await ok(await post(id, 'depart', w.w2));
      expect(departed.status).toBe('ON_THE_WAY');
      expect(departed.started_at).not.toBeNull();
    });

    it('Scheduled baru boleh berangkat 60 menit sebelum jadwal (State Machine 7, usulan D113)', async () => {
      const { id } = await paidScheduledOrder(app, w, { scheduledAt: new Date(Date.now() + 90 * MINUTE) });
      const early = await post(id, 'depart', w.w2);
      expect(early.status).toBe(409);
      expect(early.body.error.code).toBe('ORDER_TRANSITION_NOT_ALLOWED');

      await prisma.order.update({ where: { id }, data: { scheduledAt: new Date(Date.now() + 59 * MINUTE) } });
      await ok(await post(id, 'depart', w.w2));
    });

    it('pekerja yang in-flight di order lain ditolak index 409 WORKER_HAS_INFLIGHT_ORDER (H4)', async () => {
      const first = await paidScheduledOrder(app, w, { assigned: w.w2 });
      const second = await paidScheduledOrder(app, w, { assigned: w.w2, scheduledAt: new Date(Date.now() + 72 * HOUR) });
      await prisma.order.update({ where: { id: second.id }, data: { scheduledAt: new Date(Date.now() + 20 * MINUTE) } });

      await ok(await post(first.id, 'depart', w.w2));
      const res = await post(second.id, 'depart', w.w2);
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('WORKER_HAS_INFLIGHT_ORDER');
      expect(await statusOf(second.id)).toBe('PAID');
    });

    it('setelah berangkat, pendamping dan penanggung jawab tidak bisa diubah lagi (D44, D69)', async () => {
      const { id } = await runTo('ON_THE_WAY', { crew: [w.w3] });
      const crew = await request(app).put(`/api/v1/orders/${id}/crew`).set(...auth(w.owner)).send({ crew_worker_ids: [] });
      expect(crew.status).toBe(409);
      const assignment = await request(app).patch(`/api/v1/orders/${id}/assignment`).set(...auth(w.owner)).send({ assigned_worker_id: w.owner.workerId });
      expect(assignment.status).toBe(409);
      expect(await prisma.orderCrew.count({ where: { orderId: id } })).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // T10, T12
  // -------------------------------------------------------------------------

  describe('T10 check-in', () => {
    it('di luar radius ditolak 422, dan baris is_valid=false TETAP tersimpan; lalu di lokasi lolos', async () => {
      const { id } = await runTo('ON_THE_WAY');

      const far = await post(id, 'check-in', w.w2, { ...at(KUTA), accuracy_meters: 12.5 });
      expect(far.status).toBe(422);
      expect(far.body.error.code).toBe('CHECKIN_OUT_OF_RADIUS');
      expect(await statusOf(id)).toBe('ON_THE_WAY');

      // Gagal kalau baris ikut ter-rollback bersama penolakannya.
      const [failed] = await prisma.orderCheckin.findMany({ where: { orderId: id } });
      expect(failed).toMatchObject({ isValid: false, attemptNumber: 1, radiusThresholdMeters: 100, workerId: w.w2.workerId });
      expect(failed!.distanceMeters.toNumber()).toBeCloseTo(8985, -1);
      expect(failed!.accuracyMeters?.toNumber()).toBe(12.5);

      // Mulai tanpa check-in sah: masih ON_THE_WAY, jadi 409 dari tabel transisi.
      expect((await post(id, 'start', w.w2)).status).toBe(409);

      const near = await ok(await post(id, 'check-in', w.w2, at(northOfRenon(0.05))));
      expect(near.status).toBe('ARRIVED');
      const rows = await prisma.orderCheckin.findMany({ where: { orderId: id }, orderBy: { attemptNumber: 'asc' } });
      expect(rows.map((r) => [r.attemptNumber, r.isValid])).toEqual([[1, false], [2, true]]);
      expect(rows[1]!.distanceMeters.toNumber()).toBeCloseTo(50, 0);
    });

    it('pendamping dan rekan seusaha ditolak tanpa meninggalkan baris', async () => {
      const { id } = await runTo('ON_THE_WAY', { crew: [w.w3] });
      expect((await post(id, 'check-in', w.w3, at(RENON))).status).toBe(403);
      expect((await post(id, 'check-in', w.w4, at(RENON))).status).toBe(403);
      expect(await prisma.orderCheckin.count({ where: { orderId: id } })).toBe(0);
    });

    it('radius pecahan dibulatkan, yang disimpan sama dengan yang dibandingkan', async () => {
      // Tanpa pembulatan: insert ke kolom Int gagal 500, dan 100,2 m lolos terhadap 100,4.
      await prisma.platformSetting.create({ data: { key: 'geolocation_radius_meters', value: 100.4 } });
      const { id } = await runTo('ON_THE_WAY');

      const edge = await post(id, 'check-in', w.w2, at(northOfRenon(0.1002)));
      expect(edge.status, JSON.stringify(edge.body)).toBe(422);
      expect(edge.body.error.code).toBe('CHECKIN_OUT_OF_RADIUS');
      expect((await ok(await post(id, 'check-in', w.w2, at(northOfRenon(0.0998))))).status).toBe('ARRIVED');

      const rows = await prisma.orderCheckin.findMany({ where: { orderId: id }, orderBy: { attemptNumber: 'asc' } });
      expect(rows.map((r) => [r.isValid, r.radiusThresholdMeters])).toEqual([[false, 100], [true, 100]]);
    });

    it('jarak tidak pernah diambil dari body', async () => {
      const { id } = await runTo('ON_THE_WAY');
      const res = await post(id, 'check-in', w.w2, { ...at(KUTA), distance_meters: 1 });
      expect(res.status).toBe(422);
    });
  });

  // -------------------------------------------------------------------------
  // T14, kode, T16
  // -------------------------------------------------------------------------

  describe('kode verifikasi (D60)', () => {
    it('hanya client yang bisa membaca kode; tidak ada di respons, DTO, histori, maupun notifikasi', async () => {
      const { id } = await runTo('IN_PROGRESS', { crew: [w.w3] });
      const finished = await post(id, 'finish', w.w2);
      const order = await ok(finished);
      expect(order.status).toBe('AWAITING_VERIFICATION');
      const { code, expires_at } = await ok(await readCode(id, w.client));
      expect(code).toMatch(/^\d{6}$/);
      expect(new Date(expires_at).getTime()).toBeCloseTo(Date.now() + 60 * MINUTE, -4);

      for (const who of [w.w2, w.w3, w.w4, w.owner]) {
        expect((await readCode(id, who)).status).toBe(403);
        expect((await request(app).post(`/api/v1/orders/${id}/verification-code`).set(...auth(who))).status).toBe(403);
      }

      const visible = [
        finished.body,
        (await request(app).get(`/api/v1/orders/${id}`).set(...auth(w.w2))).body,
        (await request(app).get(`/api/v1/orders/${id}`).set(...auth(w.owner))).body,
        (await request(app).get(`/api/v1/orders/${id}`).set(...auth(w.client))).body,
        (await request(app).get('/api/v1/orders?as=worker').set(...auth(w.w2))).body,
        (await request(app).get('/api/v1/orders?as=worker').set(...auth(w.w3))).body,
        (await request(app).get(`/api/v1/orders/${id}/history`).set(...auth(w.client))).body,
        await prisma.notification.findMany({ where: { referenceId: id } }),
      ];
      for (const payload of visible) {
        const text = JSON.stringify(payload, (_k, v: unknown) => (typeof v === 'bigint' ? v.toString() : v));
        expect(text).not.toContain(code);
        expect(text).not.toContain('verification_code');
      }
    });

    it('pendamping tidak bisa menjalankan satu pun transisi pelaksanaan (D69)', async () => {
      const { id } = await paidScheduledOrder(app, w, { crew: [w.w3] });
      const steps: Array<[string, object]> = [['depart', {}], ['check-in', at(RENON)], ['start', {}], ['finish', {}]];
      for (const [action, body] of steps) {
        expect((await post(id, action, w.w3, body)).status).toBe(403);
        await ok(await post(id, action, w.w2, body));
      }
      const { code } = await ok(await readCode(id, w.client));
      expect((await post(id, 'verify', w.w3, { code })).status).toBe(403);
      expect((await readCode(id, w.w3)).status).toBe(403);
      expect(await statusOf(id)).toBe('AWAITING_VERIFICATION');
    });

    it('PRD 8.2 no. 6: salah lima kali memasang lockout, yang keenam 429 walaupun kodenya benar', async () => {
      const { id, code } = await runTo('AWAITING_VERIFICATION');
      for (let i = 1; i <= 5; i += 1) {
        const res = await post(id, 'verify', w.w2, { code: wrongCode(code) });
        expect(res.status, `percobaan ${i}`).toBe(422);
        expect(res.body.error.code).toBe('VERIFICATION_CODE_INVALID');
      }
      // Gagal kalau kenaikan attempts ikut ter-rollback bersama penolakannya.
      const locked = await prisma.order.findUniqueOrThrow({ where: { id } });
      expect(locked.verificationAttempts).toBe(5);
      expect(locked.verificationLockedUntil!.getTime()).toBeGreaterThan(Date.now() + 14 * MINUTE);

      const sixth = await post(id, 'verify', w.w2, { code });
      expect(sixth.status).toBe(429);
      expect(sixth.body.error.code).toBe('VERIFICATION_LOCKED');
      expect(await statusOf(id)).toBe('AWAITING_VERIFICATION');
      // Client tidak bisa mengakali lockout lewat kode baru (usulan D111).
      expect((await request(app).post(`/api/v1/orders/${id}/verification-code`).set(...auth(w.client))).status).toBe(429);
    });

    it('usulan D110: setelah lockout lewat, hitungan mulai dari nol lagi', async () => {
      const { id, code } = await runTo('AWAITING_VERIFICATION');
      await prisma.order.update({
        where: { id },
        data: { verificationAttempts: 5, verificationLockedUntil: new Date(Date.now() - MINUTE) },
      });
      expect((await post(id, 'verify', w.w2, { code: wrongCode(code) })).status).toBe(422);
      expect((await prisma.order.findUniqueOrThrow({ where: { id } })).verificationAttempts).toBe(1);
      expect((await ok(await post(id, 'verify', w.w2, { code }))).status).toBe('COMPLETED');
    });

    it('kode kedaluwarsa ditolak tanpa menghabiskan percobaan, dan client meminta kode baru (H9, D111, D114)', async () => {
      const { id, code } = await runTo('AWAITING_VERIFICATION');
      const renew = () => request(app).post(`/api/v1/orders/${id}/verification-code`).set(...auth(w.client));
      expect((await ok(await renew())).code).toBe(code);

      await prisma.order.update({ where: { id }, data: { verificationExpiresAt: new Date(Date.now() - MINUTE) } });
      // Lima kali, benar maupun salah: semuanya 422 EXPIRED, tidak ada yang memicu lockout.
      for (const attempt of [code, wrongCode(code), code, wrongCode(code), code]) {
        const expired = await post(id, 'verify', w.w2, { code: attempt });
        expect(expired.status).toBe(422);
        expect(expired.body.error.code).toBe('VERIFICATION_CODE_EXPIRED');
      }
      const after = await prisma.order.findUniqueOrThrow({ where: { id } });
      expect(after.verificationAttempts).toBe(0);
      expect(after.verificationLockedUntil).toBeNull();

      const fresh = await ok(await renew());
      expect(new Date(fresh.expires_at).getTime()).toBeGreaterThan(Date.now() + 59 * MINUTE);
      expect((await prisma.order.findUniqueOrThrow({ where: { id } })).verificationAttempts).toBe(0);
      expect((await ok(await post(id, 'verify', w.w2, { code: fresh.code }))).status).toBe('COMPLETED');
    });

    it('kode hanya tersedia saat AWAITING_VERIFICATION (usulan D113)', async () => {
      const { id } = await runTo('IN_PROGRESS');
      expect((await readCode(id, w.client)).status).toBe(409);
    });
  });

  describe('T16 verify', () => {
    it('COMPLETED: settlement_due_at, penghitung naik, notifikasi, dan pekerja serta pendamping lepas', async () => {
      const { id, code } = await runTo('AWAITING_VERIFICATION', { crew: [w.w3] });
      const scheduledAt = (await prisma.order.findUniqueOrThrow({ where: { id } })).scheduledAt!;

      // Order lain di jam yang sama: selama order masih in-flight, penanggung jawab dan pendamping terkunci.
      const next = await request(app).post('/api/v1/orders').set(...auth(w.client)).send({
        listing_id: w.listingId, booking_mode: 'SCHEDULED', scheduled_at: scheduledAt.toISOString(),
        location_source: 'SAVED_ADDRESS', address_id: w.addressId, selected_options: { durasi_liputan: '2 Jam' },
      });
      expect(next.status).toBe(201);
      const acceptNext = (assigned: Worker, crew: Worker[]) =>
        request(app).post(`/api/v1/orders/${next.body.data.id}/accept`).set(...auth(w.owner))
          .send({ assigned_worker_id: assigned.workerId, crew_worker_ids: crew.map((c) => c.workerId) });
      expect((await acceptNext(w.w2, [])).body.error.code).toBe('WORKER_HAS_INFLIGHT_ORDER');
      expect((await acceptNext(w.w3, [])).body.error.code).toBe('WORKER_HAS_INFLIGHT_ORDER');

      const done = await ok(await post(id, 'verify', w.w2, { code }));
      expect(done.status).toBe('COMPLETED');
      expect(new Date(done.settlement_due_at).getTime()).toBeCloseTo(Date.now() + 24 * HOUR, -4);
      expect(done.completed_at).not.toBeNull();
      const row = await prisma.order.findUniqueOrThrow({ where: { id } });
      expect(row.verifiedAt).not.toBeNull();
      expect(row.verificationAttempts).toBe(1);

      const listing = await prisma.listing.findUniqueOrThrow({ where: { id: w.listingId } });
      expect(listing.orderCount).toBe(1);
      expect((await prisma.providerProfile.findUniqueOrThrow({ where: { id: w.provider.id } })).completedOrdersCount).toBe(1);
      const notified = await prisma.notification.findMany({ where: { referenceId: id, title: { startsWith: 'Order selesai' } } });
      expect(notified.map((n) => n.userId).sort()).toEqual([w.client.id, w.owner.id, w.w2.id].sort());

      // Setelah COMPLETED keduanya bebas lagi di jam yang sama.
      expect((await acceptNext(w.w2, [w.w3])).status).toBe(200);
    });

    it('pemilik INDIVIDUAL yang sekaligus penanggung jawab menjalankan kelima transisi sebagai WORKER', async () => {
      await prisma.providerProfile.update({ where: { id: w.provider.id }, data: { providerType: 'INDIVIDUAL' } });
      const { id, code } = await runTo('AWAITING_VERIFICATION', { assigned: w.owner });
      expect((await ok(await post(id, 'verify', w.owner, { code }))).status).toBe('COMPLETED');

      const history = await prisma.orderStatusHistory.findMany({ where: { orderId: id }, orderBy: { id: 'asc' } });
      const execution = history.filter((h) => ['ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'COMPLETED'].includes(h.toStatus));
      expect(execution.map((h) => [h.toStatus, h.actor, h.changedByUserId])).toEqual(
        ['ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'COMPLETED'].map((s) => [s, 'WORKER', w.owner.id]),
      );
    });
  });
});
