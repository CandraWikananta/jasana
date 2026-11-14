/**
 * Withdrawal usaha (PRD 4.3 Wallet dan withdrawal, D84, D134, D137, usulan D138 dan D139).
 *
 *   requestWithdrawal   debit lewat UPDATE bersyarat, baris REQUESTED, ledger WITHDRAWAL (H83)
 *   rejectWithdrawal    REQUESTED -> REJECTED beserta WITHDRAWAL_REVERSAL
 *   approveWithdrawal   REQUESTED -> APPROVED, commit, lalu payout di luar transaksi
 *   applyPayoutEvent    transaksi 2 webhook payout, dipakai juga syncWithdrawal (H106)
 *
 * Urutan kunci di setiap jalur: withdrawal dulu, lalu wallet. Notifikasi ke
 * pemilik usaha dicatat di transaksi dan dikirim setelah commit (jebakan 7).
 */

import { prisma, Prisma, type TransactionCreator, type Withdrawal, type WithdrawalStatus } from '@jasana/database';
import type { ProviderContext } from '../access/access.service';
import { AppError, Errors } from '../../lib/errors';
import { logger } from '../../lib/logger';
import { pageMeta, skipTake, type Page, type Paginated } from '../../lib/pagination';
import { paymentGateway, type PayoutResult } from '../../lib/payment-gateway';
import { dispatchEmails, recordEmail, type OutgoingEmail } from '../notifications/email-outbox';
import { withOrderTransaction, type AfterCommitTask } from '../orders/order-transition.service';
import { getNumberSetting } from '../settings/settings.service';
import type { PayoutCallback } from '../webhooks/webhooks.schema';
import type { AdminWithdrawalsQuery, RequestWithdrawalBody } from './wallets.schema';

type Tx = Prisma.TransactionClient;
type AfterCommit = (task: AfterCommitTask) => void;

const iso = (value: Date | null) => value?.toISOString() ?? null;
const rupiah = (value: Prisma.Decimal) => `Rp${value.toNumber().toLocaleString('id-ID')}`;

function toDto(w: Withdrawal) {
  return {
    id: w.id,
    amount: w.amount.toNumber(),
    admin_fee: w.adminFee.toNumber(),
    net_amount: w.netAmount.toNumber(),
    bank_code: w.bankCode,
    bank_account_number: w.bankAccountNumber,
    bank_account_name: w.bankAccountName,
    status: w.status,
    xendit_payout_id: w.xenditPayoutId,
    xendit_payout_status: w.xenditPayoutStatus,
    failure_code: w.failureCode,
    rejection_reason: w.rejectionReason,
    reviewed_at: iso(w.reviewedAt),
    completed_at: iso(w.completedAt),
    reversed_at: iso(w.reversedAt),
    created_at: w.createdAt.toISOString(),
  };
}

const getDto = async (id: string) => toDto(await prisma.withdrawal.findUniqueOrThrow({ where: { id } }));

/** Satu baris ledger dengan saldo sesudah perubahan, dari baris wallet yang sudah kita kunci. */
async function appendLedger(
  tx: Tx,
  wallet: { id: string; balanceAvailable: Prisma.Decimal; balancePending: Prisma.Decimal },
  withdrawal: Withdrawal,
  type: 'WITHDRAWAL' | 'WITHDRAWAL_REVERSAL',
  createdBy: TransactionCreator = 'SYSTEM',
): Promise<void> {
  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      withdrawalId: withdrawal.id,
      type,
      amountAvailableDelta: type === 'WITHDRAWAL' ? withdrawal.amount.negated() : withdrawal.amount,
      balanceAvailableAfter: wallet.balanceAvailable,
      balancePendingAfter: wallet.balancePending,
      description: `${type === 'WITHDRAWAL' ? 'Withdrawal' : 'Pembalikan withdrawal'} ${withdrawal.id}`,
      createdBy,
    },
  });
}

/** D134: `amount` penuh termasuk admin fee. H102 menjamin paling banyak satu per withdrawal. */
async function reverse(tx: Tx, withdrawal: Withdrawal, createdBy: TransactionCreator = 'SYSTEM'): Promise<void> {
  const wallet = await tx.wallet.update({
    where: { id: withdrawal.walletId },
    data: { balanceAvailable: { increment: withdrawal.amount } },
    select: { id: true, balanceAvailable: true, balancePending: true },
  });
  await appendLedger(tx, wallet, withdrawal, 'WITHDRAWAL_REVERSAL', createdBy);
}

async function lockWithdrawal(tx: Tx, id: string): Promise<Withdrawal | null> {
  await tx.$queryRaw`SELECT id FROM withdrawals WHERE id = ${id}::uuid FOR UPDATE`;
  return tx.withdrawal.findUnique({ where: { id } });
}

