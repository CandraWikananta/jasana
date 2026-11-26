/**
 * Review (sesi 10b, D179).
 *
 *   hanya client, setelah COMPLETED (termasuk yang kemudian disengketakan), dalam review_window_days
 *   satu per order, balasan penyedia sekali, notifikasi in-app ke pihak lawan
 *   daftar publik dan detail listing hanya review tampil, nama disamarkan
 *   admin sembunyikan dan tampilkan lagi, cache rating ikut
 *   dua review paralel untuk listing yang sama menghasilkan cache tepat
 */

import type { Express } from 'express';
import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { maskName } from '../src/modules/reviews/reviews.mapper';
import { captureEmails, hasTestDatabase, resetDatabase } from './helpers/integration';
import { HOUR, acceptedScheduledOrder, auth, completedOrder, newProvider, newUser, newWorld, waitForLockWaiters, type User, type World } from './helpers/orders';

const DAY = 24 * HOUR;

describe('maskName', () => {
  it('kata pertama dan inisial kata kedua', () => {
    expect(maskName('Candra Wikananta')).toBe('Candra W.');
    expect(maskName('  ni made  ayu sari ')).toBe('ni M.');
    expect(maskName('Budi')).toBe('Budi');
  });
});

describe.skipIf(!hasTestDatabase)('review (10b)', () => {
  let app: Express;
  let w: World;
  let admin: User;

  beforeEach(async () => {
    await resetDatabase();
    captureEmails();
    app = createApp();
    w = await newWorld();
    admin = await newUser({ admin: true });
  });

  const review = (orderId: string, as: User, body: object = { rating: 4, comment: 'Rapi dan tepat waktu' }) =>
    request(app).post(`/api/v1/orders/${orderId}/review`).set(...auth(as)).send(body);
  const reply = (reviewId: string, as: User, text = 'Terima kasih') =>
    request(app).post(`/api/v1/providers/me/reviews/${reviewId}/reply`).set(...auth(as)).send({ reply: text });
  const visibility = (reviewId: string, isVisible: boolean, as: User = admin) =>
    request(app).patch(`/api/v1/admin/reviews/${reviewId}/visibility`).set(...auth(as)).send({ is_visible: isVisible });
  const cache = async () => {
    const listing = await prisma.listing.findUniqueOrThrow({ where: { id: w.listingId } });
    const provider = await prisma.providerProfile.findUniqueOrThrow({ where: { id: w.provider.id } });
    return {
      listing: [listing.ratingAverage.toNumber(), listing.ratingCount],
      provider: [provider.ratingAverage.toNumber(), provider.ratingCount],
    };
  };

  it('client memberi review setelah COMPLETED: 201, cache listing dan penyedia, notifikasi in-app ke pemilik', async () => {
    const { id } = await completedOrder(app, w);
    const orderDto = async () => (await request(app).get(`/api/v1/orders/${id}`).set(...auth(w.client))).body.data;
    // H131: has_review dan review_deadline_at = completed_at + review_window_days (default 14).
    const before = await orderDto();
    expect(before.has_review).toBe(false);
    expect(new Date(before.review_deadline_at).getTime()).toBe(new Date(before.completed_at).getTime() + 14 * DAY);

    const res = await review(id, w.client);
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect((await orderDto()).has_review).toBe(true);
    expect(res.body.data).toMatchObject({ order_id: id, listing_id: w.listingId, rating: 4, comment: 'Rapi dan tepat waktu', is_visible: true, provider_reply: null });
    expect(await cache()).toEqual({ listing: [4, 1], provider: [4, 1] });
    const notes = await prisma.notification.findMany({ where: { type: 'REVIEW' } });
    expect(notes).toEqual([expect.objectContaining({ userId: w.owner.id, channel: 'IN_APP', referenceType: 'review', referenceId: res.body.data.id })]);
  });

  it('hanya client: pemilik dan penanggung jawab 403, orang luar 403', async () => {
    const { id } = await completedOrder(app, w);
    for (const who of [w.owner, w.w2, await newUser()]) {
      const res = await review(id, who);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_ACTOR');
    }
    expect(await prisma.review.count()).toBe(0);
  });

  it('409 REVIEW_NOT_ALLOWED sebelum pernah COMPLETED, 409 REVIEW_ALREADY_EXISTS untuk review kedua', async () => {
    const { id: accepted } = await acceptedScheduledOrder(app, w, { scheduledAt: new Date(Date.now() + 5 * HOUR) });
    const early = await review(accepted, w.client);
    expect(early.status).toBe(409);
    expect(early.body.error.code).toBe('REVIEW_NOT_ALLOWED');

    const { id } = await completedOrder(app, w);
    await review(id, w.client).expect(201);
    const again = await review(id, w.client, { rating: 1 });
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('REVIEW_ALREADY_EXISTS');
    expect(await cache()).toEqual({ listing: [4, 1], provider: [4, 1] });
  });

  it('batas review_window_days sejak completed_at, dibaca dari platform_settings', async () => {
    const { id } = await completedOrder(app, w);
    await prisma.order.update({ where: { id }, data: { completedAt: new Date(Date.now() - 14 * DAY - 60_000) } });
    const late = await review(id, w.client);
    expect(late.status).toBe(409);
    expect(late.body.error.code).toBe('REVIEW_WINDOW_CLOSED');

    await prisma.platformSetting.create({ data: { key: 'review_window_days', value: 15 } });
    // H131: batas di DTO ikut parameter, bukan angka tetap.
    const dto = (await request(app).get(`/api/v1/orders/${id}`).set(...auth(w.client))).body.data;
    expect(new Date(dto.review_deadline_at).getTime()).toBe(new Date(dto.completed_at).getTime() + 15 * DAY);
    await review(id, w.client).expect(201);
  });

  it('order yang disengketakan setelah COMPLETED tetap bisa direview (D179)', async () => {
    const { id } = await completedOrder(app, w);
    await prisma.order.update({ where: { id }, data: { status: 'DISPUTED' } });
    await review(id, w.client).expect(201);
  });

  it('validasi: rating 1 sampai 5, komentar 1 sampai 1000 karakter, nominal atau field lain ditolak', async () => {
    const { id } = await completedOrder(app, w);
    for (const body of [{ rating: 0 }, { rating: 6 }, { rating: 4.5 }, { rating: 4, comment: 'x'.repeat(1001) }, { rating: 4, comment: '  ' }, { rating: 4, is_visible: false }]) {
      expect((await review(id, w.client, body)).status, JSON.stringify(body)).toBe(422);
    }
    await review(id, w.client, { rating: 5, comment: 'x'.repeat(1000) }).expect(201);
  });

  it('daftar publik dan detail listing: hanya review tampil, nama disamarkan, terbaru dulu, detail maksimal 3', async () => {
    const ids: string[] = [];
    for (const rating of [5, 4, 3, 2]) {
      const { id } = await completedOrder(app, w);
      ids.push((await review(id, w.client, { rating }).expect(201)).body.data.id);
    }
    await visibility(ids[3]!, false).expect(200);

    const page = await request(app).get(`/api/v1/listings/${w.listingId}/reviews?limit=2`).expect(200);
    expect(page.body.meta).toEqual({ page: 1, limit: 2, total: 3 });
    expect(page.body.data.map((r: { rating: number }) => r.rating)).toEqual([3, 4]);
    expect(page.body.data[0].reviewer_name).toMatch(/^Uji [0-9A-Z]\.$|^Uji$/);
    expect(page.body.data[0]).not.toHaveProperty('is_visible');

    const detail = await request(app).get(`/api/v1/listings/${w.listingId}`).expect(200);
    expect(detail.body.data.reviews.map((r: { rating: number }) => r.rating)).toEqual([3, 4, 5]);

    await prisma.listing.update({ where: { id: w.listingId }, data: { status: 'INACTIVE' } });
    expect((await request(app).get(`/api/v1/listings/${w.listingId}/reviews`)).status).toBe(404);
  });

  it('balasan penyedia sekali, penyedia lain 404, client diberi tahu in-app', async () => {
    const { id } = await completedOrder(app, w);
    const reviewId = (await review(id, w.client).expect(201)).body.data.id as string;

    const other = await newProvider();
    expect((await reply(reviewId, other.owner)).status).toBe(404);
    const first = await reply(reviewId, w.owner).expect(200);
    expect(first.body.data).toMatchObject({ provider_reply: 'Terima kasih', provider_replied_at: expect.any(String) });
    const second = await reply(reviewId, w.owner, 'Balasan kedua');
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('REVIEW_ALREADY_REPLIED');
    expect((await prisma.review.findUniqueOrThrow({ where: { id: reviewId } })).providerReply).toBe('Terima kasih');
    expect(await prisma.notification.count({ where: { userId: w.client.id, type: 'REVIEW', channel: 'IN_APP', referenceId: reviewId } })).toBe(1);
    expect((await reply(reviewId, w.owner, 'x'.repeat(1001))).status).toBe(422);
  });

  it('admin menyembunyikan dan menampilkan lagi: cache ikut, idempoten, daftar admin bisa disaring', async () => {
    const a = await completedOrder(app, w);
    const b = await completedOrder(app, w);
    const keep = (await review(a.id, w.client, { rating: 5 }).expect(201)).body.data.id as string;
    const hide = (await review(b.id, w.client, { rating: 2 }).expect(201)).body.data.id as string;
    expect(await cache()).toEqual({ listing: [3.5, 2], provider: [3.5, 2] });

    expect((await visibility(hide, false, w.owner)).status).toBe(403);
    expect((await visibility(hide, false).expect(200)).body.data).toMatchObject({ is_visible: false, client_name: expect.any(String), order_number: expect.any(String) });
    expect(await cache()).toEqual({ listing: [5, 1], provider: [5, 1] });
    await visibility(hide, false).expect(200);
    expect(await cache()).toEqual({ listing: [5, 1], provider: [5, 1] });

    const hidden = await request(app).get('/api/v1/admin/reviews?is_visible=false').set(...auth(admin)).expect(200);
    expect(hidden.body.data.map((r: { id: string }) => r.id)).toEqual([hide]);

    await visibility(hide, true).expect(200);
    expect(await cache()).toEqual({ listing: [3.5, 2], provider: [3.5, 2] });
    expect(keep).toBeTruthy();
  });

  it('dua review paralel untuk listing yang sama dari dua order: cache tepat (rating_count 2)', async () => {
    const a = await completedOrder(app, w);
    const b = await completedOrder(app, w, { assigned: w.w3 });

    // Kunci listing dipegang test, supaya kedua permintaan pasti bertabrakan di titik penulisan cache.
    // FOR NO KEY UPDATE tidak menahan insert review (FK hanya KEY SHARE).
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    let locked!: () => void;
    const isLocked = new Promise<void>((resolve) => (locked = resolve));
    const holder = prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM listings WHERE id = ${w.listingId}::uuid FOR NO KEY UPDATE`;
      locked();
      await gate;
    }, { timeout: 30_000 });
    await isLocked;

    const both = Promise.all([review(a.id, w.client, { rating: 5 }), review(b.id, w.client, { rating: 2 })].map((p) => p.then((res) => res)));
    await waitForLockWaiters(2);
    release();
    await holder;
    expect((await both).map((res) => res.status)).toEqual([201, 201]);
    expect(await cache()).toEqual({ listing: [3.5, 2], provider: [3.5, 2] });
  });
});
