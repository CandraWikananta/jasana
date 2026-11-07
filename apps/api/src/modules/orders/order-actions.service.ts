/**
 * Aksi pada satu order (PRD 4.3): accept (T1), reject (T2), cancel (T4, T7),
 * ganti penanggung jawab (D44) dan pendamping (D69). Seluruhnya di belakang
 * requireOrderParticipant.
 *
 * Peran pelaku dipilih PER ENDPOINT dari daftar yang endpoint itu terima,
 * bukan prioritas global: di 6e pemilik INDIVIDUAL yang juga penanggung jawab
 * harus bertindak sebagai WORKER, sedangkan di sini sebagai PROVIDER.
 */

import type { Order, Prisma } from '@jasana/database';
import { AppError } from '../../lib/errors';
import { actorFrom, type OrderAccess } from '../access/access.service';
import { dispatchEmails } from '../notifications/email-outbox';
import { getNumberSetting } from '../settings/settings.service';
import { notifyUsers } from './order-notify';
import { createPendingPayment, expireInvoices, expirePendingPayments, issueInvoice } from './order-payment.service';
import { assertWorkersFree, lockWorkers, type Slot } from './order-schedule';
import { lockOrder, rethrowInflight, transitionOrder, withOrderTransaction } from './order-transition.service';
import { getOrder } from './orders.service';
import type { AcceptOrderBody, ReasonBody } from './orders.schema';
import type { OrderDto } from './orders.mapper';

type Tx = Prisma.TransactionClient;

const MINUTE = 60_000;

const slotOf = (order: Order): Slot => ({
  start: order.scheduledAt!,
  minutes: order.snapshotDurationMinutes ?? 0,
  excludeOrderId: order.id,
});

/** Guard pekerja T1 dan D44: anggota usaha, ACTIVE, bersedia ditugaskan, terpetakan ke listing. */
async function assertAssignable(tx: Tx, order: Order, workerId: string) {
  const worker = await tx.providerWorker.findFirst({
    where: { id: workerId, providerProfileId: order.providerProfileId },
    select: {
      id: true,
      userId: true,
      displayName: true,
      membershipStatus: true,
      acceptsAssignments: true,
      listings: { where: { listingId: order.listingId }, select: { id: true } },
    },
  });
  if (!worker || worker.membershipStatus !== 'ACTIVE' || !worker.acceptsAssignments) {
    throw new AppError('WORKER_NOT_ASSIGNABLE', 'Pekerja tidak aktif atau tidak bersedia ditugaskan');
  }
  if (worker.listings.length === 0) {
    throw new AppError('WORKER_NOT_MAPPED_TO_LISTING', 'Pekerja tidak terpetakan ke listing ini');
  }
  return worker;
}

/** D69, H47: pendamping hanya Scheduled, anggota ACTIVE usaha itu, bukan penanggung jawab. */
async function assertCrew(tx: Tx, order: Order, crewIds: string[], assigneeId: string): Promise<void> {
  if (crewIds.length === 0) return;
  if (order.bookingMode !== 'SCHEDULED') {
    throw new AppError('CREW_NOT_ALLOWED_FOR_MODE', 'Pendamping hanya tersedia pada mode Scheduled');
  }
  if (crewIds.includes(assigneeId)) {
    throw new AppError('WORKER_NOT_ASSIGNABLE', 'Penanggung jawab tidak bisa sekaligus jadi pendamping');
  }
  const found = await tx.providerWorker.count({
    where: { id: { in: crewIds }, providerProfileId: order.providerProfileId, membershipStatus: 'ACTIVE' },
  });
  // Tidak kembar (Zod) dan bukan penanggung jawab, jadi jumlahnya otomatis <= pekerja aktif - 1.
  if (found !== crewIds.length) throw new AppError('WORKER_NOT_ASSIGNABLE', 'Pendamping harus pekerja aktif usaha ini');
}

/** Operasi non-transisi (Bagian 4) hanya sebelum ON_THE_WAY, dan order sudah punya penanggung jawab. */
function assertBeforeDeparture(order: Order): void {
  if (order.status !== 'ACCEPTED' && order.status !== 'PAID') {
    throw new AppError('ORDER_TRANSITION_NOT_ALLOWED', `Tidak bisa diubah saat order berstatus ${order.status}`);
  }
}

const parties = (tx: Tx, orderId: string) =>
  tx.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { clientId: true, providerProfile: { select: { userId: true } }, assignedWorker: { select: { userId: true } } },
  });

// ---------------------------------------------------------------------------
// T1, T2
// ---------------------------------------------------------------------------

