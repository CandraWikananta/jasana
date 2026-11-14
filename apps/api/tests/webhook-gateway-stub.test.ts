/**
 * Sesi 8a: stub POST /webhooks/xendit/refund. Hanya mencatat ke webhook_events
 * dengan status IGNORED, pemrosesannya di 8c. Payout diproses sejak 8b
 * (tests/webhook-payout.test.ts).
 *
 *   H13   token callback, gagal tertutup, tanpa baris
 *   stub  payload apa pun dengan token valid dicatat utuh dan dibalas 200
 *
 * Payload di sini disusun dari bentuk dokumentasi Xendit, bukan salinan sandbox.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { hasTestDatabase, resetDatabase } from './helpers/integration';

const ROUTES = [
  {
    domain: 'REFUND' as const,
    path: '/api/v1/webhooks/xendit/refund',
    prefix: 'refund',
    body: {
      event: 'refund.succeeded',
      business_id: 'bisnis-samaran',
      created: '2026-11-14T03:00:00.000Z',
      data: { id: 'rfd-samaran-1', invoice_id: 'inv-samaran-1', reference_id: 'ref-samaran-1', status: 'SUCCEEDED', amount: 20000, currency: 'IDR' },
    },
  },
];

describe.skipIf(!hasTestDatabase)('stub webhook refund (8a)', () => {
  let app: Express;
  const send = (path: string, body: unknown, token: string | null = env.XENDIT_CALLBACK_TOKEN) => {
    const req = request(app).post(path);
    return (token === null ? req : req.set('x-callback-token', token)).send(body as object);
  };

  beforeEach(async () => {
    await resetDatabase();
    app = createApp();
  });

  describe.each(ROUTES)('$path', ({ domain, path, prefix, body }) => {
    it.each([
      ['salah', 'token-salah'],
      ['kosong', ''],
      ['tidak ada', null],
    ])('token %s ditolak 401 tanpa mencatat apa pun', async (_label, token) => {
      const res = await send(path, body, token);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(await prisma.webhookEvent.count()).toBe(0);
    });

    it('payload dikenali dicatat IGNORED dengan event_id <domain>:<id>:<status> dan payload utuh', async () => {
      const res = await send(path, body);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ received: true });
      const rows = await prisma.webhookEvent.findMany();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        domain,
        eventId: `${prefix}:${body.data.id}:SUCCEEDED`,
        eventType: 'SUCCEEDED',
        referenceId: body.data.id,
        processingStatus: 'IGNORED',
        signatureValid: true,
        payload: body,
      });
      expect(rows[0]!.processedAt).not.toBeNull();
    });

    it('kiriman ulang event yang sama tetap satu baris dan dibalas 200', async () => {
      expect((await send(path, body)).status).toBe(200);
      expect((await send(path, body)).status).toBe(200);
      expect(await prisma.webhookEvent.count()).toBe(1);
    });

    it.each([
      ['tanpa data', { event: 'x' }],
      ['data.id bukan string', { data: { id: 12, status: 'SUCCEEDED' } }],
      ['tanpa data.status', { data: { refund_id: 'rfd-v3', id: 'x' } }],
      ['array', [1, 2]],
    ])('bentuk lain (%s) tetap dicatat utuh dengan event_id cadangan dan dibalas 200', async (_label, odd) => {
      const first = await send(path, odd);
      const second = await send(path, odd);
      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      const rows = await prisma.webhookEvent.findMany({ orderBy: { receivedAt: 'asc' } });
      // Cadangan unik per kiriman: dua kiriman, dua baris, tidak saling menimpa.
      expect(rows).toHaveLength(2);
      for (const row of rows) {
        expect(row.eventId).toMatch(new RegExp(`^${prefix}:raw:[0-9a-f-]{36}$`));
        expect(row).toMatchObject({ domain, processingStatus: 'IGNORED', eventType: null, referenceId: null, payload: odd });
      }
    });
  });
});
