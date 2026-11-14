import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination';

export const adminRefundsQuerySchema = z.object({
  status: z.enum(['REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
  ...paginationQuery,
});
export type AdminRefundsQuery = z.infer<typeof adminRefundsQuerySchema>;

export const refundParamsSchema = z.object({ id: z.string().uuid('id refund tidak sah') });

/** Jalur manual (D136 no. 2, usulan D142): catatan transfer wajib, misalnya nomor referensi bank. */
export const completeRefundSchema = z.object({
  completion_note: z.string({ required_error: 'completion_note wajib diisi' }).trim().min(5, 'completion_note minimal 5 karakter').max(1000),
});
