/**
 * Chatbot sesi 9c: klaim sesi tamu (H68, D155, usulan D170), personalization_snapshot
 * (D27, usulan D168 dan D169), H66, urutan ulang rekomendasi, templat kosong (D166),
 * serta V3 (usulan D171) dan V9 (usulan D172). Seluruhnya memakai LLM_GATEWAY=fake.
 */

import { randomInt } from 'node:crypto';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma, type OrderStatus } from '@jasana/database';
import { createApp } from '../src/app';
import { hashToken } from '../src/lib/crypto';
import { AppError } from '../src/lib/errors';
import { llmGateway } from '../src/lib/llm-gateway';
import type { Intent } from '../src/lib/llm-intent';
import { invalidateActiveSubcategories, updateSubcategory } from '../src/modules/catalog/catalog.service';
import { REPLY, rerankByPriceRange } from '../src/modules/chat/chat-message.service';
import { SNAPSHOT_ORDER_STATUSES, type PersonalizationSnapshot } from '../src/modules/chat/chat.service';
import { presence } from '../src/realtime/presence';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import { runVerificationQuery } from './helpers/providers';
import { RENON, auth, newProvider, newUser, northOfRenon, waitForLockWaiters, type User } from './helpers/orders';

const slot = (overrides: Partial<Intent['slot']> = {}): Intent['slot'] => ({
  lokasi: { teks: null, pakai_lokasi_saat_ini: false },
  waktu: { jenis: 'TIDAK_DISEBUT', teks: null },
  budget_maks: null,
  atribut: [],
  ...overrides,
});

describe('templat hasil kosong (D166)', () => {
  const categories = ['Perbaikan', 'Otomotif'];

  it('saran mengikuti slot: budget, waktu, keduanya, atau tidak ada', () => {
    expect(REPLY.none('Servis AC', slot({ budget_maks: 100_000 }), categories)).toBe(
      'Belum ada Servis AC yang bisa melayani lokasimu. Coba naikkan budget-nya.',
    );
    expect(REPLY.none('Servis AC', slot({ waktu: { jenis: 'TERJADWAL', teks: 'besok' } }), categories)).toBe(
      'Belum ada Servis AC yang bisa melayani lokasimu. Coba ganti waktunya.',
    );
    expect(REPLY.none('Servis AC', slot({ budget_maks: 1, waktu: { jenis: 'SEKARANG', teks: 'skrg' } }), categories)).toBe(
      'Belum ada Servis AC yang bisa melayani lokasimu saat ini. Coba naikkan budget-nya atau ganti waktunya.',
    );
    expect(REPLY.none('Servis AC', slot(), categories)).toBe(
      'Belum ada Servis AC yang bisa melayani lokasimu. Coba cari di lokasi lain, atau jasa lain yang tersedia: Perbaikan, Otomotif.',
    );
    expect(REPLY.none('Servis AC', slot(), [])).toBe('Belum ada Servis AC yang bisa melayani lokasimu. Coba cari di lokasi lain.');
  });
});

