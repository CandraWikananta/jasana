/**
 * Pengajuan dan profil provider (PRD 4.3 bagian Provider dan e-KYC).
 *
 * Alur status `verification_status`:
 *
 *   (belum ada) --apply--> DRAFT --dokumen wajib lengkap--> PENDING
 *   PENDING --admin setuju--> VERIFIED       (admin-providers.service.ts)
 *   PENDING --admin tolak---> REJECTED --apply ulang--> DRAFT
 *
 * DRAFT ke PENDING terjadi otomatis di kyc.service.ts, begitu dokumen yang
 * diminta tipe usahanya lengkap. Tidak ada tombol "kirim" terpisah, supaya
 * tidak ada pengajuan yang lengkap tapi lupa dikirim.
 *
 * Perubahan tipe setelah VERIFIED TIDAK mengembalikan status ke PENDING
 * (D47). Pengajuannya ditampung di `requested_provider_type`.
 */

import { prisma, type Prisma, type ProviderType } from '@jasana/database';
import { AppError, Errors } from '../../lib/errors';
import { isUniqueViolation } from '../../lib/prisma-errors';
import { dispatchEmails, recordEmail, type OutgoingEmail } from '../notifications/email-outbox';
import type { ProviderContext } from '../access/access.service';
import {
  assertNoActiveMembership,
  lockProviderProfile,
} from '../workers/workforce';
import { BUSINESS_DOCUMENT_TYPES, missingDocuments, type RequiredDocument } from './kyc-rules';
import {
  KYC_DOCUMENT_SELECT,
  PROVIDER_SELECT,
  toKycDocumentDto,
  toProviderDto,
  type KycDocumentDto,
  type ProviderDto,
} from './providers.mapper';
import { workerApplicationDecisionEmail } from './provider-emails';
import type { ApplyProviderBody, TypeUpgradeBody, UpdateProviderBody } from './providers.schema';

export interface ProviderDetailDto extends ProviderDto {
  documents: KycDocumentDto[];
  /**
   * Dokumen wajib yang belum ada pada putaran pengajuan ini. Kosong kalau
   * tidak ada yang sedang diajukan.
   */
  missing_documents: RequiredDocument[];
}

const DETAIL_SELECT = {
  ...PROVIDER_SELECT,
  kycDocuments: { select: KYC_DOCUMENT_SELECT, orderBy: { uploadedAt: 'desc' } },
} as const satisfies Prisma.ProviderProfileSelect;

type DetailRow = Prisma.ProviderProfileGetPayload<{ select: typeof DETAIL_SELECT }>;

function toDetailDto(row: DetailRow): ProviderDetailDto {
  const { kycDocuments, ...profile } = row;
  const pending = kycDocuments.filter((doc) => doc.status === 'PENDING').map((doc) => doc.documentType);

  let missing: RequiredDocument[] = [];
  if (profile.verificationStatus === 'DRAFT' || profile.verificationStatus === 'PENDING') {
    missing = missingDocuments(profile.providerType, pending);
  } else if (
    profile.verificationStatus === 'VERIFIED' &&
    profile.requestedProviderType === 'BUSINESS' &&
    !pending.some((type) => BUSINESS_DOCUMENT_TYPES.has(type))
  ) {
    missing = ['NPWP_OR_BUSINESS_LICENSE'];
  }

  return {
    ...toProviderDto(profile),
    documents: kycDocuments.map(toKycDocumentDto),
    missing_documents: missing,
  };
}

/** Field profil yang dikirim, `undefined` berarti tidak diubah. */
function profileData(body: UpdateProviderBody) {
  return {
    ...(body.business_name !== undefined ? { businessName: body.business_name } : {}),
    ...(body.bio !== undefined ? { bio: body.bio } : {}),
    ...(body.base_address !== undefined ? { baseAddress: body.base_address } : {}),
    ...(body.base_latitude !== undefined ? { baseLatitude: body.base_latitude } : {}),
    ...(body.base_longitude !== undefined ? { baseLongitude: body.base_longitude } : {}),
    ...(body.service_radius_km !== undefined ? { serviceRadiusKm: body.service_radius_km } : {}),
  };
}

const APPLY_BLOCKED_MESSAGE: Record<string, string> = {
  PENDING: 'Pengajuan Anda sedang diperiksa admin',
  VERIFIED: 'Anda sudah provider terverifikasi. Perubahan tipe usaha lewat pengajuan perubahan tipe',
  SUSPENDED: 'Akun provider Anda sedang ditangguhkan',
};

// ---------------------------------------------------------------------------
// Pengajuan
// ---------------------------------------------------------------------------

