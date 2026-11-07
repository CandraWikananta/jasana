/**
 * Pembayaran order lewat port `PaymentGateway` (D101).
 *
 *   issueInvoice      dipanggil `afterCommit` T1. Baris `payments` PENDING sudah
 *                     ditulis di transaksi T1 (usulan D104), di sini hanya
 *                     diisi hasil gateway. Kalau gagal, order tetap ACCEPTED
 *   confirmPayment    T5. Dipanggil simulate-payment sekarang, dan handler
 *                     webhook `invoice.paid` di Fase 7 (D101 no. 4)
 */

import { randomUUID } from 'node:crypto';
import { prisma, type Prisma } from '@jasana/database';
import { AppError } from '../../lib/errors';
import { actorFrom, type OrderAccess } from '../access/access.service';
import { paymentGateway } from '../../lib/payment-gateway';
import { dispatchEmails } from '../notifications/email-outbox';
import { notifyUsers } from './order-notify';
import { transitionOrder, withOrderTransaction } from './order-transition.service';

type Tx = Prisma.TransactionClient;

const asJson = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

/** Di dalam transaksi T1. `externalId` dibuat di sini supaya webhook bisa menemukannya. */
export function createPendingPayment(tx: Tx, order: { id: string; totalAmount: Prisma.Decimal }, expiresAt: Date) {
  return tx.payment.create({
    data: { orderId: order.id, xenditExternalId: `PAY-${randomUUID()}`, amount: order.totalAmount, status: 'PENDING', expiresAt },
    select: { id: true },
  });
}

/** Setelah commit T1. Melempar kalau gateway gagal; `withOrderTransaction` mencatatnya. */
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
    where: { id: paymentId, status: 'PENDING' },
    data: { xenditInvoiceId: invoice.invoiceId, invoiceUrl: invoice.invoiceUrl, expiresAt: invoice.expiresAt, rawResponse: asJson(invoice.raw) },
  });
  if (filled.count === 0) {
    // Order dibatalkan selagi gateway membuat invoice: jangan biarkan invoice itu bisa dibayar.
    await paymentGateway.expireInvoice(invoice.invoiceId);
    await prisma.payment.update({ where: { id: paymentId }, data: { xenditInvoiceId: invoice.invoiceId, rawResponse: asJson(invoice.raw) } });
  }
}

/** Di dalam transaksi T4/T7/T6. Mengembalikan invoice yang perlu di-expire setelah commit. */
export async function expirePendingPayments(tx: Tx, orderId: string): Promise<string[]> {
  const pending = await tx.payment.findMany({ where: { orderId, status: 'PENDING' }, select: { id: true, xenditInvoiceId: true } });
  if (pending.length > 0) {
    await tx.payment.updateMany({ where: { id: { in: pending.map((p) => p.id) } }, data: { status: 'EXPIRED' } });
  }
  return pending.map((p) => p.xenditInvoiceId).filter((id): id is string => id !== null);
}

/** Setelah commit pembatalan. Invoice yang terlanjur dibayar ditangani webhook Fase 7. */
export async function expireInvoices(invoiceIds: string[]): Promise<void> {
  await Promise.all(invoiceIds.map((id) => paymentGateway.expireInvoice(id)));
}

export interface PaymentDetails {
  paidAmount?: number;
  paymentMethod?: string;
  paymentChannel?: string;
  raw?: unknown;
}

/** T5 ACCEPTED -> PAID, aktor SYSTEM. Slot pekerja jadi pasti karena statusnya PAID (D43). */
export async function confirmPayment(orderId: string, details: PaymentDetails = {}): Promise<void> {
  await withOrderTransaction(async (tx, afterCommit) => {
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
        const paid = {
          status: 'PAID' as const,
          paidAt: new Date(),
          paidAmount: details.paidAmount ?? order.totalAmount,
          paymentMethod: details.paymentMethod ?? null,
          paymentChannel: details.paymentChannel ?? null,
          ...(details.raw === undefined ? {} : { rawResponse: asJson(details.raw) }),
        };
        const pending = await tx.payment.findFirst({ where: { orderId, status: 'PENDING' }, select: { id: true } });
        if (pending) await tx.payment.update({ where: { id: pending.id }, data: paid });
        else await tx.payment.create({ data: { orderId, xenditExternalId: `PAY-${randomUUID()}`, amount: order.totalAmount, ...paid } });
        // shortcut: ledger ESCROW_HOLD belum ditulis, dipasang di fungsi ini pada Fase 7 (D101 no. 4).

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
  });
}

/** POST /dev/orders/:id/simulate-payment (D101 no. 4), hanya client order itu. */
export async function simulatePayment(access: OrderAccess): Promise<void> {
  actorFrom(access, ['CLIENT']);
  await confirmPayment(access.orderId, { paymentMethod: 'FAKE' });
}
