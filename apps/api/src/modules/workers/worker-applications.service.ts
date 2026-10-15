/**
 * Lamaran pekerja dan keputusan pemilik (D34, D36, D37, D52).
 *
 *   pelamar  --POST /providers/:id/worker-applications-->  PENDING
 *   pemilik  --approve-->  ACTIVE     lamaran lain orang itu gugur (D37)
 *   pemilik  --reject--->  REJECTED
 *
 * Verifikasi pekerja adalah tanggung jawab pemilik usaha, bukan admin
 * platform (D34). Eksklusivitas satu keanggotaan ACTIVE per orang (D36)
 * dijaga partial unique index H23; pemeriksaan di sini hanya supaya
 * pesannya menjelaskan sebab, dan pelanggaran index tetap diterjemahkan ke
 * pesan yang sama kalau dua persetujuan balapan.
 */

import { prisma } from '@jasana/database';
import { AppError, Errors } from '../../lib/errors';
import { isActiveMembershipViolation } from '../../lib/prisma-errors';
import type { ProviderContext } from '../access/access.service';
import { dispatchEmails, recordEmail, type OutgoingEmail } from '../notifications/email-outbox';
import {
  workerApplicationDecisionEmail,
  workerApplicationReceivedEmail,
} from '../providers/provider-emails';
import { toWorkerDto, WORKER_SELECT, type WorkerDto } from './workers.mapper';
import type { ApproveWorkerBody, WorkerApplicationBody } from './workers.schema';
import {
  assertListingsOwnedBy,
  assertNoActiveMembership,
  lockProviderProfile,
  withdrawPendingApplications,
} from './workforce';

const APPROVE_CONFLICT_MESSAGE =
  'Pelamar ini sudah bergabung ke usaha lain. Satu orang hanya boleh punya satu keanggotaan aktif.';

/** POST /providers/:id/worker-applications. */
export async function applyAsWorker(
  userId: string,
  providerProfileId: string,
  body: WorkerApplicationBody,
): Promise<WorkerDto> {
  const emails: OutgoingEmail[] = [];

  const row = await prisma.$transaction(async (tx) => {
    // Menyerialkan lamaran ke usaha yang sama, supaya dua klik bersamaan
    // tidak menghasilkan dua lamaran PENDING dari orang yang sama.
    if (!(await lockProviderProfile(tx, providerProfileId))) {
      throw Errors.notFound('Provider tidak ditemukan');
    }

    const provider = await tx.providerProfile.findFirst({
      where: { id: providerProfileId, verificationStatus: 'VERIFIED' },
      select: {
        userId: true,
        providerType: true,
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!provider) throw Errors.notFound('Provider tidak ditemukan');

    if (provider.userId === userId) {
      throw new AppError(
        'WORKER_MEMBERSHIP_CONFLICT',
        'Pemilik sudah otomatis terdaftar sebagai pekerja di usahanya sendiri',
      );
    }
    if (provider.providerType !== 'BUSINESS') {
      throw new AppError('PROVIDER_STATE_CONFLICT', 'Usaha perorangan tidak menerima lamaran pekerja');
    }

    await assertNoActiveMembership(tx, userId, 'APPLY_WORKER');

    const pending = await tx.providerWorker.findFirst({
      where: { providerProfileId, userId, membershipStatus: 'PENDING' },
      select: { id: true },
    });
    if (pending) {
      throw new AppError(
        'WORKER_MEMBERSHIP_CONFLICT',
        'Lamaran Anda ke usaha ini masih menunggu keputusan pemilik',
      );
    }

    await assertListingsOwnedBy(tx, providerProfileId, body.listing_ids, true);

    const applicant = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { fullName: true },
    });

    // Baris worker_listings dibuat sejak sekarang sebagai USULAN. Belum
    // berlaku apa pun sampai keanggotaannya ACTIVE (D52).
    const created = await tx.providerWorker.create({
      data: {
        providerProfileId,
        userId,
        displayName: body.display_name ?? applicant.fullName,
        experienceNote: body.experience_note ?? null,
        membershipStatus: 'PENDING',
        isAvailable: false,
        listings: { create: body.listing_ids.map((listingId) => ({ listingId })) },
      },
      select: WORKER_SELECT,
    });

    emails.push(
      await recordEmail(tx, {
        userId: provider.user.id,
        to: provider.user.email,
        type: 'WORKER_APPLICATION',
        referenceType: 'provider_worker',
        referenceId: created.id,
        ...workerApplicationReceivedEmail(provider.user.fullName, applicant.fullName),
      }),
    );

    return created;
  });

  void dispatchEmails(emails);
  return toWorkerDto(row);
}

