/**
 * Isi email modul provider dan pekerja. Murni menyusun teks.
 *
 * Penerimanya mengikuti peta notifikasi D58: pelamar diberi tahu saat
 * lamarannya diputus. Pemilik diberi tahu saat ada pelamar baru, karena
 * melamar adalah salah satu aksi yang memicu email ke pihak lain (D62).
 * Keputusan e-KYC dan perubahan tipe dikirim ke pemohonnya.
 */

import type { AccountEmailContent } from '../auth/account-emails';

function email(title: string, body: string, subject: string, text: string): AccountEmailContent {
  return { title, body, subject, text };
}

export function kycApprovedEmail(fullName: string): AccountEmailContent {
  return email(
    'Pengajuan provider disetujui',
    'e-KYC Anda disetujui. Anda sekarang provider terverifikasi.',
    'Pengajuan provider Jasana disetujui',
    `Halo ${fullName},\n\n` +
      'Dokumen e-KYC Anda sudah diperiksa dan disetujui. Anda sekarang provider ' +
      'terverifikasi dan otomatis terdaftar sebagai pekerja di usaha Anda sendiri.\n\n' +
      'Langkah berikutnya adalah membuat listing jasa.',
  );
}

export function kycRejectedEmail(fullName: string, reason: string): AccountEmailContent {
  return email(
    'Pengajuan provider ditolak',
    `Alasan: ${reason}`,
    'Pengajuan provider Jasana ditolak',
    `Halo ${fullName},\n\n` +
      'Pengajuan Anda sebagai provider belum dapat disetujui.\n\n' +
      `Alasan: ${reason}\n\n` +
      'Anda dapat mengajukan ulang dan mengunggah dokumen yang diperbaiki.',
  );
}

export function typeUpgradeDecisionEmail(
  fullName: string,
  approved: boolean,
  reason: string | null,
): AccountEmailContent {
  const outcome = approved ? 'disetujui' : 'ditolak';
  return email(
    `Perubahan tipe usaha ${outcome}`,
    approved ? 'Tipe usaha Anda sekarang BUSINESS.' : `Alasan: ${reason ?? '-'}`,
    `Pengajuan perubahan tipe usaha Jasana ${outcome}`,
    `Halo ${fullName},\n\n` +
      `Pengajuan perubahan tipe usaha Anda menjadi BUSINESS ${outcome}.` +
      (approved
        ? ' Usaha Anda sekarang dapat menerima lamaran pekerja.'
        : `\n\nAlasan: ${reason ?? '-'}`),
  );
}

export function workerApplicationReceivedEmail(
  ownerName: string,
  applicantName: string,
): AccountEmailContent {
  return email(
    'Lamaran pekerja baru',
    `${applicantName} melamar menjadi pekerja di usaha Anda.`,
    'Ada lamaran pekerja baru di usaha Anda',
    `Halo ${ownerName},\n\n` +
      `${applicantName} melamar menjadi pekerja di usaha Anda. ` +
      'Periksa lamarannya di halaman Pekerja, tab Pelamar.',
  );
}

export function workerApplicationDecisionEmail(
  applicantName: string,
  businessName: string,
  approved: boolean,
  reason: string | null,
): AccountEmailContent {
  const outcome = approved ? 'disetujui' : 'ditolak';
  return email(
    `Lamaran pekerja ${outcome}`,
    approved
      ? `Anda sekarang pekerja aktif di ${businessName}.`
      : `Lamaran ke ${businessName} ditolak.${reason ? ` Alasan: ${reason}` : ''}`,
    `Lamaran pekerja Anda di ${businessName} ${outcome}`,
    `Halo ${applicantName},\n\n` +
      `Lamaran Anda sebagai pekerja di ${businessName} ${outcome}.` +
      (approved
        ? ' Anda sekarang dapat ditugaskan ke order usaha ini.'
        : reason
          ? `\n\nAlasan: ${reason}`
          : ''),
  );
}
