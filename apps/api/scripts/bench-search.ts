/**
 * Bukti kriteria selesai Fase 5: EXPLAIN dan latensi kasar GET /listings.
 *
 *   npx tsx apps/api/scripts/bench-search.ts            (dari akar repo)
 *   BENCH_PROVIDERS=20000 BENCH_KEEP=1 npx tsx ...      (data lebih besar, tidak dihapus)
 *
 * Basis datanya TEST_DATABASE_URL (lewat tests/setup.ts, yang menolak nama
 * basis data tanpa kata "test"). Data massal dibuat dengan generate_series,
 * id deterministik md5, ditandai email `@bench.jasana.test` dan slug
 * `uji-bench-`, lalu dihapus di akhir.
 *
 * EXPLAIN memakai `buildSearchSql`, SQL yang sama persis dengan service.
 * Latensi diukur lewat HTTP sungguhan ke `createApp()` di port acak. Setiap
 * skenario memakai app baru supaya limiter global (100/menit per IP) tidak
 * ikut terukur, itu urusan H91.
 */

import '../tests/setup';
import type { AddressInfo } from 'node:net';
import { prisma, Prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { buildSearchSql } from '../src/modules/listings/listing-search.service';
import { presence } from '../src/realtime/presence';
import { searchListingsQuerySchema } from '../src/modules/listings/listings.schema';

// Skrip ini menulis lalu menghapus ratusan ribu baris: hanya untuk basis data uji di mesin ini.
// tests/setup.ts sudah mengarahkan DATABASE_URL ke TEST_DATABASE_URL dan mewajibkan kata "test".
const target = process.env.TEST_DATABASE_URL?.trim();
const host = target ? new URL(target).hostname : '';
if (!target || !['localhost', '127.0.0.1'].includes(host)) {
  console.error(`bench-search hanya boleh ke TEST_DATABASE_URL di localhost atau 127.0.0.1 (sekarang: ${host || 'kosong'}).`);
  process.exit(1);
}

const P = Number(process.env.BENCH_PROVIDERS ?? 10_000);
const RUNS = 50;
const DENPASAR = { lat: '-8.6725', lng: '115.234' };

async function cleanup() {
  await prisma.$executeRaw`DELETE FROM orders WHERE client_id = md5('bench-user-0')::uuid`;
  await prisma.$executeRaw`DELETE FROM listings WHERE provider_profile_id IN (SELECT id FROM provider_profiles WHERE business_name LIKE 'Bench %')`;
  await prisma.$executeRaw`DELETE FROM provider_workers WHERE provider_profile_id IN (SELECT id FROM provider_profiles WHERE business_name LIKE 'Bench %')`;
  await prisma.$executeRaw`DELETE FROM provider_profiles WHERE business_name LIKE 'Bench %'`;
  await prisma.$executeRaw`DELETE FROM subcategories WHERE slug LIKE 'uji-bench-%'`;
  await prisma.$executeRaw`DELETE FROM categories WHERE slug LIKE 'uji-bench-%'`;
  await prisma.$executeRaw`DELETE FROM users WHERE email LIKE '%@bench.jasana.test'`;
}

/** Satu transaksi, satu koneksi: `setseed` membuat data acaknya sama di setiap putaran. */
async function seed() {
  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe('SELECT setseed(0.42)');
      for (const sql of seedStatements()) await tx.$executeRawUnsafe(sql); // SQL konstan skrip ini, tanpa input pengguna
    },
    { timeout: 600_000, maxWait: 60_000 },
  );
  await prisma.$executeRawUnsafe('ANALYZE users, provider_profiles, provider_workers, worker_listings, listings, listing_option_prices, orders, subcategories, categories');
}

