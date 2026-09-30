/**
 * Error handler terpusat, satu-satunya tempat error jadi respons HTTP.
 *
 * Bentuk balasannya selalu envelope gagal dari PRD Bagian 4.1:
 *   { success: false, error: { code, message, details: [] } }
 *
 * Dua hal yang dijaga ketat di sini:
 *
 * 1. PESAN 500 KE CLIENT SELALU GENERIK. Stack trace hanya masuk log Pino
 *    (Lampiran A.2). Pesan error basis data yang diteruskan apa adanya bisa
 *    membocorkan nama tabel, kolom, dan bentuk kueri.
 *
 * 2. MASALAH BENTUK DIBALAS 400, MASALAH ISI DIBALAS 422. JSON yang rusak
 *    bukan kegagalan validasi, jadi INVALID_JSON dan bukan VALIDATION_ERROR.
 */

import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import type { ErrorCode, ErrorDetail } from '@jasana/shared';
import { AppError, isAppError } from '../lib/errors';
import { errorEnvelope } from '../lib/envelope';
import { logger } from '../lib/logger';

/** Penanda yang dipakai middleware CORS saat origin tidak ada di whitelist. */
export const CORS_REJECTION_MESSAGE = 'CORS_ORIGIN_NOT_ALLOWED';

/**
 * Galat body-parser punya properti `type`, bukan kelas tersendiri, jadi
 * dikenali lewat bentuknya.
 */
interface BodyParserError extends Error {
  type?: string;
  status?: number;
  statusCode?: number;
}

function isBodyParserError(error: unknown): error is BodyParserError {
  return (
    error instanceof Error &&
    typeof (error as BodyParserError).type === 'string' &&
    (error as BodyParserError).type!.startsWith('entity.')
  );
}

/**
 * Menerjemahkan ZodError jadi daftar `details`.
 *
 * `path` sengaja digabung dengan titik dan dibiarkan apa adanya, karena skema
 * Zod ditulis mengikuti nama field body yang sudah snake_case.
 */
function zodDetails(error: ZodError): ErrorDetail[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}

interface Normalized {
  code: ErrorCode;
  message: string;
  details: ErrorDetail[];
  /** Diisi hanya kalau error memang layak dianggap bug, bukan salah client. */
  unexpected: boolean;
  context?: Record<string, unknown>;
}

function normalize(error: unknown): Normalized {
  if (isAppError(error)) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      // 5xx yang sengaja dilempar tetap perlu ditelusuri.
      unexpected: error.status >= 500,
      ...(error.context ? { context: error.context } : {}),
    };
  }

  if (error instanceof ZodError) {
    return {
      code: 'VALIDATION_ERROR',
      message: 'Permintaan tidak lolos validasi',
      details: zodDetails(error),
      unexpected: false,
    };
  }

  if (isBodyParserError(error)) {
    if (error.type === 'entity.too.large') {
      return {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Ukuran body permintaan melebihi batas 1 MB',
        details: [],
        unexpected: false,
      };
    }
    // entity.parse.failed dan entity.verify.failed: bentuk JSON-nya rusak.
    return {
      code: 'INVALID_JSON',
      message: 'Body permintaan bukan JSON yang sah',
      details: [],
      unexpected: false,
    };
  }

  if (error instanceof Error && error.message === CORS_REJECTION_MESSAGE) {
    return {
      code: 'CORS_ORIGIN_NOT_ALLOWED',
      message: 'Origin tidak diizinkan',
      details: [],
      unexpected: false,
    };
  }

  return {
    code: 'INTERNAL_ERROR',
    message: 'Terjadi kesalahan pada server',
    details: [],
    unexpected: true,
  };
}

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  // Kalau header sudah terkirim, respons tidak bisa diubah lagi. Menuliskan
  // envelope di sini justru merusak body yang sedang berjalan.
  if (res.headersSent) {
    logger.error(
      { err: error, request_id: req.id },
      'Error terjadi setelah respons mulai dikirim',
    );
    next(error);
    return;
  }

  const normalized = normalize(error);
  const status = isAppError(error)
    ? error.status
    : new AppError(normalized.code, normalized.message).status;

  const logPayload = {
    request_id: req.id,
    error_code: normalized.code,
    status_code: status,
    method: req.method,
    path: req.originalUrl,
    ...(normalized.context ?? {}),
  };

  if (normalized.unexpected) {
    // Hanya di sini stack trace dicatat, dan tidak pernah dikirim ke client.
    (req.log ?? logger).error({ ...logPayload, err: error }, normalized.message);
  } else {
    (req.log ?? logger).warn(logPayload, normalized.message);
  }

  res
    .status(status)
    .json(errorEnvelope(normalized.code, normalized.message, normalized.details));
};

/**
 * Rute yang tidak cocok apa pun. Dipasang SETELAH seluruh router dan SEBELUM
 * errorHandler.
 *
 * Perlu ada supaya 404 pun berbentuk envelope. Tanpa ini, Express membalas
 * halaman HTML bawaannya dan client harus menangani dua format.
 */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(
    new AppError('NOT_FOUND', `Rute ${req.method} ${req.originalUrl} tidak ada`),
  );
};
