/**
 * Logika autentikasi: registrasi, login, sesi, verifikasi email, reset
 * password (PRD 4.3, 5.1, D61 sampai D64, D76).
 *
 * Tidak menyentuh `req` atau `res`. Informasi permintaan yang dibutuhkan
 * (User-Agent, IP) datang lewat `SessionMeta`.
 */

import { prisma } from '@jasana/database';
import { AppError, Errors } from '../../lib/errors';
import { burnPasswordCheck, hashPassword, verifyPassword } from '../../lib/crypto';
import { accessTokenTtlSeconds, signAccessToken, type AccessTokenClaims } from '../../lib/jwt';
import { isUniqueViolation } from '../../lib/prisma-errors';
import { logger } from '../../lib/logger';
import { dispatchEmails, recordEmail } from '../notifications/email-outbox';
import { toUserDto, USER_PUBLIC_SELECT, type UserDto } from '../users/user.mapper';
import { emailVerificationEmail, passwordResetEmail } from './account-emails';
import type { LoginBody, RegisterBody } from './auth.schema';
import {
  listActiveSessions,
  revokeAllSessions,
  revokeRefreshToken,
  rotateRefreshToken,
  startSession,
  type ActiveSession,
  type IssuedRefreshToken,
  type SessionMeta,
} from './session.service';
import { consumeToken, invalidateTokens, issueToken } from './verification-token.service';

export interface AuthTokens {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_at: string;
}

const INVALID_CREDENTIALS = 'Email, nomor ponsel, atau password salah';

// ---------------------------------------------------------------------------
// Klaim access token
// ---------------------------------------------------------------------------

/**
 * Menyusun klaim JWT dari relasi, bukan dari kolom role (D4, D35).
 *
 * `provider_profile_id` hanya diisi kalau profilnya VERIFIED dan `worker_id`
 * hanya kalau keanggotaannya ACTIVE, mengikuti definisi aktor di CLAUDE.md.
 * Profil yang masih DRAFT atau PENDING tidak menjadikan pemiliknya provider.
 */
async function loadClaims(userId: string): Promise<AccessTokenClaims> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      providerProfile: { select: { id: true, verificationStatus: true } },
      workerMemberships: {
        where: { membershipStatus: 'ACTIVE' },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!user) throw Errors.unauthorized();

  return {
    user_id: user.id,
    role: user.role,
    provider_profile_id:
      user.providerProfile?.verificationStatus === 'VERIFIED' ? user.providerProfile.id : null,
    worker_id: user.workerMemberships[0]?.id ?? null,
  };
}

function buildTokens(claims: AccessTokenClaims, refresh: IssuedRefreshToken): AuthTokens {
  return {
    access_token: signAccessToken(claims),
    token_type: 'Bearer',
    expires_in: accessTokenTtlSeconds(),
    refresh_token: refresh.rawToken,
    refresh_token_expires_at: refresh.expiresAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Registrasi dan login
// ---------------------------------------------------------------------------

function duplicateError(field: 'email' | 'phone'): AppError {
  const label = field === 'email' ? 'Email' : 'Nomor ponsel';
  return Errors.validation([{ path: field, message: `${label} sudah terdaftar` }]);
}

/**
 * Registrasi. `email_verified_at` dibiarkan NULL dan tautan verifikasi
 * dikirim setelah commit (D62, D58). Login tetap boleh sebelum verifikasi.
 */
export async function register(input: RegisterBody): Promise<UserDto> {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { phone: input.phone }] },
    select: { email: true, phone: true },
  });
  if (existing) throw duplicateError(existing.email === input.email ? 'email' : 'phone');

  // bcrypt sengaja lambat, jadi dijalankan di luar transaksi supaya tidak
  // menahan koneksi basis data.
  const passwordHash = await hashPassword(input.password);

  try {
    const { user, email } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: input.full_name,
          email: input.email,
          phone: input.phone,
          passwordHash,
        },
        select: USER_PUBLIC_SELECT,
      });

      const token = await issueToken(tx, user.id, 'EMAIL_VERIFICATION');
      const content = emailVerificationEmail(user.fullName, token.rawToken);
      const email = await recordEmail(tx, {
        userId: user.id,
        to: user.email,
        ...content,
        referenceType: 'verification_token',
        referenceId: token.id,
      });

      return { user, email };
    });

    void dispatchEmails([email]);
    return toUserDto(user);
  } catch (error) {
    // Dua pendaftaran bersamaan dengan email yang sama bisa sama-sama lolos
    // pemeriksaan di atas. Unique index yang menahan salah satunya.
    if (isUniqueViolation(error, 'email')) throw duplicateError('email');
    if (isUniqueViolation(error, 'phone')) throw duplicateError('phone');
    throw error;
  }
}

