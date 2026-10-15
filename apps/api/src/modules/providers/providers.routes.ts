/**
 * Rute `/providers` (PRD 4.3, bagian Provider dan e-KYC serta Pekerja).
 *
 * Tiga tingkat akses:
 *   C   requireAuth                        apply, unggah e-KYC, lihat pengajuan sendiri
 *   PR  requireAuth + requireProvider      profil usaha, perubahan tipe, kelola pekerja
 *   P   publik                             GET /providers/:id
 *
 * requireEmailVerified hanya di apply dan lamaran pekerja (D62), karena
 * keduanya memicu email ke pihak lain.
 *
 * Rute `/me...` didaftarkan SEBELUM `/:id`, supaya `me` tidak ditangkap
 * sebagai id.
 */

import { Router } from 'express';
import { requireAuth, requireEmailVerified } from '../../middlewares/auth';
import { requireProvider } from '../../middlewares/rbac';
import { singleFileUpload } from '../../middlewares/upload';
import { validate } from '../../middlewares/validate';
import { getNumberSetting } from '../settings/settings.service';
import {
  approveWorkerSchema,
  assignmentsSettingSchema,
  listWorkersQuerySchema,
  rejectWorkerSchema,
  workerApplicationSchema,
  workerParamsSchema,
} from '../workers/workers.schema';
import * as controller from './providers.controller';
import {
  applyProviderSchema,
  kycDocumentSchema,
  providerParamsSchema,
  typeUpgradeSchema,
  updateProviderSchema,
} from './providers.schema';

export function createProvidersRouter(): Router {
  const router = Router();

  router.post(
    '/apply',
    requireAuth,
    requireEmailVerified,
    validate({ body: applyProviderSchema }),
    controller.apply,
  );

  // D80: multipart lewat API. Urutan: login, terima berkas dengan batas
  // ukuran dari platform_settings, validasi field teks, lalu service
  // (magic bytes, Storage, baru baris basis data).
  router.post(
    '/me/kyc-documents',
    requireAuth,
    singleFileUpload({ field: 'file', maxSizeMb: () => getNumberSetting('kyc_document_max_size_mb') }),
    validate({ body: kycDocumentSchema }),
    controller.uploadKycDocument,
  );

  router.get('/me', requireAuth, controller.getMe);
  router.patch(
    '/me',
    requireAuth,
    requireProvider,
    validate({ body: updateProviderSchema }),
    controller.updateMe,
  );
  router.post(
    '/me/type-upgrade',
    requireAuth,
    requireProvider,
    validate({ body: typeUpgradeSchema }),
    controller.requestTypeChange,
  );

  // Pengelolaan pekerja oleh pemilik
  router.get(
    '/me/workers',
    requireAuth,
    requireProvider,
    validate({ query: listWorkersQuerySchema }),
    controller.listWorkers,
  );
  router.post(
    '/me/workers/:id/approve',
    requireAuth,
    requireProvider,
    validate({ params: workerParamsSchema, body: approveWorkerSchema }),
    controller.approveWorker,
  );
  router.post(
    '/me/workers/:id/reject',
    requireAuth,
    requireProvider,
    validate({ params: workerParamsSchema, body: rejectWorkerSchema }),
    controller.rejectWorker,
  );
  router.delete(
    '/me/workers/:id',
    requireAuth,
    requireProvider,
    validate({ params: workerParamsSchema }),
    controller.removeWorker,
  );
  router.patch(
    '/me/workers/:id/assignments-setting',
    requireAuth,
    requireProvider,
    validate({ params: workerParamsSchema, body: assignmentsSettingSchema }),
    controller.setAssignmentsSetting,
  );

  router.post(
    '/:id/worker-applications',
    requireAuth,
    requireEmailVerified,
    validate({ params: providerParamsSchema, body: workerApplicationSchema }),
    controller.applyAsWorker,
  );
  router.get('/:id', validate({ params: providerParamsSchema }), controller.getPublic);

  return router;
}
