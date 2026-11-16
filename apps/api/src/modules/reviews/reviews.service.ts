/**
 * Review (D179, sesi 10b).
 *
 *   Buat     hanya client pemilik order, order pernah COMPLETED (completed_at terisi, termasuk yang
 *            kemudian disengketakan), paling lambat review_window_days sejak completed_at, satu per order
 *   Balasan  hanya penyedia pemilik review, sekali (UPDATE bersyarat provider_reply IS NULL)
 *   Admin    sembunyikan atau tampilkan lagi lewat is_visible
 *   Cache    rating_average dan rating_count listing serta penyedia dihitung ulang dari review yang
 *            tampil, di transaksi yang sama, SETELAH baris keduanya dikunci (lihat lockRatingRows)
 *   Notif    in-app saja: review baru ke pemilik penyedia, balasan ke client
 */

import { Prisma, prisma } from '@jasana/database';
import { AppError, Errors } from '../../lib/errors';
import { pageMeta, skipTake, type Paginated } from '../../lib/pagination';
import { isUniqueViolation } from '../../lib/prisma-errors';
import { actorFrom, type OrderAccess, type ProviderContext } from '../access/access.service';
import { PUBLIC_WHERE } from '../listings/listings.service';
import { dispatchNotifications, recordNotification } from '../notifications/email-outbox';
import { withOrderTransaction } from '../orders/order-transition.service';
import { getNumberSetting } from '../settings/settings.service';
import { PUBLIC_REVIEW_ORDER, PUBLIC_REVIEW_SELECT, toPublicReviewDto, type PublicReviewDto } from './reviews.mapper';
import type { AdminReviewsQuery, CreateReviewBody, ListReviewsQuery } from './reviews.schema';

type Tx = Prisma.TransactionClient;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Urutan kunci seragam di seluruh kode: provider_profiles lalu listings (sama dengan
 * lockProviderProfile di listings.service dan T16). FOR NO KEY UPDATE, kunci yang sama dengan
 * UPDATE biasa: penulis cache berjalan bergiliran, tetapi insert ber-FK (order, review,
 * worker_listings) yang hanya mengambil KEY SHARE tidak tertahan.
 *
 * Tanpa kunci ini, dua review bersamaan masing-masing menghitung tanpa review lawannya
 * (READ COMMITTED), dan cache berakhir dengan hitungan kurang satu.
 */
