/**
 * Skema Zod modul katalog.
 *
 * Yang TIDAK ada di skema PATCH atribut, sehingga dibuang Zod dan tidak
 * berpengaruh: `attribute_key` (key JSONB, tidak pernah berubah) serta
 * `data_type`, `attribute_role`, dan `pricing_mode` (usulan D baru Fase 3).
 * Mengubah tipe atribut yang sudah dipakai membuat nilai lama di
 * `listings.attributes` dan `listing_option_prices` kehilangan arti, alasan
 * yang sama dengan D67 poin 3. Untuk mengganti tipe: nonaktifkan, lalu buat
 * atribut baru.
 *
 * Kombinasi peran, tipe, dan pricing_mode (D72) diperiksa service lewat
 * `checkAttributeDefinition`, bukan di sini, karena PATCH harus memeriksa
 * hasil gabungan dengan baris yang sudah ada.
 */

import { z } from 'zod';

export const idParamsSchema = z.object({
  id: z.string().uuid('id tidak sah'),
});

export const attributeParamsSchema = z.object({
  id: z.string().uuid('id sub-kategori tidak sah'),
  attrId: z.string().uuid('id atribut tidak sah'),
});

const slug = z
  .string()
  .trim()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug harus huruf kecil, angka, dan tanda hubung');

const optionalText = (max: number) => z.string().trim().min(1).max(max).nullable().optional();
const displayOrder = z.number().int().min(0).max(10_000);
/** Integer rupiah (PRD 4.1). */
const rupiah = z.number().int().min(0).max(9_999_999_999);

const notEmpty = (body: Record<string, unknown>) =>
  Object.values(body).some((value) => value !== undefined);
const notEmptyMessage = { message: 'Isi minimal satu field yang ingin diubah' };

// ---------------------------------------------------------------------------
// Kategori
// ---------------------------------------------------------------------------

const categoryFields = {
  name: z.string().trim().min(2).max(100),
  slug,
  description: optionalText(2000),
  icon_name: optionalText(50),
  icon_url: z.string().url().nullable().optional(),
  display_order: displayOrder.optional(),
  is_active: z.boolean().optional(),
};

export const createCategorySchema = z.object(categoryFields);
export const updateCategorySchema = z.object(categoryFields).partial().refine(notEmpty, notEmptyMessage);

// ---------------------------------------------------------------------------
// Sub-kategori
// ---------------------------------------------------------------------------

export const priceRangeOk = (body: { suggested_price_min?: number | null; suggested_price_max?: number | null }) =>
  body.suggested_price_min == null ||
  body.suggested_price_max == null ||
  body.suggested_price_min <= body.suggested_price_max;
export const priceRangeMessage = {
  message: 'suggested_price_min tidak boleh melebihi suggested_price_max',
  path: ['suggested_price_max'],
};

/** Dipakai juga persetujuan usulan NEW_SUBCATEGORY. */
export const subcategoryFields = {
  name: z.string().trim().min(2).max(100),
  slug,
  description: optionalText(2000),
  suggested_price_min: rupiah.nullable().optional(),
  suggested_price_max: rupiah.nullable().optional(),
  estimated_duration_minutes: z.number().int().min(1).max(10_080).nullable().optional(),
  display_order: displayOrder.optional(),
};

export const createSubcategorySchema = z
  .object({
    category_id: z.string().uuid('category_id tidak sah'),
    ...subcategoryFields,
    is_active: z.boolean().optional(),
  })
  .refine(priceRangeOk, priceRangeMessage);

export const updateSubcategorySchema = z
  .object({ ...subcategoryFields, is_active: z.boolean().optional() })
  .partial()
  .refine(notEmpty, notEmptyMessage)
  .refine(priceRangeOk, priceRangeMessage);

// ---------------------------------------------------------------------------
// Atribut
// ---------------------------------------------------------------------------

const options = z
  .array(
    z.object({
      value: z.string().trim().min(1).max(100),
      is_active: z.boolean().default(true),
    }),
  )
  .max(100)
  .nullable();

const validationRule = z
  .object({
    min: z.number().finite().optional(),
    max: z.number().finite().optional(),
    regex: z.string().min(1).max(500).optional(),
  })
  .strict()
  .nullable();

const mutableAttributeFields = {
  label: z.string().trim().min(1).max(100),
  options: options.optional(),
  unit: optionalText(20),
  is_required: z.boolean().optional(),
  is_filterable: z.boolean().optional(),
  validation_rule: validationRule.optional(),
  display_order: displayOrder.optional(),
};

/** Dipakai juga persetujuan usulan NEW_ATTRIBUTE. */
export const createAttributeSchema = z.object({
  attribute_key: z.string().trim().min(1).max(50),
  data_type: z.enum(['TEXT', 'NUMBER', 'BOOLEAN', 'SELECT', 'MULTISELECT', 'DATE']),
  attribute_role: z.enum(['SPEC', 'OPTION']).default('SPEC'),
  pricing_mode: z.enum(['NONE', 'FLAT_PER_OPTION', 'PER_UNIT']).default('NONE'),
  ...mutableAttributeFields,
});

export const updateAttributeSchema = z
  .object({ ...mutableAttributeFields, is_active: z.boolean().optional() })
  .partial()
  .refine(notEmpty, notEmptyMessage);

export type CreateCategoryBody = z.infer<typeof createCategorySchema>;
export type UpdateCategoryBody = z.infer<typeof updateCategorySchema>;
export type CreateSubcategoryBody = z.infer<typeof createSubcategorySchema>;
export type UpdateSubcategoryBody = z.infer<typeof updateSubcategorySchema>;
export type CreateAttributeBody = z.infer<typeof createAttributeSchema>;
export type UpdateAttributeBody = z.infer<typeof updateAttributeSchema>;
