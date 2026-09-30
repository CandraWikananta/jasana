Project jasana {
  database_type: 'PostgreSQL'
  Note: '''
  Rancang Bangun Platform Marketplace Jasa On-Demand Berbasis Web
  yang Terintegrasi dengan Kecerdasan Buatan
  I Nyoman Gede Candra Wikananta - 2305551065

  VERSI 2.7. 34 tabel, 35 enum.
  Rujukan lengkap: Keputusan-Desain-Sistem.md (D1 sampai D80)

  Keputusan yang mengunci rancangan ini:
  - Available Now model DIRECT (client pilih listing milik satu penyedia)
  - Alur: provider accept dulu, baru client bayar
  - Escrow punya holding window 24 jam antara COMPLETED dan SETTLED
  - Dispute boleh dibuka sejak ARRIVED, batas akhirnya settlement_due_at
  - Platform fee = komisi dari provider 10 persen, client bayar harga listing apa adanya
  - Kode verifikasi DIENKRIPSI (reversible), bukan hash, karena client harus bisa melihatnya berulang

  Perubahan besar sejak versi final pertama:
  - TENAGA KERJA (D31-D49): order dikerjakan provider_workers, bukan akun provider.
    Ketersediaan dan lokasi real-time pindah ke pekerja. Kunci in-flight pindah
    dari provider ke pekerja. Freelancer = usaha dengan satu pekerja (provider_type).
  - PEMETAAN (D50-D53): worker_listings menentukan siapa bisa mengerjakan listing apa.
  - PENERIMAAN ORDER (D54-D57): Available Now diklaim pekerja ATAU pemilik,
    siapa cepat dia dapat. Scheduled diterima pemilik sekaligus menugaskan pekerja.
  - EMAIL DAN AKUN (D58-D64, D76): verification_tokens, refresh_tokens,
    verifikasi email wajib, penggantian email lewat pending_email.
  - KRU ORDER (D68-D69): satu penanggung jawab per order, pendamping dicatat
    di order_crew khusus mode SCHEDULED.
  - HARGA BERTINGKAT (D72-D73): atribut berperan SPEC atau OPTION.
    base_price jadi listing_base_amount, ditambah options_amount.
  - USULAN TAKSONOMI (D74): provider mengusulkan sub-kategori, atribut, atau
    option baru lewat taxonomy_requests. Admin yang menyetujui.
  - CHATBOT TAMU (D77, arahan Pembimbing 1): chat_sessions.user_id jadi nullable,
    tamu boleh bertanya sebelum punya akun, personalisasi dinonaktifkan.
  - KOMUNIKASI (D78-D79): listing_faqs untuk tanya jawab di muka, order_messages
    untuk pesan dalam order. Percakapan PRA-ORDER sengaja TIDAK disediakan,
    karena menggeser platform ke model quotation yang sudah ditolak D23.
    JANGAN menamainya chat: nama itu milik chatbot AI (chat_sessions).
  '''
}

// ============================================================
// ENUM
// ============================================================

Enum user_role {
  CLIENT
  ADMIN
}

Enum verification_status {
  DRAFT
  PENDING
  VERIFIED
  REJECTED
  SUSPENDED
}

// D32. Freelancer = usaha dengan satu pekerja.
// Menentukan dokumen e-KYC yang diminta saat apply (D46).
Enum provider_type {
  INDIVIDUAL
  BUSINESS
}

// D37. Bukan boolean, karena pelamar bukan anggota aktif tapi juga bukan tidak ada.
Enum worker_membership_status {
  PENDING
  ACTIVE
  REJECTED
  RESIGNED
}

Enum location_source_type {
  SAVED_ADDRESS
  CURRENT_LOCATION
  MAP_PIN
}

Enum kyc_document_type {
  KTP
  SELFIE_KTP
  NPWP
  CERTIFICATE
  BUSINESS_LICENSE
}

Enum kyc_status {
  PENDING
  APPROVED
  REJECTED
}

Enum attribute_data_type {
  TEXT
  NUMBER
  BOOLEAN
  SELECT
  MULTISELECT
  DATE
}

// D72. SPEC diisi provider dan tidak memengaruhi harga.
// OPTION dipilih client saat memesan dan punya delta harga.
Enum attribute_role {
  SPEC
  OPTION
}

// D72. FLAT_PER_OPTION untuk SELECT, MULTISELECT dan BOOLEAN.
// PER_UNIT untuk NUMBER, delta dikali nilai yang diisi client.
Enum pricing_mode {
  NONE
  FLAT_PER_OPTION
  PER_UNIT
}

Enum price_unit_type {
  PER_JOB
  PER_HOUR
  PER_UNIT
}

Enum listing_status {
  DRAFT
  ACTIVE
  INACTIVE
  SUSPENDED
}

Enum booking_mode_type {
  SCHEDULED
  AVAILABLE_NOW
}

Enum order_status {
  PENDING_ACCEPTANCE
  ACCEPTED
  PAID
  ON_THE_WAY
  ARRIVED
  IN_PROGRESS
  AWAITING_VERIFICATION
  COMPLETED
  SETTLED
  REJECTED
  EXPIRED
  PAYMENT_EXPIRED
  CANCELLED
  DISPUTED
  REFUNDED
}

// WORKER ditambahkan karena pekerja yang melakukan transisi
// ON_THE_WAY sampai AWAITING_VERIFICATION (D31).
Enum order_actor_type {
  CLIENT
  PROVIDER
  WORKER
  ADMIN
  SYSTEM
}

Enum payment_status {
  PENDING
  PAID
  EXPIRED
  FAILED
}

Enum webhook_domain {
  PAYMENT
  PAYOUT
  REFUND
}

Enum webhook_processing_status {
  RECEIVED
  PROCESSING
  PROCESSED
  FAILED
  IGNORED
}

Enum wallet_transaction_type {
  ESCROW_HOLD
  ESCROW_RELEASE
  WITHDRAWAL
  WITHDRAWAL_REVERSAL
  REFUND_DEDUCTION
  ADJUSTMENT
}

Enum transaction_creator {
  SYSTEM
  ADMIN
}

Enum withdrawal_status {
  REQUESTED
  APPROVED
  DISBURSING
  COMPLETED
  REJECTED
  FAILED
  REVERSED
}

Enum xendit_payout_status {
  ACCEPTED
  REQUESTED
  SUCCEEDED
  FAILED
  CANCELLED
  REVERSED
}

Enum refund_type {
  FULL
  PARTIAL
}

Enum refund_status {
  REQUESTED
  PROCESSING
  COMPLETED
  FAILED
}

Enum dispute_raiser_role {
  CLIENT
  PROVIDER
}

Enum dispute_category {
  WORK_NOT_DONE
  POOR_QUALITY
  PROVIDER_NO_SHOW
  CLIENT_NO_SHOW
  PAYMENT_ISSUE
  OTHER
}

Enum dispute_status {
  OPEN
  UNDER_REVIEW
  RESOLVED_REFUND
  RESOLVED_RELEASE
  RESOLVED_PARTIAL
  CLOSED
}

Enum chat_session_status {
  ACTIVE
  ENDED
}

Enum chat_message_role {
  USER
  ASSISTANT
  SYSTEM
}

Enum notification_type {
  ORDER_STATUS
  PAYMENT
  WITHDRAWAL
  KYC
  DISPUTE
  REVIEW
  WORKER_APPLICATION
  TAXONOMY_REQUEST
  ACCOUNT
  SYSTEM
}

Enum notification_channel {
  IN_APP
  EMAIL
}

Enum email_delivery_status {
  PENDING
  SENT
  FAILED
}

// D63. Tiga keperluan dengan mekanisme identik, satu tabel.
// Token DI-HASH, berbeda dengan kode verifikasi order yang dienkripsi.
Enum token_purpose {
  EMAIL_VERIFICATION
  PASSWORD_RESET
  EMAIL_CHANGE
}

// D74. Bobot admin berbeda: merancang seluruh atribut,
// meninjau satu atribut, atau menambah satu nilai ke options.
Enum taxonomy_request_type {
  NEW_SUBCATEGORY
  NEW_ATTRIBUTE
  NEW_ATTRIBUTE_OPTION
}

// MERGED untuk usulan yang ternyata sudah ada. Provider diberi tautan
// ke yang sudah ada, bukan sekadar ditolak.
Enum taxonomy_request_status {
  PENDING
  APPROVED
  REJECTED
  MERGED
}

// ============================================================
// A. IDENTITAS DAN AKSES
// ============================================================

Table users {
  id                 uuid          [pk, note: 'UUID, bukan auto-increment, supaya aman diekspos di URL dan tidak membocorkan jumlah pengguna']
  full_name          varchar(100)  [not null, note: 'Nama lengkap yang ditampilkan ke pihak lain']
  email              varchar(255)  [unique, not null, note: 'Unik. Bisa dipakai sebagai kredensial login, dan jadi tujuan seluruh notifikasi email']
  pending_email      varchar(255)  [note: 'D64. Alamat baru yang menunggu verifikasi. SENGAJA TANPA unique, supaya alamat yang pernah diketik lalu ditinggalkan tidak memblokir pemilik aslinya']
  phone              varchar(20)   [unique, not null, note: 'Unik. Alternatif kredensial login']
  password_hash      varchar(255)  [not null, note: 'bcrypt']
  role               user_role     [not null, default: 'CLIENT', note: 'Hanya CLIENT dan ADMIN. PROVIDER dan WORKER sengaja BUKAN role, melainkan hasil relasi']
  avatar_url         text          [note: 'Foto profil di Supabase Storage']
  is_active          boolean       [not null, default: true, note: 'Menonaktifkan akun tanpa menghapus datanya, supaya order lama tetap utuh']
  email_verified_at  timestamptz   [note: 'Timestamp, bukan boolean, supaya selain tahu sudah terverifikasi kita juga tahu kapan']
  created_at         timestamptz   [not null, default: `now()`, note: 'Waktu pendaftaran']
  updated_at         timestamptz   [not null, default: `now()`, note: 'Waktu perubahan terakhir']

  Note: '''
  PROVIDER bukan role. Provider adalah user yang punya provider_profiles berstatus VERIFIED (D4).
  PEKERJA juga bukan role. Pekerja adalah user yang punya provider_workers berstatus ACTIVE (D35).
  Satu orang satu akun satu alamat email, verifikasi cukup sekali saat registrasi (D61).
  '''
}

