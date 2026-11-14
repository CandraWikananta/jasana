/**
 * Aksi pada satu order (PRD 4.3): accept (T1, termasuk klaim Available Now),
 * decline-offer, reject (T2), cancel (T4, T7, dan sejak 8c T9, T11),
 * ganti penanggung jawab (D44) dan pendamping (D69). Seluruhnya di belakang
 * requireOrderParticipant.
 *
 * Peran pelaku dipilih PER ENDPOINT dari daftar yang endpoint itu terima,
 * bukan prioritas global: di 6e pemilik INDIVIDUAL yang juga penanggung jawab
 * harus bertindak sebagai WORKER, sedangkan di sini sebagai PROVIDER.
 */

import { prisma, type Order, type Payment, type Prisma } from '@jasana/database';
import { AppError, Errors } from '../../lib/errors';
import { emit, leaveRoom } from '../../realtime/socket';
import { actorFrom, type OrderAccess } from '../access/access.service';
import { dispatchEmails } from '../notifications/email-outbox';
import { getNumberSetting } from '../settings/settings.service';
import { expireUnanswered } from './order-expiry.service';
import { notifyUsers, parties } from './order-notify';
import { createRefund } from '../refunds/refunds.service';
import { createPendingPayment, expireInvoices, expirePendingPayments, issueInvoice, writeEscrow } from './order-payment.service';
import { assertWorkersFree, lockWorkers, type Slot } from './order-schedule';
import {
  lockOrder,
  recordTransition,
  rethrowInflight,
  transitionOrder,
  withOrderTransaction,
  type AfterCommitTask,
} from './order-transition.service';
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

// ---------------------------------------------------------------------------
// T1, T2
// ---------------------------------------------------------------------------

type Assignee = Awaited<ReturnType<typeof assertAssignable>>;
type AfterCommit = (task: AfterCommitTask) => void;

/** Efek T1 yang sama di kedua mode (State Machine 3, T1). */
async function applyAcceptance(tx: Tx, afterCommit: AfterCommit, order: Order, assignee: Assignee, paymentDeadlineAt: Date) {
  await tx.order.update({ where: { id: order.id }, data: { snapshotAssigneeName: assignee.displayName } });
  const payment = await createPendingPayment(tx, order, paymentDeadlineAt);
  const who = await parties(tx, order.id);
  const emails = await notifyUsers(tx, [order.clientId, who.providerProfile.userId, assignee.userId], order, 'Order diterima',
    `Order diterima dan ditangani ${assignee.displayName}. Selesaikan pembayaran sebelum ${paymentDeadlineAt.toISOString()}.`);
  afterCommit(() => void dispatchEmails(emails));
  // Usulan D104: gagal di sini tidak membatalkan T1, invoice_url tetap null.
  afterCommit(() => issueInvoice(payment.id));
}

/** POST /orders/:id/accept. Mode menentukan jalurnya: Scheduled lewat transitionOrder, Available Now lewat klaim atomik. */
export async function acceptOrder(access: OrderAccess, orderId: string, body: AcceptOrderBody): Promise<OrderDto> {
  const { bookingMode } = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, select: { bookingMode: true } });
  const paymentDeadlineAt = new Date(Date.now() + (await getNumberSetting('payment_window_minutes')) * MINUTE);
  if (bookingMode === 'AVAILABLE_NOW') await claimAvailableNow(access, orderId, body, paymentDeadlineAt);
  else await acceptScheduled(access, orderId, body, paymentDeadlineAt);
  return getOrder(orderId);
}