export async function login(
  input: LoginBody,
  meta: SessionMeta,
): Promise<AuthTokens & { user: UserDto }> {
  const user = await prisma.user.findUnique({
    where: input.email !== undefined ? { email: input.email } : { phone: input.phone! },
    select: { ...USER_PUBLIC_SELECT, passwordHash: true, isActive: true },
  });

  if (!user) {
    // Menyamakan waktu respons dengan jalur email terdaftar.
    await burnPasswordCheck(input.password);
    throw Errors.unauthorized(INVALID_CREDENTIALS);
  }
  if (!(await verifyPassword(input.password, user.passwordHash))) {
    throw Errors.unauthorized(INVALID_CREDENTIALS);
  }
  // Diperiksa SETELAH password cocok, supaya status akun tidak bocor ke
  // orang yang tidak tahu passwordnya.
  if (!user.isActive) throw Errors.unauthorized('Akun dinonaktifkan');

  const refresh = await startSession(prisma, user.id, meta);
  const claims = await loadClaims(user.id);

  const { passwordHash: _hash, isActive: _active, ...publicUser } = user;
  return { ...buildTokens(claims, refresh), user: toUserDto(publicUser) };
}

// ---------------------------------------------------------------------------
// Refresh, logout, daftar sesi
// ---------------------------------------------------------------------------

/**
 * Menukar refresh token dengan pasangan token baru (rotasi, D76).
 *
 * Seluruh kegagalan dibalas 401 UNAUTHORIZED supaya client menanggapinya
 * dengan satu cara: kembali ke halaman login. Pesannya saja yang berbeda.
 */
export async function refresh(rawToken: string, meta: SessionMeta): Promise<AuthTokens> {
  const result = await rotateRefreshToken(rawToken, meta);

  if (!result.ok) {
    if (result.reason === 'REUSED') {
      // Kejadian keamanan, bukan sekadar galat client. Dicatat level warn
      // dengan penanda yang bisa dicari, supaya bisa dihitung di Bab IV.
      logger.warn(
        {
          security_event: 'refresh_token_reuse',
          user_id: result.userId,
          family_id: result.familyId,
          revoked_count: result.revokedCount,
        },
        'Refresh token yang sudah dicabut dipakai ulang, seluruh family dicabut',
      );
      throw Errors.unauthorized(
        'Refresh token sudah pernah dipakai. Demi keamanan seluruh sesi di perangkat ini dicabut, silakan login ulang',
      );
    }
    if (result.reason === 'USER_INACTIVE') throw Errors.unauthorized('Akun dinonaktifkan');
    throw Errors.unauthorized('Refresh token tidak valid atau sudah kedaluwarsa');
  }

  const claims = await loadClaims(result.userId);
  return buildTokens(claims, result.refreshToken);
}

export async function logout(userId: string, rawToken: string): Promise<{ revoked: boolean }> {
  return { revoked: await revokeRefreshToken(userId, rawToken) };
}

export async function logoutAll(userId: string): Promise<{ revoked_count: number }> {
  return { revoked_count: await revokeAllSessions(prisma, userId) };
}

export function sessions(userId: string): Promise<ActiveSession[]> {
  return listActiveSessions(userId);
}

// ---------------------------------------------------------------------------
// Profil pemanggil
// ---------------------------------------------------------------------------

export interface MeDto extends UserDto {
  provider: { id: string; provider_type: string; verification_status: string } | null;
  worker: { id: string; provider_profile_id: string; is_owner: boolean } | null;
}

/**
 * Profil beserta status provider dan pekerja. Dual-role (D4, D35): satu akun
 * bisa sekaligus client, provider, dan pekerja di usaha orang lain.
 *
 * Status provider ditampilkan apa pun nilainya (termasuk DRAFT dan PENDING)
 * supaya frontend bisa menampilkan tahap pengajuan. Berbeda dengan klaim JWT
 * yang hanya mengisi `provider_profile_id` untuk VERIFIED.
 */
