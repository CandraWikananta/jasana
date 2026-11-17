/**
 * Data statis simulasi H16 (Bali). Murni data, tanpa basis data dan tanpa acak:
 * pengacakan terjadi di seed-simulasi.ts dengan PRNG berseed tetap.
 *
 * Seluruh nama orang dan nama usaha karangan (PRD 5.7). Delta harga mengikuti
 * "contoh delta" Lampiran B, lalu divariasikan ±20% per listing.
 */

export interface Area {
  key: string;
  name: string;
  district: string;
  city: 'Denpasar' | 'Badung' | 'Gianyar';
  lat: number;
  lng: number;
  streets: string[];
}

/**
 * Titik jangkar di permukiman. Titik pesisir (Sanur, Kuta, Legian, Seminyak, Canggu,
 * Jimbaran, Nusa Dua) sengaja minimal sekitar 800 m ke darat dari garis pantai, dan
 * jitter dibatasi 400 m, supaya tidak ada titik yang jatuh di laut.
 */
export const AREAS: Area[] = [
  { key: 'renon', name: 'Renon', district: 'Denpasar Selatan', city: 'Denpasar', lat: -8.6725, lng: 115.234, streets: ['Jl. Raya Puputan', 'Jl. Tukad Badung', 'Jl. Tukad Yeh Aya', 'Jl. Merdeka'] },
  { key: 'sanur', name: 'Sanur', district: 'Denpasar Selatan', city: 'Denpasar', lat: -8.69, lng: 115.255, streets: ['Jl. Danau Poso', 'Jl. Danau Buyan', 'Jl. Tandakan', 'Jl. Pungutan'] },
  { key: 'panjer', name: 'Panjer', district: 'Denpasar Selatan', city: 'Denpasar', lat: -8.68, lng: 115.225, streets: ['Jl. Tukad Pakerisan', 'Jl. Tukad Balian', 'Jl. Waturenggong'] },
  { key: 'sesetan', name: 'Sesetan', district: 'Denpasar Selatan', city: 'Denpasar', lat: -8.699, lng: 115.22, streets: ['Jl. Raya Sesetan', 'Jl. Pulau Moyo', 'Jl. Taman Pancing'] },
  { key: 'sidakarya', name: 'Sidakarya', district: 'Denpasar Selatan', city: 'Denpasar', lat: -8.706, lng: 115.232, streets: ['Jl. Sekar Waru', 'Jl. Tukad Pancoran'] },
  { key: 'teuku-umar', name: 'Teuku Umar', district: 'Denpasar Barat', city: 'Denpasar', lat: -8.678, lng: 115.205, streets: ['Jl. Teuku Umar', 'Jl. Gunung Agung', 'Jl. Pulau Bali'] },
  { key: 'gatsu', name: 'Gatot Subroto', district: 'Denpasar Utara', city: 'Denpasar', lat: -8.633, lng: 115.215, streets: ['Jl. Gatot Subroto Tengah', 'Jl. Cokroaminoto', 'Jl. Ahmad Yani Utara'] },
  { key: 'padangsambian', name: 'Padangsambian', district: 'Denpasar Barat', city: 'Denpasar', lat: -8.65, lng: 115.19, streets: ['Jl. Gunung Lumut', 'Jl. Gunung Soputan'] },
  { key: 'kuta', name: 'Kuta', district: 'Kuta', city: 'Badung', lat: -8.72, lng: 115.178, streets: ['Jl. Raya Kuta', 'Jl. Kartika Plaza', 'Jl. Bakung Sari'] },
  { key: 'tuban', name: 'Tuban', district: 'Kuta', city: 'Badung', lat: -8.735, lng: 115.177, streets: ['Jl. Dewi Sartika', 'Jl. Satria'] },
  { key: 'legian', name: 'Legian', district: 'Kuta', city: 'Badung', lat: -8.705, lng: 115.176, streets: ['Jl. Legian', 'Jl. Sriwijaya', 'Jl. Nakula'] },
  { key: 'seminyak', name: 'Seminyak', district: 'Kuta', city: 'Badung', lat: -8.688, lng: 115.17, streets: ['Jl. Sunset Road', 'Jl. Drupadi', 'Jl. Mertanadi'] },
  { key: 'kerobokan', name: 'Kerobokan', district: 'Kuta Utara', city: 'Badung', lat: -8.668, lng: 115.17, streets: ['Jl. Raya Kerobokan', 'Jl. Gunung Tangkuban Perahu', 'Jl. Umalas'] },
  { key: 'canggu', name: 'Canggu', district: 'Kuta Utara', city: 'Badung', lat: -8.645, lng: 115.146, streets: ['Jl. Raya Canggu', 'Jl. Pantai Berawa', 'Jl. Tegal Sari'] },
  { key: 'dalung', name: 'Dalung', district: 'Kuta Utara', city: 'Badung', lat: -8.625, lng: 115.175, streets: ['Jl. Raya Dalung', 'Jl. Perum Dalung Permai'] },
  { key: 'jimbaran', name: 'Jimbaran', district: 'Kuta Selatan', city: 'Badung', lat: -8.78, lng: 115.175, streets: ['Jl. Raya Uluwatu', 'Jl. Bukit Permai', 'Jl. Taman Griya'] },
  { key: 'nusa-dua', name: 'Nusa Dua', district: 'Kuta Selatan', city: 'Badung', lat: -8.8, lng: 115.218, streets: ['Jl. Bypass Nusa Dua', 'Jl. Siligita', 'Jl. Pratama'] },
  { key: 'ubud', name: 'Ubud', district: 'Ubud', city: 'Gianyar', lat: -8.5069, lng: 115.2625, streets: ['Jl. Raya Ubud', 'Jl. Sugriwa', 'Jl. Jembawan'] },
  { key: 'peliatan', name: 'Peliatan', district: 'Ubud', city: 'Gianyar', lat: -8.52, lng: 115.275, streets: ['Jl. Raya Peliatan', 'Jl. Cok Rai Pudak'] },
  { key: 'mas', name: 'Mas', district: 'Ubud', city: 'Gianyar', lat: -8.54, lng: 115.275, streets: ['Jl. Raya Mas', 'Jl. Br. Teges'] },
  { key: 'sayan', name: 'Sayan', district: 'Ubud', city: 'Gianyar', lat: -8.505, lng: 115.245, streets: ['Jl. Raya Sayan', 'Jl. Raya Penestanan'] },
  { key: 'sukawati', name: 'Sukawati', district: 'Sukawati', city: 'Gianyar', lat: -8.595, lng: 115.28, streets: ['Jl. Raya Sukawati', 'Jl. Raya Guwang'] },
];

