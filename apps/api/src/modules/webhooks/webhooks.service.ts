/**
 * Webhook invoice Xendit (PRD 4.4, H10, H11) dan cron pemulihannya (PRD 7.1, D121).
 *
 *   receiveInvoiceEvent   transaksi 1 mencatat event, kunci lewat UPDATE bersyarat
 *                         atomik, lalu transaksi 2 lewat `processEvent`
 *   recoverWebhookEvents  PROCESSING macet jadi FAILED, lalu FAILED diulang dari
 *                         payload tersimpan maksimal WEBHOOK_MAX_RETRIES kali
 *
 * Bisnisnya ada di `applyInvoiceEvent` (modul orders). Di sini hanya mesin event.
 */

import { prisma, type Prisma } from '@jasana/database';
import { WEBHOOK_MAX_RETRIES, WEBHOOK_STUCK_MINUTES } from '../../config/constants';
import { logger } from '../../lib/logger';
import { applyInvoiceEvent, NO_RETRY_MARKERS, type InvoiceOutcome } from '../orders/order-payment.service';
import { withOrderTransaction } from '../orders/order-transition.service';
import { invoiceCallbackSchema, type InvoiceCallback } from './webhooks.schema';

const BATCH = 100;

/**
 * Galat sebelum kunci diambil dilempar dan dibalas 5xx supaya Xendit mengirim
 * ulang (usulan D128). Setelah kunci diambil, fungsi ini tidak pernah melempar.
 */
export async function receiveInvoiceEvent(payload: InvoiceCallback): Promise<void> {
  const eventId = `invoice:${payload.id}:${payload.status}`;

  // Transaksi 1 (H10): satu INSERT, ter-commit sendiri sebelum bisnis apa pun berjalan.
  await prisma.webhookEvent.createMany({
    data: [{ domain: 'PAYMENT', eventId, eventType: payload.status, referenceId: payload.id, payload: payload as Prisma.InputJsonValue, signatureValid: true }],
    skipDuplicates: true,
  });

  // H11: UPDATE bersyarat atomik, bukan baca lalu cek. Nol baris berarti sedang
  // atau sudah diproses pihak lain, dan event FAILED hanya diulang cron.
  const locked = await prisma.webhookEvent.updateMany({
    where: { eventId, processingStatus: 'RECEIVED' },
    data: { processingStatus: 'PROCESSING', lockedAt: new Date() },
  });
  if (locked.count === 0) return;

  await processEvent(eventId, payload);
}

/** Transaksi 2. Status event ditulis di transaksi yang sama dengan bisnisnya. */
async function processEvent(eventId: string, payload: unknown): Promise<InvoiceOutcome['status'] | 'ERROR'> {
  try {
    const event = invoiceCallbackSchema.parse(payload);
    const outcome = await withOrderTransaction(async (tx, afterCommit) => {
      const result = await applyInvoiceEvent(tx, afterCommit, event);
      await tx.webhookEvent.update({
        where: { eventId },
        data: { processingStatus: result.status, errorMessage: result.message ?? null, processedAt: new Date() },
      });
      return result;
    });
    logger.info({ event_id: eventId, processing_status: outcome.status }, 'Webhook diproses');
    return outcome.status;
  } catch (error) {
    // Transaksi 2 sudah rollback, jadi barisnya masih PROCESSING. Tandai FAILED untuk cron (D121).
    logger.error({ err: error, event_id: eventId }, 'Pemrosesan webhook gagal, diulang cron pemulihan');
    await prisma.webhookEvent
      .update({ where: { eventId }, data: { processingStatus: 'FAILED', errorMessage: error instanceof Error ? error.message : String(error) } })
      // Kalau ini juga gagal, baris tetap PROCESSING dan cron mengembalikannya ke FAILED setelah 5 menit.
      .catch((markError: unknown) => logger.error({ err: markError, event_id: eventId }, 'Gagal menandai webhook FAILED'));
    return 'ERROR';
  }
}

export interface RecoveryResult {
  stuck: number;
  retried: number;
  processed: number;
  failed: number;
}

/** Cron tiap 5 menit (PRD 7.1, D121). */
export async function recoverWebhookEvents(): Promise<RecoveryResult> {
  const stuck = await prisma.webhookEvent.updateMany({
    where: { processingStatus: 'PROCESSING', lockedAt: { lt: new Date(Date.now() - WEBHOOK_STUCK_MINUTES * 60_000) } },
    data: { processingStatus: 'FAILED', errorMessage: `Macet di PROCESSING lebih dari ${WEBHOOK_STUCK_MINUTES} menit` },
  });

  const candidates = await prisma.webhookEvent.findMany({
    where: {
      domain: 'PAYMENT',
      processingStatus: 'FAILED',
      retryCount: { lt: WEBHOOK_MAX_RETRIES },
      // D120 dan bayar dobel tidak diulang: hasilnya akan selalu sama.
      OR: [{ errorMessage: null }, { NOT: NO_RETRY_MARKERS.map((marker) => ({ errorMessage: { startsWith: marker } })) }],
    },
    orderBy: { receivedAt: 'asc' },
    take: BATCH,
    select: { id: true, eventId: true, payload: true, retryCount: true },
  });

  const result: RecoveryResult = { stuck: stuck.count, retried: 0, processed: 0, failed: 0 };
  for (const candidate of candidates) {
    // Kunci yang sama polanya dengan handler: cron yang berjalan bersamaan tidak mengulang event yang sama.
    const locked = await prisma.webhookEvent.updateMany({
      where: { id: candidate.id, processingStatus: 'FAILED', retryCount: candidate.retryCount },
      data: { processingStatus: 'PROCESSING', lockedAt: new Date(), retryCount: { increment: 1 } },
    });
    if (locked.count === 0) continue;
    result.retried += 1;
    if ((await processEvent(candidate.eventId, candidate.payload)) === 'ERROR') result.failed += 1;
    else result.processed += 1;
  }
  logger.info({ job: 'webhook-recovery', ...result }, 'Pemulihan webhook selesai');
  return result;
}
