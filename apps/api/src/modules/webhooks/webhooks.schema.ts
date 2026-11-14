/**
 * Body callback invoice Xendit (PRD 4.4). `passthrough` supaya payload yang
 * disimpan di `webhook_events` utuh, karena cron memproses ulang dari sana (D121).
 * Panjang mengikuti kolom: invoice dan external id 100, metode dan kanal 50.
 */

import { z } from 'zod';

export const invoiceCallbackSchema = z
  .object({
    id: z.string().min(1).max(100),
    external_id: z.string().min(1).max(100),
    status: z.string().min(1).max(20),
    paid_amount: z.number().nonnegative().optional(),
    payment_method: z.string().max(50).optional(),
    payment_channel: z.string().max(50).optional(),
    paid_at: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough();

export type InvoiceCallback = z.infer<typeof invoiceCallbackSchema>;

/**
 * Callback Payouts v2 (D137, fixture sandbox 8a). `reference_id` sengaja tidak
 * dibatasi uuid di sini: nilai asing tetap dicatat lalu IGNORED. Panjang
 * mengikuti `webhook_events` dan `withdrawals.failure_code`.
 */
export const payoutCallbackSchema = z
  .object({
    event: z.string().max(50).optional(),
    data: z
      .object({
        id: z.string().min(1).max(100),
        status: z.string().min(1).max(20),
        reference_id: z.string().min(1).max(100),
        failure_code: z.string().max(50).nullish(),
      })
      .passthrough(),
  })
  .passthrough();

export type PayoutCallback = z.infer<typeof payoutCallbackSchema>;

/**
 * Bagian callback refund yang dipakai stub sesi 8a untuk `event_id`.
 * Tidak dipasang lewat `validate`: payload yang tidak cocok tetap dicatat utuh.
 */
export const gatewayEventSchema = z.object({
  data: z.object({ id: z.string().min(1).max(100), status: z.string().min(1).max(20) }),
});
