/**
 * Paginasi PRD 4.1: `page` default 1, `limit` default 20, maksimal 100.
 */

import { z } from 'zod';
import type { PaginationMeta } from '@jasana/shared';

export const paginationQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
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
