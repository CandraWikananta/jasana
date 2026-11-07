/**
 * GET /listings, pencarian dan filter (Fase 5, PRD 4.3).
 *
 *   D96   hanya listing ACTIVE, belum dihapus, sub-kategori dan kategorinya
 *         aktif, provider VERIFIED
 *   D98   client wajib berada di dalam `service_radius_km` usaha. Jarak dari
 *         basis usaha, atau dari pekerja online terdekat kalau available_now
 *   D6    bounding box lebih dulu (index), baru Haversine presisi
 *   D45   available_now turunan: pekerja terpetakan, ACTIVE, bersedia
 *         ditugaskan, online, dan tidak in-flight
 *   H18   filter SPEC lewat `attributes @>`, terlayani index GIN
 *
 * Query mentah (usulan D baru): Prisma tidak bisa menghasilkan `@>` pada
 * kolom JSONB utuh, Haversine, maupun ORDER BY jarak. Seluruh nilai dari
 * query string masuk sebagai parameter terikat `Prisma.sql`, tidak ada
 * `Prisma.raw`, dan ORDER BY hanya dari daftar putih `SORTS`.
 */

import { prisma, Prisma } from '@jasana/database';
import { Errors } from '../../lib/errors';
import { boundingBox, haversineKmSql } from '../../lib/haversine';
import { currentOnlineWorkerIds } from '../../realtime/presence';
import { pageMeta, skipTake, type Paginated } from '../../lib/pagination';
import { parseAttributeFilters, type AttributeFilters } from '../catalog/attribute-rules';
import { toDefinition } from '../catalog/catalog.mapper';
import { CARD_SELECT, toListingCardDto, type ListingCardDto } from './listings.mapper';
import type { SEARCH_SORTS, SearchListingsQuery } from './listings.schema';

const SORTS: Record<(typeof SEARCH_SORTS)[number], Prisma.Sql> = {
  distance: Prisma.sql`distance_km ASC`,
  price_asc: Prisma.sql`l.price ASC`,
  price_desc: Prisma.sql`l.price DESC`,
  rating: Prisma.sql`l.rating_average DESC, l.rating_count DESC`,
  popular: Prisma.sql`l.order_count DESC`,
};

/** Sama persis dengan predikat `uniq_inflight_order_per_worker` (H4). */
const INFLIGHT_ORDER = Prisma.sql`(o.status IN ('ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_VERIFICATION')
  OR (o.booking_mode = 'AVAILABLE_NOW' AND o.status IN ('ACCEPTED', 'PAID')))`;

/** `%` dan `_` dari client dicari sebagai huruf biasa, bukan wildcard. */
const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;

async function attributeFilters(query: SearchListingsQuery): Promise<AttributeFilters | null> {
  if (!query.attr || Object.keys(query.attr).length === 0 || !query.subcategory_id) return null;
  const rows = await prisma.subcategoryAttribute.findMany({ where: { subcategoryId: query.subcategory_id } });
  const { filters, errors } = parseAttributeFilters(rows.map(toDefinition), query.attr);
  if (errors.length > 0) throw Errors.validation(errors);
  return filters;
}

/**
 * Kotak memakai SATU radius untuk semua usaha: `radius_km` kalau diisi,
 * dibatasi radius layanan terbesar provider VERIFIED. Karena tidak ada usaha
 * yang radiusnya melebihi itu, kotaknya pasti memuat setiap usaha yang
 * mungkin lolos. Saringan per usaha dikerjakan Haversine sesudahnya.
 *
 * shortcut: satu usaha beradius sangat besar melebarkan kotak untuk semua
 * pencarian. Upgrade ke kotak per kelompok radius kalau EXPLAIN memburuk.
 */
async function boxRadiusKm(radiusKm: number | undefined): Promise<number> {
  const { _max } = await prisma.providerProfile.aggregate({
    where: { verificationStatus: 'VERIFIED' },
    _max: { serviceRadiusKm: true },
  });
  return Math.min(radiusKm ?? Infinity, _max.serviceRadiusKm?.toNumber() ?? 0);
}

