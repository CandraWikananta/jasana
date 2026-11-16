/**
 * Controller parameter sistem (D181). Tidak menyentuh Prisma.
 */

import { asyncHandler } from '../../lib/async-handler';
import { sendOk } from '../../lib/envelope';
import { currentUser } from '../../middlewares/auth';
import type { SettingsPatch } from './settings.service';
import * as service from './settings.service';

export const list = asyncHandler(async (_req, res) => {
  sendOk(res, await service.listSettings());
});

export const update = asyncHandler(async (req, res) => {
  sendOk(res, await service.updateSettings(currentUser(req).id, req.body as SettingsPatch));
});