const stateConflict = (w: Withdrawal, action: string) =>
  new AppError('WITHDRAWAL_STATE_CONFLICT', `Withdrawal berstatus ${w.status} tidak bisa ${action}`);

/** Notifikasi ke pemilik usaha. Nomor rekening hanya empat digit terakhir. */
async function notifyOwner(tx: Tx, afterCommit: AfterCommit, w: Withdrawal, title: string, detail: string): Promise<void> {
  const { providerProfile } = await tx.wallet.findUniqueOrThrow({
    where: { id: w.walletId },
    select: { providerProfile: { select: { user: { select: { id: true, email: true, fullName: true } } } } },
  });
  const user = providerProfile.user;
  const email: OutgoingEmail = await recordEmail(tx, {
    userId: user.id,
    to: user.email,
    type: 'WITHDRAWAL',
    title,
    body: detail,
    subject: `Jasana: ${title}`,
    text: `Halo ${user.fullName},\n\n${detail}\n\nId withdrawal: ${w.id}`,
    referenceType: 'withdrawal',
    referenceId: w.id,
  });
  afterCommit(() => void dispatchEmails([email]));
}

const account = (w: Withdrawal) => `${w.bankCode} ****${w.bankAccountNumber.slice(-4)}`;
const refunded = (w: Withdrawal) => `Saldo ${rupiah(w.amount)} sudah dikembalikan ke saldo tersedia.`;

// ---------------------------------------------------------------------------
// Pemilik usaha
// ---------------------------------------------------------------------------

export async function requestWithdrawal(provider: ProviderContext, body: RequestWithdrawalBody) {
  // D84: nominal fee dari server, tidak pernah dari request.
  const [minAmount, adminFee] = await Promise.all([getNumberSetting('withdrawal_min_amount'), getNumberSetting('withdrawal_admin_fee')]);
  const netAmount = body.amount - adminFee;
  if (body.amount < minAmount || netAmount <= 0) {
    throw new AppError('WITHDRAWAL_BELOW_MINIMUM', `Nominal withdrawal minimal Rp${Math.max(minAmount, adminFee + 1).toLocaleString('id-ID')}`);
  }

  const created = await prisma.$transaction(async (tx) => {
    // Aturan 5: UPDATE bersyarat atomik, bukan baca lalu cek. Pengajuan yang
    // bersamaan menunggu kunci baris ini, lalu syarat saldonya dinilai ulang.
    const debited = await tx.wallet.updateMany({
      where: { providerProfileId: provider.id, balanceAvailable: { gte: body.amount } },
      data: { balanceAvailable: { decrement: body.amount } },
    });
    if (debited.count === 0) throw new AppError('INSUFFICIENT_BALANCE', 'Saldo tersedia tidak cukup');
    const wallet = await tx.wallet.findUniqueOrThrow({ where: { providerProfileId: provider.id } });
    const withdrawal = await tx.withdrawal.create({
      data: {
        walletId: wallet.id,
        amount: body.amount,
        adminFee,
        netAmount,
        bankCode: body.bank_code,
        bankAccountNumber: body.bank_account_number,
        bankAccountName: body.bank_account_name,
      },
    });
    await appendLedger(tx, wallet, withdrawal, 'WITHDRAWAL');
    return withdrawal;
  });
  return toDto(created);
}

export async function listMine(provider: ProviderContext, query: Page): Promise<Paginated<ReturnType<typeof toDto>>> {
  const where = { wallet: { providerProfileId: provider.id } };
  const [rows, total] = await prisma.$transaction([
    prisma.withdrawal.findMany({ where, orderBy: { createdAt: 'desc' }, ...skipTake(query) }),
    prisma.withdrawal.count({ where }),
  ]);
  return { items: rows.map(toDto), meta: pageMeta(query, total) };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

/** Antrean, terlama dulu. */
export async function listForAdmin(query: AdminWithdrawalsQuery): Promise<Paginated<unknown>> {
  // shortcut: filter status tanpa index sendiri (yang ada (wallet_id, status)), tambah @@index([status, createdAt]) kalau antrean membesar.
  const where = query.status ? { status: query.status } : {};
  const [rows, total] = await prisma.$transaction([
    prisma.withdrawal.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: { wallet: { select: { providerProfile: { select: { id: true, businessName: true } } } } },
      ...skipTake(query),
    }),
    prisma.withdrawal.count({ where }),
  ]);
  return {
    items: rows.map(({ wallet, ...row }) => ({
      ...toDto(row),
      provider: { id: wallet.providerProfile.id, business_name: wallet.providerProfile.businessName },
    })),
    meta: pageMeta(query, total),
  };
}

