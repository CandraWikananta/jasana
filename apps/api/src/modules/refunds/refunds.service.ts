/**
 * Refund (D131, D135, D136, usulan D140 sampai D144).
 *
 *   createRefund      di dalam transaksi pemicu (T9, T11, D119). Baris FULL, eksekusi setelah commit
 *   executeRefund     jalur dipilih dari payments.payment_method, tidak pernah dari error_code
 *   applyRefundEvent  transaksi 2 webhook refund, dipakai juga oleh sync (H106)
 *   completeManually  jalur manual admin, dari FAILED atau REQUESTED non-API
 *   syncRefund        tanya status ke Xendit, lalu applyRefundEvent yang sama
 *
 * Ledger tidak pernah ditulis di sini: REFUND_DEDUCTION sudah ditulis transisi
 * pemicunya (D132), dan refund D119 tidak punya ESCROW_HOLD sama sekali.
 * Urutan kunci di setiap jalur: order dulu, lalu refund.
 */

import { prisma, Prisma, type Order, type Payment, type Refund, type RefundType } from '@jasana/database';
import { AppError, Errors } from '../../lib/errors';
import { logger } from '../../lib/logger';
import { pageMeta, skipTake, type Paginated } from '../../lib/pagination';
import { paymentGateway, type GatewayRecord } from '../../lib/payment-gateway';
import { dispatchNotifications } from '../notifications/email-outbox';
import { notifyUsers } from '../orders/order-notify';
import { lockOrder, transitionOrder, withOrderTransaction, type AfterCommitTask } from '../orders/order-transition.service';
import type { RefundCallback } from '../webhooks/webhooks.schema';
import type { AdminRefundsQuery } from './refunds.schema';

type Tx = Prisma.TransactionClient;
type AfterCommit = (task: AfterCommitTask) => void;

/** D136 no. 1. FAKE ikut jalur API supaya jalur itu teruji dengan gateway palsu. */
const API_METHODS: ReadonlySet<string> = new Set(['EWALLET', 'FAKE']);
export const usesRefundApi = (paymentMethod: string | null) => paymentMethod !== null && API_METHODS.has(paymentMethod);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const rupiah = (value: Prisma.Decimal) => `Rp${value.toNumber().toLocaleString('id-ID')}`;
const iso = (value: Date | null) => value?.toISOString() ?? null;

const DTO_INCLUDE = { order: { select: { orderNumber: true } }, payment: { select: { paymentMethod: true } } } as const;
type RefundRow = Prisma.RefundGetPayload<{ include: typeof DTO_INCLUDE }>;

function toDto(r: RefundRow) {
  return {
    id: r.id,
    order_id: r.orderId,
    order_number: r.order.orderNumber,
    payment_id: r.paymentId,
    payment_method: r.payment.paymentMethod,
    type: r.type,
    amount: r.amount.toNumber(),
    includes_platform_fee: r.includesPlatformFee,
    reason: r.reason,
    status: r.status,
    xendit_refund_id: r.xenditRefundId,
    initiated_by: r.initiatedBy,
    completed_by: r.completedBy,
    completion_note: r.completionNote,
    created_at: r.createdAt.toISOString(),
    completed_at: iso(r.completedAt),
  };
}

const getDto = async (id: string) => toDto(await prisma.refund.findUniqueOrThrow({ where: { id }, include: DTO_INCLUDE }));

type LockedRefund = Refund & { payment: { paymentMethod: string | null; xenditInvoiceId: string | null } };

async function lockRefund(tx: Tx, id: string): Promise<LockedRefund> {
  await tx.$queryRaw`SELECT id FROM refunds WHERE id = ${id}::uuid FOR UPDATE`;
  return tx.refund.findUniqueOrThrow({ where: { id }, include: { payment: { select: { paymentMethod: true, xenditInvoiceId: true } } } });
}

const stateConflict = (r: Refund, action: string) =>
  new AppError('REFUND_STATE_CONFLICT', `Refund berstatus ${r.status} tidak bisa ${action}`);

// ---------------------------------------------------------------------------
// Pembuatan dan eksekusi
// ---------------------------------------------------------------------------

