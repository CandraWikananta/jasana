/**
 * Rute `/admin` Fase 2: pengajuan provider dan perubahan tipe (PRD 4.3).
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

  return router;
}
