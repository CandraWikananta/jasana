/**
 * Controller pesan dalam order (sesi 10b). Tidak menyentuh Prisma.
 */

import { asyncHandler } from '../../lib/async-handler';
import { sendCreated, sendOk } from '../../lib/envelope';
import { currentUser } from '../../middlewares/auth';
import type { ListMessagesQuery } from './order-messages.schema';
import * as service from './order-messages.service';

export const send = asyncHandler(async (req, res) => {
  sendCreated(res, await service.sendMessage(currentUser(req).id, req.params.id!, (req.body as { content: string }).content));
});

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listMessages(currentUser(req).id, req.params.id!, req.query as unknown as ListMessagesQuery);
  sendOk(res, items, meta);
});

export const markRead = asyncHandler(async (req, res) => {
  sendOk(res, await service.markMessagesRead(currentUser(req).id, req.params.id!));
});
