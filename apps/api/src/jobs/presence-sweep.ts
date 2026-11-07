/**
 * Sweep presence pekerja (PRD 7.1, H40, D57): toggle `is_available` pekerja
 * yang koneksinya putus lebih dari `worker_presence_timeout_minutes` dimatikan,
 * supaya dashboard jujur. Pencocokan sendiri tidak bergantung pada job ini,
 * karena sudah membaca daftar online langsung (D99).
 */

import { prisma } from '@jasana/database';
import { logger } from '../lib/logger';
import { presence } from '../realtime/presence';
import { getNumberSetting } from '../modules/settings/settings.service';

export async function sweepStalePresence(): Promise<number> {
  const timeout = await getNumberSetting('worker_presence_timeout_minutes');
  const toggled = await prisma.providerWorker.findMany({ where: { isAvailable: true }, select: { id: true } });
  const stale = toggled.map((w) => w.id).filter((id) => presence.isStale(id, timeout));
  if (stale.length === 0) return 0;
  const { count } = await prisma.providerWorker.updateMany({ where: { id: { in: stale }, isAvailable: true }, data: { isAvailable: false } });
  logger.info({ count }, 'Sweep presence: toggle pekerja yang basi dimatikan');
  return count;
}
