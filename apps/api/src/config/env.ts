/**
 * Pemuat dan validator environment (PRD Bagian 5.6).
 *
 * ATURANNYA: aplikasi GAGAL START kalau ada variabel yang kosong atau
 * bentuknya salah. Bukan jalan lalu error di tengah jalan saat pertama kali
 * ada order masuk, karena kegagalan seperti itu baru ketahuan di produksi
 * dan pesannya jauh dari penyebabnya.
 *
 * Seluruh sisa aplikasi mengimpor `env` dari sini dan TIDAK PERNAH membaca
 * `process.env` langsung. Dengan begitu daftar variabel wajib cuma ada di
 * satu tempat, dan tipenya ikut terjamin.
 */

import { resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

/**
 * `.env` tinggal di akar monorepo, bukan di apps/api, supaya satu berkas
 * dipakai bersama API, migrasi Prisma, dan skrip verifikasi.
 */
loadDotenv({ path: resolve(__dirname, '../../../../.env') });

/** Wajib ada dan tidak boleh string kosong atau hanya spasi. */
const requiredString = (label: string) =>
  z
    .string({ required_error: `${label} wajib diisi` })
    .trim()
    .min(1, `${label} tidak boleh kosong`);

const port = (label: string) =>
  z.coerce
    .number({ invalid_type_error: `${label} harus berupa angka` })
    .int(`${label} harus bilangan bulat`)
    .min(1)
    .max(65535);

const positiveInt = (label: string) =>
  z.coerce
    .number({ invalid_type_error: `${label} harus berupa angka` })
    .int(`${label} harus bilangan bulat`)
    .positive(`${label} harus lebih besar dari nol`);

const envSchema = z.object({
  // --- Runtime ---
  NODE_ENV: z.enum(['development', 'test', 'production'], {
    errorMap: () => ({
      message: 'NODE_ENV harus development, test, atau production',
    }),
  }),
  PORT: port('PORT'),

  // --- Basis data ---
  DATABASE_URL: requiredString('DATABASE_URL').refine(
    (value) => value.startsWith('postgres://') || value.startsWith('postgresql://'),
    'DATABASE_URL harus URL PostgreSQL yang diawali postgres:// atau postgresql://',
  ),

  // --- Autentikasi ---
  // 32 karakter adalah batas bawah yang wajar untuk HMAC-SHA256. Secret
  // pendek bisa dibrute force, dan token akses memegang seluruh otorisasi.
  JWT_SECRET: requiredString('JWT_SECRET').min(
    32,
    'JWT_SECRET minimal 32 karakter',
  ),
  JWT_ACCESS_TTL_MINUTES: positiveInt('JWT_ACCESS_TTL_MINUTES'),
  REFRESH_TOKEN_TTL_DAYS: positiveInt('REFRESH_TOKEN_TTL_DAYS'),

  // --- Enkripsi kode verifikasi order ---
  // AES-256-GCM: kunci tepat 32 byte, ditulis 64 karakter hex.
  // Kode verifikasi order HARUS reversible karena client perlu melihatnya
  // berulang kali, berbeda dengan token akun yang di-hash.
  VERIFICATION_CODE_AES_KEY: requiredString('VERIFICATION_CODE_AES_KEY').regex(
    /^[0-9a-fA-F]{64}$/,
    'VERIFICATION_CODE_AES_KEY harus 64 karakter hex, yaitu kunci AES-256 sepanjang 32 byte',
  ),

  // --- Xendit ---
  XENDIT_SECRET_KEY: requiredString('XENDIT_SECRET_KEY'),
  XENDIT_CALLBACK_TOKEN: requiredString('XENDIT_CALLBACK_TOKEN'),

  // --- Gemini ---
  GEMINI_API_KEY: requiredString('GEMINI_API_KEY'),

  // --- Supabase Storage ---
  SUPABASE_URL: requiredString('SUPABASE_URL').url('SUPABASE_URL harus URL yang sah'),
  SUPABASE_SERVICE_ROLE_KEY: requiredString('SUPABASE_SERVICE_ROLE_KEY'),

  // --- SMTP ---
  SMTP_HOST: requiredString('SMTP_HOST'),
  SMTP_PORT: port('SMTP_PORT'),
  SMTP_USER: requiredString('SMTP_USER'),
  SMTP_PASSWORD: requiredString('SMTP_PASSWORD'),
  SMTP_FROM_ADDRESS: requiredString('SMTP_FROM_ADDRESS').email(
    'SMTP_FROM_ADDRESS harus alamat email yang sah',
  ),

  // --- Aplikasi ---
  APP_BASE_URL: requiredString('APP_BASE_URL').url('APP_BASE_URL harus URL yang sah'),
  CORS_ORIGIN: requiredString('CORS_ORIGIN'),
});

type RawEnv = z.infer<typeof envSchema>;

export type Env = Omit<RawEnv, 'CORS_ORIGIN'> & {
  /** Hasil pecahan `CORS_ORIGIN` yang dipisah koma. */
  CORS_ORIGINS: string[];
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
};

/**
 * Menyusun pesan yang menyebutkan variabel mana yang salah, bukan sekadar
 * "validation failed". Yang membaca pesan ini sedang menyiapkan lingkungan
 * dan butuh tahu baris mana di `.env` yang harus diperbaiki.
 */
function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    throw new Error(
      'Konfigurasi environment tidak sah, aplikasi tidak dijalankan.\n' +
        `${formatIssues(parsed.error)}\n` +
        'Lihat .env.example untuk daftar lengkapnya.',
    );
  }

  const { CORS_ORIGIN, ...rest } = parsed.data;

  const origins = CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (origins.length === 0) {
    throw new Error(
      'Konfigurasi environment tidak sah, aplikasi tidak dijalankan.\n' +
        '  - CORS_ORIGIN harus memuat minimal satu origin\n',
    );
  }

  return {
    ...rest,
    CORS_ORIGINS: origins,
    isProduction: rest.NODE_ENV === 'production',
    isDevelopment: rest.NODE_ENV === 'development',
    isTest: rest.NODE_ENV === 'test',
  };
}

/**
 * Divalidasi saat modul ini pertama diimpor, yaitu sebelum Express dibentuk.
 * Kalau ada yang kosong, proses berhenti di sini.
 */
export const env: Env = loadEnv();
