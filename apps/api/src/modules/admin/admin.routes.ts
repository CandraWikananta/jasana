/**
 * Rute `/admin` (PRD 4.3). Fase 2: pengajuan provider dan perubahan tipe.
 * Fase 3: katalog dan usulan taksonomi. Sesi 8b: antrean withdrawal.
 * Sesi 8c: antrean refund, jalur manual, dan sinkronisasi status ke Xendit (H106).
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
import * as refunds from '../refunds/refunds.controller';
import { adminRefundsQuerySchema, completeRefundSchema, refundParamsSchema } from '../refunds/refunds.schema';
import * as wallets from '../wallets/wallets.controller';
import { adminWithdrawalsQuerySchema, rejectWithdrawalSchema, withdrawalParamsSchema } from '../wallets/wallets.schema';

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

  // Sesi 8b: withdrawal (D134, usulan D138 dan D139)
  router.get('/withdrawals', validate({ query: adminWithdrawalsQuerySchema }), wallets.listWithdrawalsForAdmin);
  router.post('/withdrawals/:id/approve', validate({ params: withdrawalParamsSchema }), wallets.approveWithdrawal);
  router.post('/withdrawals/:id/reject', validate({ params: withdrawalParamsSchema, body: rejectWithdrawalSchema }), wallets.rejectWithdrawal);
  router.post('/withdrawals/:id/sync', validate({ params: withdrawalParamsSchema }), wallets.syncWithdrawal);

  // Sesi 8c: refund (D136, usulan D140 sampai D143)
  router.get('/refunds', validate({ query: adminRefundsQuerySchema }), refunds.list);
  router.post('/refunds/:id/complete', validate({ params: refundParamsSchema, body: completeRefundSchema }), refunds.complete);
  router.post('/refunds/:id/sync', validate({ params: refundParamsSchema }), refunds.sync);

  return router;
}
