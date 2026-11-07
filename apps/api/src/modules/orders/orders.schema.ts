/**
 * Skema Zod modul order (PRD 4.3 Order, 4.4 POST /orders dan accept).
 *
 * Body TIDAK memuat nominal apa pun (jebakan 4). Key yang tidak dikenal,
 * termasuk `total_amount`, dibuang Zod dan tidak pernah sampai ke service.
 */

import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination';

const uuid = (label: string) => z.string().uuid(`${label} tidak sah`);
const uniqueIds = (label: string) =>
  z.array(uuid(label)).max(50).refine((ids) => new Set(ids).size === ids.length, `${label} tidak boleh kembar`);

export const orderParamsSchema = z.object({ id: uuid('id order') });

export const createOrderSchema = z
  .object({
    listing_id: uuid('listing_id'),
    booking_mode: z.enum(['SCHEDULED', 'AVAILABLE_NOW']),
    /** Wajib untuk SCHEDULED, dilarang untuk AVAILABLE_NOW (berarti sekarang). */
    scheduled_at: z.string().datetime({ offset: true, message: 'scheduled_at harus ISO 8601' }).optional(),
    location_source: z.enum(['SAVED_ADDRESS', 'CURRENT_LOCATION', 'MAP_PIN']),
    address_id: uuid('address_id').optional(),
    service_address: z.string().trim().min(1).max(500).optional(),
    service_latitude: z.number().min(-90).max(90).optional(),
    service_longitude: z.number().min(-180).max(180).optional(),
    location_accuracy_m: z.number().min(0).max(999_999).nullable().optional(),
    service_notes: z.string().trim().max(1000).nullable().optional(),
    selected_options: z.record(z.unknown()).default({}),
  })
  .superRefine((body, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    if (body.booking_mode === 'SCHEDULED' && !body.scheduled_at) issue('scheduled_at', 'scheduled_at wajib untuk SCHEDULED');
    if (body.booking_mode === 'AVAILABLE_NOW' && body.scheduled_at) issue('scheduled_at', 'AVAILABLE_NOW tidak memakai scheduled_at');
    if (body.location_source === 'SAVED_ADDRESS') {
      if (!body.address_id) issue('address_id', 'address_id wajib untuk SAVED_ADDRESS');
    } else {
      if (!body.service_address) issue('service_address', 'service_address wajib di luar SAVED_ADDRESS');
      if (body.service_latitude === undefined) issue('service_latitude', 'service_latitude wajib di luar SAVED_ADDRESS');
      if (body.service_longitude === undefined) issue('service_longitude', 'service_longitude wajib di luar SAVED_ADDRESS');
    }
    // Sama dengan chk_order_location_accuracy.
    if (body.location_source !== 'CURRENT_LOCATION' && body.location_accuracy_m != null) {
      issue('location_accuracy_m', 'location_accuracy_m hanya untuk CURRENT_LOCATION');
    }
  });

/**
 * SCHEDULED: pemilik wajib memilih penanggung jawab. AVAILABLE_NOW: kosong berarti
 * pekerja yang ditawari mengklaim untuk dirinya sendiri; terisi berarti pemilik
 * memilih dari daftar penerima tawaran (D70, D102).
 */
export const acceptOrderSchema = z.object({
  assigned_worker_id: uuid('assigned_worker_id').optional(),
  crew_worker_ids: uniqueIds('crew_worker_ids').default([]),
});

export const reasonSchema = z.object({ reason: z.string().trim().min(1).max(500).optional() });

export const assignmentSchema = z.object({ assigned_worker_id: uuid('assigned_worker_id') });

export const crewSchema = z.object({ crew_worker_ids: uniqueIds('crew_worker_ids') });

/** H92, hanya di router /dev. */
export const devPresenceSchema = z.object({ worker_ids: z.array(uuid('worker_ids berisi id')).min(1).max(20_000) });

export const listOrdersQuerySchema = z.object({
  as: z.enum(['client', 'provider', 'worker']).default('client'),
  status: z
    .enum([
      'PENDING_ACCEPTANCE', 'ACCEPTED', 'PAID', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_VERIFICATION',
      'COMPLETED', 'SETTLED', 'REJECTED', 'EXPIRED', 'PAYMENT_EXPIRED', 'CANCELLED', 'DISPUTED', 'REFUNDED',
    ])
    .optional(),
  ...paginationQuery,
});

export type CreateOrderBody = z.infer<typeof createOrderSchema>;
export type AcceptOrderBody = z.infer<typeof acceptOrderSchema>;
export type ReasonBody = z.infer<typeof reasonSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
