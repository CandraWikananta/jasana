/**
 * Aturan atribut dinamis. Fungsi murni, tidak menyentuh basis data, supaya
 * bisa diuji tanpa HTTP dan dipakai ulang listing (Fase 4) dan order
 * (Fase 6).
 *
 * Dua kelompok:
 *   checkAttributeDefinition   definisi buatan admin (D72)
 *   validateAttributeValue     nilai yang diisi provider (SPEC) atau
 *   validateSpecAttributes     dipilih client (OPTION)
 *
 * D67 poin 1: validator nilai HANYA dipanggil di jalur tulis. Listing lama
 * yang tidak lagi cocok dengan definisi tetap tayang.
 */

import type { ErrorDetail } from '@jasana/shared';
import type { AttributeDataType, AttributeRole, PricingMode } from '@jasana/database';

export const ATTRIBUTE_KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

/** Isi kolom JSONB `options`. Value tidak pernah dibuang, hanya dinonaktifkan (D67). */
export interface AttributeOption {
  value: string;
  is_active: boolean;
}

/** Isi kolom JSONB `validation_rule`. min/max untuk nilai NUMBER dan panjang TEXT. */
export interface ValidationRule {
  min?: number;
  max?: number;
  regex?: string;
}

export interface AttributeDefinition {
  attribute_key: string;
  data_type: AttributeDataType;
  attribute_role: AttributeRole;
  pricing_mode: PricingMode;
  options?: AttributeOption[] | null;
  validation_rule?: ValidationRule | null;
  is_required?: boolean;
  is_active?: boolean;
  is_filterable?: boolean;
}

/**
 * D72. Kombinasi peran, tipe, dan cara hitung yang sah:
 *   SPEC                              NONE, tipe apa pun
 *   OPTION NUMBER                     PER_UNIT
 *   OPTION SELECT/MULTISELECT/BOOLEAN FLAT_PER_OPTION
 * OPTION TEXT dan DATE tidak punya cara hitung delta, jadi tertolak.
 */
export function isAllowedPricingCombination(
  role: AttributeRole,
  dataType: AttributeDataType,
  pricingMode: PricingMode,
): boolean {
  if (role === 'SPEC') return pricingMode === 'NONE';
  if (dataType === 'NUMBER') return pricingMode === 'PER_UNIT';
  if (dataType === 'SELECT' || dataType === 'MULTISELECT' || dataType === 'BOOLEAN') {
    return pricingMode === 'FLAT_PER_OPTION';
  }
  return false;
}

const hasOptions = (dataType: AttributeDataType) =>
  dataType === 'SELECT' || dataType === 'MULTISELECT';

/** Seluruh pelanggaran definisi, kosong kalau sah. */
export function checkAttributeDefinition(def: AttributeDefinition): ErrorDetail[] {
  const errors: ErrorDetail[] = [];
  const fail = (path: string, message: string) => errors.push({ path, message });

  if (!ATTRIBUTE_KEY_PATTERN.test(def.attribute_key) || def.attribute_key.length > 50) {
    fail('attribute_key', 'attribute_key harus snake_case, diawali huruf, maksimal 50 karakter');
  }

  if (!isAllowedPricingCombination(def.attribute_role, def.data_type, def.pricing_mode)) {
    fail(
      'pricing_mode',
      `Kombinasi ${def.attribute_role} ${def.data_type} ${def.pricing_mode} tidak sah. ` +
        'SPEC selalu NONE, OPTION NUMBER memakai PER_UNIT, ' +
        'OPTION SELECT/MULTISELECT/BOOLEAN memakai FLAT_PER_OPTION',
    );
  }

  const options = def.options ?? null;
  if (hasOptions(def.data_type)) {
    if (!options || options.length === 0) {
      fail('options', `options wajib diisi untuk ${def.data_type}`);
    } else {
      const values = options.map((option) => option.value);
      if (new Set(values).size !== values.length) fail('options', 'Nilai options tidak boleh kembar');
      if (!options.some((option) => option.is_active)) {
        fail('options', 'Minimal satu option harus aktif');
      }
    }
  } else if (options && options.length > 0) {
    fail('options', `options hanya untuk SELECT dan MULTISELECT, bukan ${def.data_type}`);
  }

  const rule = def.validation_rule ?? null;
  if (rule) {
    const ruled = def.data_type === 'NUMBER' || def.data_type === 'TEXT';
    if ((rule.min !== undefined || rule.max !== undefined) && !ruled) {
      fail('validation_rule', 'min dan max hanya untuk NUMBER dan TEXT');
    }
    if (rule.min !== undefined && rule.max !== undefined && rule.min > rule.max) {
      fail('validation_rule', 'min tidak boleh melebihi max');
    }
    if (rule.regex !== undefined) {
      if (def.data_type !== 'TEXT') {
        fail('validation_rule', 'regex hanya untuk TEXT');
      } else {
        try {
          new RegExp(rule.regex);
        } catch {
          fail('validation_rule', 'regex tidak sah');
        }
      }
    }
  }

  return errors;
}