/**
 * Di dalam transaksi pemicu. D131: penuh. Usulan D140: nominalnya uang yang
 * benar-benar masuk, supaya refund D119 tidak bergantung pada tagihan.
 */
export async function createRefund(
  tx: Tx,
  afterCommit: AfterCommit,
  input: { orderId: string; payment: Payment; initiatedBy: string | null; reason: string; type?: RefundType; amount?: Prisma.Decimal },
): Promise<Refund> {
  const refund = await tx.refund.create({
    data: {
      orderId: input.orderId,
      paymentId: input.payment.id,
      // PARTIAL hanya dari putusan sengketa (T20, D133), nominalnya refund_amount.
      type: input.type ?? 'FULL',
      amount: input.amount ?? input.payment.paidAmount ?? input.payment.amount,
      includesPlatformFee: true,
      reason: input.reason,
      initiatedBy: input.initiatedBy,
    },
  });
  afterCommit(() => executeRefund(refund.id));
  return refund;
}

const gatewayStatusOf = (error: unknown) => {
  const status = error instanceof AppError ? error.context?.gateway_status : undefined;
  return typeof status === 'number' ? status : null;
};

/**
 * Usulan D140, di luar transaksi (jebakan 7). Hanya bergerak dari REQUESTED,
 * jadi aman dipanggil ulang. Idempotency key tetap `refunds.id` (D136):
 *   diterima               PROCESSING, xendit_refund_id diisi
 *   timeout, jaringan, 5xx, 409, balasan aneh   PROCESSING tanpa id, status belum pasti
 *   4xx selain 409         FAILED, jalur API buntu, diselesaikan manual
 * Tidak pernah melempar: pemanggilnya afterCommit atau sync.
 */
export async function executeRefund(id: string): Promise<void> {
  const refund = await prisma.refund.findUniqueOrThrow({
    where: { id },
    include: { payment: { select: { paymentMethod: true, xenditInvoiceId: true } }, order: { select: { dispute: { select: { id: true } } } } },
  });
  if (refund.status !== 'REQUESTED' || !usesRefundApi(refund.payment.paymentMethod)) return;
  // Usulan D149: refund putusan sengketa. Pembatalan dan D119 tidak pernah punya dispute (dispute baru sejak ARRIVED).
  const reason = refund.order.dispute ? 'OTHERS' : 'CANCELLATION';
  const log = { refund_id: id, order_id: refund.orderId };

  const invoiceId = refund.payment.xenditInvoiceId;
  if (!invoiceId) {
    // Refund legacy butuh invoice_id. Tanpanya jalur API pasti buntu.
    await prisma.refund.updateMany({ where: { id, status: 'REQUESTED' }, data: { status: 'FAILED' } });
    logger.error(log, 'Payment tanpa invoice id, refund dialihkan ke jalur manual');
    return;
  }

  try {
    const result = await paymentGateway.refund({ referenceId: id, invoiceId, amount: refund.amount.toNumber(), reason });
    // Nol baris kalau webhook sudah mendahului.
    await prisma.refund.updateMany({ where: { id, status: 'REQUESTED' }, data: { status: 'PROCESSING', xenditRefundId: result.refundId } });
  } catch (error) {
    const status = gatewayStatusOf(error);
    // Usulan D140 no. 3: 409 berarti key sudah dipakai, refund mungkin ada. Polanya D139.
    const final = status !== null && status >= 400 && status < 500 && status !== 409;
    await prisma.refund.updateMany({ where: { id, status: 'REQUESTED' }, data: { status: final ? 'FAILED' : 'PROCESSING' } });
    const context = error instanceof AppError ? error.context : undefined;
    logger.error(
      { ...log, err: error instanceof AppError ? undefined : error, gateway: context },
      final ? 'Refund ditolak gateway, dialihkan ke jalur manual' : 'Status refund belum pasti, menunggu webhook atau sinkronisasi',
    );
  }
}

// ---------------------------------------------------------------------------
// Penyelesaian
// ---------------------------------------------------------------------------

