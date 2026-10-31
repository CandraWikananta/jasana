/**
 * Skema Zod usulan taksonomi (D74).
 *
 * H56: validasi BERCABANG per `request_type` lewat discriminatedUnion.
 * Skema datar dengan semua field opsional akan meloloskan NEW_ATTRIBUTE
 * tanpa `subcategory_id`. Field milik cabang lain dibuang Zod, jadi
 * NEW_SUBCATEGORY yang ikut mengirim `attribute_key` tidak menyimpannya.
 */

import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination';
import { durationMinutes, priceRangeMessage, priceRangeOk, subcategoryFields } from '../catalog/catalog.schema';

const id = (name: string) =>
  z.string({ required_error: `${name} wajib diisi` }).uuid(`${name} tidak sah`);
const text = (name: string, max: number) =>
  z.string({ required_error: `${name} wajib diisi` }).trim().min(1, `${name} wajib diisi`).max(max);
const optionalText = (max: number) => z.string().trim().min(1).max(max).optional();
const minutes = z.number().int().min(1).max(10_080).optional();
/** Integer rupiah (PRD 4.1). */
const rupiah = z.number().int().min(0).max(9_999_999_999).optional();

const REQUEST_TYPES = ['NEW_SUBCATEGORY', 'NEW_ATTRIBUTE', 'NEW_ATTRIBUTE_OPTION'] as const;

export const submitRequestSchema = z
  .discriminatedUnion(
    'request_type',
    [
      z.object({
        request_type: z.literal('NEW_SUBCATEGORY'),
        category_id: id('category_id'),
        proposed_name: text('proposed_name', 150),
        work_description: text('work_description', 2000),
        price_factors: optionalText(2000),
        common_questions: optionalText(2000),
        duration_min_minutes: minutes,
        duration_max_minutes: minutes,
        booking_mode_suggestion: z.enum(['SCHEDULED', 'AVAILABLE_NOW', 'BOTH']).optional(),
        market_price_min: rupiah,
        market_price_max: rupiah,
        reason: optionalText(2000),
      }),
      z.object({
        request_type: z.literal('NEW_ATTRIBUTE'),
        subcategory_id: id('subcategory_id'),
        proposed_name: text('proposed_name', 150),
        // Penentu utama diterima atau tidak (D74), karena usulan atribut
        // sering sebenarnya kebutuhan opsi kustom yang menyamar.
        reason: text('reason', 2000),
        proposed_role: z.enum(['SPEC', 'OPTION']).optional(),
        proposed_data_type: z.enum(['TEXT', 'NUMBER', 'BOOLEAN', 'SELECT', 'MULTISELECT', 'DATE']).optional(),
        affects_price: z.boolean().optional(),
        proposed_options: optionalText(2000),
      }),
      z.object({
        request_type: z.literal('NEW_ATTRIBUTE_OPTION'),
        subcategory_id: id('subcategory_id'),
        attribute_key: text('attribute_key', 50),
        // Panjangnya mengikuti listing_option_prices.option_value.
        proposed_name: text('proposed_name', 100),
        reason: optionalText(2000),
      }),
    ],
    {
      errorMap: () => ({ message: `request_type harus salah satu dari ${REQUEST_TYPES.join(', ')}` }),
    },
  )
  .superRefine((body, ctx) => {
    if (body.request_type !== 'NEW_SUBCATEGORY') return;
    const pairs = [
      ['duration_min_minutes', 'duration_max_minutes'],
      ['market_price_min', 'market_price_max'],
    ] as const;
    for (const [low, high] of pairs) {
      const min = body[low];
      const max = body[high];
      if (min !== undefined && max !== undefined && min > max) {
        ctx.addIssue({ code: 'custom', path: [high], message: `${low} tidak boleh melebihi ${high}` });
      }
    }
  });

export const requestParamsSchema = z.object({ id: z.string().uuid('id usulan tidak sah') });

export const mineQuerySchema = z.object(paginationQuery);

export const adminListQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'MERGED']).default('PENDING'),
  request_type: z.enum(REQUEST_TYPES).optional(),
  ...paginationQuery,
});

const adminNote = text('admin_note', 2000);

/**
 * Keputusan admin. Isi `definition` untuk APPROVED bergantung pada jenis
 * usulan yang TERSIMPAN, bukan pada body, jadi diperiksa service dengan
 * skema di bawah setelah usulannya dibaca.
 */
export const decisionSchema = z.discriminatedUnion(
  'decision',
  [
    z.object({
      decision: z.literal('APPROVED'),
      admin_note: optionalText(2000),
      definition: z.record(z.unknown()).default({}),
    }),
    z.object({ decision: z.literal('REJECTED'), admin_note: adminNote }),
    // D74: usulan yang ternyata sudah ada. Provider diberi tautan ke yang
    // sudah ada, bukan sekadar ditolak.
    z.object({ decision: z.literal('MERGED'), admin_note: adminNote, resulting_id: id('resulting_id') }),
  ],
  { errorMap: () => ({ message: 'decision harus APPROVED, REJECTED, atau MERGED' }) },
);

/**
 * `definition` APPROVED untuk NEW_SUBCATEGORY. `name` dan `category_id`
 * default dari usulan. `is_active` tidak diterima: sub-kategori hasil usulan
 * selalu lahir nonaktif (usulan D baru Fase 3).
 */
export const approveSubcategorySchema = z
  .object({
    ...subcategoryFields,
    name: subcategoryFields.name.optional(),
    category_id: z.string().uuid('category_id tidak sah').optional(),
  })
  .refine(priceRangeOk, priceRangeMessage);

/**
 * `definition` APPROVED untuk NEW_ATTRIBUTE_OPTION. Default `proposed_name`.
 * `duration_minutes` wajib kalau atributnya berdurasi (D100), diperiksa service.
 */
export const approveOptionSchema = z.object({
  option_value: z.string().trim().min(1).max(100).optional(),
  duration_minutes: durationMinutes.optional(),
});

export type SubmitRequestBody = z.infer<typeof submitRequestSchema>;
export type DecisionBody = z.infer<typeof decisionSchema>;
export type AdminListQuery = z.infer<typeof adminListQuerySchema>;