export type SubSlug =
  | 'cuci-mobil-panggilan' | 'servis-motor-panggilan' | 'ganti-oli-panggilan'
  | 'foto-produk' | 'foto-prewedding' | 'dokumentasi-acara'
  | 'makeup-artist-acara' | 'makeup-pengantin' | 'potong-rambut-panggilan'
  | 'servis-ac' | 'tukang-listrik' | 'servis-mesin-cuci';

export interface ProviderSpec {
  /** Bagian email pemilik: `pemilik.<key>@sim.jasana.test`, kecuali akun demo. */
  key: string;
  name: string;
  type: 'INDIVIDUAL' | 'BUSINESS';
  area: string;
  /** Termasuk pemilik (D33). INDIVIDUAL selalu 1. */
  workers: number;
  /** Satu listing per butir. Slug yang berulang berarti dua listing berbeda di sub-kategori itu. */
  listings: SubSlug[];
  /** Akun demo pemilik, kalau ada. */
  demo?: 'demo.usaha' | 'demo.perorangan';
}

const AC = 'servis-ac', LISTRIK = 'tukang-listrik', MC = 'servis-mesin-cuci';
const CUCI = 'cuci-mobil-panggilan', MOTOR = 'servis-motor-panggilan', OLI = 'ganti-oli-panggilan';
const PRODUK = 'foto-produk', PREWED = 'foto-prewedding', DOK = 'dokumentasi-acara';
const MUA = 'makeup-artist-acara', PENGANTIN = 'makeup-pengantin', RAMBUT = 'potong-rambut-panggilan';

