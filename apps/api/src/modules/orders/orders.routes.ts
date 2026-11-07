/**
 * Rute order (PRD 4.3 Order). Setiap rute yang menyentuh satu order memakai
 * requireOrderParticipant: transitionOrder() tidak memeriksa kepemilikan.
 *
 *   /orders                     C, buat dan daftar sesuai peran
 *   /dev/orders/:id/simulate-payment
 *                               hanya terdaftar saat PAYMENT_GATEWAY=fake (D101)
 */

import { Router, type RequestHandler } from 'express';
import { requireAuth, requireEmailVerified } from '../../middlewares/auth';
import { requireOrderParticipant } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import * as controller from './orders.controller';
import {
  acceptOrderSchema,
  assignmentSchema,
  createOrderSchema,
  crewSchema,
  listOrdersQuerySchema,
  orderParamsSchema,
  reasonSchema,
} from './orders.schema';

const participant = (allowAdmin = false): RequestHandler[] => [
  requireAuth,
  validate({ params: orderParamsSchema }),
  requireOrderParticipant({ allowAdmin }),
];

export function createOrdersRouter(): Router {
  const router = Router();

  router.post('/', requireAuth, requireEmailVerified, validate({ body: createOrderSchema }), controller.create);
  router.get('/', requireAuth, validate({ query: listOrdersQuerySchema }), controller.list);
  router.get('/:id', ...participant(true), controller.get);
  router.get('/:id/history', ...participant(true), controller.history);
  router.post('/:id/accept', ...participant(), validate({ body: acceptOrderSchema }), controller.accept);
  router.post('/:id/reject', ...participant(), validate({ body: reasonSchema }), controller.reject);
  router.post('/:id/cancel', ...participant(true), validate({ body: reasonSchema }), controller.cancel);
  router.patch('/:id/assignment', ...participant(), validate({ body: assignmentSchema }), controller.assignment);
  router.put('/:id/crew', ...participant(), validate({ body: crewSchema }), controller.crew);

  return router;
}

export function createDevRouter(): Router {
  const router = Router();
  router.post('/orders/:id/simulate-payment', ...participant(), controller.simulatePayment);
  return router;
}
