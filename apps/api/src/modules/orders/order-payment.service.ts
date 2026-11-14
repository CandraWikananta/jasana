/**
 * Pembayaran order lewat port `PaymentGateway` (D101).
 *
 *   issueInvoice      dipanggil `afterCommit` T1. Baris `payments` PENDING sudah
 *                     ditulis di transaksi T1 (usulan D104), di sini hanya
 *                     diisi hasil gateway. Kalau gagal, order tetap ACCEPTED
 *   getPayment, renewInvoice   GET dan POST /orders/:id/payment (sesi 7a)
 *   confirmPayment    T5 untuk simulate-payment (D101 no. 4)
 *   applyInvoiceEvent transaksi 2 webhook invoice: T5 beserta ESCROW_HOLD,
 *                     D119, D120, D122, dan D125 (sesi 7b). D119 membuat refund
 *                     otomatis tanpa ledger dan tanpa transisi (D135, sesi 8c)
 */

import { randomUUID } from 'node:crypto';
import { prisma, Prisma, type Order } from '@jasana/database';
import { AppError } from '../../lib/errors';
import { actorFrom, type OrderAccess } from '../access/access.service';
import { logger } from '../../lib/logger';
import { paymentGateway } from '../../lib/payment-gateway';
import { dispatchEmails } from '../notifications/email-outbox';
import { createRefund } from '../refunds/refunds.service';
import { notifyUsers } from './order-notify';
import { PAYMENT_SELECT, toPaymentDto } from './orders.mapper';
import type { InvoiceCallback } from '../webhooks/webhooks.schema';
import { lockOrder, transitionOrder, withOrderTransaction, type AfterCommitTask } from './order-transition.service';

type Tx = Prisma.TransactionClient;
type AfterCommit = (task: AfterCommitTask) => void;

const asJson = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

/** Di dalam transaksi T1. `externalId` dibuat di sini supaya webhook bisa menemukannya. */
export function createPendingPayment(tx: Tx, order: { id: string; totalAmount: Prisma.Decimal }, expiresAt: Date) {
  return tx.payment.create({
    data: { orderId: order.id, xenditExternalId: `PAY-${randomUUID()}`, amount: order.totalAmount, status: 'PENDING', expiresAt },
    select: { id: true, invoiceUrl: true },
  });
}

/**
 * Setelah commit T1, atau dari `renewInvoice`. Melempar kalau gateway gagal.
 * Satu baris hanya memegang satu invoice (usulan D124): yang kalah balapan
 * meng-expire invoicenya sendiri, supaya tidak ada invoice yatim yang bisa dibayar.
 */
export async function issueInvoice(paymentId: string): Promise<void> {
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: { order: { select: { orderNumber: true, client: { select: { email: true } } } } },
  });
  const invoice = await paymentGateway.createInvoice({
    externalId: payment.xenditExternalId,
    amount: payment.amount.toNumber(),
    description: `Order ${payment.order.orderNumber}`,
    payerEmail: payment.order.client.email,
    expiresAt: payment.expiresAt!,
  });
  const filled = await prisma.payment.updateMany({
    where: { id: paymentId, status: 'PENDING', xenditInvoiceId: null },
    data: { xenditInvoiceId: invoice.invoiceId, invoiceUrl: invoice.invoiceUrl, expiresAt: invoice.expiresAt, rawResponse: asJson(invoice.raw) },
  });
  if (filled.count === 0) {
    // Order dibatalkan, atau pemanggil lain sudah mengisi invoice: jangan biarkan invoice ini bisa dibayar.
    try {
      await paymentGateway.expireInvoice(invoice.invoiceId);
    } catch (error) {
      // Tidak dilempar: baris sudah benar, dan client tidak boleh dibalas 502 padahal invoice-nya ada.
      // Kalau invoice ini terlanjur dibayar, itu jalur D119 dan H99.
      logger.error({ err: error, payment_id: paymentId, invoice_id: invoice.invoiceId }, 'Expire invoice yang tidak terpakai gagal, invoice masih hidup di gateway');
    }
    // Hanya tercatat kalau barisnya belum memegang invoice (kasus batal), invoice pemenang tidak ditimpa.
    await prisma.payment.updateMany({
      where: { id: paymentId, xenditInvoiceId: null },
      data: { xenditInvoiceId: invoice.invoiceId, rawResponse: asJson(invoice.raw) },
    });
  }
}

