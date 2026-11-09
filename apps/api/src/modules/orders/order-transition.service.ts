/**
 * Satu-satunya pintu perubahan `orders.status` (State Machine Bagian 8).
 *
 * Pengecualian tunggal: klaim atomik Available Now (jebakan 6, sesi 6d).
 *
 * Guard dan efek samping per transisi (Bagian 3) dipasang PEMANGGIL lewat
 * `guard`, `data`, dan `effects`, supaya fungsi ini tetap satu dan tiap
 * endpoint cukup mengisi bagiannya sendiri.
 */

import {
  ALLOWED_ACTORS,
  ALLOWED_TRANSITIONS,
  ASSIGNEE_ONLY_TRANSITIONS,
  actorAllowedForMode,
} from '@jasana/shared';
import { prisma, type Order, type OrderActorType, type OrderStatus, type Prisma } from '@jasana/database';
import { AppError, Errors } from '../../lib/errors';
import { logger } from '../../lib/logger';
import { isInflightViolation } from '../../lib/prisma-errors';
import { emit } from '../../realtime/socket';

type Tx = Prisma.TransactionClient;

export interface TransitionInput {
  orderId: string;
  toStatus: OrderStatus;
  actor: OrderActorType;
  /** Wajib untuk aktor manusia. Lapis 3 memakainya untuk mencocokkan identitas. */
  actorUserId?: string;
  reason?: string;
  /** Kolom tambahan yang ikut di UPDATE yang sama, misalnya `paymentDeadlineAt`. */
  data?: Prisma.OrderUncheckedUpdateManyInput;
  /** Kolom Guard Bagian 3. Melempar untuk menolak, transaksi ikut rollback. */
  guard?: (tx: Tx, order: Order) => Promise<void>;
  /** Kolom Efek Samping Bagian 3, di transaksi yang sama. */
  effects?: (tx: Tx, order: Order) => Promise<void>;
  /** Wajib: `order:status_changed` dikirim dari sini setelah commit (PRD 7.2). */
  afterCommit: (task: AfterCommitTask) => void;
}

export interface TransitionRecord {
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  actor: OrderActorType;
  actorUserId?: string | undefined;
  reason?: string | undefined;
}

/**
 * Histori transisi dan `order:status_changed`, satu tempat untuk seluruh
 * transisi termasuk klaim atomik Available Now yang tidak lewat `transitionOrder`.
 */
export async function recordTransition(tx: Tx, afterCommit: (task: AfterCommitTask) => void, record: TransitionRecord) {
  const history = await tx.orderStatusHistory.create({
    data: {
      orderId: record.orderId,
      fromStatus: record.fromStatus,
      toStatus: record.toStatus,
      actor: record.actor,
      changedByUserId: record.actorUserId ?? null,
      reason: record.reason ?? null,
    },
    select: { createdAt: true },
  });
  afterCommit(() =>
    emit(`order:${record.orderId}`, 'order:status_changed', {
      order_id: record.orderId,
      from_status: record.fromStatus,
      to_status: record.toStatus,
      timestamp: history.createdAt.toISOString(),
    }),
  );
}

/** Kolom waktu yang selalu ikut status tertentu (Bagian 3). */
function timestampFor(toStatus: OrderStatus, actor: OrderActorType): Prisma.OrderUncheckedUpdateManyInput {
  const now = new Date();
  switch (toStatus) {
    case 'ACCEPTED':
      return { acceptedAt: now };
    case 'PAID':
      return { paidAt: now };
    case 'ON_THE_WAY':
      return { startedAt: now };
    case 'COMPLETED':
      return { verifiedAt: now, completedAt: now };
    case 'SETTLED':
      return { settledAt: now };
    case 'REJECTED':
    case 'CANCELLED':
      return { cancelledAt: now, cancelledBy: actor };
    default:
      return {};
  }
}

/**
 * Kunci baris order sampai transaksi selesai, lalu baca lewat Prisma (`SELECT *`
 * mentah mengembalikan kolom snake_case). Dipakai juga operasi non-transisi (Bagian 4).
 */