/** Tanggal ISO 8601, `2026-10-20` atau lengkap dengan jam. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/;

const activeValues = (def: AttributeDefinition) =>
  new Set((def.options ?? []).filter((option) => option.is_active).map((option) => option.value));

/**
 * Satu nilai terhadap satu definisi. Mengembalikan pesan galat, atau `null`
 * kalau sah. Option yang sudah nonaktif ditolak: validasi hanya saat tulis,
 * jadi nilai lama yang tersimpan tetap terbaca, tapi tidak bisa dipilih lagi.
 */
export function validateAttributeValue(def: AttributeDefinition, value: unknown): string | null {
  const rule = def.validation_rule ?? {};

  switch (def.data_type) {
    case 'BOOLEAN':
      return typeof value === 'boolean' ? null : 'harus boolean';

    case 'NUMBER': {
      if (typeof value !== 'number' || !Number.isFinite(value)) return 'harus angka';
      // Usulan D baru: delta dikali nilai ini, jadi jumlah unit pecahan
      // (2,5 unit AC) tidak bermakna.
      if (def.pricing_mode === 'PER_UNIT' && !Number.isInteger(value)) {
        return 'harus bilangan bulat';
      }
      if (rule.min !== undefined && value < rule.min) return `minimal ${rule.min}`;
      if (rule.max !== undefined && value > rule.max) return `maksimal ${rule.max}`;
      return null;
    }

    case 'TEXT': {
      if (typeof value !== 'string' || value.trim() === '') return 'harus teks';
      if (rule.min !== undefined && value.length < rule.min) return `minimal ${rule.min} karakter`;
      if (rule.max !== undefined && value.length > rule.max) return `maksimal ${rule.max} karakter`;
      if (rule.regex !== undefined && !new RegExp(rule.regex).test(value)) {
        return 'format tidak sesuai';
      }
      return null;
    }

    case 'DATE':
      return typeof value === 'string' && ISO_DATE.test(value) && !Number.isNaN(Date.parse(value))
        ? null
        : 'harus tanggal ISO 8601';

    case 'SELECT':
      return typeof value === 'string' && activeValues(def).has(value)
        ? null
        : 'bukan pilihan yang tersedia';

    case 'MULTISELECT': {
      if (!Array.isArray(value) || value.length === 0) return 'harus daftar pilihan, minimal satu';
      if (new Set(value).size !== value.length) return 'pilihan tidak boleh kembar';
      const allowed = activeValues(def);
      const unknown = value.filter((item) => typeof item !== 'string' || !allowed.has(item));
      return unknown.length === 0 ? null : `bukan pilihan yang tersedia: ${unknown.join(', ')}`;
    }
  }
}

/** Nilai yang dianggap "belum diisi", dipakai juga penandaan D67 poin 2. */
export const isEmptyValue = (value: unknown) =>
  value === undefined || value === null || (Array.isArray(value) && value.length === 0);

/**
 * `listings.attributes` terhadap definisi sub-kategori (PRD 3.2, kontrak
 * wajib). Hanya atribut AKTIF berperan SPEC yang boleh ada di sini; nilai
 * OPTION tinggal di `listing_option_prices`. Key yang tidak dikenal ditolak,
 * supaya JSONB tidak jadi liar.
 */
export function validateSpecAttributes(
  defs: AttributeDefinition[],
  record: Record<string, unknown>,
): ErrorDetail[] {
  const specs = new Map(
    defs
      .filter((def) => def.attribute_role === 'SPEC' && def.is_active !== false)
      .map((def) => [def.attribute_key, def]),
  );
  const errors: ErrorDetail[] = [];

  for (const key of Object.keys(record)) {
    if (!specs.has(key)) {
      errors.push({ path: `attributes.${key}`, message: `${key} bukan atribut spesifikasi sub-kategori ini` });
    }
  }

  for (const [key, def] of specs) {
    const value = record[key];
    if (isEmptyValue(value)) {
      if (def.is_required) errors.push({ path: `attributes.${key}`, message: `${key} wajib diisi` });
      continue;
    }
    const message = validateAttributeValue(def, value);
    if (message) errors.push({ path: `attributes.${key}`, message: `${key} ${message}` });
  }

  return errors;
}