/** 26 BUSINESS dan 14 INDIVIDUAL, 100 pekerja, 130 listing. Diperiksa `assertPlanShape`. */
export const PROVIDERS: ProviderSpec[] = [
  // Perbaikan
  { key: 'dingin-jaya', name: 'Dingin Jaya Teknik', type: 'BUSINESS', area: 'renon', workers: 6, listings: [AC, AC, LISTRIK, MC] },
  { key: 'sejuk-bali', name: 'Sejuk Bali Service', type: 'BUSINESS', area: 'kuta', workers: 4, listings: [AC, AC, AC, LISTRIK, MC] },
  { key: 'teknik-panjer', name: 'Teknik Panjer Mandiri', type: 'BUSINESS', area: 'panjer', workers: 3, listings: [AC, LISTRIK, MC] },
  { key: 'listrik-dewata', name: 'Listrik Dewata', type: 'BUSINESS', area: 'gatsu', workers: 3, listings: [LISTRIK, LISTRIK, AC, AC, MC] },
  { key: 'ubud-elektrik', name: 'Ubud Elektrik', type: 'BUSINESS', area: 'ubud', workers: 2, listings: [LISTRIK, AC, MC] },
  { key: 'canggu-cool', name: 'Canggu Cool AC', type: 'BUSINESS', area: 'canggu', workers: 3, listings: [AC, AC, LISTRIK] },
  { key: 'mesin-cuci-sesetan', name: 'Rumah Mesin Cuci Sesetan', type: 'BUSINESS', area: 'sesetan', workers: 2, listings: [MC, MC, AC, LISTRIK] },
  { key: 'jimbaran-teknik', name: 'Jimbaran Teknik', type: 'BUSINESS', area: 'jimbaran', workers: 4, listings: [AC, LISTRIK, MC] },
  { key: 'nusa-dua-servis', name: 'Nusa Dua Servis', type: 'BUSINESS', area: 'nusa-dua', workers: 3, listings: [AC, AC, LISTRIK, MC] },
  { key: 'komang-listrik', name: 'Bli Komang Listrik', type: 'INDIVIDUAL', area: 'kerobokan', workers: 1, listings: [LISTRIK, AC] },
  { key: 'ketut-ac', name: 'Pak Ketut Servis AC', type: 'INDIVIDUAL', area: 'teuku-umar', workers: 1, listings: [AC, AC] },
  { key: 'wayan-teknisi', name: 'Wayan Teknisi Rumah', type: 'INDIVIDUAL', area: 'mas', workers: 1, listings: [MC, LISTRIK] },
  // Otomotif
  { key: 'kilap-mobil', name: 'Kilap Mobil Bali', type: 'BUSINESS', area: 'sanur', workers: 5, listings: [CUCI, CUCI, CUCI, OLI, MOTOR] },
  { key: 'seminyak-wash', name: 'Seminyak Car Wash', type: 'BUSINESS', area: 'seminyak', workers: 4, listings: [CUCI, CUCI, CUCI] },
  { key: 'bengkel-sesetan', name: 'Bengkel Panggilan Sesetan', type: 'BUSINESS', area: 'sidakarya', workers: 3, listings: [MOTOR, MOTOR, OLI] },
  { key: 'motor-sehat', name: 'Motor Sehat Denpasar', type: 'BUSINESS', area: 'gatsu', workers: 4, listings: [MOTOR, MOTOR, OLI] },
  { key: 'cuci-bersih-kuta', name: 'Cuci Bersih Kuta', type: 'BUSINESS', area: 'tuban', workers: 3, listings: [CUCI, CUCI, CUCI, MOTOR] },
  { key: 'ubud-moto', name: 'Ubud Moto Care', type: 'BUSINESS', area: 'peliatan', workers: 2, listings: [MOTOR, CUCI] },
  { key: 'jimbaran-clean', name: 'Jimbaran Auto Clean', type: 'BUSINESS', area: 'jimbaran', workers: 2, listings: [CUCI, CUCI, OLI, MOTOR] },
  { key: 'legian-motor', name: 'Legian Motor Service', type: 'BUSINESS', area: 'legian', workers: 3, listings: [MOTOR, MOTOR, CUCI] },
  { key: 'made-cuci', name: 'Bli Made Cuci Mobil', type: 'INDIVIDUAL', area: 'dalung', workers: 1, listings: [CUCI, CUCI] },
  { key: 'gede-motor', name: 'Gede Servis Motor', type: 'INDIVIDUAL', area: 'padangsambian', workers: 1, listings: [MOTOR, MOTOR, OLI] },
  { key: 'putu-cuci', name: 'Putu Cuci Mobil', type: 'INDIVIDUAL', area: 'nusa-dua', workers: 1, listings: [CUCI] },
  // Fotografi
  { key: 'lensa-dewata', name: 'Lensa Dewata Production', type: 'BUSINESS', area: 'renon', workers: 4, listings: [DOK, DOK, PREWED, PRODUK], demo: 'demo.usaha' },
  { key: 'kanvas-prewed', name: 'Kanvas Prewedding Bali', type: 'BUSINESS', area: 'ubud', workers: 3, listings: [PREWED, PREWED, DOK, DOK] },
  { key: 'sanur-foto', name: 'Sanur Foto Studio', type: 'BUSINESS', area: 'sanur', workers: 3, listings: [DOK, DOK, PRODUK, PREWED] },
  { key: 'seminyak-visual', name: 'Seminyak Visual', type: 'BUSINESS', area: 'seminyak', workers: 4, listings: [DOK, DOK, PREWED, PREWED] },
  { key: 'cerita-cahaya', name: 'Cerita Cahaya', type: 'BUSINESS', area: 'kerobokan', workers: 2, listings: [DOK, PREWED, PRODUK] },
  { key: 'komang-foto', name: 'Komang Foto', type: 'INDIVIDUAL', area: 'panjer', workers: 1, listings: [PRODUK, DOK] },
  { key: 'ayu-lens', name: 'Ayu Lens', type: 'INDIVIDUAL', area: 'sayan', workers: 1, listings: [PREWED, PRODUK] },
  // Kecantikan
  { key: 'rias-ayu-sari', name: 'Rias Ayu Sari', type: 'INDIVIDUAL', area: 'renon', workers: 1, listings: [MUA, PENGANTIN, MUA], demo: 'demo.perorangan' },
  { key: 'sanggar-puspa', name: 'Sanggar Rias Puspa', type: 'BUSINESS', area: 'sesetan', workers: 4, listings: [PENGANTIN, PENGANTIN, MUA, MUA, RAMBUT] },
  { key: 'glow-bali', name: 'Glow Bali MUA', type: 'BUSINESS', area: 'seminyak', workers: 3, listings: [MUA, MUA, PENGANTIN, PENGANTIN, RAMBUT] },
  { key: 'potong-keliling', name: 'Potong Rambut Keliling Denpasar', type: 'BUSINESS', area: 'teuku-umar', workers: 4, listings: [RAMBUT, RAMBUT, RAMBUT, MUA] },
  { key: 'ubud-beauty', name: 'Ubud Beauty Home', type: 'BUSINESS', area: 'ubud', workers: 3, listings: [MUA, MUA, PENGANTIN, RAMBUT] },
  { key: 'dewi-mua', name: 'Dewi MUA', type: 'INDIVIDUAL', area: 'kuta', workers: 1, listings: [MUA, MUA, MUA, RAMBUT] },
  { key: 'kadek-barber', name: 'Kadek Barber Panggilan', type: 'INDIVIDUAL', area: 'canggu', workers: 1, listings: [RAMBUT, RAMBUT] },
  { key: 'luh-pengantin', name: 'Luh Rias Pengantin', type: 'INDIVIDUAL', area: 'sukawati', workers: 1, listings: [PENGANTIN, PENGANTIN] },
  { key: 'nyoman-cukur', name: 'Nyoman Cukur Rumahan', type: 'INDIVIDUAL', area: 'jimbaran', workers: 1, listings: [RAMBUT, RAMBUT] },
  { key: 'sinta-makeup', name: 'Sinta Makeup', type: 'INDIVIDUAL', area: 'sanur', workers: 1, listings: [MUA, MUA, RAMBUT] },
];

