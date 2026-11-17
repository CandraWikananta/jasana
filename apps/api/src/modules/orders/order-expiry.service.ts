/**
 * Transisi order oleh sistem lewat sweep (PRD 7.1, State Machine 3):
 *
 *   expireUnanswered   T3, satu-satunya. Dipanggil penolakan terakhir (D102)
 *                      dan sweep response deadline
 *   sweepSettlements   T18 beserta ESCROW_RELEASE, cron tiap 5 menit (7c)
 *   sweep*Deadlines    cron tiap 1 menit. Kandidat dibaca tanpa kunci, lalu
 *                      tiap order diproses di transaksinya sendiri dengan
 *                      FOR UPDATE SKIP LOCKED, supaya satu order yang gagal
 *                      tidak menggagalkan yang lain dan dua sweep yang
 *                      bersamaan tidak memproses order yang sama
 *   backdateDeadline   hanya router /dev, untuk Postman
 */

import { prisma, type Prisma } from '@jasana/database';
import { AppError } from '../../lib/errors';
import { logger } from '../../lib/logger';
import { emit } from '../../realtime/socket';
import { dispatchNotifications } from '../notifications/email-outbox';
import { recoverWebhookEvents } from '../webhooks/webhooks.service';
import { retryFailedEmails } from '../notifications/email-retry';
import { notifyUsers, parties } from './order-notify';
import { expireInvoices, expirePendingPayments, writeEscrow } from './order-payment.service';
import { lockWorkers } from './order-schedule';
import { transitionOrder, withOrderTransaction, type AfterCommitTask } from './order-transition.service';

type Tx = Prisma.TransactionClient;
type AfterCommit = (task: AfterCommitTask) => void;

const BATCH = 100;

/**
 * T3 PENDING_ACCEPTANCE -> EXPIRED. Mengembalikan jumlah SLA miss. Pada jalur
 * ALL_DECLINED tidak ada penerima yang tersisa, jadi SLA miss selalu nol.
 */
export async function expireUnanswered(
  tx: Tx,
  afterCommit: AfterCommit,
  orderId: string,
  cause: 'ALL_DECLINED' | 'DEADLINE',
): Promise<number> {
  let slaMissed = 0;
  await transitionOrder(tx, {
    orderId,
    afterCommit,
    toStatus: 'EXPIRED',
    actor: 'SYSTEM',
    reason: cause === 'DEADLINE' ? 'Batas waktu respons lewat' : 'Seluruh penerima tawaran menolak (D102)',
    guard: async (tx, order) => {
      const ok =
        cause === 'DEADLINE'
          ? order.responseDeadlineAt !== null && order.responseDeadlineAt <= new Date()
          : (await tx.orderOffer.count({ where: { orderId, declinedAt: null } })) === 0;
      if (!ok) throw new AppError('ORDER_TRANSITION_NOT_ALLOWED', 'Order belum memenuhi syarat kedaluwarsa');
    },
    effects: async (tx, order) => {
      // D57, D102 no. 4: hanya penerima yang belum menolak yang kena SLA miss.
      const missed = await tx.orderOffer.findMany({
        where: { orderId, declinedAt: null },
        select: { workerId: true, worker: { select: { userId: true } } },
      });
      if (missed.length > 0) {
        await tx.orderOffer.updateMany({ where: { orderId, declinedAt: null }, data: { slaMissedAt: new Date() } });
        await tx.providerWorker.updateMany({ where: { id: { in: missed.map((m) => m.workerId) } }, data: { isAvailable: false } });
      }
      slaMissed = missed.length;

      const who = await parties(tx, orderId);
      const emails = await notifyUsers(tx, [order.clientId, who.providerProfile.userId], order, 'Order kedaluwarsa',
        cause === 'DEADLINE'
          ? 'Penyedia tidak merespons sebelum batas waktu. Silakan pesan ulang.'
          : 'Tidak ada pekerja yang bisa mengambil order ini. Silakan pesan ulang.');
      // Usulan D116: pekerja tahu kenapa tawaran berhenti masuk.
      emails.push(...(await notifyUsers(tx, missed.map((m) => m.worker.userId), order, 'Toggle Available Now dimatikan',
        'Anda tidak merespons tawaran order ini sebelum batas waktu, jadi toggle Available Now Anda dimatikan. Nyalakan lagi saat siap menerima order.')));
      afterCommit(() => void dispatchNotifications(emails));
      afterCommit(() =>
        emit([...missed.map((m) => `user:${m.worker.userId}`), `provider:${order.providerProfileId}`], 'order:offer_closed', {
          order_id: orderId,
          reason: 'EXPIRED',
        }),
      );
    },
  });
  return slaMissed;
}