/** Kolom koordinat Decimal dibandingkan dengan parameter `::numeric`, supaya index tetap terpakai. */
function inBox(latCol: Prisma.Sql, lngCol: Prisma.Sql, box: ReturnType<typeof boundingBox>): Prisma.Sql {
  return Prisma.sql`${latCol} BETWEEN ${box.minLat}::numeric AND ${box.maxLat}::numeric
    AND ${lngCol} BETWEEN ${box.minLng}::numeric AND ${box.maxLng}::numeric`;
}

interface SearchSql {
  /** Halaman id beserta jarak dan total. */
  page: Prisma.Sql;
  /** Total tanpa LIMIT, untuk halaman di luar jangkauan. */
  count: Prisma.Sql;
}

/** Diekspor untuk `scripts/bench-search.ts`, supaya EXPLAIN memakai SQL yang sama persis. */
export async function buildSearchSql(query: SearchListingsQuery): Promise<SearchSql> {
  const located = query.lat !== undefined && query.lng !== undefined;
  // Saling lepas, jadi dijalankan bersamaan: satu perjalanan jaringan lebih sedikit.
  const [filters, boxKm, onlineIds] = await Promise.all([
    attributeFilters(query),
    located ? boxRadiusKm(query.radius_km) : 0,
    query.available_now ? currentOnlineWorkerIds() : [],
  ]);
  const conditions: Prisma.Sql[] = [
    Prisma.sql`l.status = 'ACTIVE'`,
    Prisma.sql`l.deleted_at IS NULL`,
    Prisma.sql`s.is_active`,
    Prisma.sql`c.is_active`,
    Prisma.sql`p.verification_status = 'VERIFIED'`,
  ];

  if (query.subcategory_id) conditions.push(Prisma.sql`l.subcategory_id = ${query.subcategory_id}::uuid`);
  if (query.category_id) conditions.push(Prisma.sql`s.category_id = ${query.category_id}::uuid`);
  if (query.price_min !== undefined) conditions.push(Prisma.sql`l.price >= ${query.price_min}::numeric`);
  if (query.price_max !== undefined) conditions.push(Prisma.sql`l.price <= ${query.price_max}::numeric`);
  if (query.booking_mode === 'SCHEDULED') conditions.push(Prisma.sql`l.supports_scheduled`);
  if (query.booking_mode === 'AVAILABLE_NOW' || query.available_now) conditions.push(Prisma.sql`l.supports_available_now`);
  if (query.q) {
    const pattern = likePattern(query.q);
    conditions.push(Prisma.sql`(l.title ILIKE ${pattern} OR l.description ILIKE ${pattern})`);
  }

  if (filters && Object.keys(filters.spec).length > 0) {
    // Seluruh SPEC dalam satu objek, satu parameter, satu probe GIN.
    conditions.push(Prisma.sql`l.attributes @> ${JSON.stringify(filters.spec)}::jsonb`);
  }
  for (const option of filters?.options ?? []) {
    const value =
      option.option_value === null ? Prisma.sql`o.option_value IS NULL` : Prisma.sql`o.option_value = ${option.option_value}`;
    const offered = Prisma.sql`SELECT 1 FROM listing_option_prices o
      WHERE o.listing_id = l.id AND o.attribute_key = ${option.attribute_key} AND ${value} AND o.is_offered`;
    conditions.push(option.offered ? Prisma.sql`EXISTS (${offered})` : Prisma.sql`NOT EXISTS (${offered})`);
  }

  let distance = Prisma.sql`NULL::float8`;
  let online = Prisma.empty;
  let onlineJoin = Prisma.empty;

  if (located) {
    const { lat, lng } = query as { lat: number; lng: number };
    const box = boundingBox(lat, lng, boxKm);
    const limit =
      query.radius_km !== undefined
        ? Prisma.sql`LEAST(p.service_radius_km::float8, ${query.radius_km}::float8)`
        : Prisma.sql`p.service_radius_km::float8`;

    if (query.available_now) {
      const km = haversineKmSql(Prisma.sql`pw.current_latitude`, Prisma.sql`pw.current_longitude`, lat, lng);
      online = onlineWorkersCte(Prisma.sql`min(${km})`, inBox(Prisma.sql`pw.current_latitude`, Prisma.sql`pw.current_longitude`, box), onlineIds);
      distance = Prisma.sql`w.km`;
    } else {
      conditions.push(inBox(Prisma.sql`p.base_latitude`, Prisma.sql`p.base_longitude`, box));
      distance = haversineKmSql(Prisma.sql`p.base_latitude`, Prisma.sql`p.base_longitude`, lat, lng);
    }
    conditions.push(Prisma.sql`${distance} <= ${limit}`);
  } else if (query.available_now) {
    online = onlineWorkersCte(Prisma.sql`NULL::float8`, Prisma.sql`TRUE`, onlineIds);
  }
  if (query.available_now) onlineJoin = Prisma.sql`JOIN online w ON w.listing_id = l.id`;

  const from = Prisma.sql`FROM listings l
    JOIN subcategories s ON s.id = l.subcategory_id
    JOIN categories c ON c.id = s.category_id
    JOIN provider_profiles p ON p.id = l.provider_profile_id
    ${onlineJoin}
    WHERE ${Prisma.join(conditions, ' AND ')}`;
  const sort = SORTS[query.sort ?? (located ? 'distance' : 'rating')];
  const { skip, take } = skipTake(query);

  return {
    page: Prisma.sql`${online}
      SELECT l.id, ${distance} AS distance_km, count(*) OVER () AS total
      ${from}
      ORDER BY ${sort}, l.id
      LIMIT ${take} OFFSET ${skip}`,
    count: Prisma.sql`${online} SELECT count(*) AS total ${from}`,
  };
}