async function acceptScheduled(access: OrderAccess, orderId: string, body: AcceptOrderBody, paymentDeadlineAt: Date) {
  const actor = actorFrom(access, ['PROVIDER']);
  const assignedWorkerId = body.assigned_worker_id;
  if (!assignedWorkerId) {
    throw Errors.validation([{ path: 'assigned_worker_id', message: 'assigned_worker_id wajib untuk order Scheduled' }]);
  }

  await withOrderTransaction(async (tx, afterCommit) => {
    let assignee!: Assignee;
    await transitionOrder(tx, {
      orderId,
      afterCommit,
      toStatus: 'ACCEPTED',
      actor,
      actorUserId: access.userId,
      data: { assignedWorkerId, acceptedBy: access.userId, paymentDeadlineAt },
      guard: async (tx, order) => {
        if (!order.responseDeadlineAt || order.responseDeadlineAt <= new Date()) {
          throw new AppError('RESPONSE_DEADLINE_PASSED', 'Batas waktu menerima order sudah lewat');
        }
        const listing = await tx.listing.count({ where: { id: order.listingId, status: 'ACTIVE', deletedAt: null } });
        if (!listing) throw new AppError('LISTING_NOT_AVAILABLE', 'Listing tidak lagi aktif');

        await lockWorkers(tx, [assignedWorkerId, ...body.crew_worker_ids]);
        assignee = await assertAssignable(tx, order, assignedWorkerId);
        await assertCrew(tx, order, body.crew_worker_ids, assignee.id);
        await assertWorkersFree(tx, [assignee.id, ...body.crew_worker_ids], slotOf(order));
      },
      effects: async (tx, order) => {
        if (body.crew_worker_ids.length > 0) {
          await tx.orderCrew.createMany({
            data: body.crew_worker_ids.map((workerId) => ({ orderId, workerId, addedBy: access.userId })),
          });
        }
        await applyAcceptance(tx, afterCommit, order, assignee, paymentDeadlineAt);
      },
    });
  });
}

/**
 * T1 Available Now (jebakan 6, State Machine 3.2, H38). TIDAK lewat
 * transitionOrder: SELECT FOR UPDATE tidak cukup karena barisnya belum terkunci
 * saat beberapa pekerja menekan tombol bersamaan. UPDATE bersyarat lebih dulu,
 * baru guard diperiksa di transaksi yang sama (H41); guard gagal = klaim batal.
 *
 * Body kosong: pekerja yang ditawari mengklaim untuk dirinya sendiri. Body
 * berisi `assigned_worker_id`: pemilik memilih dari daftar penerima (D70, D102).
 */
