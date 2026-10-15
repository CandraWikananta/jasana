/**
 * Pemeriksaan pengajuan provider oleh admin (PRD 4.3, D33, D34, D47).
 *
 * PERSETUJUAN E-KYC ADALAH SATU TRANSAKSI yang melakukan seluruhnya:
 *
 *   1. provider_profiles  PENDING -> VERIFIED
 *   2. kyc_documents      PENDING -> APPROVED
 *   3. wallets            dibuat, saldo nol (D12, D48)
 *   4. provider_workers   baris pemilik: is_owner = true, ACTIVE,
 *                         accepts_assignments = true (D33)
 *   5. notifications      baris email untuk pemohon (dikirim setelah commit)
 *
 * Kalau salah satunya gagal, tidak ada yang tersimpan. Provider VERIFIED
 * tanpa baris pekerja langsung melanggar H27 (V6 tidak lagi nol baris), dan
 * provider tanpa wallet tidak bisa menerima escrow di Fase 7.
 *
 * Langkah 4 bisa ditolak partial unique index H23 kalau pemohon masih
 * pekerja aktif di usaha lain (D36). Itu diperiksa lebih dulu supaya
 * pesannya jelas, dan pelanggaran index tetap diterjemahkan ke pesan yang
 * sama kalau terjadi balapan.
 */

import { prisma, type Prisma } from '@jasana/database';
import { KYC_BUCKET, KYC_SIGNED_URL_TTL_SECONDS } from '../../config/constants';
import { AppError, Errors } from '../../lib/errors';
import { logger } from '../../lib/logger';
import { pageMeta, skipTake, type Page, type Paginated } from '../../lib/pagination';
import { isActiveMembershipViolation } from '../../lib/prisma-errors';
import { storage } from '../../lib/supabase';
import { dispatchEmails, recordEmail, type OutgoingEmail } from '../notifications/email-outbox';
import { BUSINESS_DOCUMENT_TYPES, missingDocuments } from '../providers/kyc-rules';
import {
  kycRejectedEmail,
  kycApprovedEmail,
  typeUpgradeDecisionEmail,
} from '../providers/provider-emails';
import {
  PROVIDER_SELECT,
  parseKycObjectKey,
  toKycDocumentDto,
  toProviderDto,
  type KycDocumentDto,
  type ProviderDto,
} from '../providers/providers.mapper';
import { toWorkerDto, WORKER_SELECT, type WorkerDto } from '../workers/workers.mapper';
import {
  assertNoActiveMembership,
  lockProviderProfile,
  withdrawPendingApplications,
} from '../workers/workforce';
import type { ListApplicationsQuery, TypeUpgradeDecisionBody } from './admin.schema';

const APPLICANT_SELECT = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
} as const satisfies Prisma.UserSelect;

