/**
 * Bentuk review publik (D179). Dipakai GET /listings/:id/reviews dan detail listing,
 * jadi berdiri sendiri tanpa mengimpor modul listing.
 */

import type { Prisma } from '@jasana/database';

/** Nama reviewer di endpoint publik: kata pertama dan inisial kata kedua, `Candra W.` */
export function maskName(fullName: string): string {
  const [first = '', second] = fullName.trim().split(/\s+/);
  return second ? `${first} ${second[0]!.toUpperCase()}.` : first;
}

export const PUBLIC_REVIEW_SELECT = {
  id: true, rating: true, comment: true, providerReply: true, providerRepliedAt: true, createdAt: true,
  client: { select: { fullName: true } },
} satisfies Prisma.ReviewSelect;

export type PublicReviewRow = Prisma.ReviewGetPayload<{ select: typeof PUBLIC_REVIEW_SELECT }>;

export interface PublicReviewDto {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_name: string;
  provider_reply: string | null;
  provider_replied_at: string | null;
  created_at: string;
}

export const toPublicReviewDto = (r: PublicReviewRow): PublicReviewDto => ({
  id: r.id,
  rating: r.rating,
  comment: r.comment,
  reviewer_name: maskName(r.client.fullName),
  provider_reply: r.providerReply,
  provider_replied_at: r.providerRepliedAt?.toISOString() ?? null,
  created_at: r.createdAt.toISOString(),
});

/** Urutan daftar publik dan cuplikan di detail listing. */
export const PUBLIC_REVIEW_ORDER = [{ createdAt: 'desc' }, { id: 'desc' }] satisfies Prisma.ReviewOrderByWithRelationInput[];