async function claimAvailableNow(access: OrderAccess, orderId: string, body: AcceptOrderBody, paymentDeadlineAt: Date) {
  if (body.crew_worker_ids.length > 0) {
    throw new AppError('CREW_NOT_ALLOWED_FOR_MODE', 'Pendamping hanya tersedia pada mode Scheduled');
  }
  const byOwner = body.assigned_worker_id !== undefined;
  const actor = actorFrom(access, byOwner ? ['PROVIDER'] : ['OFFERED']);
  const workerId = byOwner ? body.assigned_worker_id! : access.offeredWorkerId!;

  await withOrderTransaction(async (tx, afterCommit) => {
    // D102: hanya dari daftar penerima yang belum menolak. Dicek SEBELUM UPDATE supaya id
    // pekerja usaha lain tidak sampai ke index in-flight (beda kode = bocor status sibuknya),
    // dan diulang SESUDAH UPDATE karena penolakan bisa masuk di antaranya.
    const assertOffered = async () => {
      const offer = await tx.orderOffer.findUnique({ where: { orderId_workerId: { orderId, workerId } } });
      if (!offer || offer.declinedAt) {
        throw byOwner
          ? new AppError('WORKER_NOT_ASSIGNABLE', 'Pekerja itu bukan penerima tawaran order ini, atau sudah menolak')
          : new AppError('FORBIDDEN_ACTOR', 'Tawaran ini sudah Anda tolak');
      }
    };
    await assertOffered();
    // Pekerja dulu baru order, supaya klaim dan accept Scheduled untuk pekerja yang sama bergiliran.
    await lockWorkers(tx, [workerId]);
    const claimed = await tx.$queryRaw<{ id: string }[]>`
      UPDATE orders
      SET    status = 'ACCEPTED', assigned_worker_id = ${workerId}::uuid, accepted_by = ${access.userId}::uuid,
             accepted_at = now(), payment_deadline_at = ${paymentDeadlineAt}, updated_at = now()
      WHERE  id = ${orderId}::uuid AND status = 'PENDING_ACCEPTANCE'
        AND  assigned_worker_id IS NULL AND booking_mode = 'AVAILABLE_NOW'
      RETURNING id
    `.catch(rethrowInflight);
    if (claimed.length === 0) {
      const { status } = await tx.order.findUniqueOrThrow({ where: { id: orderId }, select: { status: true } });
      throw status === 'ACCEPTED'
        ? new AppError('ORDER_ALREADY_CLAIMED', 'Order sudah diambil pihak lain')
        : new AppError('ORDER_TRANSITION_NOT_ALLOWED', `Order sudah berstatus ${status}`);
    }

    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    if (!order.responseDeadlineAt || order.responseDeadlineAt <= new Date()) {
      throw new AppError('RESPONSE_DEADLINE_PASSED', 'Batas waktu menerima order sudah lewat');
    }
    const listing = await tx.listing.count({ where: { id: order.listingId, status: 'ACTIVE', deletedAt: null } });
    if (!listing) throw new AppError('LISTING_NOT_AVAILABLE', 'Listing tidak lagi aktif');
    await assertOffered();
    // H41: keadaan bisa berubah sejak tawaran dikirim.
    const assignee = await assertAssignable(tx, order, workerId);
    await assertWorkersFree(tx, [workerId], { start: new Date(), minutes: order.snapshotDurationMinutes ?? 0, excludeOrderId: orderId });

    await recordTransition(tx, afterCommit, {
      orderId,
      fromStatus: 'PENDING_ACCEPTANCE',
      toStatus: 'ACCEPTED',
      actor,
      actorUserId: access.userId,
    });
    await applyAcceptance(tx, afterCommit, order, assignee, paymentDeadlineAt);

    // Kartu hilang dari layar penerima lain dan dashboard pemilik (State Machine 3.2).
    const others = await tx.orderOffer.findMany({
      where: { orderId, workerId: { not: workerId } },
      select: { worker: { select: { userId: true } } },
    });
    afterCommit(() =>
      emit([...others.map((o) => `user:${o.worker.userId}`), `provider:${order.providerProfileId}`], 'order:offer_closed', {
        order_id: orderId,
        reason: 'CLAIMED',
      }),
    );
  });
}

/**
 * POST /orders/:id/decline-offer (D102). Bukan transisi: hanya mengisi
 * `declined_at`. Penolakan terakhir menjalankan T3 di transaksi yang sama.
 * Kunci baris order membuat penolakan terakhir dan klaim yang bersamaan
 * menghasilkan tepat satu hasil.
 */
export async function declineOffer(access: OrderAccess, orderId: string) {
  actorFrom(access, ['OFFERED']);
  const workerId = access.offeredWorkerId!;
  return withOrderTransaction(async (tx, afterCommit) => {
    const order = await lockOrder(tx, orderId);
    if (order.status !== 'PENDING_ACCEPTANCE') {
      throw order.status === 'ACCEPTED'
        ? new AppError('ORDER_ALREADY_CLAIMED', 'Order sudah diambil pihak lain')
        : new AppError('ORDER_TRANSITION_NOT_ALLOWED', `Order sudah berstatus ${order.status}`);
    }
    // Usulan D115: menolak setelah deadline tidak menghapus SLA miss (D102 no. 4).
    if (!order.responseDeadlineAt || order.responseDeadlineAt <= new Date()) {
      throw new AppError('RESPONSE_DEADLINE_PASSED', 'Batas waktu menanggapi tawaran sudah lewat');
    }
    const declined = await tx.orderOffer.updateMany({
      where: { orderId, workerId, declinedAt: null },
      data: { declinedAt: new Date() },
    });
    if (declined.count === 0) throw new AppError('FORBIDDEN_ACTOR', 'Tawaran ini sudah Anda tolak');

    const open = await tx.orderOffer.count({ where: { orderId, declinedAt: null } });
    if (open === 0) await expireUnanswered(tx, afterCommit, orderId, 'ALL_DECLINED');
    return { order_id: orderId, declined: true, order_status: open === 0 ? 'EXPIRED' : 'PENDING_ACCEPTANCE' };
  });
}

