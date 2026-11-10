/**
 * Sesi 7c, usulan D129: GET /providers/me/wallet dan /transactions, hanya pemilik usaha.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import { auth, newWorld, paidScheduledOrder, type World } from './helpers/orders';
import { prisma } from '@jasana/database';

describe.skipIf(!hasTestDatabase)('wallet usaha (D129)', () => {
  let app: Express;
  let w: World;

  beforeEach(async () => {
    await resetDatabase();
    app = createApp();
    w = await newWorld();
  });

  it('client dan pekerja yang bukan pemilik ditolak 403', async () => {
    for (const user of [w.client, w.w2]) {
      expect((await request(app).get('/api/v1/providers/me/wallet').set(...auth(user))).status).toBe(403);
      expect((await request(app).get('/api/v1/providers/me/wallet/transactions').set(...auth(user))).status).toBe(403);
    }
    expect((await request(app).get('/api/v1/providers/me/wallet')).status).toBe(401);
  });

  it('saldo dan ledger terpaginasi, terbaru dulu', async () => {
    const first = await paidScheduledOrder(app, w, { assigned: w.w2 });
    await paidScheduledOrder(app, w, { assigned: w.w3 });
    const earning = (await prisma.order.findUniqueOrThrow({ where: { id: first.id } })).providerEarning.toNumber();

    const balance = await request(app).get('/api/v1/providers/me/wallet').set(...auth(w.owner));
    expect(balance.status, JSON.stringify(balance.body)).toBe(200);
    expect(balance.body.data).toEqual({ balance_available: 0, balance_pending: 2 * earning, currency: 'IDR' });

    const page = await request(app).get('/api/v1/providers/me/wallet/transactions?limit=1&page=2').set(...auth(w.owner));
    expect(page.status, JSON.stringify(page.body)).toBe(200);
    expect(page.body.meta).toEqual({ page: 2, limit: 1, total: 2 });
    expect(page.body.data).toEqual([
      expect.objectContaining({
        order_id: first.id, type: 'ESCROW_HOLD', amount_available_delta: 0, amount_pending_delta: earning,
        balance_available_after: 0, balance_pending_after: earning,
      }),
    ]);
    expect(typeof page.body.data[0].id).toBe('string');

    expect((await request(app).get('/api/v1/providers/me/wallet/transactions?limit=101').set(...auth(w.owner))).status).toBe(422);
  });
});
