/**
 * Memastikan pengaman dari migration-constraints.sql benar-benar terpasang.
 *
 * KENAPA SKRIP INI ADA. `prisma migrate dev` berjalan mulus tanpa berkas
 * constraint dan semuanya terlihat normal, sampai suatu saat dua order masuk
 * ke satu pekerja atau ledger dobel. Kueri V1 sampai V12 pun mengembalikan
 * nol baris pada basis data kosong, jadi lulusnya V1..V12 di awal TIDAK
 * membuktikan constraint-nya ada.
 *
 * Yang membuktikan adalah keberadaan baris di pg_constraint dan pg_indexes,
 * dan itu yang diperiksa di sini.
 *
 * Pemakaian:  npm run db:check-constraints
 */

import { PrismaClient } from '@prisma/client';

/** CHECK constraint, dicari di pg_constraint dengan contype = 'c'. */
const EXPECTED_CHECKS = [
  ['chk_wallet_balance_non_negative', 'H1  saldo wallet tidak boleh negatif'],
  ['chk_order_total_composition', 'H53 total = listing_base_amount + options_amount'],
  ['chk_order_amount_consistent', 'H5  total = provider_earning + platform_fee'],
  ['chk_order_amount_non_negative', 'H5  seluruh nominal order tidak negatif'],
  ['chk_platform_fee_refund_bound', 'H5  fee dikembalikan tidak melebihi fee dipungut'],
  ['chk_ledger_delta_not_both_zero', 'H6  baris ledger harus bergerak'],
  ['chk_review_rating_range', 'H6  rating 1 sampai 5'],
  ['chk_checkin_distance_non_negative', 'H6  jarak check-in tidak negatif'],
  ['chk_order_location_accuracy', '    akurasi GPS hanya untuk CURRENT_LOCATION'],
  ['chk_subcategory_price_range', '    panduan harga min tidak melebihi max'],
  ['chk_order_worker_assigned', 'H24 pekerja wajib terisi begitu order diterima'],
  ['chk_option_price_delta_non_negative', 'H54 delta harga opsi tidak negatif'],
  ['chk_verification_token_expiry', 'H33 masa berlaku token verifikasi di masa depan'],
  ['chk_refresh_token_expiry', 'H62 masa berlaku refresh token di masa depan'],
  ['chk_chat_session_identity', 'H63 sesi chat wajib punya identitas'],
  ['chk_guest_session_expiry', 'H63 sesi tamu wajib punya batas waktu'],
  ['chk_order_message_sender_role', 'H69 pengirim pesan hanya CLIENT, PROVIDER, WORKER'],
  ['chk_order_message_content_length', 'H69 panjang pesan 1 sampai 2000'],
  ['chk_listing_faq_content', 'H73 panjang pertanyaan dan jawaban FAQ'],
];

/**
 * Index. `partial` menandai yang WAJIB punya klausa WHERE.
 *
 * Kalau sebuah index yang seharusnya partial ternyata tidak punya predikat,
 * artinya unique biasa yang terpasang, dan efeknya justru memblokir hal yang
 * seharusnya boleh. Contohnya uniq_active_worker_membership: tanpa predikat
 * ACTIVE, orang yang sudah resign tidak bisa bergabung ke usaha lain selamanya.
 */
const EXPECTED_INDEXES = [
  ['uniq_payment_paid_per_order', true, 'H2  satu pembayaran lunas per order'],
  ['uniq_payment_pending_per_order', true, 'H2  satu invoice aktif per order'],
  ['uniq_escrow_event_per_order', true, 'H3  satu HOLD dan satu RELEASE per order'],
  ['uniq_inflight_order_per_worker', true, 'H4  satu pekerja satu order in-flight'],
  ['uniq_active_worker_membership', true, 'H23 eksklusivitas keanggotaan pekerja'],
  ['uniq_listing_option_price_null_value', true, 'H54 opsi ber-nilai NULL tetap unik'],
  ['uniq_worker_listing', false, 'H32 pemetaan pekerja ke listing unik'],
  ['uniq_order_crew_member', false, 'H44 pendamping tidak dobel per order'],
  ['uniq_listing_option_price', false, 'H54 satu opsi satu harga per listing'],
  ['uniq_verification_token_hash', false, 'H33 token verifikasi unik'],
  ['uniq_refresh_token_hash', false, 'H62 refresh token unik'],
  ['idx_listing_attributes', false, 'H18 index GIN atribut dinamis'],
];

