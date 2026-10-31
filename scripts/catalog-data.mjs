/**
 * Katalog contoh: empat kategori dan dua belas sub-kategori (D71), beserta
 * definisi atributnya PERSIS dari Lampiran B Keputusan-Desain-Sistem.md.
 *
 * Data murni, tanpa basis data. Dipakai `seed-catalog.mjs` dan diuji
 * `apps/api/tests/attribute-rules.test.ts` terhadap aturan D72.
 *
 * Yang sengaja TIDAK di sini:
 *   - contoh delta harga, karena itu milik listing (Fase 4)
 *   - mode pemesanan per sub-kategori, karena tidak ada kolomnya di
 *     `subcategories`; kapabilitas itu milik listing (D45)
 *
 * Penyimpangan dari Lampiran B, dilaporkan di laporan Fase 3:
 *   - B.3 `jenis_kendaraan` tidak mencantumkan daftar option. Diisi
 *     Mobil dan Motor (keputusan sesi Fase 3)
 *
 * Durasi BUKAN atribut (D90). Sumbernya satu, kolom
 * `listings.estimated_duration_minutes`, jadi `durasi_estimasi` tidak ada
 * di sini. Pengecualiannya D100: nilai opsi B.5 dan B.6 membawa
 * `duration_minutes`, dan "Dua Hari" di B.6 dihapus.
 */

const opts = (...values) => values.map((value) => ({ value, is_active: true }));

/** D100: pasangan [value, duration_minutes]. */
const timed = (...pairs) => pairs.map(([value, minutes]) => ({ value, is_active: true, duration_minutes: minutes }));

/** SPEC selalu NONE (D72). */
const spec = (key, label, dataType, isRequired, isFilterable, extra = {}) => ({
  attribute_key: key,
  label,
  data_type: dataType,
  attribute_role: 'SPEC',
  pricing_mode: 'NONE',
  is_required: isRequired,
  is_filterable: isFilterable,
  ...extra,
});

/** OPTION NUMBER memakai PER_UNIT, selebihnya FLAT_PER_OPTION (D72). */
const option = (key, label, dataType, isRequired, isFilterable, extra = {}) => ({
  attribute_key: key,
  label,
  data_type: dataType,
  attribute_role: 'OPTION',
  pricing_mode: dataType === 'NUMBER' ? 'PER_UNIT' : 'FLAT_PER_OPTION',
  is_required: isRequired,
  is_filterable: isFilterable,
  ...extra,
});

const rule = (min, max) => ({ min, max });

