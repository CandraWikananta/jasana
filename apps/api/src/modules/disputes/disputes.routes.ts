/**
 * Rute `/disputes` (PRD 4.3 Dispute dan review). `:id` adalah id dispute, jadi
 * peran pemanggil di order-nya diselesaikan service lewat resolveOrderAccess.
 * Pembukaan sengketa ada di rute order (`POST /orders/:id/disputes`), antrean
 * dan putusan di rute admin.
 */

import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { singleFileUpload } from '../../middlewares/upload';
import { validate } from '../../middlewares/validate';
import { getNumberSetting } from '../settings/settings.service';
import * as controller from './disputes.controller';
import { disputeParamsSchema, evidenceBodySchema } from './disputes.schema';

export function createDisputesRouter(): Router {
  const router = Router();
  router.get('/:id', requireAuth, validate({ params: disputeParamsSchema }), controller.get);
  // D80: multipart lewat API, pola e-KYC. Ukuran dari platform_settings, sisanya di service.
  router.post(
    '/:id/evidences',
    requireAuth,
    validate({ params: disputeParamsSchema }),
    singleFileUpload({ field: 'file', maxSizeMb: () => getNumberSetting('dispute_evidence_max_size_mb') }),
    validate({ body: evidenceBodySchema }),
    controller.uploadEvidence,
  );
  return router;
}