async function main() {
  const prisma = new PrismaClient();
  const failures = [];

  try {
    const checks = await prisma.$queryRaw`
      SELECT conname AS name
      FROM pg_constraint
      WHERE contype = 'c'
        AND connamespace = 'public'::regnamespace`;
    const checkNames = new Set(checks.map((row) => row.name));

    const indexes = await prisma.$queryRaw`
      SELECT indexname AS name, indexdef AS def
      FROM pg_indexes
      WHERE schemaname = 'public'`;
    const indexByName = new Map(indexes.map((row) => [row.name, row.def]));

    console.log(`\nCHECK constraint (${EXPECTED_CHECKS.length} diharapkan)`);
    console.log('='.repeat(72));
    for (const [name, note] of EXPECTED_CHECKS) {
      const ada = checkNames.has(name);
      console.log(`  ${ada ? 'ADA   ' : 'HILANG'}  ${name.padEnd(38)} ${note}`);
      if (!ada) failures.push(`CHECK ${name} tidak terpasang`);
    }

    console.log(`\nIndex (${EXPECTED_INDEXES.length} diharapkan)`);
    console.log('='.repeat(72));
    for (const [name, mustBePartial, note] of EXPECTED_INDEXES) {
      const def = indexByName.get(name);
      if (!def) {
        console.log(`  HILANG  ${name.padEnd(38)} ${note}`);
        failures.push(`Index ${name} tidak terpasang`);
        continue;
      }
      const isPartial = / WHERE /i.test(def);
      if (mustBePartial && !isPartial) {
        console.log(`  SALAH   ${name.padEnd(38)} ${note}  <- seharusnya PARTIAL`);
        failures.push(`Index ${name} ada tapi tanpa klausa WHERE, seharusnya partial`);
        continue;
      }
      const label = isPartial ? 'ADA(p)' : 'ADA   ';
      console.log(`  ${label}  ${name.padEnd(38)} ${note}`);
    }

    /**
     * Index yang WAJIB SUDAH TIDAK ADA.
     *
     * D40 memindahkan kunci in-flight dari provider ke pekerja. Kalau index
     * lama tertinggal, usaha dengan lima pekerja tetap hanya bisa memegang
     * satu order, dan fitur tenaga kerja justru diblokir oleh constraint
     * sendiri. Keberadaannya jauh lebih berbahaya daripada ketidakhadiran
     * index baru, karena gejalanya "fiturnya tidak jalan", bukan galat.
     */
    console.log('\nIndex yang wajib sudah dibuang');
    console.log('='.repeat(72));
    const usang = 'uniq_inflight_order_per_provider';
    if (indexByName.has(usang)) {
      console.log(`  MASIH ADA  ${usang}  <- D40 mewajibkan dibuang`);
      failures.push(`Index lama ${usang} masih ada, D40 mewajibkan dibuang`);
    } else {
      console.log(`  BERSIH     ${usang} tidak ada, sesuai D40`);
    }

    /**
     * Predikat beberapa index paling kritikal dicetak apa adanya, supaya yang
     * diperiksa bukan cuma NAMANYA ada melainkan isinya benar.
     */
    console.log('\nPredikat index paling kritikal');
    console.log('='.repeat(72));
    for (const name of [
      'uniq_inflight_order_per_worker',
      'uniq_active_worker_membership',
      'uniq_escrow_event_per_order',
    ]) {
      const def = indexByName.get(name);
      if (!def) continue;
      console.log(`\n  ${name}`);
      console.log(
        '    ' + def.replace(/^CREATE /, '').replace(/ WHERE /, '\n    WHERE '),
      );
    }

    console.log(`\n${'='.repeat(72)}`);
    if (failures.length > 0) {
      console.error(`GAGAL, ${failures.length} pengaman tidak beres:`);
      for (const f of failures) console.error(`  - ${f}`);
      console.error(
        '\nJalankan migrasi add_integrity_constraints, isinya wajib sama dengan\n' +
          'docs/migration-constraints.sql.',
      );
      process.exit(1);
    }
    console.log('Seluruh pengaman terpasang, termasuk keenam partial unique index.\n');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
