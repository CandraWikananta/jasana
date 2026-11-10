import { asyncHandler } from '../../lib/async-handler';
import { sendOk } from '../../lib/envelope';
import { currentProvider } from '../../middlewares/rbac';
import type { WalletTransactionsQuery } from './wallets.schema';
import * as service from './wallets.service';

export const get = asyncHandler(async (req, res) => {
  sendOk(res, await service.getWallet(currentProvider(req)));
});

export const transactions = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listTransactions(currentProvider(req), req.query as unknown as WalletTransactionsQuery);
  sendOk(res, items, meta);
});
