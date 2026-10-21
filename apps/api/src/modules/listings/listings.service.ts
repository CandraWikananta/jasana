/**
 * Listing, harga opsi, foto, FAQ, dan pemetaan dari sisi listing (Fase 4).
 *
 * Aturan yang dijaga di sini, bukan di basis data:
 *
 *   D53 / H39  Listing tidak bisa ditayangkan tanpa pekerja ACTIVE yang
 *              terpetakan, dan listing tayang tidak bisa kehilangan pekerja
 *              terakhirnya (V7). Seluruh tulis yang menyentuhnya mengambil
 *              `lockProviderProfile` lebih dulu, kunci yang sama dengan
 *              keluarnya pekerja dan pemetaan dari sisi pekerja
 *   D90 / H85  Durasi wajib 15 sampai 720 menit, dijaga skema Zod
 *   D67 / H48  Listing bertanda `attributes_need_update` tidak bisa disimpan
 *              sampai lengkap. Penandanya dinyalakan katalog, dipadamkan di sini
 *   D72        `attributes` hanya SPEC, harga opsi hanya OPTION
 *   H73        Jumlah FAQ dibatasi `listing_faq_max_items`
 *
 * Harga di sini daftar harga (`price`), bukan nominal order. Nominal order
 * dihitung ulang dari baris ini saat pemesanan (Fase 6).
 */

import { randomUUID } from 'node:crypto';
import { prisma, type Prisma } from '@jasana/database';
import type { ErrorDetail } from '@jasana/shared';
import { LISTING_PHOTO_BUCKET } from '../../config/constants';
import { AppError, Errors } from '../../lib/errors';
import { pageMeta, skipTake, type Paginated } from '../../lib/pagination';
import { storage } from '../../lib/supabase';
import type { ProviderContext } from '../access/access.service';
import {
  listingCompletenessErrors,
  validateSpecAttributes,
  type AttributeDefinition,
} from '../catalog/attribute-rules';
import { toDefinition } from '../catalog/catalog.mapper';
import { getNumberSetting } from '../settings/settings.service';
import { lockProviderProfile } from '../workers/workforce';
import { LISTING_SELECT, toFaqDto, toListingDto, type FaqDto, type ListingDto } from './listings.mapper';
import {
  MODE_MESSAGE,
  type CreateListingBody,
  type FaqsBody,
  type ListMyListingsQuery,
  type OptionPricesBody,
  type PhotoBody,
  type UpdateListingBody,
} from './listings.schema';

type Tx = Prisma.TransactionClient;
type Attributes = Record<string, unknown>;

const attributeError = (details: ErrorDetail[], message = 'Atribut listing tidak sesuai definisi sub-kategori') =>
  new AppError('ATTRIBUTE_VALIDATION_FAILED', message, { details });

const notFound = () => Errors.notFound('Listing tidak ditemukan');

/** Seluruh definisi, termasuk yang nonaktif. Validator menyaring sendiri. */
async function definitionsOf(tx: Tx, subcategoryId: string): Promise<AttributeDefinition[]> {
  const rows = await tx.subcategoryAttribute.findMany({ where: { subcategoryId } });
  return rows.map(toDefinition);
}

async function offeredKeys(tx: Tx, listingId: string): Promise<Set<string>> {
  const rows = await tx.listingOptionPrice.findMany({
    where: { listingId, isOffered: true },
    select: { attributeKey: true },
    distinct: ['attributeKey'],
  });
  return new Set(rows.map((row) => row.attributeKey));
}

/** Listing milik provider ini yang belum dihapus, selain itu 404. */
async function ownedListing<S extends Prisma.ListingSelect>(tx: Tx, provider: ProviderContext, id: string, select: S) {
  const listing = await tx.listing.findFirst({ where: { id, providerProfileId: provider.id, deletedAt: null }, select });
  if (!listing) throw notFound();
  return listing;
}

async function readOwned(id: string): Promise<ListingDto> {
  return toListingDto(await prisma.listing.findUniqueOrThrow({ where: { id }, select: LISTING_SELECT }), 'owner');
}

// ---------------------------------------------------------------------------
// Provider: CRUD listing
// ---------------------------------------------------------------------------

/**
 * POST /providers/me/listings. Selalu lahir DRAFT. Provider INDIVIDUAL
 * langsung terpetakan ke baris pekerja pemiliknya (D53), karena tidak
 * pernah melihat antarmuka pemetaan.
 */
