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
import { resolveProvider, resolveWorker } from '../access/access.service';
import { toDefinition } from '../catalog/catalog.mapper';
import { PUBLIC_WHERE } from '../listings/listings.service';
import { dispatchEmails } from '../notifications/email-outbox';
import { getNumberSetting } from '../settings/settings.service';
import { notifyUsers } from './order-notify';
import { orderAmounts, priceOptions } from './order-pricing';
import { withOrderTransaction } from './order-transition.service';
import { ORDER_INCLUDE, toHistoryDto, toOrderDto, type OrderDto } from './orders.mapper';
import type { CreateOrderBody, ListOrdersQuery } from './orders.schema';

const HOUR = 3_600_000;
const MINUTE = 60_000;

const notAvailable = (message: string) => new AppError('LISTING_NOT_AVAILABLE', message);

/**
 * ORD-20261107-9F2A0C1B. Acak, bukan urutan harian: urutan butuh kunci atau sequence.
 * shortcut: tabrakan dibalas 500 oleh unique index, upgrade ke retry atau sequence kalau order per hari ribuan.
 */
function newOrderNumber(now: Date): string {
  return `ORD-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

async function serviceLocation(userId: string, body: CreateOrderBody) {
  if (body.location_source !== 'SAVED_ADDRESS') {
    return { address: body.service_address!, lat: body.service_latitude!, lng: body.service_longitude! };
  }
  const address = await prisma.userAddress.findFirst({ where: { id: body.address_id!, userId } });
  if (!address) throw Errors.notFound('Alamat tidak ditemukan');
  return { address: address.addressLine, lat: address.latitude.toNumber(), lng: address.longitude.toNumber() };
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

  if (!listing.supportsScheduled) throw notAvailable('Listing ini tidak menerima pemesanan terjadwal');

  // D106 no. 4: lokasi layanan di dalam radius usaha, sama dengan filter pencarian (D98).
  const location = await serviceLocation(userId, body);
  const { baseLatitude, baseLongitude, serviceRadiusKm } = listing.providerProfile;
  if (
    !baseLatitude || !baseLongitude || !serviceRadiusKm ||
    haversineKm(location.lat, location.lng, baseLatitude.toNumber(), baseLongitude.toNumber()) > serviceRadiusKm.toNumber()
  ) {
    throw notAvailable('Lokasi layanan di luar jangkauan penyedia ini');
  }

  // D106 no. 2: diterima dan dibayar sebelum jadwalnya tiba.
  const [approvalHours, paymentWindow, feePercentage] = await Promise.all([
    getNumberSetting('scheduled_approval_hours'),
    getNumberSetting('payment_window_minutes'),
    getNumberSetting('platform_fee_percentage'),
  ]);
  const now = new Date();
  const scheduledAt = new Date(body.scheduled_at);
  const latestResponse = new Date(scheduledAt.getTime() - paymentWindow * MINUTE);
  if (latestResponse <= now) {
    throw Errors.validation([
      { path: 'scheduled_at', message: `scheduled_at minimal ${paymentWindow} menit dari sekarang supaya sempat dibayar` },
    ]);
  }
  const responseDeadlineAt = new Date(Math.min(now.getTime() + approvalHours * HOUR, latestResponse.getTime()));

  const defs = listing.subcategory.attributes.map((row) => ({ ...toDefinition(row), label: row.label }));
  const priced = priceOptions(defs, listing.optionPrices, body.selected_options);
  const durationMinutes = priced.optionDurationMinutes ?? listing.estimatedDurationMinutes;
  if (!durationMinutes) throw notAvailable('Listing belum punya durasi pekerjaan');
  const amounts = orderAmounts(listing.price, priced.optionsAmount, feePercentage);

  const orderId = await withOrderTransaction(async (tx, afterCommit) => {
    const order = await tx.order.create({
      data: {
        orderNumber: newOrderNumber(now),
        clientId: userId,
        providerProfileId: listing.providerProfileId,
        listingId: listing.id,
        bookingMode: 'SCHEDULED',
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
    const emails = await notifyUsers(tx, [listing.providerProfile.userId], order, 'Order baru masuk',
      `Ada order terjadwal baru untuk "${listing.title}". Terima atau tolak sebelum ${responseDeadlineAt.toISOString()}.`);
    afterCommit(() => void dispatchEmails(emails));
    return order.id;
  });

  return getOrder(orderId);
}

export async function getOrder(orderId: string): Promise<OrderDto> {
  return toOrderDto(await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_INCLUDE }));
}

/** GET /orders sesuai peran. Pekerja melihat order sebagai penanggung jawab ATAU pendamping (PRD 5.2). */
export async function listOrders(userId: string, query: ListOrdersQuery): Promise<Paginated<OrderDto>> {
  let where: Prisma.OrderWhereInput;
  if (query.as === 'provider') {
    where = { providerProfileId: (await resolveProvider(userId)).id };
  } else if (query.as === 'worker') {
    const worker = await resolveWorker(userId);
    where = { OR: [{ assignedWorkerId: worker.id }, { crew: { some: { workerId: worker.id } } }] };
  } else {
    where = { clientId: userId };
  }
  if (query.status) where = { AND: [where, { status: query.status }] };

  const [rows, total] = await prisma.$transaction([
    prisma.order.findMany({ where, include: ORDER_INCLUDE, orderBy: { createdAt: 'desc' }, ...skipTake(query) }),
    prisma.order.count({ where }),
  ]);
  return { items: rows.map(toOrderDto), meta: pageMeta(query, total) };
}

export async function getOrderHistory(orderId: string) {
  const rows = await prisma.orderStatusHistory.findMany({ where: { orderId }, orderBy: { id: 'asc' } });
  return rows.map(toHistoryDto);
}
