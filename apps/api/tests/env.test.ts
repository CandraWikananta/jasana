/**
 * Uji validasi environment.
 *
 * Yang dibuktikan di sini bukan "Zod bekerja", melainkan klaim PRD Bagian 5.6:
 * aplikasi GAGAL START kalau ada variabel yang kosong. Klaim itu tidak ada
 * gunanya kalau tidak diuji.
 */

import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/config/env';

/** Environment lengkap dan sah, sebagai titik awal setiap kasus. */
function validEnv(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'test',
    PORT: '4000',
    DATABASE_URL: 'postgresql://postgres:secret@localhost:5432/jasana_test?schema=public',
    JWT_SECRET: 'a'.repeat(48),
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
}

describe('loadEnv', () => {
  it('menerima environment yang lengkap dan mengoersi angka', () => {
    const env = loadEnv(validEnv());

    expect(env.PORT).toBe(4000);
    expect(env.SMTP_PORT).toBe(587);
    expect(env.JWT_ACCESS_TTL_MINUTES).toBe(15);
    expect(typeof env.PORT).toBe('number');
    expect(env.isTest).toBe(true);
    expect(env.isProduction).toBe(false);
  });

  it('memecah CORS_ORIGIN yang dipisah koma dan merapikan spasinya', () => {
    const env = loadEnv({
      ...validEnv(),
      CORS_ORIGIN: 'http://localhost:3000, https://jasana.test ',
    });

    expect(env.CORS_ORIGINS).toEqual(['http://localhost:3000', 'https://jasana.test']);
  });

  // Inti klaim PRD Bagian 5.6.
  const wajib = Object.keys(validEnv());

  it.each(wajib)('gagal kalau %s tidak ada', (key) => {
    const source = validEnv();
    delete source[key];

    expect(() => loadEnv(source)).toThrow(/tidak sah/);
  });

  it.each(wajib)('gagal kalau %s berisi string kosong', (key) => {
    expect(() => loadEnv({ ...validEnv(), [key]: '' })).toThrow(/tidak sah/);
  });

  it('gagal kalau variabel hanya berisi spasi', () => {
    expect(() => loadEnv({ ...validEnv(), JWT_SECRET: '   ' })).toThrow(/tidak sah/);
  });

  it('menolak JWT_SECRET yang lebih pendek dari 32 karakter', () => {
    expect(() => loadEnv({ ...validEnv(), JWT_SECRET: 'pendek' })).toThrow(
      /minimal 32 karakter/,
    );
  });

  it('menolak kunci AES yang bukan 64 karakter hex', () => {
    // AES-256 butuh tepat 32 byte. Kunci 63 hex akan lolos kalau hanya
    // panjang minimum yang diperiksa, lalu gagal saat order pertama dibuat.
    expect(() =>
      loadEnv({ ...validEnv(), VERIFICATION_CODE_AES_KEY: '0'.repeat(63) }),
    ).toThrow(/64 karakter hex/);

    expect(() =>
      loadEnv({ ...validEnv(), VERIFICATION_CODE_AES_KEY: 'z'.repeat(64) }),
    ).toThrow(/64 karakter hex/);
  });

  it('menolak DATABASE_URL yang bukan PostgreSQL', () => {
    expect(() =>
      loadEnv({ ...validEnv(), DATABASE_URL: 'mysql://root@localhost:3306/jasana' }),
    ).toThrow(/PostgreSQL/);
  });

  it('menolak NODE_ENV di luar tiga nilai yang dikenal', () => {
    expect(() => loadEnv({ ...validEnv(), NODE_ENV: 'staging' })).toThrow(
      /development, test, atau production/,
    );
  });

  it('menyebutkan nama variabel yang salah di pesan galatnya', () => {
    const source = validEnv();
    delete source.SMTP_HOST;
    delete source.GEMINI_API_KEY;

    // Yang membaca pesan ini sedang menyiapkan .env, jadi harus tahu baris
    // mana yang perlu diperbaiki, bukan cuma bahwa ada yang salah.
    expect(() => loadEnv(source)).toThrow(/SMTP_HOST/);
    expect(() => loadEnv(source)).toThrow(/GEMINI_API_KEY/);
  });
});