export async function createListing(provider: ProviderContext, body: CreateListingBody): Promise<ListingDto> {
  const id = await prisma.$transaction(async (tx) => {
    const subcategory = await tx.subcategory.findFirst({
      where: { id: body.subcategory_id, isActive: true, category: { isActive: true } },
      select: { id: true },
    });
    if (!subcategory) {
      throw Errors.validation([{ path: 'subcategory_id', message: 'Sub-kategori tidak ada atau tidak aktif' }]);
    }

    const errors = validateSpecAttributes(await definitionsOf(tx, subcategory.id), body.attributes);
    if (errors.length > 0) throw attributeError(errors);

    const listing = await tx.listing.create({
      data: {
        providerProfileId: provider.id,
        subcategoryId: subcategory.id,
        title: body.title,
        description: body.description ?? null,
        price: body.price,
        priceUnit: body.price_unit,
        estimatedDurationMinutes: body.estimated_duration_minutes,
        attributes: body.attributes as Prisma.InputJsonObject,
        supportsScheduled: body.supports_scheduled,
        supportsAvailableNow: body.supports_available_now,
      },
      select: { id: true },
    });

    if (provider.providerType === 'INDIVIDUAL') {
      const owner = await tx.providerWorker.findFirst({
        where: { providerProfileId: provider.id, isOwner: true, membershipStatus: 'ACTIVE' },
        select: { id: true },
      });
      if (owner) await tx.workerListing.create({ data: { workerId: owner.id, listingId: listing.id } });
    }

    return listing.id;
  });

  return readOwned(id);
}

/** Usulan D baru: GET /providers/me/listings, termasuk DRAFT dan INACTIVE. */
export async function listMyListings(provider: ProviderContext, query: ListMyListingsQuery): Promise<Paginated<ListingDto>> {
  const where: Prisma.ListingWhereInput = {
    providerProfileId: provider.id,
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
  };
  const [rows, total] = await prisma.$transaction([
    prisma.listing.findMany({ where, select: LISTING_SELECT, orderBy: { createdAt: 'desc' }, ...skipTake(query) }),
    prisma.listing.count({ where }),
  ]);
  return { items: rows.map((row) => toListingDto(row, 'owner')), meta: pageMeta(query, total) };
}

/** Usulan D baru: GET /providers/me/listings/:id. */
export async function getMyListing(provider: ProviderContext, id: string): Promise<ListingDto> {
  const row = await prisma.listing.findFirst({
    where: { id, providerProfileId: provider.id, deletedAt: null },
    select: LISTING_SELECT,
  });
  if (!row) throw notFound();
  return toListingDto(row, 'owner');
}

/**
 * PATCH /providers/me/listings/:id.
 *
 * Aktivasi (`status: ACTIVE` dari DRAFT atau INACTIVE) butuh, berurutan:
 * sub-kategori aktif, pekerja ACTIVE terpetakan (409, D53), lalu atribut
 * lengkap termasuk OPTION wajib (422, usulan D baru).
 */