Table user_addresses {
  id            uuid           [pk, note: 'Primary key']
  user_id       uuid           [not null, note: 'Pemilik alamat']
  label         varchar(50)    [note: 'Nama yang diberikan pengguna sendiri, misalnya Rumah atau Kantor']
  address_line  text           [not null, note: 'Alamat tekstual untuk ditampilkan dan dibacakan ke pekerja']
  district      varchar(100)   [note: 'Kecamatan, untuk tampilan dan pencarian tekstual']
  city          varchar(100)   [note: 'Kota atau kabupaten']
  province      varchar(100)   [note: 'Provinsi']
  postal_code   varchar(10)    [note: 'Kode pos']
  latitude      decimal(10,8)  [not null, note: 'DECIMAL bukan FLOAT karena FLOAT punya galat pembulatan yang bisa menggeser hasil validasi radius 100 meter. Presisi 8 desimal setara sekitar 1 milimeter']
  longitude     decimal(11,8)  [not null, note: 'Presisi 11 digit karena rentang bujur -180 sampai 180 butuh 3 digit sebelum koma, sedangkan lintang cukup 2']
  is_default    boolean        [not null, default: false, note: 'Alamat yang dipakai otomatis saat memesan']
  created_at    timestamptz    [not null, default: `now()`, note: 'Waktu alamat ditambahkan']
  updated_at    timestamptz    [not null, default: `now()`, note: 'Waktu perubahan terakhir']

  indexes {
    (user_id, is_default)
  }

  Note: 'Salah satu dari empat sumber data personalisasi chatbot. Tidak dipakai untuk sesi tamu (D77).'
}

Table verification_tokens {
  id          uuid           [pk, note: 'Primary key']
  user_id     uuid           [not null, note: 'Pemilik token']
  token_hash  varchar(255)   [not null, unique, note: 'SHA-256 dari token mentah. Token mentah TIDAK pernah tersimpan']
  purpose     token_purpose  [not null, note: 'Menentukan alur mana yang berlaku dan berapa masa berlakunya']
  expires_at  timestamptz    [not null, note: 'EMAIL_VERIFICATION dan EMAIL_CHANGE 24 jam, PASSWORD_RESET 1 jam']
  used_at     timestamptz    [note: 'Terisi saat token dipakai. Juga dipakai membatalkan token lama saat kirim ulang']
  created_at  timestamptz    [not null, default: `now()`, note: 'Waktu token dibuat']

  indexes {
    (user_id, purpose)
  }

  Note: '''
  D63. Token dibuat dengan crypto.randomBytes(32), disimpan sebagai hash.
  Di-HASH bukan dienkripsi, karena token link tidak pernah perlu ditampilkan lagi.
  Bandingkan dengan orders.verification_code_encrypted yang harus reversible.
  Kirim ulang membatalkan token lama dengan mengisi used_at.
  '''
}

Table refresh_tokens {
  id           uuid          [pk, note: 'Primary key']
  user_id      uuid          [not null, note: 'Pemilik sesi']
  token_hash   varchar(255)  [not null, unique, note: 'SHA-256 dari token mentah']
  family_id    uuid          [not null, note: 'rantai rotasi, satu per sesi login']
  expires_at   timestamptz   [not null, note: '30 hari']
  revoked_at   timestamptz   [note: 'Terisi saat token dicabut, entah karena rotasi, logout, ganti password, atau deteksi pemakaian ulang']
  replaced_by  uuid          [note: 'token pengganti saat rotasi']
  user_agent   varchar(255)  [note: 'untuk halaman perangkat aktif, bukan untuk keamanan']
  ip_address   varchar(45)   [note: 'Untuk halaman daftar perangkat aktif. Panjang 45 supaya muat alamat IPv6']
  created_at   timestamptz   [not null, default: `now()`, note: 'Waktu token diterbitkan']

  indexes {
    (user_id, revoked_at)
    family_id
  }

  Note: '''
  D76. Access token JWT 15 menit tanpa state, refresh token 30 hari disimpan di sini.
  ROTASI WAJIB: setiap pemakaian mencabut token lama dan menerbitkan pengganti dalam family_id yang sama.
  DETEKSI PEMAKAIAN ULANG: token yang sudah revoked_at dipakai lagi berarti ada salinan dicuri,
  seluruh family_id dicabut.
  Pencabutan: logout (satu token), logout semua perangkat (semua token user),
  ganti password (semua token user), pemakaian ulang (satu family_id).
  '''
}

Table provider_profiles {
  id                       uuid                 [pk, note: 'Primary key']
  user_id                  uuid                 [unique, not null, note: 'Unik, jadi satu akun hanya bisa punya satu usaha']
  provider_type            provider_type        [not null, default: 'INDIVIDUAL', note: 'D46. Dipilih saat apply, menentukan dokumen e-KYC yang diminta']
  requested_provider_type  provider_type        [note: 'D47. Pengajuan perubahan tipe. verification_status TIDAK direset supaya usaha tetap beroperasi']
  business_name            varchar(150)         [note: 'Nama usaha yang ditampilkan ke calon client']
  bio                      text                 [note: 'Deskripsi usaha']
  verification_status      verification_status  [not null, default: 'DRAFT', note: 'Hanya VERIFIED yang boleh membuat listing dan menerima order']
  verified_at              timestamptz          [note: 'Kapan admin menyetujui']
  verified_by              uuid                 [note: 'Admin mana yang menyetujui, untuk jejak audit']
  rejection_reason         text                 [note: 'Alasan penolakan, supaya pengaju tahu apa yang harus diperbaiki']
  base_address             text                 [note: 'Alamat tetap usaha, untuk profil publik']
  base_latitude            decimal(10,8)        [note: 'Koordinat tetap usaha. BEDA dengan posisi pekerja yang bergerak dan ada di provider_workers']
  base_longitude           decimal(11,8)        [note: 'Pasangan base_latitude']
  service_radius_km        decimal(5,2)         [default: 10, note: 'kebijakan usaha, bukan per pekerja']
  rating_average           decimal(3,2)         [not null, default: 0, note: 'Cache hasil agregasi reviews. Denormalisasi disengaja supaya daftar jasa tidak menghitung ulang untuk puluhan penyedia sekaligus']
  rating_count             int                  [not null, default: 0, note: 'Jumlah review, dipakai menampilkan rata-rata beserta basisnya']
  completed_orders_count   int                  [not null, default: 0, note: 'Cache jumlah order selesai, indikator pengalaman usaha']
  created_at               timestamptz          [not null, default: `now()`, note: 'Waktu pengajuan dibuat']
  updated_at               timestamptz          [not null, default: `now()`, note: 'Waktu perubahan terakhir']

  indexes {
    verification_status
    provider_type
  }

  Note: '''
  D38. current_latitude, current_longitude dan location_updated_at DIPINDAH ke provider_workers,
  karena yang bergerak adalah pekerja, bukan usaha.
  Saat admin menyetujui e-KYC, sistem membuat wallet DAN baris provider_workers untuk
  pemiliknya dengan is_owner = true (D33).
  Rating dan e-KYC tetap di tingkat usaha (D34, D49).
  '''
}

Table kyc_documents {
  id                   uuid               [pk, note: 'Primary key']
  provider_profile_id  uuid               [not null, note: 'Milik usaha mana']
  document_type        kyc_document_type  [not null, note: 'Jenis dokumen. BUSINESS_LICENSE dan NPWP hanya diminta untuk provider_type BUSINESS']
  file_url             text               [not null, note: 'Supabase Storage']
  status               kyc_status         [not null, default: 'PENDING', note: 'Status per DOKUMEN, bukan per pengajuan, supaya admin bisa menolak satu berkas saja tanpa membatalkan seluruh pengajuan']
  note                 text               [note: 'Catatan admin per dokumen, misalnya selfie kabur']
  uploaded_at          timestamptz        [not null, default: `now()`, note: 'Kapan diunggah']
  reviewed_at          timestamptz        [note: 'Kapan diperiksa admin']

  Note: 'D34. e-KYC hanya di tingkat usaha. Pekerja divalidasi oleh pemilik provider, bukan admin platform. INDIVIDUAL cukup KTP dan selfie, BUSINESS perlu tambahan NPWP atau izin usaha.'
}

// ============================================================
// A2. TENAGA KERJA
// ============================================================

Table provider_workers {
  id                   uuid                      [pk, note: 'Primary key']
  provider_profile_id  uuid                      [not null, note: 'Bekerja di usaha mana']
  user_id              uuid                      [not null, note: 'Akun orangnya. Eksklusivitas keanggotaan aktif ditegakkan partial unique index di migrasi SQL']
  display_name         varchar(100)              [not null, note: 'Nama yang ditampilkan ke client sebagai penanggung jawab order']
  photo_url            text                      [note: 'Foto pekerja, supaya client mengenali siapa yang datang']
  experience_note      text                      [note: 'diisi pelamar saat melamar']
  is_owner             boolean                   [not null, default: false, note: 'D33. Dibuat otomatis saat e-KYC disetujui']
  membership_status    worker_membership_status  [not null, default: 'PENDING', note: 'Enum bukan boolean, karena pelamar bukan anggota aktif tapi juga bukan tidak ada']
  accepts_assignments  boolean                   [not null, default: true, note: 'D39. false = pengelola saja, tidak pernah muncul di penugasan mode apapun']
  is_available         boolean                   [not null, default: false, note: 'D39. Toggle online Available Now, hanya bermakna kalau accepts_assignments true']
  current_latitude     decimal(10,8)             [note: 'posisi terkini untuk matching Available Now']
  current_longitude    decimal(11,8)             [note: 'Pasangan current_latitude, dipakai bounding box filter sebelum Haversine presisi']
  location_updated_at  timestamptz               [note: 'D66. Dikirim saat berpindah lebih dari 200 m atau tiap 5 menit, bukan interval tetap']
  approved_by          uuid                      [note: 'pemilik yang menyetujui, null untuk baris pemilik sendiri']
  approved_at          timestamptz               [note: 'Kapan lamaran disetujui pemilik']
  created_at           timestamptz               [not null, default: `now()`, note: 'Kapan baris dibuat, yaitu saat melamar atau saat e-KYC disetujui untuk pemilik']
  updated_at           timestamptz               [not null, default: `now()`, note: 'Waktu perubahan terakhir']

  indexes {
    (current_latitude, current_longitude)                  [name: 'idx_worker_geo']
    (provider_profile_id, membership_status, is_available) [name: 'idx_worker_matching']
    user_id
  }

  Note: '''
  D31. Order selalu dikerjakan pekerja, tidak pernah oleh akun provider secara langsung.
  D36. Satu orang hanya boleh punya SATU keanggotaan aktif. Ditegakkan partial unique index
  pada user_id dengan predikat membership_status = ACTIVE (lihat migration-constraints.sql).
  Akibatnya pemilik usaha tidak bisa jadi pekerja di usaha lain, dan pekerja yang ingin
  membuka usaha sendiri harus resign dulu. Disengaja, ditulis sebagai batasan penelitian.
  D39. Setiap provider WAJIB punya minimal satu pekerja ACTIVE dengan accepts_assignments true.
  D65. Penanda online diambil dari koneksi Socket.IO, bukan dari umur location_updated_at.
  idx_worker_geo dipakai bounding box filter sebelum Haversine presisi (D6).
  '''
}

