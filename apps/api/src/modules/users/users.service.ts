/**
 * Akun milik pemanggil: profil, password, dan penggantian email.
 *
 * Penggantian email mengikuti empat pengaman D64:
 *   1. wajib password saat ini
 *   2. alamat lama tetap aktif sampai yang baru terverifikasi
 *      (`users.pending_email`, bukan langsung menimpa `users.email`)
 *   3. pemberitahuan dikirim ke alamat lama
 *   4. keunikan diperiksa ulang di dalam transaksi saat konfirmasi
 */

import { prisma } from '@jasana/database';
import { AppError, Errors } from '../../lib/errors';
import { hashPassword, verifyPassword } from '../../lib/crypto';
import { isUniqueViolation } from '../../lib/prisma-errors';
import { dispatchEmails, recordEmail } from '../notifications/email-outbox';
import { emailChangeConfirmationEmail, emailChangeNoticeEmail } from '../auth/account-emails';
import { revokeAllSessions } from '../auth/session.service';
import { consumeToken, invalidateTokens, issueToken } from '../auth/verification-token.service';
import { toUserDto, USER_PUBLIC_SELECT, type UserDto } from './user.mapper';
import type { UpdateMeBody } from './users.schema';

function wrongCurrentPassword(): AppError {
  // 422, bukan 401. Client yang menerima 401 akan menganggap access
  // token-nya mati dan membuang sesi, padahal yang salah hanya isian form.
  return Errors.validation([{ path: 'current_password', message: 'Password saat ini salah' }]);
}

function emailTaken(path: string): AppError {
  return Errors.validation([{ path, message: 'Alamat email sudah dipakai akun lain' }]);
}

function phoneTaken(): AppError {
  return Errors.validation([{ path: 'phone', message: 'Nomor ponsel sudah terdaftar' }]);
}

async function loadCredentials(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, email: true, passwordHash: true },
  });
  if (!user) throw Errors.unauthorized();
  return user;
}

// ---------------------------------------------------------------------------
// Profil
// ---------------------------------------------------------------------------

export async function updateMe(userId: string, input: UpdateMeBody): Promise<UserDto> {
  if (input.phone !== undefined) {
    const owner = await prisma.user.findUnique({ where: { phone: input.phone }, select: { id: true } });
    if (owner && owner.id !== userId) throw phoneTaken();
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.full_name !== undefined ? { fullName: input.full_name } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.avatar_url !== undefined ? { avatarUrl: input.avatar_url } : {}),
      },
      select: USER_PUBLIC_SELECT,
    });
    return toUserDto(user);
  } catch (error) {
    if (isUniqueViolation(error, 'phone')) throw phoneTaken();
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

/**
 * Ganti password. Seluruh refresh token dicabut (D76, H65), termasuk sesi
 * pemanggil sendiri, dan seluruh token PASSWORD_RESET dibatalkan (H35).
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ sessions_revoked: number }> {
  const user = await loadCredentials(userId);
  if (!(await verifyPassword(currentPassword, user.passwordHash))) throw wrongCurrentPassword();

  const passwordHash = await hashPassword(newPassword);

  const revoked = await prisma.$transaction(async (tx) => {
    const now = new Date();
    await tx.user.update({ where: { id: userId }, data: { passwordHash } });
    await invalidateTokens(tx, userId, 'PASSWORD_RESET', now);
    return revokeAllSessions(tx, userId, now);
  });

  return { sessions_revoked: revoked };
}

// ---------------------------------------------------------------------------
// Penggantian email (D64)
// ---------------------------------------------------------------------------

export async function requestEmailChange(
  userId: string,
  currentPassword: string,
  newEmail: string,
): Promise<{ pending_email: string; expires_at: string }> {
  const user = await loadCredentials(userId);
  if (!(await verifyPassword(currentPassword, user.passwordHash))) throw wrongCurrentPassword();

  if (newEmail === user.email) {
    throw Errors.validation([
      { path: 'new_email', message: 'Alamat baru sama dengan alamat saat ini' },
    ]);
  }

  // Pemeriksaan keunikan pertama dari dua. Yang kedua di confirmEmailChange.
  const owner = await prisma.user.findUnique({ where: { email: newEmail }, select: { id: true } });
  if (owner) throw emailTaken('new_email');

  const { emails, expiresAt } = await prisma.$transaction(async (tx) => {
    // issueToken membatalkan token EMAIL_CHANGE lama, jadi permintaan baru
    // menggantikan yang lama. Tidak pernah ada dua permintaan berjalan.
    const token = await issueToken(tx, userId, 'EMAIL_CHANGE');
    await tx.user.update({ where: { id: userId }, data: { pendingEmail: newEmail } });

    const confirmation = await recordEmail(tx, {
      userId,
      to: newEmail,
      ...emailChangeConfirmationEmail(user.fullName, newEmail, token.rawToken),
      referenceType: 'verification_token',
      referenceId: token.id,
    });
    const notice = await recordEmail(tx, {
      userId,
      to: user.email,
      ...emailChangeNoticeEmail(user.fullName, newEmail),
    });

    return { emails: [confirmation, notice], expiresAt: token.expiresAt };
  });

  void dispatchEmails(emails);
  return { pending_email: newEmail, expires_at: expiresAt.toISOString() };
}

export async function cancelEmailChange(userId: string): Promise<{ cancelled: boolean }> {
  const cancelled = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { pendingEmail: true } });
    if (!user) throw Errors.unauthorized();

    await invalidateTokens(tx, userId, 'EMAIL_CHANGE');
    await tx.user.update({ where: { id: userId }, data: { pendingEmail: null } });
    return user.pendingEmail !== null;
  });

  return { cancelled };
}

/**
 * Konfirmasi lewat tautan dari inbox baru. Baru di titik inilah
 * `users.email` berubah.
 *
 * Keunikan diperiksa lagi di dalam transaksi karena `pending_email` sengaja
 * tanpa unique index: selama 24 jam masa berlaku token, pemilik asli alamat
 * itu bisa saja mendaftar lebih dulu.
 */
export async function confirmEmailChange(rawToken: string): Promise<UserDto> {
  try {
    const user = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const token = await consumeToken(tx, rawToken, 'EMAIL_CHANGE', now);

      const current = await tx.user.findUniqueOrThrow({
        where: { id: token.userId },
        select: { pendingEmail: true },
      });
      // Pembatalan selalu membatalkan tokennya juga, jadi cabang ini hanya
      // terjadi kalau data dimanipulasi di luar API.
      if (!current.pendingEmail) {
        throw new AppError('TOKEN_INVALID', 'Tidak ada permintaan penggantian email yang aktif');
      }

      const owner = await tx.user.findUnique({
        where: { email: current.pendingEmail },
        select: { id: true },
      });
      if (owner && owner.id !== token.userId) throw emailTaken('email');

      return tx.user.update({
        where: { id: token.userId },
        data: { email: current.pendingEmail, pendingEmail: null, emailVerifiedAt: now },
        select: USER_PUBLIC_SELECT,
      });
    });

    return toUserDto(user);
  } catch (error) {
    // Jalur balapan: pemilik lain mengambil alamat itu di antara pemeriksaan
    // dan UPDATE. Unique index `users.email` yang menahannya.
    if (isUniqueViolation(error, 'email')) throw emailTaken('email');
    throw error;
  }
}
