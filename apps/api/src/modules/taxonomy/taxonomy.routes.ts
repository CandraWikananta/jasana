/**
 * Rute `/taxonomy-requests` (PRD 4.3, Katalog). Hanya provider VERIFIED
 * (D74), supaya antrean admin tidak dibanjiri akun asal. Rute admin ada di
 * `admin.routes.ts`.
 */

import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { requireProvider } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import * as controller from './taxonomy.controller';
import { mineQuerySchema, submitRequestSchema } from './taxonomy.schema';

export function createTaxonomyRouter(): Router {
  const router = Router();
  router.use(requireAuth, requireProvider);

  router.post('/', validate({ body: submitRequestSchema }), controller.submit);
  router.get('/mine', validate({ query: mineQuerySchema }), controller.listMine);

  return router;
}
