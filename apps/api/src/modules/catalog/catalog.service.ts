/**
 * Katalog Hybrid Approach (D2, D3, D72): kategori, sub-kategori, dan
 * definisi atribut dinamis.
 *
 * Inilah yang membuat jasa baru bisa ditambah TANPA migrasi: sub-kategori
 * dan atributnya hanyalah baris, dan nilai atribut listing tinggal di JSONB
 * yang divalidasi terhadap baris-baris ini.
 *
 * D67, empat aturan saat definisi berubah:
 *   1. Validasi nilai hanya saat tulis. Endpoint baca di sini tidak pernah
 *      memvalidasi listing
 *   2. Atribut yang MENJADI aktif dan wajib menandai listing lama yang belum
 *      punya nilainya (`attributes_need_update`), di transaksi yang sama
 *   3. Hapus atribut dan option bersifat soft. Value option tidak pernah
 *      dibuang dari `options`, hanya dinonaktifkan
 *   4. Tidak ada backfill: `listings.attributes` tidak pernah disentuh
 *
 * Kategori dan sub-kategori juga dihapus soft, karena `listings` dan
 * `subcategories` merujuknya dengan `restrict`.
 */

import { Prisma, prisma, type SubcategoryAttribute } from '@jasana/database';
import type { ErrorDetail } from '@jasana/shared';
import { Errors } from '../../lib/errors';
import { isUniqueViolation } from '../../lib/prisma-errors';
import {
  checkAttributeDefinition,
  isEmptyValue,
  isTimed,
  type AttributeDefinition,
} from './attribute-rules';
import {
  toAttributeDto,
  toCategoryDto,
  toDefinition,
  toSubcategoryDto,
  type AttributeDto,
  type CategoryDto,
  type SubcategoryDto,
} from './catalog.mapper';
import type {
  CreateAttributeBody,
  CreateCategoryBody,
  CreateSubcategoryBody,
  UpdateAttributeBody,
  UpdateCategoryBody,
  UpdateSubcategoryBody,
} from './catalog.schema';

type Tx = Prisma.TransactionClient;

/** Kolom JSON nullable butuh `DbNull` untuk dikosongkan, bukan `null`. */
function jsonInput(value: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull | undefined {
  if (value === undefined) return undefined;
  return value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);
}

/**
 * Unique index tetap penjaga sebenarnya (dua admin bisa membuat slug sama
 * bersamaan). Pelanggarannya diterjemahkan jadi 422 per field, bukan 500.
 */
export function translateCatalogError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    throw Errors.notFound();
  }
  const taken = (path: string): never => {
    throw Errors.validation([{ path, message: `${path} sudah dipakai` }]);
  };
  if (isUniqueViolation(error, 'attribute_key') || isUniqueViolation(error, 'attributeKey')) {
    taken('attribute_key');
  }
  if (isUniqueViolation(error, 'slug')) taken('slug');
  if (isUniqueViolation(error, 'name')) taken('name');
  throw error;
}

// ---------------------------------------------------------------------------
// Publik
// ---------------------------------------------------------------------------

/** GET /categories */
export async function listCategories(): Promise<CategoryDto[]> {
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
  return rows.map(toCategoryDto);
}

/** GET /categories/:id/subcategories */
export async function listSubcategories(categoryId: string): Promise<SubcategoryDto[]> {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, isActive: true },
    select: {
      subcategories: { where: { isActive: true }, orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }] },
    },
  });
  if (!category) throw Errors.notFound('Kategori tidak ditemukan');
  return category.subcategories.map(toSubcategoryDto);
}

/** GET /subcategories/:id/attributes. Atribut aktif, option aktif saja. */
export async function listAttributes(subcategoryId: string): Promise<AttributeDto[]> {
  const subcategory = await prisma.subcategory.findFirst({
    where: { id: subcategoryId, isActive: true, category: { isActive: true } },
    select: { attributes: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } } },
  });
  if (!subcategory) throw Errors.notFound('Sub-kategori tidak ditemukan');
  return subcategory.attributes.map((row) => toAttributeDto(row, true));
}

// ---------------------------------------------------------------------------
// Admin: kategori
// ---------------------------------------------------------------------------

function categoryData(body: UpdateCategoryBody) {
  return {
    name: body.name,
    slug: body.slug,
    description: body.description,
    iconName: body.icon_name,
    iconUrl: body.icon_url,
    displayOrder: body.display_order,
    isActive: body.is_active,
  };
}

