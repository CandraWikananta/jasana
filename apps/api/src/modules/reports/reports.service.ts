/**
 * Laporan admin (D180, usulan D200 sampai D203).
 *
 * ATURAN PERIODE: setiap angka dihitung pada hari kalender WITA KEJADIANNYA SENDIRI. Order masuk
 * dari created_at, dibayar dari paid_at, selesai dari completed_at, pendapatan dari settled_at
 * (sama dengan V4), ditolak/dibatalkan dari cancelled_at, sedangkan EXPIRED, PAYMENT_EXPIRED,
 * dan REFUNDED yang tidak punya kolom waktu dari order_status_histories (usulan D203). SLA miss
 * penyedia dari response_deadline_at, SLA miss pekerja dari order_offers.sla_missed_at,
 * check-in dari order_checkins.created_at.
 *
 * SUMBER SAMA: ekspresi pendapatan persis V4, check-in persis V2, dan uang yang menyangkut
 * penyedia dibaca dari ledger `wallet_transactions` lewat order_id, bukan lewat waktu ledger.
 * Kecocokannya dibuktikan test (admin-reports.test.ts).
 *
 * Usulan D202: SELECT mentah lewat $queryRaw dan Prisma.sql, karena pengelompokan per hari
 * WITA adalah ekspresi yang tidak bisa dinyatakan Prisma groupBy. Seluruh nilai parameter
 * terikat, ORDER BY tetap di kode, tidak ada Prisma.raw dan $queryRawUnsafe.
 */

import { prisma, Prisma } from '@jasana/database';
import { witaPeriod, type WitaPeriod } from '../../lib/wita';
import type { PaginationMeta } from '@jasana/shared';
import type { PagedPeriodQuery, PeriodQuery } from './reports.schema';

/** Ekspresi hari WITA. WITA UTC+8 tetap tanpa DST, sama dengan lib/wita.ts. */
const day = (column: Prisma.Sql) => Prisma.sql`((${column}) AT TIME ZONE 'Asia/Makassar')::date`;

interface Bounds {
  start: Prisma.Sql;
  end: Prisma.Sql;
}

/** Batas UTC sebagai teks ISO yang dicast eksplisit, supaya tidak bergantung zona sesi. */
function bounds(period: WitaPeriod): Bounds {
  return {
    start: Prisma.sql`${period.start.toISOString()}::timestamptz`,
    end: Prisma.sql`${period.end.toISOString()}::timestamptz`,
  };
}

const inPeriod = (column: Prisma.Sql, b: Bounds) => Prisma.sql`${column} >= ${b.start} AND ${column} < ${b.end}`;

const num = (value: unknown): number => (value === null || value === undefined ? 0 : Number(value));
const numOrNull = (value: unknown): number | null => (value === null || value === undefined ? null : Number(value));
const percent = (part: number, whole: number): number | null => (whole === 0 ? null : Math.round((10000 * part) / whole) / 100);

export interface PeriodDto {
  from: string;
  to: string;
  timezone: 'WITA';
  days: number;
}

const periodDto = (p: WitaPeriod): PeriodDto => ({ from: p.from, to: p.to, timezone: 'WITA', days: p.days });

function sumRows<T extends { tanggal: string }>(rows: T[], keys: (keyof T)[]): Record<string, number> {
  return Object.fromEntries(keys.map((key) => [key, rows.reduce((total, row) => total + (row[key] as number), 0)]));
}

/** Sumbu hari, termasuk hari tanpa kejadian. */
const daysSeries = (p: WitaPeriod) =>
  Prisma.sql`SELECT d::date AS tanggal FROM generate_series(${p.from}::date, ${p.to}::date, interval '1 day') AS d`;

const dateKey = (value: Date): string => value.toISOString().slice(0, 10);

// ============================================================
// /admin/reports/transactions
// ============================================================

const TRANSACTION_KEYS = [
  'order_masuk',
  'order_masuk_available_now',
  'order_masuk_scheduled',
  'order_dibayar',
  'nilai_dibayar',
  'order_selesai',
  'order_batal',
  'order_direfund',
] as const;

export type TransactionRow = { tanggal: string } & Record<(typeof TRANSACTION_KEYS)[number], number>;

