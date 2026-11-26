/**
 * Bentuk JSON order. Uang integer rupiah, waktu ISO 8601 UTC (PRD 4.1).
 * `verification_code_encrypted` tidak pernah ikut (D60).
 */

import type { OrderStatusHistory, Prisma } from '@jasana/database';
import type { PricedLine } from './order-pricing';

/** State Machine 7: Scheduled boleh berangkat 60 menit sebelum jadwal. Dipakai guard T11 dan `depart_available_at` (H131). */
export const DEPART_EARLY_MINUTES = 60;

export const PAYMENT_SELECT = { status: true, amount: true, invoiceUrl: true, expiresAt: true, paidAt: true } as const satisfies Prisma.PaymentSelect;

export const ORDER_INCLUDE = {
  providerProfile: { select: { id: true, businessName: true, providerType: true } },
  crew: { select: { worker: { select: { id: true, displayName: true } } }, orderBy: { createdAt: 'asc' } },
  payments: { select: PAYMENT_SELECT, orderBy: { createdAt: 'desc' }, take: 1 },
  dispute: { select: { id: true, status: true } },
  review: { select: { id: true } },
} as const satisfies Prisma.OrderInclude;

export type OrderRow = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

const iso = (date: Date | null) => date?.toISOString() ?? null;
const rupiah = (value: Prisma.Decimal) => value.toNumber();
const shift = (date: Date | null, ms: number) => (date ? new Date(date.getTime() + ms).toISOString() : null);
const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export function toPaymentDto(payment: Prisma.PaymentGetPayload<{ select: typeof PAYMENT_SELECT }>) {
  return {
    status: payment.status,
    amount: rupiah(payment.amount),
    invoice_url: payment.invoiceUrl,
    expires_at: iso(payment.expiresAt),
    paid_at: iso(payment.paidAt),
  };
}

/** `reviewWindowDays` dari platform_settings `review_window_days`, dibaca sekali per request oleh pemanggil (H131). */
export function toOrderDto(row: OrderRow, reviewWindowDays: number) {
  const payment = row.payments[0];
  return {
    id: row.id,
    order_number: row.orderNumber,
    status: row.status,
    booking_mode: row.bookingMode,
    scheduled_at: iso(row.scheduledAt),
    // Null untuk AVAILABLE_NOW: tidak ada batas berangkat (State Machine 7).
    depart_available_at: shift(row.scheduledAt, -DEPART_EARLY_MINUTES * MINUTE_MS),
    client_id: row.clientId,
    provider: { id: row.providerProfile.id, business_name: row.providerProfile.businessName, provider_type: row.providerProfile.providerType },
    listing: { id: row.listingId, title: row.snapshotListingTitle },
    assigned_worker: row.assignedWorkerId ? { id: row.assignedWorkerId, name: row.snapshotAssigneeName } : null,
    crew: row.crew.map(({ worker }) => ({ id: worker.id, display_name: worker.displayName })),
    service: {
      address: row.serviceAddress,
      latitude: row.serviceLatitude.toNumber(),
      longitude: row.serviceLongitude.toNumber(),
      notes: row.serviceNotes,
      location_source: row.locationSource,
      location_accuracy_m: row.locationAccuracyM?.toNumber() ?? null,
    },
    duration_minutes: row.snapshotDurationMinutes,
    attributes: row.snapshotAttributes ?? {},
    price: {
      listing_base_amount: rupiah(row.listingBaseAmount),
      options: (row.snapshotSelectedOptions as unknown as PricedLine[] | null) ?? [],
      options_amount: rupiah(row.optionsAmount),
      total_amount: rupiah(row.totalAmount),
      platform_fee: rupiah(row.platformFee),
      provider_earning: rupiah(row.providerEarning),
    },
    response_deadline_at: iso(row.responseDeadlineAt),
    payment_deadline_at: iso(row.paymentDeadlineAt),
    payment: payment ? toPaymentDto(payment) : null,
    accepted_at: iso(row.acceptedAt),
    paid_at: iso(row.paidAt),
    started_at: iso(row.startedAt),
    completed_at: iso(row.completedAt),
    settlement_due_at: iso(row.settlementDueAt),
    verification_expires_at: iso(row.verificationExpiresAt),
    verification_locked_until: iso(row.verificationLockedUntil),
    dispute: row.dispute ? { id: row.dispute.id, status: row.dispute.status } : null,
    has_review: row.review !== null,
    // Rumus yang sama dengan createReview (reviews.service.ts).
    review_deadline_at: shift(row.completedAt, reviewWindowDays * DAY_MS),
    cancelled_at: iso(row.cancelledAt),
    cancelled_by: row.cancelledBy,
    cancellation_reason: row.cancellationReason,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export type OrderDto = ReturnType<typeof toOrderDto>;

export function toHistoryDto(row: OrderStatusHistory) {
  return {
    id: row.id.toString(),
    from_status: row.fromStatus,
    to_status: row.toStatus,
    actor: row.actor,
    changed_by_user_id: row.changedByUserId,
    reason: row.reason,
    metadata: row.metadata,
    created_at: row.createdAt.toISOString(),
  };
}
