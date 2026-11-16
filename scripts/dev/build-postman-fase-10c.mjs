// Menyusun folder 04 (parameter sistem) dan 05 (laporan admin) di collection Postman Fase 10, sesi 10c.
// Idempoten: folder 04 dan 05 yang sudah ada diganti. Jalankan dari akar repo:
//   node scripts/dev/build-postman-fase-10c.mjs
// Butuh seed `npm run postman:seed:fase-10` (fixture laporan) sebelum collection dijalankan.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const file = path.join(root, 'postman/Jasana-Fase-10.postman_collection.json');
const collection = JSON.parse(fs.readFileSync(file, 'utf8'));

function req(name, { method = 'GET', url, token, body, tests, pre }) {
  const [pathPart, queryPart] = url.split('?');
  const segments = pathPart.split('/').filter(Boolean);
  const item = {
    name,
    event: [{ listen: 'test', script: { type: 'text/javascript', exec: tests } }],
    request: {
      method,
      header: body === undefined ? [] : [{ key: 'Content-Type', value: 'application/json' }],
      auth: token ? { type: 'bearer', bearer: [{ key: 'token', value: `{{${token}}}`, type: 'string' }] } : { type: 'noauth' },
      url: {
        raw: `{{base_url}}/${pathPart.replace(/^\//, '')}${queryPart ? `?${queryPart}` : ''}`,
        host: ['{{base_url}}'],
        path: segments,
        ...(queryPart
          ? { query: queryPart.split('&').map((pair) => { const [key, ...rest] = pair.split('='); return { key, value: rest.join('=') }; }) }
          : {}),
      },
      ...(body === undefined ? {} : { body: { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } } }),
    },
    response: [],
  };
  if (pre) item.event.unshift({ listen: 'prerequest', script: { type: 'text/javascript', exec: pre } });
  return item;
}

const status = (code) => `pm.test('Status ${code}', function () { pm.response.to.have.status(${code}); });`;
const code = (c) => `pm.test('Kode ${c}', function () { pm.expect(pm.response.json().error.code).to.eql('${c}'); });`;
const path0 = (p) => `pm.test('details[0].path ${p}', function () { pm.expect(pm.response.json().error.details[0].path).to.eql('${p}'); });`;
const settingOf = (key) => `var s = pm.response.json().data.find(function (x) { return x.key === '${key}'; });`;

// ------------------------------------------------------------------------- 04
const folder04 = {
  name: '04. Parameter sistem (sesi 10c, D181)',
  item: [
    req('GET settings: 25 kunci terdaftar, tanpa kunci yang tidak dibaca server', {
      url: 'admin/settings',
      token: 'hadmin_token',
      tests: [
        status(200),
        'var list = pm.response.json().data;',
        "pm.test('25 kunci', function () { pm.expect(list.length).to.eql(25); });",
        "pm.test('Tanpa TTL token dan parameter lokasi pekerja', function () { var keys = list.map(function (x) { return x.key; }); ['access_token_ttl_minutes', 'refresh_token_ttl_days', 'worker_location_move_threshold_meters', 'worker_location_max_interval_minutes'].forEach(function (k) { pm.expect(keys).to.not.include(k); }); });",
        settingOf('review_window_days'),
        "pm.test('review_window_days bawaan 14, rentang 1 sampai 90', function () { pm.expect(s).to.include({ value: 14, default_value: 14, min: 1, max: 90, source: 'DEFAULT' }); });",
      ],
    }),
    req('PATCH beberapa kunci sekaligus: minimum dan admin fee naik bersama', {
      method: 'PATCH',
      url: 'admin/settings',
      token: 'hadmin_token',
      body: { withdrawal_min_amount: 60000, withdrawal_admin_fee: 7000 },
      tests: [
        status(200),
        settingOf('withdrawal_admin_fee'),
        "pm.test('Tersimpan dengan jejak updated_by', function () { pm.expect(s).to.include({ value: 7000, source: 'DATABASE' }); pm.expect(s.updated_by.full_name).to.eql('Admin Fase Sepuluh'); pm.expect(s.updated_at).to.be.a('string'); });",
      ],
    }),
    req('Kunci karangan: 422', { method: 'PATCH', url: 'admin/settings', token: 'hadmin_token', body: { kunci_karangan: 1 }, tests: [status(422), code('VALIDATION_ERROR')] }),
    req('Kunci yang tidak dibaca server: 422', { method: 'PATCH', url: 'admin/settings', token: 'hadmin_token', body: { access_token_ttl_minutes: 60 }, tests: [status(422)] }),
    req('Di luar rentang: radius 5 meter 422', { method: 'PATCH', url: 'admin/settings', token: 'hadmin_token', body: { geolocation_radius_meters: 5 }, tests: [status(422), path0('geolocation_radius_meters')] }),
    req('Bukan bilangan bulat: 422', { method: 'PATCH', url: 'admin/settings', token: 'hadmin_token', body: { review_window_days: 14.5 }, tests: [status(422), path0('review_window_days')] }),
    req('Admin fee sama dengan minimum: 422', { method: 'PATCH', url: 'admin/settings', token: 'hadmin_token', body: { withdrawal_admin_fee: 60000 }, tests: [status(422), path0('withdrawal_admin_fee')] }),
    req('Atomik: kunci sah ikut batal kalau relasi gagal', {
      method: 'PATCH',
      url: 'admin/settings',
      token: 'hadmin_token',
      body: { review_window_days: 30, withdrawal_min_amount: 10000, withdrawal_admin_fee: 10000 },
      tests: [status(422)],
    }),
    req('review_window_days tetap 14', {
      url: 'admin/settings',
      token: 'hadmin_token',
      tests: [status(200), settingOf('review_window_days'), "pm.test('Tidak tertulis', function () { pm.expect(s).to.include({ value: 14, source: 'DEFAULT' }); });"],
    }),
    req('listing_faq_max_items di bawah FAQ yang ada: 409', {
      method: 'PATCH',
      url: 'admin/settings',
      token: 'hadmin_token',
      body: { listing_faq_max_items: 2 },
      tests: [status(409), code('SETTING_CONFLICTS_WITH_DATA')],
    }),
    req('Bukan admin: 403', { method: 'PATCH', url: 'admin/settings', token: 'hklien_token', body: { review_window_days: 30 }, tests: [status(403)] }),
    req('Perpanjang review_window_days ke 25', {
      method: 'PATCH',
      url: 'admin/settings',
      token: 'hadmin_token',
      body: { review_window_days: 25 },
      tests: [status(200), settingOf('review_window_days'), "pm.test('25', function () { pm.expect(s.value).to.eql(25); });"],
    }),
    req('Langsung berlaku: review order LAMA (selesai 20 hari lalu) kini diterima', {
      method: 'POST',
      url: 'orders/{{order_lama}}/review',
      token: 'hklien_token',
      body: { rating: 4, comment: 'Ulasan setelah batas diperpanjang' },
      tests: [status(201)],
    }),
    req('Kembalikan nilai bawaan', {
      method: 'PATCH',
      url: 'admin/settings',
      token: 'hadmin_token',
      body: { review_window_days: 14, withdrawal_min_amount: 50000, withdrawal_admin_fee: 6500 },
      tests: [status(200)],
    }),
    req('Tanpa token: 401', { url: 'admin/settings', tests: [status(401)] }),
  ],
};