export async function updateListing(
  provider: ProviderContext,
  id: string,
  body: UpdateListingBody,
): Promise<ListingDto> {
  await prisma.$transaction(async (tx) => {
    await lockProviderProfile(tx, provider.id);
    const listing = await ownedListing(tx, provider, id, {
      subcategoryId: true,
      attributes: true,
      attributesNeedUpdate: true,
      status: true,
      supportsScheduled: true,
      supportsAvailableNow: true,
      subcategory: { select: { isActive: true, category: { select: { isActive: true } } } },
    });

    // Nilai akhir, karena body PATCH bisa hanya memuat salah satu mode.
    if (!(body.supports_scheduled ?? listing.supportsScheduled) && !(body.supports_available_now ?? listing.supportsAvailableNow)) {
      throw Errors.validation([{ path: 'supports_scheduled', message: MODE_MESSAGE }]);
    }

    const defs = await definitionsOf(tx, listing.subcategoryId);
    const attributes = body.attributes ?? ((listing.attributes as Attributes | null) ?? {});
    if (body.attributes) {
      const errors = validateSpecAttributes(defs, body.attributes);
      if (errors.length > 0) throw attributeError(errors);
    }

    const activating = body.status === 'ACTIVE' && listing.status !== 'ACTIVE';
    if (activating) {
      if (!listing.subcategory.isActive || !listing.subcategory.category.isActive) {
        throw Errors.validation([{ path: 'status', message: 'Sub-kategori listing ini sudah tidak aktif' }]);
      }
      const mapped = await tx.workerListing.count({ where: { listingId: id, worker: { membershipStatus: 'ACTIVE' } } });
      if (mapped === 0) {
        throw new AppError(
          'LISTING_HAS_NO_WORKER',
          'Listing tidak bisa ditayangkan tanpa pekerja terpetakan. Petakan minimal satu pekerja aktif lebih dulu.',
        );
      }
    }

    // Usulan D baru: listing bertanda tetap boleh diturunkan tanpa melengkapi
    // atribut, supaya jasa yang tidak bisa dilayani tidak dipaksa tetap tayang.
    const pausingOnly = body.status === 'INACTIVE' && Object.keys(body).length === 1;
    const mustBeComplete = activating || (listing.attributesNeedUpdate && !pausingOnly);
    if (mustBeComplete) {
      const errors = listingCompletenessErrors(defs, attributes, await offeredKeys(tx, id));
      if (errors.length > 0) {
        throw attributeError(
          errors,
          listing.attributesNeedUpdate
            ? 'Sub-kategori ini punya atribut wajib baru. Lengkapi dulu sebelum listing bisa disimpan'
            : 'Atribut wajib listing belum lengkap untuk ditayangkan',
        );
      }
    }

    await tx.listing.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        price: body.price,
        priceUnit: body.price_unit,
        estimatedDurationMinutes: body.estimated_duration_minutes,
        attributes: body.attributes as Prisma.InputJsonObject | undefined,
        supportsScheduled: body.supports_scheduled,
        supportsAvailableNow: body.supports_available_now,
        status: body.status,
        // Lolos pemeriksaan kelengkapan di atas, jadi penandanya padam (H48).
        ...(mustBeComplete && listing.attributesNeedUpdate ? { attributesNeedUpdate: false } : {}),
      },
    });
  });

  return readOwned(id);
}

/**
 * DELETE /providers/me/listings/:id. Soft delete (D22): order lama tetap
 * merujuk ke sini. Pemetaan, foto, dan harga opsinya tidak disentuh.
 */
export async function deleteListing(provider: ProviderContext, id: string): Promise<{ id: string; deleted_at: string }> {
  const deletedAt = new Date();
  const result = await prisma.listing.updateMany({
    where: { id, providerProfileId: provider.id, deletedAt: null },
    data: { deletedAt },
  });
  if (result.count === 0) throw notFound();
  return { id, deleted_at: deletedAt.toISOString() };
}

// ---------------------------------------------------------------------------
// Provider: harga opsi, pemetaan, foto, FAQ
// ---------------------------------------------------------------------------

const pairKey = (attributeKey: string, optionValue: string | null) => `${attributeKey}\u0000${optionValue ?? ''}`;

/**
 * PUT /providers/me/listings/:id/option-prices (D72). Body hanya memuat opsi
 * yang dicentang. Baris lama yang tidak dicentang jadi `is_offered = false`,
 * tidak dihapus. Selalu boleh dipanggil walau listing bertanda H48, karena
 * ini jalan untuk melengkapi sisi OPTION.
 */
