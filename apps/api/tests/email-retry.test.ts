/**
 * Cron retry email (sesi 10a, D177, H37, sebagian H114).
 *
 *   FAILED dengan reference_type di whitelist dikirim ulang, isi dirender ulang
 *   email bertoken dan tanpa referensi tidak pernah dikirim ulang
 *   berhenti setelah email_retry_max_attempts retry
 *   PENDING yatim lebih dari 15 menit diambil, yang baru tidak
 *   dua putaran paralel tidak mengirim email yang sama dua kali
 */

import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma, type Prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { mailer } from '../src/lib/mailer';
import { retryFailedEmails } from '../src/modules/notifications/email-retry';
import { captureEmails, hasTestDatabase, resetDatabase } from './helpers/integration';
import { MINUTE, acceptedScheduledOrder, newProvider, newWorld } from './helpers/orders';

const app = createApp();

describe.skipIf(!hasTestDatabase)('retry email (10a)', () => {
  let userId: string;
  let profileId: string;

  beforeEach(async () => {
    await resetDatabase();
    const { provider, owner } = await newProvider();
    userId = owner.id;
    profileId = provider.id;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const email = (data: Partial<Prisma.NotificationUncheckedCreateInput> = {}) =>
    prisma.notification.create({
      data: {
        userId, type: 'KYC', channel: 'EMAIL', title: 'Pengajuan provider disetujui', body: 'e-KYC Anda disetujui.',
        emailStatus: 'FAILED', emailError: 'SMTP mati', referenceType: 'provider_profile', referenceId: profileId, ...data,
      },
    });
  const row = (id: bigint) => prisma.notification.findUniqueOrThrow({ where: { id } });

  it('FAILED dirender ulang dari title, body, dan referensi order, ke alamat users.email terkini', async () => {
    const w = await newWorld();
    const { id: orderId } = await acceptedScheduledOrder(app, w);
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    await prisma.notification.updateMany({ where: { channel: 'EMAIL' }, data: { emailStatus: 'SENT' } });
    await prisma.user.update({ where: { id: w.client.id }, data: { email: 'baru@uji.test' } });
    const failed = await email({
      userId: w.client.id, type: 'ORDER_STATUS', title: `Order diterima (${order.orderNumber})`, body: 'Order diterima.', referenceType: 'order', referenceId: orderId,
    });
    const { sent } = captureEmails();

    expect(await retryFailedEmails()).toEqual({ claimed: 1, sent: 1, failed: 0 });
    expect(sent).toEqual([{ to: 'baru@uji.test', subject: `Jasana: Order diterima (${order.orderNumber})`, text: expect.stringContaining(`Order diterima.\n\nNomor order: ${order.orderNumber}`) }]);
    expect(sent[0]!.text).toMatch(/^Halo Uji \d+,/);
    expect(await row(failed.id)).toMatchObject({ emailStatus: 'SENT', emailAttempts: 1, emailError: null });
  });

  it('whitelist: verification_token, tanpa referensi, IN_APP, dan yang sudah mencapai batas tidak disentuh', async () => {
    const skipped = await Promise.all([
      email({ type: 'ACCOUNT', referenceType: 'verification_token', referenceId: randomUUID() }),
      email({ type: 'ACCOUNT', referenceType: null, referenceId: null }),
      email({ emailAttempts: 3 }),
      email({ emailStatus: 'SENT' }),
    ]);
    const { sent } = captureEmails();
    expect(await retryFailedEmails()).toEqual({ claimed: 0, sent: 0, failed: 0 });
    expect(sent).toEqual([]);
    for (const s of skipped) expect(await row(s.id)).toEqual(s);
  });

  it('SMTP gagal terus: berhenti setelah 3 retry dengan status FAILED', async () => {
    const failed = await email();
    const send = vi.spyOn(mailer, 'send').mockRejectedValue(new Error('SMTP masih mati'));
    for (let i = 0; i < 5; i += 1) await retryFailedEmails();
    expect(send).toHaveBeenCalledTimes(3);
    expect(await row(failed.id)).toMatchObject({ emailStatus: 'FAILED', emailAttempts: 3, emailError: 'SMTP masih mati' });
  });

  it('referensi yang sudah hilang ditandai FAILED tanpa dikirim', async () => {
    const orphan = await email({ type: 'WORKER_APPLICATION', referenceType: 'provider_worker', referenceId: randomUUID() });
    const { sent } = captureEmails();
    expect(await retryFailedEmails()).toEqual({ claimed: 1, sent: 0, failed: 1 });
    expect(sent).toEqual([]);
    expect(await row(orphan.id)).toMatchObject({ emailStatus: 'FAILED', emailAttempts: 1, emailError: expect.stringContaining('sudah tidak ada') });
  });

  it('PENDING yatim lebih dari 15 menit dikirim, PENDING baru dan PENDING yang sedang di-retry tidak', async () => {
    const stale = await email({ emailStatus: 'PENDING', emailError: null, createdAt: new Date(Date.now() - 16 * MINUTE) });
    const fresh = await email({ emailStatus: 'PENDING', emailError: null, createdAt: new Date(Date.now() - 14 * MINUTE) });
    const retrying = await email({ emailStatus: 'PENDING', emailError: null, emailAttempts: 1, createdAt: new Date(Date.now() - 60 * MINUTE) });
    const { sent } = captureEmails();
    expect(await retryFailedEmails()).toEqual({ claimed: 1, sent: 1, failed: 0 });
    expect(sent).toHaveLength(1);
    expect(await row(stale.id)).toMatchObject({ emailStatus: 'SENT', emailAttempts: 1 });
    expect(await row(fresh.id)).toEqual(fresh);
    expect(await row(retrying.id)).toEqual(retrying);
  });

  it('dua putaran paralel: setiap baris terkirim tepat sekali', async () => {
    const rows = [
      ...(await Promise.all([email(), email(), email()])),
      await email({ emailStatus: 'PENDING', emailError: null, createdAt: new Date(Date.now() - 20 * MINUTE) }),
    ];
    const { sent } = captureEmails();

    // Barrier: kedua putaran membaca kandidat yang sama sebelum salah satunya mengklaim.
    const original = prisma.notification.findMany.bind(prisma.notification);
    let release!: () => void;
    const bothRead = new Promise<void>((resolve) => (release = resolve));
    let readers = 0;
    vi.spyOn(prisma.notification, 'findMany').mockImplementation(((args: Prisma.NotificationFindManyArgs) =>
      Promise.resolve(original(args)).then(async (found) => {
        readers += 1;
        if (readers === 2) release();
        await bothRead;
        return found;
      })) as unknown as typeof prisma.notification.findMany);

    const [first, second] = await Promise.all([retryFailedEmails(), retryFailedEmails()]);
    expect(readers).toBe(2);
    expect(first.claimed + second.claimed).toBe(rows.length);
    expect(sent).toHaveLength(rows.length);
    for (const r of rows) expect(await row(r.id)).toMatchObject({ emailStatus: 'SENT', emailAttempts: 1 });
  });

  it('email_retry_max_attempts = 0 mematikan retry', async () => {
    await email();
    await prisma.platformSetting.create({ data: { key: 'email_retry_max_attempts', value: 0 } });
    expect(await retryFailedEmails()).toEqual({ claimed: 0, sent: 0, failed: 0 });
  });

});
