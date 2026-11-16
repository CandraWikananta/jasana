/**
 * Pelaksanaan order (sesi 6e): T8 depart, T10 check-in, T12 start, T14 finish,
 * T16 verify, kode verifikasi untuk client (D60, usulan D111), dan relay lokasi
 * (usulan D112).
 *
 * Seluruh transisi memakai actorFrom(access, ['WORKER']): pemilik INDIVIDUAL
 * yang juga penanggung jawab bertindak sebagai WORKER, bukan PROVIDER.
 *
 * Pola "catat, commit, baru tolak" (check-in dan verify): baris percobaan
 * gagal harus tetap tersimpan, jadi callback transaksi MENGEMBALIKAN
 * penolakannya. Transaksi commit, baru penolakan itu dilempar. Kalau dilempar
 * di dalam, rollback ikut menghapus barisnya.
 */

import { prisma, type Order, type Prisma } from '@jasana/database';
import { decryptVerificationCode, encryptVerificationCode, generateVerificationCode } from '../../lib/crypto';
import { AppError } from '../../lib/errors';
import { haversineKm } from '../../lib/haversine';
import { actorFrom, type OrderAccess } from '../access/access.service';
import { dispatchNotifications } from '../notifications/email-outbox';
import { getNumberSetting } from '../settings/settings.service';
import { notifyUsers } from './order-notify';
import { assertTransition, lockOrder, transitionOrder, withOrderTransaction, type AfterCommitTask } from './order-transition.service';
import { getOrder } from './orders.service';
import type { OrderDto } from './orders.mapper';
import type { CheckInBody } from './orders.schema';

type Tx = Prisma.TransactionClient;
type AfterCommit = (task: AfterCommitTask) => void;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
/** State Machine 7: Scheduled boleh berangkat 60 menit sebelum jadwal. */
const DEPART_EARLY_MINUTES = 60;
/** H9. */
const CODE_TTL_MINUTES = 60;

const notAllowed = (message: string) => new AppError('ORDER_TRANSITION_NOT_ALLOWED', message);

/** Notifikasi tabel event D178. `withOwnerAndWorker` hanya untuk COMPLETED. */
async function notify(tx: Tx, afterCommit: AfterCommit, order: Order, title: string, detail: string, withOwnerAndWorker = false, inApp = true) {
  let recipients: Array<string | undefined> = [order.clientId];
  if (withOwnerAndWorker) {
    const who = await tx.order.findUniqueOrThrow({
      where: { id: order.id },
      select: { providerProfile: { select: { userId: true } }, assignedWorker: { select: { userId: true } } },
    });
    recipients = [...recipients, who.providerProfile.userId, who.assignedWorker?.userId];
  }
  const outgoing = await notifyUsers(tx, recipients, order, title, detail, 'ORDER_STATUS', { inApp });
  afterCommit(() => void dispatchNotifications(outgoing));
}

/** Transisi pelaksanaan sederhana (T8, T12, T14) oleh penanggung jawab. */
async function workerTransition(
  access: OrderAccess,
  toStatus: 'ON_THE_WAY' | 'IN_PROGRESS' | 'AWAITING_VERIFICATION',
  options: {
    guard?: (tx: Tx, order: Order) => Promise<void>;
    data?: Prisma.OrderUncheckedUpdateManyInput;
    title: string;
    detail: string;
    inApp?: boolean;
  },
): Promise<OrderDto> {
  const actor = actorFrom(access, ['WORKER']);
  await withOrderTransaction(async (tx, afterCommit) => {
    await transitionOrder(tx, {
      orderId: access.orderId,
      afterCommit,
      toStatus,
      actor,
      actorUserId: access.userId,
      ...(options.data ? { data: options.data } : {}),
      ...(options.guard ? { guard: options.guard } : {}),
      effects: (tx, order) => notify(tx, afterCommit, order, options.title, options.detail, false, options.inApp),
    });
  });
  return getOrder(access.orderId);
}

/** POST /orders/:id/depart (T8). Index in-flight menolak lewat rethrowInflight (H4). */
export function departOrder(access: OrderAccess): Promise<OrderDto> {
  return workerTransition(access, 'ON_THE_WAY', {
    title: 'Pekerja berangkat',
    detail: 'Pekerja sedang menuju lokasi Anda. Posisinya bisa dipantau di aplikasi.',
    guard: async (tx, order) => {
      if (!(await tx.payment.count({ where: { orderId: order.id, status: 'PAID' } }))) {
        throw notAllowed('Order belum dibayar');
      }
      // Usulan D113: guard tanpa kode di Lampiran A memakai ORDER_TRANSITION_NOT_ALLOWED.
      if (order.bookingMode === 'SCHEDULED' && Date.now() < order.scheduledAt!.getTime() - DEPART_EARLY_MINUTES * MINUTE) {
        throw notAllowed(`Order terjadwal baru bisa diberangkatkan ${DEPART_EARLY_MINUTES} menit sebelum jadwal`);
      }
    },
  });
}

