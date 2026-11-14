import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination';

export const disputeParamsSchema = z.object({ id: z.string().uuid('id dispute tidak sah') });

/** POST /orders/:id/disputes. Tanpa nominal apa pun, putusan uang milik admin. */
export const openDisputeSchema = z.object({
  category: z.enum(['WORK_NOT_DONE', 'POOR_QUALITY', 'PROVIDER_NO_SHOW', 'CLIENT_NO_SHOW', 'PAYMENT_ISSUE', 'OTHER'], {
    required_error: 'category wajib diisi',
  }),
  description: z.string({ required_error: 'description wajib diisi' }).trim().min(1, 'description wajib diisi').max(2000),
});
export type OpenDisputeBody = z.infer<typeof openDisputeSchema>;

/** Field teks di samping berkas multipart. */
export const evidenceBodySchema = z.object({
  description: z.string().trim().max(500).optional(),
});

export const adminDisputesQuerySchema = z.object({
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED_REFUND', 'RESOLVED_RELEASE', 'RESOLVED_PARTIAL']).optional(),
  ...paginationQuery,
});
export type AdminDisputesQuery = z.infer<typeof adminDisputesQuerySchema>;

const note = z.string({ required_error: 'resolution_note wajib diisi' }).trim().min(1, 'resolution_note wajib diisi').max(2000);

/** D133: `refund_amount` rupiah bulat, hanya untuk PARTIAL. Batas atasnya (< total_amount) diperiksa service. */
export const resolveDisputeSchema = z.discriminatedUnion(
  'decision',
  [
    z.object({ decision: z.literal('RELEASE'), resolution_note: note }).strict(),
    z.object({ decision: z.literal('REFUND'), resolution_note: note }).strict(),
    z
      .object({
        decision: z.literal('PARTIAL'),
        resolution_note: note,
        refund_amount: z.number({ required_error: 'refund_amount wajib untuk PARTIAL' }).int('refund_amount harus rupiah bulat').positive('refund_amount harus lebih dari 0'),
      })
      .strict(),
  ],
  { errorMap: () => ({ message: 'decision harus RELEASE, PARTIAL, atau REFUND' }) },
);
export type ResolveDisputeBody = z.infer<typeof resolveDisputeSchema>;
