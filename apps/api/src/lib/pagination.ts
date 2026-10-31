/**
 * Paginasi PRD 4.1: `page` default 1, `limit` default 20, maksimal 100.
 */

import { z } from 'zod';
import type { PaginationMeta } from '@jasana/shared';

/**
 * Angka dari query string. String kosong (atau spasi saja) dianggap TIDAK
 * DIISI, karena `z.coerce.number()` sendiri mengubahnya jadi 0: `?lat=`
 * diam-diam berarti lintang 0, dan `?page=` gagal dengan pesan yang
 * membingungkan.
 */
export const queryNumber = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (typeof value === 'string' && value.trim() === '' ? undefined : value), schema);

/** `page` dibatasi supaya OFFSET tidak meluap bigint di Postgres (dulu 500, sekarang 422). */
export const MAX_PAGE = 1_000_000;

export const paginationQuery = {
  page: queryNumber(z.coerce.number().int().min(1).max(MAX_PAGE).default(1)),
  limit: queryNumber(z.coerce.number().int().min(1).max(100).default(20)),
};

export interface Page {
  page: number;
  limit: number;
}

export function skipTake({ page, limit }: Page): { skip: number; take: number } {
  return { skip: (page - 1) * limit, take: limit };
}

export function pageMeta({ page, limit }: Page, total: number): PaginationMeta {
  return { page, limit, total };
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}
