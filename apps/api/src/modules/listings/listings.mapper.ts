/**
 * Bentuk JSON baris `listings` beserta foto, FAQ, harga opsi, dan pemetaan.
 *
 * Dua tampilan dari satu select:
 *   public  GET /listings/:id. Hanya opsi yang dilayani dan masih bisa
 *           dipilih (definisi dan value-nya aktif, D67)
 *   owner   GET /providers/me/listings[/:id] dan balasan tulis. Ditambah
 *           status, penanda H48, pekerja terpetakan, dan seluruh baris
 *           harga opsi termasuk yang tidak dilayani
 *
 * Tidak ada validasi atribut di sini: validasi hanya saat tulis (D67 poin 1).
 */

import type { Prisma } from '@jasana/database';
import type { AttributeOption } from '../catalog/attribute-rules';

export const LISTING_SELECT = {
  id: true,
  providerProfileId: true,
  subcategoryId: true,
  title: true,
  description: true,
  price: true,
  priceUnit: true,
  estimatedDurationMinutes: true,
  attributes: true,
  attributesNeedUpdate: true,
  supportsScheduled: true,
  supportsAvailableNow: true,
  status: true,
  ratingAverage: true,
  ratingCount: true,
  orderCount: true,
  createdAt: true,
  updatedAt: true,
  subcategory: {
    select: {
      name: true,
      attributes: {
        select: { attributeKey: true, label: true, dataType: true, pricingMode: true, unit: true, options: true, isActive: true, attributeRole: true, displayOrder: true },
      },
    },
  },
  providerProfile: {
    select: { id: true, businessName: true, providerType: true, ratingAverage: true, ratingCount: true },
  },
  photos: {
    select: { id: true, fileUrl: true, caption: true, displayOrder: true, isPrimary: true },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
  },
  faqs: {
    where: { isActive: true },
    select: { id: true, question: true, answer: true, displayOrder: true },
    orderBy: { displayOrder: 'asc' },
  },
  optionPrices: {
    select: { attributeKey: true, optionValue: true, priceDelta: true, isOffered: true },
  },
  workers: {
    select: { worker: { select: { id: true, displayName: true, membershipStatus: true } } },
    orderBy: { createdAt: 'asc' },
  },
} as const satisfies Prisma.ListingSelect;

export type ListingRow = Prisma.ListingGetPayload<{ select: typeof LISTING_SELECT }>;

export interface OptionPriceDto {
  attribute_key: string;
  label: string;
  data_type: string;
  pricing_mode: string;
  unit: string | null;
  option_value: string | null;
  price_delta: number;
  is_offered?: boolean;
}

export interface FaqDto {
  id: string;
  question: string;
  answer: string;
  display_order: number;
}

export interface ListingDto {
  id: string;
  subcategory: { id: string; name: string };
  provider: { id: string; business_name: string | null; provider_type: string; rating_average: number; rating_count: number };
  title: string;
  description: string | null;
  price: number;
  price_unit: string;
  estimated_duration_minutes: number | null;
  attributes: Record<string, unknown>;
  supports_scheduled: boolean;
  supports_available_now: boolean;
  rating_average: number;
  rating_count: number;
  order_count: number;
  photos: { id: string; file_url: string; caption: string | null; display_order: number; is_primary: boolean }[];
  faqs: FaqDto[];
  option_prices: OptionPriceDto[];
  created_at: string;
  updated_at: string;
  // Hanya tampilan owner.
  status?: string;
  attributes_need_update?: boolean;
  workers?: { id: string; display_name: string }[];
}

export const toFaqDto = (faq: ListingRow['faqs'][number]): FaqDto => ({
  id: faq.id,
  question: faq.question,
  answer: faq.answer,
  display_order: faq.displayOrder,
});

function optionPrices(row: ListingRow, owner: boolean): OptionPriceDto[] {
  const defs = new Map(
    row.subcategory.attributes.filter((def) => def.attributeRole === 'OPTION').map((def) => [def.attributeKey, def]),
  );
  const result: (OptionPriceDto & { order: number })[] = [];

  for (const price of row.optionPrices) {
    const def = defs.get(price.attributeKey);
    if (!def) continue;
    if (!owner) {
      const valueActive =
        price.optionValue === null ||
        ((def.options as AttributeOption[] | null) ?? []).some((o) => o.value === price.optionValue && o.is_active);
      if (!price.isOffered || !def.isActive || !valueActive) continue;
    }
    result.push({
      order: def.displayOrder,
      attribute_key: price.attributeKey,
      label: def.label,
      data_type: def.dataType,
      pricing_mode: def.pricingMode,
      unit: def.unit,
      option_value: price.optionValue,
      price_delta: price.priceDelta.toNumber(),
      ...(owner ? { is_offered: price.isOffered } : {}),
    });
  }

  return result
    .sort((a, b) => a.order - b.order || a.attribute_key.localeCompare(b.attribute_key) || (a.option_value ?? '').localeCompare(b.option_value ?? ''))
    .map(({ order: _order, ...dto }) => dto);
}

