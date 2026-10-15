/**
 * Skema Zod modul pekerja.
 */

import { z } from 'zod';

const listingIds = z
  .array(z.string().uuid('listing_ids berisi id listing yang tidak sah'))
  .max(50, 'Paling banyak 50 listing')
  // Duplikat dibuang, bukan ditolak. Unique (worker_id, listing_id) H32
  // tetap penjaga di basis data.
  .transform((ids) => [...new Set(ids)]);

const latitude = z.number({ required_error: 'latitude wajib diisi' }).min(-90).max(90);
const longitude = z.number({ required_error: 'longitude wajib diisi' }).min(-180).max(180);

export const workerParamsSchema = z.object({
  id: z.string().uuid('id pekerja tidak sah'),
});

/**
 * POST /providers/:id/worker-applications. Pelamar WAJIB mencentang minimal
 * satu listing aktif milik usaha itu (D52). Pilihannya usulan, pemilik yang
 * mengesahkan saat menyetujui.
 */
export const workerApplicationSchema = z.object({
  listing_ids: listingIds.refine((ids) => ids.length > 0, 'Pilih minimal satu listing'),
  experience_note: z.string().trim().min(1).max(2000).optional(),
  display_name: z.string().trim().min(2).max(100).optional(),
});

/**
 * POST /providers/me/workers/:id/approve. `listing_ids` adalah pemetaan
 * FINAL (D52). Kalau tidak dikirim, usulan pelamar dipakai apa adanya.
 * Boleh kosong: pekerja yang hanya jadi pendamping tidak wajib terpetakan
 * (D69).
 */
export const approveWorkerSchema = z.object({
  listing_ids: listingIds.optional(),
});

export const rejectWorkerSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});

export const assignmentsSettingSchema = z.object({
  accepts_assignments: z.boolean({ required_error: 'accepts_assignments wajib diisi' }),
});

export const listWorkersQuerySchema = z.object({
  membership_status: z.enum(['PENDING', 'ACTIVE', 'REJECTED', 'RESIGNED']).optional(),
});

/**
 * PATCH /workers/me/availability. Menyalakan toggle WAJIB menyertakan
 * koordinat (PRD 4.3): pencocokan Available Now memilih pekerja terdekat,
 * jadi pekerja online tanpa posisi tidak bisa dicocokkan. Mematikan toggle
 * tidak butuh koordinat.
 */
export const availabilitySchema = z
  .object({
    is_available: z.boolean({ required_error: 'is_available wajib diisi' }),
    latitude: latitude.optional(),
    longitude: longitude.optional(),
  })
  .refine((body) => (body.latitude === undefined) === (body.longitude === undefined), {
    message: 'latitude dan longitude harus dikirim berpasangan',
    path: ['longitude'],
  })
  .refine((body) => !body.is_available || body.latitude !== undefined, {
    message: 'Koordinat wajib disertakan saat menyalakan ketersediaan',
    path: ['latitude'],
  });

export const locationSchema = z.object({ latitude, longitude });

export type WorkerApplicationBody = z.infer<typeof workerApplicationSchema>;
export type ApproveWorkerBody = z.infer<typeof approveWorkerSchema>;
export type AvailabilityBody = z.infer<typeof availabilitySchema>;
export type LocationBody = z.infer<typeof locationSchema>;
