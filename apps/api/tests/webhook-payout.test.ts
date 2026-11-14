/**
 * Sesi 8b: POST /webhooks/xendit/payout (D137) dan cron pemulihannya (D121).
 *
 *   H13     token callback, gagal tertutup
 *   D137    dicocokkan lewat data.reference_id, status mentah disalin (D18)
 *   D134    FAILED, CANCELLED, dan REVERSED menulis tepat satu reversal
 *   H102    reversal kedua ditolak basis data, termasuk sisipan langsung
 *   fixture payload sungguhan dari sandbox 8a
 *   V1      ledger dan cache saldo tetap rekonsiliasi setelah tiap test
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma, type Prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { paymentGateway } from '../src/lib/payment-gateway';
import { recoverWebhookEvents } from '../src/modules/webhooks/webhooks.service';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import { auth, fundWallet, newUser, newWorld, type User, type World } from './helpers/orders';
import { runVerificationQuery } from './helpers/providers';

type Payload = { event: string; data: { id: string; reference_id: string; status: string; [key: string]: Prisma.InputJsonValue | null } };
const fixture = JSON.parse(readFileSync(resolve(__dirname, 'fixtures/xendit-sandbox-8a.json'), 'utf8')) as Record<string, Payload>;

describe.skipIf(!hasTestDatabase)('webhook payout Xendit (8b)', () => {
  let app: Express;
  let w: World;
  let admin: User;
  let earning: number;

  const send = (body: object, token: string | null = env.XENDIT_CALLBACK_TOKEN) => {
    const req = request(app).post('/api/v1/webhooks/xendit/payout');
    return (token === null ? req : req.set('x-callback-token', token)).send(body);
  };
  const payout = (withdrawalId: string, status: string, data: Record<string, string> = {}): Payload => ({
    event: `payout.${status.toLowerCase()}`,
    data: { id: `disb-${withdrawalId}`, reference_id: withdrawalId, status, amount: 93500, channel_code: 'ID_BCA', ...data },
  });
  /** Fixture sandbox dengan reference_id diarahkan ke withdrawal uji. */
  const fromFixture = (name: string, withdrawalId: string): Payload => {
    const base = fixture[name]!;
    return { ...base, data: { ...base.data, reference_id: withdrawalId } };
  };

  /** Withdrawal 100.000 yang sudah DISBURSING lewat API dengan gateway fake. */
  async function disbursing(amount = 100000) {
    const created = await request(app)
      .post('/api/v1/providers/me/withdrawals')
      .set(...auth(w.owner))
      .send({ amount, bank_code: 'ID_BCA', bank_account_number: '1234567890', bank_account_name: 'Nyoman Uji' });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    const id = created.body.data.id as string;
    const approved = await request(app).post(`/api/v1/admin/withdrawals/${id}/approve`).set(...auth(admin));
    expect(approved.body.data?.status, JSON.stringify(approved.body)).toBe('DISBURSING');
    return id;
  }

  const withdrawalOf = (id: string) => prisma.withdrawal.findUniqueOrThrow({ where: { id } });
  const reversals = (withdrawalId: string) => prisma.walletTransaction.count({ where: { withdrawalId, type: 'WITHDRAWAL_REVERSAL' } });
  const available = async () => (await prisma.wallet.findUniqueOrThrow({ where: { providerProfileId: w.provider.id } })).balanceAvailable.toNumber();
  const event = (body: Payload) => prisma.webhookEvent.findUniqueOrThrow({ where: { eventId: `payout:${body.data.id}:${body.data.status}` } });

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

  it.each([
    ['salah', 'token-salah'],
    ['tidak ada', null],
  ])('token %s ditolak 401 tanpa mencatat apa pun', async (_label, token) => {
    const id = await disbursing();
    expect((await send(payout(id, 'SUCCEEDED'), token)).status).toBe(401);
    expect(await prisma.webhookEvent.count()).toBe(0);
  });

  it('body tanpa data.reference_id ditolak 422 sebelum dicatat', async () => {
    expect((await send({ event: 'payout.succeeded', data: { id: 'disb-x', status: 'SUCCEEDED' } })).status).toBe(422);
    expect(await prisma.webhookEvent.count()).toBe(0);
  });

  it('SUCCEEDED dari DISBURSING: COMPLETED, completed_at, status mentah, tanpa reversal', async () => {
    const id = await disbursing();
    const body = payout(id, 'SUCCEEDED');
    const res = await send(body);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ received: true });

    const row = await withdrawalOf(id);
    expect(row).toMatchObject({ status: 'COMPLETED', xenditPayoutStatus: 'SUCCEEDED', xenditPayoutId: `fake-payout-${id}` });
    expect(row.completedAt).not.toBeNull();
    expect(await reversals(id)).toBe(0);
    expect(await available()).toBe(earning - 100000);
    expect(await event(body)).toMatchObject({ domain: 'PAYOUT', eventType: 'SUCCEEDED', referenceId: body.data.id, processingStatus: 'PROCESSED' });
    expect(await prisma.notification.count({ where: { referenceId: id, type: 'WITHDRAWAL' } })).toBe(1);
  });

  it('SUCCEEDED yang mendahului respons API saat withdrawal masih APPROVED: COMPLETED dan tidak ditimpa DISBURSING', async () => {
    const created = await request(app)
      .post('/api/v1/providers/me/withdrawals')
      .set(...auth(w.owner))
      .send({ amount: 100000, bank_code: 'ID_BNI', bank_account_number: '9876543', bank_account_name: 'Nyoman Uji' });
    const id = created.body.data.id as string;
    vi.spyOn(paymentGateway, 'payout').mockImplementationOnce(async (input) => {
      expect((await send(payout(input.withdrawalId, 'SUCCEEDED'))).status).toBe(200);
      return { payoutId: `disb-${input.withdrawalId}`, status: 'ACCEPTED', raw: {} };
    });

    const res = await request(app).post(`/api/v1/admin/withdrawals/${id}/approve`).set(...auth(admin));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'COMPLETED', xendit_payout_id: `disb-${id}`, xendit_payout_status: 'SUCCEEDED' });
  });

  it('H102: FAILED dikirim dua kali dan disusul CANCELLED, tetap satu reversal; sisipan langsung ditolak', async () => {
    const id = await disbursing();
    const failed = payout(id, 'FAILED', { failure_code: 'INVALID_DESTINATION' });

    expect((await send(failed)).status).toBe(200);
    expect(await withdrawalOf(id)).toMatchObject({ status: 'FAILED', failureCode: 'INVALID_DESTINATION', xenditPayoutStatus: 'FAILED' });
    expect(await reversals(id)).toBe(1);
    expect(await available()).toBe(earning);
    const notes = await prisma.notification.findMany({ where: { referenceId: id, type: 'WITHDRAWAL' } });
    expect(notes).toHaveLength(1);
    expect(notes[0]!.body).toContain('sudah dikembalikan');

    expect((await send(failed)).status).toBe(200);
    const cancelled = payout(id, 'CANCELLED');
    expect((await send(cancelled)).status).toBe(200);
    expect(await event(cancelled)).toMatchObject({ processingStatus: 'IGNORED', errorMessage: 'Payout CANCELLED untuk withdrawal FAILED tidak diproses' });
    expect(await prisma.webhookEvent.count()).toBe(2);
    expect(await reversals(id)).toBe(1);
    expect(await available()).toBe(earning);

    // Lapis terakhir di basis data, tidak bergantung pada kode.
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { providerProfileId: w.provider.id } });
    await expect(
      prisma.walletTransaction.create({
        data: { walletId: wallet.id, withdrawalId: id, type: 'WITHDRAWAL_REVERSAL', amountAvailableDelta: 0.01, balanceAvailableAfter: 0, balancePendingAfter: 0 },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('REVERSED setelah COMPLETED: REVERSED, reversed_at, satu reversal. Dari DISBURSING: IGNORED', async () => {
    const id = await disbursing();
    await send(payout(id, 'SUCCEEDED'));
    const reversed = payout(id, 'REVERSED');
    expect((await send(reversed)).status).toBe(200);

    const row = await withdrawalOf(id);
    expect(row).toMatchObject({ status: 'REVERSED', xenditPayoutStatus: 'REVERSED' });
    expect(row.reversedAt).not.toBeNull();
    expect(await reversals(id)).toBe(1);
    expect(await available()).toBe(earning);
    const notes = await prisma.notification.findMany({ where: { referenceId: id, type: 'WITHDRAWAL' }, orderBy: { id: 'asc' } });
    expect(notes.at(-1)!.body).toContain('sudah dikembalikan');

    const other = await disbursing(60000);
    const early = payout(other, 'REVERSED');
    await send(early);
    expect(await event(early)).toMatchObject({ processingStatus: 'IGNORED' });
    expect(await withdrawalOf(other)).toMatchObject({ status: 'DISBURSING', xenditPayoutStatus: 'ACCEPTED' });
    expect(await reversals(other)).toBe(0);
  });

  it('status antara REQUESTED: IGNORED tanpa efek, status mentah tidak ditimpa', async () => {
    const id = await disbursing();
    const mid = payout(id, 'REQUESTED');
    await send(mid);
    expect(await event(mid)).toMatchObject({ processingStatus: 'IGNORED' });
    expect(await withdrawalOf(id)).toMatchObject({ status: 'DISBURSING', xenditPayoutStatus: 'ACCEPTED' });
  });

  it('fixture sungguhan: payout.succeeded dan payout.failed diproses lewat reference_id', async () => {
    const ok = await disbursing();
    const succeeded = fromFixture('payout_succeeded', ok);
    expect((await send(succeeded)).status).toBe(200);
    expect(await event(succeeded)).toMatchObject({ processingStatus: 'PROCESSED', referenceId: 'disb-46991932-a0e8-4a47-b8c7-384d273f26b7' });
    expect(await withdrawalOf(ok)).toMatchObject({ status: 'COMPLETED', xenditPayoutStatus: 'SUCCEEDED' });

    const bad = await disbursing(60000);
    const failed = fromFixture('payout_failed_invalid_destination', bad);
    await send(failed);
    expect(await event(failed)).toMatchObject({ processingStatus: 'PROCESSED' });
    expect(await withdrawalOf(bad)).toMatchObject({ status: 'FAILED', failureCode: 'INVALID_DESTINATION' });
    expect(await reversals(bad)).toBe(1);
    expect(await available()).toBe(earning - 100000);
  });

  it('D137: reference_id asing atau bukan uuid dicatat IGNORED', async () => {
    const id = await disbursing();
    const foreign = fixture.payout_failed_rejected_by_channel!;
    await send(foreign);
    expect(await event(foreign)).toMatchObject({ processingStatus: 'IGNORED', errorMessage: 'reference_id tidak cocok dengan withdrawal mana pun (D137)' });

    const notUuid = payout(id, 'FAILED', { reference_id: 'wd-samaran-1' });
    await send(notUuid);
    expect(await event(notUuid)).toMatchObject({ processingStatus: 'IGNORED' });
    expect(await withdrawalOf(id)).toMatchObject({ status: 'DISBURSING' });
    expect(await reversals(id)).toBe(0);
  });

  it('D121: cron pemulihan mengulang event PAYOUT yang FAILED dari payload tersimpan', async () => {
    const id = await disbursing();
    const body = payout(id, 'FAILED', { failure_code: 'REJECTED_BY_CHANNEL' });
    await prisma.webhookEvent.create({
      data: { domain: 'PAYOUT', eventId: `payout:${body.data.id}:FAILED`, eventType: 'FAILED', referenceId: body.data.id, payload: body, processingStatus: 'FAILED', errorMessage: 'galat sementara' },
    });

    expect(await recoverWebhookEvents()).toMatchObject({ retried: 1, processed: 1, failed: 0 });
    expect(await event(body)).toMatchObject({ processingStatus: 'PROCESSED', retryCount: 1 });
    expect(await withdrawalOf(id)).toMatchObject({ status: 'FAILED', failureCode: 'REJECTED_BY_CHANNEL' });
    expect(await reversals(id)).toBe(1);
  });
});