/** Jumlah listing per sub-kategori yang dituju. Diperiksa terhadap PROVIDERS. */
export const LISTINGS_PER_SUB: Record<SubSlug, number> = {
  'servis-ac': 18, 'cuci-mobil-panggilan': 16, 'makeup-artist-acara': 14, 'potong-rambut-panggilan': 12,
  'servis-motor-panggilan': 12, 'tukang-listrik': 12, 'dokumentasi-acara': 10, 'servis-mesin-cuci': 10,
  'makeup-pengantin': 8, 'foto-prewedding': 8, 'ganti-oli-panggilan': 5, 'foto-produk': 5,
};

/** Lampiran B "Mode:". Sisanya Scheduled saja. */
export const BOTH_MODES: ReadonlySet<SubSlug> = new Set<SubSlug>([CUCI, MOTOR, OLI, RAMBUT, AC, LISTRIK]);

/**
 * Contoh delta Lampiran B. Angka untuk NUMBER (per unit) dan BOOLEAN, peta nilai untuk
 * SELECT dan MULTISELECT. Nilai yang tidak tercantum di Lampiran B (tambahan B.6, B.10,
 * B.12) diperkirakan dari rentang sub-kategori yang sama.
 */
export const DELTAS: Record<SubSlug, Record<string, number | Record<string, number>>> = {
  'cuci-mobil-panggilan': {
    jenis_kendaraan: { Sedan: 0, Hatchback: 0, MPV: 15000, SUV: 20000, Pickup: 20000, Van: 30000 },
    layanan_tambahan: { 'Poles Body': 50000, 'Vacuum Interior': 25000, 'Semir Ban': 25000, 'Cuci Mesin': 45000, 'Pembersih Jamur Kaca': 35000 },
  },
  'servis-motor-panggilan': {
    jenis_servis: { 'Ganti Oli': 0, 'Servis Ringan': 30000, 'Ganti Kampas Rem': 40000, 'Tune Up': 60000, 'Servis CVT': 75000, 'Servis Besar': 150000 },
  },
  'ganti-oli-panggilan': { oli_disediakan: 45000 },
  'foto-produk': {
    jumlah_item: 25000,
    gaya_foto: { 'Katalog Latar Putih': 0, 'Flat Lay': 50000, Lifestyle: 100000, 'Detail Makro': 75000 },
    tambahan: { 'Edit Retouch Lanjutan': 100000, 'Video Pendek': 250000, 'Foto 360 Derajat': 175000 },
  },
  'foto-prewedding': {
    paket_durasi: { 'Setengah Hari (4 jam)': 0, 'Sehari Penuh (8 jam)': 2000000 },
    jumlah_lokasi: 500000,
    tambahan: { 'Sewa Gaun': 750000, 'Makeup Artist': 1000000, Drone: 500000, 'Album Cetak': 1500000, 'Video Sinematik': 2500000 },
  },
  'dokumentasi-acara': {
    jenis_acara: { 'Ulang Tahun': 0, Seminar: 250000, Wisuda: 250000, 'Gathering Perusahaan': 500000, 'Upacara Keagamaan': 750000, Pernikahan: 1500000 },
    durasi_liputan: { '2 Jam': 0, '4 Jam': 800000, '8 Jam': 2000000 },
    tambahan: { 'Cetak Instan di Lokasi': 500000, 'Live Streaming': 750000, Drone: 600000, 'Same Day Edit': 1000000, Photobooth: 1200000 },
  },
  'makeup-artist-acara': {
    jumlah_orang: 150000,
    jenis_acara: { Wisuda: 0, Pesta: 50000, Pemotretan: 100000, 'Acara Kantor': 50000, Lamaran: 100000 },
    tambahan: { 'Penataan Rambut': 75000, Sanggul: 100000, 'Bulu Mata': 50000, 'Sewa Softlens': 50000, 'Touch Up di Lokasi': 150000 },
  },
  'makeup-pengantin': {
    paket: { 'Akad Saja': 0, 'Resepsi Saja': 500000, 'Akad dan Resepsi': 2500000 },
    jumlah_pendamping: 200000,
    tambahan: { 'Sewa Gaun': 1500000, 'Sanggul Tradisional': 500000, 'Penataan Rambut Pendamping': 300000, 'Touch Up Sepanjang Acara': 750000, Aksesori: 400000 },
  },
  'potong-rambut-panggilan': {
    jenis_layanan: { 'Potong Dewasa': 0, 'Potong Anak': 0, 'Cukur Jenggot': 0, 'Potong dan Keramas': 20000, 'Potong dan Pewarnaan': 150000 },
    jumlah_orang: 60000,
  },
  'servis-ac': {
    jenis_pekerjaan: { 'Cuci AC': 0, 'Pengecekan Rutin': 0, Perbaikan: 100000, 'Isi Freon': 150000, 'Bongkar Pasang': 200000 },
    jumlah_unit: 75000,
    kapasitas_pk: { '0.5 PK': 0, '1 PK': 0, '1.5 PK': 25000, '2 PK': 50000, 'Di atas 2 PK': 100000 },
    tambahan: { 'Cuci Outdoor Unit': 35000, 'Pembersihan Pipa': 50000, 'Vakum Sistem': 75000 },
  },
  'tukang-listrik': {
    jenis_pekerjaan: { 'Pengecekan Instalasi': 0, 'Pasang Lampu': 25000, 'Pasang Stop Kontak': 25000, 'Pasang MCB': 75000, 'Perbaikan Korsleting': 100000, 'Instalasi Baru': 300000 },
    jumlah_titik: 50000,
  },
  'servis-mesin-cuci': {
    jenis_pekerjaan: { Pengecekan: 0, 'Servis Ringan': 50000, 'Pembersihan Menyeluruh': 100000, 'Ganti Sparepart': 150000, 'Perbaikan Mesin': 250000 },
    tipe_mesin: { 'Bukaan Atas 1 Tabung': 0, 'Bukaan Atas 2 Tabung': 25000, 'Bukaan Depan': 75000, 'Mesin Cuci dan Pengering': 150000 },
  },
};