/** T22 hanya untuk order yang batal lewat T9 atau T11, bukan order D119 yang batal lewat T4/T7 (D135). */
async function cancelledAfterPayment(tx: Tx, orderId: string): Promise<boolean> {
  const count = await tx.orderStatusHistory.count({ where: { orderId, toStatus: 'CANCELLED', fromStatus: { in: ['PAID', 'ON_THE_WAY'] } } });
  return count > 0;
}

interface Completion {
  xenditRefundId?: string;
  completedBy?: string;
  completionNote?: string;
}

/** Dipakai webhook, sync, dan jalur manual. Order dan refund sudah dikunci pemanggil. */
async function completeRefund(tx: Tx, afterCommit: AfterCommit, refund: Refund, order: Order, completion: Completion): Promise<void> {
  await tx.refund.update({
    where: { id: refund.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      xenditRefundId: refund.xenditRefundId ?? completion.xenditRefundId ?? null,
      completedBy: completion.completedBy ?? null,
      completionNote: completion.completionNote ?? null,
    },
  });

  if (order.status === 'CANCELLED' && (await cancelledAfterPayment(tx, order.id))) {
    // T22. Aktor tetap SYSTEM, admin jalur manual dicatat di metadata histori.
    await transitionOrder(tx, {
      orderId: order.id,
      afterCommit,
      toStatus: 'REFUNDED',
      actor: 'SYSTEM',
      ...(completion.completedBy
        ? { metadata: { operation: 'REFUND_COMPLETED_MANUALLY', admin_user_id: completion.completedBy, refund_id: refund.id } }
        : {}),
    });
  }

  const emails = await notifyUsers(tx, [order.clientId], order, 'Refund selesai', `Dana ${rupiah(refund.amount)} sudah dikembalikan.`);
  afterCommit(() => void dispatchNotifications(emails));
}

export interface RefundOutcome {
  status: 'PROCESSED' | 'IGNORED';
  message?: string;
}

