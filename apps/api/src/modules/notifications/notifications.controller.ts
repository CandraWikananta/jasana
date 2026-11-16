/**
 * Controller `/notifications`. Tidak menyentuh Prisma.
 */

import { asyncHandler } from '../../lib/async-handler';
import { sendOk } from '../../lib/envelope';
import { currentUser } from '../../middlewares/auth';
import * as service from './notifications.service';
import type { ListNotificationsQuery } from './notifications.schema';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listNotifications(currentUser(req).id, req.query as unknown as ListNotificationsQuery);
  sendOk(res, items, meta);
});

export const markRead = asyncHandler(async (req, res) => {
  sendOk(res, await service.markRead(currentUser(req).id, req.params.id!));
});

export const markAllRead = asyncHandler(async (req, res) => {
  sendOk(res, await service.markAllRead(currentUser(req).id));
});