function seedStatements(): string[] {
  const statements: string[] = [];
  const run = (sql: string) => statements.push(sql);
  const opts = (values: string[]) => JSON.stringify(values.map((value) => ({ value, is_active: true })));

  // Pengguna: 0 = client order, 1..P pemilik, P+1..3P pekerja tambahan.
  run(`INSERT INTO users (id, full_name, email, phone, password_hash, updated_at)
    SELECT md5('bench-user-' || g)::uuid, 'Bench ' || g, 'b' || g || '@bench.jasana.test',
           '+6290' || lpad(g::text, 9, '0'), 'x', now()
    FROM generate_series(0, ${3 * P}) g`);

  run(`INSERT INTO categories (id, name, slug, updated_at)
    VALUES (md5('bench-cat')::uuid, 'Bench Kategori', 'uji-bench-kat', now())`);
  run(`INSERT INTO subcategories (id, category_id, name, slug, updated_at)
    SELECT md5('bench-sub-' || i)::uuid, md5('bench-cat')::uuid, 'Bench Sub ' || i, 'uji-bench-sub-' || i, now()
    FROM generate_series(1, 12) i`);
  run(`INSERT INTO subcategory_attributes
      (id, subcategory_id, attribute_key, label, data_type, attribute_role, pricing_mode, options, is_filterable, updated_at)
    SELECT gen_random_uuid(), md5('bench-sub-' || i)::uuid, a.key, a.key, a.type::attribute_data_type,
           a.role::attribute_role, a.mode::pricing_mode, a.options::jsonb, true, now()
    FROM generate_series(1, 12) i CROSS JOIN (VALUES
      ('sumber_air', 'SELECT', 'SPEC', 'NONE', '${opts(['V1', 'V2', 'V3', 'V4', 'V5', 'V6'])}'),
      ('merek', 'MULTISELECT', 'SPEC', 'NONE', '${opts(['Daikin', 'Panasonic', 'LG', 'Sharp', 'Samsung', 'Gree', 'Polytron'])}'),
      ('jenis', 'SELECT', 'OPTION', 'FLAT_PER_OPTION', '${opts(['Sedan', 'SUV'])}')
    ) AS a(key, type, role, mode, options)`);

  // 30 persen usaha di Bali, sisanya tersebar di Indonesia. Radius 3 sampai 30 km.
  run(`INSERT INTO provider_profiles
      (id, user_id, business_name, verification_status, base_latitude, base_longitude, service_radius_km, updated_at)
    SELECT md5('bench-prov-' || g)::uuid, md5('bench-user-' || g)::uuid, 'Bench ' || g, 'VERIFIED',
           CASE WHEN g % 10 < 3 THEN -8.85 + random() * 0.75 ELSE -10 + random() * 15 END,
           CASE WHEN g % 10 < 3 THEN 114.45 + random() * 1.25 ELSE 95 + random() * 45 END,
           3 + floor(random() * 28), now()
    FROM generate_series(1, ${P}) g`);

  // Tiga pekerja per usaha (pemilik + dua), 30 persen online, di sekitar basisnya.
  run(`INSERT INTO provider_workers
      (id, provider_profile_id, user_id, display_name, is_owner, membership_status, accepts_assignments,
       is_available, current_latitude, current_longitude, location_updated_at, updated_at)
    SELECT md5('bench-worker-' || g || '-' || k)::uuid, p.id,
           CASE WHEN k = 0 THEN md5('bench-user-' || g)::uuid ELSE md5('bench-user-' || (${P} + (g - 1) * 2 + k))::uuid END,
           'Pekerja ' || g || '-' || k, k = 0, 'ACTIVE', true, random() < 0.3,
           p.base_latitude + (random() - 0.5) * 0.1, p.base_longitude + (random() - 0.5) * 0.1, now(), now()
    FROM generate_series(1, ${P}) g CROSS JOIN generate_series(0, 2) k
    JOIN provider_profiles p ON p.id = md5('bench-prov-' || g)::uuid`);

  // Sepuluh listing per usaha, 85 persen ACTIVE.
  run(`INSERT INTO listings
      (id, provider_profile_id, subcategory_id, title, description, price, estimated_duration_minutes, attributes,
       supports_scheduled, supports_available_now, status, rating_average, rating_count, order_count, updated_at)
    SELECT md5('bench-listing-' || g || '-' || j)::uuid, md5('bench-prov-' || g)::uuid,
           md5('bench-sub-' || (1 + (g * 7 + j) % 12))::uuid, 'Jasa ' || g || '-' || j, 'Deskripsi jasa',
           50000 + floor(random() * 500) * 1000, 60,
           jsonb_build_object(
             'sumber_air', 'V' || (1 + floor(random() * 6))::int,
             'merek', jsonb_build_array((ARRAY['Daikin','Panasonic','LG','Sharp','Samsung','Gree','Polytron'])[1 + floor(random() * 7)::int])),
           true, random() < 0.5, (CASE WHEN random() < 0.85 THEN 'ACTIVE' ELSE 'DRAFT' END)::listing_status,
           round((random() * 5)::numeric, 2), floor(random() * 50), floor(random() * 100), now()
    FROM generate_series(1, ${P}) g CROSS JOIN generate_series(1, 10) j`);

  run(`INSERT INTO worker_listings (id, worker_id, listing_id)
    SELECT gen_random_uuid(), md5('bench-worker-' || g || '-' || k)::uuid, md5('bench-listing-' || g || '-' || j)::uuid
    FROM generate_series(1, ${P}) g CROSS JOIN generate_series(0, 2) k CROSS JOIN generate_series(1, 10) j`);

  run(`INSERT INTO listing_option_prices (id, listing_id, attribute_key, option_value, price_delta, is_offered)
    SELECT gen_random_uuid(), id, 'jenis', CASE WHEN random() < 0.5 THEN 'Sedan' ELSE 'SUV' END, 20000, true
    FROM listings WHERE title LIKE 'Jasa %'`);

  // Sepersepuluh usaha punya satu pekerja in-flight.
  run(`INSERT INTO orders
      (id, order_number, client_id, provider_profile_id, assigned_worker_id, listing_id, booking_mode, status, scheduled_at,
       service_address, service_latitude, service_longitude, location_source, snapshot_listing_title,
       listing_base_amount, platform_fee, total_amount, provider_earning, updated_at)
    SELECT gen_random_uuid(), 'ORD-BENCH-' || g, md5('bench-user-0')::uuid, md5('bench-prov-' || g)::uuid,
           md5('bench-worker-' || g || '-1')::uuid, md5('bench-listing-' || g || '-1')::uuid, 'SCHEDULED', 'IN_PROGRESS', now(),
           'Jl. Bench', -8.67, 115.23, 'MAP_PIN', 'Jasa', 100000, 10000, 100000, 90000, now()
    FROM generate_series(10, ${P}, 10) g`);

  return statements;
}

