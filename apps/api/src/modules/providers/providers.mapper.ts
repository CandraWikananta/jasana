/**
 * Bentuk JSON provider dan dokumen e-KYC.
 *
 * Decimal dikonversi ke number di sini. Koordinat Decimal(10,8) dan
 * Decimal(11,8) muat utuh di double, begitu juga radius Decimal(5,2) dan
 * rating Decimal(3,2).
 */

import type { Prisma } from '@jasana/database';

export const PROVIDER_SELECT = {
  id: true,
  userId: true,
  providerType: true,
  requestedProviderType: true,
  businessName: true,
  bio: true,
  verificationStatus: true,
  verifiedAt: true,
  rejectionReason: true,
  baseAddress: true,
  baseLatitude: true,
  baseLongitude: true,
  serviceRadiusKm: true,
  ratingAverage: true,
  ratingCount: true,
  completedOrdersCount: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.ProviderProfileSelect;

export type ProviderRow = Prisma.ProviderProfileGetPayload<{ select: typeof PROVIDER_SELECT }>;

export interface ProviderDto {
  id: string;
  user_id: string;
  provider_type: string;
  requested_provider_type: string | null;
  business_name: string | null;
  bio: string | null;
  verification_status: string;
  verified_at: string | null;
  rejection_reason: string | null;
  base_address: string | null;
  base_latitude: number | null;
  base_longitude: number | null;
  service_radius_km: number | null;
  rating_average: number;
  rating_count: number;
  completed_orders_count: number;
  created_at: string;
  updated_at: string;
}

export function toProviderDto(row: ProviderRow): ProviderDto {
  return {
    id: row.id,
    user_id: row.userId,
    provider_type: row.providerType,
    requested_provider_type: row.requestedProviderType,
    business_name: row.businessName,
    bio: row.bio,
    verification_status: row.verificationStatus,
    verified_at: row.verifiedAt?.toISOString() ?? null,
    rejection_reason: row.rejectionReason,
    base_address: row.baseAddress,
    base_latitude: row.baseLatitude?.toNumber() ?? null,
    base_longitude: row.baseLongitude?.toNumber() ?? null,
    service_radius_km: row.serviceRadiusKm?.toNumber() ?? null,
    rating_average: row.ratingAverage.toNumber(),
    rating_count: row.ratingCount,
    completed_orders_count: row.completedOrdersCount,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export const KYC_DOCUMENT_SELECT = {
  id: true,
  documentType: true,
  status: true,
  note: true,
  uploadedAt: true,
  reviewedAt: true,
} as const satisfies Prisma.KycDocumentSelect;

export type KycDocumentRow = Prisma.KycDocumentGetPayload<{ select: typeof KYC_DOCUMENT_SELECT }>;

/**
 * `file_url` SENGAJA tidak ada. Isinya path objek di bucket private yang
 * tidak bisa dibuka langsung, dan admin mendapat `signed_url` terpisah.
 */
export interface KycDocumentDto {
  id: string;
  document_type: string;
  status: string;
  note: string | null;
  uploaded_at: string;
  reviewed_at: string | null;
}

export function toKycDocumentDto(row: KycDocumentRow): KycDocumentDto {
  return {
    id: row.id,
    document_type: row.documentType,
    status: row.status,
    note: row.note,
    uploaded_at: row.uploadedAt.toISOString(),
    reviewed_at: row.reviewedAt?.toISOString() ?? null,
  };
}

/** Pemisah bucket dan path pada kolom `kyc_documents.file_url`. */
export function kycObjectKey(bucket: string, path: string): string {
  return `${bucket}/${path}`;
}

/** Kebalikan `kycObjectKey`. `null` kalau bentuknya tidak dikenali. */
export function parseKycObjectKey(fileUrl: string): { bucket: string; path: string } | null {
  const slash = fileUrl.indexOf('/');
  if (slash <= 0 || slash === fileUrl.length - 1) return null;
  return { bucket: fileUrl.slice(0, slash), path: fileUrl.slice(slash + 1) };
}
