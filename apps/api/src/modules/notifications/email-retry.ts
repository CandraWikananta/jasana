/**
 * Cron retry email (D177, H37), tiap 5 menit.
 *
 * Kandidat:
 *   - baris EMAIL berstatus FAILED dengan `email_attempts < email_retry_max_attempts`, dan retry
 *     ke-(n+1) baru boleh setelah created_at melewati EMAIL_RETRY_BACKOFF_MINUTES[n] (backoff)
 *   - baris EMAIL yang yatim di PENDING (`email_attempts = 0`, lebih tua dari
 *     EMAIL_PENDING_STALE_MINUTES): proses mati setelah commit sebelum dispatch (sebagian H114)
 * keduanya hanya yang created_at-nya dalam EMAIL_RETRY_MAX_AGE_HOURS, dan hanya kalau
 * `reference_type` punya renderer di bawah. Whitelist, bukan
 * pengecualian: email bertoken (`verification_token`) dan baris tanpa referensi
 * tidak pernah dikirim ulang, termasuk jenis baru yang lupa didaftarkan.
 *
 * `email_attempts` hanya menghitung retry. Klaimnya UPDATE bersyarat pada
 * status dan hitungan yang dibaca, pola yang sama dengan `recoverWebhookEvents`:
 * dua instance cron yang berjalan bersamaan tidak mengirim email yang sama dua kali.
 * Pengiriman di luar transaksi.
 */

import { prisma } from '@jasana/database';
import {
  EMAIL_PENDING_STALE_MINUTES, EMAIL_RETRY_BACKOFF_MINUTES, EMAIL_RETRY_BATCH, EMAIL_RETRY_MAX_AGE_HOURS,
} from '../../config/constants';
import { logger } from '../../lib/logger';
import { getNumberSetting } from '../settings/settings.service';
import { deliver, markFailed } from './email-outbox';

/** Baris penutup email hasil render ulang. `null` berarti barisnya sudah tidak ada. */
type ReferenceLine = (id: string) => Promise<string | null>;
const exists = (found: number, line = ''): string | null => (found > 0 ? line : null);

const RENDERERS: Record<string, ReferenceLine> = {
  order: async (id) => {
    const order = await prisma.order.findUnique({ where: { id }, select: { orderNumber: true } });
    return order ? `\n\nNomor order: ${order.orderNumber}` : null;
  },
  withdrawal: async (id) => exists(await prisma.withdrawal.count({ where: { id } }), `\n\nId withdrawal: ${id}`),
  provider_profile: async (id) => exists(await prisma.providerProfile.count({ where: { id } })),
  provider_worker: async (id) => exists(await prisma.providerWorker.count({ where: { id } })),
  taxonomy_request: async (id) => exists(await prisma.taxonomyRequest.count({ where: { id } })),
};

export const RETRYABLE_REFERENCE_TYPES = Object.keys(RENDERERS);

export interface EmailRetryResult {
  claimed: number;
  sent: number;
  failed: number;
}

export async function retryFailedEmails(): Promise<EmailRetryResult> {
  const result: EmailRetryResult = { claimed: 0, sent: 0, failed: 0 };
  const max = await getNumberSetting('email_retry_max_attempts');
  if (max <= 0) return result;

  const now = Date.now();
  const ago = (minutes: number) => new Date(now - minutes * 60_000);
  const backoff = (n: number) => EMAIL_RETRY_BACKOFF_MINUTES[Math.min(n, EMAIL_RETRY_BACKOFF_MINUTES.length - 1)]!;
  // Tanpa kolom baru: jadwal dihitung dari created_at, satu cabang per nilai email_attempts.
  const failedDue = Array.from({ length: max }, (_, n) => ({ emailStatus: 'FAILED' as const, emailAttempts: n, createdAt: { lt: ago(backoff(n)) } }));

  const candidates = await prisma.notification.findMany({
    where: {
      channel: 'EMAIL',
      referenceType: { in: RETRYABLE_REFERENCE_TYPES },
      createdAt: { gte: ago(EMAIL_RETRY_MAX_AGE_HOURS * 60) },
      OR: [
        ...failedDue,
        { emailStatus: 'PENDING', emailAttempts: 0, createdAt: { lt: ago(EMAIL_PENDING_STALE_MINUTES) } },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: EMAIL_RETRY_BATCH,
    select: {
      id: true, title: true, body: true, referenceType: true, referenceId: true, emailStatus: true, emailAttempts: true,
      user: { select: { email: true, fullName: true } },
    },
  });

  for (const c of candidates) {
    const claim = await prisma.notification.updateMany({
      where: { id: c.id, emailStatus: c.emailStatus, emailAttempts: c.emailAttempts },
      data: { emailStatus: 'PENDING', emailAttempts: { increment: 1 } },
    });
    if (claim.count === 0) continue;
    result.claimed += 1;

    // Lolos filter `in`, jadi keduanya pasti terisi dan renderer-nya ada.
    const line = await RENDERERS[c.referenceType!]!(c.referenceId!);
    if (line === null) {
      await markFailed(c.id, `Referensi ${c.referenceType} ${c.referenceId} sudah tidak ada`);
      result.failed += 1;
      continue;
    }
    // Render generik (D177): title dan body bebas token, alamat dibaca ulang dari users.email.
    const sent = await deliver({
      notificationId: c.id,
      to: c.user.email,
      subject: `Jasana: ${c.title}`,
      text: `Halo ${c.user.fullName},\n\n${c.body ?? ''}${line}`,
    });
    if (sent) result.sent += 1;
    else result.failed += 1;
  }

  logger.info({ job: 'email-retry', ...result }, 'Retry email selesai');
  return result;
}