/**
 * POST /providers/apply. Membuat profil DRAFT, atau memperbarui profil yang
 * masih DRAFT, atau membuka putaran baru untuk profil yang REJECTED.
 *
 * `provider_type` dipilih di sini (D46) dan menentukan dokumen yang diminta.
 */
export async function applyAsProvider(
  userId: string,
  body: ApplyProviderBody,
): Promise<ProviderDetailDto> {
  try {
    return await prisma.$transaction(async (tx) => {
      // D33 + D36: pemilik otomatis jadi pekerja saat disetujui, jadi orang
      // yang masih aktif di usaha lain tidak bisa membuka usaha sendiri.
      await assertNoActiveMembership(tx, userId, 'APPLY_PROVIDER');

      const existing = await tx.providerProfile.findUnique({
        where: { userId },
        select: { id: true, verificationStatus: true },
      });
      const data = { providerType: body.provider_type, ...profileData(body) };

      if (!existing) {
        const created = await tx.providerProfile.create({
          data: { userId, verificationStatus: 'DRAFT', ...data },
          select: DETAIL_SELECT,
        });
        return toDetailDto(created);
      }

      const status = existing.verificationStatus;
      if (status !== 'DRAFT' && status !== 'REJECTED') {
        throw new AppError('PROVIDER_STATE_CONFLICT', APPLY_BLOCKED_MESSAGE[status] ?? 'Pengajuan tidak dapat diubah');
      }

      const updated = await tx.providerProfile.update({
        where: { id: existing.id },
        data: {
          ...data,
          // Putaran baru: status kembali DRAFT, alasan penolakan lama dihapus.
          // Dokumen lama tetap tersimpan sebagai REJECTED, tidak ikut dihitung.
          ...(status === 'REJECTED' ? { verificationStatus: 'DRAFT', rejectionReason: null } : {}),
        },
        select: DETAIL_SELECT,
      });
      return toDetailDto(updated);
    });
  } catch (error) {
    // Dua pengajuan bersamaan: yang kedua menabrak unique provider_profiles.user_id.
    if (isUniqueViolation(error, 'user_id')) {
      throw new AppError('PROVIDER_STATE_CONFLICT', 'Pengajuan provider sudah ada');
    }
    throw error;
  }
}

/** GET /providers/me. Status pengajuan terlihat apa pun nilainya. */
export async function getMyProvider(userId: string): Promise<ProviderDetailDto> {
  const row = await prisma.providerProfile.findUnique({ where: { userId }, select: DETAIL_SELECT });
  if (!row) throw Errors.notFound('Anda belum mengajukan diri sebagai provider');
  return toDetailDto(row);
}

/** PATCH /providers/me. Tanpa `provider_type`, lihat providers.schema.ts. */
export async function updateMyProvider(
  provider: ProviderContext,
  body: UpdateProviderBody,
): Promise<ProviderDto> {
  if (provider.providerType === 'BUSINESS' && body.business_name === null) {
    throw Errors.validation([
      { path: 'business_name', message: 'business_name wajib diisi untuk provider BUSINESS' },
    ]);
  }
  const row = await prisma.providerProfile.update({
    where: { id: provider.id },
    data: profileData(body),
    select: PROVIDER_SELECT,
  });
  return toProviderDto(row);
}

// ---------------------------------------------------------------------------
// Perubahan tipe (D47)
// ---------------------------------------------------------------------------

/**
 * POST /providers/me/type-upgrade.
 *
 *   Naik ke BUSINESS   dicatat di `requested_provider_type`, lalu pemilik
 *                      mengunggah NPWP atau izin usaha dan admin memutus.
 *                      `verification_status` TIDAK disentuh.
 *   Turun ke INDIVIDUAL  langsung, asal hanya tersisa satu pekerja aktif.
 *                        Lamaran yang masih PENDING ikut gugur, karena
 *                        usaha perorangan tidak menerima pekerja.
 */
