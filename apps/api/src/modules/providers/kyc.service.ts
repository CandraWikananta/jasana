/**
 * Unggah dokumen e-KYC lewat API (D80, PRD 4.4 POST /providers/me/kyc-documents).
 *
 * URUTANNYA MENGIKAT, jangan diubah:
 *
 *   1. Batas ukuran            middleware upload.ts, 413 PAYLOAD_TOO_LARGE
 *   2. MAGIC BYTES             bukan Content-Type, bukan ekstensi nama berkas
 *                              -> 422 UNSUPPORTED_FILE_TYPE
 *   3. Aturan bisnis           status pengajuan, NPWP dan izin usaha hanya
 *                              untuk BUSINESS -> 409 atau 422
 *   4. Unggah ke bucket PRIVATE  -> 502 STORAGE_UPLOAD_FAILED, TANPA baris
 *   5. BARU tulis baris kyc_documents
 *
 * Langkah 4 dan 5 tidak boleh dibalik (H79). Kalau baris ditulis lebih dulu
 * lalu unggah gagal, admin melihat pengajuan yang berkasnya tidak ada.
 *
 * Aturan bisnis diperiksa SEBELUM unggah, bukan sesudah, supaya permintaan
 * yang pasti ditolak tidak sempat meninggalkan berkas di Storage. Kalau
 * penulisan baris gagal setelah berkas masuk (misalnya status berubah di
 * antara kedua langkah), berkasnya dihapus lagi.
 */

import { randomUUID } from 'node:crypto';
import { prisma, type KycDocumentType, type Prisma, type ProviderType, type VerificationStatus } from '@jasana/database';
import { KYC_BUCKET } from '../../config/constants';
import { AppError, Errors } from '../../lib/errors';
import { detectFileType } from '../../lib/file-signature';
import { logger } from '../../lib/logger';
import { storage } from '../../lib/supabase';
import { lockProviderProfile } from '../workers/workforce';
import { BUSINESS_DOCUMENT_TYPES, missingDocuments, type RequiredDocument } from './kyc-rules';
import {
  KYC_DOCUMENT_SELECT,
  kycObjectKey,
  toKycDocumentDto,
  type KycDocumentDto,
} from './providers.mapper';

/** Berkas yang sudah diterima multer. Bukan tipe Express, jadi service bisa diuji tanpa HTTP. */
export interface IncomingFile {
  buffer: Buffer;
  size: number;
}

export interface KycUploadResultDto {
  document: KycDocumentDto;
  verification_status: VerificationStatus;
  missing_documents: RequiredDocument[];
}

interface ProfileState {
  verificationStatus: VerificationStatus;
  providerType: ProviderType;
  requestedProviderType: ProviderType | null;
}

/**
 * Siapa boleh mengunggah apa, per status pengajuan.
 *
 *   DRAFT, PENDING   dokumen apa pun yang sesuai tipe usahanya
 *   VERIFIED         hanya NPWP atau izin usaha, dan hanya selama ada
 *                    pengajuan naik ke BUSINESS (D47)
 *   REJECTED         ajukan ulang dulu, supaya jelas dokumen mana yang
 *                    termasuk putaran baru
 *   SUSPENDED        tidak boleh
 */
function assertUploadAllowed(profile: ProfileState, documentType: KycDocumentType): void {
  const isBusinessDocument = BUSINESS_DOCUMENT_TYPES.has(documentType);
  const effectiveType = profile.requestedProviderType ?? profile.providerType;

  // PRD 4.4 langkah 5.
  if (isBusinessDocument && effectiveType !== 'BUSINESS') {
    throw Errors.validation([
      { path: 'document_type', message: `${documentType} hanya untuk provider BUSINESS` },
    ]);
  }

  switch (profile.verificationStatus) {
    case 'DRAFT':
    case 'PENDING':
      return;
    case 'VERIFIED':
      if (profile.requestedProviderType === 'BUSINESS' && isBusinessDocument) return;
      throw new AppError(
        'PROVIDER_STATE_CONFLICT',
        'Profil sudah terverifikasi. Dokumen hanya bisa diunggah untuk pengajuan perubahan tipe ke BUSINESS',
      );
    case 'REJECTED':
      throw new AppError(
        'PROVIDER_STATE_CONFLICT',
        'Pengajuan ditolak. Ajukan ulang lewat POST /providers/apply sebelum mengunggah dokumen baru',
      );
    case 'SUSPENDED':
      throw new AppError('PROVIDER_STATE_CONFLICT', 'Akun provider sedang ditangguhkan');
  }
}

