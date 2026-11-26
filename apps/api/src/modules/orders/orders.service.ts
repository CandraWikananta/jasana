/**
 * Pembuatan dan pembacaan order (PRD 4.3, 4.4 POST /orders).
 *
 * Aturan yang dijaga di sini:
 *   jebakan 4   nominal dihitung ulang dari `listing_option_prices`
 *   D10, D73    snapshot judul, atribut SPEC, opsi beserta delta, durasi
 *   D100, H93   durasi dari opsi berdurasi, selain itu dari kolom listing
 *   D106        (usulan) tolak pesan usaha sendiri, batas respons sebelum
 *               jadwal dikurangi jendela bayar, dan radius layanan
 */

import { randomBytes } from 'node:crypto';
import { Prisma, prisma } from '@jasana/database';
import { AppError, Errors } from '../../lib/errors';
import { haversineKm } from '../../lib/haversine';
import { pageMeta, skipTake, type Paginated } from '../../lib/pagination';
import { formatWita, witaDateKey } from '../../lib/wita';
import { resolveProvider, resolveWorker } from '../access/access.service';
import { toDefinition } from '../catalog/catalog.mapper';
import { PUBLIC_WHERE } from '../listings/listings.service';
import { dispatchNotifications } from '../notifications/email-outbox';
import { currentOnlineWorkerIds } from '../../realtime/presence';
import { emit } from '../../realtime/socket';
import { findBusyWorkers } from './order-schedule';
import { getNumberSetting } from '../settings/settings.service';
import { notifyUsers } from './order-notify';
import { orderAmounts, priceOptions } from './order-pricing';
import { withOrderTransaction } from './order-transition.service';
import { ORDER_INCLUDE, toHistoryDto, toOrderDto, type OrderDto } from './orders.mapper';
import type { CreateOrderBody, ListOrdersQuery } from './orders.schema';

const HOUR = 3_600_000;
const MINUTE = 60_000;

const notAvailable = (message: string) => new AppError('LISTING_NOT_AVAILABLE', message);
/** Order baru belum punya id, jadi tidak ada order yang dikecualikan dari pemeriksaan bentrok. */
const NO_ORDER = '00000000-0000-0000-0000-000000000000';

/**
 * ORD-20261107-9F2A0C1B, tanggalnya hari kalender WITA (D154). Acak, bukan urutan harian: urutan butuh kunci atau sequence.
 * shortcut: tabrakan dibalas 500 oleh unique index, upgrade ke retry atau sequence kalau order per hari ribuan.
 */
