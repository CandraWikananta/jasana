/**
 * Isi email akun. Murni menyusun teks, tidak menyentuh basis data.
 *
 * Tautan mengarah ke frontend (`APP_BASE_URL`), bukan langsung ke API.
 * Frontend yang memanggil `POST /auth/...` dengan token dari query string.
 * Kalau tautan langsung memicu aksi lewat GET, pemindai tautan di layanan
 * email (yang membuka setiap tautan untuk memeriksa malware) akan memakai
 * tokennya sebelum pemiliknya sempat mengklik.
 *
 * `title` dan `body` adalah ringkasan yang disimpan ke tabel `notifications`
 * dan TIDAK BOLEH memuat token. `subject` dan `text` hanya dikirim.
 */

import { env } from '../../config/env';

export interface AccountEmailContent {
  title: string;
  body: string;
  subject: string;
  text: string;
}

function link(path: string, token: string): string {
  const url = new URL(path, env.APP_BASE_URL);
  url.searchParams.set('token', token);
  return url.toString();
}

export function emailVerificationEmail(fullName: string, token: string): AccountEmailContent {
  return {
    title: 'Verifikasi alamat email',
    body: 'Tautan verifikasi dikirim ke alamat email akun.',
    subject: 'Verifikasi alamat email Jasana',
    text:
      `Halo ${fullName},\n\n` +
      'Klik tautan berikut untuk memverifikasi alamat email Anda. ' +
      'Tautan berlaku 24 jam.\n\n' +
      `${link('/verify-email', token)}\n\n` +
      'Kalau Anda tidak mendaftar di Jasana, abaikan email ini.',
  };
}

export function passwordResetEmail(fullName: string, token: string): AccountEmailContent {
  return {
    title: 'Permintaan reset password',
    body: 'Tautan reset password dikirim ke alamat email akun.',
    subject: 'Reset password Jasana',
    text:
      `Halo ${fullName},\n\n` +
      'Ada permintaan untuk mengganti password akun Anda. Tautan berikut ' +
      'berlaku 1 jam dan hanya bisa dipakai sekali.\n\n' +
      `${link('/reset-password', token)}\n\n` +
      'Kalau bukan Anda yang meminta, abaikan email ini. Password Anda tidak berubah.',
  };
}

export function emailChangeConfirmationEmail(
  fullName: string,
  newEmail: string,
  token: string,
): AccountEmailContent {
  return {
    title: 'Konfirmasi alamat email baru',
    body: `Tautan konfirmasi dikirim ke ${newEmail}.`,
    subject: 'Konfirmasi alamat email baru Jasana',
    text:
      `Halo ${fullName},\n\n` +
      `Klik tautan berikut untuk menjadikan ${newEmail} alamat email akun Jasana Anda. ` +
      'Tautan berlaku 24 jam. Sampai dikonfirmasi, alamat lama tetap dipakai.\n\n' +
      `${link('/confirm-email-change', token)}`,
  };
}

/** D64 pengaman ketiga: pemberitahuan ke alamat LAMA. */
export function emailChangeNoticeEmail(fullName: string, newEmail: string): AccountEmailContent {
  const text =
    `Halo ${fullName},\n\n` +
    `Ada permintaan untuk mengganti alamat email akun Jasana Anda menjadi ${newEmail}. ` +
    'Alamat ini tetap aktif sampai alamat baru dikonfirmasi.\n\n' +
    'Kalau bukan Anda yang meminta, segera login dan batalkan permintaan ' +
    'penggantian email, lalu ganti password Anda.';
  return {
    title: 'Permintaan penggantian email',
    body: `Ada permintaan mengganti email akun menjadi ${newEmail}.`,
    subject: 'Permintaan penggantian email akun Jasana',
    text,
  };
}