/** GET /orders/:id/payment, hanya client order itu. Payment terbaru apa pun statusnya (usulan D123 no. 3). */
export async function getPayment(access: OrderAccess) {
  actorFrom(access, ['CLIENT']);
  const payment = await prisma.payment.findFirst({
    where: { orderId: access.orderId },
    orderBy: { createdAt: 'desc' },
    select: PAYMENT_SELECT,
  });
  if (!payment) throw new AppError('NOT_FOUND', 'Order ini belum punya tagihan');
  return toPaymentDto(payment);
}

/**
 * POST /orders/:id/payment, jalur pemulihan D104. Invoice yang masih berlaku
 * dikembalikan apa adanya. Payment PENDING tanpa invoice diisi invoice, dan
 * order tanpa payment PENDING dibuatkan baris baru (usulan D123 no. 2).
 * Kunci order mencegah baris PENDING lahir untuk order yang sedang dibatalkan.
 */
export async function renewInvoice(access: OrderAccess) {
  actorFrom(access, ['CLIENT']);
  const pending = await prisma.$transaction(async (tx) => {
    const order = await lockOrder(tx, access.orderId);
    if (order.status !== 'ACCEPTED') {
      throw new AppError('ORDER_TRANSITION_NOT_ALLOWED', `Tagihan hanya bisa dibuat saat order ACCEPTED, status order sekarang ${order.status}`);
    }
    if (!order.paymentDeadlineAt || order.paymentDeadlineAt <= new Date()) {
      throw new AppError('PAYMENT_DEADLINE_PASSED', 'Batas waktu pembayaran order ini sudah lewat');
    }
    return (
      (await tx.payment.findFirst({ where: { orderId: order.id, status: 'PENDING' }, select: { id: true, invoiceUrl: true } })) ??
      (await createPendingPayment(tx, order, order.paymentDeadlineAt))
    );
  });
  // Di luar transaksi (jebakan 7). Galat gateway diteruskan jadi 502 (PRD 6.4).
  if (pending.invoiceUrl === null) await issueInvoice(pending.id);
  return getPayment(access);
}

/** Di dalam transaksi T4/T7/T6. Mengembalikan invoice yang perlu di-expire setelah commit. */
export async function expirePendingPayments(tx: Tx, orderId: string): Promise<string[]> {
  const pending = await tx.payment.findMany({ where: { orderId, status: 'PENDING' }, select: { id: true, xenditInvoiceId: true } });
  if (pending.length > 0) {
    await tx.payment.updateMany({ where: { id: { in: pending.map((p) => p.id) } }, data: { status: 'EXPIRED' } });
  }
  return pending.map((p) => p.xenditInvoiceId).filter((id): id is string => id !== null);
}

/** Setelah commit pembatalan. Invoice yang terlanjur dibayar ditangani webhook lewat D119. */
export async function expireInvoices(invoiceIds: string[]): Promise<void> {
  await Promise.all(invoiceIds.map((id) => paymentGateway.expireInvoice(id)));
}

export interface PaymentDetails {
  paidAmount?: Prisma.Decimal;
  paymentMethod?: string;
  paymentChannel?: string;
  paidAt?: Date;
}

const paidData = (details: PaymentDetails, billed: Prisma.Decimal) => ({
  status: 'PAID' as const,
  paidAt: details.paidAt ?? new Date(),
  paidAmount: details.paidAmount ?? billed,
  paymentMethod: details.paymentMethod ?? null,
  paymentChannel: details.paymentChannel ?? null,
});

/**
 * Ledger escrow (PRD 3.2) pada wallet usaha:
 *   ESCROW_HOLD       pending += provider_earning                       (T5)
 *   ESCROW_RELEASE    available += provider_earning, pending -= sama    (T18)
 *   REFUND_DEDUCTION  pending -= provider_earning                       (T9, T11, T21, D132)
 * T20 parsial memakai `amount` lain: bagian provider dan sisanya (D133).
 * UPDATE dengan increment mengunci baris wallet dan mengembalikan saldo
 * sesudahnya, jadi `balance_*_after` tidak tertukar dengan transaksi lain.
 */
const ESCROW_DESCRIPTION = { ESCROW_HOLD: 'Escrow', ESCROW_RELEASE: 'Pencairan escrow', REFUND_DEDUCTION: 'Refund' } as const;