const SCENARIOS: { name: string; target: number; query: Record<string, string> }[] = [
  { name: '(a0) tanpa filter apa pun', target: 300, query: {} },
  { name: '(a) biasa, subcategory_id', target: 300, query: { subcategory_id: '', sort: 'rating' } },
  { name: '(b) lokasi dari basis usaha', target: 500, query: { ...DENPASAR } },
  { name: '(c) attr SPEC', target: 500, query: { subcategory_id: '', 'attr[sumber_air]': 'V3', 'attr[merek]': 'LG' } },
  { name: '(d) available_now + lokasi', target: 600, query: { available_now: 'true', ...DENPASAR } },
  { name: '(d2) available_now + lokasi + radius_km=5', target: 600, query: { available_now: 'true', ...DENPASAR, radius_km: '5' } },
  { name: '(e) lokasi + attr SPEC + OPTION', target: 500, query: { subcategory_id: '', ...DENPASAR, 'attr[sumber_air]': 'V3', 'attr[jenis]': 'SUV' } },
];

/** `attr[k]` di query string jadi objek, sama seperti qs di Express. */
function parsed(query: Record<string, string>) {
  const attr: Record<string, string> = {};
  const rest: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    const match = /^attr\[(.+)\]$/.exec(key);
    if (match) attr[match[1]!] = value;
    else rest[key] = value;
  }
  return searchListingsQuerySchema.parse({ ...rest, ...(Object.keys(attr).length ? { attr } : {}) });
}