Table worker_listings {
  id          uuid         [pk, note: 'Primary key']
  worker_id   uuid         [not null, note: 'Pekerja yang dinyatakan mampu mengerjakan']
  listing_id  uuid         [not null, note: 'Jasa yang bisa dia kerjakan']
  created_at  timestamptz  [not null, default: `now()`, note: 'Kapan pemetaan dibuat']

  indexes {
    (worker_id, listing_id) [unique]
    listing_id
  }

  Note: '''
  D50. Relasi banyak ke banyak: satu pekerja boleh dipetakan ke beberapa listing,
  satu listing boleh punya beberapa pekerja.
  D51. Di level listing, bukan sub-kategori, karena yang dipesan client adalah listing.
  D52. Pilihan pelamar bersifat usulan, pemilik yang mengesahkan. Baris dibuat sejak
  pelamar mencentang, tapi baru berlaku ketika membership_status = ACTIVE.
  D53. Listing tanpa satu pun pekerja terpetakan tertahan di DRAFT.
  Untuk provider INDIVIDUAL pemetaan dibuat otomatis saat listing dibuat.
  Dipakai menyaring dropdown penugasan Scheduled dan daftar penerima tawaran Available Now.
  '''
}

// ============================================================
// B. KATALOG JASA (HYBRID APPROACH 2-LEVEL)
// ============================================================

Table categories {
  id             uuid          [pk, note: 'Primary key']
  name           varchar(100)  [unique, not null, note: 'Nama kategori, unik']
  slug           varchar(120)  [unique, not null, note: 'Versi URL-friendly, unik']
  description    text          [note: 'Penjelasan singkat kategori']
  icon_name      varchar(50)   [note: 'nama ikon dari whitelist Lucide, mis. spray-can. Diprioritaskan di atas icon_url']
  icon_url       text          [note: 'Ikon unggahan sendiri, dipakai hanya kalau icon_name kosong']
  display_order  int           [not null, default: 0, note: 'Urutan tampil yang diatur admin']
  is_active      boolean       [not null, default: true, note: 'Menyembunyikan kategori tanpa menghapusnya, supaya sub-kategori dan listing lama tidak rusak']
  created_at     timestamptz   [not null, default: `now()`, note: 'Waktu dibuat']
  updated_at     timestamptz   [not null, default: `now()`, note: 'Waktu perubahan terakhir']
}

Table subcategories {
  id                          uuid           [pk, note: 'Primary key']
  category_id                 uuid           [not null, note: 'Kategori induk. Hierarki sengaja dibatasi dua level supaya query tidak butuh recursive CTE']
  name                        varchar(100)   [not null, note: 'Nama jasa yang dilihat client']
  slug                        varchar(120)   [not null, note: 'Versi URL-friendly, unik dalam satu kategori saja']
  description                 text           [note: 'Penjelasan jasa']
  suggested_price_min         decimal(12,2)  [note: 'panduan harga bagi provider, peringatan lunak bukan batas keras']
  suggested_price_max         decimal(12,2)  [note: 'Batas atas panduan harga. Bersama min, dipakai memberi peringatan lunak saat provider mengisi harga']
  estimated_duration_minutes  int            [note: 'Estimasi durasi standar jasa ini, jadi nilai awal saat provider membuat listing']
  display_order               int            [not null, default: 0, note: 'Urutan tampil dalam kategorinya']
  is_active                   boolean        [not null, default: true, note: 'Menyembunyikan sub-kategori tanpa merusak listing lama']
  created_at                  timestamptz    [not null, default: `now()`, note: 'Waktu dibuat']
  updated_at                  timestamptz    [not null, default: `now()`, note: 'Waktu perubahan terakhir']

  indexes {
    (category_id, slug) [unique]
  }

  Note: 'Daftar sub-kategori aktif disuntikkan ke system prompt Gemini sebagai target intent extraction. Definisi dua belas sub-kategori contoh ada di Lampiran B Keputusan-Desain-Sistem.md (D71).'
}

Table subcategory_attributes {
  id               uuid                 [pk, note: 'Primary key']
  subcategory_id   uuid                 [not null, note: 'Atribut ini milik sub-kategori mana']
  attribute_key    varchar(50)          [not null, note: 'key di JSONB listings.attributes. snake_case, tidak pernah berubah']
  label            varchar(100)         [not null, note: 'yang ditampilkan ke manusia, boleh diedit kapan saja']
  data_type        attribute_data_type  [not null, note: 'Menentukan bentuk input di form dan cara validasi nilainya']
  attribute_role   attribute_role       [not null, default: 'SPEC', note: 'D72. SPEC diisi provider, OPTION dipilih client saat memesan']
  pricing_mode     pricing_mode         [not null, default: 'NONE', note: 'D72. Hanya bermakna kalau attribute_role = OPTION']
  options          jsonb                [note: 'untuk SELECT / MULTISELECT. Nilai ditandai aktif atau tidak, BUKAN dibuang (D67)']
  unit             varchar(20)          [note: 'Satuan yang ditampilkan di samping input, misalnya m2, jam, atau unit']
  is_required      boolean              [not null, default: false, note: 'Atribut wajib baru hanya berlaku untuk listing baru, listing lama ditandai perlu dilengkapi']
  is_filterable    boolean              [not null, default: false, note: 'Menentukan atribut ini muncul di panel filter client atau tidak. Durasi berguna dilihat tapi tidak masuk akal jadi filter']
  is_active        boolean              [not null, default: true, note: 'D67. Penghapusan atribut bersifat soft supaya nilai lama di listings.attributes tetap punya arti']
  validation_rule  jsonb                [note: 'min, max, regex']
  display_order    int                  [not null, default: 0, note: 'Urutan atribut di form dan di panel filter']
  created_at       timestamptz          [not null, default: `now()`, note: 'Waktu definisi dibuat']
  updated_at       timestamptz          [not null, default: `now()`, note: 'Waktu perubahan terakhir']

  indexes {
    (subcategory_id, attribute_key) [unique]
    (subcategory_id, is_active)
  }

  Note: '''
  Inti Hybrid Approach (D2, D3). Backend memvalidasi listings.attributes terhadap definisi di tabel ini.
  Inilah yang membuat penambahan kategori baru tidak mengubah struktur basis data.

  D67. Empat aturan saat admin mengubah definisi yang sudah dipakai listing:
    1. Validasi hanya dijalankan saat TULIS, tidak pernah saat baca. Listing lama tetap tayang.
    2. Atribut wajib baru hanya berlaku untuk listing baru. Listing lama ditandai
       attributes_need_update dan dipaksa mengisi pada kali berikutnya diedit.
    3. Penghapusan atribut dan option bersifat soft lewat is_active.
    4. TIDAK ADA backfill otomatis. Sistem tidak menebak nilai atas nama provider.

  D74. Option baru hanya boleh ditambahkan admin. Provider mengusulkan lewat taxonomy_requests.
  '''
}

Table listings {
  id                          uuid             [pk, note: 'Primary key']
  provider_profile_id         uuid             [not null, note: 'Usaha pemilik listing']
  subcategory_id              uuid             [not null, note: 'Klasifikasi jasa, penentu atribut apa saja yang berlaku']
  title                       varchar(150)     [not null, note: 'Judul yang dibaca client di hasil pencarian']
  description                 text             [note: 'Penjelasan jasa dari provider']
  price                       decimal(12,2)    [not null, note: 'harga dasar sebelum delta opsi']
  price_unit                  price_unit_type  [not null, default: 'PER_JOB', note: 'Satuan harga, menentukan cara harga dibacakan ke client']
  estimated_duration_minutes  int              [note: 'Estimasi durasi versi provider. Di-snapshot ke order dan dipakai pemeriksaan bentrok jadwal']
  attributes                  jsonb            [not null, note: 'HANYA nilai atribut SPEC. Index GIN ditambahkan manual di migrasi SQL']
  attributes_need_update      boolean          [not null, default: false, note: 'D67. Listing lama yang belum memenuhi atribut wajib yang baru ditambahkan admin']
  supports_scheduled          boolean          [not null, default: true, note: 'Boleh dipesan terjadwal']
  supports_available_now      boolean          [not null, default: false, note: 'kapabilitas, bukan status online']
  status                      listing_status   [not null, default: 'DRAFT', note: 'DRAFT dipakai juga untuk menahan listing yang belum punya pekerja terpetakan']
  rating_average              decimal(3,2)     [not null, default: 0, note: 'Cache agregasi reviews listing ini']
  rating_count                int              [not null, default: 0, note: 'Jumlah review listing ini']
  order_count                 int              [not null, default: 0, note: 'Cache jumlah order selesai, dipakai pengurutan populer']
  created_at                  timestamptz      [not null, default: `now()`, note: 'Waktu dibuat']
  updated_at                  timestamptz      [not null, default: `now()`, note: 'Waktu perubahan terakhir']
  deleted_at                  timestamptz      [note: 'soft delete, order lama tetap merujuk ke sini']

  indexes {
    (subcategory_id, status) [name: 'idx_listing_search']
    provider_profile_id
  }

  Note: '''
  D45. is_available_now DIBUANG. Status online sekarang TURUNAN, bukan kolom:
  listing bisa dipesan mendadak kalau punya minimal satu pekerja TERPETAKAN (worker_listings)
  yang is_available = true, presence belum basi, dan tidak sedang in-flight.
  Kalau kolom dan pekerja sama-sama menyimpan ketersediaan, ada dua sumber kebenaran.
  Konsekuensi: filter available_now=true pada GET /listings menjadi join ke
  worker_listings dan provider_workers, sehingga idx_worker_geo WAJIB ada sebelum stress testing.

  D53. Listing tanpa pekerja terpetakan tidak boleh berpindah dari DRAFT ke ACTIVE.
  D72. Nilai atribut OPTION tidak disimpan di sini, melainkan di listing_option_prices.
  '''
}