export async function lockOrder(tx: Tx, orderId: string): Promise<Order> {
  const locked = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM orders WHERE id = ${orderId}::uuid FOR UPDATE
  `;
  if (locked.length === 0) throw Errors.notFound('Order tidak ditemukan');
  return tx.order.findUniqueOrThrow({ where: { id: orderId } });
}

/** PRD 3.4: pelanggaran `uniq_inflight_order_per_worker` (H4) jadi 409, bukan 500. */
export function rethrowInflight(error: unknown): never {
  if (isInflightViolation(error)) {
    throw new AppError('WORKER_HAS_INFLIGHT_ORDER', 'Pekerja sedang mengerjakan order lain');
  }
  throw error;
}

/**
 * Lapis 1 sampai 3 (jebakan 5). Diekspor untuk pola "catat, commit, baru tolak"
 * (check-in dan verify, 6e): percobaan dari orang atau status yang salah ditolak
 * SEBELUM ada yang ditulis.
 */
export async function assertTransition(
  tx: Tx,
  order: Order,
  toStatus: OrderStatus,
  actor: OrderActorType,
  actorUserId?: string,
): Promise<void> {
  const key = `${order.status}->${toStatus}`;

  // Lapis 1: transisi legal?
  if (!ALLOWED_TRANSITIONS[order.status].includes(toStatus)) {
    throw new AppError('ORDER_TRANSITION_NOT_ALLOWED', `Transisi ${key} tidak diizinkan`);
  }

  // Lapis 2: peran berhak, termasuk aturan mode (D70, D102)?
  if (!ALLOWED_ACTORS[key]?.includes(actor)) {
    throw new AppError('FORBIDDEN_ACTOR', `${actor} tidak berhak melakukan transisi ${key}`);
  }
  if (!actorAllowedForMode(key, actor, order.bookingMode)) {
    throw new AppError('FORBIDDEN_ACTOR', 'Order terjadwal hanya bisa diterima pemilik usaha');
  }

  // Lapis 3: IDENTITAS cocok? Hanya penanggung jawab, bukan rekan seusaha atau pendamping.
  if (ASSIGNEE_ONLY_TRANSITIONS.has(key)) {
    const assignee =
      actorUserId && order.assignedWorkerId
        ? await tx.providerWorker.findFirst({
            where: { id: order.assignedWorkerId, userId: actorUserId, membershipStatus: 'ACTIVE' },
            select: { id: true },
          })
        : null;
    if (!assignee) {
      throw new AppError('NOT_ASSIGNED_WORKER', 'Hanya penanggung jawab order ini yang boleh melakukan transisi');
    }
  }
}

/** Mengembalikan baris order SEBELUM transisi. Wajib dipanggil di dalam transaksi. */
export async function transitionOrder(tx: Tx, input: TransitionInput): Promise<{ order: Order }> {
  const { orderId, toStatus, actor, actorUserId } = input;

  // Kunci barisnya supaya dua request bersamaan tidak sama-sama lolos.
  const order = await lockOrder(tx, orderId);
  await assertTransition(tx, order, toStatus, actor, actorUserId);
  const key = `${order.status}->${toStatus}`;

  await input.guard?.(tx, order);

  // UPDATE bersyarat pada status lama. Dengan FOR UPDATE di atas ini seharusnya
  // selalu satu baris; kalau tidak, ada penulis status di luar fungsi ini.
  const updated = await tx.order
    .updateMany({
      where: { id: orderId, status: order.status },
      data: { ...timestampFor(toStatus, actor), ...input.data, status: toStatus },
    })
    .catch(rethrowInflight);
  if (updated.count !== 1) {
    throw new AppError('ORDER_TRANSITION_NOT_ALLOWED', `Status order berubah sebelum transisi ${key}`);
  }

  await recordTransition(tx, input.afterCommit, {
    orderId,
    fromStatus: order.status,
    toStatus,
    actor,
    actorUserId,
    reason: input.reason,
  });

  await input.effects?.(tx, order);

  return { order };
}

export type AfterCommitTask = () => Promise<unknown> | unknown;

/**
 * Transaksi order dengan titik setelah commit (jebakan 7).
 *
 * Panggilan gateway, SMTP, dan emit Socket.IO didaftarkan lewat `afterCommit`
 * dan baru jalan setelah commit. Kalau transaksi rollback, tidak ada yang jalan.
 * Kegagalannya hanya dicatat: API eksternal tidak pernah membatalkan transisi.
 */
export async function withOrderTransaction<T>(
  work: (tx: Tx, afterCommit: (task: AfterCommitTask) => void) => Promise<T>,
): Promise<T> {
  const tasks: AfterCommitTask[] = [];
  const result = await prisma.$transaction((tx) => work(tx, (task) => tasks.push(task)));

  for (const task of tasks) {
    try {
      await task();
    } catch (error) {
      logger.error({ err: error }, 'Tugas setelah commit order gagal, transisi tetap berlaku');
    }
  }
  return result;
}
