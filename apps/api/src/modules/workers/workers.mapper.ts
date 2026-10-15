/**
 * Bentuk JSON baris `provider_workers`.
 */

import type { Prisma } from '@jasana/database';

export const WORKER_SELECT = {
  id: true,
  providerProfileId: true,
  displayName: true,
  photoUrl: true,
  experienceNote: true,
  isOwner: true,
  membershipStatus: true,
  acceptsAssignments: true,
  isAvailable: true,
  currentLatitude: true,
  currentLongitude: true,
  locationUpdatedAt: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, fullName: true, email: true, phone: true } },
  listings: {
    select: { listing: { select: { id: true, title: true, status: true } } },
    orderBy: { createdAt: 'asc' },
  },
} as const satisfies Prisma.ProviderWorkerSelect;

export type WorkerRow = Prisma.ProviderWorkerGetPayload<{ select: typeof WORKER_SELECT }>;

export interface WorkerDto {
  id: string;
  provider_profile_id: string;
  user: { id: string; full_name: string; email: string; phone: string };
  display_name: string;
  photo_url: string | null;
  experience_note: string | null;
  is_owner: boolean;
  membership_status: string;
  accepts_assignments: boolean;
  is_available: boolean;
  current_latitude: number | null;
  current_longitude: number | null;
  location_updated_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  /**
   * Pemetaan ke listing. Untuk pelamar isinya usulan, baru berlaku saat
   * keanggotaan ACTIVE (D52).
   */
  listings: { id: string; title: string; status: string }[];
}

export function toWorkerDto(row: WorkerRow): WorkerDto {
  return {
    id: row.id,
    provider_profile_id: row.providerProfileId,
    user: {
      id: row.user.id,
      full_name: row.user.fullName,
      email: row.user.email,
      phone: row.user.phone,
    },
    display_name: row.displayName,
    photo_url: row.photoUrl,
    experience_note: row.experienceNote,
    is_owner: row.isOwner,
    membership_status: row.membershipStatus,
    accepts_assignments: row.acceptsAssignments,
    is_available: row.isAvailable,
    current_latitude: row.currentLatitude?.toNumber() ?? null,
    current_longitude: row.currentLongitude?.toNumber() ?? null,
    location_updated_at: row.locationUpdatedAt?.toISOString() ?? null,
    approved_at: row.approvedAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    listings: row.listings.map(({ listing }) => listing),
  };
}