export async function setOptionPrices(
  provider: ProviderContext,
  id: string,
  body: OptionPricesBody,
): Promise<ListingDto> {
  await prisma.$transaction(async (tx) => {
    await lockProviderProfile(tx, provider.id);
    const listing = await ownedListing(tx, provider, id, {
      subcategoryId: true,
      attributes: true,
      attributesNeedUpdate: true,
    });

    const defs = await definitionsOf(tx, listing.subcategoryId);
    const optionDefs = new Map(
      defs.filter((def) => def.attribute_role === 'OPTION' && def.is_active !== false).map((def) => [def.attribute_key, def]),
    );

    const errors: ErrorDetail[] = [];
    const seen = new Set<string>();
    body.options.forEach((item, index) => {
      const path = `options.${index}`;
      const def = optionDefs.get(item.attribute_key);
      if (!def) {
        errors.push({ path, message: `${item.attribute_key} bukan atribut opsi aktif sub-kategori ini` });
        return;
      }
      if (def.data_type === 'SELECT' || def.data_type === 'MULTISELECT') {
        const active = (def.options ?? []).some((option) => option.is_active && option.value === item.option_value);
        if (!active) errors.push({ path, message: `${item.option_value} bukan pilihan aktif ${item.attribute_key}` });
      } else if (item.option_value !== null) {
        errors.push({ path, message: `${item.attribute_key} tidak memakai option_value, kirim null` });
      }
      const key = pairKey(item.attribute_key, item.option_value);
      if (seen.has(key)) errors.push({ path, message: 'Opsi yang sama dikirim dua kali' });
      seen.add(key);
    });

    const chosenKeys = new Set(body.options.map((item) => item.attribute_key));
    // OPTION wajib tanpa opsi: aturan yang sama dengan syarat tayang, sisi SPEC diabaikan.
    errors.push(
      ...listingCompletenessErrors(defs, {}, chosenKeys).filter((error) => error.path.startsWith('option_prices.')),
    );
    if (errors.length > 0) throw attributeError(errors, 'Harga opsi tidak sesuai definisi sub-kategori');

    const existing = await tx.listingOptionPrice.findMany({
      where: { listingId: id },
      select: { id: true, attributeKey: true, optionValue: true },
    });
    const existingByKey = new Map(existing.map((row) => [pairKey(row.attributeKey, row.optionValue), row.id]));

    for (const item of body.options) {
      const existingId = existingByKey.get(pairKey(item.attribute_key, item.option_value));
      if (existingId) {
        await tx.listingOptionPrice.update({
          where: { id: existingId },
          data: { priceDelta: item.price_delta, isOffered: true },
        });
      } else {
        await tx.listingOptionPrice.create({
          data: {
            listingId: id,
            attributeKey: item.attribute_key,
            optionValue: item.option_value,
            priceDelta: item.price_delta,
            isOffered: true,
          },
        });
      }
    }

    const unchecked = existing.filter((row) => !seen.has(pairKey(row.attributeKey, row.optionValue))).map((row) => row.id);
    if (unchecked.length > 0) {
      await tx.listingOptionPrice.updateMany({ where: { id: { in: unchecked } }, data: { isOffered: false } });
    }

    if (
      listing.attributesNeedUpdate &&
      listingCompletenessErrors(defs, (listing.attributes as Attributes | null) ?? {}, chosenKeys).length === 0
    ) {
      await tx.listing.update({ where: { id }, data: { attributesNeedUpdate: false } });
    }
  });

  return readOwned(id);
}

/**
 * PUT /providers/me/listings/:id/workers. Pemetaan dari sisi listing
 * (D50 sampai D52), menulis ke tabel yang sama dengan sisi pekerja. Yang
 * diganti hanya pemetaan pekerja ACTIVE; centangan pelamar PENDING (D52)
 * dibiarkan sampai pemiliknya memutus lamaran (usulan D baru).
 */
export async function setListingWorkers(
  provider: ProviderContext,
  id: string,
  workerIds: string[],
): Promise<ListingDto> {
  await prisma.$transaction(async (tx) => {
    await lockProviderProfile(tx, provider.id);
    const listing = await ownedListing(tx, provider, id, { status: true });

    const workers = await tx.providerWorker.findMany({
      where: { id: { in: workerIds }, providerProfileId: provider.id, membershipStatus: 'ACTIVE' },
      select: { id: true },
    });
    const found = new Set(workers.map((worker) => worker.id));
    const invalid = workerIds.filter((workerId) => !found.has(workerId));
    if (invalid.length > 0) {
      throw new AppError('WORKER_NOT_ASSIGNABLE', 'Hanya pekerja aktif usaha ini yang bisa dipetakan', {
        details: invalid.map((workerId) => ({ path: 'worker_ids', message: `${workerId} bukan pekerja aktif usaha ini` })),
      });
    }

    // V7: listing tayang tidak boleh kosong. Daftar tidak kosong pasti
    // berisi pekerja ACTIVE, karena sudah disaring di atas.
    if (listing.status === 'ACTIVE' && workerIds.length === 0) {
      throw new AppError(
        'LISTING_HAS_NO_WORKER',
        'Listing yang sedang tayang wajib punya minimal satu pekerja terpetakan.',
      );
    }

    await tx.workerListing.deleteMany({
      where: { listingId: id, workerId: { notIn: workerIds }, worker: { membershipStatus: 'ACTIVE' } },
    });
    await tx.workerListing.createMany({
      data: workerIds.map((workerId) => ({ workerId, listingId: id })),
      skipDuplicates: true,
    });
  });

  return readOwned(id);
}

/**
 * POST /uploads/signed-url (D80). Foto listing diunggah langsung ke Storage,
 * tidak lewat API. Path di folder milik pemanggil, supaya pencatatan foto
 * bisa menolak berkas milik orang lain.
 */