/** Rentang `estimated_duration_minutes` per sub-kategori (D90). */
export const DURATION: Record<SubSlug, [number, number]> = {
  'cuci-mobil-panggilan': [60, 90], 'servis-motor-panggilan': [60, 120], 'ganti-oli-panggilan': [30, 45],
  'foto-produk': [120, 240], 'foto-prewedding': [240, 240], 'dokumentasi-acara': [120, 120],
  'makeup-artist-acara': [90, 120], 'makeup-pengantin': [180, 240], 'potong-rambut-panggilan': [30, 60],
  'servis-ac': [60, 120], 'tukang-listrik': [60, 120], 'servis-mesin-cuci': [60, 120],
};

/** Batas kuantitas yang wajar saat memilih opsi NUMBER untuk order. */
export const QTY: Record<string, [number, number]> = {
  jumlah_item: [3, 15], jumlah_lokasi: [1, 2], jumlah_orang: [1, 4], jumlah_pendamping: [1, 3], jumlah_unit: [1, 4], jumlah_titik: [1, 6],
};

export const TITLES: Record<SubSlug, string[]> = {
  'cuci-mobil-panggilan': ['Cuci Mobil di Rumah Anda', 'Cuci Mobil Panggilan Bersih Kilat', 'Cuci dan Poles Mobil Panggilan', 'Cuci Mobil Hemat Air'],
  'servis-motor-panggilan': ['Servis Motor Panggilan', 'Bengkel Motor Datang ke Rumah', 'Servis Ringan dan Tune Up Motor', 'Servis Motor Matic Panggilan'],
  'ganti-oli-panggilan': ['Ganti Oli di Tempat', 'Ganti Oli Mobil dan Motor Panggilan'],
  'foto-produk': ['Foto Produk untuk Toko Online', 'Foto Katalog Produk UMKM', 'Foto Produk Kuliner dan Kerajinan'],
  'foto-prewedding': ['Prewedding Sawah dan Pantai Bali', 'Paket Foto Prewedding Lengkap', 'Prewedding Candid Ubud'],
  'dokumentasi-acara': ['Dokumentasi Acara Keluarga', 'Liputan Foto dan Video Acara', 'Dokumentasi Upacara dan Pernikahan', 'Dokumentasi Seminar dan Gathering'],
  'makeup-artist-acara': ['Makeup Wisuda dan Pesta', 'Makeup Acara Panggilan', 'Rias Natural untuk Acara', 'Makeup Lamaran dan Pemotretan'],
  'makeup-pengantin': ['Rias Pengantin Bali dan Modern', 'Paket Rias Akad dan Resepsi', 'Makeup Pengantin Natural'],
  'potong-rambut-panggilan': ['Potong Rambut di Rumah', 'Barber Panggilan Pria dan Anak', 'Potong Rambut Keluarga Panggilan'],
  'servis-ac': ['Cuci AC Split Panggilan', 'Servis dan Isi Freon AC', 'Bongkar Pasang dan Perbaikan AC', 'Servis AC Rumah dan Kantor'],
  'tukang-listrik': ['Tukang Listrik Panggilan', 'Perbaikan Korsleting dan MCB', 'Instalasi Listrik Rumah'],
  'servis-mesin-cuci': ['Servis Mesin Cuci Semua Merek', 'Perbaikan Mesin Cuci di Tempat', 'Bersihkan Tabung Mesin Cuci'],
};

