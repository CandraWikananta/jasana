/**
 * Pembentuk envelope respons (PRD Bagian 4.1).
 *
 * Seluruh controller memakai fungsi di sini, tidak pernah `res.json()`
 * dengan objek yang disusun sendiri. Satu endpoint yang lupa membungkus
 * bentuknya akan memaksa frontend menangani dua bentuk respons.
 */

import type { Response } from 'express';
import type {
  ErrorDetail,
  ErrorEnvelope,
  PaginationMeta,
  SuccessEnvelope,
} from '@jasana/shared';
import { httpStatusFor, type ErrorCode } from '@jasana/shared';

export function successEnvelope<TData>(
  data: TData,
  meta?: PaginationMeta,
): SuccessEnvelope<TData> {
  return meta ? { success: true, data, meta } : { success: true, data };
}

export function errorEnvelope(
  code: ErrorCode,
  message: string,
  details: ErrorDetail[] = [],
): ErrorEnvelope {
  return { success: false, error: { code, message, details } };
}

/** 200 dengan data. */
export function sendOk<TData>(res: Response, data: TData, meta?: PaginationMeta): void {
  res.status(200).json(successEnvelope(data, meta));
}

/** 201 untuk sumber daya yang baru dibuat. */
export function sendCreated<TData>(res: Response, data: TData): void {
  res.status(201).json(successEnvelope(data));
}

/** Status diturunkan dari kode, bukan ditulis di tempat pemanggilan. */
export function sendError(
  res: Response,
  code: ErrorCode,
  message: string,
  details: ErrorDetail[] = [],
): void {
  res.status(httpStatusFor(code)).json(errorEnvelope(code, message, details));
}