export async function transactionsReport(query: PeriodQuery) {
  const p = witaPeriod(query.from, query.to);
  const b = bounds(p);
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    WITH hari AS (${daysSeries(p)}),
    masuk AS (
      SELECT ${day(Prisma.sql`created_at`)} AS tanggal,
             COUNT(*) AS order_masuk,
             COUNT(*) FILTER (WHERE booking_mode = 'AVAILABLE_NOW') AS order_masuk_available_now,
             COUNT(*) FILTER (WHERE booking_mode = 'SCHEDULED')     AS order_masuk_scheduled
      FROM orders WHERE ${inPeriod(Prisma.sql`created_at`, b)} GROUP BY 1
    ),
    dibayar AS (
      SELECT ${day(Prisma.sql`paid_at`)} AS tanggal, COUNT(*) AS order_dibayar, SUM(total_amount) AS nilai_dibayar
      FROM orders WHERE ${inPeriod(Prisma.sql`paid_at`, b)} GROUP BY 1
    ),
    selesai AS (
      SELECT ${day(Prisma.sql`completed_at`)} AS tanggal, COUNT(*) AS order_selesai
      FROM orders WHERE ${inPeriod(Prisma.sql`completed_at`, b)} GROUP BY 1
    ),
    batal AS (
      SELECT tanggal, COUNT(*) AS order_batal FROM (
        -- REJECTED dan CANCELLED mengisi cancelled_at, termasuk CANCELLED yang lalu di-refund.
        SELECT ${day(Prisma.sql`cancelled_at`)} AS tanggal
        FROM orders WHERE ${inPeriod(Prisma.sql`cancelled_at`, b)}
        UNION ALL
        SELECT ${day(Prisma.sql`created_at`)}
        FROM order_status_histories
        WHERE to_status IN ('EXPIRED', 'PAYMENT_EXPIRED') AND ${inPeriod(Prisma.sql`created_at`, b)}
      ) AS x GROUP BY 1
    ),
    direfund AS (
      SELECT ${day(Prisma.sql`created_at`)} AS tanggal, COUNT(*) AS order_direfund
      FROM order_status_histories
      WHERE to_status = 'REFUNDED' AND ${inPeriod(Prisma.sql`created_at`, b)} GROUP BY 1
    )
    SELECT h.tanggal, m.order_masuk, m.order_masuk_available_now, m.order_masuk_scheduled,
           d.order_dibayar, d.nilai_dibayar, s.order_selesai, c.order_batal, r.order_direfund
    FROM hari h
    LEFT JOIN masuk m    ON m.tanggal = h.tanggal
    LEFT JOIN dibayar d  ON d.tanggal = h.tanggal
    LEFT JOIN selesai s  ON s.tanggal = h.tanggal
    LEFT JOIN batal c    ON c.tanggal = h.tanggal
    LEFT JOIN direfund r ON r.tanggal = h.tanggal
    ORDER BY h.tanggal
  `;
  const mapped = rows.map(
    (row) => ({ tanggal: dateKey(row.tanggal as Date), ...Object.fromEntries(TRANSACTION_KEYS.map((key) => [key, num(row[key])])) }) as TransactionRow,
  );
  return { period: periodDto(p), rows: mapped, totals: sumRows(mapped, [...TRANSACTION_KEYS]) };
}

// ============================================================
// /admin/reports/revenue
// ============================================================

const REVENUE_KEYS = [
  'jumlah_order',
  'nilai_harga_dasar',
  'nilai_opsi_tambahan',
  'nilai_transaksi',
  'fee_dipungut',
  'fee_dikembalikan',
  'pendapatan_bersih',
  'dana_dilepas_ke_penyedia',
  'dikembalikan_ke_client',
] as const;

export type RevenueRow = { tanggal: string } & Record<(typeof REVENUE_KEYS)[number], number>;

/**
 * Order SETTLED per hari settled_at, kolom V4 ditambah dua kolom ledger. Identitas:
 * nilai_transaksi = pendapatan_bersih + dana_dilepas_ke_penyedia + dikembalikan_ke_client.
 */
export async function revenueReport(query: PeriodQuery) {
  const p = witaPeriod(query.from, query.to);
  const b = bounds(p);
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    WITH hari AS (${daysSeries(p)}),
    settled AS (
      SELECT o.id, ${day(Prisma.sql`o.settled_at`)} AS tanggal, o.listing_base_amount, o.options_amount,
             o.total_amount, o.platform_fee, o.platform_fee_refunded
      FROM orders o
      WHERE o.status = 'SETTLED' AND ${inPeriod(Prisma.sql`o.settled_at`, b)}
    ),
    ledger AS (
      SELECT t.order_id,
             COALESCE(SUM(t.amount_available_delta) FILTER (WHERE t.type = 'ESCROW_RELEASE'), 0)  AS dilepas,
             COALESCE(-SUM(t.amount_pending_delta)  FILTER (WHERE t.type = 'REFUND_DEDUCTION'), 0) AS potongan
      FROM wallet_transactions t
      WHERE t.order_id IN (SELECT id FROM settled)
      GROUP BY t.order_id
    ),
    per_hari AS (
      SELECT s.tanggal,
             COUNT(*)                                      AS jumlah_order,
             SUM(s.listing_base_amount)                    AS nilai_harga_dasar,
             SUM(s.options_amount)                         AS nilai_opsi_tambahan,
             SUM(s.total_amount)                           AS nilai_transaksi,
             SUM(s.platform_fee)                           AS fee_dipungut,
             SUM(s.platform_fee_refunded)                  AS fee_dikembalikan,
             SUM(s.platform_fee - s.platform_fee_refunded) AS pendapatan_bersih,
             COALESCE(SUM(l.dilepas), 0)                   AS dana_dilepas_ke_penyedia,
             SUM(s.platform_fee_refunded) + COALESCE(SUM(l.potongan), 0) AS dikembalikan_ke_client
      FROM settled s
      LEFT JOIN ledger l ON l.order_id = s.id
      GROUP BY s.tanggal
    )
    SELECT h.tanggal, x.jumlah_order, x.nilai_harga_dasar, x.nilai_opsi_tambahan, x.nilai_transaksi,
           x.fee_dipungut, x.fee_dikembalikan, x.pendapatan_bersih, x.dana_dilepas_ke_penyedia, x.dikembalikan_ke_client
    FROM hari h
    LEFT JOIN per_hari x ON x.tanggal = h.tanggal
    ORDER BY h.tanggal
  `;
  const mapped = rows.map(
    (row) => ({ tanggal: dateKey(row.tanggal as Date), ...Object.fromEntries(REVENUE_KEYS.map((key) => [key, num(row[key])])) }) as RevenueRow,
  );
  return { period: periodDto(p), rows: mapped, totals: sumRows(mapped, [...REVENUE_KEYS]) };
}