export const PITCH: Record<SubSlug, string> = {
  'cuci-mobil-panggilan': 'Kami datang ke rumah atau kantor Anda dengan peralatan lengkap, jadi mobil bisa dicuci tanpa antre di tempat cuci.',
  'servis-motor-panggilan': 'Montir kami datang membawa perkakas dan suku cadang umum, cocok untuk motor yang sulit dibawa ke bengkel.',
  'ganti-oli-panggilan': 'Ganti oli cepat di depan rumah, oli bekas kami bawa pulang dan dibuang dengan benar.',
  'foto-produk': 'Foto produk dengan pencahayaan rapi untuk marketplace, media sosial, dan katalog cetak.',
  'foto-prewedding': 'Sesi prewedding dengan lokasi khas Bali, dari sawah berundak sampai pantai, diarahkan fotografer berpengalaman.',
  'dokumentasi-acara': 'Tim kami mendokumentasikan acara Anda dari persiapan sampai selesai, hasil diedit dan dikirim lewat tautan unduhan.',
  'makeup-artist-acara': 'Riasan rapi dan tahan lama untuk wisuda, pesta, dan acara kantor, perias datang ke lokasi Anda.',
  'makeup-pengantin': 'Rias pengantin untuk akad dan resepsi, tersedia gaya Bali tradisional maupun modern.',
  'potong-rambut-panggilan': 'Potong rambut di rumah untuk seluruh keluarga, alat selalu disterilkan sebelum dipakai.',
  'servis-ac': 'Teknisi kami menangani cuci, isi freon, perbaikan, sampai bongkar pasang AC split rumah maupun kantor.',
  'tukang-listrik': 'Perbaikan korsleting, pemasangan stop kontak dan lampu, sampai instalasi baru, dikerjakan sesuai standar keamanan.',
  'servis-mesin-cuci': 'Servis mesin cuci bukaan atas maupun depan, pengecekan gratis sebelum perbaikan disepakati.',
};

