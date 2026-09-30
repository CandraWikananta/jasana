/**
 * Sesi login lewat refresh token (D76, tabel `refresh_tokens`).
 *
 * Satu login = satu `family_id`. Setiap `/auth/refresh` mencabut token yang
 * dipakai dan menerbitkan penggantinya di family yang sama, jadi satu family
 * adalah rantai token yang saling menggantikan.
 *
 * DETEKSI PEMAKAIAN ULANG. Token yang sah tidak pernah dipakai dua kali,
 * karena setiap pemakaian langsung menukarnya dengan token baru. Jadi kalau
 * token yang sudah `revoked_at` datang lagi, pasti ada dua pihak memegang
 * salinannya, dan server tidak tahu mana yang pemilik asli. Satu-satunya
 * respons yang aman: cabut SELURUH family, paksa keduanya login ulang.
 *
 * Empat pemicu pencabutan (D76):
 *   logout                   satu token                 revokeRefreshToken
 *   logout semua perangkat   semua token milik user     revokeAllSessions
 *   ganti password           semua token milik user     revokeAllSessions
 *   pemakaian ulang          seluruh family_id          rotateRefreshToken
 */

import { randomUUID } from 'node:crypto';
import { prisma, type Prisma } from '@jasana/database';
import { env } from '../../config/env';
import { generateToken, hashToken } from '../../lib/crypto';

export interface SessionMeta {
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
}

export interface IssuedRefreshToken {
  id: string;
  familyId: string;
  /** Dikirim ke client sekali ini saja. Basis data hanya memegang hash-nya. */
  rawToken: string;
  expiresAt: Date;
}

function refreshTokenExpiry(now: Date): Date {
  return new Date(now.getTime() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

async function insertRefreshToken(
  tx: Prisma.TransactionClient,
  params: { id?: string; userId: string; familyId: string; meta: SessionMeta; now: Date },
): Promise<IssuedRefreshToken> {
  const rawToken = generateToken();
  const expiresAt = refreshTokenExpiry(params.now);

  const row = await tx.refreshToken.create({
    data: {
      ...(params.id ? { id: params.id } : {}),
      userId: params.userId,
      familyId: params.familyId,
      tokenHash: hashToken(rawToken),
      createdAt: params.now,
      expiresAt,
      // Kolomnya varchar(255) dan varchar(45). User-Agent dari client bisa
      // sepanjang apa pun, dan permintaan login tidak boleh gagal karenanya.
      userAgent: params.meta.userAgent?.slice(0, 255) ?? null,
      ipAddress: params.meta.ipAddress?.slice(0, 45) ?? null,
    },
    select: { id: true, familyId: true },
  });

  return { id: row.id, familyId: row.familyId, rawToken, expiresAt };
}

/** Login: membuka family baru. */
export function startSession(
  tx: Prisma.TransactionClient,
  userId: string,
  meta: SessionMeta,
  now: Date = new Date(),
): Promise<IssuedRefreshToken> {
  return insertRefreshToken(tx, { userId, familyId: randomUUID(), meta, now });
}

export type RotationResult =
  | { ok: true; userId: string; refreshToken: IssuedRefreshToken }
  | { ok: false; reason: 'UNKNOWN' | 'EXPIRED' | 'USER_INACTIVE' }
  | { ok: false; reason: 'REUSED'; userId: string; familyId: string; revokedCount: number };

/**
 * Menukar refresh token dengan yang baru.
 *
 * Kegagalan DIKEMBALIKAN, bukan dilempar. Ini disengaja: pencabutan family
 * saat pemakaian ulang harus ter-commit. Kalau fungsi ini melempar dari
 * dalam `$transaction`, pencabutannya ikut ter-rollback dan pencuri token
 * tetap memegang sesi yang hidup. Pemanggil yang melempar 401 setelah
 * transaksi selesai.
 *
 * Klaimnya memakai UPDATE bersyarat `revoked_at IS NULL`, pola yang sama
 * dengan klaim atomik Available Now. Kalau dua permintaan membawa token yang
 * sama bersamaan, yang kedua tertahan row lock sampai yang pertama commit,
 * lalu kondisinya dievaluasi ulang dan tidak cocok lagi. Yang kedua pun
 * diperlakukan sebagai pemakaian ulang. Tidak ada jendela baca-lalu-cek.
 */
export function rotateRefreshToken(
  rawToken: string,
  meta: SessionMeta,
  now: Date = new Date(),
): Promise<RotationResult> {
  const tokenHash = hashToken(rawToken);
  const replacementId = randomUUID();

  return prisma.$transaction(async (tx): Promise<RotationResult> => {
    const claimed = await tx.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: now } },
      data: { revokedAt: now, replacedBy: replacementId },
    });

    const current = await tx.refreshToken.findUnique({
      where: { tokenHash },
      select: {
        userId: true,
        familyId: true,
        revokedAt: true,
        user: { select: { isActive: true } },
      },
    });

    if (claimed.count === 0) {
      if (!current) return { ok: false, reason: 'UNKNOWN' };

      if (current.revokedAt) {
        const revoked = await tx.refreshToken.updateMany({
          where: { familyId: current.familyId, revokedAt: null },
          data: { revokedAt: now },
        });
        return {
          ok: false,
          reason: 'REUSED',
          userId: current.userId,
          familyId: current.familyId,
          revokedCount: revoked.count,
        };
      }

      return { ok: false, reason: 'EXPIRED' };
    }

    // Token lama sudah dicabut di atas dan itu ikut ter-commit, jadi akun
    // yang dinonaktifkan admin kehilangan sesinya di pemakaian berikutnya.
    if (!current || !current.user.isActive) return { ok: false, reason: 'USER_INACTIVE' };

    const refreshToken = await insertRefreshToken(tx, {
      id: replacementId,
      userId: current.userId,
      familyId: current.familyId,
      meta,
      now,
    });

    return { ok: true, userId: current.userId, refreshToken };
  });
}