export const CATALOG = [
  {
    name: 'Otomotif',
    slug: 'otomotif',
    subcategories: [
      {
        // B.1
        name: 'Cuci Mobil Panggilan',
        slug: 'cuci-mobil-panggilan',
        suggested_price_min: 50000,
        suggested_price_max: 150000,
        attributes: [
          option('jenis_kendaraan', 'Jenis kendaraan', 'SELECT', true, true, {
            options: opts('Sedan', 'SUV', 'MPV', 'Hatchback', 'Pickup', 'Van'),
          }),
          option('layanan_tambahan', 'Layanan tambahan', 'MULTISELECT', false, true, {
            options: opts('Poles Body', 'Vacuum Interior', 'Semir Ban', 'Cuci Mesin', 'Pembersih Jamur Kaca'),
          }),
          spec('sumber_air', 'Sumber air', 'SELECT', true, true, {
            options: opts('Dibawa penyedia', 'Disediakan client'),
          }),
        ],
      },
      {
        // B.2
        name: 'Servis Motor Panggilan',
        slug: 'servis-motor-panggilan',
        suggested_price_min: 50000,
        suggested_price_max: 200000,
        attributes: [
          option('jenis_servis', 'Jenis servis', 'SELECT', true, true, {
            options: opts('Servis Ringan', 'Servis Besar', 'Ganti Oli', 'Ganti Kampas Rem', 'Servis CVT', 'Tune Up'),
          }),
          spec('tipe_motor', 'Tipe motor yang dilayani', 'MULTISELECT', true, true, {
            options: opts('Bebek', 'Matic', 'Sport', 'Motor Besar'),
          }),
          spec('sparepart', 'Penyediaan sparepart', 'SELECT', true, true, {
            options: opts('Disediakan penyedia', 'Disediakan client', 'Keduanya bisa'),
          }),
        ],
      },
      {
        // B.3
        name: 'Ganti Oli Panggilan',
        slug: 'ganti-oli-panggilan',
        suggested_price_min: 40000,
        suggested_price_max: 120000,
        attributes: [
          spec('jenis_kendaraan', 'Jenis kendaraan', 'SELECT', true, true, {
            options: opts('Mobil', 'Motor'),
          }),
          option('oli_disediakan', 'Oli disediakan penyedia', 'BOOLEAN', false, true),
        ],
      },
    ],
  },
  {
    name: 'Fotografi',
    slug: 'fotografi',
    subcategories: [
      {
        // B.4
        name: 'Foto Produk',
        slug: 'foto-produk',
        suggested_price_min: 150000,
        suggested_price_max: 750000,
        attributes: [
          option('jumlah_item', 'Jumlah item difoto', 'NUMBER', true, false, {
            validation_rule: rule(1, 50),
          }),
          option('gaya_foto', 'Gaya pemotretan', 'SELECT', true, true, {
            options: opts('Katalog Latar Putih', 'Flat Lay', 'Lifestyle', 'Detail Makro'),
          }),
          option('tambahan', 'Layanan tambahan', 'MULTISELECT', false, true, {
            options: opts('Edit Retouch Lanjutan', 'Video Pendek', 'Foto 360 Derajat'),
          }),
        ],
      },
      {
        // B.5
        name: 'Foto Prewedding',
        slug: 'foto-prewedding',
        suggested_price_min: 1500000,
        suggested_price_max: 7000000,
        attributes: [
          option('paket_durasi', 'Durasi pemotretan', 'SELECT', true, true, {
            options: timed(['Setengah Hari (4 jam)', 240], ['Sehari Penuh (8 jam)', 480]),
          }),
          option('jumlah_lokasi', 'Jumlah lokasi', 'NUMBER', true, false, {
            validation_rule: rule(1, 4),
          }),
          option('tambahan', 'Layanan tambahan', 'MULTISELECT', false, true, {
            options: opts('Sewa Gaun', 'Makeup Artist', 'Drone', 'Album Cetak', 'Video Sinematik'),
          }),
          spec('jumlah_foto_edit', 'Jumlah foto diedit', 'NUMBER', true, true, {
            validation_rule: rule(10, 300),
          }),
          spec('gaya_fotografi', 'Gaya fotografi', 'MULTISELECT', true, true, {
            options: opts('Klasik', 'Candid', 'Editorial', 'Sinematik', 'Tradisional'),
          }),
          spec('waktu_pengerjaan_hari', 'Hasil jadi dalam', 'NUMBER', true, true, {
            unit: 'hari',
            validation_rule: rule(3, 60),
          }),
        ],
      },
      {
        // B.6
        name: 'Dokumentasi Acara',
        slug: 'dokumentasi-acara',
        suggested_price_min: 1000000,
        suggested_price_max: 5000000,
        attributes: [
          option('jenis_acara', 'Jenis acara', 'SELECT', true, true, {
            options: opts('Ulang Tahun', 'Seminar', 'Wisuda', 'Gathering Perusahaan', 'Pernikahan', 'Upacara Keagamaan'),
          }),
          option('durasi_liputan', 'Durasi liputan', 'SELECT', true, true, {
            options: timed(['2 Jam', 120], ['4 Jam', 240], ['8 Jam', 480]),
          }),
          option('tambahan', 'Layanan tambahan', 'MULTISELECT', false, true, {
            options: opts('Cetak Instan di Lokasi', 'Live Streaming', 'Drone', 'Same Day Edit', 'Photobooth'),
          }),
          spec('jenis_dokumentasi', 'Jenis dokumentasi', 'MULTISELECT', true, true, {
            options: opts('Foto', 'Video', 'Foto dan Video'),
          }),
          spec('waktu_pengerjaan_hari', 'Hasil jadi dalam', 'NUMBER', true, true, {
            unit: 'hari',
            validation_rule: rule(1, 45),
          }),
        ],
      },
    ],
  },
  {
    name: 'Kecantikan',
    slug: 'kecantikan',
    subcategories: [
      {
        // B.7
        name: 'Makeup Artist Acara',
        slug: 'makeup-artist-acara',
        suggested_price_min: 150000,
        suggested_price_max: 750000,
        attributes: [
          option('jumlah_orang', 'Jumlah orang dirias', 'NUMBER', true, false, {
            validation_rule: rule(1, 15),
          }),
          option('jenis_acara', 'Jenis acara', 'SELECT', true, true, {
            options: opts('Wisuda', 'Pesta', 'Pemotretan', 'Acara Kantor', 'Lamaran'),
          }),
          option('tambahan', 'Layanan tambahan', 'MULTISELECT', false, true, {
            options: opts('Penataan Rambut', 'Sanggul', 'Bulu Mata', 'Sewa Softlens', 'Touch Up di Lokasi'),
          }),
          spec('kelas_produk', 'Kelas produk kosmetik', 'SELECT', true, true, {
            options: opts('Reguler', 'Premium', 'Hypoallergenic'),
          }),
        ],
      },
      {
        // B.8
        name: 'Makeup Pengantin',
        slug: 'makeup-pengantin',
        suggested_price_min: 1500000,
        suggested_price_max: 10000000,
        attributes: [
          option('paket', 'Paket riasan', 'SELECT', true, true, {
            options: opts('Akad Saja', 'Resepsi Saja', 'Akad dan Resepsi'),
          }),
          option('jumlah_pendamping', 'Jumlah pendamping dirias', 'NUMBER', false, false, {
            validation_rule: rule(0, 10),
          }),
          option('tambahan', 'Layanan tambahan', 'MULTISELECT', false, true, {
            options: opts(
              'Sewa Gaun',
              'Sanggul Tradisional',
              'Penataan Rambut Pendamping',
              'Touch Up Sepanjang Acara',
              'Aksesori',
            ),
          }),
          spec('gaya_riasan', 'Gaya riasan yang dikuasai', 'MULTISELECT', true, true, {
            options: opts('Modern', 'Tradisional', 'Natural', 'Bold'),
          }),
        ],
      },
      {
        // B.9
        name: 'Potong Rambut Panggilan',
        slug: 'potong-rambut-panggilan',
        suggested_price_min: 50000,
        suggested_price_max: 200000,
        attributes: [
          option('jenis_layanan', 'Jenis layanan', 'SELECT', true, true, {
            options: opts('Potong Dewasa', 'Potong Anak', 'Potong dan Keramas', 'Cukur Jenggot', 'Potong dan Pewarnaan'),
          }),
          option('jumlah_orang', 'Jumlah orang', 'NUMBER', true, false, {
            validation_rule: rule(1, 10),
          }),
        ],
      },
    ],
  },
  {
    name: 'Perbaikan',
    slug: 'perbaikan',
    subcategories: [
      {
        // B.10
        name: 'Servis AC',
        slug: 'servis-ac',
        suggested_price_min: 75000,
        suggested_price_max: 600000,
        attributes: [
          option('jenis_pekerjaan', 'Jenis pekerjaan', 'SELECT', true, true, {
            options: opts('Cuci AC', 'Isi Freon', 'Bongkar Pasang', 'Perbaikan', 'Pengecekan Rutin'),
          }),
          option('jumlah_unit', 'Jumlah unit AC', 'NUMBER', true, false, {
            validation_rule: rule(1, 20),
          }),
          option('kapasitas_pk', 'Kapasitas PK', 'SELECT', true, true, {
            options: opts('0.5 PK', '1 PK', '1.5 PK', '2 PK', 'Di atas 2 PK'),
          }),
          option('tambahan', 'Layanan tambahan', 'MULTISELECT', false, true, {
            options: opts('Cuci Outdoor Unit', 'Pembersihan Pipa', 'Vakum Sistem'),
          }),
          spec('merek_dilayani', 'Merek yang dilayani', 'MULTISELECT', true, true, {
            options: opts('Daikin', 'Panasonic', 'LG', 'Sharp', 'Samsung', 'Gree', 'Polytron'),
          }),
        ],
      },
      {
        // B.11
        name: 'Tukang Listrik',
        slug: 'tukang-listrik',
        suggested_price_min: 75000,
        suggested_price_max: 500000,
        attributes: [
          option('jenis_pekerjaan', 'Jenis pekerjaan', 'SELECT', true, true, {
            options: opts(
              'Perbaikan Korsleting',
              'Pasang Stop Kontak',
              'Pasang Lampu',
              'Instalasi Baru',
              'Pengecekan Instalasi',
              'Pasang MCB',
            ),
          }),
          option('jumlah_titik', 'Jumlah titik', 'NUMBER', false, false, {
            validation_rule: rule(1, 30),
          }),
          spec('material', 'Penyediaan material', 'SELECT', true, true, {
            options: opts('Disediakan penyedia', 'Disediakan client', 'Keduanya bisa'),
          }),
          spec('layanan_darurat', 'Melayani panggilan darurat', 'BOOLEAN', true, true),
        ],
      },
      {
        // B.12
        name: 'Servis Mesin Cuci',
        slug: 'servis-mesin-cuci',
        suggested_price_min: 100000,
        suggested_price_max: 500000,
        attributes: [
          option('jenis_pekerjaan', 'Jenis pekerjaan', 'SELECT', true, true, {
            options: opts('Pengecekan', 'Servis Ringan', 'Ganti Sparepart', 'Perbaikan Mesin', 'Pembersihan Menyeluruh'),
          }),
          option('tipe_mesin', 'Tipe mesin cuci', 'SELECT', true, true, {
            options: opts('Bukaan Atas 1 Tabung', 'Bukaan Atas 2 Tabung', 'Bukaan Depan', 'Mesin Cuci dan Pengering'),
          }),
          spec('merek_dilayani', 'Merek yang dilayani', 'MULTISELECT', true, true, {
            options: opts('Sharp', 'LG', 'Samsung', 'Polytron', 'Electrolux', 'Panasonic', 'Aqua'),
          }),
          spec('garansi_hari', 'Garansi pengerjaan', 'NUMBER', false, true, {
            unit: 'hari',
            validation_rule: rule(0, 90),
          }),
        ],
      },
    ],
  },
];
