/**
 * Saldo dan ledger usaha, hanya baca (PRD 4.3 Wallet dan withdrawal).
 * Dimajukan dari Fase 8 di sesi 7c (usulan D129) supaya Postman Fase 7 bisa
 * memeriksa ESCROW_HOLD dan ESCROW_RELEASE lewat API.
 */

import { prisma, type Prisma } from '@jasana/database';
import type { ProviderContext } from '../access/access.service';
import { pageMeta, skipTake, type Paginated } from '../../lib/pagination';
import type { WalletTransactionsQuery } from './wallets.schema';

const rupiah = (value: Prisma.Decimal) => value.toNumber();

/** Wallet dibuat bersama persetujuan usaha (Fase 2), jadi selalu ada untuk provider VERIFIED. */
export async function getWallet(provider: ProviderContext) {
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { providerProfileId: provider.id } });
  return {
    balance_available: rupiah(wallet.balanceAvailable),
    balance_pending: rupiah(wallet.balancePending),
    currency: wallet.currency,
  };
}

export async function listTransactions(provider: ProviderContext, query: WalletTransactionsQuery): Promise<Paginated<unknown>> {
  const where = { wallet: { providerProfileId: provider.id } };
  const [rows, total] = await prisma.$transaction([
    prisma.walletTransaction.findMany({ where, orderBy: { id: 'desc' }, ...skipTake(query) }),
    prisma.walletTransaction.count({ where }),
  ]);
  return {
    items: rows.map((row) => ({
      id: row.id.toString(),
      order_id: row.orderId,
      withdrawal_id: row.withdrawalId,
      type: row.type,
      amount_available_delta: rupiah(row.amountAvailableDelta),
      amount_pending_delta: rupiah(row.amountPendingDelta),
      balance_available_after: rupiah(row.balanceAvailableAfter),
      balance_pending_after: rupiah(row.balancePendingAfter),
      description: row.description,
      created_at: row.createdAt.toISOString(),
    })),
    meta: pageMeta(query, total),
  };
}