// ============================================================
// /admin/reports/providers
// ============================================================

/**
 * Kejadian per penyedia di periode, satu baris per kejadian. SLA miss (usulan D201): order
 * EXPIRED karena deadline, yaitu SCHEDULED, atau AVAILABLE_NOW yang punya penerima tawaran
 * dengan sla_missed_at. EXPIRED karena seluruh penerima menolak (ALL_DECLINED) bukan miss.
 */
function providerEvents(b: Bounds): Prisma.Sql {
  return Prisma.sql`
    SELECT provider_profile_id AS pid, 'masuk' AS jenis, NULL::numeric AS nilai, NULL::numeric AS dilepas
    FROM orders WHERE ${inPeriod(Prisma.sql`created_at`, b)}
    UNION ALL
    SELECT provider_profile_id, 'diterima', NULL, NULL FROM orders WHERE ${inPeriod(Prisma.sql`accepted_at`, b)}
    UNION ALL
    SELECT provider_profile_id, 'ditolak', NULL, NULL
    FROM orders WHERE status = 'REJECTED' AND ${inPeriod(Prisma.sql`cancelled_at`, b)}
    UNION ALL
    SELECT provider_profile_id, 'selesai', NULL, NULL FROM orders WHERE ${inPeriod(Prisma.sql`completed_at`, b)}
    UNION ALL
    SELECT o.provider_profile_id, 'sla_miss', NULL, NULL
    FROM orders o
    WHERE o.status = 'EXPIRED' AND ${inPeriod(Prisma.sql`o.response_deadline_at`, b)}
      AND (o.booking_mode = 'SCHEDULED'
           OR EXISTS (SELECT 1 FROM order_offers f WHERE f.order_id = o.id AND f.sla_missed_at IS NOT NULL))
    UNION ALL
    SELECT o.provider_profile_id, 'sengketa', NULL, NULL
    FROM disputes d JOIN orders o ON o.id = d.order_id
    WHERE ${inPeriod(Prisma.sql`d.created_at`, b)}
    UNION ALL
    SELECT o.provider_profile_id, 'settled', o.total_amount,
           COALESCE((SELECT SUM(t.amount_available_delta) FROM wallet_transactions t
                     WHERE t.order_id = o.id AND t.type = 'ESCROW_RELEASE'), 0)
    FROM orders o
    WHERE o.status = 'SETTLED' AND ${inPeriod(Prisma.sql`o.settled_at`, b)}
  `;
}

