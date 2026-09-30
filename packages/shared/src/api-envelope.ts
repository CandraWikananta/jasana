/**
 * Envelope respons API, PRD Backend Bagian 4.1.
 *
 * Sukses: { success: true, data, meta? }
 * Gagal : { success: false, error: { code, message, details } }
 *
 * Bentuknya dipakai bersama frontend, jadi tipenya tinggal di shared.
 */

import type { ErrorCode } from './error-codes';

/** Paginasi: `page` default 1, `limit` default 20 dan maksimal 100. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface SuccessEnvelope<TData> {
  success: true;
  data: TData;
  meta?: PaginationMeta;
}

/**
 * Satu butir penjelasan kegagalan validasi.
 * `path` memakai penamaan field seperti di body, yaitu snake_case.
 */
export interface ErrorDetail {
  path: string;
  message: string;
}

export interface ErrorEnvelope {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details: ErrorDetail[];
  };
}

export type ApiEnvelope<TData> = SuccessEnvelope<TData> | ErrorEnvelope;

/** Batas paginasi, dipakai skema Zod di seluruh modul daftar. */
export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const;
