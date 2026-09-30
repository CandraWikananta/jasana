/**
 * Menyiapkan environment sebelum modul apa pun diimpor.
 *
 * `src/config/env.ts` memvalidasi environment saat diimpor, jadi tanpa berkas
 * ini setiap uji yang mengimpor `app.ts` akan gagal di baris import, bukan di
 * assertion-nya.
 *
 * `dotenv` tidak menimpa nilai yang sudah ada di `process.env`, jadi nilai di
 * sini tetap menang walaupun ada `.env` di akar repo.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'dotenv';

/**
 * BASIS DATA UJI INTEGRASI.
 *
 * Uji integrasi menghapus seluruh isi tabel akun di antara kasus, jadi
 * TIDAK BOLEH menyentuh basis data pengembangan. Karena itu URL-nya variabel
 * tersendiri, `TEST_DATABASE_URL`, bukan `DATABASE_URL`. Kalau kosong, uji
 * integrasi dilewati (bukan dijalankan ke basis data sembarang).
 *
 * Pengaman kedua: nama basis datanya wajib memuat kata `test`. Salah tempel
 * URL Supabase ke TEST_DATABASE_URL akan menghentikan uji di sini, bukan
 * mengosongkan tabel users milik pengembangan.
 */
const rootEnvPath = resolve(__dirname, '../../../.env');
if (!process.env.TEST_DATABASE_URL && existsSync(rootEnvPath)) {
  const fromFile = parse(readFileSync(rootEnvPath)).TEST_DATABASE_URL;
  if (fromFile) process.env.TEST_DATABASE_URL = fromFile;
}

const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
if (testDatabaseUrl) {
  const databaseName = new URL(testDatabaseUrl).pathname.replace(/^\//, '');
  if (!/test/i.test(databaseName)) {
    throw new Error(
      `TEST_DATABASE_URL menunjuk basis data "${databaseName}". Uji integrasi mengosongkan ` +
        'tabel, jadi nama basis datanya wajib memuat kata "test".',
    );
  }
  // Menimpa, bukan `??=`: DATABASE_URL dari shell tidak boleh menang di sini.
  process.env.DATABASE_URL = testDatabaseUrl;
}

const defaults: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: '4001',
  DATABASE_URL: 'postgresql://postgres:secret@localhost:5432/jasana_test?schema=public',
  JWT_SECRET: 'secret-uji-yang-panjangnya-lebih-dari-32-karakter',
  JWT_ACCESS_TTL_MINUTES: '15',
  REFRESH_TOKEN_TTL_DAYS: '30',
  VERIFICATION_CODE_AES_KEY: '0'.repeat(64),
  XENDIT_SECRET_KEY: 'xnd_development_dummy',
  XENDIT_CALLBACK_TOKEN: 'callback-token-dummy',
  GEMINI_API_KEY: 'gemini-key-dummy',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-dummy',
  SMTP_HOST: 'smtp.example.com',
  SMTP_PORT: '587',
  SMTP_USER: 'smtp-user',
  SMTP_PASSWORD: 'smtp-password',
  SMTP_FROM_ADDRESS: 'noreply@jasana.test',
  APP_BASE_URL: 'http://localhost:3000',
  CORS_ORIGIN: 'http://localhost:3000',
};

for (const [key, value] of Object.entries(defaults)) {
  process.env[key] ??= value;
}

// Selalu test, apa pun isi .env di akar repo.
process.env.NODE_ENV = 'test';
