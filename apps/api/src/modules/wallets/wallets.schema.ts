import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination';

export const walletTransactionsQuerySchema = z.object(paginationQuery);
export type WalletTransactionsQuery = z.infer<typeof walletTransactionsQuerySchema>;