/** Logout satu perangkat. Hanya mencabut token milik pemanggil sendiri. */
export async function revokeRefreshToken(
  userId: string,
  rawToken: string,
  now: Date = new Date(),
): Promise<boolean> {
  const result = await prisma.refreshToken.updateMany({
    where: { userId, tokenHash: hashToken(rawToken), revokedAt: null },
    data: { revokedAt: now },
  });
  return result.count > 0;
}

/** Logout semua perangkat, dan dipakai juga saat password diganti (H65). */
export async function revokeAllSessions(
  tx: Prisma.TransactionClient,
  userId: string,
  now: Date = new Date(),
): Promise<number> {
  const result = await tx.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: now },
  });
  return result.count;
}

export interface ActiveSession {
  session_id: string;
  user_agent: string | null;
  ip_address: string | null;
  signed_in_at: string;
  last_used_at: string;
  expires_at: string;
}

/**
 * Daftar perangkat aktif. Satu family yang masih punya token hidup = satu
 * perangkat. `user_agent` dan `ip_address` disimpan untuk halaman ini, bukan
 * untuk keamanan (D76).
 */
export async function listActiveSessions(
  userId: string,
  now: Date = new Date(),
): Promise<ActiveSession[]> {
  const live = await prisma.refreshToken.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: now } },
    orderBy: { createdAt: 'desc' },
    select: { familyId: true, userAgent: true, ipAddress: true, createdAt: true, expiresAt: true },
  });
  if (live.length === 0) return [];

  // Waktu login pertama = token tertua di family. Satu kueri agregat untuk
  // seluruh family sekaligus, bukan satu kueri per sesi.
  const firstSeen = await prisma.refreshToken.groupBy({
    by: ['familyId'],
    where: { familyId: { in: live.map((token) => token.familyId) } },
    _min: { createdAt: true },
  });
  const signedInAt = new Map(firstSeen.map((row) => [row.familyId, row._min.createdAt]));

  return live.map((token) => ({
    session_id: token.familyId,
    user_agent: token.userAgent,
    ip_address: token.ipAddress,
    signed_in_at: (signedInAt.get(token.familyId) ?? token.createdAt).toISOString(),
    last_used_at: token.createdAt.toISOString(),
    expires_at: token.expiresAt.toISOString(),
  }));
}
