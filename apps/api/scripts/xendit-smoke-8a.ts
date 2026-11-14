/**
 * Uji coba manual refund dan payout ke sandbox Xendit (sesi 8a). Memakai
 * `xenditGateway` yang sama dengan aplikasi. Jalankan dari akar repo:
 *
 *   npx tsx apps/api/scripts/xendit-smoke-8a.ts invoice [amount]
 *       buat invoice (bawaan 20000) dan cetak id serta URL-nya. Dibayar manual
 *       di halaman checkout mode test. Invoice TIDAK di-expire.
 *
 *   npx tsx apps/api/scripts/xendit-smoke-8a.ts refund <invoice_id> <amount>
 *       refund invoice yang sudah dibayar, cetak id dan status atau error_code.
 *
 *   npx tsx apps/api/scripts/xendit-smoke-8a.ts payout [account_number]
 *       payout 10000 ke ID_BCA atas nama "Jasana Uji", lalu kirim ulang dengan
 *       Idempotency-key dan payload yang sama, dan cetak apakah id-nya sama.
 *
 * Pemicu hasil payout di mode test (docs.xendit.co, Payouts test scenarios):
 *   nomor rekening lain apa pun      SUCCEEDED
 *   98018521                         FAILED TRANSFER_ERROR
 *   123456                           FAILED TEMPORARY_TRANSFER_ERROR
 *   999999                           FAILED REJECTED_BY_CHANNEL
 *   121212                           FAILED INVALID_DESTINATION
 *   72019761 a.n. Walter Green       FAILED SLS_SENDER     (nama tidak bisa diatur lewat skrip ini)
 *   79018761 a.n. Walter White       FAILED SLS_RECIPIENT  (idem)
 *   amount melebihi saldo test       FAILED INSUFFICIENT_BALANCE
 * Dokumentasi tidak menyebut pemicu REVERSED.
 *
 * Kunci dibaca dari .env di akar repo lewat config/env. Kunci tidak pernah dicetak.
 */

import { randomUUID } from 'node:crypto';
import { env } from '../src/config/env';
import { isAppError } from '../src/lib/errors';
import { xenditGateway } from '../src/lib/payment-gateway';

// Kunci produksi berarti uang sungguhan: skrip ini hanya untuk mode test.
if (!env.XENDIT_SECRET_KEY.startsWith('xnd_development_')) {
  console.error('Ditolak: XENDIT_SECRET_KEY bukan kunci mode test (harus diawali xnd_development_).');
  process.exit(1);
}

/** AppError gateway tidak memuat kunci maupun isi balasan mentah, aman dicetak. */
const describeError = (error: unknown) =>
  isAppError(error) ? `${error.code} ${error.message} ${JSON.stringify(error.context ?? {})}` : error instanceof Error ? error.message : String(error);

const positiveInt = (value: string | undefined, label: string) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    console.error(`${label} harus bilangan bulat positif.`);
    process.exit(1);
  }
  return n;
};

async function invoice(amountArg?: string) {
  const amount = amountArg === undefined ? 20_000 : positiveInt(amountArg, 'amount');
  const created = await xenditGateway.createInvoice({
    externalId: `SMOKE8A-${randomUUID()}`,
    amount,
    description: 'Jasana smoke test sesi 8a',
    payerEmail: 'smoke@example.com',
    expiresAt: new Date(Date.now() + 60 * 60_000),
  });
  console.log('Invoice dibuat, bayar di checkout mode test:');
  console.log(`  id          ${created.invoiceId}`);
  console.log(`  invoice_url ${created.invoiceUrl}`);
  console.log(`  expires_at  ${created.expiresAt.toISOString()}`);
}

async function refund(invoiceId?: string, amountArg?: string) {
  if (!invoiceId) {
    console.error('Pakai: refund <invoice_id> <amount>');
    process.exit(1);
  }
  const amount = positiveInt(amountArg, 'amount');
  const referenceId = randomUUID();
  console.log(`reference_id ${referenceId}`);
  try {
    const result = await xenditGateway.refund({ referenceId, invoiceId, amount, reason: 'CANCELLATION' });
    console.log(`Refund DITERIMA: id ${result.refundId}, status ${result.status}`);
  } catch (error) {
    const code = isAppError(error) ? (error.context?.gateway_error_code ?? '-') : '-';
    const status = isAppError(error) ? (error.context?.gateway_status ?? '-') : '-';
    console.log(`Refund DITOLAK: http ${status}, error_code ${code}`);
    console.log(`  ${describeError(error)}`);
  }
}

async function payout(accountNumber = '1234567890') {
  const input = {
    withdrawalId: randomUUID(),
    channelCode: 'ID_BCA',
    accountNumber,
    accountHolderName: 'Jasana Uji',
    amount: 10_000,
    description: 'Jasana smoke test sesi 8a',
  };
  console.log(`Idempotency-key ${input.withdrawalId}, rekening ${accountNumber}`);
  const first = await xenditGateway.payout(input);
  console.log(`Payout pertama: id ${first.payoutId}, status ${first.status}`);
  try {
    const second = await xenditGateway.payout(input);
    console.log(
      `Payout kedua dengan key dan payload sama: id ${second.payoutId}, status ${second.status} -> ` +
        (second.payoutId === first.payoutId ? 'id SAMA, Xendit TIDAK membuat payout kedua' : 'id BERBEDA, Xendit membuat payout kedua'),
    );
  } catch (error) {
    console.log(`Payout kedua dengan key sama DITOLAK: ${describeError(error)}`);
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'invoice') return invoice(args[0]);
  if (command === 'refund') return refund(args[0], args[1]);
  if (command === 'payout') return payout(args[0]);
  console.error('Subperintah: invoice [amount] | refund <invoice_id> <amount> | payout [account_number]');
  process.exit(1);
}

main().catch((error: unknown) => {
  console.error(`Gagal: ${describeError(error)}`);
  process.exit(1);
});
