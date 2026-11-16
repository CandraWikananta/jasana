/**
 * Controller laporan admin (D180). Tidak menyentuh Prisma.
 */

import { asyncHandler } from '../../lib/async-handler';
import { sendOk } from '../../lib/envelope';
import type { PagedPeriodQuery, PeriodQuery } from './reports.schema';
import * as service from './reports.service';

export const transactions = asyncHandler(async (req, res) => {
  sendOk(res, await service.transactionsReport(req.query as unknown as PeriodQuery));
});

export const revenue = asyncHandler(async (req, res) => {
  sendOk(res, await service.revenueReport(req.query as unknown as PeriodQuery));
});

export const providers = asyncHandler(async (req, res) => {
  const { data, meta } = await service.providersReport(req.query as unknown as PagedPeriodQuery);
  sendOk(res, data, meta);
});

export const workers = asyncHandler(async (req, res) => {
  const { data, meta } = await service.workersReport(req.query as unknown as PagedPeriodQuery);
  sendOk(res, data, meta);
});