// ------------------------------------------------------------------------- 05
const witaDay = "function witaDay(offsetDays) { return new Date(Date.now() + 8 * 3600000 + offsetDays * 86400000).toISOString().slice(0, 10); }";
const sumCheck = [
  'var d = pm.response.json().data;',
  "pm.test('Satu baris per hari', function () { pm.expect(d.rows.length).to.eql(d.period.days); pm.expect(d.period.timezone).to.eql('WITA'); });",
  "pm.test('totals = jumlah seluruh baris', function () { Object.keys(d.totals).forEach(function (k) { var sum = d.rows.reduce(function (t, r) { return t + r[k]; }, 0); pm.expect(sum, k).to.eql(d.totals[k]); }); });",
];
const findRow = (field, value) => `var row = pm.response.json().data.rows.find(function (r) { return r.${field} === '${value}'; });`;

const folder05 = {
  name: '05. Laporan admin (sesi 10c, D180)',
  item: [
    req('Transaksi 31 hari terakhir', {
      url: 'admin/reports/transactions?from={{rep_from}}&to={{rep_to}}',
      token: 'hadmin_token',
      pre: [witaDay, "pm.collectionVariables.set('rep_from', witaDay(-30));", "pm.collectionVariables.set('rep_to', witaDay(0));", "pm.collectionVariables.set('lama_from', witaDay(-20));", "pm.collectionVariables.set('lama_to', witaDay(-18));"],
      tests: [status(200), ...sumCheck, "pm.test('31 hari', function () { pm.expect(d.rows.length).to.eql(31); pm.expect(d.rows[30].tanggal).to.eql(pm.collectionVariables.get('rep_to')); });", "pm.test('Order seed masuk hari ini', function () { pm.expect(d.rows[30].order_masuk).to.be.at.least(7); });"],
    }),
    req('Pendapatan 31 hari terakhir', {
      url: 'admin/reports/revenue?from={{rep_from}}&to={{rep_to}}',
      token: 'hadmin_token',
      tests: [status(200), ...sumCheck, "pm.test('LAMA dan KEDUA settled di periode', function () { pm.expect(d.totals.jumlah_order).to.be.at.least(2); pm.expect(d.totals.pendapatan_bersih).to.eql(d.totals.fee_dipungut - d.totals.fee_dikembalikan); });"],
    }),
    req('Penyedia: Teknik Renon dengan SLA miss', {
      url: 'admin/reports/providers?from={{rep_from}}&to={{rep_to}}&limit=100',
      token: 'hadmin_token',
      tests: [
        status(200),
        findRow('business_name', 'Teknik Renon'),
        "pm.test('Tujuh order masuk, lima diterima', function () { pm.expect(row).to.include({ order_masuk: 7, order_diterima: 5, order_ditolak: 0 }); });",
        "pm.test('SLA miss: Scheduled dan Available Now lewat deadline', function () { pm.expect(row.sla_miss).to.eql(2); pm.expect(row.persen_sla_miss).to.eql(28.57); });",
        "pm.test('Settled LAMA dan KEDUA', function () { pm.expect(row.nilai_transaksi_settled).to.eql(300000); pm.expect(row.order_disengketakan).to.eql(1); });",
        "pm.test('meta paginasi', function () { var m = pm.response.json().meta; pm.expect(m.page).to.eql(1); pm.expect(m.limit).to.eql(100); pm.expect(m.total).to.be.at.least(1); });",
      ],
    }),
    req('Penyedia: hari settled LAMA saja', {
      url: 'admin/reports/providers?from={{lama_from}}&to={{lama_to}}&limit=100',
      token: 'hadmin_token',
      tests: [status(200), findRow('business_name', 'Teknik Renon'), "pm.test('Hanya LAMA, tanpa order masuk', function () { pm.expect(row).to.include({ nilai_transaksi_settled: 150000, order_masuk: 0, sla_miss: 0 }); });"],
    }),
    req('Pekerja: akurasi check-in dan SLA miss', {
      url: 'admin/reports/workers?from={{rep_from}}&to={{rep_to}}&limit=100',
      token: 'hadmin_token',
      tests: [
        status(200),
        'var rows = pm.response.json().data.rows;',
        "var pekerja = rows.find(function (r) { return r.display_name === 'Wayan Pekerja' && r.business_name === 'Teknik Renon'; });",
        "var rekan = rows.find(function (r) { return r.display_name === 'Ketut Rekan' && r.business_name === 'Teknik Renon'; });",
        "pm.test('hpekerja: 2 check-in, 1 sah, menolak tawaran tanpa SLA miss', function () { pm.expect(pekerja).to.include({ checkin_total: 2, checkin_valid: 1, persen_valid: 50, rata_jarak_meter: 231, rata_akurasi_gps: 14, tawaran_masuk: 1, tawaran_ditolak: 1, sla_miss: 0 }); });",
        "pm.test('hrekan: SLA miss 100 persen', function () { pm.expect(rekan).to.include({ tawaran_masuk: 1, sla_miss: 1, persen_sla_miss: 100, checkin_total: 0 }); pm.expect(rekan.persen_valid).to.eql(null); });",
      ],
    }),
    req('Pekerja: limit=1 page=2', {
      url: 'admin/reports/workers?from={{rep_from}}&to={{rep_to}}&limit=1&page=2',
      token: 'hadmin_token',
      tests: [status(200), "pm.test('meta halaman 2', function () { var m = pm.response.json().meta; pm.expect(m.page).to.eql(2); pm.expect(m.limit).to.eql(1); pm.expect(m.total).to.be.at.least(2); pm.expect(pm.response.json().data.rows.length).to.eql(1); });"],
    }),
    req('from sesudah to: 422', { url: 'admin/reports/revenue?from=2026-01-02&to=2026-01-01', token: 'hadmin_token', tests: [status(422)] }),
    req('Rentang 367 hari: 422', { url: 'admin/reports/transactions?from=2025-01-01&to=2026-01-02', token: 'hadmin_token', tests: [status(422)] }),
    req('Rentang 366 hari (2028 kabisat): 200', { url: 'admin/reports/transactions?from=2028-01-01&to=2028-12-31', token: 'hadmin_token', tests: [status(200), "pm.test('366 baris', function () { pm.expect(pm.response.json().data.rows.length).to.eql(366); });"] }),
    req('Tanggal tidak sah: 422', { url: 'admin/reports/revenue?from=2026-02-28&to=2026-02-30', token: 'hadmin_token', tests: [status(422)] }),
    req('Injeksi di from: 422', { url: "admin/reports/providers?from=2026-01-01'%20OR%201=1--&to=2026-01-02", token: 'hadmin_token', tests: [status(422)] }),
    req('Injeksi di page: 422', { url: 'admin/reports/workers?from=2026-01-01&to=2026-01-02&page=1;DROP%20TABLE%20orders', token: 'hadmin_token', tests: [status(422)] }),
    req('Bukan admin: 403', { url: 'admin/reports/revenue?from={{rep_from}}&to={{rep_to}}', token: 'hklien_token', tests: [status(403)] }),
    req('Tanpa token: 401', { url: 'admin/reports/workers?from={{rep_from}}&to={{rep_to}}', tests: [status(401)] }),
  ],
};

collection.item = collection.item.filter((f) => !/^0[45]\./.test(f.name)).concat([folder04, folder05]);
for (const key of ['rep_from', 'rep_to', 'lama_from', 'lama_to']) {
  if (!collection.variable.some((v) => v.key === key)) collection.variable.push({ key, value: '' });
}
fs.writeFileSync(file, `${JSON.stringify(collection, null, 2)}\n`);

const requests = collection.item.reduce((n, f) => n + f.item.length, 0);
const assertions = JSON.stringify(collection).match(/pm\.test\(/g).length;
console.log(`Fase 10: ${collection.item.length} folder, ${requests} request, ${assertions} assertion`);
