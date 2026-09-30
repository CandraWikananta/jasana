/**
 * Rute `/auth` (PRD 4.3, bagian Authentication dan sesi).
 *
 * Berupa factory, bukan konstanta modul, karena memegang rate limiter
 * in-memory. Lihat middlewares/rateLimit.ts.
 *
 * `/auth/confirm-email-change` ada di PRD bagian ini, tapi logikanya milik
 * modul users bersama seluruh alur penggantian email.
 */

import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { requireAuth } from '../../middlewares/auth';
import { limitPerAccount, limitPerIp, RATE_LIMITS } from '../../middlewares/rateLimit';
import { confirmEmailChange } from '../users/users.controller';
import { confirmEmailChangeSchema } from '../users/users.schema';
import * as controller from './auth.controller';
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  tokenSchema,
} from './auth.schema';

export function createAuthRouter(): Router {
  const router = Router();

  // --- Publik ---
  router.post('/register', validate({ body: registerSchema }), controller.register);
  router.post(
    '/login',
    limitPerIp(RATE_LIMITS.login),
    validate({ body: loginSchema }),
    controller.login,
  );
  router.post('/refresh', validate({ body: refreshSchema }), controller.refresh);
  router.post('/verify-email', validate({ body: tokenSchema }), controller.verifyEmail);
  router.post(
    '/forgot-password',
    limitPerIp(RATE_LIMITS.forgotPassword),
    validate({ body: forgotPasswordSchema }),
    controller.forgotPassword,
  );
  router.post('/reset-password', validate({ body: resetPasswordSchema }), controller.resetPassword);
  router.post(
    '/confirm-email-change',
    validate({ body: confirmEmailChangeSchema }),
    confirmEmailChange,
  );

  // --- Butuh login, TIDAK butuh email terverifikasi ---
  router.post('/logout', requireAuth, validate({ body: logoutSchema }), controller.logout);
  router.post('/logout-all', requireAuth, controller.logoutAll);
  router.get('/sessions', requireAuth, controller.sessions);
  router.get('/me', requireAuth, controller.me);
  router.post(
    '/resend-verification',
    requireAuth,
    limitPerAccount(RATE_LIMITS.resendVerification),
    controller.resendVerification,
  );

  return router;
}