export async function createCategory(body: CreateCategoryBody): Promise<CategoryDto> {
  const row = await prisma.category
    .create({ data: { ...categoryData(body), name: body.name, slug: body.slug } })
    .catch(translateCatalogError);
  return toCategoryDto(row);
}

export async function updateCategory(id: string, body: UpdateCategoryBody): Promise<CategoryDto> {
  const row = await prisma.category
    .update({ where: { id }, data: categoryData(body) })
    .catch(translateCatalogError);
  return toCategoryDto(row);
}

export function deleteCategory(id: string): Promise<CategoryDto> {
  return updateCategory(id, { is_active: false });
}

// ---------------------------------------------------------------------------
// Admin: sub-kategori
// ---------------------------------------------------------------------------

function subcategoryData(body: UpdateSubcategoryBody) {
  return {
    name: body.name,
    slug: body.slug,
    description: body.description,
    suggestedPriceMin: body.suggested_price_min,
    suggestedPriceMax: body.suggested_price_max,
    estimatedDurationMinutes: body.estimated_duration_minutes,
    displayOrder: body.display_order,
    isActive: body.is_active,
  };
}

/** Dipakai juga persetujuan usulan NEW_SUBCATEGORY, di transaksi pemanggil. */
export async function createSubcategoryTx(
  tx: Tx,
  body: CreateSubcategoryBody,
): Promise<SubcategoryDto> {
  const category = await tx.category.findUnique({ where: { id: body.category_id }, select: { id: true } });
  if (!category) {
    throw Errors.validation([{ path: 'category_id', message: 'Kategori tidak ditemukan' }]);
  }
  const row = await tx.subcategory.create({
    data: { ...subcategoryData(body), categoryId: body.category_id, name: body.name, slug: body.slug },
  });
  return toSubcategoryDto(row);
}

export function createSubcategory(body: CreateSubcategoryBody): Promise<SubcategoryDto> {
  return prisma.$transaction((tx) => createSubcategoryTx(tx, body)).catch(translateCatalogError);
}

export async function updateSubcategory(
  id: string,
  body: UpdateSubcategoryBody,
): Promise<SubcategoryDto> {
  const current = await prisma.subcategory.findUnique({
    where: { id },
    select: { suggestedPriceMin: true, suggestedPriceMax: true },
  });
  if (!current) throw Errors.notFound('Sub-kategori tidak ditemukan');

  // Skema hanya bisa membandingkan kalau keduanya dikirim. Di sini dengan
  // nilai yang sudah tersimpan, sebelum CHECK chk_subcategory_price_range
  // menolaknya jadi 500.
  const min = body.suggested_price_min !== undefined ? body.suggested_price_min : current.suggestedPriceMin?.toNumber();
  const max = body.suggested_price_max !== undefined ? body.suggested_price_max : current.suggestedPriceMax?.toNumber();
  if (min != null && max != null && min > max) {
    throw Errors.validation([
      { path: 'suggested_price_max', message: 'suggested_price_min tidak boleh melebihi suggested_price_max' },
    ]);
  }

  const row = await prisma.subcategory
    .update({ where: { id }, data: subcategoryData(body) })
    .catch(translateCatalogError);
  return toSubcategoryDto(row);
}

export function deleteSubcategory(id: string): Promise<SubcategoryDto> {
  return updateSubcategory(id, { is_active: false });
}

// ---------------------------------------------------------------------------
// Admin: atribut
// ---------------------------------------------------------------------------

/**
 * D67 poin 2 (H48). Listing lama di sub-kategori ini yang belum punya nilai
 * untuk atribut wajib yang baru berlaku ditandai, supaya dipaksa melengkapi
 * pada kali berikutnya diedit. Nilainya TIDAK diisi (poin 4).
 *
 *   SPEC    nilainya di `listings.attributes`
 *   OPTION  "punya nilai" berarti menawarkan minimal satu opsi untuk key itu
 *           di `listing_option_prices`, kalau tidak client tidak bisa memilih
 */
