/**
 * Dokumen e-KYC yang diminta per tipe usaha (D46).
 *
 *   INDIVIDUAL   KTP dan SELFIE_KTP
 *   BUSINESS     KTP, SELFIE_KTP, dan salah satu dari NPWP atau BUSINESS_LICENSE
 *
 * CERTIFICATE boleh diunggah siapa pun sebagai pelengkap, tidak wajib.
 *
 * Yang dihitung hanya dokumen berstatus PENDING, yaitu yang diajukan pada
 * putaran pengajuan saat ini. Dokumen putaran sebelumnya yang sudah
 * REJECTED tidak ikut melengkapi pengajuan ulang.
 */

import type { KycDocumentType, ProviderType } from '@jasana/database';

/** Dua jenis dokumen yang hanya sah untuk usaha BUSINESS (PRD 4.4 langkah 5). */
export const BUSINESS_DOCUMENT_TYPES: ReadonlySet<KycDocumentType> = new Set<KycDocumentType>([
  'NPWP',
  'BUSINESS_LICENSE',
]);

export type RequiredDocument = 'KTP' | 'SELFIE_KTP' | 'NPWP_OR_BUSINESS_LICENSE';

export function missingDocuments(
  providerType: ProviderType,
  present: Iterable<KycDocumentType>,
): RequiredDocument[] {
  const have = new Set(present);
  const missing: RequiredDocument[] = [];
  if (!have.has('KTP')) missing.push('KTP');
  if (!have.has('SELFIE_KTP')) missing.push('SELFIE_KTP');
  if (providerType === 'BUSINESS' && !have.has('NPWP') && !have.has('BUSINESS_LICENSE')) {
    missing.push('NPWP_OR_BUSINESS_LICENSE');
  }
  return missing;
}

export function hasRequiredDocuments(
  providerType: ProviderType,
  present: Iterable<KycDocumentType>,
): boolean {
  return missingDocuments(providerType, present).length === 0;
}
