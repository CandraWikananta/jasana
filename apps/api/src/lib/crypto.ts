/**
 * Primitif kriptografi akun (PRD Bagian 5.3, D63, D76).
 *
 * Dua perlakuan yang sengaja dibedakan:
 *
 *   password                  bcrypt, lambat dengan sengaja, karena ruang
 *                             tebakannya kecil (dipilih manusia)
 *   token email, refresh      SHA-256 biasa, karena tokennya 32 byte acak.
 *                             Ruang tebakan 2^256 tidak butuh hash lambat, dan
 *                             lookup lewat index unique butuh hash yang
 *                             deterministik, sesuatu yang bcrypt tidak bisa
 *
 * TOKEN MENTAH TIDAK PERNAH DISIMPAN. Yang masuk basis data hanya
 * `hashToken(token)`. Kalau isi basis data bocor, hash itu tidak bisa dipakai
 * untuk apa pun.
 *
 * Kode verifikasi order (AES, reversible) menyusul di Fase 6 dan bukan
 * urusan berkas ini sekarang.
 */

import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

/** PRD 5.1: bcrypt, cost factor 10. */
export const BCRYPT_COST = 10;

/** H34: `crypto.randomBytes(32)`, ditulis 64 karakter hex. */
const TOKEN_BYTES = 32;

export function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

/**
 * Hash bcrypt tiruan untuk menyamakan waktu respons login.
 *
 * Tanpa ini, login dengan email yang tidak terdaftar selesai jauh lebih
 * cepat (tidak ada bcrypt) dibanding email terdaftar dengan password salah,
 * dan selisih itu cukup untuk menebak siapa saja yang punya akun.
 */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('jasana-dummy-password', BCRYPT_COST);

export async function burnPasswordCheck(password: string): Promise<void> {
  await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
}
