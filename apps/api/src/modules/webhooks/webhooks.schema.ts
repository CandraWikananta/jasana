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