async function lockRatingRows(tx: Tx, providerProfileId: string, listingId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM provider_profiles WHERE id = ${providerProfileId}::uuid FOR NO KEY UPDATE`;
  await tx.$queryRaw`SELECT id FROM listings WHERE id = ${listingId}::uuid FOR NO KEY UPDATE`;
}

/** Dihitung ulang dari baris review, bukan ditambah-kurangi, supaya tidak ada galat pembulatan menumpuk. */
async function refreshRatingCache(tx: Tx, providerProfileId: string, listingId: string): Promise<void> {
  const cache = async (where: Prisma.ReviewWhereInput) => {
    const s = await tx.review.aggregate({ where: { ...where, isVisible: true }, _avg: { rating: true }, _count: { _all: true } });
    return { ratingAverage: new Prisma.Decimal((s._avg.rating ?? 0).toFixed(2)), ratingCount: s._count._all };
  };
  await tx.providerProfile.update({ where: { id: providerProfileId }, data: await cache({ providerProfileId }) });
  await tx.listing.update({ where: { id: listingId }, data: await cache({ listingId }) });
}

export interface ReviewDto extends PublicReviewDto {
  order_id: string;
  listing_id: string;
  provider_profile_id: string;
  is_visible: boolean;
}

const OWN_SELECT = {
  ...PUBLIC_REVIEW_SELECT, orderId: true, listingId: true, providerProfileId: true, isVisible: true,
} satisfies Prisma.ReviewSelect;

const toReviewDto = (r: Prisma.ReviewGetPayload<{ select: typeof OWN_SELECT }>): ReviewDto => ({
  ...toPublicReviewDto(r),
  order_id: r.orderId,
  listing_id: r.listingId,
  provider_profile_id: r.providerProfileId,
  is_visible: r.isVisible,
});

const alreadyExists = () => new AppError('REVIEW_ALREADY_EXISTS', 'Order ini sudah diberi ulasan, dan ulasan tidak bisa diubah');

export async function createReview(access: OrderAccess, body: CreateReviewBody): Promise<ReviewDto> {
  actorFrom(access, ['CLIENT']);
  const windowDays = await getNumberSetting('review_window_days');

  return withOrderTransaction(async (tx, afterCommit) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: access.orderId },
      select: {
        id: true, orderNumber: true, clientId: true, listingId: true, providerProfileId: true, completedAt: true,
        snapshotListingTitle: true, providerProfile: { select: { userId: true } },
      },
    });
    if (!order.completedAt) throw new AppError('REVIEW_NOT_ALLOWED', 'Ulasan hanya bisa diberikan setelah order selesai');
    if (Date.now() > order.completedAt.getTime() + windowDays * DAY_MS) {
      throw new AppError('REVIEW_WINDOW_CLOSED', `Batas memberi ulasan ${windowDays} hari sejak order selesai sudah lewat`);
    }

    await lockRatingRows(tx, order.providerProfileId, order.listingId);
    // Satu per order dijaga unique index reviews.order_id, P2002 diterjemahkan jadi 409.
    const review = await tx.review
      .create({
        data: {
          orderId: order.id, clientId: order.clientId, listingId: order.listingId, providerProfileId: order.providerProfileId,
          rating: body.rating, comment: body.comment ?? null,
        },
        select: OWN_SELECT,
      })
      .catch((error: unknown) => {
        throw isUniqueViolation(error, 'order_id') || isUniqueViolation(error, 'orderId') ? alreadyExists() : error;
      });
    await refreshRatingCache(tx, order.providerProfileId, order.listingId);

    const outgoing = await recordNotification(tx, {
      userId: order.providerProfile.userId,
      type: 'REVIEW',
      title: `Ulasan baru (${order.orderNumber})`,
      body: `Client memberi rating ${body.rating} untuk "${order.snapshotListingTitle}".`,
      referenceType: 'review',
      referenceId: review.id,
    });
    afterCommit(() => void dispatchNotifications(outgoing));
    return toReviewDto(review);
  });
}

/** GET /listings/:id/reviews. Listing yang tidak tayang dibalas 404 seperti detailnya. */
export async function listListingReviews(listingId: string, query: ListReviewsQuery): Promise<Paginated<PublicReviewDto>> {
  const listing = await prisma.listing.findFirst({ where: { id: listingId, ...PUBLIC_WHERE }, select: { id: true } });
  if (!listing) throw Errors.notFound('Listing tidak ditemukan');
  const where = { listingId, isVisible: true };
  const [rows, total] = await prisma.$transaction([
    prisma.review.findMany({ where, orderBy: PUBLIC_REVIEW_ORDER, select: PUBLIC_REVIEW_SELECT, ...skipTake(query) }),
    prisma.review.count({ where }),
  ]);
  return { items: rows.map(toPublicReviewDto), meta: pageMeta(query, total) };
}

export async function replyToReview(provider: ProviderContext, reviewId: string, reply: string): Promise<ReviewDto> {
  return withOrderTransaction(async (tx, afterCommit) => {
    // Milik penyedia lain dibalas 404 yang sama, supaya keberadaannya tidak bocor.
    const review = await tx.review.findFirst({
      where: { id: reviewId, providerProfileId: provider.id },
      select: { clientId: true, order: { select: { orderNumber: true } } },
    });
    if (!review) throw Errors.notFound('Ulasan tidak ditemukan');
    const { count } = await tx.review.updateMany({
      where: { id: reviewId, providerReply: null },
      data: { providerReply: reply, providerRepliedAt: new Date() },
    });
    if (count === 0) throw new AppError('REVIEW_ALREADY_REPLIED', 'Ulasan ini sudah dibalas, dan balasan hanya sekali');

    const outgoing = await recordNotification(tx, {
      userId: review.clientId,
      type: 'REVIEW',
      title: `Balasan ulasan (${review.order.orderNumber})`,
      body: 'Penyedia membalas ulasan Anda.',
      referenceType: 'review',
      referenceId: reviewId,
    });
    afterCommit(() => void dispatchNotifications(outgoing));
    return toReviewDto(await tx.review.findUniqueOrThrow({ where: { id: reviewId }, select: OWN_SELECT }));
  });
}

export interface AdminReviewDto extends ReviewDto {
  order_number: string;
  listing_title: string;
  client_id: string;
  client_name: string;
}

const ADMIN_SELECT = {
  ...OWN_SELECT, clientId: true, order: { select: { orderNumber: true } }, listing: { select: { title: true } },
} satisfies Prisma.ReviewSelect;

const toAdminDto = (r: Prisma.ReviewGetPayload<{ select: typeof ADMIN_SELECT }>): AdminReviewDto => ({
  ...toReviewDto(r),
  order_number: r.order.orderNumber,
  listing_title: r.listing.title,
  client_id: r.clientId,
  client_name: r.client.fullName,
});

export async function listReviewsForAdmin(query: AdminReviewsQuery): Promise<Paginated<AdminReviewDto>> {
  const where: Prisma.ReviewWhereInput = {
    ...(query.is_visible === undefined ? {} : { isVisible: query.is_visible }),
    ...(query.listing_id ? { listingId: query.listing_id } : {}),
  };
  const [rows, total] = await prisma.$transaction([
    prisma.review.findMany({ where, orderBy: PUBLIC_REVIEW_ORDER, select: ADMIN_SELECT, ...skipTake(query) }),
    prisma.review.count({ where }),
  ]);
  return { items: rows.map(toAdminDto), meta: pageMeta(query, total) };
}

/** Idempoten: nilai yang sama dibalas 200 tanpa perubahan. Cache dihitung ulang di transaksi yang sama. */
export async function setReviewVisibility(reviewId: string, isVisible: boolean): Promise<AdminReviewDto> {
  return prisma.$transaction(async (tx) => {
    const found = await tx.review.findUnique({ where: { id: reviewId }, select: { providerProfileId: true, listingId: true } });
    if (!found) throw Errors.notFound('Ulasan tidak ditemukan');
    await lockRatingRows(tx, found.providerProfileId, found.listingId);
    const { count } = await tx.review.updateMany({ where: { id: reviewId, isVisible: !isVisible }, data: { isVisible } });
    if (count > 0) await refreshRatingCache(tx, found.providerProfileId, found.listingId);
    return toAdminDto(await tx.review.findUniqueOrThrow({ where: { id: reviewId }, select: ADMIN_SELECT }));
  });
}