describe('rerankByPriceRange (usulan D168)', () => {
  const cards = [{ id: 'a', price: 100 }, { id: 'b', price: 400 }, { id: 'c', price: 250 }, { id: 'd', price: 300 }];
  const ids = (list: { id: string }[]) => list.map((c) => c.id);

  it('yang di dalam rentang di atas, jarak sama tetap urutan asal, bukan filter', () => {
    expect(ids(rerankByPriceRange(cards, { min: 240, maks: 310 }))).toEqual(['c', 'd', 'b', 'a']);
    expect(ids(rerankByPriceRange(cards, { min: 50, maks: 500 }))).toEqual(['a', 'b', 'c', 'd']);
    expect(ids(rerankByPriceRange(cards, { min: 320, maks: 320 }))).toEqual(['d', 'c', 'b', 'a']);
    expect(rerankByPriceRange(cards, { min: 0, maks: 0 })).toHaveLength(4);
  });

  it('tanpa rentang (tamu atau belum pernah order): urutan pencarian dipertahankan', () => {
    expect(ids(rerankByPriceRange(cards, null))).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe.skipIf(!hasTestDatabase)('chatbot 9c', () => {
  let app: Express;
  let servisAcId: string;
  const TEST_CATEGORY = 'uji-9c';

  /** Sub-kategori uji di kategori `uji-9c`, dihapus resetDatabase. Servis AC dikenal fake. */
  async function subcategory(categorySlug: string, categoryName: string, slug: string, name: string): Promise<string> {
    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      create: { slug: categorySlug, name: categoryName },
      update: { isActive: true },
    });
    const sub = await prisma.subcategory.upsert({
      where: { categoryId_slug: { categoryId: category.id, slug } },
      create: { categoryId: category.id, slug, name },
      update: { isActive: true },
    });
    return sub.id;
  }

  async function listing(subcategoryId: string, price: number, at = RENON) {
    const { provider, owner } = await newProvider();
    await prisma.providerProfile.update({ where: { id: provider.id }, data: { baseLatitude: at.lat, baseLongitude: at.lng } });
    const row = await prisma.listing.create({
      data: {
        providerProfileId: provider.id, subcategoryId, title: `Listing ${price}`, price,
        estimatedDurationMinutes: 60, attributes: {}, status: 'ACTIVE', supportsScheduled: true, supportsAvailableNow: true,
      },
    });
    await prisma.workerListing.create({ data: { workerId: owner.workerId, listingId: row.id } });
    return { id: row.id, providerProfileId: provider.id, workerId: owner.workerId };
  }

  type ListingRef = Awaited<ReturnType<typeof listing>>;

  /** Order lampau langsung ke basis data. total = harga dasar + opsi, supaya terbukti rentang memakai harga dasar. */
  async function pastOrder(clientId: string, ref: ListingRef, status: OrderStatus, base: number, options = 0, createdAt = new Date()) {
    const total = base + options;
    return prisma.order.create({
      data: {
        orderNumber: `ORD-UJI9C-${randomInt(1e9)}`,
        clientId, providerProfileId: ref.providerProfileId, listingId: ref.id, assignedWorkerId: ref.workerId,
        bookingMode: 'SCHEDULED', status, scheduledAt: createdAt,
        serviceAddress: 'Alamat uji', serviceLatitude: RENON.lat, serviceLongitude: RENON.lng, locationSource: 'MAP_PIN',
        snapshotListingTitle: 'Listing uji', listingBaseAmount: base, optionsAmount: options, totalAmount: total,
        platformFee: total * 0.1, providerEarning: total * 0.9, createdAt,
      },
    });
  }

  async function guestSession(): Promise<{ id: string; token: string }> {
    const res = await request(app).post('/api/v1/chat/guest-sessions');
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return { id: res.body.data.session.id, token: res.body.data.guest_token };
  }

  async function userSession(user: User): Promise<string> {
    const res = await request(app).post('/api/v1/chat/sessions').set(...auth(user));
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body.data.id;
  }

  const guestSend = (s: { id: string; token: string }, content: string, extra: object = {}) =>
    request(app).post(`/api/v1/chat/sessions/${s.id}/messages`).set('X-Guest-Token', s.token).send({ content, ...extra });
  const userSend = (user: User, id: string, content: string, extra: object = {}) =>
    request(app).post(`/api/v1/chat/sessions/${id}/messages`).set(...auth(user)).send({ content, ...extra });
  const claim = (s: { id: string; token: string }, user?: User) => {
    const req = request(app).post(`/api/v1/chat/sessions/${s.id}/claim`).set('X-Guest-Token', s.token);
    return user ? req.set(...auth(user)) : req;
  };
  const at = (p: { lat: number; lng: number }) => ({ latitude: p.lat, longitude: p.lng });

  beforeEach(async () => {
    await resetDatabase();
    servisAcId = await subcategory('perbaikan', 'Perbaikan', 'servis-ac', 'Servis AC');
    invalidateActiveSubcategories();
    presence.reset();
    app = createApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    // Kategori berawalan uji- ikut dihapus resetDatabase.
    await resetDatabase();
    invalidateActiveSubcategories();
  });

  describe('klaim sesi tamu (usulan D170)', () => {
    it('berhasil: user_id, claimed_at, expires_at kosong, guest_token tetap; riwayat pra-klaim terbaca lewat JWT', async () => {
      const s = await guestSession();
      expect((await guestSend(s, 'halo kak')).status).toBe(201);
      const user = await newUser();

      const res = await claim(s, user);
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data).toMatchObject({ id: s.id, type: 'REGISTERED', status: 'ACTIVE', expires_at: null, message_count: 1 });
      expect(res.body.data.claimed_at).not.toBeNull();

      const row = await prisma.chatSession.findUniqueOrThrow({ where: { id: s.id } });
      expect(row).toMatchObject({ userId: user.id, expiresAt: null, guestToken: hashToken(s.token) });
      expect(row.claimedAt).toEqual(new Date(res.body.data.claimed_at));
      expect((row.personalizationSnapshot as unknown as PersonalizationSnapshot).sumber).toBe('klaim');

      const history = await request(app).get(`/api/v1/chat/sessions/${s.id}/messages`).set(...auth(user));
      expect(history.body.data.map((m: { content: string }) => m.content)).toContain('halo kak');
      const sessions = await request(app).get('/api/v1/chat/sessions').set(...auth(user));
      expect(sessions.body.data.map((x: { id: string }) => x.id)).toEqual([s.id]);
    });

    it('setelah diklaim: token lama 404 untuk semua aksi, dan sesi mengikuti aturan terdaftar', async () => {
      const s = await guestSession();
      await prisma.platformSetting.upsert({
        where: { key: 'guest_chat_message_limit' }, create: { key: 'guest_chat_message_limit', value: 1 }, update: { value: 1 },
      });
      expect((await guestSend(s, 'halo')).status).toBe(201);
      expect((await guestSend(s, 'halo lagi')).body.error.code).toBe('GUEST_CHAT_LIMIT_REACHED');
      const user = await newUser();
      expect((await claim(s, user)).status).toBe(200);

      expect((await request(app).get(`/api/v1/chat/sessions/${s.id}/messages`).set('X-Guest-Token', s.token)).status).toBe(404);
      expect((await guestSend(s, 'halo')).status).toBe(404);
      expect((await request(app).post(`/api/v1/chat/sessions/${s.id}/end`).set('X-Guest-Token', s.token)).status).toBe(404);

      // Batas tamu 1 sudah terpakai, tetapi sesi kini terdaftar: tanpa batas per sesi, tanpa guest_quota.
      const sent = await userSend(user, s.id, 'halo');
      expect(sent.status, JSON.stringify(sent.body)).toBe(201);
      expect(sent.body.data.guest_quota).toBeNull();
    });

    it('kode galat: tanpa JWT 401, tanpa atau format token salah 401, token salah 404', async () => {
      const s = await guestSession();
      const user = await newUser();
      expect((await claim(s)).status).toBe(401);
      expect((await request(app).post(`/api/v1/chat/sessions/${s.id}/claim`).set(...auth(user))).status).toBe(401);
      expect((await claim({ id: s.id, token: 'bukan-hex' }, user)).status).toBe(401);
      expect((await claim({ id: s.id, token: 'a'.repeat(64) }, user)).status).toBe(404);
      const other = await guestSession();
      expect((await claim({ id: s.id, token: other.token }, user)).status).toBe(404);
      expect((await claim({ id: 'not-a-uuid', token: s.token }, user)).status).toBe(422);
      expect((await prisma.chatSession.findUniqueOrThrow({ where: { id: s.id } })).userId).toBeNull();
    });

    it('sudah diklaim 409 CHAT_SESSION_ALREADY_CLAIMED, termasuk oleh akun yang sama', async () => {
      const s = await guestSession();
      const [first, second] = [await newUser(), await newUser()];
      expect((await claim(s, first)).status).toBe(200);
      for (const user of [first, second]) {
        const res = await claim(s, user);
        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe('CHAT_SESSION_ALREADY_CLAIMED');
      }
      expect((await prisma.chatSession.findUniqueOrThrow({ where: { id: s.id } })).userId).toBe(first.id);
    });

    it('sesi ENDED atau kedaluwarsa 409 CHAT_SESSION_ENDED, sesi tidak berubah', async () => {
      const user = await newUser();
      const expired = await guestSession();
      await prisma.chatSession.update({ where: { id: expired.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
      const ended = await guestSession();
      expect((await request(app).post(`/api/v1/chat/sessions/${ended.id}/end`).set('X-Guest-Token', ended.token)).status).toBe(200);
      for (const s of [expired, ended]) {
        const res = await claim(s, user);
        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe('CHAT_SESSION_ENDED');
        expect((await prisma.chatSession.findUniqueOrThrow({ where: { id: s.id } })).userId).toBeNull();
      }
    });

    it('constraint H63 (migrasi 9c): sesi belum diklaim tetap wajib expires_at, sesi hasil klaim boleh kosong', async () => {
      const user = await newUser();
      await expect(prisma.chatSession.create({ data: { guestToken: hashToken('tanpa-batas') } })).rejects.toThrow(/chk_guest_session_expiry/);
      await expect(prisma.chatSession.create({ data: { guestToken: hashToken('diklaim'), userId: user.id, claimedAt: new Date() } })).resolves.toBeTruthy();
    });

    it('klaim berpacu dengan berakhirnya sesi: UPDATE bersyarat menolak, 409 CHAT_SESSION_ENDED', async () => {
      const s = await guestSession();
      const user = await newUser();
      let pending: Promise<request.Response> | undefined;
      await prisma.$transaction(async (tx) => {
        // Klaim sudah lolos pemeriksaan baca, lalu sesi diakhiri sebelum UPDATE-nya jalan.
        await tx.$queryRaw`SELECT id FROM chat_sessions WHERE id = ${s.id}::uuid FOR UPDATE`;
        pending = claim(s, user).then((r) => r);
        await waitForLockWaiters(1);
        await tx.chatSession.update({ where: { id: s.id }, data: { status: 'ENDED', endedAt: new Date() } });
      });
      const res = await pending!;
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CHAT_SESSION_ENDED');
      expect((await prisma.chatSession.findUniqueOrThrow({ where: { id: s.id } })).userId).toBeNull();
    });

    it('dua klaim paralel oleh dua akun: tepat satu pemenang, yang kalah 409 ALREADY_CLAIMED', async () => {
      const s = await guestSession();
      const [a, b] = [await newUser(), await newUser()];
      let pending: Promise<request.Response[]> | undefined;
      await prisma.$transaction(async (tx) => {
        // Kedua klaim sudah lolos pemeriksaan baca dan tertahan di UPDATE bersyarat yang sama.
        await tx.$queryRaw`SELECT id FROM chat_sessions WHERE id = ${s.id}::uuid FOR UPDATE`;
        pending = Promise.all([claim(s, a), claim(s, b)]);
        await waitForLockWaiters(2);
      });
      const results = await pending!;
      expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
      expect(results.find((r) => r.status === 409)!.body.error.code).toBe('CHAT_SESSION_ALREADY_CLAIMED');
      const winner = results.find((r) => r.status === 200)!;
      const row = await prisma.chatSession.findUniqueOrThrow({ where: { id: s.id } });
      expect(row.claimedAt).toEqual(new Date(winner.body.data.claimed_at));
      expect([a.id, b.id]).toContain(row.userId);
    });
  });

  describe('personalization_snapshot (D27, usulan D168 dan D169)', () => {
    it('empat sumber, hanya order berstatus sah, maksimal 3 sub-kategori, rentang dari harga dasar', async () => {
      const subs = {
        ac: servisAcId,
        a: await subcategory(TEST_CATEGORY, 'Uji 9c', 'uji-a', 'Uji A'),
        b: await subcategory(TEST_CATEGORY, 'Uji 9c', 'uji-b', 'Uji B'),
        c: await subcategory(TEST_CATEGORY, 'Uji 9c', 'uji-c', 'Uji C'),
        batal: await subcategory(TEST_CATEGORY, 'Uji 9c', 'uji-batal', 'Uji Batal'),
      };
      const refs = Object.fromEntries(await Promise.all(Object.entries(subs).map(async ([k, id]) => [k, await listing(id, 100_000)]))) as Record<
        keyof typeof subs,
        ListingRef
      >;
      const user = await newUser();
      const other = await newUser();
      const day = (n: number) => new Date(Date.now() - n * 86_400_000);
      // Servis AC 3 kali, A 2 kali, B dan C sekali (C lebih baru dari B), batal hanya status tidak sah.
      // total 330 ribu melewati maks harga dasar 300 ribu: kalau rentang memakai total_amount, test ini gagal.
      await pastOrder(user.id, refs.ac, 'SETTLED', 280_000, 50_000, day(10));
      await pastOrder(user.id, refs.ac, 'COMPLETED', 200_000, 0, day(9));
      await pastOrder(user.id, refs.ac, 'PAID', 180_000, 0, day(8));
      const reviewed = await pastOrder(user.id, refs.a, 'SETTLED', 120_000, 0, day(7));
      await pastOrder(user.id, refs.a, 'SETTLED', 130_000, 0, day(6));
      await pastOrder(user.id, refs.b, 'SETTLED', 90_000, 0, day(5));
      await pastOrder(user.id, refs.c, 'SETTLED', 300_000, 0, day(4));
      for (const status of ['CANCELLED', 'REJECTED', 'EXPIRED', 'PAYMENT_EXPIRED', 'DISPUTED', 'REFUNDED'] as const) {
        await pastOrder(user.id, refs.batal, status, 999_000);
      }
      await pastOrder(user.id, refs.batal, 'PENDING_ACCEPTANCE', 1_000);
      await pastOrder(other.id, refs.batal, 'SETTLED', 5_000);
      await prisma.review.create({
        data: { orderId: reviewed.id, clientId: user.id, providerProfileId: refs.a.providerProfileId, listingId: refs.a.id, rating: 4 },
      });
      const second = await pastOrder(user.id, refs.a, 'SETTLED', 125_000, 0, day(7));
      await prisma.review.create({
        data: { orderId: second.id, clientId: user.id, providerProfileId: refs.a.providerProfileId, listingId: refs.a.id, rating: 5, isVisible: false },
      });
      await prisma.userAddress.create({
        data: { userId: user.id, addressLine: 'Jl. Rahasia 1', city: 'Denpasar', latitude: RENON.lat, longitude: RENON.lng, isDefault: true },
      });

      const id = await userSession(user);
      const snapshot = (await prisma.chatSession.findUniqueOrThrow({ where: { id } })).personalizationSnapshot as unknown as PersonalizationSnapshot;
      expect(snapshot).toEqual({
        versi: 1,
        dihitung_pada: expect.any(String),
        sumber: 'sesi_baru',
        // Jumlah sama (3): yang terakhir dipesan lebih baru di depan. B dan C sama-sama 1: C lebih baru.
        riwayat_sub_kategori: [
          { kunci: `${TEST_CATEGORY}/uji-a`, nama: 'Uji A', jumlah: 3 },
          { kunci: 'perbaikan/servis-ac', nama: 'Servis AC', jumlah: 3 },
          { kunci: `${TEST_CATEGORY}/uji-c`, nama: 'Uji C', jumlah: 1 },
        ],
        kota_alamat_default: 'Denpasar',
        rata_rating_diberikan: 4.5,
        jumlah_ulasan: 2,
        rentang_harga: { min: 90_000, maks: 300_000 },
      });
      expect(JSON.stringify(snapshot)).not.toContain('Rahasia');
      expect(SNAPSHOT_ORDER_STATUSES).toEqual(['PAID', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'COMPLETED', 'SETTLED']);
    });

    it('akun tanpa riwayat: snapshot terisi tetapi kosong, dan prompt tanpa blok riwayat', async () => {
      const user = await newUser();
      const id = await userSession(user);
      const snapshot = (await prisma.chatSession.findUniqueOrThrow({ where: { id } })).personalizationSnapshot;
      expect(snapshot).toMatchObject({ riwayat_sub_kategori: [], kota_alamat_default: null, rata_rating_diberikan: null, jumlah_ulasan: 0, rentang_harga: null });
      const spy = vi.spyOn(llmGateway, 'extractIntent');
      await userSend(user, id, 'halo');
      expect(spy.mock.calls[0]![0].personalization).toEqual({ riwayat_sub_kategori: [] });
    });

    it('snapshot dihitung sekali per sesi: order baru tidak mengubah sesi yang sudah ada', async () => {
      const ref = await listing(servisAcId, 150_000);
      const user = await newUser();
      const id = await userSession(user);
      await pastOrder(user.id, ref, 'SETTLED', 150_000);
      await userSend(user, id, 'halo');
      expect((await prisma.chatSession.findUniqueOrThrow({ where: { id } })).personalizationSnapshot).toMatchObject({ riwayat_sub_kategori: [] });
      const fresh = await userSession(user);
      expect((await prisma.chatSession.findUniqueOrThrow({ where: { id: fresh } })).personalizationSnapshot).toMatchObject({
        riwayat_sub_kategori: [{ kunci: 'perbaikan/servis-ac' }],
      });
    });

    it('H66: tamu tanpa snapshot dan tanpa riwayat; giliran pra-klaim tanpa, pasca-klaim dengan; kunci nonaktif tidak dikirim', async () => {
      const ref = await listing(servisAcId, 150_000);
      const uji = await subcategory(TEST_CATEGORY, 'Uji 9c', 'uji-nonaktif', 'Uji Nonaktif');
      const user = await newUser();
      await pastOrder(user.id, ref, 'SETTLED', 150_000);
      await pastOrder(user.id, ref, 'SETTLED', 150_000);
      await pastOrder(user.id, await listing(uji, 100_000), 'SETTLED', 100_000);
      await prisma.userAddress.create({
        data: { userId: user.id, addressLine: 'Jl. Raya Puputan', latitude: RENON.lat, longitude: RENON.lng, isDefault: true },
      });
      await updateSubcategory(uji, { is_active: false });

      const s = await guestSession();
      const spy = vi.spyOn(llmGateway, 'extractIntent');
      // Pesan tamu tanpa koordinat: alamat default akun tidak dipakai, karena sesi belum diklaim.
      const before = await guestSend(s, 'servis ac');
      expect(before.body.data.assistant_message.content).toBe(REPLY.needLocation('Servis AC', true));
      expect(spy.mock.calls[0]![0].personalization).toBeNull();
      expect((await prisma.chatSession.findUniqueOrThrow({ where: { id: s.id } })).personalizationSnapshot).toBeNull();

      expect((await claim(s, user)).status).toBe(200);
      const after = await userSend(user, s.id, 'mau yang kayak kemarin');
      expect(spy.mock.calls[1]![0].personalization).toEqual({ riwayat_sub_kategori: ['perbaikan/servis-ac'] });
      expect(after.body.data.intent).toBe('cari_jasa');
      expect(after.body.data.recommendations.map((c: { id: string }) => c.id)).toEqual([ref.id]);
    });

    it('rentang harga mengurutkan ulang rekomendasi, bukan menyaring; tamu tetap urutan jarak', async () => {
      const near = await listing(servisAcId, 150_000);
      const far = await listing(servisAcId, 300_000, northOfRenon(2));
      const user = await newUser();
      await pastOrder(user.id, far, 'SETTLED', 280_000);
      await pastOrder(user.id, far, 'SETTLED', 320_000);
      const ids = (res: request.Response) => res.body.data.recommendations.map((c: { id: string }) => c.id);

      const guest = await guestSend(await guestSession(), 'servis ac', at(RENON));
      expect(ids(guest)).toEqual([near.id, far.id]);

      const id = await userSession(user);
      const registered = await userSend(user, id, 'servis ac', at(RENON));
      expect(ids(registered)).toEqual([far.id, near.id]);
      expect(registered.body.data.assistant_message.recommended_listing_ids).toEqual([far.id, near.id]);
    });
  });

  it('D166 lewat API: lokasi tanpa listing, saran mengikuti slot', async () => {
    await listing(servisAcId, 150_000);
    const s = await guestSession();
    const nowhere = at({ lat: -8.2, lng: 114.6 });
    const content = async (message: string) => (await guestSend(s, message, nowhere)).body.data.assistant_message.content as string;
    expect(await content('servis ac budget 100rb')).toMatch(/Coba naikkan budget-nya\.$/);
    expect(await content('servis ac besok')).toMatch(/Coba ganti waktunya\.$/);
    expect(await content('servis ac')).toMatch(/Coba cari di lokasi lain, atau jasa lain yang tersedia: .*Perbaikan/);
  });

  it('retry lewat fake (D165): berhasil pada percobaan kedua, latency_ms memuat jeda', async () => {
    const s = await guestSession();
    const res = await guestSend(s, 'halo #uji-503');
    expect(res.status).toBe(201);
    const row = await prisma.chatMessage.findFirstOrThrow({ where: { sessionId: s.id, role: 'ASSISTANT' } });
    expect(row.latencyMs).toBeGreaterThanOrEqual(1000);
  });

  describe('kueri verifikasi', () => {
    type V3Row = {
      jenis_sesi: string; jenis_intent: string; jumlah_pesan: bigint;
      rata_total_ms: unknown; rata_overhead_ms: unknown; p95_total_ms: unknown; gagal_ekstraksi: bigint;
    };

    it('V3: pesan pra-klaim tetap tamu, per jenis intent, dengan latensi total dan overhead (usulan D171)', async () => {
      const s = await guestSession();
      expect((await guestSend(s, 'halo')).status).toBe(201);
      const user = await newUser();
      expect((await claim(s, user)).status).toBe(200);
      expect((await userSend(user, s.id, 'halo')).status).toBe(201);
      expect((await userSend(user, s.id, 'cari les piano')).status).toBe(201);
      vi.spyOn(llmGateway, 'extractIntent').mockRejectedValueOnce(
        new AppError('GEMINI_UNAVAILABLE', 'x', { context: { llm_reason: 'http', llm_status: 503 } }),
      );
      expect((await userSend(user, s.id, 'halo')).status).toBe(502);

      const rows = (await runVerificationQuery('V3')) as V3Row[];
      const key = (r: V3Row) => `${r.jenis_sesi}:${r.jenis_intent}:${Number(r.jumlah_pesan)}:${Number(r.gagal_ekstraksi)}`;
      expect(rows.map(key).sort()).toEqual(['tamu:sapaan:1:0', 'terdaftar:(gagal):1:1', 'terdaftar:jasa_tidak_tersedia:1:0', 'terdaftar:sapaan:1:0']);
      for (const row of rows) {
        expect(Number(row.rata_total_ms)).toBeGreaterThanOrEqual(0);
        expect(Number(row.p95_total_ms)).toBeGreaterThanOrEqual(0);
        expect(row.rata_overhead_ms).not.toBeNull();
      }
    });

    it('V3: latensi total dan overhead dihitung dari pesan USER sebelumnya', async () => {
      const s = await guestSession();
      expect((await guestSend(s, 'halo')).status).toBe(201);
      const [userMsg, reply] = await prisma.chatMessage.findMany({ where: { sessionId: s.id }, orderBy: { id: 'asc' } });
      await prisma.chatMessage.update({ where: { id: userMsg!.id }, data: { createdAt: new Date('2026-11-16T00:00:00.000Z') } });
      await prisma.chatMessage.update({ where: { id: reply!.id }, data: { createdAt: new Date('2026-11-16T00:00:02.500Z'), latencyMs: 1800 } });
      const [row] = (await runVerificationQuery('V3')) as V3Row[];
      expect(Number(row!.rata_total_ms)).toBe(2500);
      expect(Number(row!.rata_overhead_ms)).toBe(700);
    });

    it('V9: konversi hanya akun yang dibuat setelah sesi dimulai, akun lama terpisah (usulan D172)', async () => {
      const fresh = await guestSession();
      const old = await guestSession();
      await guestSession();
      await userSession(await newUser());
      const newcomer = await newUser();
      const veteran = await newUser();
      await prisma.user.update({ where: { id: veteran.id }, data: { createdAt: new Date(Date.now() - 86_400_000) } });
      expect((await claim(fresh, newcomer)).status).toBe(200);
      expect((await claim(old, veteran)).status).toBe(200);

      const [row] = (await runVerificationQuery('V9')) as Record<string, unknown>[];
      expect({
        total: Number(row!.total_sesi_tamu),
        diklaim: Number(row!.total_diklaim),
        baru: Number(row!.berlanjut_daftar),
        lama: Number(row!.diklaim_akun_lama),
        persen: Number(row!.persen_konversi),
      }).toEqual({ total: 3, diklaim: 2, baru: 1, lama: 1, persen: 33.33 });
    });
  });
});
