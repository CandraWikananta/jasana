/**
 * Token sekali pakai untuk verifikasi email, reset password, dan
 * penggantian email (D63, tabel `verification_tokens`).
 *
 * Tiga aturan yang dijaga di sini:
 *
 * 1. Yang disimpan hanya SHA-256 dari token mentah (H34).
 * 2. Membuat token baru SELALU membatalkan token lama untuk keperluan yang
 *    sama dengan mengisi `used_at` (H35). Tanpa itu beberapa tautan aktif
 *    berkeliaran sekaligus.
 * 3. Pemakaian bersifat atomik: `used_at` diisi lewat UPDATE bersyarat
 *    `used_at IS NULL`, jadi dua klik bersamaan pada tautan yang sama tidak
 *    bisa sama-sama berhasil.
 */

import type { Prisma, TokenPurpose } from '@jasana/database';
import { AppError } from '../../lib/errors';
import { generateToken, hashToken } from '../../lib/crypto';

/** D63: PASSWORD_RESET lebih pendek karena dampaknya pengambilalihan akun. */
export const TOKEN_TTL_MS: Record<TokenPurpose, number> = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000,
  EMAIL_CHANGE: 24 * 60 * 60 * 1000,
  PASSWORD_RESET: 60 * 60 * 1000,
};

export interface IssuedToken {
  id: string;
  /** Hanya untuk disisipkan ke tautan email. Jangan disimpan di mana pun. */
  rawToken: string;
  expiresAt: Date;
}

/** Membatalkan seluruh token aktif milik user untuk satu keperluan. */
export async function invalidateTokens(
  tx: Prisma.TransactionClient,
  userId: string,
  purpose: TokenPurpose,
  now: Date = new Date(),
): Promise<number> {
  const result = await tx.verificationToken.updateMany({
    where: { userId, purpose, usedAt: null },
    data: { usedAt: now },
  });
  return result.count;
}

/** Membatalkan token lama lalu menerbitkan yang baru, dalam transaksi pemanggil. */
export async function issueToken(
  tx: Prisma.TransactionClient,
  userId: string,
  purpose: TokenPurpose,
  now: Date = new Date(),
): Promise<IssuedToken> {
  await invalidateTokens(tx, userId, purpose, now);

  const rawToken = generateToken();
  const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS[purpose]);

  const row = await tx.verificationToken.create({
    data: {
      userId,
      purpose,
      tokenHash: hashToken(rawToken),
      createdAt: now,
      expiresAt,
    },
    select: { id: true },
  });

  return { id: row.id, rawToken, expiresAt };
}

/**
 * Memakai token: memeriksa lalu mengisi `used_at` secara atomik.
 *
 * Urutan pemeriksaan dibuat supaya pesan error jujur: token yang tidak
 * dikenal (atau dikenal tapi untuk keperluan lain) jadi TOKEN_INVALID, yang
 * sudah terpakai TOKEN_ALREADY_USED, yang lewat masa berlaku TOKEN_EXPIRED.
 * Token PASSWORD_RESET yang dikirim ke verify-email sengaja TOKEN_INVALID,
 * bukan pesan yang membocorkan bahwa token itu ada.
 */
export async function consumeToken(
  tx: Prisma.TransactionClient,
  rawToken: string,
  purpose: TokenPurpose,
  now: Date = new Date(),
): Promise<{ id: string; userId: string }> {
  const token = await tx.verificationToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    select: { id: true, userId: true, purpose: true, usedAt: true, expiresAt: true },
  });

  if (!token || token.purpose !== purpose) {
    throw new AppError('TOKEN_INVALID', 'Token tidak dikenali');
  }
  if (token.usedAt) {
    throw new AppError('TOKEN_ALREADY_USED', 'Token sudah dipakai atau sudah dibatalkan');
  }
  if (token.expiresAt <= now) {
    throw new AppError('TOKEN_EXPIRED', 'Token sudah kedaluwarsa, minta tautan baru');
  }

  // UPDATE bersyarat, bukan baca lalu tulis. Kalau permintaan lain memakai
  // token yang sama sepersekian detik lebih dulu, baris ini tidak cocok lagi.
  const claimed = await tx.verificationToken.updateMany({
    where: { id: token.id, usedAt: null },
    data: { usedAt: now },
  });
  if (claimed.count !== 1) {
    throw new AppError('TOKEN_ALREADY_USED', 'Token sudah dipakai atau sudah dibatalkan');
  }

  return { id: token.id, userId: token.userId };
}