export async function writeEscrow(
  tx: Tx,
  order: Order,
  type: keyof typeof ESCROW_DESCRIPTION,
  amount: Prisma.Decimal = order.providerEarning,
): Promise<void> {
  // chk_wallet_tx_nonzero menolak baris nol. Hanya terjadi di T20 parsial kalau platform fee >= 50%.
  if (amount.isZero()) return;
  const earning = amount;
  const availableDelta = type === 'ESCROW_RELEASE' ? earning : new Prisma.Decimal(0);
  // Aturan 6: refund hanya memotong pending.
  const pendingDelta = type === 'ESCROW_HOLD' ? earning : earning.negated();
  const wallet = await tx.wallet.update({
    where: { providerProfileId: order.providerProfileId },
    data: { balanceAvailable: { increment: availableDelta }, balancePending: { increment: pendingDelta } },
    select: { id: true, balanceAvailable: true, balancePending: true },
  });
  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      orderId: order.id,
      type,
      amountAvailableDelta: availableDelta,
      amountPendingDelta: pendingDelta,
      balanceAvailableAfter: wallet.balanceAvailable,
      balancePendingAfter: wallet.balancePending,
      description: `${ESCROW_DESCRIPTION[type]} order ${order.orderNumber}`,
    },
  });
}

/**
 * T5 ACCEPTED -> PAID di dalam transaksi, aktor SYSTEM. Slot pekerja jadi pasti
 * karena statusnya PAID (D43). `paymentId` null untuk simulate: baris PENDING
 * mana pun, atau baris baru.
 */
async function settlePaid(tx: Tx, afterCommit: AfterCommit, orderId: string, paymentId: string | null, details: PaymentDetails) {
  await transitionOrder(tx, {
    orderId,
    afterCommit,
    toStatus: 'PAID',
    actor: 'SYSTEM',
    guard: async (tx) => {
      if (await tx.payment.count({ where: { orderId, status: 'PAID' } })) {
        throw new AppError('ORDER_ALREADY_PAID', 'Order sudah dibayar');
      }
    },
    effects: async (tx, order) => {
      const paid = paidData(details, order.totalAmount);
      const target = paymentId ?? (await tx.payment.findFirst({ where: { orderId, status: 'PENDING' }, select: { id: true } }))?.id;
      if (target) await tx.payment.update({ where: { id: target }, data: paid });
      else await tx.payment.create({ data: { orderId, xenditExternalId: `PAY-${randomUUID()}`, amount: order.totalAmount, ...paid } });
      await writeEscrow(tx, order, 'ESCROW_HOLD');

      const parties = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        select: { clientId: true, providerProfile: { select: { userId: true } }, assignedWorker: { select: { userId: true } } },
      });
      const emails = await notifyUsers(
        tx,
        [parties.clientId, parties.providerProfile.userId, parties.assignedWorker?.userId],
        order,
        'Pembayaran berhasil',
        'Pembayaran order sudah diterima dan jadwal pekerja terkunci.',
      );
      afterCommit(() => void dispatchEmails(emails));
    },
  });
}

/** T5 untuk simulate-payment (D101 no. 4). Webhook memakai `settlePaid` yang sama lewat `applyInvoiceEvent`. */
export async function confirmPayment(orderId: string, details: PaymentDetails = {}): Promise<void> {
  await withOrderTransaction((tx, afterCommit) => settlePaid(tx, afterCommit, orderId, null, details));
}

export interface InvoiceOutcome {
  status: 'PROCESSED' | 'IGNORED' | 'FAILED';
  message?: string;
}

/** Awalan pesan event FAILED yang hasilnya akan selalu sama, jadi tidak diulang cron (D120, D125, usulan D126). */
export const NO_RETRY_MARKERS = ['AMOUNT_MISMATCH', 'DOUBLE_PAYMENT'] as const;

/**
 * Transaksi 2 webhook invoice (PRD 4.4 langkah 5). Hasil bisnis dikembalikan,
 * bukan dilempar, supaya catatan seperti `paid_amount` D120 ikut ter-commit.
 */