export async function acceptOrder(access: OrderAccess, orderId: string, body: AcceptOrderBody): Promise<OrderDto> {
  const actor = actorFrom(access, ['PROVIDER']);
  const paymentDeadlineAt = new Date(Date.now() + (await getNumberSetting('payment_window_minutes')) * MINUTE);

  await withOrderTransaction(async (tx, afterCommit) => {
    let assignee!: Awaited<ReturnType<typeof assertAssignable>>;
    await transitionOrder(tx, {
      orderId,
      toStatus: 'ACCEPTED',
      actor,
      actorUserId: access.userId,
      data: { assignedWorkerId: body.assigned_worker_id, acceptedBy: access.userId, paymentDeadlineAt },
      guard: async (tx, order) => {
        // shortcut: klaim dan pilihan pemilik Available Now (order_offers, D102) masuk sesi 6d.
        if (order.bookingMode !== 'SCHEDULED') {
          throw new AppError('ORDER_TRANSITION_NOT_ALLOWED', 'Penerimaan order Available Now belum tersedia');
        }
        if (!order.responseDeadlineAt || order.responseDeadlineAt <= new Date()) {
          throw new AppError('RESPONSE_DEADLINE_PASSED', 'Batas waktu menerima order sudah lewat');
        }
        const listing = await tx.listing.count({ where: { id: order.listingId, status: 'ACTIVE', deletedAt: null } });
        if (!listing) throw new AppError('LISTING_NOT_AVAILABLE', 'Listing tidak lagi aktif');

        await lockWorkers(tx, [body.assigned_worker_id, ...body.crew_worker_ids]);
        assignee = await assertAssignable(tx, order, body.assigned_worker_id);
        await assertCrew(tx, order, body.crew_worker_ids, assignee.id);
        await assertWorkersFree(tx, [assignee.id, ...body.crew_worker_ids], slotOf(order));
      },
      effects: async (tx, order) => {
        await tx.order.update({ where: { id: orderId }, data: { snapshotAssigneeName: assignee.displayName } });
        if (body.crew_worker_ids.length > 0) {
          await tx.orderCrew.createMany({
            data: body.crew_worker_ids.map((workerId) => ({ orderId, workerId, addedBy: access.userId })),
          });
        }
        const payment = await createPendingPayment(tx, order, paymentDeadlineAt);
        const emails = await notifyUsers(tx, [order.clientId, access.userId, assignee.userId], order, 'Order diterima',
          `Order diterima dan ditangani ${assignee.displayName}. Selesaikan pembayaran sebelum ${paymentDeadlineAt.toISOString()}.`);
        afterCommit(() => void dispatchEmails(emails));
        // Usulan D104: gagal di sini tidak membatalkan T1, invoice_url tetap null.
        afterCommit(() => issueInvoice(payment.id));
      },
    });
  });
  return getOrder(orderId);
}

export async function rejectOrder(access: OrderAccess, orderId: string, body: ReasonBody): Promise<OrderDto> {
  const actor = actorFrom(access, ['PROVIDER']);
  await withOrderTransaction(async (tx, afterCommit) => {
    await transitionOrder(tx, {
      orderId,
      toStatus: 'REJECTED',
      actor,
      actorUserId: access.userId,
      reason: body.reason,
      data: { cancellationReason: body.reason ?? null },
      guard: async (_tx, order) => {
        if (!order.responseDeadlineAt || order.responseDeadlineAt <= new Date()) {
          throw new AppError('RESPONSE_DEADLINE_PASSED', 'Batas waktu menanggapi order sudah lewat');
        }
      },
      effects: async (tx, order) => {
        const emails = await notifyUsers(tx, [order.clientId, access.userId], order, 'Order ditolak',
          `Order ditolak penyedia.${body.reason ? ` Alasan: ${body.reason}` : ''}`);
        afterCommit(() => void dispatchEmails(emails));
      },
    });
  });
  return getOrder(orderId);
}

// ---------------------------------------------------------------------------
// T4, T7
// ---------------------------------------------------------------------------

