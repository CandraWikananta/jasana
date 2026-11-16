/**
 * H111: jumlah kueri satu giliran chat, lewat event `query` Prisma (dinyalakan
 * untuk NODE_ENV=test di packages/database). Angkanya dikunci di sini supaya
 * kueri berulang atau N+1 baru langsung ketahuan. BEGIN dan COMMIT ikut dihitung.
 *
 *                          sebelum 9c   sesudah 9c
 *   tamu, templat               15           13
 *   tamu, cari_jasa             21           19
 *   terdaftar, cari_jasa        18           17
 *
 * Yang dipangkas: SELECT message_count setelah UPDATE (satu update bersyarat
 * yang mengembalikan kolomnya), dan dua baca setting tamu yang kini bersamaan
 * sehingga digabung Prisma jadi satu IN. Kartu listing tetap 4 kueri, tetapi
 * tiga relasinya kini paralel (2 perjalanan berurutan, sebelumnya 4).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma, type Prisma, type PrismaClient } from '@jasana/database';
import { createApp } from '../src/app';
import { invalidateActiveSubcategories } from '../src/modules/catalog/catalog.service';
import { presence } from '../src/realtime/presence';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import { loadCards, searchListings } from '../src/modules/listings/listing-search.service';
import { CARD_SELECT } from '../src/modules/listings/listings.mapper';
import { RENON, auth, newProvider, newUser, waitForLockWaiters } from './helpers/orders';

const queries: string[] = [];
let recording = false;
(prisma as unknown as PrismaClient<Prisma.PrismaClientOptions, 'query'>).$on('query', (event) => {
  if (recording) queries.push(event.query);
});

async function record<T>(run: () => Promise<T>): Promise<{ result: T; queries: string[] }> {
  queries.length = 0;
  recording = true;
  try {
    const result = await run();
    return { result, queries: [...queries] };
  } finally {
    recording = false;
  }
}

describe.skipIf(!hasTestDatabase)('jumlah kueri per giliran chat (H111)', () => {
  let app: Express;

  beforeEach(async () => {
    await resetDatabase();
    const category = await prisma.category.upsert({
      where: { slug: 'perbaikan' },
      create: { slug: 'perbaikan', name: 'Perbaikan' },
      update: { isActive: true },
    });
    const sub = await prisma.subcategory.upsert({
      where: { categoryId_slug: { categoryId: category.id, slug: 'servis-ac' } },
      create: { categoryId: category.id, slug: 'servis-ac', name: 'Servis AC' },
      update: { isActive: true },
    });
    const { provider, owner } = await newProvider();
    const listing = await prisma.listing.create({
      data: {
        providerProfileId: provider.id, subcategoryId: sub.id, title: 'Servis AC Renon', price: 150000,
        estimatedDurationMinutes: 60, attributes: {}, status: 'ACTIVE', supportsScheduled: true, supportsAvailableNow: true,
      },
    });
    await prisma.workerListing.create({ data: { workerId: owner.workerId, listingId: listing.id } });
    invalidateActiveSubcategories();
    presence.reset();
    app = createApp();
  });

  afterEach(() => {
    recording = false;
  });

  async function guest() {
    const res = await request(app).post('/api/v1/chat/guest-sessions');
    const s = { id: res.body.data.session.id as string, token: res.body.data.guest_token as string };
    // Giliran pertama mengisi cache sub-kategori, supaya yang dihitung giliran biasa.
    await request(app).post(`/api/v1/chat/sessions/${s.id}/messages`).set('X-Guest-Token', s.token).send({ content: 'halo' });
    return s;
  }

  const send = (s: { id: string; token: string }, content: string, extra: object = {}) =>
    record(() => request(app).post(`/api/v1/chat/sessions/${s.id}/messages`).set('X-Guest-Token', s.token).send({ content, ...extra }));

  it('tamu: templat, cari_jasa dengan koordinat', async () => {
    const s = await guest();
    const template = await send(s, 'halo lagi');
    expect(template.result.status).toBe(201);
    const search = await send(s, 'servis ac', { latitude: RENON.lat, longitude: RENON.lng });
    expect(search.result.body.data.recommendations).toHaveLength(1);
    expect(template.queries).toHaveLength(13);
    expect(search.queries).toHaveLength(19);
    // Kartu: satu kueri listing, lalu tiga relasi yang dibaca bersamaan.
    const relations = search.queries.filter((q) => /^SELECT "public"\."(subcategories|provider_profiles|listing_photos)"\."id"/.test(q));
    expect(relations).toHaveLength(3);
  });

  it('tiga relasi kartu dibaca bersamaan, di luar transaksi (usulan D174)', async () => {
    // Listing kedua dengan dua foto utama (kalau ada) dan satu foto biasa: yang terpilih harus sama dengan bawaan Prisma.
    const first = await prisma.listing.findFirstOrThrow();
    const second = await prisma.listing.create({
      data: { ...first, id: undefined, title: 'Servis AC kedua', createdAt: undefined, updatedAt: undefined, attributes: {} },
    });
    await prisma.listingPhoto.createMany({
      data: [
        { listingId: second.id, fileUrl: 'https://uji/biasa.jpg' },
        { listingId: second.id, fileUrl: 'https://uji/utama-1.jpg', isPrimary: true },
        { listingId: second.id, fileUrl: 'https://uji/utama-2.jpg', isPrimary: true },
      ],
    });
    await prisma.workerListing.create({ data: { workerId: (await prisma.workerListing.findFirstOrThrow()).workerId, listingId: second.id } });
    const { items } = await searchListings({ page: 1, limit: 5, lat: RENON.lat, lng: RENON.lng });
    expect(items).toHaveLength(2);
    const ids = items.map((card) => card.id);
    const expected = await prisma.listing.findMany({ where: { id: { in: ids } }, select: CARD_SELECT });
    let pending: Promise<unknown> | undefined;
    let duringLock: string[] = [];
    await prisma.$transaction(async (tx) => {
      // Sub-kategori adalah relasi pertama di CARD_SELECT. Kalau relasi dibaca berurutan
      // (bawaan Prisma 6), provider dan foto ikut tertahan di belakangnya.
      await tx.$executeRaw`LOCK TABLE subcategories IN ACCESS EXCLUSIVE MODE`;
      queries.length = 0;
      recording = true;
      pending = loadCards(ids);
      await waitForLockWaiters(1);
      await new Promise((resolve) => setTimeout(resolve, 300));
      duringLock = [...queries];
    });
    const cards = await pending;
    recording = false;
    const done = (table: string) => duringLock.some((q) => q.startsWith(`SELECT "public"."${table}"."id"`));
    expect(done('provider_profiles')).toBe(true);
    expect(done('listing_photos')).toBe(true);
    expect(done('subcategories')).toBe(false);
    // Bentuk dan isi sama persis dengan findMany({ select: CARD_SELECT }).
    expect(cards).toEqual(expected);
  });

  it('terdaftar: cari_jasa tanpa koordinat memakai alamat default', async () => {
    const user = await newUser();
    await prisma.userAddress.create({
      data: { userId: user.id, addressLine: 'Jl. Raya Puputan', latitude: RENON.lat, longitude: RENON.lng, isDefault: true },
    });
    const id = (await request(app).post('/api/v1/chat/sessions').set(...auth(user))).body.data.id as string;
    await request(app).post(`/api/v1/chat/sessions/${id}/messages`).set(...auth(user)).send({ content: 'halo' });
    const search = await record(() => request(app).post(`/api/v1/chat/sessions/${id}/messages`).set(...auth(user)).send({ content: 'servis ac' }));
    expect(search.result.body.data.recommendations).toHaveLength(1);
    expect(search.queries).toHaveLength(17);
  });
});