Table listing_option_prices {
  id             uuid           [pk, note: 'Primary key']
  listing_id     uuid           [not null, note: 'Harga opsi ini berlaku untuk listing mana']
  attribute_key  varchar(50)    [not null, note: 'Merujuk subcategory_attributes.attribute_key. Sengaja disimpan sebagai teks, bukan foreign key, supaya nilai lama tetap terbaca kalau definisi atribut dinonaktifkan']
  option_value   varchar(100)   [note: 'null untuk BOOLEAN dan NUMBER (PER_UNIT)']
  price_delta    decimal(12,2)  [not null, default: 0, note: 'Tambahan harga kalau opsi ini dipilih. Tidak boleh negatif, supaya total tidak bisa jatuh di bawah harga listing']
  is_offered     boolean        [not null, default: true, note: 'opsi yang tidak dicentang provider tidak muncul ke client']

  indexes {
    (listing_id, attribute_key, option_value) [unique]
    listing_id
  }

  Note: '''
  D72. Provider menyatakan opsi mana yang dia layani dan berapa tambahan harganya.
  Admin menentukan opsi APA SAJA yang tersedia, provider menentukan NOMINAL-nya.

  Cara hitung per data_type:
    SELECT      satu delta terpilih
    MULTISELECT jumlah semua delta terpilih
    BOOLEAN     delta datar kalau true
    NUMBER      delta dikali nilai yang diisi client (PER_UNIT)

  D73. HARGA SELALU DIHITUNG ULANG DI SERVER dari tabel ini. Request pemesanan
  hanya berisi pilihan opsi, tidak pernah berisi angka. Kalau client boleh mengirim
  total, siapa pun bisa memesan jasa premium seharga seribu rupiah lewat Postman.
  '''
}

Table listing_photos {
  id             uuid          [pk, note: 'Primary key']
  listing_id     uuid          [not null, note: 'Foto ini milik listing mana']
  file_url       text          [not null, note: 'Lokasi berkas di Supabase Storage. Berkasnya tidak disimpan di basis data']
  caption        varchar(150)  [note: 'Keterangan foto']
  display_order  int           [not null, default: 0, note: 'Urutan di galeri']
  is_primary     boolean       [not null, default: false, note: 'Foto utama yang tampil di kartu hasil pencarian']
  created_at     timestamptz   [not null, default: `now()`, note: 'Waktu diunggah']
}

Table listing_faqs {
  id             uuid          [pk, note: 'Primary key']
  listing_id     uuid          [not null, note: 'FAQ ini milik listing mana']
  question       varchar(200)  [not null, note: 'Pertanyaan yang sering diajukan, ditulis provider sendiri']
  answer         text          [not null, note: 'Jawabannya. Teks saja, tanpa lampiran']
  display_order  int           [not null, default: 0, note: 'Urutan tampil di halaman listing']
  is_active      boolean       [not null, default: true, note: 'admin bisa menonaktifkan kalau ada laporan']
  created_at     timestamptz   [not null, default: `now()`, note: 'Waktu dibuat']
  updated_at     timestamptz   [not null, default: `now()`, note: 'Waktu perubahan terakhir']

  indexes {
    (listing_id, display_order)
  }

  Note: '''
  D78. Provider menulis sendiri tanya jawabnya di muka, tampil di halaman
  listing, terbaca SEMUA calon client. Teks saja, maksimal
  listing_faq_max_items butir per listing.

  Kenapa ini dan bukan percakapan pra-order: pertanyaan sebelum memesan
  seharusnya dijawab STRUKTUR, bukan percakapan. Atribut SPEC sudah menjawab
  sebagian besar (sumber_air, sparepart, material, merek_dilayani semuanya
  adalah pertanyaan pra-order yang sudah jadi kolom), dan FAQ menutup sisanya.

  Bedanya dengan percakapan: yang terbantu semua calon client bukan satu
  penanya, provider tidak perlu online, tidak ada risiko disintermediasi,
  dan tidak menggeser platform ke model quotation.

  Isi ditulis provider dan TIDAK dimoderasi otomatis (H76). Admin menonaktifkan
  lewat is_active kalau ada laporan.
  '''
}

Table taxonomy_requests {
  id                       uuid                     [pk, note: 'Primary key']
  request_type             taxonomy_request_type    [not null, note: 'Menentukan kolom konteks mana yang wajib diisi dan form tinjauan mana yang ditampilkan ke admin']
  provider_profile_id      uuid                     [not null, note: 'hanya provider VERIFIED yang boleh mengusulkan']

  category_id              uuid                     [note: 'konteks NEW_SUBCATEGORY']
  subcategory_id           uuid                     [note: 'konteks NEW_ATTRIBUTE dan NEW_ATTRIBUTE_OPTION']
  attribute_key            varchar(50)              [note: 'konteks NEW_ATTRIBUTE_OPTION']

  proposed_name            varchar(150)             [not null, note: 'nama jasa, nama atribut, atau nilai option yang diusulkan']
  work_description         text                     [note: 'NEW_SUBCATEGORY: jelaskan singkat pekerjaannya']
  price_factors            text                     [note: 'NEW_SUBCATEGORY: apa yang membuat harganya berbeda. Bahan admin menentukan atribut OPTION']
  common_questions         text                     [note: 'NEW_SUBCATEGORY: hal yang biasanya ditanyakan client. Bahan admin menentukan atribut SPEC']
  duration_min_minutes     int                      [note: 'Jawaban berapa lama biasanya dikerjakan, batas bawah. Bahan admin menyusun validation_rule durasi']
  duration_max_minutes     int                      [note: 'Batas atas durasi menurut provider']
  booking_mode_suggestion  varchar(20)              [note: 'Menurut provider jasa ini cocok dipesan mendadak, dijadwalkan, atau keduanya. Bahan admin menentukan supports_available_now']
  market_price_min         decimal(12,2)            [note: 'Kisaran harga pasaran menurut provider, bahan admin mengisi suggested_price_min']
  market_price_max         decimal(12,2)            [note: 'Batas atas kisaran harga menurut provider']

  proposed_role            varchar(10)              [note: 'NEW_ATTRIBUTE: SPEC atau OPTION menurut provider']
  proposed_data_type       varchar(20)              [note: 'NEW_ATTRIBUTE: jawabannya berupa apa']
  affects_price            boolean                  [note: 'NEW_ATTRIBUTE: memengaruhi harga atau tidak']
  proposed_options         text                     [note: 'NEW_ATTRIBUTE: satu nilai per baris']
  reason                   text                     [note: 'kenapa ini perlu. Penentu utama diterima atau tidak']

  status                   taxonomy_request_status  [not null, default: 'PENDING', note: 'MERGED dipakai untuk usulan yang ternyata sudah ada, supaya provider diberi tautan ke yang sudah ada bukan sekadar ditolak']
  admin_note               text                     [note: 'alasan penolakan atau catatan penggabungan']
  resulting_id             uuid                     [note: 'id taksonomi yang terbentuk kalau disetujui. Bahan angka Bab IV']
  reviewed_by              uuid                     [note: 'Admin yang meninjau']
  reviewed_at              timestamptz              [note: 'Kapan ditinjau']
  created_at               timestamptz              [not null, default: `now()`, note: 'Kapan diusulkan']

  indexes {
    (provider_profile_id, status)
    (status, request_type)
    (subcategory_id, request_type)
  }

  Note: '''
  D74. Menutup kelemahan model terpusat dari tiga arah sekaligus.
  Provider TIDAK boleh membuat taksonomi sendiri, karena kosakata yang tidak seragam
  merusak filter lintas penyedia yang jadi tujuan penelitian nomor 1.

  Batas 3 usulan aktif per provider, dihitung LINTAS JENIS bukan per jenis.
  Usulan NEW_ATTRIBUTE yang disetujui SELALU masuk sebagai opsional, tidak pernah
  otomatis wajib. Satu provider tidak boleh memaksa provider lain mengisi kolom baru.

  Kriteria admin menyetujui usulan atribut:
    terima  relevan untuk banyak penyedia, client mungkin ingin memfilternya,
            nilainya terbatas dan bisa didaftar
    tolak   hanya relevan satu penyedia, sudah tercakup atribut lain dengan kata berbeda,
            jawabannya teks bebas yang tidak bisa dibandingkan

  Deteksi kesamaan dilakukan MANUAL oleh admin, dibantu daftar yang ditampilkan.
  Sistem tidak mencocokkan otomatis karena kesamaan makna tidak bisa disimpulkan
  dari kesamaan teks.
  '''
}

// ============================================================
// C. ORDER
// ============================================================