/**
 * Kelengkapan listing terhadap definisi yang berlaku SEKARANG: SPEC lolos
 * `validateSpecAttributes`, dan setiap atribut OPTION wajib yang aktif
 * punya minimal satu opsi yang dilayani (`offeredKeys`). "Punya nilai" untuk
 * OPTION sama artinya dengan penandaan D67 poin 2 di katalog.
 *
 * Dipakai saat listing diaktifkan dan untuk memadamkan
 * `attributes_need_update` (H48).
 */
export function listingCompletenessErrors(
  defs: AttributeDefinition[],
  attributes: Record<string, unknown>,
  offeredKeys: Set<string>,
): ErrorDetail[] {
  const errors = validateSpecAttributes(defs, attributes);
  for (const def of defs) {
    if (def.attribute_role === 'OPTION' && def.is_required && def.is_active !== false && !offeredKeys.has(def.attribute_key)) {
      errors.push({ path: `option_prices.${def.attribute_key}`, message: `${def.attribute_key} wajib punya minimal satu opsi yang dilayani` });
    }
  }
  return errors;
}

/** Filter `attr[key]` pencarian yang sudah lolos validasi. */
export interface AttributeFilters {
  /** Nilai SPEC, dicocokkan sekaligus lewat `attributes @>` (GIN, H18). */
  spec: Record<string, unknown>;
  /** OPTION dicocokkan ke `listing_option_prices` yang dilayani, `offered = false` berarti tidak melayani. */
  options: { attribute_key: string; option_value: string | null; offered: boolean }[];
}

/** Nilai query string ke tipe definisinya, `undefined` kalau tidak bisa. */
function coerceFilterValue(def: AttributeDefinition, raw: string): unknown {
  switch (def.data_type) {
    case 'BOOLEAN':
      return raw === 'true' ? true : raw === 'false' ? false : undefined;
    case 'NUMBER':
      return raw.trim() !== '' && Number.isFinite(Number(raw)) ? Number(raw) : undefined;
    case 'MULTISELECT':
      return [raw];
    default:
      return raw;
  }
}

/**
 * `attr[key]=value` pada GET /listings terhadap definisi SATU sub-kategori
 * (usulan D baru, key yang sama bisa berbeda peran antar sub-kategori).
 * Hanya atribut aktif dan `is_filterable`. Nilai diperiksa
 * `validateAttributeValue`, jadi option nonaktif tertolak seperti di jalur
 * tulis dan baris harga opsi nonaktif tidak pernah cocok.
 */
export function parseAttributeFilters(
  defs: AttributeDefinition[],
  attr: Record<string, string>,
): { filters: AttributeFilters; errors: ErrorDetail[] } {
  const usable = new Map(
    defs.filter((def) => def.is_active !== false && def.is_filterable).map((def) => [def.attribute_key, def]),
  );
  const filters: AttributeFilters = { spec: {}, options: [] };
  const errors: ErrorDetail[] = [];

  for (const [key, raw] of Object.entries(attr)) {
    const path = `attr.${key}`;
    const def = usable.get(key);
    if (!def) {
      errors.push({ path, message: `${key} bukan atribut yang bisa difilter di sub-kategori ini` });
      continue;
    }
    const value = coerceFilterValue(def, raw);
    const message =
      value === undefined
        ? def.data_type === 'BOOLEAN' ? 'harus true atau false' : 'harus angka'
        : validateAttributeValue(def, value);
    if (message) {
      errors.push({ path, message: `${key} ${message}` });
      continue;
    }

    if (def.attribute_role === 'SPEC') {
      filters.spec[key] = value;
    } else if (def.data_type === 'SELECT' || def.data_type === 'MULTISELECT') {
      filters.options.push({ attribute_key: key, option_value: raw, offered: true });
    } else {
      // BOOLEAN: true = melayani, false = tidak. NUMBER (PER_UNIT): melayani.
      filters.options.push({ attribute_key: key, option_value: null, offered: value !== false });
    }
  }

  return { filters, errors };
}
