/**
 * Skema Zod modul listing (PRD 4.3, Listing, harga opsi, dan FAQ).
 *
 * Uang integer rupiah (PRD 4.1). Batas atas mengikuti Decimal(12, 2).
 */

import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination';

const MAX_PRICE = 9_999_999_999;

const price = z.number().int('harus bilangan bulat rupiah').min(1).max(MAX_PRICE);
/** D90 / H85. Satu batas umum, bukan per sub-kategori (H87). */
const duration = z.number().int('harus bilangan bulat menit').min(15).max(720);
const uuid = (label: string) => z.string().uuid(`${label} tidak sah`);

const listingFields = {
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().max(5000).nullable().optional(),
  price,
  price_unit: z.enum(['PER_JOB', 'PER_HOUR', 'PER_UNIT']).optional(),
  estimated_duration_minutes: duration,
  /** Hanya nilai SPEC, divalidasi terhadap definisi di service. */
  attributes: z.record(z.unknown()),
  supports_scheduled: z.boolean().optional(),
  supports_available_now: z.boolean().optional(),
};

/** Usulan D baru: listing tanpa satu pun mode pemesanan tidak bisa dipesan. */
export const atLeastOneMode = (body: { supports_scheduled?: boolean; supports_available_now?: boolean }) =>
  body.supports_scheduled !== false || body.supports_available_now === true;
export const MODE_MESSAGE = 'Minimal satu mode pemesanan harus didukung';

export const listingParamsSchema = z.object({ id: uuid('id listing') });
export const photoParamsSchema = z.object({ id: uuid('id listing'), photoId: uuid('id foto') });

export const createListingSchema = z
  .object({ subcategory_id: uuid('subcategory_id'), ...listingFields })
  .refine(atLeastOneMode, { message: MODE_MESSAGE, path: ['supports_scheduled'] });

/**
 * `attributes` mengganti seluruh objek, bukan digabung. `subcategory_id`
 * tidak bisa diubah: atribut dan harga opsi terikat sub-kategorinya. Mode
 * pemesanan diperiksa terhadap nilai akhir di service, karena body PATCH
 * bisa hanya memuat salah satunya.
 */
export const updateListingSchema = z
  .object({
    ...listingFields,
    status: z.enum(['ACTIVE', 'INACTIVE']),
  })
  .partial()
  .strict();

export const listMyListingsQuerySchema = z.object({
  ...paginationQuery,
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

/** Hanya opsi yang DICENTANG. Yang tidak dikirim jadi `is_offered = false`. */
export const optionPricesSchema = z.object({
  options: z
    .array(
      z.object({
        attribute_key: z.string().min(1).max(50),
        /** null untuk BOOLEAN dan NUMBER (PER_UNIT). */
        option_value: z.string().min(1).max(100).nullable(),
        price_delta: z.number().int('harus bilangan bulat rupiah').min(0).max(MAX_PRICE),
      }),
    )
    .max(200),
});

export const listingWorkersSchema = z.object({
  worker_ids: z
    .array(uuid('worker_ids berisi id'))
    .max(100)
    .transform((ids) => [...new Set(ids)]),
});

export const photoSchema = z.object({
  file_url: z.string().url('file_url harus URL'),
  caption: z.string().trim().min(1).max(150).optional(),
});

/** Jumlah butir dibatasi `listing_faq_max_items` di service (H73). */
export const faqsSchema = z.object({
  faqs: z
    .array(
      z.object({
        question: z.string().trim().min(1).max(200),
        answer: z.string().trim().min(1).max(2000),
      }),
    )
    .max(100),
});

export type CreateListingBody = z.infer<typeof createListingSchema>;
export type UpdateListingBody = z.infer<typeof updateListingSchema>;
export type ListMyListingsQuery = z.infer<typeof listMyListingsQuerySchema>;
export type OptionPricesBody = z.infer<typeof optionPricesSchema>;
export type PhotoBody = z.infer<typeof photoSchema>;
export type FaqsBody = z.infer<typeof faqsSchema>;