export async function applyInvoiceEvent(tx: Tx, afterCommit: AfterCommit, event: InvoiceCallback): Promise<InvoiceOutcome> {
  if (event.status === 'EXPIRED') {
    // D122: hanya invoice yang cocok dan masih PENDING. Order tidak disentuh, T6 tetap tugas cron.
    const { count } = await tx.payment.updateMany({ where: { xenditInvoiceId: event.id, status: 'PENDING' }, data: { status: 'EXPIRED' } });
    return count === 1 ? { status: 'PROCESSED' } : { status: 'IGNORED', message: 'Tidak ada payment PENDING dengan invoice ini (D122)' };
  }
  // Usulan D127: SETTLED lewat jalur yang sama dengan PAID.
  if (event.status !== 'PAID' && event.status !== 'SETTLED') {
    return { status: 'IGNORED', message: `Status invoice ${event.status} tidak diproses` };
  }

  // D125: invoice id dulu, lalu external_id untuk invoice yatim.
  const byInvoice = await tx.payment.findUnique({ where: { xenditInvoiceId: event.id }, select: { id: true, orderId: true } });
  const found = byInvoice ?? (await tx.payment.findUnique({ where: { xenditExternalId: event.external_id }, select: { id: true, orderId: true } }));
  const log = { invoice_id: event.id, order_id: found?.orderId, payment_id: found?.id };
  if (!found) {
    logger.warn(log, 'Webhook invoice dengan external_id tidak dikenal (D125 no. 3)');
    return { status: 'IGNORED', message: 'external_id tidak dikenal (D125 no. 3)' };
  }

  // Order dulu baru payment, urutan kunci yang sama dengan T4, T6, dan T7. Payment ikut
  // dikunci: `issueInvoice` tidak memegang kunci order, dan tanpa ini invoice yang ia isi di
  // sela baca dan tulis D125 no. 1 akan tertimpa tanpa di-expire.
  const order = await lockOrder(tx, found.orderId);
  await tx.$queryRaw`SELECT id FROM payments WHERE id = ${found.id}::uuid FOR UPDATE`;
  const payment = await tx.payment.findUniqueOrThrow({ where: { id: found.id } });

  // Urutan ini wajib: SETTLED setelah PAID untuk invoice yang sama bukan bayar dobel.
  if (byInvoice && payment.status === 'PAID') {
    return { status: 'IGNORED', message: 'Pembayaran invoice ini sudah tercatat' };
  }
  if (await tx.payment.count({ where: { orderId: order.id, status: 'PAID' } })) {
    logger.error(log, 'Bayar dobel: order sudah punya payment PAID, kasus refund H99 (D125 no. 2, usulan D126)');
    return { status: 'FAILED', message: `DOUBLE_PAYMENT: order sudah punya payment PAID, invoice ${event.id} perlu di-refund (H99)` };
  }

  if (!byInvoice) {
    // D125 no. 1: baris pindah ke invoice yang terbukti dibayar, invoice lama dimatikan.
    await tx.payment.update({ where: { id: payment.id }, data: { xenditInvoiceId: event.id } });
    const old = payment.xenditInvoiceId;
    if (old) afterCommit(() => paymentGateway.expireInvoice(old));
  }

  // D120, H12: dibandingkan sebagai angka, 150000 sama dengan 150000.00.
  const paidAmount = event.paid_amount === undefined ? null : new Prisma.Decimal(event.paid_amount);
  if (!paidAmount?.equals(payment.amount)) {
    if (paidAmount) await tx.payment.update({ where: { id: payment.id }, data: { paidAmount } });
    logger.error({ ...log, paid_amount: event.paid_amount ?? null, amount: payment.amount.toString() }, 'Nominal dibayar berbeda dengan tagihan, diserahkan ke admin (D120)');
    return { status: 'FAILED', message: `AMOUNT_MISMATCH: dibayar ${event.paid_amount ?? 'kosong'}, ditagih ${payment.amount.toString()} (D120)` };
  }

  const details: PaymentDetails = {
    paidAmount,
    ...(event.payment_method === undefined ? {} : { paymentMethod: event.payment_method }),
    ...(event.payment_channel === undefined ? {} : { paymentChannel: event.payment_channel }),
    ...(event.paid_at === undefined ? {} : { paidAt: new Date(event.paid_at) }),
  };
  if (order.status !== 'ACCEPTED') {
    // D119: uangnya sudah masuk, dicatat jujur walaupun payment sudah EXPIRED oleh T6.
    const paid = await tx.payment.update({ where: { id: payment.id }, data: paidData(details, payment.amount) });
    // D135: refund otomatis penuh. Tanpa ledger (ESCROW_HOLD tidak pernah ditulis) dan tanpa transisi.
    // Usulan D141: initiated_by null karena pemicunya webhook.
    const refund = await createRefund(tx, afterCommit, { orderId: order.id, payment: paid, initiatedBy: null, reason: 'Pembayaran telat (D119)' });
    logger.error({ ...log, order_status: order.status, refund_id: refund.id }, 'Pembayaran masuk untuk order yang tidak lagi ACCEPTED, di-refund otomatis (D119, D135)');
    return { status: 'PROCESSED', message: `Pembayaran telat, order ${order.status}, refund ${refund.id} (D119, D135)` };
  }
  await settlePaid(tx, afterCommit, order.id, payment.id, details);
  return { status: 'PROCESSED' };
}

/**
 * POST /dev/orders/:id/simulate-payment (D101 no. 4), hanya client order itu.
 * `paymentMethod` memilih jalur refund (D136): FAKE dan EWALLET lewat API, lainnya manual.
 */
export async function simulatePayment(access: OrderAccess, paymentMethod = 'FAKE'): Promise<void> {
  actorFrom(access, ['CLIENT']);
  await confirmPayment(access.orderId, { paymentMethod });
}
