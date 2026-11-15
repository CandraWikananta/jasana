/**
 * Rute chatbot `/chat` (PRD 4.3, D77). Akses P berarti sesi tamu lewat header
 * `X-Guest-Token`, bukan JWT. Klaim sesi menyusul di 9c.
 */

import { Router, type RequestHandler } from 'express';
import { optionalAuth, requireAuth } from '../../middlewares/auth';
import { limitPerAccount, limitPerIp, RATE_LIMITS } from '../../middlewares/rateLimit';
import { validate } from '../../middlewares/validate';
import { getNumberSetting } from '../settings/settings.service';
import * as controller from './chat.controller';
import { pageQuerySchema, sendMessageSchema, sessionParamsSchema } from './chat.schema';

/**
 * Lapis per IP untuk tamu (D154) dan per akun untuk terdaftar (PRD 5.5), dipilih
 * dari ada tidaknya JWT. Dipasang sebelum validasi dan basis data, jadi
 * percobaan dengan token palsu pun ikut terhitung (usulan D163).
 */
function messageLimiter(): RequestHandler {
  const guest = limitPerIp({
    windowMs: 60 * 60 * 1000,
    limit: () => getNumberSetting('guest_chat_ip_hourly_limit'),
    message: 'Terlalu banyak pesan chatbot dari jaringan ini, coba lagi nanti',
  });
  const registered = limitPerAccount(RATE_LIMITS.chatRegistered);
  return (req, res, next) => (req.user ? registered : guest)(req, res, next);
}

export function createChatRouter(): Router {
  const router = Router();
  const session = validate({ params: sessionParamsSchema });

  router.post('/guest-sessions', controller.createGuestSession);
  router.post('/sessions', requireAuth, controller.createUserSession);
  router.get('/sessions', requireAuth, validate({ query: pageQuerySchema }), controller.listUserSessions);
  router.get('/sessions/:id/messages', optionalAuth, validate({ params: sessionParamsSchema, query: pageQuerySchema }), controller.listMessages);
  router.post(
    '/sessions/:id/messages',
    optionalAuth,
    messageLimiter(),
    validate({ params: sessionParamsSchema, body: sendMessageSchema }),
    controller.sendMessage,
  );
  router.post('/sessions/:id/end', optionalAuth, session, controller.endSession);

  return router;
}
