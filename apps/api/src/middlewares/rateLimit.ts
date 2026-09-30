/**
 * Rate limiting in-memory (PRD 5.5, H36).
 *
 * Store di memori proses, bukan Redis. Sah karena API berjalan satu
 * instance. Kalau suatu saat jadi beberapa instance, setiap instance punya
 * hitungan sendiri dan batasnya efektif berlipat.
 *
 * Limiter dibuat lewat FACTORY, tidak sebagai konstanta modul. Setiap
 * `createApp()` mendapat store baru, jadi uji yang membuat app baru tidak
 * mewarisi hitungan dari uji sebelumnya.
 *
 * Kelebihan batas dibalas 429 RATE_LIMIT_EXCEEDED dalam envelope standar,
 * lewat errorHandler, bukan teks bawaan express-rate-limit.
 */

import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { AppError } from '../lib/errors';

interface LimitOptions {
  windowMs: number;
  limit: number;
  message: string;
}

function build(options: LimitOptions, keyGenerator?: (req: Parameters<RequestHandler>[0]) => string): RequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    ...(keyGenerator ? { keyGenerator } : {}),
    handler: (_req, _res, next) => {
      next(new AppError('RATE_LIMIT_EXCEEDED', options.message));
    },
  });
}

/** Dihitung per alamat IP. */
export function limitPerIp(options: LimitOptions): RequestHandler {
  return build(options);
}

/**
 * Dihitung per AKUN. Wajib dipasang SETELAH requireAuth.
 *
 * Per akun, bukan per IP, karena yang dicegah adalah satu akun membanjiri
 * inbox. Per IP akan meloloskan penyerang yang berganti jaringan, sekaligus
 * menghukum banyak pengguna sah di balik satu NAT kampus.
 */
export function limitPerAccount(options: LimitOptions): RequestHandler {
  return build(options, (req) => `user:${req.user?.id ?? `ip:${req.ip}`}`);
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Nilai PRD 5.5. */
export const RATE_LIMITS = {
  global: { windowMs: MINUTE, limit: 100, message: 'Terlalu banyak permintaan, coba lagi sebentar' },
  login: {
    windowMs: 15 * MINUTE,
    limit: 10,
    message: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit',
  },
  forgotPassword: {
    windowMs: HOUR,
    limit: 3,
    message: 'Terlalu banyak permintaan reset password, coba lagi nanti',
  },
  resendVerification: {
    windowMs: MINUTE,
    limit: 1,
    message: 'Tunggu satu menit sebelum meminta tautan verifikasi lagi',
  },
  emailChange: {
    windowMs: DAY,
    limit: 3,
    message: 'Batas permintaan penggantian email hari ini sudah tercapai',
  },
} as const satisfies Record<string, LimitOptions>;