/**
 * Pekerja yang bisa mengambil order mendadak sekarang (D45), per listing.
 * Online = toggle menyala DAN terhubung Socket.IO atau denyutnya belum basi
 * (D65, D99). Daftar online masuk sebagai parameter terikat (H49).
 */
function onlineWorkersCte(km: Prisma.Sql, where: Prisma.Sql, onlineIds: string[]): Prisma.Sql {
  return Prisma.sql`WITH online AS (
    SELECT wl.listing_id, ${km} AS km
    FROM provider_workers pw
    JOIN worker_listings wl ON wl.worker_id = pw.id
    WHERE pw.membership_status = 'ACTIVE' AND pw.accepts_assignments AND pw.is_available
      AND pw.id = ANY(${onlineIds}::uuid[])
      AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.assigned_worker_id = pw.id AND ${INFLIGHT_ORDER})
      AND ${where}
    GROUP BY wl.listing_id
  )`;
}

export async function searchListings(query: SearchListingsQuery): Promise<Paginated<ListingCardDto>> {
  const sql = await buildSearchSql(query);
  const rows = await prisma.$queryRaw<{ id: string; distance_km: number | null; total: bigint }[]>(sql.page);

  let total = Number(rows[0]?.total ?? 0);
  if (rows.length === 0 && query.page > 1) {
    const [counted] = await prisma.$queryRaw<{ total: bigint }[]>(sql.count);
    total = Number(counted?.total ?? 0);
  }

  const cards = await prisma.listing.findMany({ where: { id: { in: rows.map((row) => row.id) } }, select: CARD_SELECT });
  const byId = new Map(cards.map((card) => [card.id, card]));
  const items = rows.flatMap((row) => {
    const card = byId.get(row.id);
    return card ? [toListingCardDto(card, row.distance_km)] : [];
  });

  return { items, meta: pageMeta(query, total) };
}