export async function createPhotoUploadUrl(userId: string): Promise<{ upload_url: string; file_url: string }> {
  const path = `${userId}/${randomUUID()}`;
  try {
    const uploadUrl = await storage.createSignedUploadUrl(LISTING_PHOTO_BUCKET, path);
    return { upload_url: uploadUrl, file_url: storage.publicUrl(LISTING_PHOTO_BUCKET, path) };
  } catch (error) {
    throw new AppError('STORAGE_UPLOAD_FAILED', 'Gagal menyiapkan unggahan foto, silakan coba lagi', {
      cause: error,
      context: { user_id: userId },
    });
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /providers/me/listings/:id/photos. `file_url` wajib URL publik bucket
 * foto di folder pemanggil, persis bentuk yang dibalas signed-url. URL dari
 * luar bucket ditolak, supaya listing tidak bisa memuat gambar sembarang
 * situs.
 */
export async function addPhoto(provider: ProviderContext, id: string, body: PhotoBody): Promise<ListingDto> {
  const prefix = storage.publicUrl(LISTING_PHOTO_BUCKET, `${provider.userId}/`);
  if (!body.file_url.startsWith(prefix) || !UUID.test(body.file_url.slice(prefix.length))) {
    throw Errors.validation([{ path: 'file_url', message: 'file_url harus hasil POST /uploads/signed-url milik akun ini' }]);
  }

  await prisma.$transaction(async (tx) => {
    await lockProviderProfile(tx, provider.id);
    await ownedListing(tx, provider, id, { id: true });
    const count = await tx.listingPhoto.count({ where: { listingId: id } });
    await tx.listingPhoto.create({
      data: {
        listingId: id,
        fileUrl: body.file_url,
        caption: body.caption ?? null,
        displayOrder: count,
        isPrimary: count === 0,
      },
    });
  });

  return readOwned(id);
}

/**
 * DELETE /providers/me/listings/:id/photos/:photoId.
 * shortcut: hanya barisnya yang dihapus, berkasnya tetap bisa diakses publik
 * sampai cron berkas yatim (H80) membersihkannya. Hapus langsung dari Storage
 * kalau foto yang ditarik harus segera hilang.
 */
export async function deletePhoto(provider: ProviderContext, id: string, photoId: string): Promise<ListingDto> {
  const result = await prisma.listingPhoto.deleteMany({
    where: { id: photoId, listingId: id, listing: { providerProfileId: provider.id, deletedAt: null } },
  });
  if (result.count === 0) throw Errors.notFound('Foto tidak ditemukan');
  return readOwned(id);
}

/**
 * PUT /providers/me/listings/:id/faqs (D78). FAQ lama dinonaktifkan, bukan
 * dihapus (PRD 3.3), lalu ditulis ulang. Kunci provider mencegah dua
 * penulisan bersamaan yang sama-sama menyisakan satu set aktif (V12).
 */
export async function setFaqs(provider: ProviderContext, id: string, body: FaqsBody): Promise<ListingDto> {
  const max = await getNumberSetting('listing_faq_max_items');
  if (body.faqs.length > max) {
    throw Errors.validation([{ path: 'faqs', message: `Paling banyak ${max} butir FAQ per listing` }]);
  }

  await prisma.$transaction(async (tx) => {
    await lockProviderProfile(tx, provider.id);
    await ownedListing(tx, provider, id, { id: true });
    await tx.listingFaq.updateMany({ where: { listingId: id, isActive: true }, data: { isActive: false } });
    await tx.listingFaq.createMany({
      data: body.faqs.map((faq, index) => ({ listingId: id, question: faq.question, answer: faq.answer, displayOrder: index })),
    });
  });

  return readOwned(id);
}

// ---------------------------------------------------------------------------
// Publik
// ---------------------------------------------------------------------------

/** Hanya listing yang benar-benar tayang. DRAFT dan yang terhapus tampak tidak ada. */
const PUBLIC_WHERE = {
  status: 'ACTIVE',
  deletedAt: null,
  providerProfile: { verificationStatus: 'VERIFIED' },
} as const satisfies Prisma.ListingWhereInput;

/** GET /listings/:id. Review menyusul di Fase 10. */
export async function getPublicListing(id: string): Promise<ListingDto> {
  const row = await prisma.listing.findFirst({ where: { id, ...PUBLIC_WHERE }, select: LISTING_SELECT });
  if (!row) throw notFound();
  return toListingDto(row, 'public');
}

/** GET /listings/:id/faqs. */
export async function getPublicFaqs(id: string): Promise<FaqDto[]> {
  const row = await prisma.listing.findFirst({ where: { id, ...PUBLIC_WHERE }, select: { faqs: LISTING_SELECT.faqs } });
  if (!row) throw notFound();
  return row.faqs.map(toFaqDto);
}
