/**
 * Pesan dalam order (sesi 10b, D79, H70 sampai H72, D178).
 *
 *   masa aktif per status (fungsi murni) dan lewat API
 *   peserta: client, pemilik, penanggung jawab. Pendamping, pekerja lain, admin menulis: 403
 *   panjang dari order_message_max_length, rate limit dari order_message_rate_per_minute
 *   notifikasi sisi lawan sekali selama belum dibaca, read per sisi
 *   V11 tetap nol setelah penanggung jawab yang pernah mengirim pesan diganti
 */

import type { Express } from 'express';
import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { prisma, type OrderStatus } from '@jasana/database';
import { createApp } from '../src/app';
import { isMessageWindowOpen } from '../src/modules/orders/order-messages.service';
import { captureEmails, hasTestDatabase, resetDatabase } from './helpers/integration';
import { HOUR, acceptedScheduledOrder, auth, newUser, newWorld, type User, type World } from './helpers/orders';
import { runVerificationQuery } from './helpers/providers';

const ALL_STATUSES: OrderStatus[] = [
  'PENDING_ACCEPTANCE', 'ACCEPTED', 'PAID', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_VERIFICATION',
  'COMPLETED', 'SETTLED', 'DISPUTED', 'REFUNDED', 'CANCELLED', 'REJECTED', 'EXPIRED', 'PAYMENT_EXPIRED',
];
const OPEN: OrderStatus[] = ['ACCEPTED', 'PAID', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_VERIFICATION'];

describe('isMessageWindowOpen (H70)', () => {
  const now = new Date('2026-11-17T10:00:00Z');
  const future = new Date(now.getTime() + 1000);
  const past = new Date(now.getTime() - 1000);

  it.each(ALL_STATUSES)('%s', (status) => {
    expect(isMessageWindowOpen({ status, settlementDueAt: future }, now)).toBe(OPEN.includes(status) || status === 'COMPLETED');
    expect(isMessageWindowOpen({ status, settlementDueAt: null }, now)).toBe(OPEN.includes(status));
  });

  it('COMPLETED tertutup tepat saat settlement_due_at, DISPUTED tetap tertutup walau belum jatuh tempo', () => {
    expect(isMessageWindowOpen({ status: 'COMPLETED', settlementDueAt: past }, now)).toBe(false);
    expect(isMessageWindowOpen({ status: 'COMPLETED', settlementDueAt: now }, now)).toBe(false);
    expect(isMessageWindowOpen({ status: 'DISPUTED', settlementDueAt: future }, now)).toBe(false);
  });
});

describe.skipIf(!hasTestDatabase)('pesan dalam order (10b)', () => {
  let app: Express;
  let w: World;
  let orderId: string;

  beforeEach(async () => {
    await resetDatabase();
    captureEmails();
    app = createApp(); // rate limit per app
    w = await newWorld();
    ({ id: orderId } = await acceptedScheduledOrder(app, w, { assigned: w.w2, crew: [w.w3] }));
  });

  const send = (as: User, content = 'saya sudah di gerbang', id = orderId) =>
    request(app).post(`/api/v1/orders/${id}/messages`).set(...auth(as)).send({ content });
  const list = (as: User, query = '') => request(app).get(`/api/v1/orders/${orderId}/messages${query}`).set(...auth(as));
  const read = (as: User) => request(app).patch(`/api/v1/orders/${orderId}/messages/read`).set(...auth(as));
  const messageNotes = (userId: string) =>
    prisma.notification.findMany({ where: { userId, type: 'ORDER_MESSAGE', referenceId: orderId }, orderBy: { id: 'asc' } });
  const setStatus = (status: OrderStatus, settlementDueAt: Date | null = null) =>
    prisma.order.update({ where: { id: orderId }, data: { status, settlementDueAt } });

  it('peserta: client, pemilik, dan penanggung jawab boleh menulis dengan sender_role masing-masing', async () => {
    for (const [who, role] of [[w.client, 'CLIENT'], [w.owner, 'PROVIDER'], [w.w2, 'WORKER']] as const) {
      const res = await send(who);
      expect(res.status, JSON.stringify(res.body)).toBe(201);
      expect(res.body.data).toMatchObject({ order_id: orderId, sender_user_id: who.id, sender_role: role, content: 'saya sudah di gerbang', read_at: null });
    }
  });

  it('H71: pendamping, pekerja lain, admin, dan orang luar ditolak 403 NOT_ORDER_PARTICIPANT, tanpa baris tertulis', async () => {
    const admin = await newUser({ admin: true });
    for (const who of [w.w3, w.w4, admin, await newUser()]) {
      const res = await send(who);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('NOT_ORDER_PARTICIPANT');
      expect((await read(who)).status).toBe(403);
    }
    expect(await prisma.orderMessage.count()).toBe(0);
    // Membaca: admin boleh, pendamping tidak.
    expect((await list(admin)).status).toBe(200);
    expect((await list(w.w3)).body.error.code).toBe('NOT_ORDER_PARTICIPANT');
  });

  it('H70: 409 MESSAGE_WINDOW_CLOSED di luar masa aktif, riwayat tetap terbaca', async () => {
    await send(w.client).expect(201);
    const closed: Array<[OrderStatus, Date | null]> = [
      ['PENDING_ACCEPTANCE', null], ['DISPUTED', new Date(Date.now() + HOUR)], ['CANCELLED', null],
      ['SETTLED', null], ['COMPLETED', new Date(Date.now() - 1000)],
    ];
    for (const [status, due] of closed) {
      await setStatus(status, due);
      const res = await send(w.client);
      expect(res.status, status).toBe(409);
      expect(res.body.error.code).toBe('MESSAGE_WINDOW_CLOSED');
    }
    await setStatus('COMPLETED', new Date(Date.now() + HOUR));
    await send(w.w2).expect(201);
    await setStatus('SETTLED');
    const history = await list(w.client).expect(200);
    expect(history.body.data).toHaveLength(2);
    expect((await read(w.client)).status).toBe(200);
  });

  it('panjang mengikuti order_message_max_length, isi kosong 422', async () => {
    await prisma.platformSetting.create({ data: { key: 'order_message_max_length', value: 10 } });
    expect((await send(w.client, '0123456789')).status).toBe(201);
    const tooLong = await send(w.client, '01234567890');
    expect(tooLong.status).toBe(422);
    expect(tooLong.body.error.code).toBe('VALIDATION_ERROR');
    expect((await send(w.client, '   ')).status).toBe(422);
    expect(await prisma.orderMessage.count()).toBe(1);
  });

  it('H72: rate limit per pengirim dari order_message_rate_per_minute', async () => {
    await prisma.platformSetting.create({ data: { key: 'order_message_rate_per_minute', value: 3 } });
    for (let i = 0; i < 3; i += 1) await send(w.client).expect(201);
    const limited = await send(w.client);
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    // Per pengirim: sisi lawan tidak ikut terkena.
    await send(w.owner).expect(201);
  });

  it('D178: dua pesan memberi satu notifikasi ke setiap penerima sisi lawan, in-app saja; setelah dibaca, pesan berikutnya memberi notifikasi lagi', async () => {
    await send(w.client).expect(201);
    await send(w.client).expect(201);
    for (const who of [w.owner, w.w2]) {
      const notes = await messageNotes(who.id);
      expect(notes).toHaveLength(1);
      expect(notes[0]).toMatchObject({ channel: 'IN_APP', referenceType: 'order', isRead: false });
      expect(notes[0]!.body).not.toContain('saya sudah di gerbang');
    }
    expect(await messageNotes(w.client.id)).toHaveLength(0);
    expect(await messageNotes(w.w3.id)).toHaveLength(0);
    expect(await prisma.notification.count({ where: { type: 'ORDER_MESSAGE', channel: 'EMAIL' } })).toBe(0);

    await read(w.owner).expect(200);
    expect((await messageNotes(w.owner.id))[0]).toMatchObject({ isRead: true });
    await send(w.client).expect(201);
    expect(await messageNotes(w.owner.id)).toHaveLength(2);
    expect(await messageNotes(w.w2.id)).toHaveLength(1);

    // Arah sebaliknya: pekerja menulis, hanya client yang diberi tahu.
    await send(w.w2).expect(201);
    expect(await messageNotes(w.client.id)).toHaveLength(1);
    expect(await messageNotes(w.owner.id)).toHaveLength(2);
  });

  it('read per sisi: hanya pesan sisi lawan yang ditandai, idempoten', async () => {
    const mine = (await send(w.owner, 'dari pemilik').expect(201)).body.data.id as string;
    const fromWorker = (await send(w.w2, 'dari pekerja').expect(201)).body.data.id as string;
    const fromClient = (await send(w.client, 'dari client').expect(201)).body.data.id as string;

    expect((await read(w.w2).expect(200)).body.data).toEqual({ updated: 1 });
    expect((await read(w.owner).expect(200)).body.data).toEqual({ updated: 0 });
    const readAt = async (id: string) => (await prisma.orderMessage.findUniqueOrThrow({ where: { id: BigInt(id) } })).readAt;
    expect(await readAt(fromClient)).not.toBeNull();
    expect(await readAt(mine)).toBeNull();
    expect(await readAt(fromWorker)).toBeNull();

    expect((await read(w.client).expect(200)).body.data).toEqual({ updated: 2 });
    expect(await readAt(mine)).not.toBeNull();
  });

  it('GET terpaginasi, terbaru dulu', async () => {
    for (const content of ['satu', 'dua', 'tiga']) await send(w.client, content).expect(201);
    const page = await list(w.owner, '?limit=2').expect(200);
    expect(page.body.data.map((m: { content: string }) => m.content)).toEqual(['tiga', 'dua']);
    expect(page.body.meta).toEqual({ page: 1, limit: 2, total: 3 });
    expect(page.body.data[0]).toMatchObject({ sender_name: expect.any(String), sender_role: 'CLIENT' });
  });

  it('V11 tetap nol setelah penanggung jawab yang pernah menulis diganti (revisi sesi 10b)', async () => {
    await send(w.w2, 'dari penanggung jawab lama').expect(201);
    await request(app).patch(`/api/v1/orders/${orderId}/assignment`).set(...auth(w.owner)).send({ assigned_worker_id: w.owner.workerId }).expect(200);
    expect((await send(w.w2)).status).toBe(403);
    expect(await runVerificationQuery('V11')).toEqual([]);
    // Pembanding: pesan dari pekerja yang tidak pernah ditugaskan tetap tertangkap V11.
    await prisma.orderMessage.create({ data: { orderId, senderUserId: w.w4.id, senderRole: 'WORKER', content: 'tidak sah' } });
    expect(await runVerificationQuery('V11')).toHaveLength(1);
    await prisma.orderMessage.deleteMany({ where: { senderUserId: w.w4.id } });
  });
});