export async function me(userId: string): Promise<MeDto> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...USER_PUBLIC_SELECT,
      providerProfile: { select: { id: true, providerType: true, verificationStatus: true } },
      workerMemberships: {
        where: { membershipStatus: 'ACTIVE' },
        select: { id: true, providerProfileId: true, isOwner: true },
        take: 1,
      },
    },
  });
  if (!user) throw Errors.unauthorized();

  const { providerProfile, workerMemberships, ...publicUser } = user;
  const worker = workerMemberships[0];

  return {
    ...toUserDto(publicUser),
    provider: providerProfile
      ? {
          id: providerProfile.id,
          provider_type: providerProfile.providerType,
          verification_status: providerProfile.verificationStatus,
        }
      : null,
    worker: worker
      ? { id: worker.id, provider_profile_id: worker.providerProfileId, is_owner: worker.isOwner }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Verifikasi email (D62, D63)
// ---------------------------------------------------------------------------

export async function verifyEmail(rawToken: string): Promise<{ email_verified_at: string }> {
  const verifiedAt = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const token = await consumeToken(tx, rawToken, 'EMAIL_VERIFICATION', now);

    // Hanya mengisi kalau masih kosong, supaya waktu verifikasi pertama
    // tidak tertimpa.
    await tx.user.updateMany({
      where: { id: token.userId, emailVerifiedAt: null },
      data: { emailVerifiedAt: now },
    });
    const user = await tx.user.findUniqueOrThrow({
      where: { id: token.userId },
      select: { emailVerifiedAt: true },
    });
    return user.emailVerifiedAt!;
  });

  return { email_verified_at: verifiedAt.toISOString() };
}

/**
 * Kirim ulang tautan verifikasi. Token lama dibatalkan (H35).
 * Rate limit 1 per menit per akun dipasang di route.
 */
export async function resendVerification(
  userId: string,
): Promise<{ sent: boolean; email_verified: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, emailVerifiedAt: true },
  });
  if (!user) throw Errors.unauthorized();
  if (user.emailVerifiedAt) return { sent: false, email_verified: true };

  const email = await prisma.$transaction(async (tx) => {
    const token = await issueToken(tx, user.id, 'EMAIL_VERIFICATION');
    return recordEmail(tx, {
      userId: user.id,
      to: user.email,
      ...emailVerificationEmail(user.fullName, token.rawToken),
      referenceType: 'verification_token',
      referenceId: token.id,
    });
  });

  void dispatchEmails([email]);
  return { sent: true, email_verified: false };
}

/**
 * Dipakai middleware `requireEmailVerified`. Membaca basis data, bukan
 * klaim JWT, supaya user yang baru saja memverifikasi tidak perlu menunggu
 * access token-nya kedaluwarsa.
 */
export async function assertEmailVerified(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true, emailVerifiedAt: true },
  });
  if (!user || !user.isActive) throw Errors.unauthorized();
  if (!user.emailVerifiedAt) {
    throw new AppError(
      'EMAIL_NOT_VERIFIED',
      'Verifikasi alamat email Anda terlebih dahulu untuk melanjutkan',
    );
  }
}

// ---------------------------------------------------------------------------
// Lupa dan reset password
// ---------------------------------------------------------------------------

/**
 * SELALU selesai tanpa galat, terdaftar atau tidak (PRD 5.4, D64).
 *
 * Nilai kembaliannya sengaja `void`: controller tidak punya apa pun untuk
 * dibedakan, jadi tidak mungkin tidak sengaja membocorkan lewat respons.
 */
export async function forgotPassword(emailAddress: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: emailAddress },
    select: { id: true, email: true, fullName: true, isActive: true },
  });
  if (!user || !user.isActive) return;

  const email = await prisma.$transaction(async (tx) => {
    const token = await issueToken(tx, user.id, 'PASSWORD_RESET');
    return recordEmail(tx, {
      userId: user.id,
      to: user.email,
      ...passwordResetEmail(user.fullName, token.rawToken),
      referenceType: 'verification_token',
      referenceId: token.id,
    });
  });

  void dispatchEmails([email]);
}

/**
 * Ganti password lewat token. Dalam satu transaksi:
 *   1. token dipakai
 *   2. password diganti
 *   3. seluruh token PASSWORD_RESET lain dibatalkan (H35)
 *   4. seluruh refresh token dicabut (H65), karena kalau password bocor,
 *      pencurinya kemungkinan besar juga sedang memegang sesi
 */
export async function resetPassword(
  rawToken: string,
  newPassword: string,
): Promise<{ sessions_revoked: number }> {
  const passwordHash = await hashPassword(newPassword);

  const revoked = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const token = await consumeToken(tx, rawToken, 'PASSWORD_RESET', now);

    await tx.user.update({ where: { id: token.userId }, data: { passwordHash } });
    await invalidateTokens(tx, token.userId, 'PASSWORD_RESET', now);
    return revokeAllSessions(tx, token.userId, now);
  });

  return { sessions_revoked: revoked };
}