/** POST /orders/:id/start (T12). */
export function startWork(access: OrderAccess): Promise<OrderDto> {
  return workerTransition(access, 'IN_PROGRESS', {
    title: 'Pekerjaan dimulai',
    detail: 'Pekerja mulai mengerjakan pesanan Anda.',
    // D178 opsi B: client sudah bersama pekerja di lokasi, cukup email.
    inApp: false,
    guard: async (tx, order) => {
      if (!(await tx.orderCheckin.count({ where: { orderId: order.id, isValid: true } }))) {
        throw notAllowed('Belum ada check-in yang sah untuk order ini');
      }
    },
  });
}

/** POST /orders/:id/finish (T14). Kodenya TIDAK ikut notifikasi maupun email (D60). */
export function finishWork(access: OrderAccess): Promise<OrderDto> {
  return workerTransition(access, 'AWAITING_VERIFICATION', {
    title: 'Pekerjaan selesai',
    detail: 'Pekerja menandai pekerjaan selesai. Buka aplikasi untuk melihat kode verifikasi dan berikan kepada pekerja.',
    data: {
      verificationCodeEncrypted: encryptVerificationCode(generateVerificationCode()),
      verificationExpiresAt: new Date(Date.now() + CODE_TTL_MINUTES * MINUTE),
      verificationAttempts: 0,
      verificationLockedUntil: null,
    },
  });
}

/** POST /orders/:id/check-in (T10, PRD 4.4). Baris ditulis apa pun hasilnya. */
export async function checkIn(access: OrderAccess, body: CheckInBody): Promise<OrderDto> {
  const actor = actorFrom(access, ['WORKER']);
  // Kolom radius_threshold_meters bertipe Int: nilai yang disimpan dan yang dibandingkan harus sama.
  const radius = Math.round(await getNumberSetting('geolocation_radius_meters'));

  const rejection = await withOrderTransaction(async (tx, afterCommit) => {
    const order = await lockOrder(tx, access.orderId);
    await assertTransition(tx, order, 'ARRIVED', actor, access.userId);

    // Jebakan aturan 9: jarak dihitung di server, tidak pernah dari client.
    const distance =
      haversineKm(body.latitude, body.longitude, order.serviceLatitude.toNumber(), order.serviceLongitude.toNumber()) * 1000;
    const isValid = distance <= radius;
    await tx.orderCheckin.create({
      data: {
        orderId: order.id,
        workerId: order.assignedWorkerId!,
        latitude: body.latitude,
        longitude: body.longitude,
        distanceMeters: distance.toFixed(2),
        radiusThresholdMeters: radius,
        accuracyMeters: body.accuracy_meters ?? null,
        isValid,
        attemptNumber: (await tx.orderCheckin.count({ where: { orderId: order.id } })) + 1,
      },
    });
    if (!isValid) {
      return new AppError('CHECKIN_OUT_OF_RADIUS', `Lokasi Anda ${Math.round(distance)} m dari titik layanan, batasnya ${radius} m`, {
        details: [{ path: 'distance_meters', message: `${Math.round(distance)} m, radius ${radius} m` }],
      });
    }

    await transitionOrder(tx, {
      orderId: order.id,
      afterCommit,
      toStatus: 'ARRIVED',
      actor,
      actorUserId: access.userId,
      effects: (tx, order) => notify(tx, afterCommit, order, 'Pekerja tiba', 'Pekerja sudah tiba di lokasi Anda.'),
    });
    return null;
  });
  if (rejection) throw rejection;
  return getOrder(access.orderId);
}

/**
 * POST /orders/:id/verify (T16, PRD 4.4, H8). Kenaikan attempts dan lockout
 * tersimpan walaupun kodenya salah. D110: setelah lockout lewat, hitungan
 * mulai dari nol lagi. D114: kode kedaluwarsa ditolak tanpa menaikkan attempts.
 */
