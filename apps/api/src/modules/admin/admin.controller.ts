/**
 * Controller admin Fase 2. Tidak menyentuh Prisma.
 */

import { asyncHandler } from '../../lib/async-handler';
import { sendOk } from '../../lib/envelope';
import { currentUser } from '../../middlewares/auth';
import * as service from './admin-providers.service';
import type { ListApplicationsQuery } from './admin.schema';
import type { Page } from '../../lib/pagination';

export const listApplications = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listApplications(req.query as unknown as ListApplicationsQuery);
  sendOk(res, items, meta);
});

export const getApplication = asyncHandler(async (req, res) => {
  sendOk(res, await service.getApplication(req.params.id!));
});

export const approveApplication = asyncHandler(async (req, res) => {
  sendOk(res, await service.approveApplication(currentUser(req).id, req.params.id!));
});

export const rejectApplication = asyncHandler(async (req, res) => {
  sendOk(res, await service.rejectApplication(req.params.id!, req.body.reason));
});

export const listTypeUpgradeRequests = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listTypeUpgradeRequests(req.query as unknown as Page);
  sendOk(res, items, meta);
});

export const decideTypeUpgrade = asyncHandler(async (req, res) => {
  sendOk(res, await service.decideTypeUpgrade(req.params.id!, req.body));
});
