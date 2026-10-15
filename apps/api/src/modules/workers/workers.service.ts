/**
 * Sisi pekerja sendiri: `/workers/me` (PRD 4.3).
 *
 * `accepts_assignments` dan `is_available` adalah dua hal berbeda (D39):
 *
 *   accepts_assignments  diatur PEMILIK, menetap. false = tidak pernah turun
 *                        ke lapangan, di mode apa pun
 *   is_available         diatur PEKERJA, toggle harian untuk Available Now
 *
 * is_available hanya boleh true kalau accepts_assignments true. Dijaga
 * dengan UPDATE bersyarat, bukan baca lalu cek: kalau pemilik mematikan
 * kesediaan pada detik yang sama pekerja menyalakan toggle, salah satu
 * UPDATE menunggu yang lain dan kondisinya dievaluasi ulang, jadi tidak
 * pernah tersisa baris dengan is_available = true dan accepts_assignments
 * = false.
 */

import { prisma } from '@jasana/database';
import { AppError } from '../../lib/errors';
import type { WorkerContext } from '../access/access.service';
import { toWorkerDto, WORKER_SELECT, type WorkerDto } from './workers.mapper';
import type { AvailabilityBody, LocationBody } from './workers.schema';

export interface MyMembershipDto extends WorkerDto {
  provider: { id: string; business_name: string | null; provider_type: string };
}

function notActive(): AppError {
  return new AppError('FORBIDDEN_ACTOR', 'Keanggotaan pekerja Anda tidak lagi aktif');
}

async function loadMembership(workerId: string): Promise<MyMembershipDto> {
  const row = await prisma.providerWorker.findUnique({
    where: { id: workerId },
    select: {
      ...WORKER_SELECT,
      providerProfile: { select: { id: true, businessName: true, providerType: true } },
    },
  });
  if (!row) throw notActive();

  const { providerProfile, ...worker } = row;
  return {
    ...toWorkerDto(worker),
    provider: {
      id: providerProfile.id,
      business_name: providerProfile.businessName,
      provider_type: providerProfile.providerType,
    },
  };
}

/** GET /workers/me. */
export function getMyMembership(worker: WorkerContext): Promise<MyMembershipDto> {
  return loadMembership(worker.id);
}

/** PATCH /workers/me/availability. */
export async function setAvailability(
  worker: WorkerContext,
  body: AvailabilityBody,
): Promise<MyMembershipDto> {
  const now = new Date();
  const location =
    body.latitude !== undefined && body.longitude !== undefined
      ? { currentLatitude: body.latitude, currentLongitude: body.longitude, locationUpdatedAt: now }
      : {};

  if (body.is_available) {
    const result = await prisma.providerWorker.updateMany({
      where: { id: worker.id, membershipStatus: 'ACTIVE', acceptsAssignments: true },
      data: { isAvailable: true, ...location },
    });

    if (result.count === 0) {
      const current = await prisma.providerWorker.findUnique({
        where: { id: worker.id },
        select: { membershipStatus: true },
      });
      if (!current || current.membershipStatus !== 'ACTIVE') throw notActive();
      throw new AppError(
        'WORKER_NOT_ASSIGNABLE',
        'Pemilik usaha menonaktifkan kesediaan Anda untuk ditugaskan, jadi ketersediaan tidak bisa dinyalakan',
      );
    }
  } else {
    const result = await prisma.providerWorker.updateMany({
      where: { id: worker.id, membershipStatus: 'ACTIVE' },
      data: { isAvailable: false, ...location },
    });
    if (result.count === 0) throw notActive();
  }

  return loadMembership(worker.id);
}

/**
 * PATCH /workers/me/location. Frontend mengirim berdasarkan perpindahan,
 * bukan interval tetap (D66). Penanda online tetap dari Socket.IO (D65),
 * bukan dari umur kolom ini.
 */
export async function updateLocation(
  worker: WorkerContext,
  body: LocationBody,
): Promise<MyMembershipDto> {
  const result = await prisma.providerWorker.updateMany({
    where: { id: worker.id, membershipStatus: 'ACTIVE' },
    data: {
      currentLatitude: body.latitude,
      currentLongitude: body.longitude,
      locationUpdatedAt: new Date(),
    },
  });
  if (result.count === 0) throw notActive();
  return loadMembership(worker.id);
}
