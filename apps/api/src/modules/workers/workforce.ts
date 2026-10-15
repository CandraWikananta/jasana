/**
 * Aturan tenaga kerja yang dipakai lintas service: persetujuan e-KYC,
 * lamaran pekerja, dan pengelolaan pekerja oleh pemilik.
 *
 * Seluruh fungsi di sini menerima `tx` dan WAJIB dipanggil di dalam
 * transaksi, karena gunanya menjaga aturan yang tidak dijaga basis data.
 */

import { AppError, Errors } from '../../lib/errors';
import type { OrderStatus, Prisma } from '@jasana/database';

type Tx = Prisma.TransactionClient;

/**
 * Mengunci baris `provider_profiles` sampai transaksi selesai.
 *
 * H27 (minimal satu pekerja ACTIVE dengan accepts_assignments = true) tidak
 * dijaga basis data. Tanpa kunci, dua permintaan bersamaan yang masing-
 * masing mematikan satu dari dua pekerja terakhir sama-sama melihat "masih
 * ada satu lagi" dan sama-sama lolos. Seluruh operasi yang bisa mengurangi
 * jumlah pekerja yang bisa ditugaskan mengambil kunci ini lebih dulu,
 * sehingga pemeriksaannya berjalan bergiliran.
 *
 * Query mentah dengan parameter terikat, sesuai konvensi: hanya untuk
 * `SELECT ... FOR UPDATE`.
 */
export async function lockProviderProfile(tx: Tx, providerProfileId: string): Promise<boolean> {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM provider_profiles WHERE id = ${providerProfileId}::uuid FOR UPDATE
  `;
  return rows.length > 0;
}

/** Jumlah pekerja ACTIVE yang bersedia ditugaskan, opsional tanpa satu pekerja. */
export function countAssignableWorkers(
  tx: Tx,
  providerProfileId: string,
  excludeWorkerId?: string,
): Promise<number> {
  return tx.providerWorker.count({
    where: {
      providerProfileId,
      membershipStatus: 'ACTIVE',
      acceptsAssignments: true,
      ...(excludeWorkerId ? { id: { not: excludeWorkerId } } : {}),
    },
  });
}

/**
 * H27 / D39. Dipanggil SEBELUM mematikan `accepts_assignments` atau
 * mengeluarkan pekerja. Kunci provider harus sudah diambil.
 */
export async function assertAnotherAssignableWorker(
  tx: Tx,
  providerProfileId: string,
  workerId: string,
): Promise<void> {
  if ((await countAssignableWorkers(tx, providerProfileId, workerId)) === 0) {
    throw new AppError(
      'PROVIDER_HAS_NO_ACTIVE_WORKER',
      'Usaha wajib punya minimal satu pekerja aktif yang bersedia ditugaskan. ' +
        'Aktifkan kesediaan pekerja lain lebih dulu.',
    );
  }
}

/**
 * D36. Pesan yang menjelaskan SEBABNYA, bukan sekadar 409, sesuai catatan
 * konsekuensi D33 dan D36 di register keputusan.
 */
export async function assertNoActiveMembership(
  tx: Tx,
  userId: string,
  context: 'APPLY_PROVIDER' | 'APPROVE_PROVIDER' | 'APPLY_WORKER' | 'APPROVE_WORKER',
): Promise<void> {
  const active = await tx.providerWorker.findFirst({
    where: { userId, membershipStatus: 'ACTIVE' },
    select: {
      isOwner: true,
      providerProfile: { select: { businessName: true } },
    },
  });
  if (!active) return;

  const where = active.providerProfile.businessName
    ? `di usaha "${active.providerProfile.businessName}"`
    : 'di usaha lain';

  const messages: Record<typeof context, string> = {
    APPLY_PROVIDER:
      `Anda masih pekerja aktif ${where}. Satu orang hanya boleh punya satu keanggotaan aktif, ` +
      'jadi mengundurkan diri lebih dulu sebelum membuka usaha sendiri.',
    APPROVE_PROVIDER:
      `Pemohon masih pekerja aktif ${where}. Satu orang hanya boleh punya satu keanggotaan aktif, ` +
      'dan pemilik usaha otomatis menjadi pekerja di usahanya sendiri.',
    APPLY_WORKER: active.isOwner
      ? 'Pemilik usaha tidak bisa sekaligus menjadi pekerja di usaha lain.'
      : `Anda sudah menjadi pekerja aktif ${where}. Satu orang hanya boleh punya satu keanggotaan aktif.`,
    APPROVE_WORKER:
      'Pelamar ini sudah bergabung ke usaha lain. Satu orang hanya boleh punya satu keanggotaan aktif.',
  };

  throw new AppError('WORKER_MEMBERSHIP_CONFLICT', messages[context]);
}

/**
 * D37. Begitu seseorang punya keanggotaan ACTIVE, lamarannya yang masih
 * PENDING di usaha lain gugur. Partial unique index H23 tetap penjaga yang
 * sebenarnya; ini supaya pemilik usaha lain tidak melihat pelamar yang
 * sudah pasti tidak bisa disetujui.
 */
export async function withdrawPendingApplications(
  tx: Tx,
  userId: string,
  exceptWorkerId?: string,
): Promise<number> {
  const result = await tx.providerWorker.updateMany({
    where: {
      userId,
      membershipStatus: 'PENDING',
      ...(exceptWorkerId ? { id: { not: exceptWorkerId } } : {}),
    },
    data: { membershipStatus: 'REJECTED', isAvailable: false },
  });
  return result.count;
}

/**
 * Status order yang belum berakhir dan masih mengikat pekerjanya, baik
 * sebagai penanggung jawab maupun pendamping. COMPLETED dan DISPUTED tidak
 * termasuk: pekerjaan fisiknya sudah selesai (lihat definisi in-flight H4).
 */
export const OPEN_ORDER_STATUSES: OrderStatus[] = [
  'ACCEPTED',
  'PAID',
  'ON_THE_WAY',
  'ARRIVED',
  'IN_PROGRESS',
  'AWAITING_VERIFICATION',
];

/**
 * Seluruh `listingIds` wajib milik usaha itu dan belum dihapus. Pelamar
 * hanya boleh mencentang listing yang sedang ACTIVE (`activeOnly`), karena
 * hanya itu yang tampil di halaman publik usaha (D52). Pemilik boleh
 * memetakan ke listing DRAFT, karena pemetaan justru syarat listing DRAFT
 * bisa diaktifkan (D53).
 */
export async function assertListingsOwnedBy(
  tx: Tx,
  providerProfileId: string,
  listingIds: string[],
  activeOnly: boolean,
): Promise<void> {
  if (listingIds.length === 0) return;

  const found = await tx.listing.findMany({
    where: {
      id: { in: listingIds },
      providerProfileId,
      deletedAt: null,
      ...(activeOnly ? { status: 'ACTIVE' as const } : {}),
    },
    select: { id: true },
  });
  const foundIds = new Set(found.map((row) => row.id));
  const invalid = listingIds.filter((id) => !foundIds.has(id));

  if (invalid.length > 0) {
    throw Errors.validation(
      invalid.map((id) => ({
        path: 'listing_ids',
        message: `Listing ${id} bukan listing ${activeOnly ? 'aktif ' : ''}milik usaha ini`,
      })),
    );
  }
}
