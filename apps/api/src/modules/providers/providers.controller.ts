/**
 * Controller provider, e-KYC, dan pengelolaan pekerja oleh pemilik.
 * Tidak menyentuh Prisma.
 */

import type { Request } from 'express';
import type { KycDocumentType, WorkerMembershipStatus } from '@jasana/database';
import { asyncHandler } from '../../lib/async-handler';
import { sendCreated, sendOk } from '../../lib/envelope';
import { currentUser } from '../../middlewares/auth';
import { currentProvider } from '../../middlewares/rbac';
import * as providersService from './providers.service';
import * as kycService from './kyc.service';
import * as applicationsService from '../workers/worker-applications.service';
import * as providerWorkersService from '../workers/provider-workers.service';

function paramId(req: Request): string {
  return req.params.id!;
}

export const apply = asyncHandler(async (req, res) => {
  sendOk(res, await providersService.applyAsProvider(currentUser(req).id, req.body));
});

/**
 * multer menaruh berkas di `req.file`. Yang diteruskan ke service hanya
 * buffer dan ukurannya: `mimetype` dan `originalname` dari client sengaja
 * TIDAK diteruskan, supaya service tidak mungkin tergoda memakainya (D80).
 */
export const uploadKycDocument = asyncHandler(async (req, res) => {
  const file = req.file ? { buffer: req.file.buffer, size: req.file.size } : undefined;
  const documentType = req.body.document_type as KycDocumentType;
  sendCreated(res, await kycService.uploadKycDocument(currentUser(req).id, documentType, file));
});

export const getMe = asyncHandler(async (req, res) => {
  sendOk(res, await providersService.getMyProvider(currentUser(req).id));
});

export const updateMe = asyncHandler(async (req, res) => {
  sendOk(res, await providersService.updateMyProvider(currentProvider(req), req.body));
});

export const requestTypeChange = asyncHandler(async (req, res) => {
  sendOk(res, await providersService.requestTypeChange(currentProvider(req), req.body));
});

export const getPublic = asyncHandler(async (req, res) => {
  sendOk(res, await providersService.getPublicProvider(paramId(req)));
});

// ---------------------------------------------------------------------------
// Pekerja
// ---------------------------------------------------------------------------

export const applyAsWorker = asyncHandler(async (req, res) => {
  sendCreated(
    res,
    await applicationsService.applyAsWorker(currentUser(req).id, paramId(req), req.body),
  );
});

export const listWorkers = asyncHandler(async (req, res) => {
  const status = req.query.membership_status as WorkerMembershipStatus | undefined;
  sendOk(res, await providerWorkersService.listWorkers(currentProvider(req), status));
});

export const approveWorker = asyncHandler(async (req, res) => {
  sendOk(
    res,
    await applicationsService.approveApplication(currentProvider(req), paramId(req), req.body),
  );
});

export const rejectWorker = asyncHandler(async (req, res) => {
  sendOk(
    res,
    await applicationsService.rejectApplication(currentProvider(req), paramId(req), req.body.reason),
  );
});

export const removeWorker = asyncHandler(async (req, res) => {
  sendOk(res, await providerWorkersService.removeWorker(currentProvider(req), paramId(req)));
});

export const setAssignmentsSetting = asyncHandler(async (req, res) => {
  sendOk(
    res,
    await providerWorkersService.setAcceptsAssignments(
      currentProvider(req),
      paramId(req),
      req.body.accepts_assignments,
    ),
  );
});
