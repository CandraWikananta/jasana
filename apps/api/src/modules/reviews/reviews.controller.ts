/**
 * Controller review (sesi 10b, D179). Tidak menyentuh Prisma.
 */

import { asyncHandler } from '../../lib/async-handler';
import { sendCreated, sendOk } from '../../lib/envelope';
import { currentOrderAccess, currentProvider } from '../../middlewares/rbac';
import type { AdminReviewsQuery, ListReviewsQuery } from './reviews.schema';
import * as service from './reviews.service';

export const create = asyncHandler(async (req, res) => {
  sendCreated(res, await service.createReview(currentOrderAccess(req), req.body));
});

export const listForListing = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listListingReviews(req.params.id!, req.query as unknown as ListReviewsQuery);
  sendOk(res, items, meta);
});

export const reply = asyncHandler(async (req, res) => {
  sendOk(res, await service.replyToReview(currentProvider(req), req.params.id!, (req.body as { reply: string }).reply));
});

export const listForAdmin = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listReviewsForAdmin(req.query as unknown as AdminReviewsQuery);
  sendOk(res, items, meta);
});

export const setVisibility = asyncHandler(async (req, res) => {
  sendOk(res, await service.setReviewVisibility(req.params.id!, (req.body as { is_visible: boolean }).is_visible));
});