/** POST /providers/me/workers/:id/approve. */
export async function approveApplication(
  provider: ProviderContext,
  workerId: string,
  body: ApproveWorkerBody,
): Promise<WorkerDto> {
  const emails: OutgoingEmail[] = [];

  try {
    const row = await prisma.$transaction(async (tx) => {
      // Diserialkan dengan penurunan tipe ke INDIVIDUAL, yang mensyaratkan
      // hanya satu pekerja aktif.
      await lockProviderProfile(tx, provider.id);
      const profile = await tx.providerProfile.findUniqueOrThrow({
        where: { id: provider.id },
        select: { providerType: true, businessName: true },
      });
      if (profile.providerType !== 'BUSINESS') {
        throw new AppError('PROVIDER_STATE_CONFLICT', 'Usaha perorangan tidak menerima pekerja');
      }

      const worker = await tx.providerWorker.findFirst({
        where: { id: workerId, providerProfileId: provider.id },
        select: {
          userId: true,
          membershipStatus: true,
          user: { select: { fullName: true, email: true } },
        },
      });
      if (!worker) throw Errors.notFound('Pelamar tidak ditemukan');
      if (worker.membershipStatus !== 'PENDING') {
        throw new AppError('WORKER_MEMBERSHIP_CONFLICT', 'Lamaran ini sudah diproses');
      }

      await assertNoActiveMembership(tx, worker.userId, 'APPROVE_WORKER');

      // D52: pemilik boleh menambah atau mencoret centangan pelamar.
      if (body.listing_ids) {
        await assertListingsOwnedBy(tx, provider.id, body.listing_ids, false);
        await tx.workerListing.deleteMany({ where: { workerId } });
        if (body.listing_ids.length > 0) {
          await tx.workerListing.createMany({
            data: body.listing_ids.map((listingId) => ({ workerId, listingId })),
          });
        }
      }

      // UPDATE bersyarat: persetujuan ganda dari dua tab tidak dieksekusi dua kali.
      const updated = await tx.providerWorker.updateMany({
        where: { id: workerId, membershipStatus: 'PENDING' },
        data: { membershipStatus: 'ACTIVE', approvedBy: provider.userId, approvedAt: new Date() },
      });
      if (updated.count === 0) {
        throw new AppError('WORKER_MEMBERSHIP_CONFLICT', 'Lamaran ini sudah diproses');
      }

      await withdrawPendingApplications(tx, worker.userId, workerId);

      emails.push(
        await recordEmail(tx, {
          userId: worker.userId,
          to: worker.user.email,
          type: 'WORKER_APPLICATION',
          referenceType: 'provider_worker',
          referenceId: workerId,
          ...workerApplicationDecisionEmail(
            worker.user.fullName,
            profile.businessName ?? 'usaha tersebut',
            true,
            null,
          ),
        }),
      );

      return tx.providerWorker.findUniqueOrThrow({ where: { id: workerId }, select: WORKER_SELECT });
    });

    void dispatchEmails(emails);
    return toWorkerDto(row);
  } catch (error) {
    // Dua usaha menyetujui orang yang sama bersamaan: yang kedua menabrak H23.
    if (isActiveMembershipViolation(error)) {
      throw new AppError('WORKER_MEMBERSHIP_CONFLICT', APPROVE_CONFLICT_MESSAGE);
    }
    throw error;
  }
}

/** POST /providers/me/workers/:id/reject. */
export async function rejectApplication(
  provider: ProviderContext,
  workerId: string,
  reason: string | undefined,
): Promise<WorkerDto> {
  const emails: OutgoingEmail[] = [];

  const row = await prisma.$transaction(async (tx) => {
    const worker = await tx.providerWorker.findFirst({
      where: { id: workerId, providerProfileId: provider.id },
      select: {
        userId: true,
        membershipStatus: true,
        user: { select: { fullName: true, email: true } },
        providerProfile: { select: { businessName: true } },
      },
    });
    if (!worker) throw Errors.notFound('Pelamar tidak ditemukan');

    const updated = await tx.providerWorker.updateMany({
      where: { id: workerId, membershipStatus: 'PENDING' },
      data: { membershipStatus: 'REJECTED' },
    });
    if (updated.count === 0) {
      throw new AppError('WORKER_MEMBERSHIP_CONFLICT', 'Lamaran ini sudah diproses');
    }

    emails.push(
      await recordEmail(tx, {
        userId: worker.userId,
        to: worker.user.email,
        type: 'WORKER_APPLICATION',
        referenceType: 'provider_worker',
        referenceId: workerId,
        ...workerApplicationDecisionEmail(
          worker.user.fullName,
          worker.providerProfile.businessName ?? 'usaha tersebut',
          false,
          reason ?? null,
        ),
      }),
    );

    return tx.providerWorker.findUniqueOrThrow({ where: { id: workerId }, select: WORKER_SELECT });
  });

  void dispatchEmails(emails);
  return toWorkerDto(row);
}
