/**
 * Isi email keputusan usulan taksonomi (D74, jalur D58). Murni menyusun teks.
 *
 * MERGED memuat tautan ke taksonomi yang sudah ada, supaya provider tahu
 * harus memakai yang mana, bukan sekadar merasa ditolak.
 */

import type { TaxonomyRequestStatus } from '@jasana/database';
import { env } from '../../config/env';
import type { AccountEmailContent } from '../auth/account-emails';

const OUTCOME: Record<Exclude<TaxonomyRequestStatus, 'PENDING'>, string> = {
  APPROVED: 'disetujui',
  REJECTED: 'ditolak',
  MERGED: 'sudah tersedia',
};

export function taxonomyDecisionEmail(
  fullName: string,
  proposedName: string,
  status: Exclude<TaxonomyRequestStatus, 'PENDING'>,
  adminNote: string | null,
  existingSubcategoryId: string | null,
): AccountEmailContent {
  const outcome = OUTCOME[status];
  const link = existingSubcategoryId
    ? new URL(`/subcategories/${existingSubcategoryId}`, env.APP_BASE_URL).toString()
    : null;
  const note = adminNote ? `\n\nCatatan admin: ${adminNote}` : '';
  const detail =
    status === 'APPROVED'
      ? ' Usulan Anda sudah masuk ke katalog Jasana.'
      : status === 'MERGED'
        ? ' Yang Anda usulkan ternyata sudah ada di katalog.' + (link ? ` Lihat di sini: ${link}` : '')
        : '';

  return {
    title: `Usulan taksonomi ${outcome}`,
    body: `"${proposedName}" ${outcome}.${adminNote ? ` ${adminNote}` : ''}`.slice(0, 2000),
    subject: `Usulan "${proposedName}" ${outcome}`,
    text: `Halo ${fullName},\n\nUsulan "${proposedName}" ${outcome}.${detail}${note}`,
  };
}
