/**
 * Rute webhook Xendit (PRD 4.3 Pembayaran dan webhook).
 *
 *   /webhooks/xendit/invoice   token callback dulu, baru validasi body (H13)
 *   /webhooks/xendit/refund    stub sesi 8a, dicatat IGNORED
 *   /webhooks/xendit/payout    stub sesi 8a, dicatat IGNORED
 */

import { timingSafeEqual } from 'node:crypto';
import { Router, type RequestHandler } from 'express';
import { env } from '../../config/env';
import { hashToken } from '../../lib/crypto';
import { Errors } from '../../lib/errors';
import { validate } from '../../middlewares/validate';
import * as controller from './webhooks.controller';
import { invoiceCallbackSchema } from './webhooks.schema';

/**
 * H13. Gagal tertutup kalau token di env atau header kosong. Yang dibandingkan
 * digest SHA-256 keduanya, supaya `timingSafeEqual` selalu mendapat panjang
 * yang sama dan panjang token tidak bocor lewat waktu respons.
 */
export const requireCallbackToken: RequestHandler = (req, _res, next) => {
  const expected = env.XENDIT_CALLBACK_TOKEN;
  const given = req.get('x-callback-token');
  const valid =
    Boolean(expected) && Boolean(given) && timingSafeEqual(Buffer.from(hashToken(given!)), Buffer.from(hashToken(expected)));
  next(valid ? undefined : Errors.unauthorized('Callback token tidak valid'));
};

export function createWebhooksRouter(): Router {
  const router = Router();
  router.post('/xendit/invoice', requireCallbackToken, validate({ body: invoiceCallbackSchema }), controller.invoice);
  // Stub sesi 8a: tanpa validate, payload apa pun dicatat setelah token lolos.
  router.post('/xendit/refund', requireCallbackToken, controller.refund);
  router.post('/xendit/payout', requireCallbackToken, controller.payout);
  return router;
}