async function latency(query: Record<string, string>) {
  const server = createApp().listen(0);
  const { port } = server.address() as AddressInfo;
  const url = `http://127.0.0.1:${port}/api/v1/listings?${new URLSearchParams(query)}`;
  const times: number[] = [];
  let total = 0;
  try {
    for (let i = 0; i < RUNS + 5; i++) {
      const start = performance.now();
      const res = await fetch(url);
      const body = (await res.json()) as { meta?: { total: number } };
      if (res.status !== 200) throw new Error(`${res.status} ${JSON.stringify(body)}`);
      if (i >= 5) times.push(performance.now() - start); // 5 pemanasan
      total = body.meta?.total ?? 0;
    }
  } finally {
    server.close();
  }
  times.sort((a, b) => a - b);
  const at = (q: number) => times[Math.min(times.length - 1, Math.ceil(q * times.length) - 1)]!.toFixed(1);
  return { p50: at(0.5), p95: at(0.95), max: times.at(-1)!.toFixed(1), total };
}

async function main() {
  console.log(`Basis data: ${new URL(process.env.DATABASE_URL!).pathname.slice(1)}, ${P} usaha`);
  await cleanup();
  const started = Date.now();
  await seed();
  const counts = await prisma.$queryRaw<{ listings: bigint; workers: bigint; providers: bigint }[]>`
    SELECT (SELECT count(*) FROM listings) AS listings, (SELECT count(*) FROM provider_workers) AS workers,
           (SELECT count(*) FROM provider_profiles) AS providers`;
  console.log(`Seed ${((Date.now() - started) / 1000).toFixed(1)} detik:`, counts[0]);

  // H92: pekerja seed yang toggle-nya menyala dianggap terhubung (proses yang sama dengan API).
  const online = await prisma.$queryRaw<{ id: string }[]>`
    SELECT pw.id::text FROM provider_workers pw JOIN provider_profiles p ON p.id = pw.provider_profile_id
    WHERE p.business_name LIKE 'Bench %' AND pw.is_available`;
  online.forEach(({ id }) => presence.touch(id));
  console.log(`Pekerja online: ${online.length}`);

  const [{ id: subId }] = await prisma.$queryRaw<[{ id: string }]>(Prisma.sql`SELECT md5('bench-sub-1')::uuid::text AS id`);
  for (const scenario of SCENARIOS) {
    if ('subcategory_id' in scenario.query) scenario.query.subcategory_id = subId;
    const sql = await buildSearchSql(parsed(scenario.query));
    const plan = await prisma.$queryRaw<{ 'QUERY PLAN': string }[]>(Prisma.sql`EXPLAIN (ANALYZE, BUFFERS) ${sql.page}`);
    const text = plan.map((row) => row['QUERY PLAN']).join('\n');
    const indexes = [...new Set(text.match(/(idx_[a-z_]+|[a-z_]+_pkey|[a-z_]+_idx)/g) ?? [])];
    const seqScans = [...new Set([...text.matchAll(/Seq Scan on (\w+)/g)].map((m) => m[1]))];
    const timing = await latency(scenario.query);

    console.log(`\n=== ${scenario.name} ===`);
    console.log(`query: ${new URLSearchParams(scenario.query)}`);
    console.log(`index: ${indexes.join(', ') || '-'}`);
    console.log(`seq scan: ${seqScans.join(', ') || '-'}`);
    console.log(`hasil: ${timing.total}, HTTP p50 ${timing.p50} ms, p95 ${timing.p95} ms, maks ${timing.max} ms (target p95 < ${scenario.target})`);
    if (process.env.BENCH_PLAN !== '0') console.log(text);
  }

  if (!process.env.BENCH_KEEP) await cleanup();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