interface ApplicantDto {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

function toApplicantDto(user: Prisma.UserGetPayload<{ select: typeof APPLICANT_SELECT }>): ApplicantDto {
  return { id: user.id, full_name: user.fullName, email: user.email, phone: user.phone };
}

// ---------------------------------------------------------------------------
// Antrean dan detail
// ---------------------------------------------------------------------------

export interface ApplicationSummaryDto extends ProviderDto {
  applicant: ApplicantDto;
  document_count: number;
}

/** GET /admin/provider-applications. Default hanya yang menunggu (PENDING). */
export async function listApplications(
  query: ListApplicationsQuery,
): Promise<Paginated<ApplicationSummaryDto>> {
  const where = { verificationStatus: query.status } satisfies Prisma.ProviderProfileWhereInput;
  const [rows, total] = await prisma.$transaction([
    prisma.providerProfile.findMany({
      where,
      select: {
        ...PROVIDER_SELECT,
        user: { select: APPLICANT_SELECT },
        _count: { select: { kycDocuments: { where: { status: 'PENDING' } } } },
      },
      // Antrean diperiksa dari yang paling lama menunggu.
      orderBy: { updatedAt: 'asc' },
      ...skipTake(query),
    }),
    prisma.providerProfile.count({ where }),
  ]);

  return {
    items: rows.map(({ user, _count, ...profile }) => ({
      ...toProviderDto(profile),
      applicant: toApplicantDto(user),
      document_count: _count.kycDocuments,
    })),
    meta: pageMeta(query, total),
  };
}

export interface AdminKycDocumentDto extends KycDocumentDto {
  /** Berumur pendek, bucket-nya private (D80). `null` kalau Storage gagal. */
  signed_url: string | null;
  signed_url_expires_in: number;
}

export interface ApplicationDetailDto extends ProviderDto {
  applicant: ApplicantDto;
  documents: AdminKycDocumentDto[];
  missing_documents: string[];
}

async function signDocument(fileUrl: string): Promise<string | null> {
  const key = parseKycObjectKey(fileUrl);
  if (!key) return null;
  try {
    return await storage.createSignedUrl(key.bucket, key.path, KYC_SIGNED_URL_TTL_SECONDS);
  } catch (error) {
    logger.warn({ err: error, bucket: key.bucket }, 'Gagal membuat signed URL dokumen e-KYC');
    return null;
  }
}

/**
 * GET /admin/provider-applications/:id. Satu-satunya jalan admin membuka
 * berkas e-KYC: signed URL dibuat di sini, di luar transaksi mana pun.
 */
export async function getApplication(id: string): Promise<ApplicationDetailDto> {
  const row = await prisma.providerProfile.findUnique({
    where: { id },
    select: {
      ...PROVIDER_SELECT,
      user: { select: APPLICANT_SELECT },
      kycDocuments: {
        select: {
          id: true,
          documentType: true,
          status: true,
          note: true,
          uploadedAt: true,
          reviewedAt: true,
          fileUrl: true,
        },
        orderBy: { uploadedAt: 'desc' },
      },
    },
  });
  if (!row) throw Errors.notFound('Pengajuan provider tidak ditemukan');

  const { user, kycDocuments, ...profile } = row;
  const documents = await Promise.all(
    kycDocuments.map(async ({ fileUrl, ...doc }) => ({
      ...toKycDocumentDto(doc),
      signed_url: await signDocument(fileUrl),
      signed_url_expires_in: KYC_SIGNED_URL_TTL_SECONDS,
    })),
  );
  const pending = kycDocuments.filter((doc) => doc.status === 'PENDING').map((doc) => doc.documentType);

  return {
    ...toProviderDto(profile),
    applicant: toApplicantDto(user),
    documents,
    missing_documents:
      profile.verificationStatus === 'PENDING' || profile.verificationStatus === 'DRAFT'
        ? missingDocuments(profile.providerType, pending)
        : [],
  };
}

// ---------------------------------------------------------------------------
// Keputusan e-KYC
// ---------------------------------------------------------------------------

export interface ApprovalResultDto {
  provider: ProviderDto;
  wallet: { id: string; balance_available: number; balance_pending: number; currency: string };
  owner_worker: WorkerDto;
}

const APPROVE_MEMBERSHIP_MESSAGE =
  'Pemohon masih pekerja aktif di usaha lain. Satu orang hanya boleh punya satu keanggotaan aktif, ' +
  'dan pemilik usaha otomatis menjadi pekerja di usahanya sendiri.';

/** POST /admin/provider-applications/:id/approve. */
export async function approveApplication(adminId: string, id: string): Promise<ApprovalResultDto> {
  const emails: OutgoingEmail[] = [];

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (!(await lockProviderProfile(tx, id))) {
        throw Errors.notFound('Pengajuan provider tidak ditemukan');
      }
      const profile = await tx.providerProfile.findUniqueOrThrow({
        where: { id },
        select: {
          userId: true,
          providerType: true,
          verificationStatus: true,
          user: { select: { fullName: true, email: true } },
          kycDocuments: { where: { status: 'PENDING' }, select: { documentType: true } },
        },
      });

      if (profile.verificationStatus !== 'PENDING') {
        throw new AppError(
          'PROVIDER_STATE_CONFLICT',
          `Hanya pengajuan PENDING yang bisa disetujui, status saat ini ${profile.verificationStatus}`,
        );
      }
      // Pengaman kedua. PENDING seharusnya sudah berarti lengkap.
      const missing = missingDocuments(
        profile.providerType,
        profile.kycDocuments.map((doc) => doc.documentType),
      );
      if (missing.length > 0) {
        throw new AppError('PROVIDER_STATE_CONFLICT', `Dokumen wajib belum lengkap: ${missing.join(', ')}`);
      }

      // D36 sebelum menulis apa pun, supaya pesannya menjelaskan sebab.
      await assertNoActiveMembership(tx, profile.userId, 'APPROVE_PROVIDER');

      const now = new Date();

      // 1. Profil
      const provider = await tx.providerProfile.update({
        where: { id },
        data: {
          verificationStatus: 'VERIFIED',
          verifiedAt: now,
          verifiedBy: adminId,
          rejectionReason: null,
        },
        select: PROVIDER_SELECT,
      });

      // 2. Dokumen putaran ini
      await tx.kycDocument.updateMany({
        where: { providerProfileId: id, status: 'PENDING' },
        data: { status: 'APPROVED', reviewedAt: now },
      });

      // 3. Wallet (D12, D48). Saldo nol tanpa baris ledger, jadi V1 tetap nol baris.
      const wallet = await tx.wallet.create({
        data: { providerProfileId: id },
        select: { id: true, balanceAvailable: true, balancePending: true, currency: true },
      });

      // 4. Baris pekerja pemilik (D33). approvedBy NULL untuk pemilik sendiri.
      const ownerWorker = await tx.providerWorker.create({
        data: {
          providerProfileId: id,
          userId: profile.userId,
          displayName: profile.user.fullName,
          isOwner: true,
          membershipStatus: 'ACTIVE',
          acceptsAssignments: true,
          isAvailable: false,
          approvedAt: now,
        },
        select: WORKER_SELECT,
      });

      // Lamaran pemohon ke usaha lain gugur (D37).
      await withdrawPendingApplications(tx, profile.userId, ownerWorker.id);

      // 5. Notifikasi, dikirim setelah commit (D58).
      emails.push(
        await recordEmail(tx, {
          userId: profile.userId,
          to: profile.user.email,
          type: 'KYC',
          referenceType: 'provider_profile',
          referenceId: id,
          ...kycApprovedEmail(profile.user.fullName),
        }),
      );

      return { provider, wallet, ownerWorker };
    });

    void dispatchEmails(emails);
    return {
      provider: toProviderDto(result.provider),
      wallet: {
        id: result.wallet.id,
        balance_available: result.wallet.balanceAvailable.toNumber(),
        balance_pending: result.wallet.balancePending.toNumber(),
        currency: result.wallet.currency,
      },
      owner_worker: toWorkerDto(result.ownerWorker),
    };
  } catch (error) {
    if (isActiveMembershipViolation(error)) {
      throw new AppError('WORKER_MEMBERSHIP_CONFLICT', APPROVE_MEMBERSHIP_MESSAGE);
    }
    throw error;
  }
}

