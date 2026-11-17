/**
 * Seed simulasi H16 (apps/api/scripts/sim/lib.ts): bagian yang bisa merusak data
 * kalau salah.
 *
 *   assertTarget       lokal "test" lolos, host lain wajib --confirm-host, --bulk hanya lokal (D207)
 *   shiftOrderTimes    seluruh jejak order bergeser sama, dana cair sehari setelah selesai,
 *                      nomor order ikut tanggal baru, notifikasi dihapus, V1 tetap nol (D205)
 *   findForeignLinks   order client non-sim ke usaha sim terhitung, reset harus berhenti
 *   resetSimulation    hanya data @sim yang hilang, termasuk ledgernya (perluasan D130)
 *   targetReason       listing akun uji .test dan listing di taksonomi nonaktif (D208), bukan @sim/@uat
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { witaDateKey } from '../src/lib/wita';
import { assertTarget, findForeignLinks, resetSimulation, shiftOrderTimes, SIM_DOMAIN } from '../scripts/sim/lib';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import { acceptedScheduledOrder, fundWallet, HOUR, newUser, newWorld, type World } from './helpers/orders';
import { runVerificationQuery } from './helpers/providers';
// @ts-expect-error berkas .mjs tanpa deklarasi tipe
import { targetReason } from '../../../scripts/deactivate-test-listings.mjs';

const DAY = 24 * HOUR;

describe('assertTarget', () => {
  const remote = 'postgresql://u:p@db.abcdefgh.supabase.co:5432/postgres';

  it('basis data lokal bernama test langsung lolos', () => {
    expect(assertTarget('postgresql://u:p@localhost:5432/jasana_test').local).toBe(true);
    expect(assertTarget('postgresql://u:p@127.0.0.1:5432/jasana_test?schema=public').database).toBe('jasana_test');
  });

  it('host lain dan lokal tanpa "test" wajib --confirm-host yang sama persis', () => {
    expect(() => assertTarget(remote)).toThrow(/--confirm-host db\.abcdefgh\.supabase\.co/);
    expect(() => assertTarget(remote, { confirmHost: 'db.lain.supabase.co' })).toThrow(/tidak dikenali/);
    expect(() => assertTarget('postgresql://u:p@localhost:5432/jasana')).toThrow(/tidak dikenali/);
    expect(assertTarget(remote, { confirmHost: 'db.abcdefgh.supabase.co' })).toEqual({ host: 'db.abcdefgh.supabase.co', database: 'postgres', local: false });
  });

  it('--bulk ke host bukan lokal ditolak kecuali --bulk-remote', () => {
    expect(() => assertTarget(remote, { confirmHost: 'db.abcdefgh.supabase.co', bulk: true })).toThrow(/PERINGATAN: --bulk/);
    expect(assertTarget(remote, { confirmHost: 'db.abcdefgh.supabase.co', bulk: true, bulkRemote: true }).local).toBe(false);
    expect(assertTarget('postgresql://u:p@localhost:5432/jasana_test', { bulk: true }).local).toBe(true);
  });

  it('URL kosong ditolak', () => {
    expect(() => assertTarget(undefined)).toThrow(/bukan URL/);
  });
});

describe('deactivate-test-listings: targetReason', () => {
  const listing = (email: string, subActive = true, catActive = true) => ({
    providerProfile: { user: { email } },
    subcategory: { isActive: subActive, category: { isActive: catActive } },
  });

  it('akun ber-domain .test jadi target, kecuali @sim dan @uat', () => {
    expect(targetReason(listing('hpemilik@postman.jasana.test'))).toBe('akun uji');
    expect(targetReason(listing('order-1@UJI.TEST'))).toBe('akun uji');
    expect(targetReason(listing('demo.usaha@sim.jasana.test'))).toBeNull();
    expect(targetReason(listing('uat-admin-01@uat.jasana.test'))).toBeNull();
    expect(targetReason(listing('pemilik@gmail.com'))).toBeNull();
  });

  it('taksonomi nonaktif jadi target, akun apa pun', () => {
    expect(targetReason(listing('pemilik@gmail.com', false))).toBe('taksonomi nonaktif');
    expect(targetReason(listing('pemilik@gmail.com', true, false))).toBe('taksonomi nonaktif');
  });
});

describe.skipIf(!hasTestDatabase)('seed simulasi: data', () => {
  let app: Express;
  let w: World;

  /** Pemilik usaha newWorld dijadikan akun simulasi. Pekerja dan client tetap non-sim. */
  const makeSimProvider = (world: World) =>
    prisma.user.update({ where: { id: world.owner.id }, data: { email: `pemilik.${world.owner.id.slice(0, 8)}${SIM_DOMAIN}` } });

  beforeEach(async () => {
    await resetDatabase();
    app = createApp();
    w = await newWorld();
  });

  it('shiftOrderTimes menggeser seluruh jejak order SETTLED dan V1 tetap nol', async () => {
    await makeSimProvider(w);
    await fundWallet(app, w);
    const order = await prisma.order.findFirstOrThrow({ where: { providerProfileId: w.provider.id } });
    expect(order.status).toBe('SETTLED');
    const snapshot = async () => ({
      order: await prisma.order.findUniqueOrThrow({ where: { id: order.id } }),
      payment: await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } }),
      history: await prisma.orderStatusHistory.findMany({ where: { orderId: order.id }, orderBy: { id: 'asc' } }),
      checkins: await prisma.orderCheckin.findMany({ where: { orderId: order.id }, orderBy: { id: 'asc' } }),
      ledger: await prisma.walletTransaction.findMany({ where: { orderId: order.id }, orderBy: { id: 'asc' } }),
    });
    const before = await snapshot();
    expect(await prisma.notification.count({ where: { referenceId: order.id } })).toBeGreaterThan(0);

    const offset = 10 * DAY + 3 * HOUR;
    const gap = DAY + 45 * 60_000;
    await shiftOrderTimes(order.id, offset, gap);
    const after = await snapshot();

    const shifted = (a: Date | null, b: Date | null) => expect(a!.getTime() - b!.getTime()).toBe(offset);
    for (const col of ['createdAt', 'acceptedAt', 'paidAt', 'startedAt', 'completedAt', 'scheduledAt', 'verifiedAt', 'responseDeadlineAt'] as const) {
      shifted(before.order[col], after.order[col]);
    }
    expect(after.order.settledAt!.getTime()).toBe(after.order.completedAt!.getTime() + gap);
    expect(after.order.settlementDueAt!.getTime()).toBe(after.order.completedAt!.getTime() + gap);
    expect(after.order.orderNumber).toBe(before.order.orderNumber.replace(/^ORD-\d{8}/, `ORD-${witaDateKey(after.order.createdAt)}`));
    shifted(before.payment.paidAt, after.payment.paidAt);
    shifted(before.payment.createdAt, after.payment.createdAt);
    expect(after.checkins.length).toBeGreaterThan(0);
    after.checkins.forEach((c, i) => shifted(before.checkins[i]!.createdAt, c.createdAt));
    after.history.forEach((h, i) => {
      if (h.toStatus === 'SETTLED') expect(h.createdAt).toEqual(after.order.settledAt);
      else shifted(before.history[i]!.createdAt, h.createdAt);
    });
    after.ledger.forEach((t, i) => {
      if (t.type === 'ESCROW_RELEASE') expect(t.createdAt).toEqual(after.order.settledAt);
      else shifted(before.ledger[i]!.createdAt, t.createdAt);
      expect(t.amountAvailableDelta).toEqual(before.ledger[i]!.amountAvailableDelta);
      expect(t.amountPendingDelta).toEqual(before.ledger[i]!.amountPendingDelta);
    });
    expect(await prisma.notification.count({ where: { referenceId: order.id } })).toBe(0);
    expect(await runVerificationQuery('V1')).toEqual([]);
  });

  it('shiftOrderTimes menolak order usaha non-simulasi', async () => {
    const { id } = await acceptedScheduledOrder(app, w);
    await expect(shiftOrderTimes(id, DAY)).rejects.toThrow(/bukan milik usaha simulasi/);
    const order = await prisma.order.findUniqueOrThrow({ where: { id } });
    expect(Date.now() - order.createdAt.getTime()).toBeLessThan(HOUR);
  });

  it('findForeignLinks menghitung order client non-sim ke usaha sim', async () => {
    // Seluruhnya non-sim: tidak ada relasi lintas.
    await acceptedScheduledOrder(app, w);
    expect((await findForeignLinks()).every((f) => f.count === 0)).toBe(true);

    await makeSimProvider(w);
    const links = Object.fromEntries((await findForeignLinks()).map((f) => [f.label, f.count]));
    expect(links['order lintas sim dan non-sim']).toBe(1);
    // Pekerja newWorld (selain pemilik) adalah akun non-sim di usaha sim.
    expect(links['keanggotaan atau lamaran pekerja lintas']).toBe(3);
  });

  it('resetSimulation hanya menghapus data @sim, termasuk ledgernya', async () => {
    // Usaha sim dengan pekerja dan client yang juga sim, supaya tidak ada relasi lintas.
    await fundWallet(app, w);
    const order = await prisma.order.findFirstOrThrow({ where: { providerProfileId: w.provider.id }, select: { id: true, clientId: true } });
    const simIds = [w.owner.id, w.w2.id, w.w3.id, w.w4.id, order.clientId];
    for (const id of simIds) await prisma.user.update({ where: { id }, data: { email: `${id}${SIM_DOMAIN}` } });
    const outsider = await newUser();
    // Admin non-sim yang diberi tahu soal order sim: notifikasinya ikut hilang, notifikasi lainnya tidak.
    const note = (referenceId: string | null) => ({ userId: outsider.id, type: 'DISPUTE' as const, channel: 'IN_APP' as const, title: 'Sengketa dibuka', referenceType: 'order', referenceId });
    await prisma.notification.createMany({ data: [note(order.id), note(null)] });
    expect((await findForeignLinks()).every((f) => f.count === 0)).toBe(true);

    const result = await resetSimulation({ photos: false });
    expect(result).toMatchObject({ users: 5, orders: 1, files: 0 });
    expect(await prisma.user.count({ where: { id: { in: simIds } } })).toBe(0);
    expect(await prisma.walletTransaction.count()).toBe(0);
    expect(await prisma.providerProfile.count({ where: { id: w.provider.id } })).toBe(0);
    expect(await prisma.user.count({ where: { id: outsider.id } })).toBe(1);
    expect(await prisma.notification.findMany({ where: { userId: outsider.id }, select: { referenceId: true } })).toEqual([{ referenceId: null }]);
    expect(await runVerificationQuery('V1')).toEqual([]);
  });
});