/**
 * T6 ACCEPTED -> PAYMENT_EXPIRED. Slot lepas sendiri karena status keluar dari ACCEPTED (H26).
 * Diekspor untuk seed simulasi, supaya kedaluwarsa bayar bisa dipicu per order tanpa menyapu order lain.
 */
export async function expireUnpaid(tx: Tx, afterCommit: AfterCommit, orderId: string): Promise<void> {
  await transitionOrder(tx, {
    orderId,
    afterCommit,
    toStatus: 'PAYMENT_EXPIRED',
    actor: 'SYSTEM',
    reason: 'Batas waktu pembayaran lewat',
    guard: async (tx, order) => {
      if (!order.paymentDeadlineAt || order.paymentDeadlineAt > new Date()) {
        throw new AppError('ORDER_TRANSITION_NOT_ALLOWED', 'Batas waktu pembayaran belum lewat');
      }
      if (await tx.payment.count({ where: { orderId, status: 'PAID' } })) {
        throw new AppError('ORDER_ALREADY_PAID', 'Order sudah dibayar');
      }
    },
    effects: async (tx, order) => {
      const invoiceIds = await expirePendingPayments(tx, orderId);
      const who = await parties(tx, orderId);
      const emails = await notifyUsers(tx, [order.clientId, who.providerProfile.userId, who.assignedWorker?.userId], order,
        'Pembayaran kedaluwarsa', 'Batas waktu pembayaran lewat, order dibatalkan otomatis dan jadwal pekerja dilepas.');
      afterCommit(() => void dispatchNotifications(emails));
      if (invoiceIds.length > 0) afterCommit(() => expireInvoices(invoiceIds));
    },
  });
}

/** Dispute yang menahan settlement (State Machine 3, T18). */
const HOLDING_DISPUTES = ['OPEN', 'UNDER_REVIEW'] as const;

/**
 * T18 COMPLETED -> SETTLED. Kunci order (transitionOrder) lalu wallet (UPDATE di
 * writeEscrow), urutan yang sama dengan T5 (register Bagian 4P).
 * Diekspor untuk test balapan H100.
 */
export async function settleOrder(tx: Tx, afterCommit: AfterCommit, orderId: string): Promise<void> {
  await transitionOrder(tx, {
    orderId,
    afterCommit,
    toStatus: 'SETTLED',
    actor: 'SYSTEM',
    reason: 'Holding window lewat',
    guard: async (tx, order) => {
      if (!order.settlementDueAt || order.settlementDueAt >= new Date()) {
        throw new AppError('ORDER_TRANSITION_NOT_ALLOWED', 'Holding window belum lewat');
      }
      if (await tx.dispute.count({ where: { orderId, status: { in: [...HOLDING_DISPUTES] } } })) {
        throw new AppError('ORDER_TRANSITION_NOT_ALLOWED', 'Order sedang dalam sengketa');
      }
    },
    effects: async (tx, order) => {
      await writeEscrow(tx, order, 'ESCROW_RELEASE');
      const who = await parties(tx, orderId);
      const emails = await notifyUsers(tx, [who.providerProfile.userId], order, 'Dana order cair',
        'Holding window sudah lewat, pendapatan order ini dipindahkan ke saldo yang bisa ditarik.');
      afterCommit(() => void dispatchNotifications(emails));
    },
  });
}

export interface SweepResult {
  candidates: number;
  expired: number;
  failed: number;
  sla_missed: number;
}

/** `one` mengembalikan null kalau order dilewati (dipegang pihak lain atau sudah berubah). */
async function sweep(
  job: string,
  candidates: { id: string }[],
  one: (orderId: string) => Promise<number | null>,
  outcome: 'expired' | 'settled' = 'expired',
): Promise<SweepResult> {
  const result: SweepResult = { candidates: candidates.length, expired: 0, failed: 0, sla_missed: 0 };
  for (const { id } of candidates) {
    try {
      const slaMissed = await one(id);
      if (slaMissed !== null) {
        result.expired += 1;
        result.sla_missed += slaMissed;
      }
    } catch (error) {
      result.failed += 1;
      logger.error({ err: error, job, order_id: id }, 'Sweep gagal untuk satu order, order lain tetap diproses');
    }
  }
  // Hanya nama kunci di log yang ikut `outcome`; SweepResult tetap, karena Postman Fase 6 membacanya.
  const { candidates: total, expired, failed, sla_missed } = result;
  logger.info(
    { job, candidates: total, failed, ...(outcome === 'settled' ? { settled: expired } : { expired, sla_missed }) },
    'Sweep deadline selesai',
  );
  return result;
}

