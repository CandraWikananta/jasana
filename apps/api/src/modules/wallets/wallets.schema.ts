import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination';

export const walletTransactionsQuerySchema = z.object(paginationQuery);
export type WalletTransactionsQuery = z.infer<typeof walletTransactionsQuerySchema>;

/** Kode channel Payouts v2 Xendit untuk enam bank yang dilayani (D137). */
export const PAYOUT_BANK_CODES = ['ID_BCA', 'ID_BNI', 'ID_BRI', 'ID_MANDIRI', 'ID_PERMATA', 'ID_BSI'] as const;

/**
 * POST /providers/me/withdrawals. Tidak ada field nominal fee: `admin_fee` dan
 * `net_amount` dari client dibuang `z.object` dan dihitung server (D84, H83).
 */
export const requestWithdrawalSchema = z.object({
  amount: z.number({ required_error: 'amount wajib diisi' }).int('amount harus rupiah bulat').positive(),
  bank_code: z.enum(PAYOUT_BANK_CODES, { errorMap: () => ({ message: `bank_code harus salah satu dari ${PAYOUT_BANK_CODES.join(', ')}` }) }),
  bank_account_number: z.string().regex(/^\d{1,40}$/, 'bank_account_number hanya digit, maksimal 40'),
  bank_account_name: z.string().trim().min(1).max(150),
});
export type RequestWithdrawalBody = z.infer<typeof requestWithdrawalSchema>;

export const withdrawalsQuerySchema = z.object(paginationQuery);

export const adminWithdrawalsQuerySchema = z.object({
  status: z.enum(['REQUESTED', 'APPROVED', 'DISBURSING', 'COMPLETED', 'REJECTED', 'FAILED', 'REVERSED']).optional(),
  ...paginationQuery,
});
export type AdminWithdrawalsQuery = z.infer<typeof adminWithdrawalsQuerySchema>;

export const withdrawalParamsSchema = z.object({ id: z.string().uuid('id withdrawal tidak sah') });

export const rejectWithdrawalSchema = z.object({
  rejection_reason: z.string({ required_error: 'rejection_reason wajib diisi' }).trim().min(5, 'rejection_reason minimal 5 karakter').max(1000),
});