export async function rejectWithdrawal(adminId: string, id: string, reason: string) {
  await withOrderTransaction(async (tx, afterCommit) => {
    const current = await lockWithdrawal(tx, id);
    if (!current) throw Errors.notFound('Withdrawal tidak ditemukan');
    if (current.status !== 'REQUESTED') throw stateConflict(current, 'ditolak');
    const rejected = await tx.withdrawal.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason, reviewedBy: adminId, reviewedAt: new Date() },
    });
    await reverse(tx, rejected, 'ADMIN');
    await notifyOwner(tx, afterCommit, rejected, 'Withdrawal ditolak', `Pengajuan withdrawal ${rupiah(rejected.amount)} ditolak admin. Alasan: ${reason}. ${refunded(rejected)}`);
  });
  return getDto(id);
}

/**
 * Usulan D138 dan D139: 4xx selain 409 berarti Xendit pasti tidak membuat payout.
 * 409 berarti key sudah dipakai payout lain, jadi uang mungkin sudah keluar.
 */
function isFinalRejection(error: unknown): boolean {
  const status = error instanceof AppError ? error.context?.gateway_status : undefined;
  return typeof status === 'number' && status >= 400 && status < 500 && status !== 409;
}

function failureCodeOf(error: unknown): string {
  const context = error instanceof AppError ? (error.context ?? {}) : {};
  if (typeof context.gateway_error_code === 'string') return context.gateway_error_code.slice(0, 50);
  if (typeof context.gateway_status === 'number') return `HTTP_${context.gateway_status}`;
  if (context.gateway_timeout === true) return 'GATEWAY_TIMEOUT';
  if (context.gateway_timeout === false) return 'GATEWAY_UNREACHABLE';
  return 'GATEWAY_BAD_RESPONSE';
}

/** Penolakan final. Kalau webhook sudah mendahului, tidak ada efek apa pun. */
async function failApproved(id: string, failureCode: string): Promise<void> {
  await withOrderTransaction(async (tx, afterCommit) => {
    const { count } = await tx.withdrawal.updateMany({ where: { id, status: 'APPROVED' }, data: { status: 'FAILED', failureCode } });
    if (count !== 1) return;
    const failed = await tx.withdrawal.findUniqueOrThrow({ where: { id } });
    await reverse(tx, failed);
    await notifyOwner(tx, afterCommit, failed, 'Withdrawal gagal', `Pencairan ${rupiah(failed.netAmount)} ke ${account(failed)} ditolak gateway (${failureCode}). ${refunded(failed)}`);
  });
}

/**
 * Usulan D138. Dari APPROVED, endpoint yang sama berarti coba ulang payout
 * dengan key yang sama. Payload dibentuk dari baris saja, supaya identik di
 * setiap percobaan dan Xendit mengembalikan payout yang sama (D134).
 */
export async function approveWithdrawal(adminId: string, id: string) {
  const approved = await prisma.$transaction(async (tx) => {
    const current = await lockWithdrawal(tx, id);
    if (!current) throw Errors.notFound('Withdrawal tidak ditemukan');
    if (current.status === 'APPROVED') return current;
    if (current.status !== 'REQUESTED') throw stateConflict(current, 'disetujui');
    return tx.withdrawal.update({ where: { id }, data: { status: 'APPROVED', reviewedBy: adminId, reviewedAt: new Date() } });
  });

  // Di luar transaksi (jebakan 7).
  let payout: PayoutResult;
  try {
    payout = await paymentGateway.payout({
      withdrawalId: approved.id,
      channelCode: approved.bankCode,
      accountNumber: approved.bankAccountNumber,
      accountHolderName: approved.bankAccountName,
      amount: approved.netAmount.toNumber(),
      description: `Pencairan Jasana ${approved.id}`,
    });
  } catch (error) {
    if (isFinalRejection(error)) {
      await failApproved(id, failureCodeOf(error));
      return getDto(id);
    }
    // Timeout, jaringan, 5xx, atau 409: uang mungkin keluar. Tetap APPROVED, admin mencoba ulang.
    await prisma.withdrawal.updateMany({ where: { id, status: 'APPROVED' }, data: { failureCode: failureCodeOf(error) } });
    throw error;
  }

  // D137: respons awal selalu ACCEPTED, status akhir hanya dari webhook. Nol baris kalau webhook mendahului.
  await prisma.withdrawal.updateMany({
    where: { id, status: 'APPROVED' },
    data: { status: 'DISBURSING', xenditPayoutId: payout.payoutId, xenditPayoutStatus: asPayoutStatus(payout.status), failureCode: null },
  });
  return getDto(id);
}

