/**
 * Sesi 8b: pengajuan withdrawal, reject, dan approve beserta payout.
 *
 *   H83         nominal fee dan net dihitung server dari platform_settings
 *   aturan 5    saldo didebit saat diajukan lewat UPDATE bersyarat, dua pengajuan paralel
 *   D134        reject dan payout yang ditolak menulis tepat satu WITHDRAWAL_REVERSAL
 *   usulan D138 timeout tetap APPROVED lalu dicoba ulang dengan key yang sama, 4xx FAILED
 *   usulan D139 409 diperlakukan sementara, bukan FAILED
 *   H106        sync status payout lewat applyPayoutEvent yang sama dengan webhook (8c)
 *   V1          ledger dan cache saldo tetap rekonsiliasi setelah tiap test
 *
 * Saldo awal dibuat lewat kode produksi (`fundWallet`): order selesai lalu T18.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { AppError } from '../src/lib/errors';
import { paymentGateway } from '../src/lib/payment-gateway';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import { auth, fundWallet, newUser, newWorld, waitForLockWaiters, type User, type World } from './helpers/orders';
import { runVerificationQuery } from './helpers/providers';

describe.skipIf(!hasTestDatabase)('withdrawal (8b)', () => {
  let app: Express;
  let w: World;
  let admin: User;
  let earning: number;

  const account = { bank_code: 'ID_BCA', bank_account_number: '1234567890', bank_account_name: 'Nyoman Uji' };
  const submit = (amount: number, extra: Record<string, unknown> = {}, as: User = w.owner) =>
    request(app).post('/api/v1/providers/me/withdrawals').set(...auth(as)).send({ amount, ...account, ...extra });
  const approve = (id: string) => request(app).post(`/api/v1/admin/withdrawals/${id}/approve`).set(...auth(admin));
  const reject = (id: string, reason?: string) =>
    request(app).post(`/api/v1/admin/withdrawals/${id}/reject`).set(...auth(admin)).send(reason === undefined ? {} : { rejection_reason: reason });
  const created = async (amount = 100000) => {
    const res = await submit(amount);
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body.data.id as string;
  };

  const available = async () => (await prisma.wallet.findUniqueOrThrow({ where: { providerProfileId: w.provider.id } })).balanceAvailable.toNumber();
  const ledgerOf = (withdrawalId: string) => prisma.walletTransaction.findMany({ where: { withdrawalId }, orderBy: { id: 'asc' } });
  const withdrawalOf = (id: string) => prisma.withdrawal.findUniqueOrThrow({ where: { id } });
  const setting = (key: string, value: number) => prisma.platformSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
  const gatewayError = (context: Record<string, unknown>) =>
    new AppError('PAYMENT_GATEWAY_ERROR', 'Gateway pembayaran gagal (uji)', { context: { gateway_operation: 'payout', ...context } });

  beforeEach(async () => {
    await resetDatabase();
    app = createApp();
    w = await newWorld();
    admin = await newUser({ admin: true });
    earning = await fundWallet(app, w);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    expect(await runVerificationQuery('V1')).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // Pengajuan
  // -------------------------------------------------------------------------

  it('saldo awal dari T18 lewat kode produksi', async () => {
    expect(earning).toBeGreaterThan(300000);
    expect(await available()).toBe(earning);
  });

  it('H83: admin fee dari settings, field fee di body diabaikan, saldo didebit amount penuh', async () => {
    await setting('withdrawal_admin_fee', 5000);
    const res = await submit(100000, { admin_fee: 0, net_amount: 100000, total_amount: 1 });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.data).toMatchObject({ amount: 100000, admin_fee: 5000, net_amount: 95000, status: 'REQUESTED', bank_code: 'ID_BCA' });

    const row = await withdrawalOf(res.body.data.id);
    expect(row.adminFee.toNumber()).toBe(5000);
    expect(row.netAmount.toNumber()).toBe(95000);
    expect(await available()).toBe(earning - 100000);
    const rows = await ledgerOf(row.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ type: 'WITHDRAWAL', createdBy: 'SYSTEM' });
    expect(rows[0]!.amountAvailableDelta.toNumber()).toBe(-100000);
    expect(rows[0]!.amountPendingDelta.toNumber()).toBe(0);
    expect(rows[0]!.balanceAvailableAfter.toNumber()).toBe(earning - 100000);
  });

  it('tanpa baris settings dipakai default PRD: minimum 50.000, fee 6.500', async () => {
    const res = await submit(50000);
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.data).toMatchObject({ admin_fee: 6500, net_amount: 43500 });
  });

  it('di bawah minimum atau habis dimakan fee: 422 WITHDRAWAL_BELOW_MINIMUM tanpa jejak', async () => {
    const below = await submit(49999);
    expect(below.status).toBe(422);
    expect(below.body.error.code).toBe('WITHDRAWAL_BELOW_MINIMUM');

    await setting('withdrawal_min_amount', 120000);
    expect((await submit(100000)).body.error.code).toBe('WITHDRAWAL_BELOW_MINIMUM');

    // Minimum salah setel di bawah fee: net tidak boleh nol atau negatif.
    await setting('withdrawal_min_amount', 1000);
    await setting('withdrawal_admin_fee', 70000);
    expect((await submit(70000)).body.error.code).toBe('WITHDRAWAL_BELOW_MINIMUM');

    expect(await prisma.withdrawal.count()).toBe(0);
    expect(await available()).toBe(earning);
  });

  it('saldo kurang: 422 INSUFFICIENT_BALANCE tanpa jejak', async () => {
    const res = await submit(earning + 1);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INSUFFICIENT_BALANCE');
    expect(await prisma.withdrawal.count()).toBe(0);
    expect(await available()).toBe(earning);
  });

  it.each([
    ['bank tidak dikenal', { bank_code: 'BCA' }],
    ['rekening berisi huruf', { bank_account_number: '12-34' }],
    ['nama kosong', { bank_account_name: '  ' }],
    ['amount pecahan', { amount: 100000.5 }],
  ])('body tidak sah (%s): 422', async (_label, extra) => {
    expect((await submit(100000, extra)).status).toBe(422);
  });

  it('aturan 5: dua pengajuan paralel melebihi saldo, tepat satu berhasil, saldo tidak negatif', async () => {
    const amount = 300000;
    let both!: Promise<[request.Response, request.Response]>;
    await prisma.$transaction(
      async (tx) => {
        // Kedua pengajuan tertahan di UPDATE wallet, lalu dilepas bersamaan.
        await tx.$queryRaw`SELECT id FROM wallets WHERE provider_profile_id = ${w.provider.id}::uuid FOR UPDATE`;
        both = Promise.all([submit(amount), submit(amount)]);
        await waitForLockWaiters(2);
      },
      { timeout: 15_000 },
    );
    const results = await both;

    expect(results.map((r) => r.status).sort()).toEqual([201, 422]);
    expect(results.find((r) => r.status === 422)!.body.error.code).toBe('INSUFFICIENT_BALANCE');
    expect(await available()).toBe(earning - amount);
    expect(await prisma.withdrawal.count()).toBe(1);
    expect(await prisma.walletTransaction.count({ where: { type: 'WITHDRAWAL' } })).toBe(1);
  });

  it('riwayat milik sendiri terpaginasi terbaru dulu, antrean admin terlama dulu dengan filter status', async () => {
    const first = await created(100000);
    const second = await created(60000);
    expect((await reject(first, 'Nama rekening tidak sesuai')).status).toBe(200);

    const mine = await request(app).get('/api/v1/providers/me/withdrawals?limit=1').set(...auth(w.owner));
    expect(mine.status).toBe(200);
    expect(mine.body.meta).toEqual({ page: 1, limit: 1, total: 2 });
    expect(mine.body.data.map((x: { id: string }) => x.id)).toEqual([second]);

    const queue = await request(app).get('/api/v1/admin/withdrawals?status=REQUESTED').set(...auth(admin));
    expect(queue.status).toBe(200);
    expect(queue.body.meta.total).toBe(1);
    expect(queue.body.data[0]).toMatchObject({ id: second, status: 'REQUESTED', provider: { id: w.provider.id, business_name: w.provider.businessName } });
    const all = await request(app).get('/api/v1/admin/withdrawals').set(...auth(admin));
    expect(all.body.data.map((x: { id: string }) => x.id)).toEqual([first, second]);
    expect((await request(app).get('/api/v1/admin/withdrawals?status=SELESAI').set(...auth(admin))).status).toBe(422);
  });

  it('akses: hanya pemilik usaha di rute provider, hanya admin di rute admin', async () => {
    for (const user of [w.client, w.w2]) {
      expect((await submit(100000, {}, user)).status).toBe(403);
      expect((await request(app).get('/api/v1/providers/me/withdrawals').set(...auth(user))).status).toBe(403);
    }
    const id = await created();
    expect((await request(app).get('/api/v1/admin/withdrawals').set(...auth(w.owner))).status).toBe(403);
    expect((await request(app).post(`/api/v1/admin/withdrawals/${id}/approve`).set(...auth(w.owner))).status).toBe(403);
    expect((await request(app).post(`/api/v1/admin/withdrawals/${id}/reject`).set(...auth(w.owner)).send({ rejection_reason: 'coba coba' })).status).toBe(403);
    expect((await request(app).post('/api/v1/providers/me/withdrawals').send({ amount: 100000, ...account })).status).toBe(401);
  });

  // -------------------------------------------------------------------------
  // Reject
  // -------------------------------------------------------------------------

  it('D134: reject menulis tepat satu reversal amount penuh dan memberi tahu pemilik beserta alasannya', async () => {
    const id = await created(100000);
    const res = await reject(id, 'Nama rekening tidak sesuai');
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'REJECTED', rejection_reason: 'Nama rekening tidak sesuai' });
    expect(res.body.data.reviewed_at).toEqual(expect.any(String));
    expect((await withdrawalOf(id)).reviewedBy).toBe(admin.id);

    expect(await available()).toBe(earning);
    const rows = await ledgerOf(id);
    expect(rows.map((r) => r.type)).toEqual(['WITHDRAWAL', 'WITHDRAWAL_REVERSAL']);
    expect(rows[1]!.amountAvailableDelta.toNumber()).toBe(100000);
    expect(rows[1]!.createdBy).toBe('ADMIN');

    const notes = await prisma.notification.findMany({ where: { referenceId: id } });
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ userId: w.owner.id, type: 'WITHDRAWAL', referenceType: 'withdrawal' });
    expect(notes[0]!.body).toContain('Nama rekening tidak sesuai');
    expect(notes[0]!.body).toContain('sudah dikembalikan');

    // Hanya dari REQUESTED.
    expect((await reject(id, 'Ditolak lagi')).body.error.code).toBe('WITHDRAWAL_STATE_CONFLICT');
    expect((await approve(id)).status).toBe(409);
    expect(await ledgerOf(id)).toHaveLength(2);
  });

  it('reject tanpa alasan 422, id tidak dikenal 404', async () => {
    const id = await created();
    expect((await reject(id)).status).toBe(422);
    expect((await reject(id, 'abc')).status).toBe(422);
    expect((await reject('00000000-0000-4000-8000-000000000000', 'Tidak ada barisnya')).status).toBe(404);
    expect((await approve('00000000-0000-4000-8000-000000000000')).status).toBe(404);
    expect((await withdrawalOf(id)).status).toBe('REQUESTED');
  });

  // -------------------------------------------------------------------------
  // Approve dan payout (usulan D138, D139)
  // -------------------------------------------------------------------------

  it('approve: payout net_amount dengan key id withdrawal setelah commit, lalu DISBURSING', async () => {
    const id = await created(100000);
    const payout = vi.spyOn(paymentGateway, 'payout').mockImplementation(async (input) => {
      // Setelah commit: APPROVED sudah terlihat dari koneksi lain.
      expect((await withdrawalOf(id)).status).toBe('APPROVED');
      return { payoutId: `disb-${input.withdrawalId}`, status: 'ACCEPTED', raw: {} };
    });

    const res = await approve(id);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'DISBURSING', xendit_payout_id: `disb-${id}`, xendit_payout_status: 'ACCEPTED', failure_code: null });
    expect(payout).toHaveBeenCalledWith({
      withdrawalId: id,
      channelCode: 'ID_BCA',
      accountNumber: '1234567890',
      accountHolderName: 'Nyoman Uji',
      amount: 93500,
      description: `Pencairan Jasana ${id}`,
    });
    expect((await withdrawalOf(id)).reviewedBy).toBe(admin.id);
    expect(await available()).toBe(earning - 100000);
    expect(await ledgerOf(id)).toHaveLength(1);

    expect((await approve(id)).body.error.code).toBe('WITHDRAWAL_STATE_CONFLICT');
    expect(payout).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['timeout', { gateway_timeout: true }, 'GATEWAY_TIMEOUT'],
    ['galat jaringan', { gateway_timeout: false }, 'GATEWAY_UNREACHABLE'],
    ['5xx', { gateway_status: 503, gateway_error_code: null }, 'HTTP_503'],
    ['409 key sudah dipakai (usulan D139)', { gateway_status: 409, gateway_error_code: 'DUPLICATE_ERROR' }, 'DUPLICATE_ERROR'],
  ])('D138 b: %s tetap APPROVED dengan failure_code, 502, lalu dicoba ulang dengan key yang sama', async (_label, context, code) => {
    const id = await created(100000);
    const payout = vi
      .spyOn(paymentGateway, 'payout')
      .mockRejectedValueOnce(gatewayError(context))
      .mockImplementationOnce(async (input) => ({ payoutId: `disb-${input.withdrawalId}`, status: 'ACCEPTED', raw: {} }));

    const failed = await approve(id);
    expect(failed.status).toBe(502);
    expect(failed.body.error.code).toBe('PAYMENT_GATEWAY_ERROR');
    expect(await withdrawalOf(id)).toMatchObject({ status: 'APPROVED', failureCode: code, xenditPayoutId: null });
    // Uang mungkin sudah keluar: tidak ada reversal.
    expect(await ledgerOf(id)).toHaveLength(1);
    expect(await available()).toBe(earning - 100000);

    const retried = await approve(id);
    expect(retried.status, JSON.stringify(retried.body)).toBe(200);
    expect(retried.body.data).toMatchObject({ status: 'DISBURSING', failure_code: null, xendit_payout_id: `disb-${id}` });
    expect(payout).toHaveBeenCalledTimes(2);
    // D134: payload identik, jadi Xendit mengembalikan payout yang sama.
    expect(payout.mock.calls[1]).toEqual(payout.mock.calls[0]);
    expect(payout.mock.calls[0]![0].withdrawalId).toBe(id);
  });

  it('D138 c: ditolak 4xx menjadi FAILED dengan tepat satu reversal, dibalas 200', async () => {
    const id = await created(100000);
    vi.spyOn(paymentGateway, 'payout').mockRejectedValueOnce(gatewayError({ gateway_status: 400, gateway_error_code: 'API_VALIDATION_ERROR' }));

    const res = await approve(id);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'FAILED', failure_code: 'API_VALIDATION_ERROR', xendit_payout_id: null });
    expect(await available()).toBe(earning);
    expect((await ledgerOf(id)).map((r) => r.type)).toEqual(['WITHDRAWAL', 'WITHDRAWAL_REVERSAL']);
    expect(await prisma.notification.count({ where: { referenceId: id, type: 'WITHDRAWAL' } })).toBe(1);

    expect((await approve(id)).status).toBe(409);
  });

  it('webhook FAILED mendahului respons 4xx: tetap satu reversal, approve tidak 500', async () => {
    const id = await created(100000);
    vi.spyOn(paymentGateway, 'payout').mockImplementationOnce(async (input) => {
      const hook = await request(app)
        .post('/api/v1/webhooks/xendit/payout')
        .set('x-callback-token', env.XENDIT_CALLBACK_TOKEN)
        .send({ event: 'payout.failed', data: { id: `disb-${input.withdrawalId}`, reference_id: input.withdrawalId, status: 'FAILED', failure_code: 'INVALID_DESTINATION' } });
      expect(hook.status).toBe(200);
      throw gatewayError({ gateway_status: 400, gateway_error_code: 'API_VALIDATION_ERROR' });
    });

    const res = await approve(id);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    // Hasil webhook yang berlaku, penolakan API tidak menimpanya.
    expect(res.body.data).toMatchObject({ status: 'FAILED', failure_code: 'INVALID_DESTINATION' });
    expect(await available()).toBe(earning);
    expect((await ledgerOf(id)).map((r) => r.type)).toEqual(['WITHDRAWAL', 'WITHDRAWAL_REVERSAL']);
  });

  // -------------------------------------------------------------------------
  // Sync (H106, sesi 8c)
  // -------------------------------------------------------------------------

  describe('POST /admin/withdrawals/:id/sync', () => {
    const sync = (id: string) => request(app).post(`/api/v1/admin/withdrawals/${id}/sync`).set(...auth(admin));
    const record = (id: string, status: string, failure_code: string | null = null) => ({ id: `disb-${id}`, status, reference_id: id, failure_code });

    it('DISBURSING dengan id: dibaca lewat id payout, SUCCEEDED menjadi COMPLETED seperti webhook', async () => {
      const id = await created(100000);
      await approve(id);
      const get = vi.spyOn(paymentGateway, 'getPayout');
      const res = await sync(id);
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(get).toHaveBeenCalledWith({ payoutId: `fake-payout-${id}`, referenceId: id });
      expect(res.body.data.sync).toMatchObject({ gateway_status: 'SUCCEEDED', outcome: 'PROCESSED' });
      expect(res.body.data.withdrawal).toMatchObject({ status: 'COMPLETED', xendit_payout_status: 'SUCCEEDED' });
      expect(await available()).toBe(earning - 100000);
      expect(await prisma.notification.count({ where: { referenceId: id, type: 'WITHDRAWAL' } })).toBe(1);
    });

    it('APPROVED tanpa id (timeout saat approve): dicari lewat reference_id, FAILED dengan tepat satu reversal', async () => {
      const id = await created(100000);
      vi.spyOn(paymentGateway, 'payout').mockRejectedValueOnce(gatewayError({ gateway_timeout: true }));
      expect((await approve(id)).status).toBe(502);
      const get = vi.spyOn(paymentGateway, 'getPayout').mockResolvedValueOnce(record(id, 'FAILED', 'INVALID_DESTINATION'));

      const res = await sync(id);
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(get).toHaveBeenCalledWith({ payoutId: null, referenceId: id });
      expect(res.body.data.withdrawal).toMatchObject({ status: 'FAILED', failure_code: 'INVALID_DESTINATION', xendit_payout_id: `disb-${id}` });
      expect(await available()).toBe(earning);
      expect((await ledgerOf(id)).map((r) => r.type)).toEqual(['WITHDRAWAL', 'WITHDRAWAL_REVERSAL']);

      // Sync kedua pada FAILED ditolak, reversal tidak bertambah.
      expect((await sync(id)).status).toBe(409);
      expect((await ledgerOf(id)).map((r) => r.type)).toEqual(['WITHDRAWAL', 'WITHDRAWAL_REVERSAL']);
    });

    it('tidak ditemukan di Xendit: tanpa perubahan; status yang masih belum pasti di Xendit: IGNORED', async () => {
      const id = await created(100000);
      vi.spyOn(paymentGateway, 'payout').mockRejectedValueOnce(gatewayError({ gateway_timeout: true }));
      await approve(id);
      vi.spyOn(paymentGateway, 'getPayout').mockResolvedValueOnce(null).mockResolvedValueOnce(record(id, 'ACCEPTED'));

      const missing = await sync(id);
      expect(missing.body.data.sync).toMatchObject({ outcome: 'NOT_FOUND', gateway_status: null });
      expect(missing.body.data.withdrawal.status).toBe('APPROVED');
      const pending = await sync(id);
      expect(pending.body.data.sync).toMatchObject({ outcome: 'IGNORED', gateway_status: 'ACCEPTED' });
      expect(pending.body.data.withdrawal.status).toBe('APPROVED');
    });

    it('REQUESTED dan REJECTED ditolak 409, galat gateway jadi 502, hanya admin', async () => {
      const id = await created(100000);
      expect((await sync(id)).body.error.code).toBe('WITHDRAWAL_STATE_CONFLICT');
      await approve(id);
      vi.spyOn(paymentGateway, 'getPayout').mockRejectedValueOnce(gatewayError({ gateway_status: 503 }));
      expect((await sync(id)).status).toBe(502);
      expect((await request(app).post(`/api/v1/admin/withdrawals/${id}/sync`).set(...auth(w.owner))).status).toBe(403);
      const other = await created(50000);
      await reject(other, 'Rekening tidak sesuai');
      expect((await sync(other)).status).toBe(409);
    });
  });
});