export async function rejectOrder(access: OrderAccess, orderId: string, body: ReasonBody): Promise<OrderDto> {
  const actor = actorFrom(access, ['PROVIDER']);
  await withOrderTransaction(async (tx, afterCommit) => {
    await transitionOrder(tx, {
      orderId,
      afterCommit,
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
// T4, T7, T9, T11
// ---------------------------------------------------------------------------

/**
 * Satu endpoint untuk keempat pembatalan. Sebelum bayar (T4, T7) invoice
 * di-expire. Setelah bayar (T9, T11): D131 refund penuh termasuk platform fee,
 * D132 REFUND_DEDUCTION di transaksi yang sama, eksekusi refund setelah commit.
 * Urutan kunci: order (transitionOrder), payment, wallet (writeEscrow).
 * Slot pekerja dan pendamping lepas sendiri karena CANCELLED tidak dihitung lagi (H26).
 */
export async function cancelOrder(access: OrderAccess, orderId: string, body: ReasonBody): Promise<OrderDto> {
  const actor = actorFrom(access, ['CLIENT', 'PROVIDER', 'ADMIN']);
  await withOrderTransaction(async (tx, afterCommit) => {
    let paid: Payment | null = null;
    await transitionOrder(tx, {
      orderId,
      afterCommit,
      toStatus: 'CANCELLED',
      actor,
      actorUserId: access.userId,
      reason: body.reason,
      data: { cancellationReason: body.reason ?? null },
      guard: async (tx, order) => {
        const afterPayment = order.status === 'PAID' || order.status === 'ON_THE_WAY';
        const [locked] = await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM payments WHERE order_id = ${orderId}::uuid AND status = 'PAID' FOR UPDATE
        `;
        if (!afterPayment && locked) throw new AppError('ORDER_ALREADY_PAID', 'Order sudah dibayar');
        if (afterPayment && !locked) throw new AppError('ORDER_TRANSITION_NOT_ALLOWED', 'Order ini tidak punya pembayaran lunas');
        paid = locked ? await tx.payment.findUniqueOrThrow({ where: { id: locked.id } }) : null;
      },
      effects: async (tx, order) => {
        const who = await parties(tx, orderId);
        // Usulan D106 no. 3: pihak lawan diberi tahu.
        const recipients = actor === 'CLIENT' ? [who.providerProfile.userId] : actor === 'PROVIDER' ? [order.clientId] : [order.clientId, who.providerProfile.userId];
        const by = actor === 'CLIENT' ? 'client' : actor === 'PROVIDER' ? 'penyedia' : 'admin';
        let refundNote = '';
        if (paid) {
          // T9, T11. D131: platform fee ikut dikembalikan. Status order tidak disentuh di sini.
          await tx.order.update({ where: { id: orderId }, data: { platformFeeRefunded: order.platformFee } });
          await writeEscrow(tx, order, 'REFUND_DEDUCTION');
          await createRefund(tx, afterCommit, { orderId, payment: paid, initiatedBy: access.userId, reason: body.reason ?? 'Pembatalan setelah pembayaran' });
          refundNote = ' Pembayaran dikembalikan penuh ke client.';
        } else {
          const invoiceIds = await expirePendingPayments(tx, orderId);
          if (invoiceIds.length > 0) afterCommit(() => expireInvoices(invoiceIds));
        }
        const emails = await notifyUsers(tx, [...recipients, who.assignedWorker?.userId], order, 'Order dibatalkan',
          `Order dibatalkan oleh ${by}.${body.reason ? ` Alasan: ${body.reason}` : ''}${refundNote}`);
        afterCommit(() => void dispatchEmails(emails));
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
    afterCommit(() => {
      emit(`order:${orderId}`, 'order:assignment_changed', {
        order_id: orderId,
        from_worker_name: order.snapshotAssigneeName,
        to_worker_name: assignee.displayName,
      });
      // Usulan D109: pekerja lama bukan peserta lagi, kecuali dia pemilik usaha.
      const oldUserId = before.assignedWorker?.userId;
      if (oldUserId && oldUserId !== before.providerProfile.userId) leaveRoom(oldUserId, `order:${orderId}`);
    });
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
