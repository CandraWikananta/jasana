/**
 * Sesi 10c: GET dan PATCH /admin/settings (D181, usulan D198 dan D199).
 *
 *   registri     25 kunci terdaftar, empat kunci PRD yang tidak dibaca server tidak ada
 *   rentang      min dan maks diterima, min-1, maks+1, desimal, dan string ditolak 422
 *   antarkunci   withdrawal_admin_fee < withdrawal_min_amount dinilai SESUDAH perubahan
 *   data         listing_faq_max_items di bawah FAQ aktif terbanyak 409 (V12)
 *   atomik       satu kunci gagal, tidak ada yang tertulis
 *   H119         dua PATCH serentak yang masing-masing sah diserialkan advisory lock
 *   tanpa cache  nilai baru langsung dipakai permintaan berikutnya
 */

import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma, Prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { getNumberSetting, SETTING_KEYS, SETTING_REGISTRY } from '../src/modules/settings/settings.service';
import { orderAmounts } from '../src/modules/orders/order-pricing';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import { auth, newUser, newWorld, paidScheduledOrder, waitForLockWaiters, type User } from './helpers/orders';
import { runVerificationQuery } from './helpers/providers';

const EXCLUDED = ['access_token_ttl_minutes', 'refresh_token_ttl_days', 'worker_location_move_threshold_meters', 'worker_location_max_interval_minutes'];

