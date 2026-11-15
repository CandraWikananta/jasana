/**
 * Skema intent hasil ekstraksi LLM (D152, H14).
 *
 * Dua bentuk dari satu daftar sub-kategori: JSON Schema yang dikirim sebagai
 * structured output ke Gemini, dan Zod yang memvalidasi balasannya. Constrained
 * decoding Gemini tidak menegakkan panjang string maupun aturan antar-field,
 * jadi Zod yang memegang keputusan akhir. Balasan yang tidak lolos Zod adalah
 * galat, tidak pernah diperbaiki diam-diam.
 *
 * Aturan jenis intent (diulang di prompt sistem):
 * - `perlu_klarifikasi` HANYA kalau sub-kategori tidak bisa ditentukan. Lokasi
 *   atau waktu yang kurang TIDAK membuat pesan perlu klarifikasi: pesannya tetap
 *   `cari_jasa`, lokasi diisi server dari geolokasi browser atau alamat default,
 *   dan waktu yang tidak disebut ditulis `TIDAK_DISEBUT`.
 * - `sub_kategori` wajib terisi untuk `cari_jasa` dan null untuk jenis lain.
 */

import { z } from 'zod';

export const INTENT_TYPES = ['cari_jasa', 'perlu_klarifikasi', 'jasa_tidak_tersedia', 'sapaan', 'di_luar_cakupan'] as const;
export const TIME_TYPES = ['SEKARANG', 'TERJADWAL', 'TIDAK_DISEBUT'] as const;

const MAX_TEXT = 200;
const MAX_QUESTION = 300;
const MAX_ATTRIBUTES = 10;

/** Kunci sub-kategori yang unik secara global, karena slug hanya unik per kategori. */
export const subcategoryKey = (categorySlug: string, subcategorySlug: string) => `${categorySlug}/${subcategorySlug}`;

const nullableText = (max: number) => z.string().trim().min(1).max(max).nullable();

function zodSchema(keys: readonly string[]) {
  const subcategory = keys.length > 0 ? z.enum(keys as [string, ...string[]]).nullable() : z.null();
  return z
    .object({
      jenis: z.enum(INTENT_TYPES),
      sub_kategori: subcategory,
      slot: z
        .object({
          lokasi: z.object({ teks: nullableText(MAX_TEXT), pakai_lokasi_saat_ini: z.boolean() }).strict(),
          waktu: z.object({ jenis: z.enum(TIME_TYPES), teks: nullableText(MAX_TEXT) }).strict(),
          budget_maks: z.number().int().nonnegative().nullable(),
          atribut: z
            .array(z.object({ kunci: z.string().trim().min(1).max(50), nilai: z.string().trim().min(1).max(100) }).strict())
            .max(MAX_ATTRIBUTES),
        })
        .strict(),
      confidence: z.number().min(0).max(1),
      pertanyaan_klarifikasi: nullableText(MAX_QUESTION),
    })
    .strict()
    .superRefine((intent, ctx) => {
      if ((intent.jenis === 'cari_jasa') !== (intent.sub_kategori !== null)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sub_kategori'], message: 'sub_kategori wajib untuk cari_jasa dan null selain itu' });
      }
      if ((intent.jenis === 'perlu_klarifikasi') !== (intent.pertanyaan_klarifikasi !== null)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pertanyaan_klarifikasi'],
          message: 'pertanyaan_klarifikasi wajib untuk perlu_klarifikasi dan null selain itu',
        });
      }
    });
}

export type Intent = z.infer<ReturnType<typeof zodSchema>>;

const nullableString = (description: string) => ({ type: ['string', 'null'], description });

/** Subset JSON Schema yang didukung structured output Gemini. Nama properti harus sama dengan `zodSchema`. */
function jsonSchema(keys: readonly string[]) {
  const object = (properties: Record<string, unknown>) => ({
    type: 'object',
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  });
  return object({
    jenis: {
      type: 'string',
      enum: [...INTENT_TYPES],
      description:
        'perlu_klarifikasi HANYA kalau sub-kategori tidak bisa ditentukan. Lokasi atau waktu yang kurang tetap cari_jasa.',
    },
    sub_kategori:
      keys.length > 0
        ? { anyOf: [{ type: 'string', enum: [...keys] }, { type: 'null' }], description: 'Kunci sub-kategori. Wajib untuk cari_jasa, null selain itu.' }
        : { type: 'null' },
    slot: object({
      lokasi: object({
        teks: nullableString('Lokasi yang disebut pengguna, null kalau tidak disebut.'),
        pakai_lokasi_saat_ini: { type: 'boolean', description: 'true kalau pengguna minta memakai lokasinya saat ini.' },
      }),
      waktu: object({
        jenis: { type: 'string', enum: [...TIME_TYPES] },
        teks: nullableString('Ungkapan waktu dari pengguna, null kalau tidak disebut.'),
      }),
      budget_maks: { type: ['integer', 'null'], minimum: 0, description: 'Batas atas biaya dalam rupiah bulat.' },
      atribut: {
        type: 'array',
        maxItems: MAX_ATTRIBUTES,
        items: object({ kunci: { type: 'string' }, nilai: { type: 'string' } }),
      },
    }),
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    pertanyaan_klarifikasi: nullableString('Wajib untuk perlu_klarifikasi, null selain itu.'),
  });
}

export function buildIntentSchema(subcategoryKeys: readonly string[]) {
  return { zod: zodSchema(subcategoryKeys), jsonSchema: jsonSchema(subcategoryKeys) };
}
