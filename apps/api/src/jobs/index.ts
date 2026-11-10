/**
 * Pendaftaran cron (PRD 7.1). Hanya dipanggil dari `server.ts`, tidak dari
 * `app.ts`, supaya uji yang memakai `createApp()` tidak ikut menjalankannya.
 *
 * Job yang gagal dicatat lalu dibiarkan, tidak menghentikan proses: jadwal
 * berikutnya akan mencoba lagi.
 */

import { schedule } from 'node-cron';
import { logger } from '../lib/logger';
import { sweepPaymentDeadlines, sweepResponseDeadlines, sweepSettlements } from '../modules/orders/order-expiry.service';
import { recoverWebhookEvents } from '../modules/webhooks/webhooks.service';
import { cleanOrphanListingPhotos } from './orphan-listing-photos';
import { sweepStalePresence } from './presence-sweep';

function register(name: string, expression: string, job: () => Promise<unknown>): void {
  schedule(
    expression,
    async () => {
      try {
        await job();
      } catch (error) {
        logger.error({ err: error, job: name }, 'Cron gagal');
      }
    },
    { name, noOverlap: true },
  );
}

export function startJobs(): void {
  // Tiap 1 hari (H80).
  register('orphan-listing-photos', '0 3 * * *', cleanOrphanListingPhotos);
  // Tiap 1 menit: T3 dan T6 (PRD 7.1, sesi 6f).
  register('response-deadline-sweep', '* * * * *', sweepResponseDeadlines);
  register('payment-deadline-sweep', '* * * * *', sweepPaymentDeadlines);
  // Tiap 2 menit (H40).
  register('presence-sweep', '*/2 * * * *', sweepStalePresence);
  // Tiap 5 menit (PRD 7.1): T18 (7c) dan pemulihan webhook (D121).
  register('settlement-sweep', '*/5 * * * *', sweepSettlements);
  register('webhook-recovery', '*/5 * * * *', recoverWebhookEvents);
  logger.info('Cron terdaftar');
}