describe.skipIf(!hasTestDatabase)('parameter sistem (10c)', () => {
  let app: Express;
  let admin: User;

  const get = (as: User = admin) => request(app).get('/api/v1/admin/settings').set(...auth(as));
  const patch = (body: unknown, as: User = admin) => request(app).patch('/api/v1/admin/settings').set(...auth(as)).send(body as object);
  const stored = async () =>
    Object.fromEntries((await prisma.platformSetting.findMany()).map((row) => [row.key, row.value]));

  beforeEach(async () => {
    await resetDatabase();
    app = createApp();
    admin = await newUser({ admin: true });
  });

  describe('GET /admin/settings', () => {
    it('25 kunci terdaftar berurutan dengan nilai bawaan; tanpa kunci yang tidak dibaca server', async () => {
      const res = await get();
      expect(res.status).toBe(200);
      expect(res.body.data.map((s: { key: string }) => s.key)).toEqual(SETTING_KEYS);
      expect(SETTING_KEYS).toHaveLength(25);
      for (const key of EXCLUDED) expect(SETTING_KEYS).not.toContain(key);
      expect(res.body.data[0]).toEqual({
        key: 'platform_fee_percentage',
        value: 10,
        default_value: 10,
        min: 0,
        max: 30,
        description: SETTING_REGISTRY.platform_fee_percentage.description,
        source: 'DEFAULT',
        updated_by: null,
        updated_at: null,
      });
    });

    it('tabel rentang final usulan D198: bawaan, min, maks per kunci', () => {
      const table = Object.fromEntries(SETTING_KEYS.map((key) => [key, [SETTING_REGISTRY[key].default, SETTING_REGISTRY[key].min, SETTING_REGISTRY[key].max]]));
      expect(table).toEqual({
        platform_fee_percentage: [10, 0, 30],
        geolocation_radius_meters: [100, 10, 1000],
        available_now_response_minutes: [5, 1, 60],
        scheduled_approval_hours: [24, 1, 72],
        settlement_holding_hours: [24, 1, 168],
        payment_window_minutes: [10, 5, 120],
        verification_max_attempts: [5, 3, 10],
        verification_lockout_minutes: [15, 1, 1440],
        available_now_offer_limit: [5, 1, 20],
        worker_presence_timeout_minutes: [10, 1, 60],
        schedule_conflict_buffer_minutes: [30, 0, 240],
        email_retry_max_attempts: [3, 0, 10],
        guest_chat_message_limit: [20, 1, 200],
        guest_chat_ip_hourly_limit: [50, 1, 1000],
        guest_chat_daily_global_limit: [250, 1, 500],
        guest_chat_session_hours: [24, 1, 168],
        listing_faq_max_items: [10, 1, 30],
        order_message_max_length: [2000, 100, 2000],
        order_message_rate_per_minute: [20, 1, 120],
        review_window_days: [14, 1, 90],
        kyc_document_max_size_mb: [5, 1, 10],
        dispute_evidence_max_size_mb: [5, 1, 10],
        orphan_upload_cleanup_hours: [24, 3, 168],
        withdrawal_min_amount: [50000, 10000, 10000000],
        withdrawal_admin_fee: [6500, 0, 50000],
      });
    });

    it('baris tidak sah tampil sebagai DEFAULT, kunci tak terdaftar di basis data diabaikan', async () => {
      await prisma.platformSetting.createMany({
        data: [
          { key: 'kyc_document_max_size_mb', value: 0 },
          { key: 'review_window_days', value: 21 },
          { key: 'access_token_ttl_minutes', value: 60 },
        ],
      });
      const data = (await get()).body.data as { key: string; value: number; source: string }[];
      expect(data.find((s) => s.key === 'kyc_document_max_size_mb')).toMatchObject({ value: 5, source: 'DEFAULT' });
      expect(data.find((s) => s.key === 'review_window_days')).toMatchObject({ value: 21, source: 'DATABASE' });
      expect(data.some((s) => s.key === 'access_token_ttl_minutes')).toBe(false);
    });

    it('non-admin 403, tanpa token 401', async () => {
      expect((await get(await newUser())).status).toBe(403);
      expect((await request(app).get('/api/v1/admin/settings')).status).toBe(401);
      expect((await patch({ review_window_days: 20 }, await newUser())).status).toBe(403);
    });
  });

  describe('PATCH /admin/settings', () => {
    it.each(SETTING_KEYS)('%s: min dan maks diterima; min-1, maks+1, desimal ditolak 422', async (key) => {
      const { min, max } = SETTING_REGISTRY[key];
      // Kunci yang berpasangan dibuka dulu supaya relasi antarkunci tidak ikut menolak.
      const partner = key === 'withdrawal_min_amount' ? { withdrawal_admin_fee: 0 } : key === 'withdrawal_admin_fee' ? { withdrawal_min_amount: 10000000 } : {};
      for (const value of [min, max]) {
        const res = await patch({ ...partner, [key]: value });
        expect(res.status, `${key}=${value} ${JSON.stringify(res.body)}`).toBe(200);
        expect(await getNumberSetting(key)).toBe(value);
      }
      for (const value of [min - 1, max + 1, min + 0.5]) {
        const res = await patch({ [key]: value });
        expect(res.status, `${key}=${value}`).toBe(422);
        expect(res.body.error.details[0].path).toBe(key);
      }
    });

    it('kunci yang dikecualikan, kunci karangan, body kosong, string angka, dan null ditolak 422', async () => {
      for (const body of [
        ...EXCLUDED.map((key) => ({ [key]: 10 })),
        { kunci_karangan: 1 },
        { review_window_days: 20, kunci_karangan: 1 },
        {},
        { review_window_days: '10' },
        { review_window_days: null },
        [],
      ]) {
        expect((await patch(body)).status, JSON.stringify(body)).toBe(422);
      }
      expect(await stored()).toEqual({});
    });

    it('fee sama dengan minimum 422; dinaikkan bersamaan diterima; atomik bila satu kunci gagal', async () => {
      const fee = await patch({ withdrawal_admin_fee: 50000 });
      expect(fee.status).toBe(422);
      expect(fee.body.error.details[0].path).toBe('withdrawal_admin_fee');
      const min = await patch({ withdrawal_min_amount: 10000, withdrawal_admin_fee: 10000 });
      expect(min.status).toBe(422);

      // Satu per satu gagal (fee 60000 > minimum 50000), bersamaan sah.
      expect((await patch({ withdrawal_admin_fee: 40000, withdrawal_min_amount: 100000 })).status).toBe(200);
      expect(await getNumberSetting('withdrawal_admin_fee')).toBe(40000);
      expect(await getNumberSetting('withdrawal_min_amount')).toBe(100000);

      // Menurunkan minimum sendirian di bawah fee yang tersimpan ditolak, path kunci yang diubah.
      const lower = await patch({ withdrawal_min_amount: 40000 });
      expect(lower.status).toBe(422);
      expect(lower.body.error.details[0].path).toBe('withdrawal_min_amount');

      // Kunci sah plus relasi gagal di service: tidak ada yang tertulis.
      const before = await stored();
      expect((await patch({ review_window_days: 30, withdrawal_min_amount: 30000 })).status).toBe(422);
      expect(await stored()).toEqual(before);
    });

    it('listing_faq_max_items di bawah FAQ aktif terbanyak 409 SETTING_CONFLICTS_WITH_DATA', async () => {
      const w = await newWorld();
      await prisma.listingFaq.createMany({
        data: [1, 2, 3, 4, 5].map((n) => ({ listingId: w.listingId, question: `Tanya ${n}`, answer: 'Jawab', isActive: n <= 4 })),
      });
      const res = await patch({ listing_faq_max_items: 3, review_window_days: 30 });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('SETTING_CONFLICTS_WITH_DATA');
      expect(await stored()).toEqual({});
      expect((await patch({ listing_faq_max_items: 4 })).status).toBe(200);
      expect(await runVerificationQuery('V12')).toEqual([]);
    });

    it('mencatat updated_by dan updated_at, respons sama dengan GET', async () => {
      const res = await patch({ geolocation_radius_meters: 150 });
      expect(res.status).toBe(200);
      const row = res.body.data.find((s: { key: string }) => s.key === 'geolocation_radius_meters');
      expect(row).toMatchObject({ value: 150, source: 'DATABASE', updated_by: { id: admin.id } });
      expect(Date.parse(row.updated_at)).toBeGreaterThan(Date.now() - 60_000);
      const db = await prisma.platformSetting.findUniqueOrThrow({ where: { key: 'geolocation_radius_meters' } });
      expect(db).toMatchObject({ value: 150, updatedBy: admin.id, description: SETTING_REGISTRY.geolocation_radius_meters.description });
      expect((await get()).body.data).toEqual(res.body.data);

      // Baris yang sudah ada: updated_by berpindah ke admin yang mengubah terakhir.
      const other = await newUser({ admin: true });
      expect((await patch({ geolocation_radius_meters: 200 }, other)).status).toBe(200);
      expect(await prisma.platformSetting.findUniqueOrThrow({ where: { key: 'geolocation_radius_meters' } })).toMatchObject({ value: 200, updatedBy: other.id });
    });

    it('langsung berlaku tanpa restart: pesan 101 karakter ditolak setelah batas jadi 100', async () => {
      const w = await newWorld();
      const { id } = await paidScheduledOrder(app, w);
      const send = () => request(app).post(`/api/v1/orders/${id}/messages`).set(...auth(w.client)).send({ content: 'x'.repeat(101) });
      expect((await send()).status).toBe(201);
      expect((await patch({ order_message_max_length: 100 })).status).toBe(200);
      expect((await send()).status).toBe(422);
    });

    it('platform_fee_percentage 0 berlaku: tanpa komisi', async () => {
      expect((await patch({ platform_fee_percentage: 0 })).status).toBe(200);
      const fee = await getNumberSetting('platform_fee_percentage');
      expect(fee).toBe(0);
      const amounts = orderAmounts(new Prisma.Decimal(500000), new Prisma.Decimal(0), fee);
      expect([amounts.platformFee.toNumber(), amounts.providerEarning.toNumber()]).toEqual([0, 500000]);
    });

    it('H119: dua PATCH serentak yang masing-masing sah tetapi bersama melanggar fee < minimum, satu ditolak 422', async () => {
      expect((await patch({ withdrawal_min_amount: 50000, withdrawal_admin_fee: 6500 })).status).toBe(200);
      const run = <T>(p: PromiseLike<T>) => Promise.resolve(p).then((x) => x);

      // Kunci baris kedua parameter dipegang test, sehingga kedua PATCH sudah MEMBACA nilai
      // sebelum ada yang menulis. Tanpa advisory lock keduanya lolos dan hasilnya fee >= minimum.
      let lower!: Promise<request.Response>;
      let raise!: Promise<request.Response>;
      await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT key FROM platform_settings WHERE key IN ('withdrawal_min_amount', 'withdrawal_admin_fee') FOR UPDATE`;
        lower = run(patch({ withdrawal_min_amount: 20000 }));
        raise = run(patch({ withdrawal_admin_fee: 30000 }));
        await waitForLockWaiters(2);
      });
      const statuses = [(await lower).status, (await raise).status].sort();
      expect(statuses).toEqual([200, 422]);
      const fee = await getNumberSetting('withdrawal_admin_fee');
      const min = await getNumberSetting('withdrawal_min_amount');
      expect(fee).toBeLessThan(min);
    });
  });
});

