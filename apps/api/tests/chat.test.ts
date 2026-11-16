/**
 * Chatbot sesi 9b: sesi tamu dan terdaftar, tiga lapis batas tamu (H19, D154),
 * batas terdaftar (PRD 5.5), lima jenis intent lewat fake (D152), pencatatan
 * pengukuran (V3), kartu tanpa data pribadi (H67), dan cron sesi tamu.
 *
 * Seluruhnya memakai LLM_GATEWAY=fake. Fake memetakan "ac" ke
 * `perbaikan/servis-ac` kalau kunci itu aktif, jadi sub-kategori itu dipastikan ada.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { hashToken } from '../src/lib/crypto';
import { AppError } from '../src/lib/errors';
import { llmGateway } from '../src/lib/llm-gateway';
import { presence } from '../src/realtime/presence';
import { invalidateActiveSubcategories, updateSubcategory } from '../src/modules/catalog/catalog.service';
import { REPLY, witaDayStart } from '../src/modules/chat/chat-message.service';
import { endExpiredGuestSessions } from '../src/modules/chat/chat.service';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import { runVerificationQuery } from './helpers/providers';
import { HOUR, RENON, auth, newProvider, newUser, waitForLockWaiters, type User } from './helpers/orders';

describe('witaDayStart (D154)', () => {
  it('23.59.59 WITA masih hari yang sama, 00.00 WITA hari baru', () => {
    expect(witaDayStart(new Date('2026-11-15T15:59:59.999Z')).toISOString()).toBe('2026-11-14T16:00:00.000Z');
    expect(witaDayStart(new Date('2026-11-15T16:00:00.000Z')).toISOString()).toBe('2026-11-15T16:00:00.000Z');
    expect(witaDayStart(new Date('2026-11-15T00:30:00.000Z')).toISOString()).toBe('2026-11-14T16:00:00.000Z');
  });
});

describe.skipIf(!hasTestDatabase)('chatbot 9b', () => {
  let app: Express;
  let subId: string;

  const setSetting = (key: string, value: number) =>
    prisma.platformSetting.upsert({ where: { key }, create: { key, value }, update: { value } });

  /** Sub-kategori yang dikenal fake. Bisa sudah ada dari seed katalog Lampiran B. */
  async function ensureServisAc(): Promise<string> {
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
    return sub.id;
  }

  /** Usaha Renon radius 5 km dengan listing servis AC 150 ribu, pemiliknya pekerja terpetakan. */
  async function servisAcListing() {
    const { provider, owner } = await newProvider();
    const listing = await prisma.listing.create({
      data: {
        providerProfileId: provider.id, subcategoryId: subId, title: 'Servis AC Renon', price: 150000,
        estimatedDurationMinutes: 60, attributes: {}, status: 'ACTIVE', supportsScheduled: true, supportsAvailableNow: true,
      },
    });
    await prisma.workerListing.create({ data: { workerId: owner.workerId, listingId: listing.id } });
    const ownerRow = await prisma.user.findUniqueOrThrow({ where: { id: owner.id } });
    return { listingId: listing.id, owner, ownerRow, provider };
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

  const at = (p: { lat: number; lng: number }) => ({ latitude: p.lat, longitude: p.lng });

  beforeEach(async () => {
    await resetDatabase();
    subId = await ensureServisAc();
    invalidateActiveSubcategories();
    presence.reset();
    app = createApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sesi dan akses (usulan D162)', () => {
    it('guest_token disimpan sebagai hash SHA-256, token mentah tidak tersimpan', async () => {
      const s = await guestSession();
      expect(s.token).toMatch(/^[0-9a-f]{64}$/);
      const row = await prisma.chatSession.findUniqueOrThrow({ where: { id: s.id } });
      expect(row.guestToken).toBe(hashToken(s.token));
      expect(row.guestToken).not.toBe(s.token);
      expect(row.userId).toBeNull();
      expect(row.personalizationSnapshot).toBeNull();
      // D155: 24 jam bawaan.
      expect(Math.abs(row.expiresAt!.getTime() - (row.startedAt.getTime() + 24 * HOUR))).toBeLessThan(5000);
    });

    it('token salah 404, tanpa header atau format salah 401', async () => {
      const s = await guestSession();
      const wrong = await guestSend({ id: s.id, token: 'a'.repeat(64) }, 'halo');
      expect(wrong.status).toBe(404);
      const none = await request(app).post(`/api/v1/chat/sessions/${s.id}/messages`).send({ content: 'halo' });
      expect(none.status).toBe(401);
      const malformed = await guestSend({ id: s.id, token: 'bukan-hex' }, 'halo');
      expect(malformed.status).toBe(401);
      // JWT rusak tidak diam-diam jatuh ke jalur tamu, walaupun token tamunya benar.
      const badJwt = await guestSend(s, 'halo').set('Authorization', 'Bearer rusak');
      expect(badJwt.status).toBe(401);
      expect(await prisma.chatMessage.count()).toBe(0);
    });

    it('sesi orang lain tidak terbaca: tamu lain, user lain, dan JWT ke sesi tamu 404', async () => {
      const a = await guestSession();
      const b = await guestSession();
      expect((await guestSend(a, 'halo')).status).toBe(201);

      const otherGuest = await request(app).get(`/api/v1/chat/sessions/${a.id}/messages`).set('X-Guest-Token', b.token);
      expect(otherGuest.status).toBe(404);

      const alice = await newUser();
      const bob = await newUser();
      const aliceSession = await userSession(alice);
      const bobReads = await request(app).get(`/api/v1/chat/sessions/${aliceSession}/messages`).set(...auth(bob));
      expect(bobReads.status).toBe(404);
      const jwtOnGuest = await request(app).get(`/api/v1/chat/sessions/${a.id}/messages`).set(...auth(bob));
      expect(jwtOnGuest.status).toBe(404);
      const guestOnUser = await request(app).get(`/api/v1/chat/sessions/${aliceSession}/messages`).set('X-Guest-Token', a.token);
      expect(guestOnUser.status).toBe(404);

      const bobList = await request(app).get('/api/v1/chat/sessions').set(...auth(bob));
      expect(bobList.body.data).toEqual([]);
      const aliceList = await request(app).get('/api/v1/chat/sessions').set(...auth(alice));
      expect(aliceList.body.data.map((x: { id: string }) => x.id)).toEqual([aliceSession]);
    });

    it('sesi tamu kedaluwarsa atau ENDED ditolak 409 untuk semua aksi', async () => {
      const s = await guestSession();
      await prisma.chatSession.update({ where: { id: s.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
      expect((await guestSend(s, 'halo')).body.error.code).toBe('CHAT_SESSION_ENDED');
      const read = await request(app).get(`/api/v1/chat/sessions/${s.id}/messages`).set('X-Guest-Token', s.token);
      expect(read.status).toBe(409);

      const t = await guestSession();
      expect((await request(app).post(`/api/v1/chat/sessions/${t.id}/end`).set('X-Guest-Token', t.token)).status).toBe(200);
      const after = await request(app).get(`/api/v1/chat/sessions/${t.id}/messages`).set('X-Guest-Token', t.token);
      expect(after.status).toBe(409);
      expect(await prisma.chatMessage.count()).toBe(0);
    });

    it('sesi terdaftar ENDED: riwayat terbaca, kirim dan end 409', async () => {
      const user = await newUser();
      const id = await userSession(user);
      expect((await userSend(user, id, 'halo')).status).toBe(201);
      const ended = await request(app).post(`/api/v1/chat/sessions/${id}/end`).set(...auth(user));
      expect(ended.status).toBe(200);
      expect(ended.body.data.status).toBe('ENDED');

      const history = await request(app).get(`/api/v1/chat/sessions/${id}/messages`).set(...auth(user));
      expect(history.status).toBe(200);
      expect(history.body.data.map((m: { role: string }) => m.role)).toEqual(['USER', 'ASSISTANT']);
      expect((await userSend(user, id, 'halo lagi')).body.error.code).toBe('CHAT_SESSION_ENDED');
      expect((await request(app).post(`/api/v1/chat/sessions/${id}/end`).set(...auth(user))).status).toBe(409);
    });
  });

  describe('batas tamu per sesi', () => {
    it('pesan di atas guest_chat_message_limit 429, dan sisa kuota dilaporkan', async () => {
      await setSetting('guest_chat_message_limit', 2);
      const s = await guestSession();
      const first = await guestSend(s, 'halo');
      expect(first.body.data.guest_quota).toEqual({ limit: 2, used: 1, remaining: 1 });
      expect((await guestSend(s, 'halo')).status).toBe(201);
      const third = await guestSend(s, 'halo');
      expect(third.status).toBe(429);
      expect(third.body.error.code).toBe('GUEST_CHAT_LIMIT_REACHED');
      const row = await prisma.chatSession.findUniqueOrThrow({ where: { id: s.id } });
      expect(row.messageCount).toBe(2);
      expect(await prisma.chatMessage.count({ where: { sessionId: s.id, role: 'USER' } })).toBe(2);
    });

    it('dua pesan paralel di batas terakhir: tepat satu lolos', async () => {
      await setSetting('guest_chat_message_limit', 2);
      const s = await guestSession();
      expect((await guestSend(s, 'halo')).status).toBe(201);

      // Baris sesi dikunci, jadi kedua request pasti tertahan di UPDATE pada saat bersamaan.
      let pending!: Promise<request.Response[]>;
      await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM chat_sessions WHERE id = ${s.id}::uuid FOR UPDATE`;
        pending = Promise.all([guestSend(s, 'halo satu'), guestSend(s, 'halo dua')]);
        await waitForLockWaiters(2);
      });
      const statuses = (await pending).map((r) => r.status).sort();
      expect(statuses).toEqual([201, 429]);
      const row = await prisma.chatSession.findUniqueOrThrow({ where: { id: s.id } });
      expect(row.messageCount).toBe(2);
      expect(await prisma.chatMessage.count({ where: { sessionId: s.id, role: 'USER' } })).toBe(2);
    });
  });

  describe('batas tamu per IP', () => {
    it('lintas sesi, pesan ke-(limit+1) 429 RATE_LIMIT_EXCEEDED; pengguna terdaftar tidak terkena', async () => {
      await setSetting('guest_chat_ip_hourly_limit', 3);
      const a = await guestSession();
      const b = await guestSession();
      expect((await guestSend(a, 'halo')).status).toBe(201);
      expect((await guestSend(a, 'halo')).status).toBe(201);
      expect((await guestSend(b, 'halo')).status).toBe(201);
      const blocked = await guestSend(b, 'halo');
      expect(blocked.status).toBe(429);
      expect(blocked.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(await prisma.chatMessage.count({ where: { sessionId: b.id } })).toBe(2);

      const user = await newUser();
      expect((await userSend(user, await userSession(user), 'halo')).status).toBe(201);
    });
  });

  describe('rem global harian tamu', () => {
    it('hanya pesan USER sesi tamu hari ini WITA yang dihitung, lalu 503 tanpa memakan kuota sesi', async () => {
      await setSetting('guest_chat_daily_global_limit', 2);
      const today = witaDayStart(new Date());
      const old = await prisma.chatSession.create({ data: { guestToken: hashToken('lama'), expiresAt: new Date(Date.now() + HOUR) } });
      await prisma.chatMessage.createMany({
        data: [
          // Kemarin WITA, satu milidetik sebelum tengah malam: tidak terhitung.
          { sessionId: old.id, role: 'USER', content: 'kemarin', createdAt: new Date(today.getTime() - 1) },
          // Hari ini: terhitung. ASSISTANT tidak terhitung.
          { sessionId: old.id, role: 'USER', content: 'hari ini', createdAt: today },
          { sessionId: old.id, role: 'ASSISTANT', content: 'balasan', createdAt: today },
        ],
      });
      // Pesan sesi terdaftar hari ini tidak memakan jatah tamu.
      const user = await newUser();
      const registered = await prisma.chatSession.create({ data: { userId: user.id } });
      await prisma.chatMessage.createMany({
        data: [1, 2, 3].map((n) => ({ sessionId: registered.id, role: 'USER' as const, content: `terdaftar ${n}` })),
      });

      const s = await guestSession();
      expect((await guestSend(s, 'halo')).status).toBe(201);
      const braked = await guestSend(s, 'halo');
      expect(braked.status).toBe(503);
      expect(braked.body.error.code).toBe('CHATBOT_TEMPORARILY_UNAVAILABLE');
      const row = await prisma.chatSession.findUniqueOrThrow({ where: { id: s.id } });
      expect(row.messageCount).toBe(1);

      // Pengguna terdaftar tetap bisa memakai chatbot saat rem tamu aktif.
      expect((await userSend(user, registered.id, 'halo')).status).toBe(201);
    });
  });

  describe('batas terdaftar', () => {
    it('30 pesan per jam per akun, ke-31 429', async () => {
      const user = await newUser();
      const id = await userSession(user);
      for (let i = 0; i < 30; i += 1) {
        const res = await userSend(user, id, 'halo');
        expect(res.status, `pesan ke-${i + 1}`).toBe(201);
        expect(res.body.data.guest_quota).toBeNull();
      }
      const blocked = await userSend(user, id, 'halo');
      expect(blocked.status).toBe(429);
      expect(blocked.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      // Akun lain tidak ikut terkena.
      const other = await newUser();
      expect((await userSend(other, await userSession(other), 'halo')).status).toBe(201);
    });
  });

  describe('Gemini gagal (PRD 6.4, usulan D161)', () => {
    it('502, pesan USER tersimpan, message_count naik, balasan gagal tercatat tanpa intent', async () => {
      vi.spyOn(llmGateway, 'extractIntent').mockRejectedValueOnce(
        new AppError('GEMINI_UNAVAILABLE', 'Gemini tidak merespons', { context: { llm_reason: 'timeout' } }),
      );
      const s = await guestSession();
      const res = await guestSend(s, 'servis ac');
      expect(res.status).toBe(502);
      expect(res.body.error.code).toBe('GEMINI_UNAVAILABLE');
      expect(res.body.error.message).toBe(REPLY.failed);

      const session = await prisma.chatSession.findUniqueOrThrow({ where: { id: s.id } });
      expect(session.messageCount).toBe(1);
      expect(session.lastIntent).toBeNull();
      const rows = await prisma.chatMessage.findMany({ where: { sessionId: s.id }, orderBy: { id: 'asc' } });
      expect(rows.map((r) => r.role)).toEqual(['USER', 'ASSISTANT']);
      expect(rows[0]!.content).toBe('servis ac');
      expect(rows[1]!.extractedIntent).toBeNull();
      expect(rows[1]!.latencyMs).not.toBeNull();

      // Giliran berikutnya: balasan gagal tidak dikirim sebagai riwayat.
      const spy = vi.spyOn(llmGateway, 'extractIntent');
      expect((await guestSend(s, 'halo')).status).toBe(201);
      expect(spy.mock.calls[0]![0].history).toEqual([{ role: 'USER', content: 'servis ac' }]);
    });

    it('kunci sub-kategori di luar daftar aktif diperlakukan galat output', async () => {
      vi.spyOn(llmGateway, 'extractIntent').mockResolvedValueOnce({
        intent: {
          jenis: 'cari_jasa', sub_kategori: 'tidak/ada', confidence: 0.9, pertanyaan_klarifikasi: null,
          slot: { lokasi: { teks: null, pakai_lokasi_saat_ini: false }, waktu: { jenis: 'TIDAK_DISEBUT', teks: null }, budget_maks: null, atribut: [] },
        },
        model: 'fake', usage: { inputTokens: 0, outputTokens: 0, thoughtTokens: 0, totalTokens: 0 }, latencyMs: 0, attempts: 1, raw: null,
      });
      const s = await guestSession();
      const res = await guestSend(s, 'servis ac', at(RENON));
      expect(res.status).toBe(502);
      const assistant = await prisma.chatMessage.findMany({ where: { sessionId: s.id, role: 'ASSISTANT' } });
      expect(assistant).toHaveLength(1);
      expect(assistant[0]!.extractedIntent).toBeNull();
      expect(assistant[0]!.recommendedListingIds).toBeNull();
    });
  });

  describe('lima jenis intent lewat fake (D152)', () => {
    it('tamu: sapaan, perlu_klarifikasi, jasa_tidak_tersedia, di_luar_cakupan, cari_jasa tanpa dan dengan lokasi', async () => {
      const { listingId } = await servisAcListing();
      const s = await guestSession();

      const hi = await guestSend(s, 'halo kak');
      expect(hi.body.data.intent).toBe('sapaan');
      expect(hi.body.data.assistant_message.content).toBe(REPLY.greeting);

      const ask = await guestSend(s, 'butuh fotografer');
      expect(ask.body.data.intent).toBe('perlu_klarifikasi');
      expect(ask.body.data.assistant_message.content).toBe('Foto untuk apa: produk, prewedding, atau dokumentasi acara?');

      const missing = await guestSend(s, 'cari les piano anak');
      expect(missing.body.data.intent).toBe('jasa_tidak_tersedia');
      expect(missing.body.data.assistant_message.content).toContain('Perbaikan');

      const off = await guestSend(s, 'cara bikin nasi goreng');
      expect(off.body.data.intent).toBe('di_luar_cakupan');
      expect(off.body.data.assistant_message.content).toBe(REPLY.outOfScope);

      const noLocation = await guestSend(s, 'servis ac besok');
      expect(noLocation.body.data.intent).toBe('cari_jasa');
      expect(noLocation.body.data.recommendations).toEqual([]);
      expect(noLocation.body.data.assistant_message.content).toBe(REPLY.needLocation('Servis AC', true));
      const stored = await prisma.chatMessage.findFirstOrThrow({ where: { sessionId: s.id, role: 'ASSISTANT' }, orderBy: { id: 'desc' } });
      expect((stored.extractedIntent as { jenis: string }).jenis).toBe('cari_jasa');

      const located = await guestSend(s, 'servis ac besok', at(RENON));
      expect(located.status).toBe(201);
      expect(located.body.data.recommendations.map((c: { id: string }) => c.id)).toEqual([listingId]);
      expect(located.body.data.assistant_message.recommended_listing_ids).toEqual([listingId]);
      expect(located.body.data.guest_quota).toEqual({ limit: 20, used: 6, remaining: 14 });

      const session = await prisma.chatSession.findUniqueOrThrow({ where: { id: s.id } });
      expect((session.lastIntent as { jenis: string }).jenis).toBe('cari_jasa');
    });

    it('terdaftar tanpa koordinat memakai alamat default; SEKARANG jadi available_now, budget jadi harga maksimum', async () => {
      const { owner } = await servisAcListing();
      const user = await newUser();
      const id = await userSession(user);

      const withoutAddress = await userSend(user, id, 'servis ac');
      expect(withoutAddress.body.data.assistant_message.content).toBe(REPLY.needLocation('Servis AC', false));

      await prisma.userAddress.create({
        data: { userId: user.id, addressLine: 'Jl. Raya Puputan', latitude: RENON.lat, longitude: RENON.lng, isDefault: true },
      });
      expect((await userSend(user, id, 'servis ac')).body.data.recommendations).toHaveLength(1);

      // Tidak ada pekerja online: available_now kosong.
      const now = await userSend(user, id, 'servis ac sekarang');
      expect(now.body.data.recommendations).toEqual([]);
      expect(now.body.data.assistant_message.content).toBe('Belum ada Servis AC yang bisa melayani lokasimu saat ini. Coba ganti waktunya.');
      presence.connect(owner.workerId);
      expect((await userSend(user, id, 'servis ac sekarang')).body.data.recommendations).toHaveLength(1);

      // Listing 150 ribu.
      expect((await userSend(user, id, 'servis ac budget 100rb')).body.data.recommendations).toEqual([]);
      expect((await userSend(user, id, 'servis ac budget 200rb')).body.data.recommendations).toHaveLength(1);
    });
  });

  it('H67: kartu rekomendasi tidak memuat data pribadi penyedia', async () => {
    const { ownerRow, provider } = await servisAcListing();
    const s = await guestSession();
    const res = await guestSend(s, 'servis ac', at(RENON));
    expect(res.body.data.recommendations).toHaveLength(1);
    const json = JSON.stringify(res.body);
    for (const secret of [ownerRow.phone, ownerRow.email, ownerRow.id, ownerRow.fullName]) expect(json).not.toContain(secret);
    const card = res.body.data.recommendations[0];
    expect(Object.keys(card.provider).sort()).toEqual(['business_name', 'id', 'rating_average', 'rating_count']);
    expect(card.provider.id).toBe(provider.id);
    for (const key of ['phone', 'email', 'address', 'user_id', 'base_latitude', 'base_longitude']) {
      expect(json).not.toContain(`"${key}"`);
    }
  });

  it('pesan ASSISTANT mencatat seluruh kolom pengukuran, dan V3 berbaris untuk tamu dan terdaftar', async () => {
    await servisAcListing();
    const s = await guestSession();
    expect((await guestSend(s, 'servis ac', at(RENON))).status).toBe(201);
    const user = await newUser();
    expect((await userSend(user, await userSession(user), 'halo')).status).toBe(201);

    const rows = await prisma.chatMessage.findMany({ where: { role: 'ASSISTANT' } });
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.extractedIntent).not.toBeNull();
      expect(row.intentConfidence?.toNumber()).toBeGreaterThan(0);
      expect(row.recommendedListingIds).not.toBeNull();
      expect(row.geminiModel).toBe('fake');
      expect(row.tokenUsage).toEqual({ inputTokens: 0, outputTokens: 0, thoughtTokens: 0, totalTokens: 0 });
      // Usulan D167: latensi fake ikut diukur (beberapa ms), tanpa retry jauh di bawah jeda 1 detik.
      expect(row.latencyMs).toBeGreaterThanOrEqual(0);
      expect(row.latencyMs).toBeLessThan(1000);
    }

    const v3 = (await runVerificationQuery('V3')) as { jenis_sesi: string; jumlah_pesan: bigint; gagal_ekstraksi: bigint }[];
    expect(v3.map((r) => r.jenis_sesi).sort()).toEqual(['tamu', 'terdaftar']);
    expect(v3.every((r) => Number(r.jumlah_pesan) === 1 && Number(r.gagal_ekstraksi) === 0)).toBe(true);
  });

  it('cache sub-kategori di-invalidasi saat admin menonaktifkan sub-kategori', async () => {
    const s = await guestSession();
    expect((await guestSend(s, 'servis ac')).body.data.intent).toBe('cari_jasa');
    await updateSubcategory(subId, { is_active: false });
    const spy = vi.spyOn(llmGateway, 'extractIntent');
    const after = await guestSend(s, 'servis ac');
    expect(spy.mock.calls[0]![0].subcategories.some((x) => x.key === 'perbaikan/servis-ac')).toBe(false);
    expect(after.body.data.intent).toBe('jasa_tidak_tersedia');
  });

  it('cron: sesi tamu kedaluwarsa jadi ENDED tanpa menghapus pesan, sesi lain tidak tersentuh', async () => {
    const expired = await guestSession();
    const fresh = await guestSession();
    expect((await guestSend(expired, 'halo')).status).toBe(201);
    await prisma.chatSession.update({ where: { id: expired.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const user = await newUser();
    const registered = await userSession(user);

    expect(await endExpiredGuestSessions()).toBe(1);
    const rows = await prisma.chatSession.findMany();
    const byId = new Map(rows.map((r) => [r.id, r]));
    expect(byId.get(expired.id)!.status).toBe('ENDED');
    expect(byId.get(expired.id)!.endedAt).not.toBeNull();
    expect(byId.get(fresh.id)!.status).toBe('ACTIVE');
    expect(byId.get(registered)!.status).toBe('ACTIVE');
    expect(await prisma.chatMessage.count({ where: { sessionId: expired.id } })).toBe(2);
  });
});
