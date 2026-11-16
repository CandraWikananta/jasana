/**
 * Pola notifikasi D58: CATAT di dalam transaksi, KIRIM setelah commit.
 *
 *   await prisma.$transaction(async (tx) => {
 *     ...
 *     outgoing.push(...(await recordNotification(tx, {...})));   // baris notifications
 *   });
 *   dispatchNotifications(outgoing);   // SMTP dan Socket.IO, di luar transaksi
 *
 * Kenapa dua langkah: panggilan SMTP di dalam transaksi menahan koneksi
 * basis data selama belasan detik, dan kalau SMTP gagal, transaksinya ikut
 * batal padahal pendaftaran atau penggantian password itu sendiri sah.
 * Baris ditulis di transaksi pemicunya, jadi notifikasi tidak pernah ada
 * tanpa event-nya dan sebaliknya (D178).
 *
 * TOKEN MENTAH TIDAK MASUK KOLOM `body`. Isi email lengkap (yang memuat
 * tautan bertoken) hanya hidup di memori sampai dikirim. Cron retry (D177)
 * merender ulang isi email dari `title`, `body`, dan referensinya, dan hanya
 * untuk `reference_type` yang terdaftar di `RETRYABLE_REFERENCE_TYPES`
 * (email-retry.ts). Email akun bertoken memakai `verification_token`, jadi
 * tidak pernah dikirim ulang. Pemulihannya lewat tombol kirim ulang
 * (resend-verification, forgot-password), yang membuat token baru.
 */

import type { NotificationType, Prisma } from '@jasana/database';
import { prisma } from '@jasana/database';
import { mailer } from '../../lib/mailer';
import { logger } from '../../lib/logger';
import { emit } from '../../realtime/socket';
import { toNotificationDto, type NotificationDto } from './notifications.mapper';

export interface OutgoingEmail {
  notificationId: bigint;
  to: string;
  subject: string;
  text: string;
}

/** Notifikasi in-app yang diumumkan lewat `notification:new` setelah commit. */
export interface OutgoingInApp {
  userId: string;
  dto: NotificationDto;
}

export type Outgoing = OutgoingEmail | OutgoingInApp;

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

/** Dipanggil DI DALAM transaksi. Hanya kanal EMAIL, dipakai langsung oleh email akun. */
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

export interface RecordNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  referenceType: string;
  referenceId: string;
  /** Diisi kalau event ini juga dikirim lewat email (tabel event D178). */
  email?: { to: string; subject: string; text: string };
  /** `false` untuk event yang hanya email, misalnya T12 Pekerjaan dimulai. */
  inApp?: boolean;
}

/**
 * Fungsi terpusat D178. Dipanggil DI DALAM transaksi pemicunya: menulis baris
 * IN_APP dan, kalau diminta, baris EMAIL. Hasilnya diserahkan ke
 * `dispatchNotifications` setelah commit.
 */
export async function recordNotification(
  tx: Prisma.TransactionClient,
  input: RecordNotificationInput,
): Promise<Outgoing[]> {
  const out: Outgoing[] = [];
  const { userId, type, title, body, referenceType, referenceId } = input;
  if (input.inApp !== false) {
    const row = await tx.notification.create({
      data: { userId, type, channel: 'IN_APP', title, body, referenceType, referenceId },
    });
    out.push({ userId, dto: toNotificationDto(row) });
  }
  if (input.email) {
    out.push(await recordEmail(tx, { userId, type, title, body, referenceType, referenceId, ...input.email }));
  }
  return out;
}

export async function deliver(email: OutgoingEmail): Promise<boolean> {
  try {
    await mailer.send({ to: email.to, subject: email.subject, text: email.text });
    await prisma.notification.update({
      where: { id: email.notificationId },
      data: { emailStatus: 'SENT', sentAt: new Date(), emailError: null },
    });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(
      { notification_id: email.notificationId.toString(), err: error },
      'Pengiriman email gagal, operasi pemicunya tetap berlaku',
    );
    await markFailed(email.notificationId, message);
    return false;
  }
}

/** Pencatatan status pun boleh gagal (misalnya basis data putus), dan itu tidak boleh merambat ke pemanggil. */
export async function markFailed(notificationId: bigint, message: string): Promise<void> {
  await prisma.notification
    .update({ where: { id: notificationId }, data: { emailStatus: 'FAILED', emailError: message.slice(0, 500) } })
    .catch((updateError: unknown) => logger.error({ err: updateError }, 'Gagal mencatat status email FAILED'));
}

/**
 * Dipanggil SETELAH commit. Tidak di-await oleh service pemanggil.
 *
 * Tidak di-await supaya respons tidak menunggu SMTP, dan untuk
 * forgot-password juga supaya waktu respons email terdaftar dan tidak
 * terdaftar tidak berbeda jauh. Promise-nya tetap dikembalikan untuk uji.
 */
export function dispatchNotifications(items: Outgoing[]): Promise<void> {
  for (const item of items) {
    if ('dto' in item) emit(`user:${item.userId}`, 'notification:new', item.dto);
  }
  return Promise.all(items.filter((item): item is OutgoingEmail => 'to' in item).map(deliver)).then(() => undefined);
}

/** Bentuk singkat untuk pemanggil yang sudah punya template email lengkap (title, body, subject, text). */
export function recordNotificationWithEmail(
  tx: Prisma.TransactionClient,
  input: RecordEmailInput & { type: NotificationType; referenceType: string; referenceId: string },
): Promise<Outgoing[]> {
  const { to, subject, text, ...rest } = input;
  return recordNotification(tx, { ...rest, email: { to, subject, text } });
}
