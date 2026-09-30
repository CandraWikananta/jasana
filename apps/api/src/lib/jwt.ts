/**
 * Access token JWT (PRD Bagian 5.1, D76).
 *
 * Tanpa state: server tidak menyimpan apa pun tentang access token, jadi
 * masa berlakunya sengaja pendek (15 menit). Yang bisa dicabut adalah
 * refresh token, lihat modules/auth/session.service.ts.
 *
 * Payload memuat `provider_profile_id` dan `worker_id` supaya middleware
 * tidak perlu join di setiap permintaan untuk tahu pemanggilnya provider atau
 * pekerja. Nilainya bisa basi paling lama satu masa berlaku token, dan itu
 * diterima PRD karena operasi sensitif tetap memeriksa ulang ke basis data.
 */

import jwt from 'jsonwebtoken';
import type { UserRole } from '@jasana/database';
import { env } from '../config/env';

/** Algoritma DIPIN saat verifikasi, menutup serangan `alg: none`. */
const ALGORITHM = 'HS256' as const;

export interface AccessTokenClaims {
  user_id: string;
  role: UserRole;
  /** Terisi hanya kalau profil provider berstatus VERIFIED. */
  provider_profile_id: string | null;
  /** Terisi hanya kalau keanggotaan pekerja berstatus ACTIVE. */
  worker_id: string | null;
}

export function accessTokenTtlSeconds(): number {
  return env.JWT_ACCESS_TTL_MINUTES * 60;
}

export function signAccessToken(claims: AccessTokenClaims): string {
  return jwt.sign(claims, env.JWT_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: accessTokenTtlSeconds(),
  });
}

/**
 * Mengembalikan klaim kalau token sah, `null` kalau tidak.
 *
 * Sengaja tidak membedakan kedaluwarsa dan tanda tangan palsu ke pemanggil:
 * keduanya 401 UNAUTHORIZED, dan client menanggapinya dengan cara yang sama,
 * yaitu memanggil `/auth/refresh`.
 */
export function verifyAccessToken(token: string): AccessTokenClaims | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });
    if (typeof payload !== 'object' || payload === null) return null;

    const { user_id, role, provider_profile_id, worker_id } = payload as Record<string, unknown>;
    if (typeof user_id !== 'string' || (role !== 'CLIENT' && role !== 'ADMIN')) return null;

    return {
      user_id,
      role,
      provider_profile_id: typeof provider_profile_id === 'string' ? provider_profile_id : null,
      worker_id: typeof worker_id === 'string' ? worker_id : null,
    };
  } catch {
    return null;
  }
}