Table orders {
  id                           uuid                  [pk, note: 'Primary key']
  order_number                 varchar(30)           [unique, not null, note: 'ORD-20260914-0001']
  client_id                    uuid                  [not null, note: 'Yang memesan dan membayar']
  provider_profile_id          uuid                  [not null, note: 'usaha yang bertanggung jawab, penerima uang']
  assigned_worker_id           uuid                  [note: 'D42, D68. PENANGGUNG JAWAB order. Nullable saat PENDING_ACCEPTANCE, WAJIB mulai ACCEPTED']
  accepted_by                  uuid                  [note: 'D70. Siapa yang menekan tombol terima. Bisa berbeda dari penanggung jawab kalau pemilik yang menerima order Available Now']
  listing_id                   uuid                  [not null, note: 'Jasa yang dipesan. Nilainya tetap dirujuk walaupun listing sudah di-soft-delete']
  booking_mode                 booking_mode_type     [not null, note: 'Menentukan SLA respons, siapa yang boleh menerima, dan apakah pendamping tersedia']
  status                       order_status          [not null, default: 'PENDING_ACCEPTANCE', note: 'Hanya boleh diubah lewat transitionOrder, tidak pernah ditulis langsung']
  scheduled_at                 timestamptz           [note: 'hanya mode SCHEDULED']

  service_address              text                  [not null, note: 'Alamat tekstual yang dibacakan ke pekerja. Disalin dari user_addresses, bukan dirujuk, supaya perubahan alamat tidak mengubah order lama']
  service_latitude             decimal(10,8)         [not null, note: 'Titik acuan perhitungan jarak Haversine saat check-in']
  service_longitude            decimal(11,8)         [not null, note: 'Pasangan service_latitude']
  service_notes                text                  [note: 'Catatan tambahan client, misalnya pagar warna hijau']

  location_source              location_source_type  [not null, note: 'Menentukan apakah location_accuracy_m punya arti. Tanpa kolom ini, data akurasi GPS di Bab IV tercampur dengan koordinat yang bukan dari GPS']
  location_accuracy_m          decimal(8,2)          [note: 'akurasi GPS client saat memesan, null kalau dari alamat tersimpan atau pin manual']

  snapshot_listing_title       varchar(150)          [not null, note: 'Judul listing saat dipesan, supaya riwayat order tetap benar kalau provider mengganti judulnya']
  snapshot_assignee_name       varchar(100)          [note: 'D68. Nama penanggung jawab saat ditugaskan']
  snapshot_attributes          jsonb                 [note: 'nilai atribut SPEC listing saat dipesan']
  snapshot_selected_options    jsonb                 [note: 'D73. Opsi yang dipilih client: key, label, nilai, dan delta SAAT ITU. Provider boleh mengubah tarif besok, order kemarin harus tetap bisa dijelaskan']
  snapshot_duration_minutes    int                   [note: 'durasi saat dipesan, dipakai pemeriksaan bentrok jadwal Scheduled dan estimasi waktu selesai']

  listing_base_amount          decimal(12,2)         [not null, note: 'D73. Harga listing saat dipesan, TANPA opsi. Menggantikan base_price']
  options_amount               decimal(12,2)         [not null, default: 0, note: 'D73. Jumlah seluruh delta opsi. Wajib jadi kolom karena CHECK constraint tidak bisa membaca JSONB']
  platform_fee                 decimal(12,2)         [not null, note: 'komisi platform, 10 persen dari total_amount']
  total_amount                 decimal(12,2)         [not null, note: 'yang dibayar client = listing_base_amount + options_amount']
  provider_earning             decimal(12,2)         [not null, note: 'total_amount - platform_fee']
  platform_fee_refunded        decimal(12,2)         [not null, default: 0, note: 'jejak fee yang dikembalikan saat refund']

  verification_code_encrypted  varchar(255)          [note: 'AES reversible, bukan hash, karena client harus bisa melihatnya berulang. Digenerate saat transisi ke AWAITING_VERIFICATION, bukan saat PAID. TIDAK PERNAH dikirim lewat email (D60)']
  verification_attempts        smallint              [not null, default: 0, note: 'Penghitung percobaan gagal. Dinaikkan SEBELUM kode dibandingkan, supaya percobaan yang request-nya putus tetap terhitung']
  verification_locked_until    timestamptz           [note: 'lockout setelah 5 percobaan gagal']
  verification_expires_at      timestamptz           [note: 'Masa berlaku kode, supaya kode tidak berlaku selamanya']
  verified_at                  timestamptz           [note: 'Kapan kode berhasil diverifikasi']

  response_deadline_at         timestamptz           [note: '5 menit AVAILABLE_NOW / 24 jam SCHEDULED']
  payment_deadline_at          timestamptz           [note: 'window bayar setelah provider accept']
  settlement_due_at            timestamptz           [note: 'akhir holding window 24 jam. Juga batas akhir client boleh buka dispute']

  accepted_at                  timestamptz           [note: 'Kapan order diterima dan pekerja ditugaskan']
  paid_at                      timestamptz           [note: 'Kapan pembayaran lunas masuk, sekaligus saat dana masuk balance_pending']
  started_at                   timestamptz           [note: 'Kapan pekerja menyatakan berangkat']
  completed_at                 timestamptz           [note: 'Kapan kode verifikasi diterima, awal holding window']
  settled_at                   timestamptz           [note: 'Kapan dana dilepas ke saldo available']
  cancelled_at                 timestamptz           [note: 'Kapan dibatalkan']
  cancellation_reason          text                  [note: 'Alasan pembatalan, dipakai admin saat menelusuri sengketa']
  cancelled_by                 order_actor_type      [note: 'Pihak mana yang membatalkan']
  created_at                   timestamptz           [not null, default: `now()`, note: 'Kapan order dibuat client']
  updated_at                   timestamptz           [not null, default: `now()`, note: 'Waktu perubahan terakhir']

  indexes {
    (client_id, status)
    (provider_profile_id, status)
    (assigned_worker_id, status)   [name: 'idx_order_worker_status']
    (assigned_worker_id, scheduled_at) [name: 'idx_order_worker_schedule', note: 'pemeriksaan bentrok jadwal D41']
    (status, response_deadline_at) [name: 'idx_order_sla_sweep']
    (status, settlement_due_at)    [name: 'idx_order_settlement_sweep']
    (client_id, created_at)        [name: 'idx_order_client_history']
  }

  Note: '''
  Harga dan atribut di-snapshot saat pemesanan (D10). Deadline disimpan sebagai kolom,
  bukan timer memori, supaya tahan restart (D11).

  DUA INVARIANT TERPISAH, dua pertanyaan berbeda:
    total_amount = listing_base_amount + options_amount   dari mana angkanya (D73)
    total_amount = provider_earning + platform_fee        ke mana angkanya pergi (D28)

  D40. Kunci in-flight pindah dari provider ke PEKERJA. Partial unique index pada
  assigned_worker_id, bukan provider_profile_id, supaya usaha dengan lima pekerja
  bisa memegang lima order paralel. Lihat migration-constraints.sql.

  D41. DUA JENIS PENGUNCIAN yang berbeda:
    in-flight  ditegakkan database lewat partial unique index
    jadwal     ditegakkan service layer lewat pemeriksaan tumpang tindih rentang waktu
               [scheduled_at, scheduled_at + snapshot_duration_minutes + buffer)
    Pekerja yang punya jadwal 12 September tetap boleh menerima pekerjaan 8 September.

  D43. Slot dikunci DUA TINGKAT: tentatif saat ACCEPTED (lepas otomatis saat
  PAYMENT_EXPIRED atau CANCELLED), pasti saat PAID.

  D70. Available Now: order ditawarkan ke maksimal 5 pekerja terdekat DAN muncul di
  dashboard pemilik. Yang pertama berhasil yang menang, lewat UPDATE bersyarat atomik.
  '''
}

Table order_crew {
  id          uuid         [pk, note: 'Primary key']
  order_id    uuid         [not null, note: 'Pendamping ini untuk order mana']
  worker_id   uuid         [not null, note: 'Pekerja yang ikut turun. Tidak punya hak transisi apa pun']
  added_by    uuid         [not null, note: 'pemilik yang mencentang']
  created_at  timestamptz  [not null, default: `now()`, note: 'Kapan dicentang pemilik']

  indexes {
    (order_id, worker_id) [unique]
    worker_id             [note: 'dipanggil di setiap pencocokan dan dropdown penugasan']
  }

  Note: '''
  D69. Pekerja PENDAMPING, hanya untuk mode SCHEDULED.
  Efeknya HANYA SATU: memblokir ketersediaan mereka selama rentang order itu.
  Pendamping TIDAK bisa mengubah status order, TIDAK bisa check-in, dan
  TIDAK bisa memasukkan kode verifikasi. Semua itu milik assigned_worker_id saja.

  Tanpa tabel ini, pekerja yang ikut turun tetap terlihat bebas dan bisa ditawari
  order lain di jam yang sama, sehingga ketersediaan pekerja sebagai sumber kebenaran
  tunggal jadi bolong.

  Aturan:
    tidak wajib terpetakan ke listing (D50), karena pendamping bisa saja hanya membantu
    ikut pemeriksaan bentrok jadwal yang sama dengan penanggung jawab (D41)
    batas jumlah = pekerja aktif dikurangi satu, dihitung bukan diparameterkan
    bisa diubah sampai status ON_THE_WAY, sama dengan reassign (D44)

  D70. TIDAK tersedia pada mode AVAILABLE_NOW, karena pendamping adalah keputusan
  perencanaan sedangkan mode itu tidak punya fase perencanaan.
  '''
}

Table order_messages {
  id              bigserial         [pk, increment, note: 'bigserial, bukan UUID, karena volumenya tinggi dan urutan kronologis penting']
  order_id        uuid              [not null, note: 'Percakapan ini milik order mana. Tidak ada percakapan tanpa order']
  sender_user_id  uuid              [not null, note: 'Akun pengirim. Wajib salah satu dari client pemilik order, pemilik provider, atau pekerja yang ditugaskan']
  sender_role     order_actor_type  [not null, note: 'dibatasi CHECK ke CLIENT, PROVIDER, WORKER']
  content         text              [not null, note: 'teks saja, 1 sampai 2000 karakter']
  read_at         timestamptz       [note: 'dibaca oleh SISI LAWAN, bukan per orang']
  created_at      timestamptz       [not null, default: `now()`, note: 'Waktu kirim, sekaligus penentu urutan percakapan']

  indexes {
    (order_id, id)
    (order_id, read_at)
  }

  Note: '''
  D79. Pesan dalam order antara client dan penyedia. SATU percakapan per order,
  tidak ada percakapan lintas order dan tidak ada percakapan tanpa order.

  MASA AKTIF: sejak ACCEPTED sampai settlement_due_at lewat, lalu READ-ONLY
  (tidak dihapus). Ditegakkan service layer (H70).

  PESERTA: client pemilik order, pemilik provider, dan assigned_worker_id.
  Pendamping (order_crew) TIDAK ikut. Pekerja lain di usaha yang sama juga
  ditolak, sama polanya dengan ASSIGNEE_ONLY_TRANSITIONS di state machine (H71).
  Admin MEMBACA saja saat menangani dispute, tidak mengirim pesan.

  DUA SISI, BUKAN TIGA. Client di satu sisi, penyedia di sisi lain, dan pemilik
  maupun pekerja sama-sama di sisi penyedia. Itu sebabnya read_at cukup satu
  kolom: artinya dibaca oleh sisi lawan. Kalau per orang, butuh tabel tanda
  baca tersendiri, tidak sebanding untuk cakupan ini.

  CLIENT BICARA DENGAN ORDER, BUKAN DENGAN ORANG. Pemilik dan pekerja sama-sama
  melihat dan bisa membalas, tiap pesan berlabel pengirim. Konsisten dengan D68
  dan D49: yang bertanggung jawab adalah usaha. Client tidak perlu tahu nomor
  pribadi siapa pun, dan pemilik tetap bisa mengawasi apa yang dijanjikan atas
  nama usahanya.

  TEKS SAJA. Begitu ada lampiran, muncul urusan penyimpanan, ukuran berkas,
  jenis berkas, dan moderasi konten, dan itu modul tersendiri (H75).

  SAAT DISPUTE seluruh percakapan otomatis jadi bukti dan ditampilkan ke admin,
  melengkapi dispute_evidences yang diunggah manual.

  TIDAK ADA tabel order_conversations terpisah: satu order satu percakapan,
  jadi order itu sendiri yang jadi wadahnya. Tabel percakapan terpisah hanya
  akan berisi kolom turunan yang bisa dihitung dari sini.
  '''
}

Table order_status_histories {
  id                  bigserial         [pk, increment, note: 'bigserial, bukan UUID, karena volumenya tinggi dan integer berurutan memberi urutan alami']
  order_id            uuid              [not null, note: 'Jejak ini milik order mana']
  from_status         order_status      [note: 'Status asal. NULL hanya untuk baris pertama saat order dibuat']
  to_status           order_status      [not null, note: 'Status tujuan']
  actor               order_actor_type  [not null, note: 'Peran yang melakukan transisi. Dipakai membuktikan pemisahan wewenang saat sidang']
  changed_by_user_id  uuid              [note: 'Akun spesifik pelakunya. NULL kalau aktornya SYSTEM']
  reason              text              [note: 'Alasan, terutama untuk penolakan dan pembatalan']
  metadata            jsonb             [note: 'termasuk jejak pergantian penanggung jawab (D44)']
  created_at          timestamptz       [not null, default: `now()`, note: 'Kapan transisi terjadi. Selisih antar baris dipakai menghitung lama respons untuk laporan performa']

  indexes {
    (order_id, id)
  }

  Note: 'Audit trail state machine. Bukti transisi nyata untuk sidang. Pergantian assigned_worker_id juga dicatat di sini (D44).'
}

