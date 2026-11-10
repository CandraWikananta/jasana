/**
 * PR /providers/me/wallet (usulan D129). Dipasang sebelum router /providers,
 * sama seperti /providers/me/listings.
 */

import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { requireProvider } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import * as controller from './wallets.controller';
import { walletTransactionsQuerySchema } from './wallets.schema';

export function createWalletRouter(): Router {
  const router = Router();
  router.use(requireAuth, requireProvider);
  router.get('/', controller.get);
  router.get('/transactions', validate({ query: walletTransactionsQuerySchema }), controller.transactions);
  return router;
}