const PAYOUT_STATUSES = ['ACCEPTED', 'REQUESTED', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REVERSED'] as const;
const asPayoutStatus = (status: string) => PAYOUT_STATUSES.find((s) => s === status) ?? null;

// ---------------------------------------------------------------------------
// Webhook payout
// ---------------------------------------------------------------------------

export interface PayoutOutcome {
  status: 'PROCESSED' | 'IGNORED';
  message?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Transisi yang dipicu status payout, atau null kalau event tidak cocok dengan status withdrawal. */
function nextStatus(current: WithdrawalStatus, payout: string): 'COMPLETED' | 'FAILED' | 'REVERSED' | null {
  // APPROVED ikut karena webhook bisa mendahului pembaruan setelah API kembali.
  const inFlight = current === 'APPROVED' || current === 'DISBURSING';
  if (payout === 'SUCCEEDED' && inFlight) return 'COMPLETED';
  if ((payout === 'FAILED' || payout === 'CANCELLED') && inFlight) return 'FAILED';
  if (payout === 'REVERSED' && current === 'COMPLETED') return 'REVERSED';
  return null;
}

/** Transaksi 2 webhook payout. Dicocokkan lewat `reference_id` = id withdrawal (D137). */
export async function applyPayoutEvent(tx: Tx, afterCommit: AfterCommit, event: Pick<PayoutCallback, 'data'>): Promise<PayoutOutcome> {
  const { id: payoutId, status, reference_id: referenceId, failure_code: failureCode } = event.data;
  if (!UUID.test(referenceId)) return { status: 'IGNORED', message: `reference_id ${referenceId} bukan id withdrawal (D137)` };
  const current = await lockWithdrawal(tx, referenceId);
  if (!current) return { status: 'IGNORED', message: 'reference_id tidak cocok dengan withdrawal mana pun (D137)' };

  const target = nextStatus(current.status, status);
  if (!target) return { status: 'IGNORED', message: `Payout ${status} untuk withdrawal ${current.status} tidak diproses` };

  const now = new Date();
  const updated = await tx.withdrawal.update({
    where: { id: current.id },
    data: {
      status: target,
      // D18: status mentah Xendit, tidak diterjemahkan. Keempat status di nextStatus anggota enum.
      xenditPayoutStatus: asPayoutStatus(status),
      xenditPayoutId: current.xenditPayoutId ?? payoutId,
      ...(target === 'COMPLETED' ? { completedAt: now } : {}),
      ...(target === 'FAILED' ? { failureCode: (failureCode ?? status).slice(0, 50) } : {}),
      ...(target === 'REVERSED' ? { reversedAt: now } : {}),
    },
  });

  if (target === 'COMPLETED') {
    await notifyOwner(tx, afterCommit, updated, 'Withdrawal berhasil', `Dana ${rupiah(updated.netAmount)} sudah dikirim ke ${account(updated)}.`);
  } else {
    await reverse(tx, updated);
    const detail =
      target === 'FAILED'
        ? `Pencairan ${rupiah(updated.netAmount)} ke ${account(updated)} gagal (${updated.failureCode}). ${refunded(updated)}`
        : `Pencairan ${rupiah(updated.netAmount)} ke ${account(updated)} dipantulkan bank tujuan. ${refunded(updated)}`;
    await notifyOwner(tx, afterCommit, updated, target === 'FAILED' ? 'Withdrawal gagal' : 'Withdrawal dikembalikan bank', detail);
  }
  return { status: 'PROCESSED' };
}

// ---------------------------------------------------------------------------
// Sinkronisasi (H106)
// ---------------------------------------------------------------------------

/** Status yang mungkin masih berubah di Xendit. COMPLETED ikut karena bisa REVERSED. */
const SYNCABLE: ReadonlySet<WithdrawalStatus> = new Set(['APPROVED', 'DISBURSING', 'COMPLETED']);

/**
 * POST /admin/withdrawals/:id/sync. Status ditanyakan ke Xendit lewat id payout,
 * atau lewat `reference_id` kalau id belum tersimpan (timeout saat approve), lalu
 * diterapkan lewat `applyPayoutEvent` yang sama dengan webhook.
 * shortcut: tidak ada cron sync otomatis (usulan D143), tambahkan kalau admin sering lupa menekan sync.
 */
export async function syncWithdrawal(id: string) {
  const current = await prisma.withdrawal.findUnique({ where: { id } });
  if (!current) throw Errors.notFound('Withdrawal tidak ditemukan');
  if (!SYNCABLE.has(current.status)) throw stateConflict(current, 'disinkronkan');

  // Di luar transaksi (jebakan 7). Galat gateway diteruskan jadi 502.
  const record = await paymentGateway.getPayout({ payoutId: current.xenditPayoutId, referenceId: id });
  const result = record ? await withOrderTransaction((tx, afterCommit) => applyPayoutEvent(tx, afterCommit, { data: record })) : null;
  const sync = {
    gateway_status: record?.status ?? null,
    outcome: result?.status ?? 'NOT_FOUND',
    message: result ? (result.message ?? null) : 'Payout tidak ditemukan di Xendit',
  };
  logger.info({ withdrawal_id: id, ...sync }, 'Sinkronisasi withdrawal');
  return { withdrawal: await getDto(id), sync };
}
