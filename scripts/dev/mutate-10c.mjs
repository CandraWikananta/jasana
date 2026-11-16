// Uji mutasi sesi 10c: setiap mutan diterapkan, test sasaran dijalankan, berkas dipulihkan di finally.
// Jalankan dari akar repo:  node scripts/dev/mutate-10c.mjs [awalan-nama]
// Butuh TEST_DATABASE_URL (jasana_test). Jangan jalankan bersamaan dengan newman.
// Mutan HIDUP berarti test tidak menangkap perubahan perilaku itu.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const api = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../apps/api');
process.chdir(api);

const SET = 'src/modules/settings/settings.service.ts';
const SCH = 'src/modules/settings/settings.schema.ts';
const REP = 'src/modules/reports/reports.service.ts';
const RSC = 'src/modules/reports/reports.schema.ts';
const V = '../../packages/database/prisma/verification-queries.sql';
const T_SET = 'tests/admin-settings.test.ts';
const T_REP = 'tests/admin-reports.test.ts';

/** [nama, berkas, cari (harus unik), ganti, test] */
const M = [
  // A. Parameter sistem
  ['A rentang maks', SET, "review_window_days: spec(14, 1, 90,", "review_window_days: spec(14, 1, 91,", T_SET],
  ['A rentang min', SET, "order_message_max_length: spec(2000, 100, 2000,", "order_message_max_length: spec(2000, 1, 2000,", T_SET],
  ['A nol komisi', SET, 'SETTING_REGISTRY[key].min === 0)', 'SETTING_REGISTRY[key].min === 0 && key !== "platform_fee_percentage")', T_SET],
  ['A strict', SCH, '  .strict()\n', '', T_SET],
  ['A int', SCH, "        .int(`${key} harus bilangan bulat`)\n", '', T_SET],
  ['A fee >= min', SET, "after('withdrawal_admin_fee') >= after('withdrawal_min_amount')", "after('withdrawal_admin_fee') > after('withdrawal_min_amount')", T_SET],
  ['A relasi dihapus', SET, "if ('withdrawal_admin_fee' in patch || 'withdrawal_min_amount' in patch) {", 'if (false) {', T_SET],
  ['A relasi nilai lama', SET, "const after = (key: NumericSettingKey) => patch[key] ?? current.get(key)!;", 'const after = (key: NumericSettingKey) => current.get(key)!;', T_SET],
  ['A FAQ dihapus', SET, 'if (faqLimit < most) {', 'if (false) {', T_SET],
  ['A FAQ nonaktif ikut', SET, "        where: { isActive: true },\n", '', T_SET],
  ['A updated_by create', SET, 'create: { key, value, description: SETTING_REGISTRY[key].description, updatedBy: adminId },', 'create: { key, value, description: SETTING_REGISTRY[key].description },', T_SET],
  ['A updated_by update', SET, 'update: { value, description: SETTING_REGISTRY[key].description, updatedBy: adminId },', 'update: { value, description: SETTING_REGISTRY[key].description },', T_SET],
  ['A advisory lock (H119)', SET, '    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${SETTINGS_LOCK_KEY}::bigint)`;\n', '', T_SET],
  ['A sumber GET', SET, "source: stored === null ? 'DEFAULT' : 'DATABASE',", "source: row ? 'DATABASE' : 'DEFAULT',", T_SET],
  ['A nilai efektif GET', SET, 'value: stored ?? entry.default,', 'value: row ? Number(row.value) : entry.default,', T_SET],

  // B. Laporan
  ['B zona', REP, "AT TIME ZONE 'Asia/Makassar')::date", "AT TIME ZONE 'Asia/Jakarta')::date", T_REP],
  ['B batas awal', REP, '${column} >= ${b.start} AND', '${column} > ${b.start} AND', T_REP],
  ['B batas akhir', REP, 'AND ${column} < ${b.end}', 'AND ${column} <= ${b.end}', T_REP],
  ['B awal WITA', 'src/lib/wita.ts', 'T00:00:00Z`) - WITA_OFFSET_MS);', 'T00:00:00Z`));', T_REP],
  ['B pendapatan bersih', REP, 'SUM(s.platform_fee - s.platform_fee_refunded) AS pendapatan_bersih', 'SUM(s.platform_fee) AS pendapatan_bersih', T_REP],
  ['B potongan', REP, 'SUM(s.platform_fee_refunded) + COALESCE(SUM(l.potongan), 0) AS dikembalikan_ke_client', 'SUM(s.platform_fee_refunded) AS dikembalikan_ke_client', T_REP],
  ['B ledger lewat waktu', REP, 'WHERE t.order_id IN (SELECT id FROM settled)', 'WHERE ${inPeriod(Prisma.sql`t.created_at`, b)}', T_REP],
  ['B status SETTLED', REP, "WHERE o.status = 'SETTLED' AND ${inPeriod(Prisma.sql`o.settled_at`, b)}\n    ),", "WHERE ${inPeriod(Prisma.sql`o.completed_at`, b)}\n    ),", T_REP],
  ['B batal riwayat', REP, "WHERE to_status IN ('EXPIRED', 'PAYMENT_EXPIRED')", "WHERE to_status IN ('PAYMENT_EXPIRED')", T_REP],
  ['B direfund', REP, "WHERE to_status = 'REFUNDED' AND", "WHERE to_status = 'CANCELLED' AND", T_REP],
  ['B ALL_DECLINED', REP, 'OR EXISTS (SELECT 1 FROM order_offers f WHERE f.order_id = o.id AND f.sla_missed_at IS NOT NULL))', 'OR TRUE)', T_REP],
  ['B SLA Scheduled', REP, "AND (o.booking_mode = 'SCHEDULED'", 'AND (FALSE', T_REP],
  ['B persen SLA penyedia', REP, 'percent(row.sla_miss!, row.order_diterima! + row.order_ditolak! + row.sla_miss!)', 'percent(row.sla_miss!, row.order_masuk!)', T_REP],
  ['B SLA pekerja', REP, "'sla_miss', NULL, NULL, NULL FROM order_offers WHERE ${inPeriod(Prisma.sql`sla_missed_at`, b)}", "'sla_miss', NULL, NULL, NULL FROM order_offers WHERE ${inPeriod(Prisma.sql`offered_at`, b)}", T_REP],
  ['B tolak declinedAt', REP, "'tolak', NULL, NULL, NULL FROM order_offers WHERE ${inPeriod(Prisma.sql`declined_at`, b)}", "'tolak', NULL, NULL, NULL FROM order_offers WHERE ${inPeriod(Prisma.sql`offered_at`, b)}", T_REP],
  ['B check-in valid', REP, "COUNT(*) FILTER (WHERE jenis = 'checkin' AND valid)", "COUNT(*) FILTER (WHERE jenis = 'checkin')", T_REP],
  ['B check-in periode', REP, 'FROM order_checkins WHERE ${inPeriod(Prisma.sql`created_at`, b)}', 'FROM order_checkins WHERE TRUE', T_REP],
  ['B offset', REP, "      ORDER BY a.tawaran_masuk + a.order_selesai_sebagai_pj DESC, a.wid\n      LIMIT ${query.limit} OFFSET ${offset}", "      ORDER BY a.tawaran_masuk + a.order_selesai_sebagai_pj DESC, a.wid\n      LIMIT ${query.limit} OFFSET 0", T_REP],
  ['B maks 366', RSC, 'export const REPORT_MAX_DAYS = 366;', 'export const REPORT_MAX_DAYS = 367;', T_REP],
  ['B maks 365', RSC, 'export const REPORT_MAX_DAYS = 366;', 'export const REPORT_MAX_DAYS = 365;', T_REP],
  ['B urutan from/to', RSC, 'if (days < 1)', 'if (days < 0)', T_REP],
  ['B tanggal sah', RSC, " && date.toISOString().slice(0, 10) === value", '', T_REP],
  ['B V4 bulan WITA (H121)', V, "DATE_TRUNC('month', settled_at AT TIME ZONE 'Asia/Makassar') AS bulan", "DATE_TRUNC('month', settled_at) AS bulan", T_REP],
];

const filter = process.argv[2];
const results = [];
for (const [name, file, find, replace, test] of M) {
  if (filter && !name.startsWith(filter)) continue;
  const original = fs.readFileSync(file, 'utf8');
  if (original.split(find).length !== 2) {
    results.push([name, 'TIDAK DITEMUKAN']);
    console.log(results.at(-1).join(': '));
    continue;
  }
  try {
    fs.writeFileSync(file, original.replace(find, () => replace));
    const run = spawnSync('npx', ['vitest', 'run', test], { shell: true, encoding: 'utf8' });
    results.push([name, run.status === 0 ? 'HIDUP' : 'MATI']);
  } finally {
    fs.writeFileSync(file, original);
  }
  console.log(results.at(-1).join(': '));
}
console.log('\n' + results.map((r) => r.join(': ')).join('\n'));
console.log(`\n${results.filter((r) => r[1] === 'MATI').length}/${results.length} mati`);
