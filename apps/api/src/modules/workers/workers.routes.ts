/**
 * Rute `/workers/me` (PRD 4.3). Seluruhnya untuk pekerja aktif (W).
 *
 * `GET /workers/me/orders` menyusul di Fase 6 bersama order.
 */

import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { requireWorker } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import * as controller from './workers.controller';
import { availabilitySchema, locationSchema } from './workers.schema';

export function createWorkersRouter(): Router {
  const router = Router();
  router.use(requireAuth, requireWorker);

  router.get('/me', controller.getMe);
  router.patch('/me/availability', validate({ body: availabilitySchema }), controller.setAvailability);
  router.patch('/me/location', validate({ body: locationSchema }), controller.updateLocation);

  return router;
}