async function flagListingsMissing(tx: Tx, def: SubcategoryAttribute): Promise<void> {
  const base = { subcategoryId: def.subcategoryId, deletedAt: null, attributesNeedUpdate: false };

  if (def.attributeRole === 'OPTION') {
    await tx.listing.updateMany({
      where: { ...base, optionPrices: { none: { attributeKey: def.attributeKey, isOffered: true } } },
      data: { attributesNeedUpdate: true },
    });
    return;
  }

  // shortcut: JSONB dibaca ke memori lalu disaring di sini, karena filter
  // "key tidak ada atau kosong" tidak bisa dinyatakan Prisma tanpa query
  // mentah. Cukup untuk skala penelitian; ganti ke `NOT (attributes ? key)`
  // kalau satu sub-kategori punya puluhan ribu listing.
  const listings = await tx.listing.findMany({ where: base, select: { id: true, attributes: true } });
  const ids = listings
    .filter((listing) => isEmptyValue((listing.attributes as Record<string, unknown> | null)?.[def.attributeKey]))
    .map((listing) => listing.id);
  if (ids.length > 0) {
    await tx.listing.updateMany({ where: { id: { in: ids } }, data: { attributesNeedUpdate: true } });
  }
}

function assertDefinition(def: AttributeDefinition): void {
  const errors = checkAttributeDefinition(def);
  if (errors.length > 0) throw Errors.validation(errors, 'Definisi atribut tidak sah');
}

/**
 * D100 aturan (2): maksimal satu atribut berdurasi AKTIF per sub-kategori
 * (D103). Sub-kategori dikunci supaya dua tulisan bersamaan tidak sama-sama
 * melihat nol atribut berdurasi lain.
 */
async function assertSingleTimed(
  tx: Tx,
  subcategoryId: string,
  attributeId: string | null,
  def: AttributeDefinition,
): Promise<void> {
  if (!isTimed(def) || def.is_active === false) return;
  await tx.$queryRaw`SELECT id FROM subcategories WHERE id = ${subcategoryId}::uuid FOR UPDATE`;
  const others = await tx.subcategoryAttribute.findMany({
    where: { subcategoryId, isActive: true, ...(attributeId ? { id: { not: attributeId } } : {}) },
  });
  const timed = others.find((row) => isTimed(toDefinition(row)));
  if (timed) {
    throw Errors.validation([
      { path: 'options', message: `Sub-kategori ini sudah punya atribut berdurasi aktif: ${timed.attributeKey} (D100)` },
    ]);
  }
}

/** Dipakai juga persetujuan usulan NEW_ATTRIBUTE, di transaksi pemanggil. */
export async function createAttributeTx(
  tx: Tx,
  subcategoryId: string,
  body: CreateAttributeBody,
): Promise<AttributeDto> {
  const subcategory = await tx.subcategory.findUnique({ where: { id: subcategoryId }, select: { id: true } });
  if (!subcategory) throw Errors.notFound('Sub-kategori tidak ditemukan');

  const def = { ...body, options: body.options ?? null, validation_rule: body.validation_rule ?? null };
  assertDefinition(def);
  await assertSingleTimed(tx, subcategoryId, null, def);

  const row = await tx.subcategoryAttribute.create({
    data: {
      subcategoryId,
      attributeKey: body.attribute_key,
      label: body.label,
      dataType: body.data_type,
      attributeRole: body.attribute_role,
      pricingMode: body.pricing_mode,
      options: jsonInput(body.options),
      unit: body.unit,
      isRequired: body.is_required,
      isFilterable: body.is_filterable,
      validationRule: jsonInput(body.validation_rule),
      displayOrder: body.display_order,
    },
  });
  if (row.isRequired) await flagListingsMissing(tx, row);
  return toAttributeDto(row);
}

export function createAttribute(subcategoryId: string, body: CreateAttributeBody): Promise<AttributeDto> {
  return prisma
    .$transaction((tx) => createAttributeTx(tx, subcategoryId, body))
    .catch(translateCatalogError);
}

/**
 * `options` adalah satu array JSONB yang dibaca, diubah, lalu ditulis ulang.
 * Tanpa kunci, dua persetujuan option atau PATCH yang bersamaan saling
 * menimpa, dan value yang baru disetujui hilang diam-diam (melanggar D67
 * poin 3). Query mentah sesuai konvensi: hanya untuk `SELECT ... FOR UPDATE`.
 */
