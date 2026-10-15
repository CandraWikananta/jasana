/**
 * Controller `/workers/me`. Tidak menyentuh Prisma.
 */

import { asyncHandler } from '../../lib/async-handler';
import { sendOk } from '../../lib/envelope';
import { currentWorker } from '../../middlewares/rbac';
import * as workersService from './workers.service';

export const getMe = asyncHandler(async (req, res) => {
  sendOk(res, await workersService.getMyMembership(currentWorker(req)));
});

export const setAvailability = asyncHandler(async (req, res) => {
  sendOk(res, await workersService.setAvailability(currentWorker(req), req.body));
});

export const updateLocation = asyncHandler(async (req, res) => {
  sendOk(res, await workersService.updateLocation(currentWorker(req), req.body));
});
