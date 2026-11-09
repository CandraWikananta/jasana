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
 *   kode verifikasi order     AES-256-GCM, REVERSIBLE, karena client harus
 *                             bisa melihatnya berulang kali (PRD 5.3, D30).
 *                             Yang melindungi uang adalah lockout-nya (H8),
 *                             bukan enkripsinya
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

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

/** H7: `crypto.randomInt`, bukan `Math.random`. Enam digit termasuk nol di depan. */
export function generateVerificationCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

const AES_KEY = () => Buffer.from(env.VERIFICATION_CODE_AES_KEY, 'hex');

/** `iv.tag.ciphertext` dalam base64url. IV 12 byte acak, jadi kode yang sama tidak pernah menghasilkan teks yang sama. */
export function encryptVerificationCode(code: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', AES_KEY(), iv);
  const ciphertext = Buffer.concat([cipher.update(code, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64url')).join('.');
}

/** Melempar kalau teksnya diubah atau kuncinya lain (auth tag GCM). */
export function decryptVerificationCode(stored: string): string {
  const [iv, tag, ciphertext] = stored.split('.').map((part) => Buffer.from(part, 'base64url'));
  if (!iv || !tag || !ciphertext) throw new Error('Format kode verifikasi terenkripsi tidak sah');
  const decipher = createDecipheriv('aes-256-gcm', AES_KEY(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
