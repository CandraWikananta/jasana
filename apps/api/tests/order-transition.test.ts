/**
 * transitionOrder() terhadap basis data uji: tiga lapis pemeriksaan
 * (jebakan 5), UPDATE bersyarat, histori di transaksi yang sama, dan titik
 * setelah commit (jebakan 7).
 *
 * Order dibuat langsung lewat Prisma. Endpoint order baru ada di sesi 6c.
 */

import { randomInt } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { prisma, type OrderActorType, type OrderStatus } from '@jasana/database';
import { transitionOrder, withOrderTransaction, type TransitionInput } from '../src/modules/orders/order-transition.service';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import { createListing } from './helpers/providers';

type Mode = 'SCHEDULED' | 'AVAILABLE_NOW';

describe.skipIf(!hasTestDatabase)('transitionOrder', () => {
  let world: Awaited<ReturnType<typeof newWorld>>;

  async function newUser() {
    const n = randomInt(1e9);
    return prisma.user.create({
      data: { fullName: `Uji ${n}`, email: `transisi-${n}@uji.test`, phone: `+6282${n}`, passwordHash: 'x' },
    });
  }

  /** Satu usaha dengan dua pekerja: pemilik (penanggung jawab) dan rekan. */
  async function newWorld() {
    const [owner, colleague, client] = [await newUser(), await newUser(), await newUser()];
    const provider = await prisma.providerProfile.create({
      data: { userId: owner.id, verificationStatus: 'VERIFIED', verifiedAt: new Date() },
    });
    const worker = (userId: string, isOwner: boolean) =>
      prisma.providerWorker.create({
        data: { providerProfileId: provider.id, userId, displayName: 'Pekerja', isOwner, membershipStatus: 'ACTIVE' },
      });
    const assignee = await worker(owner.id, true);
    const other = await worker(colleague.id, false);
    const listingId = await createListing(provider.id);
    return { owner, colleague, client, provider, assignee, other, listingId };
  }

  async function newOrder(status: OrderStatus, bookingMode: Mode = 'SCHEDULED') {
    const assigned = status !== 'PENDING_ACCEPTANCE';
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-UJI-${randomInt(1e9)}`,
        clientId: world.client.id,
        providerProfileId: world.provider.id,
        listingId: world.listingId,
        assignedWorkerId: assigned ? world.assignee.id : null,
        bookingMode,
        status,
        scheduledAt: bookingMode === 'SCHEDULED' ? new Date(Date.now() + 86_400_000) : null,
        serviceAddress: 'Jl. Uji',
        serviceLatitude: -8.6725,
        serviceLongitude: 115.234,
        locationSource: 'MAP_PIN',
        snapshotListingTitle: 'Listing Uji',
        listingBaseAmount: 100000,
        platformFee: 10000,
        totalAmount: 100000,
        providerEarning: 90000,
      },
    });
    return order.id;
  }

  const run = (input: TransitionInput) => withOrderTransaction((tx) => transitionOrder(tx, input));
  const historyCount = (orderId: string) => prisma.orderStatusHistory.count({ where: { orderId } });
  const statusOf = async (orderId: string) =>
    (await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).status;

  beforeEach(async () => {
    await resetDatabase();
    world = await newWorld();
  });

  it('transisi sah mengubah status, mengisi kolom waktu, dan menulis satu histori', async () => {
    const orderId = await newOrder('PENDING_ACCEPTANCE');
    await run({
      orderId,
      toStatus: 'ACCEPTED',
      actor: 'PROVIDER',
      actorUserId: world.owner.id,
      data: { assignedWorkerId: world.assignee.id, acceptedBy: world.owner.id },
    });

    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.status).toBe('ACCEPTED');
    expect(order.acceptedAt).not.toBeNull();
    expect(order.assignedWorkerId).toBe(world.assignee.id);
    const histories = await prisma.orderStatusHistory.findMany({ where: { orderId } });
    expect(histories).toMatchObject([
      { fromStatus: 'PENDING_ACCEPTANCE', toStatus: 'ACCEPTED', actor: 'PROVIDER', changedByUserId: world.owner.id },
    ]);
  });

  it('order yang tidak ada dibalas 404', async () => {
    await expect(
      run({ orderId: '00000000-0000-0000-0000-000000000000', toStatus: 'ACCEPTED', actor: 'PROVIDER' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  });

  // Lapis 1. Aktor dipilih yang berhak di tempat lain, supaya terbukti 409 datang dari tabel transisi.
  it.each<[OrderStatus, OrderStatus]>([
    ['PENDING_ACCEPTANCE', 'COMPLETED'],
    ['PENDING_ACCEPTANCE', 'PAID'],
    ['PENDING_ACCEPTANCE', 'SETTLED'],
    ['ACCEPTED', 'ON_THE_WAY'],
    ['PAID', 'ARRIVED'],
    ['PAID', 'DISPUTED'],
    ['ON_THE_WAY', 'IN_PROGRESS'],
    ['ARRIVED', 'CANCELLED'],
    ['IN_PROGRESS', 'COMPLETED'],
    ['COMPLETED', 'REFUNDED'],
    ['SETTLED', 'DISPUTED'],
    ['REJECTED', 'ACCEPTED'],
  ])('%s -> %s ditolak 409 tanpa histori', async (from, to) => {
    const orderId = await newOrder(from);
    await expect(
      run({ orderId, toStatus: to, actor: 'ADMIN', actorUserId: world.owner.id }),
    ).rejects.toMatchObject({ code: 'ORDER_TRANSITION_NOT_ALLOWED', status: 409 });
    expect(await statusOf(orderId)).toBe(from);
    expect(await historyCount(orderId)).toBe(0);
  });

  // Lapis 2.
  it.each<[OrderStatus, OrderStatus, OrderActorType]>([
    ['COMPLETED', 'SETTLED', 'CLIENT'],
    ['PAID', 'CANCELLED', 'WORKER'],
    ['ARRIVED', 'DISPUTED', 'WORKER'],
    ['ACCEPTED', 'PAID', 'PROVIDER'],
    ['PAID', 'ON_THE_WAY', 'PROVIDER'],
  ])('%s -> %s oleh %s ditolak 403', async (from, to, actor) => {
    const orderId = await newOrder(from);
    await expect(
      run({ orderId, toStatus: to, actor, actorUserId: world.owner.id }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN_ACTOR', status: 403 });
    expect(await historyCount(orderId)).toBe(0);
  });

  // Lapis 3, State Machine Bagian 9 "pekerja salah" (5 kasus).
  it.each<[OrderStatus, OrderStatus]>([
    ['PAID', 'ON_THE_WAY'],
    ['ON_THE_WAY', 'ARRIVED'],
    ['ARRIVED', 'IN_PROGRESS'],
    ['IN_PROGRESS', 'AWAITING_VERIFICATION'],
    ['AWAITING_VERIFICATION', 'COMPLETED'],
  ])('%s -> %s oleh rekan seusaha ditolak 403', async (from, to) => {
    const orderId = await newOrder(from);
    await expect(
      run({ orderId, toStatus: to, actor: 'WORKER', actorUserId: world.colleague.id }),
    ).rejects.toMatchObject({ code: 'NOT_ASSIGNED_WORKER', status: 403 });
    expect(await statusOf(orderId)).toBe(from);
  });

  it('transisi pelaksanaan tanpa actorUserId ditolak 403', async () => {
    const orderId = await newOrder('PAID');
    await expect(run({ orderId, toStatus: 'ON_THE_WAY', actor: 'WORKER' })).rejects.toMatchObject({
      code: 'NOT_ASSIGNED_WORKER',
    });
  });

  it('penanggung jawab lolos lapis 3 dan startedAt terisi', async () => {
    const orderId = await newOrder('PAID');
    await run({ orderId, toStatus: 'ON_THE_WAY', actor: 'WORKER', actorUserId: world.owner.id });
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.status).toBe('ON_THE_WAY');
    expect(order.startedAt).not.toBeNull();
  });

  // D102.
  it('WORKER pada T1 mode SCHEDULED ditolak, pada AVAILABLE_NOW lolos', async () => {
    const scheduled = await newOrder('PENDING_ACCEPTANCE', 'SCHEDULED');
    await expect(
      run({ orderId: scheduled, toStatus: 'ACCEPTED', actor: 'WORKER', actorUserId: world.colleague.id, data: { assignedWorkerId: world.other.id } }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN_ACTOR', status: 403 });

    const now = await newOrder('PENDING_ACCEPTANCE', 'AVAILABLE_NOW');
    await run({ orderId: now, toStatus: 'ACCEPTED', actor: 'WORKER', actorUserId: world.colleague.id, data: { assignedWorkerId: world.other.id } });
    expect(await statusOf(now)).toBe('ACCEPTED');
  });

  it.each<Mode>(['SCHEDULED', 'AVAILABLE_NOW'])('WORKER pada T2 mode %s ditolak 403', async (mode) => {
    const orderId = await newOrder('PENDING_ACCEPTANCE', mode);
    await expect(
      run({ orderId, toStatus: 'REJECTED', actor: 'WORKER', actorUserId: world.colleague.id }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN_ACTOR', status: 403 });
  });

  it('pemilik menolak (T2) mengisi cancelledAt dan cancelledBy', async () => {
    const orderId = await newOrder('PENDING_ACCEPTANCE');
    await run({ orderId, toStatus: 'REJECTED', actor: 'PROVIDER', actorUserId: world.owner.id });
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order).toMatchObject({ status: 'REJECTED', cancelledBy: 'PROVIDER' });
    expect(order.cancelledAt).not.toBeNull();
  });

  describe('guard, efek samping, dan afterCommit', () => {
    it('guard yang melempar membatalkan semuanya, termasuk afterCommit', async () => {
      const orderId = await newOrder('PENDING_ACCEPTANCE');
      let ran = false;
      await expect(
        withOrderTransaction(async (tx, afterCommit) => {
          afterCommit(() => { ran = true; });
          return transitionOrder(tx, {
            orderId,
            toStatus: 'CANCELLED',
            actor: 'CLIENT',
            actorUserId: world.client.id,
            guard: async () => { throw new Error('guard gagal'); },
          });
        }),
      ).rejects.toThrow('guard gagal');
      expect(ran).toBe(false);
      expect(await statusOf(orderId)).toBe('PENDING_ACCEPTANCE');
      expect(await historyCount(orderId)).toBe(0);
    });

    it('efek samping yang gagal ikut me-rollback status dan histori', async () => {
      const orderId = await newOrder('PENDING_ACCEPTANCE');
      await expect(
        run({ orderId, toStatus: 'CANCELLED', actor: 'CLIENT', effects: async () => { throw new Error('efek gagal'); } }),
      ).rejects.toThrow('efek gagal');
      expect(await statusOf(orderId)).toBe('PENDING_ACCEPTANCE');
      expect(await historyCount(orderId)).toBe(0);
    });

    it('afterCommit jalan setelah commit, dan kegagalannya tidak membatalkan transisi', async () => {
      const orderId = await newOrder('PENDING_ACCEPTANCE');
      const seen: OrderStatus[] = [];
      await withOrderTransaction(async (tx, afterCommit) => {
        afterCommit(() => { throw new Error('gateway mati'); });
        // Dibaca lewat koneksi lain: hanya terlihat CANCELLED kalau sudah commit.
        afterCommit(async () => { seen.push(await statusOf(orderId)); });
        return transitionOrder(tx, { orderId, toStatus: 'CANCELLED', actor: 'CLIENT', actorUserId: world.client.id });
      });
      expect(seen).toEqual(['CANCELLED']);
      expect(await historyCount(orderId)).toBe(1);
    });
  });
});
