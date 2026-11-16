/**
 * Validasi review (D179, sesi 10b). Panjang komentar dan balasan konstanta, bukan parameter.
 */

import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination';

export const REVIEW_TEXT_MAX_LENGTH = 1000;
const text = (label: string) =>
  z.string().trim().min(1, `${label} tidak boleh kosong`).max(REVIEW_TEXT_MAX_LENGTH, `${label} paling panjang ${REVIEW_TEXT_MAX_LENGTH} karakter`);

export const createReviewSchema = z
  .object({ rating: z.number().int().min(1).max(5), comment: text('Komentar').optional() })
  .strict();
export type CreateReviewBody = z.infer<typeof createReviewSchema>;

export const replyReviewSchema = z.object({ reply: text('Balasan') }).strict();

export const reviewParamsSchema = z.object({ id: z.string().uuid('id review tidak sah') });
export const listingReviewsParamsSchema = z.object({ id: z.string().uuid('id listing tidak sah') });

export const listReviewsQuerySchema = z.object({ ...paginationQuery });
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;

export const adminReviewsQuerySchema = z.object({
  ...paginationQuery,
  is_visible: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  listing_id: z.string().uuid('listing_id tidak sah').optional(),
});
export type AdminReviewsQuery = z.infer<typeof adminReviewsQuerySchema>;

export const reviewVisibilitySchema = z.object({ is_visible: z.boolean() }).strict();
