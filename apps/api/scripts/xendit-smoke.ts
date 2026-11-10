/**
 * Uji coba manual adapter Xendit ke sandbox (sesi 7a). Memakai `xenditGateway`
 * yang sama dengan aplikasi:
 *
 *   1. buat invoice kecil dan tampilkan URL-nya
 *   2. buat invoice kedua dengan external_id yang SAMA, lalu cetak apakah
 *      Xendit menerimanya (menentukan perilaku D124 dan pencocokan webhook 7b)
 *   3. expire semua invoice yang berhasil dibuat
 *
 *   npx tsx apps/api/scripts/xendit-smoke.ts            (dari akar repo)
 *
 * Kunci dibaca dari .env di akar repo lewat config/env. Kunci tidak pernah dicetak.
 */

import { randomUUID } from 'node:crypto';
import { env } from '../src/config/env';
import { isAppError } from '../src/lib/errors';
import { xenditGateway, type Invoice } from '../src/lib/payment-gateway';

// Kunci produksi berarti uang sungguhan: skrip ini hanya untuk mode test.
if (!env.XENDIT_SECRET_KEY.startsWith('xnd_development_')) {
  console.error('Ditolak: XENDIT_SECRET_KEY bukan kunci mode test (harus diawali xnd_development_).');
  process.exit(1);
}

/** AppError gateway tidak memuat kunci maupun isi balasan mentah, aman dicetak. */
const describeError = (error: unknown) =>
  isAppError(error) ? `${error.code} ${error.message} ${JSON.stringify(error.context ?? {})}` : error instanceof Error ? error.message : String(error);

const show = (label: string, invoice: Invoice) => {
  console.log(label);
  console.log(`  id          ${invoice.invoiceId}`);
  console.log(`  invoice_url ${invoice.invoiceUrl}`);
  console.log(`  expires_at  ${invoice.expiresAt.toISOString()}`);
};

async function main() {
  const input = {
    externalId: `SMOKE-${randomUUID()}`,
    amount: 10_000,
    description: 'Jasana smoke test sesi 7a',
    payerEmail: 'smoke@example.com',
    expiresAt: new Date(Date.now() + 10 * 60_000),
  };
  const created: Invoice[] = [];

  try {
    const first = await xenditGateway.createInvoice(input);
    created.push(first);
    show('Invoice pertama dibuat', first);

    try {
      const second = await xenditGateway.createInvoice(input);
      created.push(second);
      show(`Invoice kedua dengan external_id yang sama DITERIMA (${second.invoiceId === first.invoiceId ? 'id SAMA dengan yang pertama' : 'id berbeda'})`, second);
    } catch (error) {
      const code = isAppError(error) ? (error.context?.gateway_error_code ?? '-') : '-';
      console.log(`Invoice kedua dengan external_id yang sama DITOLAK, error_code: ${code}`);
      console.log(`  ${describeError(error)}`);
    }
  } finally {
    // Expire tetap dicoba walaupun langkah sebelumnya gagal, supaya tidak ada invoice tertinggal.
    for (const invoice of new Map(created.map((i) => [i.invoiceId, i])).values()) {
      try {
        await xenditGateway.expireInvoice(invoice.invoiceId);
        console.log(`Invoice ${invoice.invoiceId} di-expire.`);
      } catch (error) {
        console.error(`Gagal expire ${invoice.invoiceId}: ${describeError(error)}`);
        process.exitCode = 1;
      }
    }
  }
}

main().catch((error: unknown) => {
  console.error(`Gagal: ${describeError(error)}`);
  process.exit(1);
});
