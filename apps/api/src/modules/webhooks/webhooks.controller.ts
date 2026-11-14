/**
 * Controller webhook. Tidak menyentuh Prisma.
 */

import { asyncHandler } from '../../lib/async-handler';
import { sendOk } from '../../lib/envelope';
import type { InvoiceCallback, PayoutCallback, RefundCallback } from './webhooks.schema';
import * as service from './webhooks.service';

/** PRD 4.4 langkah 6: 200 apa pun hasil bisnisnya, supaya Xendit tidak retry. */
export const invoice = asyncHandler(async (req, res) => {
  await service.receiveInvoiceEvent(req.body as InvoiceCallback);
  sendOk(res, { received: true });
});

/** Sama dengan invoice: 200 apa pun hasil bisnisnya (D136). */
export const refund = asyncHandler(async (req, res) => {
  await service.receiveRefundEvent(req.body as RefundCallback);
  sendOk(res, { received: true });
});

/** Sama dengan invoice: 200 apa pun hasil bisnisnya (D137). */
export const payout = asyncHandler(async (req, res) => {
  await service.receivePayoutEvent(req.body as PayoutCallback);
  sendOk(res, { received: true });
});