export function newOrderNumber(now: Date): string {
  return `ORD-${witaDateKey(now)}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

async function serviceLocation(userId: string, body: CreateOrderBody) {
  if (body.location_source !== 'SAVED_ADDRESS') {
    return { address: body.service_address!, lat: body.service_latitude!, lng: body.service_longitude! };
  }
  const address = await prisma.userAddress.findFirst({ where: { id: body.address_id!, userId } });
  if (!address) throw Errors.notFound('Alamat tidak ditemukan');
  return { address: address.addressLine, lat: address.latitude.toNumber(), lng: address.longitude.toNumber() };
}

/** Pekerja calon penerima tawaran beserta jaraknya ke client. */
export interface OfferRecipient {
  id: string;
  userId: string;
  km: number;
}

/**
 * Penerima tawaran Available Now (D55, D102): pekerja usaha itu yang ACTIVE,
 * bersedia ditugaskan, toggle menyala, online (D65, D99), terpetakan ke listing,
 * berada di dalam `service_radius_km` dari client (usulan D107), dan tidak sibuk
 * sebagai penanggung jawab maupun pendamping: in-flight, atau bentrok dengan
 * order Scheduled ACCEPTED/PAID (H28, H45, usulan D108). Terdekat lebih dulu.
 */
export async function pickOfferRecipients(
  tx: Prisma.TransactionClient,
  listing: { id: string; providerProfileId: string; radiusKm: number | null },
  location: { lat: number; lng: number },
  minutes: number,
  limit: number,
): Promise<OfferRecipient[]> {
  const online = await currentOnlineWorkerIds();
  if (online.length === 0 || listing.radiusKm === null) return [];
  const radiusKm = listing.radiusKm;
  const workers = await tx.providerWorker.findMany({
    where: {
      id: { in: online },
      providerProfileId: listing.providerProfileId,
      membershipStatus: 'ACTIVE',
      acceptsAssignments: true,
      isAvailable: true,
      currentLatitude: { not: null },
      currentLongitude: { not: null },
      listings: { some: { listingId: listing.id } },
    },
    select: { id: true, userId: true, currentLatitude: true, currentLongitude: true },
  });
  const near = workers
    .map((w) => ({
      id: w.id,
      userId: w.userId,
      km: haversineKm(location.lat, location.lng, w.currentLatitude!.toNumber(), w.currentLongitude!.toNumber()),
    }))
    .filter((w) => w.km <= radiusKm)
    .sort((a, b) => a.km - b.km);
  const busy = await findBusyWorkers(tx, near.map((w) => w.id), { start: new Date(), minutes, excludeOrderId: NO_ORDER });
  return near.filter((w) => !busy.inflight.has(w.id) && !busy.conflicts.has(w.id)).slice(0, limit);
}

export async function createOrder(userId: string, body: CreateOrderBody): Promise<OrderDto> {
  const listing = await prisma.listing.findFirst({
    where: { id: body.listing_id, ...PUBLIC_WHERE },
    include: {
      providerProfile: { select: { userId: true, baseLatitude: true, baseLongitude: true, serviceRadiusKm: true } },
      subcategory: { select: { attributes: true } },
      optionPrices: { select: { attributeKey: true, optionValue: true, priceDelta: true, isOffered: true } },
    },
  });
  if (!listing) throw Errors.notFound('Listing tidak ditemukan');

  // D106 no. 1: pemilik dan pekerja usaha itu tidak memesan jasa usahanya sendiri.
  const insider = await prisma.providerWorker.findFirst({
    where: { userId, providerProfileId: listing.providerProfileId, membershipStatus: 'ACTIVE' },
    select: { id: true },
  });
  if (insider) throw new AppError('FORBIDDEN_ACTOR', 'Tidak bisa memesan jasa usaha tempat Anda terdaftar');

  const scheduled = body.booking_mode === 'SCHEDULED';
  if (scheduled ? !listing.supportsScheduled : !listing.supportsAvailableNow) {
    throw notAvailable(scheduled ? 'Listing ini tidak menerima pemesanan terjadwal' : 'Listing ini tidak menerima pemesanan mendadak');
  }

  const location = await serviceLocation(userId, body);
  const { baseLatitude, baseLongitude, serviceRadiusKm } = listing.providerProfile;
  // D106 no. 4: Scheduled diukur dari basis usaha. Available Now diukur dari pekerja (usulan D107).
  if (
    scheduled &&
    (!baseLatitude || !baseLongitude || !serviceRadiusKm ||
      haversineKm(location.lat, location.lng, baseLatitude.toNumber(), baseLongitude.toNumber()) > serviceRadiusKm.toNumber())
  ) {
    throw notAvailable('Lokasi layanan di luar jangkauan penyedia ini');
  }

  const [approvalHours, paymentWindow, feePercentage, availableNowMinutes, offerLimit] = await Promise.all([
    getNumberSetting('scheduled_approval_hours'),
    getNumberSetting('payment_window_minutes'),
    getNumberSetting('platform_fee_percentage'),
    getNumberSetting('available_now_response_minutes'),
    getNumberSetting('available_now_offer_limit'),
  ]);
  const now = new Date();
  let scheduledAt: Date | null = null;
  let responseDeadlineAt: Date;
  if (scheduled) {
    // D106 no. 2: diterima dan dibayar sebelum jadwalnya tiba.
    scheduledAt = new Date(body.scheduled_at!);
    const latestResponse = new Date(scheduledAt.getTime() - paymentWindow * MINUTE);
    if (latestResponse <= now) {
      throw Errors.validation([
        { path: 'scheduled_at', message: `scheduled_at minimal ${paymentWindow} menit dari sekarang supaya sempat dibayar` },
      ]);
    }
    responseDeadlineAt = new Date(Math.min(now.getTime() + approvalHours * HOUR, latestResponse.getTime()));
  } else {
    responseDeadlineAt = new Date(now.getTime() + availableNowMinutes * MINUTE);
  }

  const defs = listing.subcategory.attributes.map((row) => ({ ...toDefinition(row), label: row.label }));
  const priced = priceOptions(defs, listing.optionPrices, body.selected_options);
  const durationMinutes = priced.optionDurationMinutes ?? listing.estimatedDurationMinutes;
  if (!durationMinutes) throw notAvailable('Listing belum punya durasi pekerjaan');
  const amounts = orderAmounts(listing.price, priced.optionsAmount, feePercentage);

  const orderId = await withOrderTransaction(async (tx, afterCommit) => {
    const recipients = scheduled
      ? []
      : await pickOfferRecipients(
          tx,
          { id: listing.id, providerProfileId: listing.providerProfileId, radiusKm: serviceRadiusKm?.toNumber() ?? null },
          location,
          durationMinutes,
          offerLimit,
        );
    if (!scheduled && recipients.length === 0) throw notAvailable('Tidak ada pekerja yang bisa datang sekarang');

    const order = await tx.order.create({
      data: {
        orderNumber: newOrderNumber(now),
        clientId: userId,
        providerProfileId: listing.providerProfileId,
        listingId: listing.id,
        bookingMode: body.booking_mode,
        scheduledAt,
        serviceAddress: location.address,
        serviceLatitude: location.lat,
        serviceLongitude: location.lng,
        serviceNotes: body.service_notes ?? null,
        locationSource: body.location_source,
        locationAccuracyM: body.location_accuracy_m ?? null,
        snapshotListingTitle: listing.title,
        snapshotAttributes: listing.attributes ?? Prisma.JsonNull,
        snapshotSelectedOptions: priced.lines as unknown as Prisma.InputJsonValue,
        snapshotDurationMinutes: durationMinutes,
        ...amounts,
        responseDeadlineAt,
      },
    });
    await tx.orderStatusHistory.create({
      data: { orderId: order.id, toStatus: 'PENDING_ACCEPTANCE', actor: 'CLIENT', changedByUserId: userId },
    });

    if (scheduled) {
      const emails = await notifyUsers(tx, [listing.providerProfile.userId], order, 'Order baru masuk',
        `Ada order terjadwal baru untuk "${listing.title}". Terima atau tolak sebelum ${formatWita(responseDeadlineAt)}.`);
      afterCommit(() => void dispatchNotifications(emails));
      return order.id;
    }

    // D102: daftar penerima di transaksi yang sama dengan order.
    await tx.orderOffer.createMany({
      data: recipients.map((w) => ({ orderId: order.id, workerId: w.id, distanceMeters: Math.round(w.km * 1000) })),
    });
    // D59: Socket.IO kanal utama, email pelengkap.
    const emails = await notifyUsers(tx, recipients.map((w) => w.userId), order, 'Tawaran order sekarang',
      `Ada order mendadak untuk "${listing.title}". Ambil sebelum ${formatWita(responseDeadlineAt)}.`);
    const summary = {
      order_id: order.id,
      order_number: order.orderNumber,
      listing_title: listing.title,
      service_address: location.address,
      total_amount: amounts.totalAmount.toNumber(),
      response_deadline_at: responseDeadlineAt.toISOString(),
    };
    afterCommit(() => {
      for (const w of recipients) emit(`user:${w.userId}`, 'order:offer', { ...summary, distance_meters: Math.round(w.km * 1000) });
      emit(`provider:${listing.providerProfileId}`, 'order:offer', { ...summary, recipient_count: recipients.length });
    });
    afterCommit(() => void dispatchNotifications(emails));
    return order.id;
  });

  return getOrder(orderId);
}

export async function getOrder(orderId: string): Promise<OrderDto> {
  const [row, reviewWindowDays] = await Promise.all([
    prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_INCLUDE }),
    getNumberSetting('review_window_days'),
  ]);
  return toOrderDto(row, reviewWindowDays);
}

/** GET /orders sesuai peran. Pekerja melihat order sebagai penanggung jawab ATAU pendamping (PRD 5.2). */
export async function listOrders(userId: string, query: ListOrdersQuery): Promise<Paginated<OrderDto>> {
  let where: Prisma.OrderWhereInput;
  if (query.as === 'provider') {
    where = { providerProfileId: (await resolveProvider(userId)).id };
  } else if (query.as === 'worker') {
    const worker = await resolveWorker(userId);
    where = {
      OR: [
        { assignedWorkerId: worker.id },
        { crew: { some: { workerId: worker.id } } },
        // Tawaran Available Now yang masih terbuka untuknya (PRD 4.3 /workers/me/orders).
        { status: 'PENDING_ACCEPTANCE', offers: { some: { workerId: worker.id, declinedAt: null } } },
      ],
    };
  } else {
    where = { clientId: userId };
  }
  if (query.status) where = { AND: [where, { status: query.status }] };

  const [[rows, total], reviewWindowDays] = await Promise.all([
    prisma.$transaction([
      prisma.order.findMany({ where, include: ORDER_INCLUDE, orderBy: { createdAt: 'desc' }, ...skipTake(query) }),
      prisma.order.count({ where }),
    ]),
    getNumberSetting('review_window_days'),
  ]);
  return { items: rows.map((row) => toOrderDto(row, reviewWindowDays)), meta: pageMeta(query, total) };
}

export async function getOrderHistory(orderId: string) {
  const rows = await prisma.orderStatusHistory.findMany({ where: { orderId }, orderBy: { id: 'asc' } });
  return rows.map(toHistoryDto);
}
