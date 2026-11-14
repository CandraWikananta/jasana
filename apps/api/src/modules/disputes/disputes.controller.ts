/**
 * Controller sengketa (sesi 8d). Tidak menyentuh Prisma.
 */

import { asyncHandler } from '../../lib/async-handler';
import { sendCreated, sendOk } from '../../lib/envelope';
import { currentUser } from '../../middlewares/auth';
import { currentOrderAccess } from '../../middlewares/rbac';
import type { AdminDisputesQuery } from './disputes.schema';
import * as service from './disputes.service';

export const open = asyncHandler(async (req, res) => {
  sendCreated(res, await service.openDispute(currentOrderAccess(req), req.body));
});

export const get = asyncHandler(async (req, res) => {
  sendOk(res, await service.getDispute(currentUser(req).id, req.params.id!));
});

export const uploadEvidence = asyncHandler(async (req, res) => {
  const file = req.file ? { buffer: req.file.buffer, size: req.file.size } : undefined;
  const { description } = req.body as { description?: string };
  sendCreated(res, await service.uploadEvidence(currentUser(req).id, req.params.id!, file, description));
});

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listForAdmin(req.query as unknown as AdminDisputesQuery);
  sendOk(res, items, meta);
});

export const review = asyncHandler(async (req, res) => {
  sendOk(res, await service.reviewDispute(req.params.id!));
});

export const resolve = asyncHandler(async (req, res) => {
  sendOk(res, await service.resolveDispute(currentUser(req).id, req.params.id!, req.body));
});
