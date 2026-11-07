/**
 * Port gerbang pembayaran (D101).
 *
 * Service order hanya mengenal interface ini, tidak pernah SDK Xendit, supaya
 * kodenya tidak berubah saat Xendit dipasang di Fase 7. Panggilan ke sini
 * selalu SETELAH commit (jebakan 7), lewat `afterCommit` di modul orders.
 */

import { env } from '../config/env';
import { AppError } from './errors';

export interface CreateInvoiceInput {
  /** `payments.xendit_external_id`, dibuat server. */
  externalId: string;
  /** Rupiah utuh, dihitung ulang server. */
  amount: number;
  description: string;
  payerEmail: string;
  expiresAt: Date;
}

export interface Invoice {
  invoiceId: string;
  invoiceUrl: string;
  expiresAt: Date;
  raw: unknown;
}

export interface RefundInput {
  invoiceId: string;
  /** Rupiah utuh. */
  amount: number;
  reason: string;
}

export interface RefundResult {
  refundId: string;
  raw: unknown;
}

export interface PaymentGateway {
  createInvoice(input: CreateInvoiceInput): Promise<Invoice>;
  expireInvoice(invoiceId: string): Promise<void>;
  refund(input: RefundInput): Promise<RefundResult>;
}

/** Tanpa jaringan dan deterministik. T5 dipicu lewat endpoint simulasi (D101 no. 4). */
export const fakeGateway: PaymentGateway = {
  async createInvoice(input) {
    const invoiceId = `fake-inv-${input.externalId}`;
    return {
      invoiceId,
      invoiceUrl: `https://fake-gateway.invalid/invoices/${invoiceId}`,
      expiresAt: input.expiresAt,
      raw: { gateway: 'fake', ...input },
    };
  },
  async expireInvoice() {},
  async refund(input) {
    return { refundId: `fake-ref-${input.invoiceId}`, raw: { gateway: 'fake', ...input } };
  },
};

const notInstalled = (): never => {
  throw new AppError('PAYMENT_GATEWAY_ERROR', 'Gateway Xendit belum dipasang (Fase 7)');
};

/** Kerangka. Isinya dipasang di Fase 7. */
export const xenditGateway: PaymentGateway = {
  createInvoice: async () => notInstalled(),
  expireInvoice: async () => notInstalled(),
  refund: async () => notInstalled(),
};

export const paymentGateway: PaymentGateway =
  env.PAYMENT_GATEWAY === 'xendit' ? xenditGateway : fakeGateway;