export async function requestTypeChange(
  provider: ProviderContext,
  body: TypeUpgradeBody,
): Promise<ProviderDto> {
  const emails: OutgoingEmail[] = [];

  const result = await prisma.$transaction(async (tx) => {
    await lockProviderProfile(tx, provider.id);
    const profile = await tx.providerProfile.findUniqueOrThrow({
      where: { id: provider.id },
      select: { providerType: true, requestedProviderType: true, businessName: true },
    });

    if (profile.requestedProviderType) {
      throw new AppError(
        'PROVIDER_STATE_CONFLICT',
        'Masih ada pengajuan perubahan tipe yang menunggu pemeriksaan admin',
      );
    }
    if (body.provider_type === profile.providerType) {
      throw Errors.validation([
        { path: 'provider_type', message: `Tipe usaha sudah ${profile.providerType}` },
      ]);
    }

    if (body.provider_type === 'BUSINESS') {
      const businessName = body.business_name ?? profile.businessName;
      if (!businessName) {
        throw Errors.validation([
          { path: 'business_name', message: 'business_name wajib diisi untuk provider BUSINESS' },
        ]);
      }
      return tx.providerProfile.update({
        where: { id: provider.id },
        data: { requestedProviderType: 'BUSINESS', businessName },
        select: PROVIDER_SELECT,
      });
    }

    await assertSingleActiveWorker(tx, provider.id);
    emails.push(...(await rejectPendingApplications(tx, provider.id, profile.businessName)));

    return tx.providerProfile.update({
      where: { id: provider.id },
      data: { providerType: 'INDIVIDUAL' satisfies ProviderType },
      select: PROVIDER_SELECT,
    });
  });

  void dispatchEmails(emails);
  return toProviderDto(result);
}

async function assertSingleActiveWorker(tx: Prisma.TransactionClient, providerProfileId: string) {
  const active = await tx.providerWorker.count({
    where: { providerProfileId, membershipStatus: 'ACTIVE' },
  });
  if (active > 1) {
    throw new AppError(
      'PROVIDER_STATE_CONFLICT',
      'Turun ke INDIVIDUAL hanya boleh kalau tersisa satu pekerja aktif. Keluarkan pekerja lain lebih dulu.',
    );
  }
}

async function rejectPendingApplications(
  tx: Prisma.TransactionClient,
  providerProfileId: string,
  businessName: string | null,
): Promise<OutgoingEmail[]> {
  const pending = await tx.providerWorker.findMany({
    where: { providerProfileId, membershipStatus: 'PENDING' },
    select: { id: true, user: { select: { id: true, fullName: true, email: true } } },
  });
  if (pending.length === 0) return [];

  await tx.providerWorker.updateMany({
    where: { id: { in: pending.map((row) => row.id) }, membershipStatus: 'PENDING' },
    data: { membershipStatus: 'REJECTED' },
  });

  const reason = 'Usaha berubah menjadi perorangan dan tidak lagi menerima pekerja';
  return Promise.all(
    pending.map((row) =>
      recordEmail(tx, {
        userId: row.user.id,
        to: row.user.email,
        type: 'WORKER_APPLICATION',
        referenceType: 'provider_worker',
        referenceId: row.id,
        ...workerApplicationDecisionEmail(row.user.fullName, businessName ?? 'usaha tersebut', false, reason),
      }),
    ),
  );
}

// ---------------------------------------------------------------------------
// Profil publik
// ---------------------------------------------------------------------------

export interface PublicProviderDto {
  id: string;
  display_name: string;
  business_name: string | null;
  bio: string | null;
  provider_type: string;
  service_radius_km: number | null;
  rating_average: number;
  rating_count: number;
  completed_orders_count: number;
  verified_at: string | null;
  /** D47: hanya usaha BUSINESS yang menampilkan tombol lamar. */
  accepts_worker_applications: boolean;
  /** Listing aktif, untuk daftar centang di form lamaran pekerja (D52). */
  listings: { id: string; title: string }[];
}

/**
 * GET /providers/:id. Hanya provider VERIFIED yang punya halaman publik.
 * Alamat dan koordinat basis sengaja tidak ditampilkan.
 */
export async function getPublicProvider(id: string): Promise<PublicProviderDto> {
  const row = await prisma.providerProfile.findFirst({
    where: { id, verificationStatus: 'VERIFIED' },
    select: {
      id: true,
      businessName: true,
      bio: true,
      providerType: true,
      serviceRadiusKm: true,
      ratingAverage: true,
      ratingCount: true,
      completedOrdersCount: true,
      verifiedAt: true,
      user: { select: { fullName: true } },
      listings: {
        where: { status: 'ACTIVE', deletedAt: null },
        select: { id: true, title: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!row) throw Errors.notFound('Provider tidak ditemukan');

  return {
    id: row.id,
    display_name: row.businessName ?? row.user.fullName,
    business_name: row.businessName,
    bio: row.bio,
    provider_type: row.providerType,
    service_radius_km: row.serviceRadiusKm?.toNumber() ?? null,
    rating_average: row.ratingAverage.toNumber(),
    rating_count: row.ratingCount,
    completed_orders_count: row.completedOrdersCount,
    verified_at: row.verifiedAt?.toISOString() ?? null,
    accepts_worker_applications: row.providerType === 'BUSINESS',
    listings: row.listings,
  };
}