const PROVIDER_AGG = Prisma.sql`
  COUNT(*) FILTER (WHERE jenis = 'masuk')    AS order_masuk,
  COUNT(*) FILTER (WHERE jenis = 'diterima') AS order_diterima,
  COUNT(*) FILTER (WHERE jenis = 'ditolak')  AS order_ditolak,
  COUNT(*) FILTER (WHERE jenis = 'selesai')  AS order_selesai,
  COUNT(*) FILTER (WHERE jenis = 'sla_miss') AS sla_miss,
  COUNT(*) FILTER (WHERE jenis = 'sengketa') AS order_disengketakan,
  COALESCE(SUM(nilai)   FILTER (WHERE jenis = 'settled'), 0) AS nilai_transaksi_settled,
  COALESCE(SUM(dilepas) FILTER (WHERE jenis = 'settled'), 0) AS dana_dilepas
`;

const PROVIDER_COUNT_KEYS = [
  'order_masuk',
  'order_diterima',
  'order_ditolak',
  'order_selesai',
  'sla_miss',
  'order_disengketakan',
  'nilai_transaksi_settled',
  'dana_dilepas',
] as const;

/** Usulan D201: dari order yang direspons atau seharusnya direspons di periode ini. */
const providerSlaPercent = (row: Record<string, number>) =>
  percent(row.sla_miss!, row.order_diterima! + row.order_ditolak! + row.sla_miss!);

function providerCounts(row: Record<string, unknown>): Record<(typeof PROVIDER_COUNT_KEYS)[number], number> {
  return Object.fromEntries(PROVIDER_COUNT_KEYS.map((key) => [key, num(row[key])])) as Record<(typeof PROVIDER_COUNT_KEYS)[number], number>;
}

export async function providersReport(query: PagedPeriodQuery) {
  const p = witaPeriod(query.from, query.to);
  const b = bounds(p);
  const offset = (query.page - 1) * query.limit;

  const [rows, [totalsRow]] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>`
      WITH ev AS (${providerEvents(b)}),
      agg AS (SELECT pid, ${PROVIDER_AGG} FROM ev GROUP BY pid)
      SELECT a.*, pp.business_name, pp.provider_type, pp.rating_average, pp.rating_count
      FROM agg a JOIN provider_profiles pp ON pp.id = a.pid
      ORDER BY a.order_masuk DESC, a.pid
      LIMIT ${query.limit} OFFSET ${offset}
    `,
    prisma.$queryRaw<Record<string, unknown>[]>`
      WITH ev AS (${providerEvents(b)})
      SELECT COUNT(DISTINCT pid) AS jumlah_penyedia, ${PROVIDER_AGG} FROM ev
    `,
  ]);

  const items = rows.map((row) => {
    const counts = providerCounts(row);
    return {
      provider_profile_id: row.pid as string,
      business_name: (row.business_name as string | null) ?? null,
      provider_type: row.provider_type as string,
      ...counts,
      persen_sla_miss: providerSlaPercent(counts),
      // Cache saat ini (D179), BUKAN nilai per periode.
      rating_average_saat_ini: num(row.rating_average),
      rating_count_saat_ini: num(row.rating_count),
    };
  });
  const totalCounts = providerCounts(totalsRow ?? {});
  const total = num(totalsRow?.jumlah_penyedia);
  const meta: PaginationMeta = { page: query.page, limit: query.limit, total };
  return {
    data: { period: periodDto(p), rows: items, totals: { ...totalCounts, persen_sla_miss: providerSlaPercent(totalCounts) } },
    meta,
  };
}

// ============================================================
// /admin/reports/workers
// ============================================================