async function lockAttribute(tx: Tx, attributeId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM subcategory_attributes WHERE id = ${attributeId}::uuid FOR UPDATE`;
}

async function findAttribute(tx: Tx, subcategoryId: string, attributeId: string) {
  const row = await tx.subcategoryAttribute.findFirst({ where: { id: attributeId, subcategoryId } });
  if (!row) throw Errors.notFound('Atribut tidak ditemukan');
  return row;
}

/** D67 poin 3: value lama tidak boleh hilang, hanya boleh dinonaktifkan. */
function removedOptionValues(before: AttributeDefinition, after: AttributeDefinition): string[] {
  const kept = new Set((after.options ?? []).map((option) => option.value));
  return (before.options ?? []).map((option) => option.value).filter((value) => !kept.has(value));
}

export function updateAttribute(
  subcategoryId: string,
  attributeId: string,
  body: UpdateAttributeBody,
): Promise<AttributeDto> {
  return prisma.$transaction(async (tx) => {
    await lockAttribute(tx, attributeId);
    const current = await findAttribute(tx, subcategoryId, attributeId);
    const before = toDefinition(current);
    const after: Required<AttributeDefinition> = {
      ...before,
      options: body.options !== undefined ? body.options : before.options,
      validation_rule: body.validation_rule !== undefined ? body.validation_rule : before.validation_rule,
      is_required: body.is_required ?? before.is_required,
      is_active: body.is_active ?? before.is_active,
    };

    const removed = removedOptionValues(before, after);
    if (removed.length > 0) {
      throw Errors.validation([
        {
          path: 'options',
          message: `Option tidak boleh dihapus, nonaktifkan lewat is_active: ${removed.join(', ')}`,
        },
      ]);
    }
    assertDefinition(after);
    await assertSingleTimed(tx, subcategoryId, attributeId, after);

    const row = await tx.subcategoryAttribute.update({
      where: { id: attributeId },
      data: {
        label: body.label,
        options: jsonInput(body.options),
        unit: body.unit,
        isRequired: body.is_required,
        isFilterable: body.is_filterable,
        isActive: body.is_active,
        validationRule: jsonInput(body.validation_rule),
        displayOrder: body.display_order,
      },
    });

    const wasEnforced = before.is_required && before.is_active;
    if (!wasEnforced && row.isRequired && row.isActive) await flagListingsMissing(tx, row);
    return toAttributeDto(row);
  });
}

/** D67 poin 3: soft. Barisnya tetap ada supaya nilai lama di listing tetap punya arti. */
export function deleteAttribute(subcategoryId: string, attributeId: string): Promise<AttributeDto> {
  return updateAttribute(subcategoryId, attributeId, { is_active: false });
}

/**
 * Persetujuan usulan NEW_ATTRIBUTE_OPTION. Hanya SELECT dan MULTISELECT
 * yang punya option. Value yang sudah ada, aktif maupun tidak, ditolak:
 * yang nonaktif diaktifkan ulang lewat PATCH atribut, bukan ditambah kembar.
 * Atribut berdurasi wajib diberi durasi oleh admin, yang lain tidak boleh (D100 poin 4).
 */
export async function appendAttributeOptionTx(
  tx: Tx,
  attributeId: string,
  value: string,
  durationMinutes?: number | null,
): Promise<AttributeDto> {
  await lockAttribute(tx, attributeId);
  const current = await tx.subcategoryAttribute.findUniqueOrThrow({ where: { id: attributeId } });
  const options = toDefinition(current).options ?? [];
  const fail = (detail: ErrorDetail): never => {
    throw Errors.validation([detail]);
  };
  if (current.dataType !== 'SELECT' && current.dataType !== 'MULTISELECT') {
    fail({ path: 'attribute_key', message: 'Atribut ini tidak punya daftar option' });
  }
  if (options.some((option) => option.value === value)) {
    fail({ path: 'option_value', message: `Option ${value} sudah ada di atribut ini` });
  }
  const timed = isTimed({ options });
  if (timed && durationMinutes == null) {
    fail({ path: 'duration_minutes', message: 'Atribut ini berdurasi, duration_minutes wajib diisi admin (D100)' });
  }
  if (!timed && durationMinutes != null) {
    fail({ path: 'duration_minutes', message: 'Atribut ini tidak berdurasi, duration_minutes tidak boleh diisi' });
  }

  const added = timed ? { value, is_active: true, duration_minutes: durationMinutes } : { value, is_active: true };
  const row = await tx.subcategoryAttribute.update({
    where: { id: attributeId },
    data: { options: [...options, added] as unknown as Prisma.InputJsonValue },
  });
  return toAttributeDto(row);
}
