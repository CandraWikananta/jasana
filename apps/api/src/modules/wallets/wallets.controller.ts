import { asyncHandler } from '../../lib/async-handler';
import { sendCreated, sendOk } from '../../lib/envelope';
import type { Page } from '../../lib/pagination';
import { currentUser } from '../../middlewares/auth';
import { currentProvider } from '../../middlewares/rbac';
import type { AdminWithdrawalsQuery, RequestWithdrawalBody, WalletTransactionsQuery } from './wallets.schema';
import * as service from './wallets.service';
import * as withdrawals from './withdrawals.service';

export const get = asyncHandler(async (req, res) => {
  sendOk(res, await service.getWallet(currentProvider(req)));
});

export const transactions = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listTransactions(currentProvider(req), req.query as unknown as WalletTransactionsQuery);
  sendOk(res, items, meta);
});

// ---- Withdrawal (sesi 8b) ---------------------------------------------------

export const requestWithdrawal = asyncHandler(async (req, res) => {
  sendCreated(res, await withdrawals.requestWithdrawal(currentProvider(req), req.body as RequestWithdrawalBody));
});

export const listMyWithdrawals = asyncHandler(async (req, res) => {
  const { items, meta } = await withdrawals.listMine(currentProvider(req), req.query as unknown as Page);
  sendOk(res, items, meta);
});

export const listWithdrawalsForAdmin = asyncHandler(async (req, res) => {
  const { items, meta } = await withdrawals.listForAdmin(req.query as unknown as AdminWithdrawalsQuery);
  sendOk(res, items, meta);
});

export const approveWithdrawal = asyncHandler(async (req, res) => {
  sendOk(res, await withdrawals.approveWithdrawal(currentUser(req).id, req.params.id!));
});

export const rejectWithdrawal = asyncHandler(async (req, res) => {
  sendOk(res, await withdrawals.rejectWithdrawal(currentUser(req).id, req.params.id!, req.body.rejection_reason));
});

export const syncWithdrawal = asyncHandler(async (req, res) => {
  sendOk(res, await withdrawals.syncWithdrawal(req.params.id!));
});
