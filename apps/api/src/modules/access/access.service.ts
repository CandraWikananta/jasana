/**
 * Penentu aktor untuk middleware requireProvider, requireWorker, dan
 * requireAdmin (PRD 5.2).
 *
 * Seluruhnya dibaca dari BASIS DATA, bukan dari klaim JWT. Klaim bisa basi
 * sampai 15 menit, dan tepat setelah admin menyetujui e-KYC atau pemilik
 * menyetujui pelamar, token yang sedang dipegang pengguna masih menyebut
 * dia bukan provider atau bukan pekerja. Satu kueri ber-index per
 * permintaan lebih murah daripada menjelaskan kenapa tombol baru muncul
 * setelah login ulang.
 *
 * PROVIDER dan PEKERJA bukan nilai `role` (D4, D35). Keduanya ditentukan
 * lewat keberadaan relasi.
 */

import { prisma, type OrderActorType, type ProviderType } from '@jasana/database';
import { AppError } from '../../lib/errors';

export interface ProviderContext {
  id: string;
  userId: string;
  providerType: ProviderType;
}

export interface WorkerContext {
  id: string;
  providerProfileId: string;
  isOwner: boolean;
}

/** Provider = punya `provider_profiles` berstatus VERIFIED (D4). */
export async function resolveProvider(userId: string): Promise<ProviderContext> {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId },
    select: { id: true, userId: true, providerType: true, verificationStatus: true },
  });
  if (!profile || profile.verificationStatus !== 'VERIFIED') {
    throw new AppError('FORBIDDEN_ACTOR', 'Hanya provider terverifikasi yang boleh melakukan aksi ini');
  }
  return { id: profile.id, userId: profile.userId, providerType: profile.providerType };
}

/**
 * Pekerja = punya `provider_workers` berstatus ACTIVE (D35). Paling banyak
 * satu baris, dijamin partial unique index H23.
 */
export async function resolveWorker(userId: string): Promise<WorkerContext> {
  const worker = await prisma.providerWorker.findFirst({
    where: { userId, membershipStatus: 'ACTIVE' },
    select: { id: true, providerProfileId: true, isOwner: true },
  });
  if (!worker) {
    throw new AppError('FORBIDDEN_ACTOR', 'Hanya pekerja aktif yang boleh melakukan aksi ini');
  }
  return worker;
}

/** Admin = `users.role = 'ADMIN'`. Satu-satunya aktor yang memang role. */
export async function assertAdmin(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  });
  if (!user || !user.isActive || user.role !== 'ADMIN') {
    throw new AppError('FORBIDDEN_ACTOR', 'Hanya admin yang boleh melakukan aksi ini');
  }
}

export type OrderRole = 'CLIENT' | 'PROVIDER' | 'WORKER' | 'ADMIN';

export interface OrderAccess {
  orderId: string;
  userId: string;
  roles: Set<OrderRole>;
}

/**
 * requireOrderParticipant (PRD 5.2): client order itu, pemilik usaha yang
 * VERIFIED, atau penanggung jawab dengan keanggotaan ACTIVE. Pendamping di
 * `order_crew` sengaja tidak mendapat peran apa pun. ADMIN hanya kalau rutenya
 * mengizinkan, dan hanya diperiksa bila pemanggil bukan peserta.
 */
export async function resolveOrderAccess(userId: string, orderId: string, allowAdmin: boolean): Promise<OrderAccess> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      clientId: true,
      providerProfile: { select: { userId: true, verificationStatus: true } },
      assignedWorker: { select: { userId: true, membershipStatus: true } },
    },
  });
  if (!order) throw new AppError('NOT_FOUND', 'Order tidak ditemukan');

  const roles = new Set<OrderRole>();
  if (order.clientId === userId) roles.add('CLIENT');
  if (order.providerProfile.userId === userId && order.providerProfile.verificationStatus === 'VERIFIED') roles.add('PROVIDER');
  if (order.assignedWorker?.userId === userId && order.assignedWorker.membershipStatus === 'ACTIVE') roles.add('WORKER');
  if (roles.size === 0 && allowAdmin) {
    await assertAdmin(userId).then(() => roles.add('ADMIN'), () => undefined);
  }
  if (roles.size === 0) throw new AppError('FORBIDDEN_ACTOR', 'Anda bukan peserta order ini');
  return { orderId, userId, roles };
}

/**
 * Peran pelaku untuk satu endpoint: peran PERTAMA di `accepted` yang dimiliki
 * pemanggil. Tiap endpoint menyebut daftarnya sendiri, bukan prioritas global,
 * karena pemilik INDIVIDUAL yang juga penanggung jawab harus bertindak sebagai
 * PROVIDER saat accept tapi sebagai WORKER saat depart (6e).
 */
export function actorFrom(access: OrderAccess, accepted: OrderRole[]): OrderActorType {
  const role = accepted.find((candidate) => access.roles.has(candidate));
  if (!role) throw new AppError('FORBIDDEN_ACTOR', 'Peran Anda di order ini tidak berhak melakukan aksi ini');
  return role;
}