/** Kejadian per pekerja. Kolom check-in adalah ekspresi V2 yang dikelompokkan per pekerja. */
function workerEvents(b: Bounds): Prisma.Sql {
  return Prisma.sql`
    SELECT assigned_worker_id AS wid, 'selesai_pj' AS jenis, NULL::boolean AS valid,
           NULL::numeric AS jarak, NULL::numeric AS akurasi
    FROM orders WHERE assigned_worker_id IS NOT NULL AND ${inPeriod(Prisma.sql`completed_at`, b)}
    UNION ALL
    SELECT worker_id, 'tawaran', NULL, NULL, NULL FROM order_offers WHERE ${inPeriod(Prisma.sql`offered_at`, b)}
    UNION ALL
    SELECT worker_id, 'tolak', NULL, NULL, NULL FROM order_offers WHERE ${inPeriod(Prisma.sql`declined_at`, b)}
    UNION ALL
    SELECT worker_id, 'sla_miss', NULL, NULL, NULL FROM order_offers WHERE ${inPeriod(Prisma.sql`sla_missed_at`, b)}
    UNION ALL
    SELECT worker_id, 'checkin', is_valid, distance_meters, accuracy_meters
    FROM order_checkins WHERE ${inPeriod(Prisma.sql`created_at`, b)}
  `;
}

const WORKER_AGG = Prisma.sql`
  COUNT(*) FILTER (WHERE jenis = 'selesai_pj')               AS order_selesai_sebagai_pj,
  COUNT(*) FILTER (WHERE jenis = 'tawaran')                  AS tawaran_masuk,
  COUNT(*) FILTER (WHERE jenis = 'tolak')                    AS tawaran_ditolak,
  COUNT(*) FILTER (WHERE jenis = 'sla_miss')                 AS sla_miss,
  COUNT(*) FILTER (WHERE jenis = 'checkin')                  AS checkin_total,
  COUNT(*) FILTER (WHERE jenis = 'checkin' AND valid)        AS checkin_valid,
  ROUND(AVG(jarak)   FILTER (WHERE jenis = 'checkin'), 2)    AS rata_jarak_meter,
  ROUND(AVG(akurasi) FILTER (WHERE jenis = 'checkin'), 2)    AS rata_akurasi_gps
`;

const WORKER_COUNT_KEYS = ['order_selesai_sebagai_pj', 'tawaran_masuk', 'tawaran_ditolak', 'sla_miss', 'checkin_total', 'checkin_valid'] as const;

function workerFigures(row: Record<string, unknown>) {
  const counts = Object.fromEntries(WORKER_COUNT_KEYS.map((key) => [key, num(row[key])])) as Record<(typeof WORKER_COUNT_KEYS)[number], number>;
  return {
    ...counts,
    persen_sla_miss: percent(counts.sla_miss, counts.tawaran_masuk),
    persen_valid: percent(counts.checkin_valid, counts.checkin_total),
    rata_jarak_meter: numOrNull(row.rata_jarak_meter),
    rata_akurasi_gps: numOrNull(row.rata_akurasi_gps),
  };
}

export async function workersReport(query: PagedPeriodQuery) {
  const p = witaPeriod(query.from, query.to);
  const b = bounds(p);
  const offset = (query.page - 1) * query.limit;

  const [rows, [totalsRow]] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>`
      WITH ev AS (${workerEvents(b)}),
      agg AS (SELECT wid, ${WORKER_AGG} FROM ev GROUP BY wid)
      SELECT a.*, w.display_name, w.membership_status, w.provider_profile_id, pp.business_name
      FROM agg a
      JOIN provider_workers w   ON w.id = a.wid
      JOIN provider_profiles pp ON pp.id = w.provider_profile_id
      ORDER BY a.tawaran_masuk + a.order_selesai_sebagai_pj DESC, a.wid
      LIMIT ${query.limit} OFFSET ${offset}
    `,
    prisma.$queryRaw<Record<string, unknown>[]>`
      WITH ev AS (${workerEvents(b)})
      SELECT COUNT(DISTINCT wid) AS jumlah_pekerja, ${WORKER_AGG} FROM ev
    `,
  ]);

  const items = rows.map((row) => ({
    worker_id: row.wid as string,
    display_name: row.display_name as string,
    membership_status: row.membership_status as string,
    provider_profile_id: row.provider_profile_id as string,
    business_name: (row.business_name as string | null) ?? null,
    ...workerFigures(row),
  }));
  const meta: PaginationMeta = { page: query.page, limit: query.limit, total: num(totalsRow?.jumlah_pekerja) };
  return { data: { period: periodDto(p), rows: items, totals: workerFigures(totalsRow ?? {}) }, meta };
}
