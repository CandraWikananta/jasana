/**
 * Notifikasi in-app (sesi 10a, D178).
 *
 *   recordNotification menulis IN_APP dan EMAIL di transaksi pemicunya
 *   tabel event: T1, T12 (email saja), pendamping (in-app saja), akun (email saja)
 *   GET /notifications, PATCH /:id/read, PATCH /read-all hanya untuk IN_APP milik pemanggil
 *   pemeriksa notifikasi pesan belum dibaca untuk 10b
 */

import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { prisma, type NotificationType } from '@jasana/database';
import { createApp } from '../src/app';
import { recordNotification } from '../src/modules/notifications/email-outbox';
import { hasUnreadMessageNotification } from '../src/modules/notifications/notifications.service';
import { captureEmails, hasTestDatabase, registerUser, resetDatabase } from './helpers/integration';
import { RENON, acceptedScheduledOrder, auth, newUser, newWorld, paidScheduledOrder, type User, type World } from './helpers/orders';

const app = createApp();
const inApp = (userId: string, extra: object = {}) => prisma.notification.count({ where: { channel: 'IN_APP', userId, ...extra } });

describe.skipIf(!hasTestDatabase)('notifikasi in-app (10a)', () => {
  beforeEach(async () => {
    await resetDatabase();
    captureEmails();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('recordNotification', () => {
    const input = (userId: string) => ({
      userId, type: 'KYC' as NotificationType, title: 'Judul', body: 'Isi', referenceType: 'provider_profile', referenceId: randomUUID(),
    });

    it('menulis IN_APP dan EMAIL di transaksi yang sama, rollback menghapus keduanya', async () => {
      const user = await newUser();
      const out = await prisma.$transaction((tx) => recordNotification(tx, { ...input(user.id), email: { to: 'a@uji.test', subject: 's', text: 't' } }));
      expect(out).toHaveLength(2);
      expect(await inApp(user.id)).toBe(1);
      expect(await prisma.notification.count({ where: { channel: 'EMAIL', userId: user.id, emailStatus: 'PENDING', emailAttempts: 0 } })).toBe(1);

      await expect(
        prisma.$transaction(async (tx) => {
          await recordNotification(tx, { ...input(user.id), email: { to: 'a@uji.test', subject: 's', text: 't' } });
          throw new Error('event pemicu gagal');
        }),
      ).rejects.toThrow('event pemicu gagal');
      expect(await prisma.notification.count({ where: { userId: user.id } })).toBe(2);
    });

    it('inApp false hanya menulis EMAIL, tanpa email hanya menulis IN_APP', async () => {
      const user = await newUser();
      await prisma.$transaction((tx) => recordNotification(tx, { ...input(user.id), inApp: false, email: { to: 'a@uji.test', subject: 's', text: 't' } }));
      await prisma.$transaction((tx) => recordNotification(tx, input(user.id)));
      expect(await prisma.notification.groupBy({ by: ['channel'], where: { userId: user.id }, _count: true, orderBy: { channel: 'asc' } }))
        .toEqual([{ channel: 'IN_APP', _count: 1 }, { channel: 'EMAIL', _count: 1 }]);
    });

    it('CHECK menolak email_attempts pada baris IN_APP', async () => {
      const user = await newUser();
      await expect(
        prisma.notification.create({ data: { userId: user.id, type: 'SYSTEM', channel: 'IN_APP', title: 'x', emailAttempts: 1 } }),
      ).rejects.toThrow(/chk_notification_email_attempts/);
    });
  });

  describe('tabel event (D178)', () => {
    let w: World;
    beforeEach(async () => {
      w = await newWorld();
    });

    it('T1: IN_APP untuk client, pemilik, dan penanggung jawab, berdampingan dengan EMAIL', async () => {
      const { id } = await acceptedScheduledOrder(app, w);
      for (const user of [w.client, w.owner, w.w2]) {
        expect(await inApp(user.id, { referenceType: 'order', referenceId: id, title: { startsWith: 'Order diterima' } })).toBe(1);
      }
      expect(await prisma.notification.count({ where: { channel: 'EMAIL', referenceId: id, title: { startsWith: 'Order diterima' } } })).toBe(3);
    });

    it('T12 Pekerjaan dimulai: EMAIL ke client, tanpa IN_APP (opsi B)', async () => {
      const { id } = await paidScheduledOrder(app, w);
      const step = (action: string, body: object = {}) => request(app).post(`/api/v1/orders/${id}/${action}`).set(...auth(w.w2)).send(body).expect(200);
      await step('depart');
      await step('check-in', { latitude: RENON.lat, longitude: RENON.lng });
      await step('start');
      const started = { referenceId: id, title: { startsWith: 'Pekerjaan dimulai' } };
      expect(await prisma.notification.count({ where: { channel: 'EMAIL', userId: w.client.id, ...started } })).toBe(1);
      expect(await inApp(w.client.id, started)).toBe(0);
      // Pembanding: event sebelumnya tetap punya IN_APP.
      expect(await inApp(w.client.id, { referenceId: id, title: { startsWith: 'Pekerja tiba' } })).toBe(1);
    });

    it('pendamping: in-app saja, dan setCrew hanya memberi tahu pendamping yang baru masuk', async () => {
      const { id } = await acceptedScheduledOrder(app, w, { crew: [w.w3] });
      const crewNote = { referenceId: id, title: { startsWith: 'Anda ditambahkan sebagai pendamping' } };
      expect(await inApp(w.w3.id, crewNote)).toBe(1);
      expect(await prisma.notification.count({ where: { channel: 'EMAIL', ...crewNote } })).toBe(0);

      const res = await request(app).put(`/api/v1/orders/${id}/crew`).set(...auth(w.owner)).send({ crew_worker_ids: [w.w3.workerId, w.owner.workerId] });
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(await inApp(w.w3.id, crewNote)).toBe(1);
      expect(await inApp(w.owner.id, crewNote)).toBe(1);
    });
  });

  it('email akun (register): EMAIL saja, tanpa IN_APP', async () => {
    const user = await registerUser(app);
    expect(await prisma.notification.count({ where: { userId: user.id, channel: 'EMAIL' } })).toBe(1);
    expect(await inApp(user.id)).toBe(0);
  });

  describe('endpoint', () => {
    let a: User;
    let b: User;
    const make = (userId: string, title: string, extra: object = {}) =>
      prisma.notification.create({ data: { userId, type: 'ORDER_STATUS', channel: 'IN_APP', title, body: 'isi', ...extra } });

    beforeEach(async () => {
      a = await newUser();
      b = await newUser();
      await make(a.id, 'satu', { createdAt: new Date(Date.now() - 3000) });
      await make(a.id, 'dua', { createdAt: new Date(Date.now() - 2000), isRead: true, readAt: new Date() });
      await make(a.id, 'tiga', { createdAt: new Date(Date.now() - 1000) });
      await make(b.id, 'milik b');
      await prisma.notification.create({ data: { userId: a.id, type: 'ACCOUNT', channel: 'EMAIL', title: 'email a', emailStatus: 'SENT' } });
    });

    const list = (user: User, query = '') => request(app).get(`/api/v1/notifications${query}`).set(...auth(user));

    it('GET hanya IN_APP milik pemanggil, terbaru dulu, dengan unread_count', async () => {
      const res = await list(a);
      expect(res.status).toBe(200);
      expect(res.body.data.map((n: { title: string }) => n.title)).toEqual(['tiga', 'dua', 'satu']);
      expect(res.body.meta).toEqual({ page: 1, limit: 20, total: 3, unread_count: 2 });
      expect(res.body.data[0]).toMatchObject({ type: 'ORDER_STATUS', is_read: false, read_at: null, reference_type: null });
      expect(typeof res.body.data[0].id).toBe('string');
    });

    it('filter is_read dan paginasi, unread_count tidak terpengaruh filter', async () => {
      const unread = await list(a, '?is_read=false');
      expect(unread.body.data.map((n: { title: string }) => n.title)).toEqual(['tiga', 'satu']);
      expect(unread.body.meta).toMatchObject({ total: 2, unread_count: 2 });
      const read = await list(a, '?is_read=true');
      expect(read.body.data.map((n: { title: string }) => n.title)).toEqual(['dua']);
      expect(read.body.meta.unread_count).toBe(2);
      const page2 = await list(a, '?limit=2&page=2');
      expect(page2.body.data.map((n: { title: string }) => n.title)).toEqual(['satu']);
      expect((await list(a, '?is_read=ya')).status).toBe(422);
    });

    it('PATCH /:id/read: milik sendiri ditandai sekali, milik orang lain dan baris EMAIL 404', async () => {
      const mine = await prisma.notification.findFirstOrThrow({ where: { userId: a.id, title: 'satu' } });
      const first = await request(app).patch(`/api/v1/notifications/${mine.id}/read`).set(...auth(a));
      expect(first.status).toBe(200);
      expect(first.body.data).toMatchObject({ id: mine.id.toString(), is_read: true });
      const again = await request(app).patch(`/api/v1/notifications/${mine.id}/read`).set(...auth(a));
      expect(again.body.data.read_at).toBe(first.body.data.read_at);

      const others = await prisma.notification.findFirstOrThrow({ where: { userId: b.id } });
      const email = await prisma.notification.findFirstOrThrow({ where: { userId: a.id, channel: 'EMAIL' } });
      for (const id of [others.id, email.id, 999999999n]) {
        const res = await request(app).patch(`/api/v1/notifications/${id}/read`).set(...auth(a));
        expect(res.status).toBe(404);
        expect(res.body.error.code).toBe('NOT_FOUND');
      }
      expect((await prisma.notification.findUniqueOrThrow({ where: { id: others.id } })).isRead).toBe(false);
      expect((await request(app).patch('/api/v1/notifications/abc/read').set(...auth(a))).status).toBe(422);
    });

    it('PATCH /read-all hanya menyentuh IN_APP milik pemanggil', async () => {
      const res = await request(app).patch('/api/v1/notifications/read-all').set(...auth(a));
      expect(res.body.data).toEqual({ updated: 2 });
      expect((await list(a)).body.meta.unread_count).toBe(0);
      expect(await inApp(b.id, { isRead: false })).toBe(1);
      expect(await prisma.notification.count({ where: { channel: 'EMAIL', isRead: true } })).toBe(0);
    });

    it('tanpa token 401', async () => {
      expect((await request(app).get('/api/v1/notifications')).status).toBe(401);
    });
  });

  it('hasUnreadMessageNotification: hanya ORDER_MESSAGE IN_APP belum dibaca untuk order itu', async () => {
    const user = await newUser();
    const orderId = randomUUID();
    const check = (id = orderId, userId = user.id) => prisma.$transaction((tx) => hasUnreadMessageNotification(tx, userId, id));
    expect(await check()).toBe(false);

    await prisma.notification.create({ data: { userId: user.id, type: 'ORDER_STATUS', channel: 'IN_APP', title: 'status', referenceType: 'order', referenceId: orderId } });
    expect(await check()).toBe(false);

    const msg = await prisma.notification.create({
      data: { userId: user.id, type: 'ORDER_MESSAGE', channel: 'IN_APP', title: 'Pesan baru', referenceType: 'order', referenceId: orderId },
    });
    expect(await check()).toBe(true);
    expect(await check(randomUUID())).toBe(false);
    expect(await check(orderId, (await newUser()).id)).toBe(false);

    await prisma.notification.update({ where: { id: msg.id }, data: { isRead: true, readAt: new Date() } });
    expect(await check()).toBe(false);
  });
});
