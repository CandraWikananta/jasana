/**
 * Rute `/notifications` (PRD 4.3). Cukup login, tanpa syarat email
 * terverifikasi: notifikasi keputusan akun pun harus bisa dibaca.
 */

import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import * as controller from './notifications.controller';
import { listNotificationsQuerySchema, notificationParamsSchema } from './notifications.schema';

export function createNotificationsRouter(): Router {
  const router = Router();
  router.use(requireAuth);
  router.get('/', validate({ query: listNotificationsQuerySchema }), controller.list);
  router.patch('/read-all', controller.markAllRead);
  router.patch('/:id/read', validate({ params: notificationParamsSchema }), controller.markRead);
  return router;
}
