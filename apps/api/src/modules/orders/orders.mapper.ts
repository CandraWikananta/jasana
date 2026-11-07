/**
 * Bentuk JSON order. Uang integer rupiah, waktu ISO 8601 UTC (PRD 4.1).
 * `verification_code_encrypted` tidak pernah ikut (D60).
 */

import type { OrderStatusHistory, Prisma } from '@jasana/database';
import type { PricedLine } from './order-pricing';

export const ORDER_INCLUDE = {
  providerProfile: { select: { id: true, businessName: true } },
  crew: { select: { worker: { select: { id: true, displayName: true } } }, orderBy: { createdAt: 'asc' } },
  payments: {
    select: { status: true, amount: true, invoiceUrl: true, expiresAt: true, paidAt: true },
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
} as const satisfies Prisma.OrderInclude;

export type OrderRow = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

const iso = (date: Date | null) => date?.toISOString() ?? null;
const rupiah = (value: Prisma.Decimal) => value.toNumber();

export function toOrderDto(row: OrderRow) {
  const payment = row.payments[0];
  return {
    id: row.id,
    order_number: row.orderNumber,
    status: row.status,
    booking_mode: row.bookingMode,
    scheduled_at: iso(row.scheduledAt),
    client_id: row.clientId,
    provider: { id: row.providerProfile.id, business_name: row.providerProfile.businessName },
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
    payment: payment
      ? {
          status: payment.status,
          amount: rupiah(payment.amount),
          invoice_url: payment.invoiceUrl,
          expires_at: iso(payment.expiresAt),
          paid_at: iso(payment.paidAt),
        }
      : null,
    accepted_at: iso(row.acceptedAt),
    paid_at: iso(row.paidAt),
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
