/**
 * Port gerbang pembayaran (D101).
 *
 * Service order hanya mengenal interface ini, tidak pernah SDK Xendit, supaya
 * kodenya tidak berubah saat Xendit dipasang di Fase 7. Panggilan ke sini
 * selalu SETELAH commit (jebakan 7), lewat `afterCommit` di modul orders.
 */

import { env } from '../config/env';
import { PAYMENT_GATEWAY_TIMEOUT_MS } from '../config/constants';
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

/** Nilai `reason` yang diterima Refund API Xendit. */
export type RefundReason = 'FRAUDULENT' | 'DUPLICATE' | 'REQUESTED_BY_CUSTOMER' | 'CANCELLATION' | 'OTHERS';

export interface RefundInput {
  /** Id referensi kita (nanti `refunds.id`), dipakai sebagai `reference_id` dan idempotency key. */
  referenceId: string;
  invoiceId: string;
  /** Rupiah utuh. */
  amount: number;
  reason: RefundReason;
}

export interface RefundResult {
  refundId: string;
  /** Salinan mentah status Xendit (PENDING, SUCCEEDED, FAILED). */
  status: string;
  raw: unknown;
}

export interface PayoutInput {
  /** `withdrawals.id`, dipakai sebagai `reference_id` dan Idempotency-key (D134). */
  withdrawalId: string;
  /** Kode channel payout Xendit, misalnya ID_BCA. */
  channelCode: string;
  accountNumber: string;
  accountHolderName: string;
  /** Rupiah utuh. */
  amount: number;
  description: string;
}

export interface PayoutResult {
  payoutId: string;
  /** Salinan mentah status Xendit (ACCEPTED, REQUESTED, SUCCEEDED, FAILED, ...). */
  status: string;
  raw: unknown;
}

export interface PaymentGateway {
  createInvoice(input: CreateInvoiceInput): Promise<Invoice>;
  expireInvoice(invoiceId: string): Promise<void>;
  refund(input: RefundInput): Promise<RefundResult>;
  payout(input: PayoutInput): Promise<PayoutResult>;
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
    return { refundId: `fake-ref-${input.referenceId}`, status: 'PENDING', raw: { gateway: 'fake', ...input } };
  },
  async payout(input) {
    return { payoutId: `fake-payout-${input.withdrawalId}`, status: 'ACCEPTED', raw: { gateway: 'fake', ...input } };
  },
};

const XENDIT_BASE_URL = 'https://api.xendit.co';

const gatewayError = (message: string, context: Record<string, unknown>) =>
  new AppError('PAYMENT_GATEWAY_ERROR', message, { context });

/**
 * Satu panggilan Xendit dengan timeout (H96). Galat asli dan isi balasan tidak
 * pernah diteruskan: pesan fetch bisa memuat URL atau header, dan isi balasan
 * Xendit bisa memuat data pembayar. Yang dicatat hanya status dan `error_code`.
 */
async function callXendit(
  path: string,
  operation: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(`${XENDIT_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        ...headers,
        Authorization: `Basic ${Buffer.from(`${env.XENDIT_SECRET_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(PAYMENT_GATEWAY_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    throw gatewayError(timedOut ? 'Gateway pembayaran tidak merespons' : 'Gateway pembayaran tidak bisa dihubungi', {
      gateway_operation: operation,
      gateway_timeout: timedOut,
    });
  }
  // Body dibaca di bawah signal yang sama, jadi timeout saat membaca berakhir null.
  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) {
    throw gatewayError('Gateway pembayaran menolak permintaan', {
      gateway_operation: operation,
      gateway_status: response.status,
      gateway_error_code: typeof payload?.error_code === 'string' ? payload.error_code : null,
    });
  }
  if (!payload) throw gatewayError('Balasan gateway pembayaran tidak dikenali', { gateway_operation: operation });
  return payload;
}

/** `id` dan `status` wajib ada, karena keduanya yang dicocokkan dengan webhook. */
function idAndStatus(payload: Record<string, unknown>, operation: string) {
  const { id, status } = payload;
  if (typeof id !== 'string' || typeof status !== 'string') {
    throw gatewayError('Balasan gateway pembayaran tidak dikenali', { gateway_operation: operation });
  }
  return { id, status };
}

/** Invoice API Xendit lewat fetch langsung, sama polanya dengan lib/supabase.ts. */
export const xenditGateway: PaymentGateway = {
  async createInvoice(input) {
    const payload = await callXendit('/v2/invoices', 'create_invoice', {
      external_id: input.externalId,
      amount: input.amount,
      description: input.description,
      payer_email: input.payerEmail,
      currency: 'IDR',
      invoice_duration: Math.ceil((input.expiresAt.getTime() - Date.now()) / 1000),
    });
    const { id, invoice_url: invoiceUrl, expiry_date: expiryDate } = payload;
    if (typeof id !== 'string' || typeof invoiceUrl !== 'string' || typeof expiryDate !== 'string') {
      throw gatewayError('Balasan gateway pembayaran tidak dikenali', { gateway_operation: 'create_invoice' });
    }
    return { invoiceId: id, invoiceUrl, expiresAt: new Date(expiryDate), raw: payload };
  },
  async expireInvoice(invoiceId) {
    await callXendit(`/invoices/${encodeURIComponent(invoiceId)}/expire!`, 'expire_invoice');
  },
  /** Refund API legacy berbasis invoice_id. Metode yang didukung baru dipastikan di sandbox 8a. */
  async refund(input) {
    const payload = await callXendit(
      '/refunds',
      'refund',
      { invoice_id: input.invoiceId, reference_id: input.referenceId, amount: input.amount, currency: 'IDR', reason: input.reason },
      { 'idempotency-key': input.referenceId },
    );
    const { id, status } = idAndStatus(payload, 'refund');
    return { refundId: id, status, raw: payload };
  },
  /** Payouts API v2. Key yang sama dengan payload yang sama mengembalikan payout yang sama (D134). */
  async payout(input) {
    const payload = await callXendit(
      '/v2/payouts',
      'payout',
      {
        reference_id: input.withdrawalId,
        channel_code: input.channelCode,
        channel_properties: { account_holder_name: input.accountHolderName, account_number: input.accountNumber },
        amount: input.amount,
        currency: 'IDR',
        description: input.description,
      },
      { 'Idempotency-key': input.withdrawalId },
    );
    const { id, status } = idAndStatus(payload, 'payout');
    return { payoutId: id, status, raw: payload };
  },
};

export const paymentGateway: PaymentGateway =
  env.PAYMENT_GATEWAY === 'xendit' ? xenditGateway : fakeGateway;
