/**
 * Controller refund admin (sesi 8c). Tidak menyentuh Prisma.
 */

import { asyncHandler } from '../../lib/async-handler';
import { sendOk } from '../../lib/envelope';
import { currentUser } from '../../middlewares/auth';
import type { AdminRefundsQuery } from './refunds.schema';
import * as service from './refunds.service';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listForAdmin(req.query as unknown as AdminRefundsQuery);
  sendOk(res, items, meta);
});

export const complete = asyncHandler(async (req, res) => {
  sendOk(res, await service.completeManually(currentUser(req).id, req.params.id!, (req.body as { completion_note: string }).completion_note));
});

export const sync = asyncHandler(async (req, res) => {
  sendOk(res, await service.syncRefund(req.params.id!));
});
