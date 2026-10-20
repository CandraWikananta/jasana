/**
 * Rute katalog publik (PRD 4.3, Katalog). Tanpa login, dipakai form listing
 * dan panel filter. Rute admin katalog ada di `admin.routes.ts`.
 */

import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import * as controller from './catalog.controller';
import { idParamsSchema } from './catalog.schema';

export function createCatalogRouter(): Router {
  const router = Router();

  router.get('/categories', controller.listCategories);
  router.get(
    '/categories/:id/subcategories',
    validate({ params: idParamsSchema }),
    controller.listSubcategories,
  );
  router.get(
    '/subcategories/:id/attributes',
    validate({ params: idParamsSchema }),
    controller.listAttributes,
  );

  return router;
}
