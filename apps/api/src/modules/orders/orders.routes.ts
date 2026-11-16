/**
 * Rute order (PRD 4.3 Order). Setiap rute yang menyentuh satu order memakai
 * requireOrderParticipant: transitionOrder() tidak memeriksa kepemilikan.
 *
 *   /orders                     C, buat dan daftar sesuai peran
 *   /orders/:id/depart ... verify  lima transisi pelaksanaan, + requireAssignedWorker (6e)
 *   /orders/:id/payment         C, invoice aktif dan pembuatan ulang (D104, 7a)
 *   /orders/:id/disputes        C/PR, buka sengketa T13, T15, T17, T19 (8d). Pekerja tidak berhak
 *   /dev/orders/:id/simulate-payment
 *   /dev/workers/presence       hanya terdaftar saat PAYMENT_GATEWAY=fake (D101, H92)
 *   /dev/orders/:id/deadline, /dev/jobs/:job/run   pemicu sweep T3, T6, T18, pemulihan webhook, dan retry email untuk Postman (6f, 7c, 10a)
 */

import { Router, type RequestHandler } from 'express';
import { requireAuth, requireEmailVerified } from '../../middlewares/auth';
import { requireAssignedWorker, requireOrderParticipant } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import * as controller from './orders.controller';
import * as disputes from '../disputes/disputes.controller';
import { openDisputeSchema } from '../disputes/disputes.schema';
import {
  acceptOrderSchema,
  assignmentSchema,
  checkInSchema,
  createOrderSchema,
  crewSchema,
  devDeadlineSchema,
  devSimulatePaymentSchema,
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
  router.post('/:id/disputes', ...participant(), validate({ body: openDisputeSchema }), disputes.open);

  return router;
}

export function createDevRouter(): Router {
  const router = Router();
  router.post('/orders/:id/simulate-payment', ...participant(), validate({ body: devSimulatePaymentSchema }), controller.simulatePayment);
  router.post('/workers/presence', requireAuth, validate({ body: devPresenceSchema }), controller.devPresence);
  router.patch('/orders/:id/deadline', ...participant(), validate({ body: devDeadlineSchema }), controller.devBackdate);
  router.post('/jobs/:job/run', requireAuth, validate({ params: devJobParamsSchema }), controller.devRunJob);
  return router;
}