Table order_checkins {
  id                       uuid           [pk, note: 'Primary key']
  order_id                 uuid           [not null, note: 'Check-in ini untuk order mana']
  worker_id                uuid           [not null, note: 'D31. Bukti SIAPA yang benar-benar datang']
  latitude                 decimal(10,8)  [not null, note: 'Posisi pekerja saat menekan check-in']
  longitude                decimal(11,8)  [not null, note: 'Pasangan latitude']
  distance_meters          decimal(10,2)  [not null, note: 'hasil perhitungan Haversine']
  radius_threshold_meters  int            [not null, default: 100, note: 'disimpan per baris supaya data lama tetap bisa dianalisis']
  accuracy_meters          decimal(8,2)   [note: 'dari GPS browser']
  is_valid                 boolean        [not null, note: 'Hasil perbandingan jarak terhadap radius. Baris yang gagal TETAP disimpan, karena justru itu data paling berharga untuk Bab IV']
  attempt_number           smallint       [not null, default: 1, note: 'Percobaan ke berapa. Dipakai menghitung berapa persen check-in lolos pada percobaan pertama']
  created_at               timestamptz    [not null, default: `now()`, note: 'Kapan percobaan dilakukan']

  indexes {
    (order_id, attempt_number)
    worker_id
  }

  Note: 'Setiap percobaan check-in direkam, termasuk yang gagal. Data mentah untuk analisis akurasi validasi geolokasi di Bab IV. Hanya assigned_worker_id yang boleh check-in, bukan pendamping (D69).'
}

// ============================================================
// D. PEMBAYARAN DAN UANG
// ============================================================

Table payments {
  id                  uuid            [pk, note: 'Primary key']
  order_id            uuid            [not null, note: 'Pembayaran ini untuk order mana. Relasi 1:N karena invoice kedaluwarsa tidak ditimpa melainkan dibuat baris baru']
  xendit_external_id  varchar(100)    [unique, not null, note: 'kita yang generate']
  xendit_invoice_id   varchar(100)    [unique, note: 'ID invoice dari Xendit, dipakai mencocokkan webhook']
  payment_method      varchar(50)     [note: 'VA, EWALLET, QRIS']
  payment_channel     varchar(50)     [note: 'BCA, OVO, DANA']
  amount              decimal(12,2)   [not null, note: 'yang kita tagih']
  paid_amount         decimal(12,2)   [note: 'yang benar-benar masuk, bisa beda dari amount pada VA']
  status              payment_status  [not null, default: 'PENDING', note: 'Partial unique index mencegah dua baris PAID atau dua baris PENDING untuk satu order']
  invoice_url         text            [note: 'Tautan halaman pembayaran yang dibuka client']
  expires_at          timestamptz     [note: 'Masa berlaku invoice di Xendit']
  paid_at             timestamptz     [note: 'Kapan pembayaran dinyatakan lunas oleh Xendit']
  raw_response        jsonb           [note: 'Respons mentah Xendit, disimpan apa adanya untuk penelusuran masalah']
  created_at          timestamptz     [not null, default: `now()`, note: 'Kapan invoice dibuat']
  updated_at          timestamptz     [not null, default: `now()`, note: 'Waktu perubahan terakhir']

  indexes {
    order_id
  }

  Note: 'Relasi ke order 1:N. Invoice expired tidak ditimpa, dibuat baris baru. Partial unique index mencegah dua baris PAID atau dua baris PENDING per order.'
}

Table webhook_events {
  id                 uuid                       [pk, note: 'Primary key']
  provider           varchar(20)                [not null, default: 'XENDIT', note: 'Penyedia layanan asal webhook. Disiapkan kalau nanti ada lebih dari satu']
  domain             webhook_domain             [not null, note: 'Membedakan webhook pembayaran, pencairan, dan refund, karena ketiganya punya penanganan berbeda']
  event_id           varchar(150)               [unique, not null, note: 'kunci turunan yang kita susun: invoice:<id>:<status> atau payout:<id>:<status>']
  event_type         varchar(50)                [note: 'Jenis event mentah dari Xendit']
  reference_id       varchar(100)               [note: 'ID sumber daya yang dirujuk, dipakai mencari log saat menelusuri masalah']
  payload            jsonb                      [not null, note: 'Isi webhook mentah, disimpan utuh supaya bisa diproses ulang']
  signature_valid    boolean                    [note: 'Hasil verifikasi header x-callback-token. Webhook dengan signature tidak valid tetap dicatat tapi tidak diproses']
  processing_status  webhook_processing_status  [not null, default: 'RECEIVED', note: 'Diambil lewat UPDATE bersyarat atomik, bukan baca lalu cek, supaya dua retry bersamaan tidak lolos berdua']
  locked_at          timestamptz                [note: 'deteksi proses yang mati di tengah jalan']
  retry_count        smallint                   [not null, default: 0, note: 'Berapa kali sudah diproses ulang']
  error_message      text                       [note: 'Pesan galat terakhir, untuk diagnostik']
  processed_at       timestamptz                [note: 'Kapan selesai diproses']
  received_at        timestamptz                [not null, default: `now()`, note: 'Kapan webhook diterima']

  indexes {
    (processing_status, locked_at)
    reference_id
  }

  Note: 'Kunci idempotency. Ambil lock dengan UPDATE bersyarat atomik, bukan findUnique lalu if. Sengaja TANPA foreign key supaya log selalu bisa masuk. Xendit tidak menyediakan header webhook id dan melakukan retry sampai 6 kali dengan exponential backoff.'
}

Table wallets {
  id                   uuid           [pk, note: 'Primary key']
  provider_profile_id  uuid           [unique, not null, note: 'Unik, jadi satu usaha satu dompet']
  balance_available    decimal(14,2)  [not null, default: 0, note: 'boleh ditarik']
  balance_pending      decimal(14,2)  [not null, default: 0, note: 'escrow belum lewat holding window']
  currency             char(3)        [not null, default: 'IDR', note: 'Mata uang. Multi-currency di luar cakupan penelitian']
  updated_at           timestamptz    [not null, default: `now()`, note: 'Waktu saldo terakhir berubah']

  Note: 'D48. Wallet tetap milik USAHA, bukan pekerja. Pekerja tidak punya dompet, penggajian di luar cakupan sistem. Kolom saldo adalah CACHE, sumber kebenaran ada di wallet_transactions.'
}

Table wallet_transactions {
  id                       bigserial                [pk, increment, note: 'bigserial, bukan UUID, karena volumenya tinggi dan urutan kronologis adalah bagian dari makna ledger']
  wallet_id                uuid                     [not null, note: 'Dompet mana yang berubah']
  order_id                 uuid                     [note: 'Order sumber transaksi, untuk ESCROW_HOLD, ESCROW_RELEASE, dan REFUND_DEDUCTION']
  withdrawal_id            uuid                     [note: 'Pengajuan pencairan sumber transaksi, untuk WITHDRAWAL dan WITHDRAWAL_REVERSAL']
  type                     wallet_transaction_type  [not null, note: 'Menentukan pola delta mana yang berlaku. Unique index mencegah satu order punya dua HOLD atau dua RELEASE']
  amount_available_delta   decimal(14,2)            [not null, default: 0, note: 'boleh negatif']
  amount_pending_delta     decimal(14,2)            [not null, default: 0, note: 'boleh negatif']
  balance_available_after  decimal(14,2)            [not null, note: 'Snapshot saldo setelah transaksi ini, supaya riwayat bisa dibaca tanpa menjumlah ulang dari awal']
  balance_pending_after    decimal(14,2)            [not null, note: 'Snapshot saldo pending setelah transaksi ini']
  description              varchar(255)             [note: 'Keterangan yang dibaca provider di riwayat dompetnya']
  created_by               transaction_creator      [not null, default: 'SYSTEM', note: 'SYSTEM untuk transaksi otomatis, ADMIN untuk baris ADJUSTMENT koreksi manual']
  created_at               timestamptz              [not null, default: `now()`, note: 'Kapan transaksi dicatat']

  indexes {
    (wallet_id, id)
    order_id
    withdrawal_id
  }

  Note: '''
  LEDGER append-only, model delta dua saldo. Tanpa updated_at, tanpa delete.
  Koreksi dilakukan dengan baris ADJUSTMENT berlawanan arah, bukan UPDATE.

  Peta delta per tipe:
    ESCROW_HOLD          available  0          pending +provider_earning
    ESCROW_RELEASE       available +earning    pending -provider_earning
    WITHDRAWAL           available -amount     pending  0
    WITHDRAWAL_REVERSAL  available +amount     pending  0
    REFUND_DEDUCTION     available  0          pending -amount

  Invariant yang bisa diuji otomatis di Bab IV:
    SUM(amount_available_delta) = wallets.balance_available
    SUM(amount_pending_delta)   = wallets.balance_pending
  '''
}

Table withdrawals {
  id                    uuid                  [pk, note: 'Primary key']
  wallet_id             uuid                  [not null, note: 'Dompet asal dana']
  amount                decimal(14,2)         [not null, note: 'Nominal yang diajukan provider. Saldo didebit saat pengajuan, bukan saat selesai']
  admin_fee             decimal(12,2)         [not null, default: 0, note: 'Biaya administrasi pencairan. Nilainya belum ditetapkan, masih jadi keputusan terbuka']
  net_amount            decimal(14,2)         [not null, note: 'Yang benar-benar dikirim ke rekening, yaitu amount dikurangi admin_fee']
  bank_code             varchar(20)           [not null, note: 'Kode bank tujuan sesuai daftar Xendit']
  bank_account_number   varchar(40)           [not null, note: 'Nomor rekening tujuan']
  bank_account_name     varchar(150)          [not null, note: 'Nama pemilik rekening, harus cocok saat verifikasi bank']
  status                withdrawal_status     [not null, default: 'REQUESTED', note: 'status internal kita']
  xendit_payout_id      varchar(100)          [unique, note: 'ID payout di Xendit, dipakai mencocokkan webhook pencairan']
  xendit_payout_status  xendit_payout_status  [note: 'salinan mentah dari Xendit, jangan diterjemahkan']
  failure_code          varchar(50)           [note: 'INSUFFICIENT_BALANCE, INVALID_DESTINATION, REJECTED_BY_CHANNEL, dst']
  reviewed_by           uuid                  [note: 'Admin yang menyetujui atau menolak']
  rejection_reason      text                  [note: 'Alasan penolakan yang dibaca provider']
  reviewed_at           timestamptz           [note: 'Kapan admin memeriksa']
  completed_at          timestamptz           [note: 'Kapan dana dinyatakan sampai oleh Xendit']
  reversed_at           timestamptz           [note: 'Kapan payout dipantulkan bank tujuan setelah sempat dinyatakan sukses']
  created_at            timestamptz           [not null, default: `now()`, note: 'Kapan provider mengajukan']
  updated_at            timestamptz           [not null, default: `now()`, note: 'Waktu perubahan terakhir']

  indexes {
    (wallet_id, status)
  }

  Note: 'Saldo didebit saat REQUESTED, bukan saat COMPLETED, supaya provider tidak bisa mengajukan berkali-kali melebihi saldo. WITHDRAWAL_REVERSAL dipakai untuk REJECTED, FAILED, maupun REVERSED. REQUESTED di sini berarti provider mengajukan, berbeda arti dengan REQUESTED milik Xendit.'
}