export const FAQS: Record<SubSlug, { question: string; answer: string }[]> = {
  'cuci-mobil-panggilan': [
    { question: 'Apakah perlu menyediakan air dan listrik?', answer: 'Lihat keterangan sumber air pada listing. Kalau air disediakan client, cukup satu keran di dekat mobil.' },
    { question: 'Berapa lama satu mobil dicuci?', answer: 'Sekitar satu jam untuk cuci biasa, lebih lama kalau ada poles body.' },
    { question: 'Apakah bisa mencuci di area parkir kantor?', answer: 'Bisa, selama pengelola gedung mengizinkan.' },
  ],
  'servis-motor-panggilan': [
    { question: 'Apakah suku cadang sudah termasuk harga?', answer: 'Belum, kecuali tertulis di listing. Suku cadang dihitung terpisah sesuai pemakaian.' },
    { question: 'Bagaimana kalau kerusakannya berat?', answer: 'Montir akan menjelaskan dulu, dan motor bisa dibawa ke bengkel mitra kalau perlu.' },
  ],
  'ganti-oli-panggilan': [
    { question: 'Oli merek apa yang dipakai?', answer: 'Kami membawa oli resmi sesuai spesifikasi kendaraan, atau memakai oli milik Anda.' },
    { question: 'Apakah filter oli ikut diganti?', answer: 'Bisa, sampaikan di catatan pesanan.' },
  ],
  'foto-produk': [
    { question: 'Kapan hasil foto dikirim?', answer: 'Biasanya tiga sampai lima hari kerja setelah pemotretan.' },
    { question: 'Apakah ada revisi?', answer: 'Satu kali revisi minor tanpa biaya tambahan.' },
  ],
  'foto-prewedding': [
    { question: 'Apakah biaya tiket masuk lokasi termasuk?', answer: 'Belum. Tiket masuk lokasi wisata ditanggung client.' },
    { question: 'Berapa foto yang diedit?', answer: 'Sesuai jumlah foto edit yang tercantum di listing.' },
    { question: 'Bagaimana kalau hujan?', answer: 'Jadwal bisa digeser sekali tanpa biaya, sesuai kesepakatan.' },
  ],
  'dokumentasi-acara': [
    { question: 'Apakah tim datang lebih awal?', answer: 'Ya, sekitar 30 menit sebelum acara untuk menyiapkan peralatan.' },
    { question: 'Dalam bentuk apa hasilnya diserahkan?', answer: 'Tautan unduhan, dan album cetak kalau dipilih.' },
    { question: 'Berapa orang yang datang?', answer: 'Satu penanggung jawab, ditambah pendamping untuk acara besar.' },
  ],
  'makeup-artist-acara': [
    { question: 'Apakah produk aman untuk kulit sensitif?', answer: 'Lihat kelas produk di listing. Sampaikan alergi di catatan pesanan.' },
    { question: 'Berapa lama satu orang dirias?', answer: 'Sekitar 45 sampai 60 menit per orang.' },
  ],
  'makeup-pengantin': [
    { question: 'Apakah tersedia trial makeup?', answer: 'Trial dipesan sebagai listing terpisah.' },
    { question: 'Apakah perias menunggu sampai acara selesai?', answer: 'Hanya kalau memilih touch up sepanjang acara.' },
  ],
  'potong-rambut-panggilan': [
    { question: 'Apakah perlu menyiapkan kursi dan kain?', answer: 'Cukup kursi, kain penutup kami bawa sendiri.' },
    { question: 'Bisa potong rambut anak kecil?', answer: 'Bisa, kami terbiasa menangani anak-anak.' },
  ],
  'servis-ac': [
    { question: 'Apakah ada garansi setelah servis?', answer: 'Garansi tujuh hari untuk keluhan yang sama.' },
    { question: 'Apakah harga sudah termasuk freon?', answer: 'Isi freon adalah opsi tersendiri, harganya tercantum saat memesan.' },
    { question: 'Berapa lama cuci satu unit AC?', answer: 'Sekitar 45 menit per unit.' },
  ],
  'tukang-listrik': [
    { question: 'Apakah material sudah termasuk?', answer: 'Lihat keterangan material di listing.' },
    { question: 'Apakah melayani malam hari?', answer: 'Hanya kalau listing menyediakan layanan darurat.' },
  ],
  'servis-mesin-cuci': [
    { question: 'Apakah pengecekan dikenakan biaya?', answer: 'Pengecekan sudah termasuk harga dasar listing.' },
    { question: 'Berapa lama garansi perbaikan?', answer: 'Sesuai jumlah hari garansi di listing.' },
  ],
};

