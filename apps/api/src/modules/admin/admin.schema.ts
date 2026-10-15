/**
 * Skema Zod modul admin (Fase 2: pengajuan provider dan perubahan tipe).
 */

import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination';

export const applicationParamsSchema = z.object({
  id: z.string().uuid('id pengajuan tidak sah'),
});

export const listApplicationsQuerySchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED']).default('PENDING'),
  ...paginationQuery,
});

export const listTypeUpgradeQuerySchema = z.object(paginationQuery);

export const rejectApplicationSchema = z.object({
  reason: z
    .string({ required_error: 'reason wajib diisi' })
    .trim()
    .min(5, 'reason minimal 5 karakter')
    .max(1000),
});

export const typeUpgradeDecisionSchema = z
  .object({
    decision: z.enum(['APPROVED', 'REJECTED'], {
      errorMap: () => ({ message: 'decision harus APPROVED atau REJECTED' }),
    }),
    reason: z.string().trim().min(5).max(1000).optional(),
  })
  .refine((body) => body.decision === 'APPROVED' || body.reason !== undefined, {
    message: 'reason wajib diisi saat menolak',
    path: ['reason'],
  });

export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>;
export type TypeUpgradeDecisionBody = z.infer<typeof typeUpgradeDecisionSchema>;
