/**
 * Rute `/admin` (PRD 4.3). Fase 2: pengajuan provider dan perubahan tipe.
 * Fase 3: katalog dan usulan taksonomi.
 *
 * `GET /admin/provider-applications/:id` tidak ada di daftar endpoint PRD,
 * tapi dibutuhkan D80: bucket e-KYC private, jadi admin hanya bisa membuka
 * berkasnya lewat signed URL yang dibuat endpoint ini.
 */

import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import * as controller from './admin.controller';
import {
  applicationParamsSchema,
  listApplicationsQuerySchema,
  listTypeUpgradeQuerySchema,
  rejectApplicationSchema,
  typeUpgradeDecisionSchema,
} from './admin.schema';
import * as catalog from '../catalog/catalog.controller';
import {
  attributeParamsSchema,
  createAttributeSchema,
  createCategorySchema,
  createSubcategorySchema,
  idParamsSchema,
  updateAttributeSchema,
  updateCategorySchema,
  updateSubcategorySchema,
} from '../catalog/catalog.schema';
import * as taxonomy from '../taxonomy/taxonomy.controller';
import {
  adminListQuerySchema,
  decisionSchema,
  requestParamsSchema,
} from '../taxonomy/taxonomy.schema';

export function createAdminRouter(): Router {
  const router = Router();
  router.use(requireAuth, requireAdmin);

  router.get(
    '/provider-applications',
    validate({ query: listApplicationsQuerySchema }),
    controller.listApplications,
  );
  router.get(
    '/provider-applications/:id',
    validate({ params: applicationParamsSchema }),
    controller.getApplication,
  );
  router.post(
    '/provider-applications/:id/approve',
    validate({ params: applicationParamsSchema }),
    controller.approveApplication,
  );
  router.post(
    '/provider-applications/:id/reject',
    validate({ params: applicationParamsSchema, body: rejectApplicationSchema }),
    controller.rejectApplication,
  );

  router.get(
    '/type-upgrade-requests',
    validate({ query: listTypeUpgradeQuerySchema }),
    controller.listTypeUpgradeRequests,
  );
  router.patch(
    '/type-upgrade-requests/:id',
    validate({ params: applicationParamsSchema, body: typeUpgradeDecisionSchema }),
    controller.decideTypeUpgrade,
  );

  // Fase 3: katalog (D72, D67). DELETE seluruhnya soft.
  router.post('/categories', validate({ body: createCategorySchema }), catalog.createCategory);
  router.patch(
    '/categories/:id',
    validate({ params: idParamsSchema, body: updateCategorySchema }),
    catalog.updateCategory,
  );
  router.delete('/categories/:id', validate({ params: idParamsSchema }), catalog.deleteCategory);

  router.post('/subcategories', validate({ body: createSubcategorySchema }), catalog.createSubcategory);
  router.patch(
    '/subcategories/:id',
    validate({ params: idParamsSchema, body: updateSubcategorySchema }),
    catalog.updateSubcategory,
  );
  router.delete('/subcategories/:id', validate({ params: idParamsSchema }), catalog.deleteSubcategory);

  router.post(
    '/subcategories/:id/attributes',
    validate({ params: idParamsSchema, body: createAttributeSchema }),
    catalog.createAttribute,
  );
  router.patch(
    '/subcategories/:id/attributes/:attrId',
    validate({ params: attributeParamsSchema, body: updateAttributeSchema }),
    catalog.updateAttribute,
  );
  router.delete(
    '/subcategories/:id/attributes/:attrId',
    validate({ params: attributeParamsSchema }),
    catalog.deleteAttribute,
  );

  // Fase 3: usulan taksonomi (D74)
  router.get('/taxonomy-requests', validate({ query: adminListQuerySchema }), taxonomy.listForAdmin);
  router.patch(
    '/taxonomy-requests/:id',
    validate({ params: requestParamsSchema, body: decisionSchema }),
    taxonomy.decide,
  );

  return router;
}