/** POST /admin/provider-applications/:id/reject. */
export async function rejectApplication(id: string, reason: string): Promise<ProviderDto> {
  const emails: OutgoingEmail[] = [];

  const provider = await prisma.$transaction(async (tx) => {
    if (!(await lockProviderProfile(tx, id))) {
      throw Errors.notFound('Pengajuan provider tidak ditemukan');
    }
    const profile = await tx.providerProfile.findUniqueOrThrow({
      where: { id },
      select: { userId: true, verificationStatus: true, user: { select: { fullName: true, email: true } } },
    });
    if (profile.verificationStatus !== 'PENDING') {
      throw new AppError(
        'PROVIDER_STATE_CONFLICT',
        `Hanya pengajuan PENDING yang bisa ditolak, status saat ini ${profile.verificationStatus}`,
      );
    }

    const now = new Date();
    await tx.kycDocument.updateMany({
      where: { providerProfileId: id, status: 'PENDING' },
      data: { status: 'REJECTED', reviewedAt: now, note: reason },
    });
    const updated = await tx.providerProfile.update({
      where: { id },
      data: { verificationStatus: 'REJECTED', rejectionReason: reason },
      select: PROVIDER_SELECT,
    });

    emails.push(
      await recordEmail(tx, {
        userId: profile.userId,
        to: profile.user.email,
        type: 'KYC',
        referenceType: 'provider_profile',
        referenceId: id,
        ...kycRejectedEmail(profile.user.fullName, reason),
      }),
    );
    return updated;
  });

  void dispatchEmails(emails);
  return toProviderDto(provider);
}

