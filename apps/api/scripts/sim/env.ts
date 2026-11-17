/**
 * Diimpor PALING AWAL oleh seed-simulasi.ts, sebelum modul src mana pun, karena
 * `src/config/env.ts` memvalidasi environment saat diimpor (pola tests/setup.ts).
 *
 * Bedanya dengan tests/setup.ts: DATABASE_URL TIDAK ditimpa. Targetnya datang dari
 * shell atau `.env`, lalu diperiksa `assertTarget` sebelum ada yang ditulis.
 *
 * Yang dipaksa:
 *   NODE_ENV=test         mailer memakai jsonTransport, jadi tidak ada email sungguhan.
 *                         Baris notifikasi jadi SENT, sehingga cron retry dev tidak
 *                         mengirimnya ulang lewat SMTP sungguhan.
 *   PAYMENT_GATEWAY=fake  invoice, refund, dan payout tanpa jaringan (D101)
 *   LLM_GATEWAY=fake      tidak dipakai, tapi jangan sampai menyentuh Gemini
 *   SMTP_HOST=127.0.0.1   lapis kedua kalau jsonTransport suatu saat diganti
 * Variabel lain (Supabase Storage, kunci AES kode verifikasi) dibaca dari `.env`
 * tanpa ditampilkan, supaya server dev bisa membaca kode verifikasi buatan skrip.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'dotenv';

const rootEnvPath = resolve(__dirname, '../../../../.env');
const fromFile = existsSync(rootEnvPath) ? parse(readFileSync(rootEnvPath)) : {};

if (process.env.NODE_ENV === 'production' || fromFile.NODE_ENV === 'production') {
  console.error('Seed simulasi tidak boleh dijalankan dengan NODE_ENV=production.');
  process.exit(1);
}

for (const [key, value] of Object.entries(fromFile)) process.env[key] ??= value;

process.env.NODE_ENV = 'test';
process.env.PAYMENT_GATEWAY = 'fake';
process.env.LLM_GATEWAY = 'fake';
process.env.SMTP_HOST = '127.0.0.1';
process.env.SMTP_PORT = '2525';
