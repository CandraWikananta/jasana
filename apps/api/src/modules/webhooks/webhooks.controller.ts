/**
 * Controller webhook. Tidak menyentuh Prisma.
 */

import { asyncHandler } from '../../lib/async-handler';
import { sendOk } from '../../lib/envelope';
import type { InvoiceCallback } from './webhooks.schema';
import * as service from './webhooks.service';

/** PRD 4.4 langkah 6: 200 apa pun hasil bisnisnya, supaya Xendit tidak retry. */
export const invoice = asyncHandler(async (req, res) => {
  await service.receiveInvoiceEvent(req.body as InvoiceCallback);
  sendOk(res, { received: true });
});