export async function verifyCode(access: OrderAccess, code: string): Promise<OrderDto> {
  const actor = actorFrom(access, ['WORKER']);
  const [maxAttempts, lockoutMinutes, holdingHours] = await Promise.all([
    getNumberSetting('verification_max_attempts'),
    getNumberSetting('verification_lockout_minutes'),
    getNumberSetting('settlement_holding_hours'),
  ]);

  const rejection = await withOrderTransaction(async (tx, afterCommit) => {
    const order = await lockOrder(tx, access.orderId);
    await assertTransition(tx, order, 'COMPLETED', actor, access.userId);

    const now = new Date();
    if (order.verificationLockedUntil && order.verificationLockedUntil > now) {
      throw new AppError('VERIFICATION_LOCKED', `Terlalu banyak percobaan, coba lagi setelah ${order.verificationLockedUntil.toISOString()}`);
    }
    // D114: tidak ada yang ditulis, jadi boleh dilempar. Client meminta kode baru (D111).
    if (!order.verificationExpiresAt || order.verificationExpiresAt <= now) {
      throw new AppError('VERIFICATION_CODE_EXPIRED', 'Kode verifikasi kedaluwarsa, minta client membuat kode baru');
    }
    // Kenaikan ikut tersimpan pada kedua hasil, di transaksi yang sama (PRD 4.4 langkah 4).
    const attempts = (order.verificationAttempts >= maxAttempts ? 0 : order.verificationAttempts) + 1;
    if (decryptVerificationCode(order.verificationCodeEncrypted!) !== code) {
      await tx.order.update({
        where: { id: order.id },
        data: {
          verificationAttempts: attempts,
          ...(attempts >= maxAttempts ? { verificationLockedUntil: new Date(now.getTime() + lockoutMinutes * MINUTE) } : {}),
        },
      });
      return new AppError('VERIFICATION_CODE_INVALID', `Kode salah, sisa ${Math.max(0, maxAttempts - attempts)} percobaan`);
    }

    await transitionOrder(tx, {
      orderId: order.id,
      afterCommit,
      toStatus: 'COMPLETED',
      actor,
      actorUserId: access.userId,
      data: { verificationAttempts: attempts, settlementDueAt: new Date(now.getTime() + holdingHours * HOUR) },
      // In-flight pekerja dan pendamping lepas sendiri: COMPLETED tidak dihitung IN_FLIGHT_WHERE maupun rumus bentrok.
      effects: async (tx, order) => {
        await tx.listing.update({ where: { id: order.listingId }, data: { orderCount: { increment: 1 } } });
        await tx.providerProfile.update({
          where: { id: order.providerProfileId },
          data: { completedOrdersCount: { increment: 1 } },
        });
        await notify(tx, afterCommit, order, 'Order selesai',
          'Kode verifikasi cocok, pekerjaan selesai. Client bisa memberi ulasan untuk penyedia.', true);
      },
    });
    return null;
  });
  if (rejection) throw rejection;
  return getOrder(access.orderId);
}

export interface VerificationCodeDto {
  code: string;
  expires_at: string;
  locked_until: string | null;
}

const codeDto = (code: string, expiresAt: Date, lockedUntil: Date | null): VerificationCodeDto => ({
  code,
  expires_at: expiresAt.toISOString(),
  locked_until: lockedUntil?.toISOString() ?? null,
});

/** GET /orders/:id/verification-code. Hanya client pemilik order (D60, PRD 4.3). */
export async function getVerificationCode(access: OrderAccess): Promise<VerificationCodeDto> {
  actorFrom(access, ['CLIENT']);
  const order = await prisma.order.findUniqueOrThrow({ where: { id: access.orderId } });
  if (order.status !== 'AWAITING_VERIFICATION') throw notAllowed('Kode verifikasi hanya ada saat order menunggu verifikasi');
  return codeDto(decryptVerificationCode(order.verificationCodeEncrypted!), order.verificationExpiresAt!, order.verificationLockedUntil);
}

/**
 * POST /orders/:id/verification-code (usulan D111). Hanya client, karena
 * pekerja yang bisa memperbarui kode bisa mereset hitungan percobaan
 * berulang kali. Kode yang masih berlaku dikembalikan tanpa rotasi.
 */
export async function renewVerificationCode(access: OrderAccess): Promise<VerificationCodeDto> {
  actorFrom(access, ['CLIENT']);
  return withOrderTransaction(async (tx) => {
    const order = await lockOrder(tx, access.orderId);
    if (order.status !== 'AWAITING_VERIFICATION') throw notAllowed('Kode verifikasi hanya ada saat order menunggu verifikasi');
    const now = new Date();
    if (order.verificationLockedUntil && order.verificationLockedUntil > now) {
      throw new AppError('VERIFICATION_LOCKED', `Masih terkunci sampai ${order.verificationLockedUntil.toISOString()}`);
    }
    if (order.verificationExpiresAt && order.verificationExpiresAt > now) {
      return codeDto(decryptVerificationCode(order.verificationCodeEncrypted!), order.verificationExpiresAt, order.verificationLockedUntil);
    }
    const code = generateVerificationCode();
    const expiresAt = new Date(now.getTime() + CODE_TTL_MINUTES * MINUTE);
    await tx.order.update({
      where: { id: order.id },
      data: {
        verificationCodeEncrypted: encryptVerificationCode(code),
        verificationExpiresAt: expiresAt,
        verificationAttempts: 0,
        verificationLockedUntil: null,
      },
    });
    return codeDto(code, expiresAt, null);
  });
}

/**
 * Event `order:location_update` (PRD 7.2, usulan D112): sah hanya dari
 * penanggung jawab ACTIVE saat order ON_THE_WAY. Hanya diteruskan, tidak
 * menulis basis data; posisi pekerja tetap lewat PATCH /workers/me/location (D66).
 */
export async function canRelayLocation(userId: string, orderId: string): Promise<boolean> {
  const order = await prisma.order.count({
    where: { id: orderId, status: 'ON_THE_WAY', assignedWorker: { userId, membershipStatus: 'ACTIVE' } },
  });
  return order > 0;
}