const PROFILE_STATE_SELECT = {
  id: true,
  verificationStatus: true,
  providerType: true,
  requestedProviderType: true,
} as const satisfies Prisma.ProviderProfileSelect;

export async function uploadKycDocument(
  userId: string,
  documentType: KycDocumentType,
  file: IncomingFile | undefined,
): Promise<KycUploadResultDto> {
  if (!file || file.size === 0) {
    throw Errors.validation([{ path: 'file', message: 'file wajib diunggah' }]);
  }

  // Langkah 2. Jenis berkas dari isi, bukan dari apa yang dikatakan client.
  const detected = detectFileType(file.buffer);
  if (!detected) {
    throw new AppError(
      'UNSUPPORTED_FILE_TYPE',
      'Berkas harus JPEG, PNG, atau PDF. Jenisnya ditentukan dari isi berkas, bukan dari nama atau Content-Type',
    );
  }

  // Langkah 3.
  const profile = await prisma.providerProfile.findUnique({
    where: { userId },
    select: PROFILE_STATE_SELECT,
  });
  if (!profile) throw Errors.notFound('Ajukan diri sebagai provider lebih dulu');
  assertUploadAllowed(profile, documentType);

  // Langkah 4. Nama objek UUID baru, ekstensi dari hasil deteksi. Nama
  // berkas asli dari client tidak dipakai sama sekali.
  const objectPath = `${profile.id}/${randomUUID()}.${detected.extension}`;
  try {
    await storage.upload(KYC_BUCKET, objectPath, file.buffer, detected.mime);
  } catch (error) {
    throw new AppError('STORAGE_UPLOAD_FAILED', 'Berkas gagal disimpan, silakan unggah ulang', {
      cause: error,
      context: { provider_profile_id: profile.id, document_type: documentType },
    });
  }

  // Langkah 5. Hanya dicapai kalau berkas SUDAH ada di Storage.
  try {
    return await prisma.$transaction(async (tx) => {
      // Dikunci supaya dua unggahan bersamaan tidak sama-sama melewatkan
      // perpindahan DRAFT ke PENDING, dan supaya keputusan admin yang
      // datang di antara langkah 3 dan 5 ikut terlihat.
      await lockProviderProfile(tx, profile.id);
      const current = await tx.providerProfile.findUniqueOrThrow({
        where: { id: profile.id },
        select: PROFILE_STATE_SELECT,
      });
      assertUploadAllowed(current, documentType);

      const document = await tx.kycDocument.create({
        data: {
          providerProfileId: profile.id,
          documentType,
          fileUrl: kycObjectKey(KYC_BUCKET, objectPath),
        },
        select: KYC_DOCUMENT_SELECT,
      });

      const pending = await tx.kycDocument.findMany({
        where: { providerProfileId: profile.id, status: 'PENDING' },
        select: { documentType: true },
      });
      const missing = missingDocuments(
        current.providerType,
        pending.map((row) => row.documentType),
      );

      let status = current.verificationStatus;
      if (status === 'DRAFT' && missing.length === 0) {
        await tx.providerProfile.update({
          where: { id: profile.id },
          data: { verificationStatus: 'PENDING' },
        });
        status = 'PENDING';
      }

      return {
        document: toKycDocumentDto(document),
        verification_status: status,
        missing_documents: status === 'VERIFIED' ? [] : missing,
      };
    });
  } catch (error) {
    // Baris tidak jadi ditulis, jadi berkasnya tidak boleh tertinggal.
    await storage.remove(KYC_BUCKET, [objectPath]).catch((removeError: unknown) =>
      logger.error(
        { err: removeError, bucket: KYC_BUCKET, path: objectPath },
        'Gagal menghapus berkas e-KYC yang barisnya batal ditulis',
      ),
    );
    throw error;
  }
}