export async function cancelOrder(access: OrderAccess, orderId: string, body: ReasonBody): Promise<OrderDto> {
  const actor = actorFrom(access, ['CLIENT', 'PROVIDER', 'ADMIN']);
  await withOrderTransaction(async (tx, afterCommit) => {
    await transitionOrder(tx, {
      orderId,
      toStatus: 'CANCELLED',
      actor,
      actorUserId: access.userId,
      reason: body.reason,
      data: { cancellationReason: body.reason ?? null },
      guard: async (tx, order) => {
        // shortcut: T9 dan T11 (setelah bayar) menunggu refund Fase 8 (D101 no. 5).
        if (order.status === 'PAID' || order.status === 'ON_THE_WAY') {
          throw new AppError('ORDER_TRANSITION_NOT_ALLOWED', 'Pembatalan setelah pembayaran belum tersedia');
        }
        if (await tx.payment.count({ where: { orderId, status: 'PAID' } })) {
          throw new AppError('ORDER_ALREADY_PAID', 'Order sudah dibayar');
        }
      },
      effects: async (tx, order) => {
        // Slot pekerja dan pendamping lepas sendiri karena CANCELLED tidak dihitung lagi (H26).
        const invoiceIds = await expirePendingPayments(tx, orderId);
        const who = await parties(tx, orderId);
        // Usulan D106 no. 3: pihak lawan diberi tahu.
        const recipients = actor === 'CLIENT' ? [who.providerProfile.userId] : [order.clientId];
        const emails = await notifyUsers(tx, [...recipients, who.assignedWorker?.userId], order, 'Order dibatalkan',
          `Order dibatalkan oleh ${actor === 'CLIENT' ? 'client' : 'penyedia'}.${body.reason ? ` Alasan: ${body.reason}` : ''}`);
        afterCommit(() => void dispatchEmails(emails));
        if (invoiceIds.length > 0) afterCommit(() => expireInvoices(invoiceIds));
      },
    });
  });
  return getOrder(orderId);
}

// ---------------------------------------------------------------------------
// Bagian 4: bukan transisi, tetap dicatat di histori
// ---------------------------------------------------------------------------

/** PATCH /orders/:id/assignment (D44, State Machine 4.1). */
export async function changeAssignment(access: OrderAccess, orderId: string, workerId: string): Promise<OrderDto> {
  actorFrom(access, ['PROVIDER']);
  await withOrderTransaction(async (tx, afterCommit) => {
    const order = await lockOrder(tx, orderId);
    assertBeforeDeparture(order);
    if (workerId === order.assignedWorkerId) {
      throw new AppError('WORKER_NOT_ASSIGNABLE', 'Pekerja itu sudah menjadi penanggung jawab order ini');
    }
    if (await tx.orderCrew.count({ where: { orderId, workerId } })) {
      throw new AppError('WORKER_NOT_ASSIGNABLE', 'Pekerja itu pendamping order ini, keluarkan dulu dari daftar pendamping');
    }
    await lockWorkers(tx, [workerId]);
    const assignee = await assertAssignable(tx, order, workerId);
    await assertWorkersFree(tx, [workerId], slotOf(order));

    const before = await parties(tx, orderId);
    await tx.order
      .update({ where: { id: orderId }, data: { assignedWorkerId: workerId, snapshotAssigneeName: assignee.displayName } })
      .catch(rethrowInflight);
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: order.status,
        actor: 'PROVIDER',
        changedByUserId: access.userId,
        metadata: { operation: 'ASSIGNMENT_CHANGED', from_worker_id: order.assignedWorkerId, to_worker_id: workerId },
      },
    });
    const emails = await notifyUsers(tx, [order.clientId, before.assignedWorker?.userId, assignee.userId], order,
      'Penanggung jawab diganti', `Penanggung jawab order sekarang ${assignee.displayName}.`);
    afterCommit(() => void dispatchEmails(emails));
  });
  return getOrder(orderId);
}

/** PUT /orders/:id/crew (D69, State Machine 4.2). Ditulis ulang seluruhnya. */
export async function setCrew(access: OrderAccess, orderId: string, crewIds: string[]): Promise<OrderDto> {
  actorFrom(access, ['PROVIDER']);
  await withOrderTransaction(async (tx) => {
    const order = await lockOrder(tx, orderId);
    if (order.bookingMode !== 'SCHEDULED') {
      throw new AppError('CREW_NOT_ALLOWED_FOR_MODE', 'Pendamping hanya tersedia pada mode Scheduled');
    }
    assertBeforeDeparture(order);
    await lockWorkers(tx, crewIds);
    await assertCrew(tx, order, crewIds, order.assignedWorkerId!);
    await assertWorkersFree(tx, crewIds, slotOf(order));

    await tx.orderCrew.deleteMany({ where: { orderId } });
    await tx.orderCrew.createMany({ data: crewIds.map((workerId) => ({ orderId, workerId, addedBy: access.userId })) });
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: order.status,
        actor: 'PROVIDER',
        changedByUserId: access.userId,
        metadata: { operation: 'CREW_CHANGED', crew_worker_ids: crewIds },
      },
    });
  });
  return getOrder(orderId);
}
