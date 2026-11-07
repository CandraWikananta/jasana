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

/** Mengembalikan baris order SEBELUM transisi. Wajib dipanggil di dalam transaksi. */
export async function transitionOrder(tx: Tx, input: TransitionInput): Promise<{ order: Order }> {
  const { orderId, toStatus, actor, actorUserId } = input;

  // Kunci barisnya supaya dua request bersamaan tidak sama-sama lolos. `SELECT id`
  // lalu baca lewat Prisma, karena `SELECT *` mentah mengembalikan kolom snake_case.
  const locked = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM orders WHERE id = ${orderId}::uuid FOR UPDATE
  `;
  if (locked.length === 0) throw Errors.notFound('Order tidak ditemukan');
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });

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

  await input.guard?.(tx, order);

  // UPDATE bersyarat pada status lama. Dengan FOR UPDATE di atas ini seharusnya
  // selalu satu baris; kalau tidak, ada penulis status di luar fungsi ini.
  const updated = await tx.order.updateMany({
    where: { id: orderId, status: order.status },
    data: { ...timestampFor(toStatus, actor), ...input.data, status: toStatus },
  });
  if (updated.count !== 1) {
    throw new AppError('ORDER_TRANSITION_NOT_ALLOWED', `Status order berubah sebelum transisi ${key}`);
  }

  await tx.orderStatusHistory.create({
    data: {
      orderId,
      fromStatus: order.status,
      toStatus,
      actor,
      changedByUserId: actorUserId ?? null,
      reason: input.reason ?? null,
    },
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
