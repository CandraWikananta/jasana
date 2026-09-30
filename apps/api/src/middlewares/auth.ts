/**
 * Dua lapis pertama dari middleware berlapis PRD 5.2.
 *
 *   requireAuth            access token valid                   401
 *   requireEmailVerified   `email_verified_at` terisi           403 EMAIL_NOT_VERIFIED
 *
 * requireProvider, requireWorker, requireAdmin, dan seterusnya menyusul di
 * fase yang memakainya.
 *
 * KAPAN requireEmailVerified DIPASANG (D62). Hanya di tiga aksi yang memicu
 * email ke pihak lain: membuat order, mengajukan diri jadi provider, dan
 * melamar jadi pekerja. Login, menjelajah katalog, mengelola alamat, dan
 * mengganti email TIDAK memakainya. Khusus ganti email, memasangnya justru
 * mengunci orang yang salah ketik alamat saat mendaftar: dia tidak bisa
 * memverifikasi alamat yang salah, dan tidak bisa menggantinya.
 */

import type { Request, RequestHandler } from 'express';
import { Errors } from '../lib/errors';
import { verifyAccessToken } from '../lib/jwt';
import { assertEmailVerified } from '../modules/auth/auth.service';

const BEARER = /^Bearer\s+(\S+)$/i;

export const requireAuth: RequestHandler = (req, _res, next) => {
  const match = BEARER.exec(req.headers.authorization ?? '');
  const claims = match ? verifyAccessToken(match[1]!) : null;

  if (!claims) {
    next(Errors.unauthorized());
    return;
  }

  req.user = {
    id: claims.user_id,
    role: claims.role,
    providerProfileId: claims.provider_profile_id,
    workerId: claims.worker_id,
  };
  next();
};

/** Wajib dipasang SETELAH requireAuth. */
export const requireEmailVerified: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    next(Errors.unauthorized());
    return;
  }
  assertEmailVerified(req.user.id).then(() => next(), next);
};

/**
 * Identitas pemanggil untuk controller di belakang requireAuth.
 * Melempar 401 kalau route lupa memasang requireAuth, bukan diam-diam
 * membaca `undefined`.
 */
export function currentUser(req: Request): NonNullable<Request['user']> {
  if (!req.user) throw Errors.unauthorized();
  return req.user;
}
