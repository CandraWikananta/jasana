/**
 * Skema Zod modul listing (PRD 4.3, Listing, harga opsi, dan FAQ).
 *
 * Uang integer rupiah (PRD 4.1). Batas atas mengikuti Decimal(12, 2).
 */

import { z } from 'zod';
import { paginationQuery, queryNumber } from '../../lib/pagination';

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

/**
 * GET /listings (PRD 4.3). `lat` dan `lng` berpasangan, `radius_km` opsional
 * dan hanya sah kalau ada lokasi (D98). `attr[key]` divalidasi terhadap
 * definisi sub-kategori di service, karena itu wajib `subcategory_id`
 * (usulan D baru).
 */
export const SEARCH_SORTS = ['distance', 'price_asc', 'price_desc', 'rating', 'popular'] as const;

const coordinate = (max: number) => queryNumber(z.coerce.number().min(-max).max(max).optional());
const queryPrice = queryNumber(z.coerce.number().int('harus bilangan bulat rupiah').min(0).max(MAX_PRICE).optional());

export const searchListingsQuerySchema = z
  .object({
    ...paginationQuery,
    q: z.string().trim().min(1).max(100).optional(),
    category_id: uuid('category_id').optional(),
    subcategory_id: uuid('subcategory_id').optional(),
    lat: coordinate(90),
    lng: coordinate(180),
    radius_km: queryNumber(z.coerce.number().positive('radius_km harus lebih dari nol').max(999.99).optional()),
    available_now: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
    booking_mode: z.enum(['SCHEDULED', 'AVAILABLE_NOW']).optional(),
    price_min: queryPrice,
    price_max: queryPrice,
    attr: z.record(z.string()).optional(),
    sort: z.enum(SEARCH_SORTS).optional(),
  })
  .superRefine((query, ctx) => {
    const fail = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message });
    const located = query.lat !== undefined && query.lng !== undefined;
    if ((query.lat === undefined) !== (query.lng === undefined)) fail('lat', 'lat dan lng wajib diisi berpasangan');
    if (query.radius_km !== undefined && !located) fail('radius_km', 'radius_km hanya sah bersama lat dan lng');
    if (query.sort === 'distance' && !located) fail('sort', 'sort=distance butuh lat dan lng');
    if (query.price_min !== undefined && query.price_max !== undefined && query.price_min > query.price_max) {
      fail('price_min', 'price_min tidak boleh melebihi price_max');
    }
    if (query.attr && Object.keys(query.attr).length > 0 && !query.subcategory_id) {
      fail('attr', 'Filter atribut butuh subcategory_id');
    }
  });

export type SearchListingsQuery = z.infer<typeof searchListingsQuerySchema>;
export type CreateListingBody = z.infer<typeof createListingSchema>;
export type UpdateListingBody = z.infer<typeof updateListingSchema>;
export type ListMyListingsQuery = z.infer<typeof listMyListingsQuerySchema>;
export type OptionPricesBody = z.infer<typeof optionPricesSchema>;
export type PhotoBody = z.infer<typeof photoSchema>;
export type FaqsBody = z.infer<typeof faqsSchema>;