export const FIRST_NAMES = [
  'I Wayan', 'I Made', 'I Nyoman', 'I Ketut', 'I Putu', 'I Kadek', 'I Komang', 'I Gede',
  'Ni Luh', 'Ni Made', 'Ni Nyoman', 'Ni Ketut', 'Ni Putu', 'Ni Kadek', 'Ni Komang',
  'Andi', 'Siti', 'Rina', 'Budi', 'Dimas', 'Fitri', 'Yoga', 'Intan', 'Rizky', 'Dewi', 'Agus', 'Maya', 'Hendra', 'Lestari',
];
export const LAST_NAMES = [
  'Sudarsana', 'Artawan', 'Wiradana', 'Pradnyana', 'Suarjana', 'Mahendra', 'Ariani', 'Sukmawati', 'Purnamasari', 'Wulandari',
  'Saputra', 'Permana', 'Kusuma', 'Santoso', 'Wijaya', 'Rahmawati', 'Hidayat', 'Setiawan', 'Anggraini', 'Pratiwi',
  'Astawa', 'Dharmawan', 'Yudiastini', 'Sanjaya', 'Pertiwi',
];

export const REVIEW_TEXT: Record<1 | 2 | 3 | 4 | 5, string[]> = {
  5: ['Sangat memuaskan, datang tepat waktu dan hasilnya rapi.', 'Ramah dan cekatan, pasti pesan lagi.', 'Pekerjaannya teliti, harga sesuai.', 'Mantap, penjelasannya jelas sebelum mulai.'],
  4: ['Hasilnya bagus, hanya datang agak terlambat.', 'Puas, komunikasinya baik.', 'Cukup memuaskan, sesuai deskripsi listing.'],
  3: ['Lumayan, tapi pengerjaannya lebih lama dari perkiraan.', 'Hasil cukup, perlu lebih rapi membereskan alat.'],
  2: ['Kurang memuaskan, ada bagian yang terlewat.', 'Datang terlambat cukup lama tanpa kabar.'],
  1: ['Tidak sesuai harapan, hasilnya harus diulang.'],
};

export const REPLIES = [
  'Terima kasih atas ulasannya, sampai jumpa di pesanan berikutnya.',
  'Terima kasih, masukannya kami catat untuk perbaikan layanan.',
  'Mohon maaf atas ketidaknyamanannya, tim kami akan lebih tepat waktu.',
  'Senang bisa membantu, semoga puas dengan hasilnya.',
];

export const BANKS = ['ID_BCA', 'ID_BNI', 'ID_BRI', 'ID_MANDIRI', 'ID_BSI'] as const;
