/**
 * Ketersediaan pekerja untuk penugasan (D41, D43, H4, H25, H45).
 *
 * Dua kunci yang dipisah (D41):
 *   in-flight   predikat H4, sama dengan `uniq_inflight_order_per_worker`
 *   jadwal      irisan rentang [scheduled_at, + durasi + buffer) antar order
 *               SCHEDULED berstatus ACCEPTED (tentatif) dan PAID (pasti, D43)
 *
 * Pekerja dihitung sebagai penanggung jawab ATAU pendamping (H45), karena
 * index in-flight hanya melihat `assigned_worker_id`. Slot tidak punya tabel
 * sendiri: dilepas begitu statusnya keluar dari ACCEPTED/PAID (H26).
 */

import { Prisma } from '@jasana/database';
import { AppError } from '../../lib/errors';
import { getNumberSetting } from '../settings/settings.service';

type Tx = Prisma.TransactionClient;

/** Batas atas durasi order (D90, D100), membatasi jendela kandidat bentrok. */
const MAX_DURATION_MINUTES = 720;
const MINUTE = 60_000;

/** Predikat in-flight H4, cermin `uniq_inflight_order_per_worker`. */
export const IN_FLIGHT_WHERE = {
  OR: [
    { status: { in: ['ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_VERIFICATION'] } },
    { bookingMode: 'AVAILABLE_NOW', status: { in: ['ACCEPTED', 'PAID'] } },
  ],
} as const satisfies Prisma.OrderWhereInput;

/** Rentang setengah terbuka, masing-masing diperpanjang buffer (State Machine 3.1). */
export function rangesOverlap(aStart: Date, aMinutes: number, bStart: Date, bMinutes: number, bufferMinutes: number): boolean {
  const aEnd = aStart.getTime() + (aMinutes + bufferMinutes) * MINUTE;
  const bEnd = bStart.getTime() + (bMinutes + bufferMinutes) * MINUTE;
  return aStart.getTime() < bEnd && bStart.getTime() < aEnd;
}

/**
 * Mengunci baris pekerja supaya dua penugasan bersamaan ke pekerja yang sama
 * diperiksa bergiliran. Urut id supaya dua transaksi tidak saling menunggu.
 */
export async function lockWorkers(tx: Tx, workerIds: string[]): Promise<void> {
  if (workerIds.length === 0) return;
  const ids = [...new Set(workerIds)].sort();
  await tx.$queryRaw`
    SELECT id FROM provider_workers
    WHERE id IN (${Prisma.join(ids.map((id) => Prisma.sql`${id}::uuid`))})
    ORDER BY id FOR UPDATE
  `;
}

export interface Slot {
  start: Date;
  minutes: number;
  /** Order yang sedang ditugaskan, tidak bentrok dengan dirinya sendiri. */
  excludeOrderId: string;
}

export interface BusyWorkers {
  inflight: Set<string>;
  /** Pekerja bentrok jadwal beserta nomor order yang ditabraknya. */
  conflicts: Map<string, string>;
}

/**
 * Pekerja yang tidak bisa ditugaskan di `slot`, sebagai penanggung jawab ATAU
 * pendamping (H45). Dipakai penugasan (assertWorkersFree) dan pencocokan
 * Available Now, yang membutuhkan daftar, bukan galat (D55, D108).
 */
export async function findBusyWorkers(tx: Tx, workerIds: string[], slot: Slot): Promise<BusyWorkers> {
  const busy: BusyWorkers = { inflight: new Set(), conflicts: new Map() };
  if (workerIds.length === 0) return busy;
  const wanted = new Set(workerIds);
  const involving: Prisma.OrderWhereInput = {
    id: { not: slot.excludeOrderId },
    OR: [{ assignedWorkerId: { in: workerIds } }, { crew: { some: { workerId: { in: workerIds } } } }],
  };
  const people = { assignedWorkerId: true, crew: { select: { workerId: true } } } as const;
  const membersOf = (order: { assignedWorkerId: string | null; crew: { workerId: string }[] }) =>
    [order.assignedWorkerId, ...order.crew.map((c) => c.workerId)].filter((id): id is string => !!id && wanted.has(id));

  const inflight = await tx.order.findMany({ where: { AND: [involving, IN_FLIGHT_WHERE] }, select: people });
  for (const order of inflight) membersOf(order).forEach((id) => busy.inflight.add(id));

  const buffer = await getNumberSetting('schedule_conflict_buffer_minutes');
  const candidates = await tx.order.findMany({
    where: {
      AND: [involving],
      bookingMode: 'SCHEDULED',
      status: { in: ['ACCEPTED', 'PAID'] },
      scheduledAt: {
        gt: new Date(slot.start.getTime() - (MAX_DURATION_MINUTES + buffer) * MINUTE),
        lt: new Date(slot.start.getTime() + (slot.minutes + buffer) * MINUTE),
      },
    },
    select: { orderNumber: true, scheduledAt: true, snapshotDurationMinutes: true, ...people },
  });
  for (const order of candidates) {
    if (rangesOverlap(order.scheduledAt!, order.snapshotDurationMinutes ?? 0, slot.start, slot.minutes, buffer)) {
      membersOf(order).forEach((id) => busy.conflicts.set(id, order.orderNumber));
    }
  }
  return busy;
}

/** Wajib setelah `lockWorkers` di transaksi yang sama. */
export async function assertWorkersFree(tx: Tx, workerIds: string[], slot: Slot): Promise<void> {
  const busy = await findBusyWorkers(tx, workerIds, slot);
  if (busy.inflight.size > 0) throw new AppError('WORKER_HAS_INFLIGHT_ORDER', 'Pekerja sedang mengerjakan order lain');
  const [orderNumber] = busy.conflicts.values();
  if (orderNumber) {
    throw new AppError('WORKER_SCHEDULE_CONFLICT', `Jadwal pekerja bentrok dengan order ${orderNumber}`);
  }
}