export function toListingDto(row: ListingRow, view: 'public' | 'owner'): ListingDto {
  const owner = view === 'owner';
  return {
    id: row.id,
    subcategory: { id: row.subcategoryId, name: row.subcategory.name },
    provider: {
      id: row.providerProfile.id,
      business_name: row.providerProfile.businessName,
      provider_type: row.providerProfile.providerType,
      rating_average: row.providerProfile.ratingAverage.toNumber(),
      rating_count: row.providerProfile.ratingCount,
    },
    title: row.title,
    description: row.description,
    price: row.price.toNumber(),
    price_unit: row.priceUnit,
    estimated_duration_minutes: row.estimatedDurationMinutes,
    attributes: (row.attributes as Record<string, unknown> | null) ?? {},
    supports_scheduled: row.supportsScheduled,
    supports_available_now: row.supportsAvailableNow,
    rating_average: row.ratingAverage.toNumber(),
    rating_count: row.ratingCount,
    order_count: row.orderCount,
    photos: row.photos.map((photo) => ({
      id: photo.id,
      file_url: photo.fileUrl,
      caption: photo.caption,
      display_order: photo.displayOrder,
      is_primary: photo.isPrimary,
    })),
    faqs: row.faqs.map(toFaqDto),
    option_prices: optionPrices(row, owner),
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    ...(owner
      ? {
          status: row.status,
          attributes_need_update: row.attributesNeedUpdate,
          // Pelamar PENDING juga punya baris (usulan D52), tapi yang berlaku
          // hanya pekerja ACTIVE.
          workers: row.workers
            .filter(({ worker }) => worker.membershipStatus === 'ACTIVE')
            .map(({ worker }) => ({ id: worker.id, display_name: worker.displayName })),
        }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Kartu hasil pencarian (GET /listings). Harga "mulai dari", tanpa delta opsi.
// ---------------------------------------------------------------------------

export const CARD_SELECT = {
  id: true,
  title: true,
  price: true,
  priceUnit: true,
  estimatedDurationMinutes: true,
  supportsScheduled: true,
  supportsAvailableNow: true,
  ratingAverage: true,
  ratingCount: true,
  orderCount: true,
  subcategory: { select: { id: true, name: true } },
  providerProfile: { select: { id: true, businessName: true, ratingAverage: true, ratingCount: true } },
  photos: { where: { isPrimary: true }, select: { fileUrl: true }, take: 1 },
} as const satisfies Prisma.ListingSelect;

export type ListingCardRow = Prisma.ListingGetPayload<{ select: typeof CARD_SELECT }>;

export interface ListingCardDto {
  id: string;
  title: string;
  price: number;
  price_unit: string;
  estimated_duration_minutes: number | null;
  supports_scheduled: boolean;
  supports_available_now: boolean;
  rating_average: number;
  rating_count: number;
  order_count: number;
  subcategory: { id: string; name: string };
  provider: { id: string; business_name: string | null; rating_average: number; rating_count: number };
  primary_photo_url: string | null;
  /** Dari basis usaha, atau dari pekerja online terdekat kalau available_now (D98). */
  distance_km: number | null;
}

export function toListingCardDto(row: ListingCardRow, distanceKm: number | null): ListingCardDto {
  return {
    id: row.id,
    title: row.title,
    price: row.price.toNumber(),
    price_unit: row.priceUnit,
    estimated_duration_minutes: row.estimatedDurationMinutes,
    supports_scheduled: row.supportsScheduled,
    supports_available_now: row.supportsAvailableNow,
    rating_average: row.ratingAverage.toNumber(),
    rating_count: row.ratingCount,
    order_count: row.orderCount,
    subcategory: row.subcategory,
    provider: {
      id: row.providerProfile.id,
      business_name: row.providerProfile.businessName,
      rating_average: row.providerProfile.ratingAverage.toNumber(),
      rating_count: row.providerProfile.ratingCount,
    },
    primary_photo_url: row.photos[0]?.fileUrl ?? null,
    distance_km: distanceKm === null ? null : Math.round(distanceKm * 100) / 100,
  };
}