// ---------------------------------------------------------------------------
// Perubahan tipe (D47)
// ---------------------------------------------------------------------------

export interface TypeUpgradeRequestDto extends ProviderDto {
  applicant: ApplicantDto;
  business_documents: KycDocumentDto[];
}

/**
 * GET /admin/type-upgrade-requests. Hanya pengajuan naik ke BUSINESS yang
 * masuk antrean. Turun ke INDIVIDUAL berlaku langsung tanpa admin.
 */
export async function listTypeUpgradeRequests(page: Page): Promise<Paginated<TypeUpgradeRequestDto>> {
  const where = {
    verificationStatus: 'VERIFIED',
    requestedProviderType: 'BUSINESS',
  } satisfies Prisma.ProviderProfileWhereInput;

  const [rows, total] = await prisma.$transaction([
    prisma.providerProfile.findMany({
      where,
      select: {
        ...PROVIDER_SELECT,
        user: { select: APPLICANT_SELECT },
        kycDocuments: {
          where: { status: 'PENDING', documentType: { in: [...BUSINESS_DOCUMENT_TYPES] } },
          select: {
            id: true,
            documentType: true,
            status: true,
            note: true,
            uploadedAt: true,
            reviewedAt: true,
          },
          orderBy: { uploadedAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'asc' },
      ...skipTake(page),
    }),
    prisma.providerProfile.count({ where }),
  ]);

  return {
    items: rows.map(({ user, kycDocuments, ...profile }) => ({
      ...toProviderDto(profile),
      applicant: toApplicantDto(user),
      business_documents: kycDocuments.map(toKycDocumentDto),
    })),
    meta: pageMeta(page, total),
  };
}

/**
 * PATCH /admin/type-upgrade-requests/:id. `verification_status` tetap
 * VERIFIED di kedua hasil, supaya listing dan order yang berjalan tidak
 * ikut terganggu (D47).
 */
export async function decideTypeUpgrade(
  id: string,
  body: TypeUpgradeDecisionBody,
): Promise<ProviderDto> {
  const emails: OutgoingEmail[] = [];
  const approved = body.decision === 'APPROVED';

  const provider = await prisma.$transaction(async (tx) => {
    if (!(await lockProviderProfile(tx, id))) {
      throw Errors.notFound('Pengajuan perubahan tipe tidak ditemukan');
    }
    const profile = await tx.providerProfile.findUniqueOrThrow({
      where: { id },
      select: {
        userId: true,
        verificationStatus: true,
        requestedProviderType: true,
        user: { select: { fullName: true, email: true } },
      },
    });
    if (profile.verificationStatus !== 'VERIFIED' || profile.requestedProviderType !== 'BUSINESS') {
      throw new AppError('PROVIDER_STATE_CONFLICT', 'Tidak ada pengajuan perubahan tipe yang menunggu');
    }

    const businessDocuments = { in: [...BUSINESS_DOCUMENT_TYPES] };
    const now = new Date();

    if (approved) {
      const uploaded = await tx.kycDocument.count({
        where: { providerProfileId: id, status: 'PENDING', documentType: businessDocuments },
      });
      if (uploaded === 0) {
        throw new AppError(
          'PROVIDER_STATE_CONFLICT',
          'Pemilik belum mengunggah NPWP atau izin usaha untuk pengajuan ini',
        );
      }
    }

    await tx.kycDocument.updateMany({
      where: { providerProfileId: id, status: 'PENDING', documentType: businessDocuments },
      data: approved
        ? { status: 'APPROVED', reviewedAt: now }
        : { status: 'REJECTED', reviewedAt: now, note: body.reason ?? null },
    });

    const updated = await tx.providerProfile.update({
      where: { id },
      data: {
        requestedProviderType: null,
        ...(approved ? { providerType: 'BUSINESS' as const } : {}),
      },
      select: PROVIDER_SELECT,
    });

    emails.push(
      await recordEmail(tx, {
        userId: profile.userId,
        to: profile.user.email,
        type: 'KYC',
        referenceType: 'provider_profile',
        referenceId: id,
        ...typeUpgradeDecisionEmail(profile.user.fullName, approved, body.reason ?? null),
      }),
    );
    return updated;
  });

  void dispatchEmails(emails);
  return toProviderDto(provider);
}