Table refunds {
  id                     uuid           [pk, note: 'Primary key']
  order_id               uuid           [not null, note: 'Refund ini untuk order mana']
  payment_id             uuid           [not null, note: 'Pembayaran mana yang dikembalikan']
  type                   refund_type    [not null, note: 'FULL untuk pengembalian penuh, PARTIAL untuk putusan dispute sebagian']
  amount                 decimal(12,2)  [not null, note: 'Nominal yang dikembalikan ke client']
  includes_platform_fee  boolean        [not null, default: true, note: 'kebijakan: fee dikembalikan penuh saat refund akibat kesalahan provider']
  reason                 text           [note: 'Alasan refund, biasanya salinan putusan admin']
  status                 refund_status  [not null, default: 'REQUESTED', note: 'Siklus hidup refund di Xendit, diperbarui lewat webhook']
  xendit_refund_id       varchar(100)   [note: 'ID refund di Xendit']
  initiated_by           uuid           [not null, note: 'Siapa yang memulai, client, pemilik, atau admin']
  created_at             timestamptz    [not null, default: `now()`, note: 'Kapan refund diajukan']
  completed_at           timestamptz    [note: 'Kapan dana dinyatakan kembali oleh Xendit']
}

// ============================================================
// E. DISPUTE
// ============================================================

Table disputes {
  id                 uuid                 [pk, note: 'Primary key']
  order_id           uuid                 [unique, not null, note: 'Unik, jadi satu order hanya boleh punya satu sengketa. Penyederhanaan ruang lingkup yang disengaja']
  raised_by_user_id  uuid                 [not null, note: 'Akun yang mengadu']
  raised_by_role     dispute_raiser_role  [not null, note: 'Mengadu sebagai client atau sebagai penyedia. Pekerja tidak boleh membuka sengketa sendiri']
  category           dispute_category     [not null, note: 'Jenis sengketa, dipakai admin memilah antrean dan menyusun laporan']
  description        text                 [not null, note: 'Penjelasan dari pengadu']
  status             dispute_status       [not null, default: 'OPEN', note: 'Selama OPEN atau UNDER_REVIEW, cron settlement TIDAK boleh mencairkan dana order ini']
  resolution_note    text                 [note: 'Catatan putusan admin. Ini juga jalur komunikasi admin, karena admin tidak mengirim pesan di order_messages']
  refund_amount      decimal(12,2)        [note: 'Nominal yang dikembalikan kalau putusannya sebagian']
  resolved_by        uuid                 [note: 'Admin yang memutus']
  created_at         timestamptz          [not null, default: `now()`, note: 'Kapan sengketa dibuka']
  resolved_at        timestamptz          [note: 'Kapan diputus']

  Note: 'Boleh dibuka sejak order berstatus ARRIVED sampai batas orders.settlement_due_at. Setelah SETTLED, sengketa ditutup permanen. Satu order satu dispute (UNIQUE), disengaja sebagai penyederhanaan ruang lingkup. orders.assigned_worker_id jadi jejak audit siapa yang mengerjakan (D49).'
}

Table dispute_evidences {
  id                   uuid         [pk, note: 'Primary key']
  dispute_id           uuid         [not null, note: 'Bukti ini untuk sengketa mana']
  uploaded_by_user_id  uuid         [not null, note: 'Siapa yang mengunggah. Kedua pihak boleh, dan admin perlu tahu bukti mana dari siapa']
  file_url             text         [not null, note: 'Berkas di Supabase Storage']
  file_type            varchar(20)  [note: 'Jenis berkas, untuk menentukan cara menampilkannya']
  description          text         [note: 'Keterangan bukti dari pengunggah']
  created_at           timestamptz  [not null, default: `now()`, note: 'Kapan diunggah']
}

// ============================================================
// F. REVIEW
// ============================================================

Table reviews {
  id                   uuid         [pk, note: 'Primary key']
  order_id             uuid         [unique, not null, note: 'Unik, jadi satu order hanya menghasilkan satu review. Tanpa ini client bisa memanipulasi reputasi dengan rating berkali-kali']
  client_id            uuid         [not null, note: 'Yang memberi rating']
  provider_profile_id  uuid         [not null, note: 'Denormalisasi dari orders, supaya query review sebuah usaha tidak perlu join berlapis']
  listing_id           uuid         [not null, note: 'Denormalisasi juga, supaya review per listing bisa diambil langsung']
  rating               smallint     [not null, note: 'CHECK BETWEEN 1 AND 5']
  comment              text         [note: 'Ulasan tekstual']
  provider_reply       text         [note: 'Hak jawab penyedia atas ulasan']
  provider_replied_at  timestamptz  [note: 'Kapan penyedia membalas']
  is_visible           boolean      [not null, default: true, note: 'Admin bisa menyembunyikan review yang melanggar tanpa menghapus datanya']
  created_at           timestamptz  [not null, default: `now()`, note: 'Kapan review dibuat']
  updated_at           timestamptz  [not null, default: `now()`, note: 'Waktu perubahan terakhir']

  indexes {
    (provider_profile_id, is_visible)
    listing_id
    (client_id, created_at) [name: 'idx_review_client_history']
  }

  Note: '''
  D49. Rating jatuh ke USAHA, bukan ke pekerja. Reputasi yang dilihat client di listing
  adalah reputasi usaha. Kalau rating per pekerja, client harus memilih pekerja saat
  memesan, dan itu mengubah alur pemesanan jauh lebih dalam dari yang diminta.
  orders.assigned_worker_id tetap disimpan sebagai jejak audit.
  Denormalisasi provider_profile_id dan listing_id disengaja supaya query review provider
  tidak perlu join berlapis. Juga salah satu dari empat sumber personalisasi chatbot.
  '''
}

// ============================================================
// G. AI SERVICE DISCOVERY CHATBOT
// ============================================================

Table chat_sessions {
  id                        uuid                 [pk, note: 'Primary key']
  user_id                   uuid                 [note: 'D77. NULLABLE. Tamu boleh bertanya sebelum punya akun']
  guest_token               varchar(64)          [unique, note: 'D77. Identitas sesi tamu, disimpan di localStorage browser']
  title                     varchar(150)         [note: 'Ringkasan sesi untuk daftar riwayat percakapan']
  status                    chat_session_status  [not null, default: 'ACTIVE', note: 'ACTIVE atau ENDED. Sesi yang sudah berakhir tetap disimpan sebagai data pengukuran']
  personalization_snapshot  jsonb                [note: 'konteks pengguna yang disuntikkan ke system prompt: riwayat kategori, alamat default, rata-rata rating yang diberikan, rentang harga. TETAP NULL untuk tamu']
  last_intent               jsonb                [note: 'Intent terakhir yang terdeteksi, dipakai menjaga konteks pada pesan berikutnya']
  message_count             int                  [not null, default: 0, note: 'penegakan batas pesan tamu']
  expires_at                timestamptz          [note: 'D77. Hanya untuk sesi tamu']
  claimed_at                timestamptz          [note: 'D77. Terisi saat sesi tamu diklaim setelah mendaftar. Sumber metrik konversi untuk Bab IV']
  started_at                timestamptz          [not null, default: `now()`, note: 'Kapan sesi dimulai']
  ended_at                  timestamptz          [note: 'Kapan sesi diakhiri']
  updated_at                timestamptz          [not null, default: `now()`, note: 'Waktu aktivitas terakhir']

  indexes {
    (user_id, started_at)
    guest_token
    (status, expires_at)
  }

  Note: '''
  D77 (arahan Pembimbing 1), MEREVISI D26. Chatbot terbuka untuk tamu, dua tingkat:

                           TAMU                        SUDAH LOGIN
    intent extraction      ya                          ya
    rekomendasi listing    ya                          ya
    sumber lokasi          geolokasi browser           user_addresses
    riwayat dan harga      tidak                       ya
    personalization_snap   null                        terisi
    lanjut ke pemesanan    diminta login dulu          langsung
    riwayat percakapan     sampai expires_at           permanen

  CHECK: user_id IS NOT NULL OR guest_token IS NOT NULL. Salah satu wajib terisi.

  Saat tamu mendaftar, sesinya diklaim lewat satu UPDATE yang mengisi user_id dan claimed_at.
  Percakapan tidak hilang dan bisa langsung dilanjutkan ke pemesanan.

  PENGAMAN WAJIB: rate limiting berbasis identitas hilang untuk tamu, padahal tiap pesan
  memanggil Gemini yang ada biayanya. Tiga lapis, nilainya di platform_settings:
    per guest_token           20 pesan per sesi
    per alamat IP             50 pesan per jam (guest_token gampang dibuang dan dibuat baru)
    global harian             rem darurat kalau dua lapis di atas ditembus

  Jawaban ke tamu tidak boleh memuat data pribadi penyedia seperti nomor telepon atau
  alamat persis, hanya yang tampil di halaman listing publik.
  '''
}

Table chat_messages {
  id                       bigserial          [pk, increment, note: 'bigserial, bukan UUID, karena volumenya tinggi dan urutan pesan adalah bagian dari makna percakapan']
  session_id               uuid               [not null, note: 'Pesan ini milik sesi mana']
  role                     chat_message_role  [not null, note: 'USER untuk pesan orang, ASSISTANT untuk balasan Gemini, SYSTEM untuk prompt konteks']
  content                  text               [not null, note: 'Isi pesan']
  extracted_intent         jsonb              [note: 'subcategory_id, lokasi, waktu, budget, preferensi']
  intent_confidence        decimal(4,3)       [note: 'Tingkat keyakinan model. Bahan tabel akurasi intent extraction di Bab IV']
  recommended_listing_ids  jsonb              [note: 'array UUID']
  gemini_model             varchar(50)        [note: 'Versi model yang dipakai, supaya hasil pengukuran bisa dibandingkan antar versi']
  token_usage              jsonb              [note: 'Jumlah token prompt dan completion, untuk menghitung konsumsi per sesi']
  latency_ms               int                [note: 'Waktu respons Gemini. Bahan rata-rata dan persentil ke-95 di Bab IV']
  created_at               timestamptz        [not null, default: `now()`, note: 'Waktu pesan dicatat']

  indexes {
    (session_id, id)
  }

  Note: 'extracted_intent, intent_confidence dan latency_ms adalah data pengukuran untuk Bab IV. Rekam sejak hari pertama. Gemini dipanggil dengan structured output, bukan parsing teks bebas.'
}

