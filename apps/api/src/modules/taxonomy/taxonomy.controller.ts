/**
 * Controller usulan taksonomi, provider dan admin. Tidak menyentuh Prisma.
 */

import { asyncHandler } from '../../lib/async-handler';
import { sendCreated, sendOk } from '../../lib/envelope';
import type { Page } from '../../lib/pagination';
import { currentUser } from '../../middlewares/auth';
import { currentProvider } from '../../middlewares/rbac';
import * as service from './taxonomy.service';
import type { AdminListQuery } from './taxonomy.schema';

export const submit = asyncHandler(async (req, res) => {
  sendCreated(res, await service.submitRequest(currentProvider(req), req.body));
});

export const listMine = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listMine(currentProvider(req), req.query as unknown as Page);
  sendOk(res, items, meta);
});

export const listForAdmin = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listForAdmin(req.query as unknown as AdminListQuery);
  sendOk(res, items, meta);
});

export const decide = asyncHandler(async (req, res) => {
  sendOk(res, await service.decideRequest(currentUser(req).id, req.params.id!, req.body));
});
