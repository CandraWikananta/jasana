/**
 * Bentuk JSON user yang boleh keluar dari API.
 *
 * Kolom dipilih EKSPLISIT lewat `USER_PUBLIC_SELECT`, bukan membuang
 * `password_hash` dari objek lengkap. Kalau suatu saat ada kolom sensitif
 * baru di `users`, pendekatan buang-yang-dilarang akan membocorkannya diam-diam.
 */

import type { Prisma } from '@jasana/database';

export const USER_PUBLIC_SELECT = {
  id: true,
  fullName: true,
  email: true,
  pendingEmail: true,
  phone: true,
  role: true,
  avatarUrl: true,
  emailVerifiedAt: true,
  createdAt: true,
} as const satisfies Prisma.UserSelect;

export type UserPublicRow = Prisma.UserGetPayload<{ select: typeof USER_PUBLIC_SELECT }>;

export interface UserDto {
  id: string;
  full_name: string;
  email: string;
  pending_email: string | null;
  phone: string;
  role: UserPublicRow['role'];
  avatar_url: string | null;
  email_verified: boolean;
  email_verified_at: string | null;
  created_at: string;
}

export function toUserDto(user: UserPublicRow): UserDto {
  return {
    id: user.id,
    full_name: user.fullName,
    email: user.email,
    pending_email: user.pendingEmail,
    phone: user.phone,
    role: user.role,
    avatar_url: user.avatarUrl,
    email_verified: user.emailVerifiedAt !== null,
    email_verified_at: user.emailVerifiedAt?.toISOString() ?? null,
    created_at: user.createdAt.toISOString(),
  };
}
