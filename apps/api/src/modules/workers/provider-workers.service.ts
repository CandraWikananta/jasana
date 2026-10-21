/**
 * Pengelolaan pekerja oleh pemilik usaha (PRD 4.3 bagian Pekerja).
 *
 * Dua aturan yang tidak dijaga basis data dan karena itu dijaga di sini:
 *
 *   H27 / D39  Minimal satu pekerja ACTIVE dengan accepts_assignments = true.
 *              Dipakai saat mematikan kesediaan dan saat mengeluarkan
 *              pekerja, selalu di bawah kunci baris provider.
 *
 *   D39        is_available hanya boleh true kalau accepts_assignments true.
 *              Mematikan accepts_assignments ikut mematikan is_available
 *              dalam UPDATE yang sama.
 */

import { prisma, type WorkerMembershipStatus } from '@jasana/database';
import { AppError, Errors } from '../../lib/errors';
import type { ProviderContext } from '../access/access.service';
import { toWorkerDto, WORKER_SELECT, type WorkerDto } from './workers.mapper';
import {
  assertAnotherAssignableWorker,
  assertListingsOwnedBy,
  assertNoStrandedListings,
  lockProviderProfile,
  OPEN_ORDER_STATUSES,
} from './workforce';

/** GET /providers/me/workers. Pemilik di atas, lalu urut waktu bergabung. */
export async function listWorkers(
  provider: ProviderContext,
  membershipStatus: WorkerMembershipStatus | undefined,
): Promise<WorkerDto[]> {
  const rows = await prisma.providerWorker.findMany({
    where: { providerProfileId: provider.id, ...(membershipStatus ? { membershipStatus } : {}) },
    select: WORKER_SELECT,
    orderBy: [{ isOwner: 'desc' }, { createdAt: 'asc' }],
  });
  return rows.map(toWorkerDto);
}

/**
 * DELETE /providers/me/workers/:id. Keanggotaan jadi RESIGNED, barisnya
 * TIDAK dihapus: order lama merujuk ke sana (`restrict`, PRD 3.3), dan
 * orangnya tetap bisa bergabung ke usaha lain karena eksklusivitas hanya
 * berlaku untuk keanggotaan ACTIVE.
 */
export async function removeWorker(provider: ProviderContext, workerId: string): Promise<WorkerDto> {
  const row = await prisma.$transaction(async (tx) => {
    await lockProviderProfile(tx, provider.id);

    const worker = await tx.providerWorker.findFirst({
      where: { id: workerId, providerProfileId: provider.id },
      select: { isOwner: true, membershipStatus: true, acceptsAssignments: true },
    });
    if (!worker) throw Errors.notFound('Pekerja tidak ditemukan');
    if (worker.isOwner) {
      throw new AppError(
        'WORKER_MEMBERSHIP_CONFLICT',
        'Pemilik tidak bisa dikeluarkan dari usahanya sendiri. Matikan kesediaan ditugaskan kalau hanya ingin mengelola.',
      );
    }
    if (worker.membershipStatus !== 'ACTIVE') {
      throw new AppError('WORKER_MEMBERSHIP_CONFLICT', 'Hanya pekerja aktif yang bisa dikeluarkan');
    }

    if (worker.acceptsAssignments) {
      await assertAnotherAssignableWorker(tx, provider.id, workerId);
    }

    const openOrders = await tx.order.count({
      where: {
        status: { in: OPEN_ORDER_STATUSES },
        OR: [{ assignedWorkerId: workerId }, { crew: { some: { workerId } } }],
      },
    });
    if (openOrders > 0) {
      throw new AppError(
        'WORKER_HAS_INFLIGHT_ORDER',
        'Pekerja masih memegang order yang belum selesai. Ganti penanggung jawabnya lebih dulu.',
      );
    }

    await assertNoStrandedListings(tx, provider.id, workerId);

    await tx.providerWorker.update({
      where: { id: workerId },
      data: { membershipStatus: 'RESIGNED', isAvailable: false },
    });

    return tx.providerWorker.findUniqueOrThrow({ where: { id: workerId }, select: WORKER_SELECT });
  });

  return toWorkerDto(row);
}

/**
 * PATCH /providers/me/workers/:id/assignments-setting. Berlaku juga untuk
 * baris pemilik sendiri: pemilik usaha BUSINESS yang hanya mengelola
 * mematikan kesediaannya di sini. Untuk INDIVIDUAL penolakannya datang
 * sendiri dari H27, karena pemiliknya satu-satunya pekerja.
 */
export async function setAcceptsAssignments(
  provider: ProviderContext,
  workerId: string,
  acceptsAssignments: boolean,
): Promise<WorkerDto> {
  const row = await prisma.$transaction(async (tx) => {
    await lockProviderProfile(tx, provider.id);

    const worker = await tx.providerWorker.findFirst({
      where: { id: workerId, providerProfileId: provider.id },
      select: { membershipStatus: true, acceptsAssignments: true },
    });
    if (!worker) throw Errors.notFound('Pekerja tidak ditemukan');
    if (worker.membershipStatus !== 'ACTIVE') {
      throw new AppError('WORKER_MEMBERSHIP_CONFLICT', 'Hanya pekerja aktif yang bisa diatur');
    }

    if (!acceptsAssignments && worker.acceptsAssignments) {
      await assertAnotherAssignableWorker(tx, provider.id, workerId);
    }

    await tx.providerWorker.update({
      where: { id: workerId },
      data: acceptsAssignments
        ? { acceptsAssignments: true }
        : // is_available tanpa accepts_assignments tidak bermakna (D39).
          { acceptsAssignments: false, isAvailable: false },
    });

    return tx.providerWorker.findUniqueOrThrow({ where: { id: workerId }, select: WORKER_SELECT });
  });

  return toWorkerDto(row);
}

/**
 * PUT /providers/me/workers/:id/listings. Mengganti seluruh pemetaan satu
 * pekerja aktif (D50, D52). Listing boleh DRAFT, karena pemetaan justru
 * syarat DRAFT bisa diaktifkan (D53). Listing tayang yang pekerja terakhirnya
 * dicabut ditolak (V7), di bawah kunci provider yang sama dengan
 * `removeWorker` dan aktivasi listing.
 */
export async function setWorkerListings(
  provider: ProviderContext,
  workerId: string,
  listingIds: string[],
): Promise<WorkerDto> {
  const row = await prisma.$transaction(async (tx) => {
    await lockProviderProfile(tx, provider.id);

    const worker = await tx.providerWorker.findFirst({
      where: { id: workerId, providerProfileId: provider.id },
      select: { membershipStatus: true },
    });
    if (!worker) throw Errors.notFound('Pekerja tidak ditemukan');
    if (worker.membershipStatus !== 'ACTIVE') {
      throw new AppError('WORKER_MEMBERSHIP_CONFLICT', 'Hanya pekerja aktif yang bisa diatur');
    }

    await assertListingsOwnedBy(tx, provider.id, listingIds, false);
    await assertNoStrandedListings(tx, provider.id, workerId, listingIds);

    await tx.workerListing.deleteMany({ where: { workerId, listingId: { notIn: listingIds } } });
    await tx.workerListing.createMany({
      data: listingIds.map((listingId) => ({ workerId, listingId })),
      skipDuplicates: true,
    });

    return tx.providerWorker.findUniqueOrThrow({ where: { id: workerId }, select: WORKER_SELECT });
  });

  return toWorkerDto(row);
}