// shortcut: satu batch 100 per jalan (T3, T6, T18); order yang gagal permanen di kepala antrean bisa menahan sisanya kalau jumlahnya >= 100, ganti ke kursor keyset kalau itu terjadi.
export async function sweepResponseDeadlines(): Promise<SweepResult> {
  const candidates = await prisma.order.findMany({
    where: { status: 'PENDING_ACCEPTANCE', responseDeadlineAt: { lt: new Date() } },
    orderBy: { responseDeadlineAt: 'asc' },
    take: BATCH,
    select: { id: true },
  });
  return sweep('response-deadline-sweep', candidates, (orderId) =>
    withOrderTransaction(async (tx, afterCommit) => {
      // Pekerja dulu baru order, urutan yang sama dengan klaim Available Now. Dibalik, cron
      // yang memegang order lalu mematikan toggle bisa deadlock dengan klaim yang sedang jalan.
      const open = await tx.orderOffer.findMany({ where: { orderId, declinedAt: null }, select: { workerId: true } });
      await lockWorkers(tx, open.map((o) => o.workerId));
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM orders
        WHERE id = ${orderId}::uuid AND status = 'PENDING_ACCEPTANCE' AND response_deadline_at < now()
        FOR UPDATE SKIP LOCKED
      `;
      if (locked.length === 0) return null;
      return expireUnanswered(tx, afterCommit, orderId, 'DEADLINE');
    }),
  );
}

export async function sweepPaymentDeadlines(): Promise<SweepResult> {
  const candidates = await prisma.order.findMany({
    where: { status: 'ACCEPTED', paymentDeadlineAt: { lt: new Date() } },
    orderBy: { paymentDeadlineAt: 'asc' },
    take: BATCH,
    select: { id: true },
  });
  return sweep('payment-deadline-sweep', candidates, (orderId) =>
    withOrderTransaction(async (tx, afterCommit) => {
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM orders
        WHERE id = ${orderId}::uuid AND status = 'ACCEPTED' AND payment_deadline_at < now()
        FOR UPDATE SKIP LOCKED
      `;
      if (locked.length === 0) return null;
      await expireUnpaid(tx, afterCommit, orderId);
      return 0;
    }),
  );
}

export async function sweepSettlements(): Promise<{ candidates: number; settled: number; failed: number }> {
  const candidates = await prisma.order.findMany({
    where: {
      status: 'COMPLETED',
      settlementDueAt: { lt: new Date() },
      // Disaring di sini supaya order bersengketa tidak menyumbat kepala antrean. Guard tetap memeriksa ulang.
      OR: [{ dispute: null }, { dispute: { status: { notIn: [...HOLDING_DISPUTES] } } }],
    },
    orderBy: { settlementDueAt: 'asc' },
    take: BATCH,
    select: { id: true },
  });
  const { expired: settled, failed } = await sweep('settlement-sweep', candidates, (orderId) =>
    withOrderTransaction(async (tx, afterCommit) => {
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM orders
        WHERE id = ${orderId}::uuid AND status = 'COMPLETED' AND settlement_due_at < now()
        FOR UPDATE SKIP LOCKED
      `;
      if (locked.length === 0) return null;
      await settleOrder(tx, afterCommit, orderId);
      return 0;
    }),
    'settled',
  );
  return { candidates: candidates.length, settled, failed };
}

/** Router /dev: job yang bisa dipicu manual, fungsi yang sama dengan cron. */
export const DEV_JOBS = {
  'response-deadline': sweepResponseDeadlines,
  'payment-deadline': sweepPaymentDeadlines,
  settlement: sweepSettlements,
  'webhook-recovery': recoverWebhookEvents,
  'email-retry': retryFailedEmails,
} as const;
export type DevJob = keyof typeof DEV_JOBS;

const DEADLINE_STATUS = {
  response_deadline_at: 'PENDING_ACCEPTANCE',
  payment_deadline_at: 'ACCEPTED',
  settlement_due_at: 'COMPLETED',
} as const;
export type DeadlineField = keyof typeof DEADLINE_STATUS;
const DEADLINE_COLUMN = {
  response_deadline_at: 'responseDeadlineAt',
  payment_deadline_at: 'paymentDeadlineAt',
  settlement_due_at: 'settlementDueAt',
} as const;

/** Router /dev: memundurkan deadline ke masa lalu supaya sweep bisa diuji tanpa menunggu. */
export async function backdateDeadline(orderId: string, field: DeadlineField) {
  const at = new Date(Date.now() - 1000);
  const { count } = await prisma.order.updateMany({
    where: { id: orderId, status: DEADLINE_STATUS[field] },
    data: { [DEADLINE_COLUMN[field]]: at },
  });
  if (count === 0) {
    throw new AppError('ORDER_TRANSITION_NOT_ALLOWED', `${field} hanya bisa dimundurkan saat order ${DEADLINE_STATUS[field]}`);
  }
  return { order_id: orderId, [field]: at.toISOString() };
}
