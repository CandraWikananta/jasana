/**
 * Pola pengiriman email D58: CATAT di dalam transaksi, KIRIM setelah commit.
 *
 *   await prisma.$transaction(async (tx) => {
 *     ...
 *     outgoing.push(await recordEmail(tx, {...}));   // baris notifications
 *   });
 *   dispatchEmails(outgoing);                          // SMTP, di luar transaksi
 *
 * Kenapa dua langkah: panggilan SMTP di dalam transaksi menahan koneksi
 * basis data selama belasan detik, dan kalau SMTP gagal, transaksinya ikut
 * batal padahal pendaftaran atau penggantian password itu sendiri sah.
 *
 * TOKEN MENTAH TIDAK MASUK KOLOM `body`. Isi email lengkap (yang memuat
 * tautan bertoken) hanya hidup di memori sampai dikirim. Konsekuensinya baris
 * email akun yang FAILED tidak bisa dikirim ulang oleh cron retry, karena
 * tokennya memang tidak tersimpan. Pemulihannya lewat tombol kirim ulang
 * (resend-verification, forgot-password), yang membuat token baru. Baris
 * seperti itu ditandai `reference_type = 'verification_token'` supaya cron
 * retry di Fase 10 bisa melewatinya.
 */

import type { NotificationType, Prisma } from '@jasana/database';
import { prisma } from '@jasana/database';
import { mailer } from '../../lib/mailer';
import { logger } from '../../lib/logger';

export interface OutgoingEmail {
  notificationId: bigint;
  to: string;
  subject: string;
  text: string;
}

export interface RecordEmailInput {
  userId: string;
  /** Alamat tujuan. Bisa berbeda dari `users.email`, misalnya `pending_email`. */
  to: string;
  type?: NotificationType;
  /** Ringkasan yang aman disimpan, tampil di daftar notifikasi. */
  title: string;
  body: string;
  /** Isi email sesungguhnya, boleh memuat tautan bertoken. Tidak disimpan. */
  subject: string;
  text: string;
  referenceType?: string;
  referenceId?: string;
}

/** Dipanggil DI DALAM transaksi. */
export async function recordEmail(
  tx: Prisma.TransactionClient,
  input: RecordEmailInput,
): Promise<OutgoingEmail> {
  const row = await tx.notification.create({
    data: {
      userId: input.userId,
      type: input.type ?? 'ACCOUNT',
      channel: 'EMAIL',
      title: input.title,
      body: input.body,
      emailStatus: 'PENDING',
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
    },
    select: { id: true },
  });

  return { notificationId: row.id, to: input.to, subject: input.subject, text: input.text };
}

async function deliver(email: OutgoingEmail): Promise<void> {
  try {
    await mailer.send({ to: email.to, subject: email.subject, text: email.text });
    await prisma.notification.update({
      where: { id: email.notificationId },
      data: { emailStatus: 'SENT', sentAt: new Date(), emailError: null },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(
      { notification_id: email.notificationId.toString(), err: error },
      'Pengiriman email gagal, operasi pemicunya tetap berlaku',
    );
    // Pencatatan status pun boleh gagal (misalnya basis data sedang putus),
    // dan itu tetap tidak boleh merambat ke pemanggil.
    await prisma.notification
      .update({
        where: { id: email.notificationId },
        data: { emailStatus: 'FAILED', emailError: message.slice(0, 500) },
      })
      .catch((updateError: unknown) =>
        logger.error({ err: updateError }, 'Gagal mencatat status email FAILED'),
      );
  }
}

/**
 * Dipanggil SETELAH commit. Tidak di-await oleh service pemanggil.
 *
 * Tidak di-await supaya respons tidak menunggu SMTP, dan untuk
 * forgot-password juga supaya waktu respons email terdaftar dan tidak
 * terdaftar tidak berbeda jauh. Promise-nya tetap dikembalikan untuk uji.
 */
export function dispatchEmails(emails: OutgoingEmail[]): Promise<void> {
  return Promise.all(emails.map(deliver)).then(() => undefined);
}
