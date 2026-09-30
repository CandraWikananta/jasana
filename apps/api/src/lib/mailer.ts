/**
 * Pengirim email lewat SMTP (D58).
 *
 * ATURAN: dipanggil hanya SETELAH transaksi commit, tidak pernah di dalamnya.
 * Kegagalan SMTP tidak boleh membatalkan operasi yang memicunya. Lihat
 * modules/notifications/email-dispatch.ts untuk pola lengkapnya.
 *
 * Saat NODE_ENV=test, transport diganti `jsonTransport` bawaan nodemailer
 * supaya uji tidak pernah membuka koneksi jaringan. Uji membaca isi email
 * dengan `vi.spyOn(mailer, 'send')`, karena itulah satu-satunya cara
 * mendapatkan token mentah: basis data hanya menyimpan hash-nya.
 */

import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  transporter ??= env.isTest
    ? nodemailer.createTransport({ jsonTransport: true })
    : nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
        // Tanpa batas waktu, SMTP yang menggantung menahan promise selamanya.
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      });
  return transporter;
}

export const mailer = {
  async send(message: MailMessage): Promise<void> {
    await getTransporter().sendMail({ from: env.SMTP_FROM_ADDRESS, ...message });
  },
};
