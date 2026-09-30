/**
 * Kelas error aplikasi.
 *
 * Service melempar `AppError` dengan kode dari Lampiran A, dan errorHandler
 * yang memetakannya ke status HTTP. Konsekuensinya service tidak perlu tahu
 * apa pun soal HTTP, sesuai aturan lapisan: service tidak menyentuh
 * `req` atau `res`.
 *
 * Status HTTP TIDAK ditulis di tempat pemanggilan, melainkan diturunkan dari
 * kode lewat tabel di `@jasana/shared`. Kalau ditulis manual, cepat atau
 * lambat ada dua tempat yang membalas kode sama dengan status berbeda.
 */

import {
  httpStatusFor,
  type ErrorCode,
  type ErrorDetail,
} from '@jasana/shared';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly details: ErrorDetail[];
  /** Konteks tambahan yang masuk log Pino, TIDAK dikirim ke client. */
  public readonly context?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    options: { details?: ErrorDetail[]; context?: Record<string, unknown>; cause?: unknown } = {},
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = httpStatusFor(code);
    this.details = options.details ?? [];
    if (options.context) this.context = options.context;
    if (options.cause !== undefined) this.cause = options.cause;

    Error.captureStackTrace?.(this, AppError);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/** Pintasan untuk kode yang paling sering dipakai lapisan infrastruktur. */
export const Errors = {
  notFound: (message = 'Sumber daya tidak ditemukan') =>
    new AppError('NOT_FOUND', message),

  unauthorized: (message = 'Token tidak ada atau tidak valid') =>
    new AppError('UNAUTHORIZED', message),

  validation: (details: ErrorDetail[], message = 'Permintaan tidak lolos validasi') =>
    new AppError('VALIDATION_ERROR', message, { details }),

  serviceUnavailable: (message: string, context?: Record<string, unknown>) =>
    new AppError('SERVICE_UNAVAILABLE', message, context ? { context } : {}),

  internal: (message = 'Terjadi kesalahan pada server', cause?: unknown) =>
    new AppError('INTERNAL_ERROR', message, { cause }),
} as const;
