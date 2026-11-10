/**
 * Rute order (PRD 4.3 Order). Setiap rute yang menyentuh satu order memakai
 * requireOrderParticipant: transitionOrder() tidak memeriksa kepemilikan.
 *
 *   /orders                     C, buat dan daftar sesuai peran
 *   /orders/:id/depart ... verify  lima transisi pelaksanaan, + requireAssignedWorker (6e)
 *   /orders/:id/payment         C, invoice aktif dan pembuatan ulang (D104, 7a)
 *   /dev/orders/:id/simulate-payment
 *   /dev/workers/presence       hanya terdaftar saat PAYMENT_GATEWAY=fake (D101, H92)
 *   /dev/orders/:id/deadline, /dev/jobs/:job/run   pemicu sweep T3, T6, T18, dan pemulihan webhook untuk Postman (6f, 7c)
 */

import { Router, type RequestHandler } from 'express';
import { requireAuth, requireEmailVerified } from '../../middlewares/auth';
import { requireAssignedWorker, requireOrderParticipant } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import * as controller from './orders.controller';
import {
  acceptOrderSchema,
  assignmentSchema,
  checkInSchema,
  createOrderSchema,
  crewSchema,
  devDeadlineSchema,
  devJobParamsSchema,
  devPresenceSchema,
  listOrdersQuerySchema,
  orderParamsSchema,
  reasonSchema,
  verifySchema,
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
  router.post('/:id/decline-offer', ...participant(), controller.declineOffer);
  router.post('/:id/cancel', ...participant(true), validate({ body: reasonSchema }), controller.cancel);
  router.patch('/:id/assignment', ...participant(), validate({ body: assignmentSchema }), controller.assignment);
  router.put('/:id/crew', ...participant(), validate({ body: crewSchema }), controller.crew);

  const assignee = [...participant(), requireAssignedWorker];
  router.post('/:id/depart', ...assignee, controller.depart);
  router.post('/:id/check-in', ...assignee, validate({ body: checkInSchema }), controller.checkIn);
  router.post('/:id/start', ...assignee, controller.start);
  router.post('/:id/finish', ...assignee, controller.finish);
  router.post('/:id/verify', ...assignee, validate({ body: verifySchema }), controller.verify);
  router.get('/:id/verification-code', ...participant(), controller.verificationCode);
  router.post('/:id/verification-code', ...participant(), controller.renewVerificationCode);
  router.get('/:id/payment', ...participant(), controller.payment);
  router.post('/:id/payment', ...participant(), controller.renewPayment);

  return router;
}

export function createDevRouter(): Router {
  const router = Router();
  router.post('/orders/:id/simulate-payment', ...participant(), controller.simulatePayment);
  router.post('/workers/presence', requireAuth, validate({ body: devPresenceSchema }), controller.devPresence);
  router.patch('/orders/:id/deadline', ...participant(), validate({ body: devDeadlineSchema }), controller.devBackdate);
  router.post('/jobs/:job/run', requireAuth, validate({ params: devJobParamsSchema }), controller.devRunJob);
  return router;
}