// ============================================================
// H. NOTIFIKASI DAN SISTEM
// ============================================================

Table notifications {
  id              bigserial              [pk, increment, note: 'bigserial, bukan UUID, karena volumenya tinggi']
  user_id         uuid                   [not null, note: 'Penerima notifikasi']
  type            notification_type      [not null, note: 'Jenis kejadian, dipakai memilah tampilan dan memilih ikon']
  channel         notification_channel   [not null, default: 'IN_APP', note: 'D58']
  title           varchar(150)           [not null, note: 'Judul singkat yang dibaca penerima']
  body            text                   [note: 'Isi notifikasi']
  reference_type  varchar(30)            [note: 'Menunjuk ke tabel mana. Polymorphic reference, bukan foreign key, karena satu kolom tidak bisa merujuk banyak tabel berbeda']
  reference_id    uuid                   [note: 'ID sumber daya yang dirujuk, supaya notifikasi bisa diklik. Tidak ada jaminan integritas referensial di sini, dan itu trade-off yang diterima']
  is_read         boolean                [not null, default: false, note: 'Status baca di aplikasi']
  read_at         timestamptz            [note: 'Kapan dibaca']
  email_status    email_delivery_status  [note: 'D58. Hanya untuk channel EMAIL']
  email_error     text                   [note: 'Pesan galat pengiriman email, untuk diagnostik dan percobaan ulang']
  sent_at         timestamptz            [note: 'Kapan email benar-benar terkirim']
  created_at      timestamptz            [not null, default: `now()`, note: 'Kapan notifikasi dibuat, yaitu di dalam transaksi order']

  indexes {
    (user_id, is_read, created_at)
    (channel, email_status) [name: 'idx_notification_email_retry']
  }

  Note: '''
  D58. Baris ditulis DI DALAM transaksi order, pengiriman email dilakukan SESUDAH commit.
  Panggilan API eksternal tidak boleh berada di dalam transaksi basis data.
  Kegagalan kirim email TIDAK PERNAH membatalkan transisi order, karena uang dan status
  pekerjaan tidak boleh bergantung pada SMTP. Cron mengirim ulang baris FAILED maksimal 3 kali.

  D59. Email adalah kanal PELENGKAP untuk Available Now yang SLA-nya 5 menit,
  karena email butuh belasan detik sampai beberapa menit dan bisa masuk spam.
  Kanal utamanya Socket.IO. Untuk Scheduled yang SLA-nya 24 jam, email adalah kanal yang tepat.

  D60. Kode verifikasi order TIDAK PERNAH dikirim lewat email. Email hanya memberi tahu
  bahwa pekerjaan selesai dan kodenya bisa dilihat di aplikasi. Kalau kode bisa dibaca dari
  inbox, client tidak perlu berada di lokasi untuk memberikannya.
  '''
}

Table platform_settings {
  key          varchar(50)  [pk, note: 'Primary key berupa teks, bukan UUID, supaya kode membacanya dengan nama yang jelas']
  value        jsonb        [not null, note: 'JSONB supaya satu tabel bisa menampung angka, teks, maupun objek tanpa kolom bertipe berbeda']
  description  text         [note: 'Penjelasan parameter untuk admin']
  updated_by   uuid         [note: 'Admin yang terakhir mengubah, untuk jejak audit eksperimen parameter']
  updated_at   timestamptz  [not null, default: `now()`, note: 'Kapan terakhir diubah. Penting untuk penelitian, supaya perubahan parameter bisa dikaitkan dengan hasil pengujian']

  Note: '''
  Parameter penelitian, supaya bisa diubah saat eksperimen tanpa deploy ulang:

    platform_fee_percentage               = 10
    geolocation_radius_meters             = 100
    available_now_response_minutes        = 5
    scheduled_approval_hours              = 24
    settlement_holding_hours              = 24
    payment_window_minutes                = 10
    verification_max_attempts             = 5
    verification_lockout_minutes          = 15

    available_now_offer_limit             = 5     (D55)
    worker_presence_timeout_minutes       = 10    (D57, D65)
    worker_location_move_threshold_meters = 200   (D66)
    worker_location_max_interval_minutes  = 5     (D66)
    schedule_conflict_buffer_minutes      = 30    (D41)
    email_retry_max_attempts              = 3     (D58)
    guest_chat_message_limit              = 20    (D77)
    guest_chat_ip_hourly_limit            = 50    (D77)
    guest_chat_daily_global_limit         = TBD   (D77, ditetapkan saat pengujian)
    access_token_ttl_minutes              = 15    (D76)
    refresh_token_ttl_days                = 30    (D76)
    listing_faq_max_items                 = 10    (D78)
    order_message_max_length              = 2000  (D79)
    order_message_rate_per_minute         = 20    (D79)
    kyc_document_max_size_mb              = 5     (D80)
    dispute_evidence_max_size_mb          = 5     (D80)
    orphan_upload_cleanup_hours           = 24    (D80)
  '''
}

// ============================================================
// RELASI
// ============================================================

Ref: user_addresses.user_id > users.id [delete: cascade]
Ref: verification_tokens.user_id > users.id [delete: cascade]
Ref: refresh_tokens.user_id > users.id [delete: cascade]

Ref: provider_profiles.user_id - users.id [delete: cascade]
Ref: provider_profiles.verified_by > users.id [delete: set null]

Ref: kyc_documents.provider_profile_id > provider_profiles.id [delete: cascade]

Ref: provider_workers.provider_profile_id > provider_profiles.id [delete: cascade]
Ref: provider_workers.user_id > users.id [delete: restrict]
Ref: provider_workers.approved_by > users.id [delete: set null]

Ref: worker_listings.worker_id > provider_workers.id [delete: cascade]
Ref: worker_listings.listing_id > listings.id [delete: cascade]

Ref: subcategories.category_id > categories.id [delete: restrict]
Ref: subcategory_attributes.subcategory_id > subcategories.id [delete: cascade]

Ref: listings.provider_profile_id > provider_profiles.id [delete: cascade]
Ref: listings.subcategory_id > subcategories.id [delete: restrict]
Ref: listing_photos.listing_id > listings.id [delete: cascade]
Ref: listing_option_prices.listing_id > listings.id [delete: cascade]
Ref: listing_faqs.listing_id > listings.id [delete: cascade]

Ref: taxonomy_requests.provider_profile_id > provider_profiles.id [delete: cascade]
Ref: taxonomy_requests.category_id > categories.id [delete: set null]
Ref: taxonomy_requests.subcategory_id > subcategories.id [delete: set null]
Ref: taxonomy_requests.reviewed_by > users.id [delete: set null]

Ref: orders.client_id > users.id [delete: restrict]
Ref: orders.provider_profile_id > provider_profiles.id [delete: restrict]
Ref: orders.assigned_worker_id > provider_workers.id [delete: restrict]
Ref: orders.accepted_by > users.id [delete: set null]
Ref: orders.listing_id > listings.id [delete: restrict]

Ref: order_crew.order_id > orders.id [delete: cascade]
Ref: order_crew.worker_id > provider_workers.id [delete: restrict]
Ref: order_crew.added_by > users.id [delete: restrict]

Ref: order_messages.order_id > orders.id [delete: cascade]
Ref: order_messages.sender_user_id > users.id [delete: restrict]

Ref: order_status_histories.order_id > orders.id [delete: cascade]
Ref: order_status_histories.changed_by_user_id > users.id [delete: set null]
Ref: order_checkins.order_id > orders.id [delete: cascade]
Ref: order_checkins.worker_id > provider_workers.id [delete: restrict]

Ref: payments.order_id > orders.id [delete: restrict]

Ref: wallets.provider_profile_id - provider_profiles.id [delete: cascade]
Ref: wallet_transactions.wallet_id > wallets.id [delete: restrict]
Ref: wallet_transactions.order_id > orders.id [delete: set null]
Ref: wallet_transactions.withdrawal_id > withdrawals.id [delete: set null]

Ref: withdrawals.wallet_id > wallets.id [delete: restrict]
Ref: withdrawals.reviewed_by > users.id [delete: set null]

Ref: refunds.order_id > orders.id [delete: restrict]
Ref: refunds.payment_id > payments.id [delete: restrict]
Ref: refunds.initiated_by > users.id [delete: restrict]

Ref: disputes.order_id - orders.id [delete: restrict]
Ref: disputes.raised_by_user_id > users.id [delete: restrict]
Ref: disputes.resolved_by > users.id [delete: set null]
Ref: dispute_evidences.dispute_id > disputes.id [delete: cascade]
Ref: dispute_evidences.uploaded_by_user_id > users.id [delete: restrict]

Ref: reviews.order_id - orders.id [delete: restrict]
Ref: reviews.client_id > users.id [delete: restrict]
Ref: reviews.provider_profile_id > provider_profiles.id [delete: cascade]
Ref: reviews.listing_id > listings.id [delete: restrict]

Ref: chat_sessions.user_id > users.id [delete: cascade]
Ref: chat_messages.session_id > chat_sessions.id [delete: cascade]

Ref: notifications.user_id > users.id [delete: cascade]
Ref: platform_settings.updated_by > users.id [delete: set null]

// ============================================================
// GROUP
// ============================================================

TableGroup A_Identitas_dan_Akses {
  users
  user_addresses
  verification_tokens
  refresh_tokens
  provider_profiles
  kyc_documents
}

TableGroup A2_Tenaga_Kerja {
  provider_workers
  worker_listings
}

TableGroup B_Katalog_Jasa {
  categories
  subcategories
  subcategory_attributes
  listings
  listing_option_prices
  listing_photos
  listing_faqs
  taxonomy_requests
}

TableGroup C_Order {
  orders
  order_crew
  order_messages
  order_status_histories
  order_checkins
}

TableGroup D_Pembayaran {
  payments
  webhook_events
  wallets
  wallet_transactions
  withdrawals
  refunds
}

TableGroup E_Dispute {
  disputes
  dispute_evidences
}

TableGroup F_Review {
  reviews
}

TableGroup G_Chatbot {
  chat_sessions
  chat_messages
}

TableGroup H_Sistem {
  notifications
  platform_settings
}
