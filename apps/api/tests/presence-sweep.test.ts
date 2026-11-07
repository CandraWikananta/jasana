/**
 * Cron sweep presence (PRD 7.1, H40, D57): toggle pekerja yang presence-nya
 * basi dimatikan, yang terhubung atau baru berdenyut tidak disentuh.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@jasana/database';
import { sweepStalePresence } from '../src/jobs/presence-sweep';
import { presence } from '../src/realtime/presence';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import { MINUTE, newWorld, type World } from './helpers/orders';

describe.skipIf(!hasTestDatabase)('sweepStalePresence', () => {
  let w: World;
  const available = async (id: string) => (await prisma.providerWorker.findUniqueOrThrow({ where: { id } })).isAvailable;

  beforeEach(async () => {
    await resetDatabase();
    w = await newWorld();
  });

  it('mematikan toggle yang basi, membiarkan yang terhubung dan yang baru berdenyut', async () => {
    // Proses dianggap sudah jalan 11 menit, lewat toleransi 10 menit.
    presence.reset(Date.now() - 11 * MINUTE);
    presence.connect(w.w2.workerId);
    presence.touch(w.w4.workerId);
    await prisma.providerWorker.update({ where: { id: w.w3.workerId }, data: { isAvailable: false } });

    expect(await sweepStalePresence()).toBe(1);
    expect(await available(w.owner.workerId)).toBe(false);
    expect(await available(w.w2.workerId)).toBe(true);
    expect(await available(w.w4.workerId)).toBe(true);
  });

  it('tidak mematikan siapa pun tepat setelah restart (grace period)', async () => {
    presence.reset();
    expect(await sweepStalePresence()).toBe(0);
    expect(await available(w.owner.workerId)).toBe(true);
  });
});