/** Transaksi 2 webhook refund, juga dipakai sync (H106). Dicocokkan lewat `reference_id` = `refunds.id` (D136 no. 4). */
export async function applyRefundEvent(tx: Tx, afterCommit: AfterCommit, event: Pick<RefundCallback, 'data'>): Promise<RefundOutcome> {
  const { id: xenditRefundId, status, reference_id: referenceId, failure_code: failureCode } = event.data;
  if (!UUID.test(referenceId)) return { status: 'IGNORED', message: `reference_id ${referenceId} bukan id refund (D136)` };
  const found = await tx.refund.findUnique({ where: { id: referenceId }, select: { orderId: true } });
  if (!found) return { status: 'IGNORED', message: 'reference_id tidak cocok dengan refund mana pun (D136)' };

  const order = await lockOrder(tx, found.orderId);
  const refund = await lockRefund(tx, referenceId);
  const open = refund.status === 'REQUESTED' || refund.status === 'PROCESSING';
  if (!open || (status !== 'SUCCEEDED' && status !== 'FAILED')) {
    return { status: 'IGNORED', message: `Refund ${status} untuk refund ${refund.status} tidak diproses` };
  }

  if (status === 'SUCCEEDED') {
    await completeRefund(tx, afterCommit, refund, order, { xenditRefundId });
    return { status: 'PROCESSED' };
  }
  await tx.refund.update({ where: { id: refund.id }, data: { status: 'FAILED', xenditRefundId: refund.xenditRefundId ?? xenditRefundId } });
  return { status: 'PROCESSED', message: `Refund gagal (${failureCode ?? 'tanpa failure_code'}), diselesaikan admin lewat jalur manual` };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

/** Antrean, terlama dulu. */
export async function listForAdmin(query: AdminRefundsQuery): Promise<Paginated<ReturnType<typeof toDto>>> {
  // shortcut: filter status tanpa index sendiri (yang ada hanya order_id), tambah @@index([status, createdAt]) kalau antrean membesar.
  const where = query.status ? { status: query.status } : {};
  const [rows, total] = await prisma.$transaction([
    prisma.refund.findMany({ where, orderBy: { createdAt: 'asc' }, include: DTO_INCLUDE, ...skipTake(query) }),
    prisma.refund.count({ where }),
  ]);
  return { items: rows.map(toDto), meta: pageMeta(query, total) };
}

/**
 * Jalur manual (D136 no. 2, usulan D140 dan D142). Dari FAILED untuk metode apa
 * pun. Dari REQUESTED hanya metode non-API: refund EWALLET atau FAKE yang
 * REQUESTED berarti panggilan API belum dijawab, dan menyelesaikannya manual
 * bisa mengembalikan uang dua kali. PROCESSING diselesaikan webhook atau sync.
 */
export async function completeManually(adminId: string, id: string, note: string) {
  await withOrderTransaction(async (tx, afterCommit) => {
    const found = await tx.refund.findUnique({ where: { id }, select: { orderId: true } });
    if (!found) throw Errors.notFound('Refund tidak ditemukan');
    const order = await lockOrder(tx, found.orderId);
    const refund = await lockRefund(tx, id);
    const allowed = refund.status === 'FAILED' || (refund.status === 'REQUESTED' && !usesRefundApi(refund.payment.paymentMethod));
    if (!allowed) throw stateConflict(refund, 'diselesaikan manual');
    await completeRefund(tx, afterCommit, refund, order, { completedBy: adminId, completionNote: note });
  });
  return getDto(id);
}

export interface SyncResult {
  gateway_status: string | null;
  outcome: 'PROCESSED' | 'IGNORED' | 'RETRIED' | 'NOT_FOUND';
  message: string | null;
}

/**
 * H106, usulan D140 no. 5. Dari PROCESSING, atau REQUESTED untuk metode API
 * (eksekusi setelah commit tidak pernah jalan). Record dari Xendit diterapkan
 * lewat `applyRefundEvent` yang sama dengan webhook. Tidak ditemukan dan masih
 * REQUESTED, atau PROCESSING tanpa `xendit_refund_id` (H108): eksekusi diulang,
 * aman karena key-nya tetap `refunds.id`.
 * shortcut: tidak ada cron sync otomatis (usulan D143), tambahkan kalau admin sering lupa menekan sync.
 */
export async function syncRefund(id: string): Promise<{ refund: ReturnType<typeof toDto>; sync: SyncResult }> {
  const refund = await prisma.refund.findUnique({ where: { id }, include: { payment: { select: { paymentMethod: true, xenditInvoiceId: true } } } });
  if (!refund) throw Errors.notFound('Refund tidak ditemukan');
  const api = usesRefundApi(refund.payment.paymentMethod);
  if (!(refund.status === 'PROCESSING' || (refund.status === 'REQUESTED' && api))) throw stateConflict(refund, 'disinkronkan');

  // Di luar transaksi (jebakan 7). Galat gateway diteruskan jadi 502.
  const invoiceId = refund.payment.xenditInvoiceId;
  const record: GatewayRecord | null =
    refund.xenditRefundId || invoiceId
      ? await paymentGateway.getRefund({ refundId: refund.xenditRefundId, invoiceId: invoiceId ?? '', referenceId: id })
      : null;

  let sync: SyncResult;
  if (record) {
    const result = await withOrderTransaction((tx, afterCommit) => applyRefundEvent(tx, afterCommit, { data: record }));
    sync = { gateway_status: record.status, outcome: result.status, message: result.message ?? null };
  } else if (refund.status === 'REQUESTED' || refund.xenditRefundId === null) {
    // H108: PROCESSING tanpa id yang tidak ada di Xendit berarti panggilannya tidak pernah sampai.
    // Nol baris kalau webhook mendahului, lalu executeRefund tidak melakukan apa pun.
    if (refund.status === 'PROCESSING') {
      await prisma.refund.updateMany({ where: { id, status: 'PROCESSING', xenditRefundId: null }, data: { status: 'REQUESTED' } });
    }
    await executeRefund(id);
    sync = { gateway_status: null, outcome: 'RETRIED', message: 'Refund tidak ditemukan di Xendit, eksekusi diulang dengan key yang sama' };
  } else {
    sync = { gateway_status: null, outcome: 'NOT_FOUND', message: 'Refund tidak ditemukan di Xendit' };
  }
  logger.info({ refund_id: id, ...sync }, 'Sinkronisasi refund');
  return { refund: await getDto(id), sync };
}
