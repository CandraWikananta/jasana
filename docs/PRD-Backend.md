# PRD Backend: Jasana

**Platform Marketplace Jasa On-Demand Berbasis Web yang Terintegrasi dengan Kecerdasan Buatan**

| | |
|---|---|
| Versi | 2.1 |
| Penyusun | I Nyoman Gede Candra Wikananta (2305551065) |
| Program Studi | Teknologi Informasi, Universitas Udayana |
| Bidang Keahlian | Sistem Informasi |
| Pembimbing 1 | Dr. Ir. Ni Kadek Ayu Wirdiani, S.T., M.T., IPU |
| Pembimbing 2 | Dr. Ir. Anak Agung Kompiang Oka Sudana, S.Kom., M.T., IPM |
| Tanggal | 30 September 2026 |
| Cakupan dokumen | **Backend saja** (Express.js REST API, basis data, integrasi eksternal, cron). Frontend dan UI/UX di luar cakupan dokumen ini |

**Dokumen rujukan:** `Keputusan-Desain-Sistem.md` (register keputusan D1 sampai D80), `State-Machine-Order.md` (artefak desain 3), `skema-database-final.dbml` (34 tabel, 35 enum), `schema.prisma`, `migration-constraints.sql`, `Panduan-Struktur-Database.md`.

**Catatan versi.** Dokumen ini menggantikan PRD versi 1.x sepenuhnya, bukan merevisinya. Implementasi dimulai ulang dari nol, jadi seluruh milestone di Bagian 9 berstatus belum dikerjakan. Perubahan terbesar sejak versi 1.x adalah masuknya entitas tenaga kerja (D31 sampai D53) atas arahan Pembimbing 1, yang memindahkan pelaksanaan order dari akun provider ke pekerja.

---

## Daftar Isi

1. [Overview dan Objectives](#1-overview-dan-objectives)
2. [System Architecture dan Tech Stack](#2-system-architecture-dan-tech-stack)
3. [Data Models dan Schema](#3-data-models-dan-schema)
4. [API Endpoints dan Contracts](#4-api-endpoints-dan-contracts)
5. [Security dan Compliance](#5-security-dan-compliance)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Background Jobs dan Real-Time](#7-background-jobs-dan-real-time)
8. [Strategi Pengujian](#8-strategi-pengujian)
9. [Milestone Implementasi](#9-milestone-implementasi)
10. [Pertanyaan Terbuka](#10-pertanyaan-terbuka)

---

## 1. Overview dan Objectives

### 1.1 Konteks

Jasana adalah marketplace jasa fisik multi-kategori dengan model *direct browse-and-book*. Backend bertanggung jawab atas seluruh logika bisnis: katalog dinamis berharga bertingkat, penugasan tenaga kerja, siklus hidup order, escrow dana, validasi kehadiran, dan orkestrasi chatbot.

Backend berdiri sebagai REST API tunggal (Express.js) yang dikonsumsi satu aplikasi frontend Next.js untuk **empat aktor** (client, provider, pekerja, admin), ditambah dua jalur masuk non-pengguna: webhook Xendit dan scheduler internal.

**Empat aktor, tapi hanya dua nilai role.** Ini konsekuensi konsep dual-role dan perlu dipahami sejak awal karena menentukan seluruh desain otorisasi:

| Aktor | Cara sistem mengenalinya |
|---|---|
| Client | Setiap user yang login |
| Provider | Punya `provider_profiles` berstatus `VERIFIED` (D4) |
| Pekerja | Punya `provider_workers` berstatus `ACTIVE` (D35) |
| Admin | `users.role = 'ADMIN'` |

### 1.2 Tujuan Backend

| # | Tujuan | Deskripsi |
|---|---|---|
| O1 | **Katalog dinamis tanpa migrasi** | Penambahan kategori dan sub-kategori jasa baru beserta atribut spesifiknya tidak boleh mengubah struktur basis data. Sejak D72, atribut juga menentukan harga, sehingga satu struktur yang sama menampung model harga yang berbeda antar jasa |
| O2 | **Siklus order yang tidak bisa menyimpang** | Seluruh perubahan status order melewati satu pintu (`transitionOrder()`) dengan validasi transisi, validasi aktor, validasi identitas pelaksana, guard, audit trail, dan efek samping dalam satu transaksi |
| O3 | **Integritas dana yang bisa dibuktikan** | Ledger append-only, saldo sebagai cache yang selalu bisa direkonsiliasi, webhook idempotent, dan constraint basis data sebagai pertahanan terakhir |
| O4 | **Validasi kehadiran dua lapis** | Perhitungan jarak Haversine di sisi server dengan radius toleransi 100 meter, ditambah kode verifikasi 6 digit yang hanya dipegang client |
| O5 | **Penugasan tenaga kerja yang tidak bisa bentrok** | Satu pekerja tidak boleh terikat dua pekerjaan sekaligus, dan jadwal yang tumpang tindih ditolak sebelum order diterima |
| O6 | **Orkestrasi LLM yang terukur** | Setiap pemanggilan Gemini menghasilkan intent terstruktur yang direkam beserta confidence dan latensi, sebagai data pengukuran Bab IV |
| O7 | **Performa dan stabilitas teruji** | Endpoint kritikal (pencarian listing, webhook pembayaran) memenuhi target latensi dan error rate pada pengujian beban |

### 1.3 Definisi Keberhasilan

| Tujuan | Metrik | Cara verifikasi |
|---|---|---|
| O1 | 0 perubahan skema saat menambah sub-kategori, atribut, dan opsi berbayar baru | Skenario admin menambah sub-kategori lengkap dengan atribut OPTION berbayar, lalu provider membuat listing dan client memesan dengan opsi itu |
| O1 | Rentang 2 sampai 7 atribut pada 12 sub-kategori contoh, tanpa kolom tambahan | Tabel rekap Lampiran B `Keputusan-Desain-Sistem.md` |
| O2 | 100% transisi ilegal ditolak | Sekitar 85 test case state machine |
| O3 | Kueri rekonsiliasi V1 mengembalikan 0 baris | Dijalankan setelah seeding dan setelah seluruh pengujian |
| O3 | Webhook duplikat menghasilkan tepat 1 `ESCROW_HOLD` | Kirim payload `invoice.paid` yang sama dua kali |
| O3 | Harga hasil hitung server tidak bisa dipengaruhi client | Kirim `total_amount` palsu lewat API, harus diabaikan |
| O4 | Check-in di luar radius ditolak, kode salah 5 kali memicu lockout | Black Box dengan koordinat dan kode yang disiapkan |
| O5 | Kueri verifikasi V5 mengembalikan 0 baris | Dijalankan setelah skenario order paralel |
| O5 | Dua klaim bersamaan menghasilkan tepat 1 pemenang | Integration test dua request paralel |
| O6 | Akurasi intent extraction >= 80% (usulan) | 30 sampai 50 skenario percakapan berlabel |
| O7 | Target pada Bagian 6 terpenuhi | Stress testing dengan k6 |

### 1.4 Non-Goals

Yang secara sadar **tidak** dibangun di backend:

- Pembayaran tunai dan rekonsiliasi manual
- Model broadcast order ke banyak penyedia, dan model tawar-menawar (quotation)
- **Percakapan pra-order** antara client dan penyedia, dan pesan bebas antar pengguna di luar konteks order (D78, D79). Pesan **di dalam** order termasuk cakupan
- Verifikasi e-KYC otomatis ke sumber data kependudukan
- Verifikasi identitas pekerja oleh platform. Pekerja divalidasi pemilik usaha (D34)
- Resolusi dispute otomatis tanpa admin
- Push notification ke perangkat (FCM) dan Web Push
- Pencatatan seluruh kru yang hadir di lokasi. Sistem mencatat satu penanggung jawab, pendamping hanya diblokir ketersediaannya (D68, D69)
- Order multi-kunjungan dan penyerahan hasil digital bertahap (D75)
- Dompet dan penggajian pekerja. Uang berhenti di usaha (D48)
- Multi-currency
- Microservices, message queue, dan multi-region deployment

---

## 2. System Architecture dan Tech Stack

### 2.1 Pola Arsitektur

Three-tier: frontend, backend REST API, basis data. Backend berbentuk **modular monolith** di dalam monorepo. Alasan: cakupan penelitian tetap, dikerjakan satu orang, dan pemisahan deployment tidak memberi manfaat yang sebanding dengan biayanya. Modularitas dijaga lewat batas folder per domain, bukan lewat proses terpisah.

```
Client / Provider / Pekerja / Admin
        |
        v
  Next.js Frontend  --------------------> OpenStreetMap (tile peta, langsung)
        |  REST (JSON)  +  WebSocket
        v
  Express.js API  <----- webhook ------  Xendit (Invoice, Refund, Payout)
   |  |  |  |  |
   |  |  |  |  +--> SMTP pihak ketiga (notifikasi email, verifikasi akun)
   |  |  |  +-----> Gemini API (structured output)
   |  |  +--------> Supabase Storage (dokumen e-KYC, foto listing, bukti dispute)
   |  +-----------> node-cron (SLA sweep, settlement sweep, presence, email retry)
   v
  PostgreSQL (Supabase) via Prisma ORM
```

### 2.2 Tech Stack

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Runtime | Node.js 20 LTS | Dukungan `crypto.randomInt` dan Prisma stabil |
| Framework | Express.js + TypeScript | Efisiensi sumber daya untuk beban RESTful API (Hadinata & Stianingsih, 2024) |
| ORM | Prisma 6.19.3, **versinya dipin** | Tipe hasil generate dipakai bersama frontend lewat monorepo. Tag `latest` saat ini menunjuk ke release candidate, jadi tanpa pin project akan terpasang RC |
| Basis data | PostgreSQL 15 (Supabase) | JSONB dan index GIN dibutuhkan Hybrid Approach. Partial unique index dibutuhkan kunci in-flight dan eksklusivitas keanggotaan |
| Real-time | Socket.IO | Status order, tawaran Available Now, presence pekerja, pesan dalam order |
| Scheduler | node-cron | Sweep deadline SLA, settlement, presence, dan percobaan ulang email |
| Payment | Xendit (Invoice, Refund, Payout API) | Escrow di lapisan aplikasi |
| LLM | Gemini API | Arahan Pembimbing 1 |
| Email | Layanan SMTP pihak ketiga dengan kuota gratis | **Jangan** memakai akun Gmail pribadi lewat SMTP, deliverability-nya buruk dan gampang diblokir saat pengujian beban |
| Object storage | Supabase Storage | Dokumen e-KYC (private) dan foto listing (public) |
| Validasi input | Zod | Skema validasi sekaligus sumber tipe TypeScript |
| Autentikasi | JWT (`jsonwebtoken`) + bcrypt + refresh token dengan rotasi | |
| Logging | Pino | JSON terstruktur, ringan |
| Pengujian | Vitest (unit dan integrasi), Supertest, k6 (stress) | |

**Catatan caching.** Sistem ini **tidak memakai Redis**. Beban penelitian tidak menuntut distributed cache, dan menambah komponen berarti menambah titik kegagalan sekaligus materi yang harus dipertahankan di sidang. Konsekuensinya:

- Rate limiting memakai `express-rate-limit` dengan penyimpanan in-memory, dan karena API berjalan sebagai satu instance, hitungannya tetap akurat
- Daftar sub-kategori aktif untuk system prompt Gemini di-cache di memori proses dengan TTL 5 menit, di-invalidasi saat admin mengubah katalog
- Kalau nanti dibutuhkan lebih dari satu instance, rate limiting dan cache tersebut wajib dipindah ke store bersama. Ini ditulis sebagai batasan, bukan celah yang tidak disadari

### 2.3 Struktur Repository

```
jasana/
├── apps/
│   ├── web/                    # Next.js (di luar cakupan dokumen ini)
│   └── api/                    # Express.js
│       ├── src/
│       │   ├── config/         # env loader, konstanta
│       │   ├── middlewares/    # auth, rbac, emailVerified, validate,
│       │   │                   # rateLimit, errorHandler
│       │   ├── modules/
│       │   │   ├── auth/       # login, refresh, verifikasi email, reset password
│       │   │   ├── users/      # profil, alamat, ganti email
│       │   │   ├── providers/  # profil usaha, e-KYC, perubahan tipe
│       │   │   ├── workers/    # lamaran, keanggotaan, pemetaan, ketersediaan
│       │   │   ├── catalog/    # kategori, sub-kategori, atribut, usulan taksonomi
│       │   │   ├── listings/   # CRUD listing, harga opsi, foto, FAQ
│       │   │   ├── orders/     # transisi, penugasan, kru, check-in, pesan
│       │   │   ├── payments/   # invoice, refund
│       │   │   ├── webhooks/
│       │   │   ├── wallets/    # ledger, withdrawal
│       │   │   ├── disputes/
│       │   │   ├── reviews/
│       │   │   ├── chatbot/
│       │   │   ├── notifications/
│       │   │   └── admin/      # dashboard, laporan, settings
│       │   ├── jobs/           # cron
│       │   ├── realtime/       # Socket.IO
│       │   ├── lib/            # haversine, crypto, xendit, gemini, mailer, supabase
│       │   └── server.ts
│       └── tests/
├── packages/
│   ├── database/prisma/        # schema.prisma + migrations
│   └── shared/                 # tipe bersama, order-state-machine.ts
└── package.json
```

Setiap modul berisi `*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.schema.ts` (Zod). Aturan yang mengikat: **controller tidak boleh menyentuh Prisma**, dan **service tidak boleh menyentuh objek `req`/`res`**. Logika bisnis seluruhnya di service supaya bisa diuji tanpa HTTP.

### 2.4 Lingkungan

| Lingkungan | Basis data | Xendit | Keterangan |
|---|---|---|---|
| Local | Supabase project dev | Test mode | Webhook diteruskan lewat ngrok |
| Staging / demo | Supabase project dev | Test mode | Dipakai untuk UAT responden |
| Pengujian beban | Supabase project dev | Test mode (webhook di-mock) | Data seed diperbesar |

Produksi komersial di luar cakupan penelitian.

---

## 3. Data Models dan Schema

Sumber kebenaran struktur ada di `skema-database-final.dbml` dan `schema.prisma`. Bagian ini merangkum entitas inti, relasi, dan **constraint yang tidak terlihat di skema Prisma** tetapi wajib dijalankan lewat migrasi SQL manual.

### 3.1 Peta Entitas

| Grup | Tabel |
|---|---|
| A. Identitas dan akses | `users`, `user_addresses`, `verification_tokens`, `refresh_tokens`, `provider_profiles`, `kyc_documents` |
| A2. Tenaga kerja | `provider_workers`, `worker_listings` |
| B. Katalog jasa | `categories`, `subcategories`, `subcategory_attributes`, `listings`, `listing_option_prices`, `listing_photos`, `listing_faqs`, `taxonomy_requests` |
| C. Order | `orders`, `order_crew`, `order_messages`, `order_status_histories`, `order_checkins` |
| D. Pembayaran dan uang | `payments`, `webhook_events`, `wallets`, `wallet_transactions`, `withdrawals`, `refunds` |
| E. Dispute | `disputes`, `dispute_evidences` |
| F. Review | `reviews` |
| G. Chatbot | `chat_sessions`, `chat_messages` |
| H. Sistem | `notifications`, `platform_settings` |

Total **34 tabel dan 35 enum**. Seluruh primary key bertipe UUID, kecuali tabel bervolume tinggi yang bersifat log (`order_status_histories`, `order_messages`, `wallet_transactions`, `chat_messages`, `notifications`) yang memakai `bigserial`, dan `platform_settings` yang memakai `key` sebagai primary key.

### 3.2 Entitas Inti

#### Identitas dan peran

```
users
  id, full_name, email (unique), pending_email, phone (unique),
  password_hash, role (CLIENT | ADMIN), avatar_url, is_active,
  email_verified_at, timestamps

provider_profiles
  id, user_id (unique), provider_type (INDIVIDUAL | BUSINESS),
  requested_provider_type, business_name, bio,
  verification_status (DRAFT | PENDING | VERIFIED | REJECTED | SUSPENDED),
  base_latitude, base_longitude, service_radius_km,
  rating_average, rating_count, completed_orders_count

provider_workers
  id, provider_profile_id, user_id, display_name, photo_url,
  is_owner, membership_status (PENDING | ACTIVE | REJECTED | RESIGNED),
  accepts_assignments, is_available,
  current_latitude, current_longitude, location_updated_at,
  approved_by, approved_at
```

**Aturan yang menentukan seluruh desain otorisasi.** PROVIDER dan WORKER bukan nilai enum `role`. Keduanya didefinisikan lewat keberadaan relasi. Tanpa aturan ini, satu akun tidak bisa menjadi client sekaligus provider, dan seorang pekerja tidak bisa memesan jasa orang lain.

**Lokasi real-time ada di pekerja, bukan di usaha.** Ini perubahan dari rancangan awal (D38). Usaha dengan lima kru punya lima posisi berbeda, dan satu kolom di `provider_profiles` tidak bisa merepresentasikannya. `service_radius_km` tetap di usaha karena itu kebijakan usaha.

**Eksklusivitas keanggotaan.** Satu orang hanya boleh punya satu keanggotaan `ACTIVE`, ditegakkan partial unique index (H23). Jangan menyatakannya sebagai `@@unique([userId])` di Prisma, karena itu akan mengunci orang selamanya dan dia tidak bisa pindah usaha.

**Dua kolom ketersediaan yang sering dikira sama (D39):**

| | `accepts_assignments` | `is_available` |
|---|---|---|
| Artinya | Bersedia turun ke lapangan sama sekali | Sedang online untuk order mendadak |
| Sifatnya | Menetap | Harian, di-toggle pekerja sendiri |
| Dilihat oleh | Penugasan **kedua** mode | Hanya pencocokan Available Now |

Setiap provider wajib punya minimal satu pekerja `ACTIVE` dengan `accepts_assignments = true` (H27).

#### Katalog dan Hybrid Approach

```
categories (1) ──< subcategories (1) ──< subcategory_attributes
                            │
                            ├──< listings.attributes (JSONB, hanya SPEC)
                            └──< listing_option_prices  (nilai OPTION + delta)
```

`subcategory_attributes` mendefinisikan: `attribute_key`, `label`, `data_type` (TEXT, NUMBER, BOOLEAN, SELECT, MULTISELECT, DATE), `attribute_role` (SPEC atau OPTION), `pricing_mode` (NONE, FLAT_PER_OPTION, PER_UNIT), `options`, `unit`, `is_required`, `is_filterable`, `is_active`, `validation_rule`.

**Tiga lapis wewenang (D72):**

| | Admin | Provider | Client |
|---|---|---|---|
| Atribut apa saja yang ada, tipenya, SPEC atau OPTION | menentukan | | |
| Nilai atribut SPEC | | mengisi | membaca |
| Opsi mana yang dilayani dan berapa deltanya | | mencentang dan mengisi | memilih dan membayar |

**Kontrak wajib:** backend memvalidasi `listings.attributes` terhadap definisi setiap kali listing dibuat atau diubah. Atribut wajib yang kosong, tipe data yang tidak cocok, nilai `SELECT` di luar `options`, dan nilai di luar `validation_rule` harus ditolak 422. Tanpa validasi ini JSONB menjadi liar dan fitur filter tidak bisa dipercaya.

**Perubahan definisi oleh admin (D67), empat aturan:**

1. Validasi hanya dijalankan saat **tulis**, tidak pernah saat baca. Listing lama tetap tayang
2. Atribut wajib baru hanya berlaku untuk listing baru. Listing lama ditandai `attributes_need_update` dan dipaksa melengkapi pada kali berikutnya diedit
3. Penghapusan atribut dan option bersifat **soft** lewat `is_active`
4. **Tidak ada backfill otomatis.** Sistem tidak menebak nilai atas nama provider

**`listings.is_available_now` sudah dibuang (D45).** Status online sekarang turunan:

```
Listing bisa dipesan mendadak kalau:
  supports_available_now = true
  DAN punya minimal satu pekerja TERPETAKAN (worker_listings) yang:
      membership_status = ACTIVE
      accepts_assignments = true DAN is_available = true
      presence belum basi
      tidak sedang in-flight
```

Konsekuensinya filter `available_now=true` jadi join ke `worker_listings` dan `provider_workers`, sehingga `idx_worker_geo` **wajib ada sebelum stress testing**.

#### orders

Kolom yang menentukan perilaku sistem:

| Kelompok | Kolom | Catatan |
|---|---|---|
| Identitas | `order_number` | Format `ORD-20260914-0001`, unique |
| Pelaksana | `provider_profile_id`, `assigned_worker_id`, `accepted_by` | Usaha yang bertanggung jawab, pekerja penanggung jawab, dan siapa yang menekan tombol terima |
| Snapshot | `snapshot_listing_title`, `snapshot_assignee_name`, `snapshot_attributes`, `snapshot_selected_options`, `snapshot_duration_minutes` | Diambil saat pemesanan. Perubahan harga atau tarif opsi besok tidak boleh mengubah order kemarin |
| Uang | `listing_base_amount`, `options_amount`, `platform_fee`, `total_amount`, `provider_earning`, `platform_fee_refunded` | Dua invariant terpisah, lihat di bawah |
| Lokasi | `service_address`, `service_latitude`, `service_longitude`, `location_source`, `location_accuracy_m` | Titik acuan Haversine. `location_accuracy_m` hanya bermakna kalau sumbernya GPS |
| Verifikasi | `verification_code_encrypted`, `verification_attempts`, `verification_expires_at`, `verification_locked_until`, `verified_at` | Kode **dienkripsi AES (reversible)**, bukan di-hash, karena client harus bisa melihatnya berulang kali |
| Deadline | `response_deadline_at`, `payment_deadline_at`, `settlement_due_at` | Disimpan sebagai kolom, bukan timer memori, supaya tahan restart server |

**Rumus nominal order (D28, D73):**

```
listing_base_amount = harga listing saat dipesan          50.000
options_amount      = jumlah seluruh delta opsi          +70.000
--------------------------------------------------------------
total_amount        = listing_base_amount + options_amount 120.000  (dibayar client)
platform_fee        = total_amount * platform_fee_percentage 12.000
provider_earning    = total_amount - platform_fee         108.000
```

**Dua invariant terpisah, dan itu disengaja:**

```sql
total_amount = listing_base_amount + options_amount   -- dari mana angkanya (H53)
total_amount = provider_earning + platform_fee        -- ke mana angkanya pergi (H5)
```

Kalau ada bug, langsung ketahuan sisi mana yang salah tanpa menelusuri keduanya. `options_amount` wajib jadi kolom, bukan sekadar dijumlahkan dari `snapshot_selected_options`, karena CHECK constraint tidak bisa membaca isi JSONB.

Fee tidak dipungut sebagai transaksi terpisah. Saat `ESCROW_HOLD`, yang masuk ke `balance_pending` hanya `provider_earning`, sehingga selisihnya otomatis tertinggal sebagai pendapatan platform di akun Xendit.

#### Ledger dana

```
wallets (cache saldo, milik USAHA)
  balance_available, balance_pending

wallet_transactions (append-only, sumber kebenaran)
  type, amount_available_delta, amount_pending_delta,
  balance_available_after, balance_pending_after
```

Peta delta per tipe transaksi:

| Tipe | `available_delta` | `pending_delta` |
|---|---|---|
| `ESCROW_HOLD` | 0 | `+provider_earning` |
| `ESCROW_RELEASE` | `+provider_earning` | `-provider_earning` |
| `WITHDRAWAL` | `-amount` | 0 |
| `WITHDRAWAL_REVERSAL` | `+amount` | 0 |
| `REFUND_DEDUCTION` | 0 | `-amount` |

**Aturan mutlak:** baris ledger tidak pernah di-UPDATE dan tidak pernah dihapus. Koreksi dilakukan dengan baris `ADJUSTMENT` berlawanan arah. Invariant yang diuji otomatis:

```sql
SUM(amount_available_delta) = wallets.balance_available
SUM(amount_pending_delta)   = wallets.balance_pending
```

**Modul uang tidak tersentuh penambahan tenaga kerja.** Wallet tetap milik usaha (D48), rating tetap milik usaha (D49), pekerja tidak punya dompet, dan penggajian di luar cakupan. Yang berubah hanya siapa yang menekan tombol, bukan ke mana uang bergerak.

#### webhook_events

Kunci idempotency. `event_id` **disusun sendiri** sebagai kunci komposit (`invoice:<id>:<status>`, `payout:<id>:<status>`) karena Xendit tidak menyediakan header webhook id, sementara Xendit melakukan retry sampai 6 kali dengan exponential backoff. Tabel ini sengaja **tanpa foreign key** supaya log selalu bisa masuk walaupun referensinya belum ada.

#### order_messages dan listing_faqs

Dua jalur komunikasi yang sengaja dibuat sempit (D78, D79):

| | `listing_faqs` | `order_messages` |
|---|---|---|
| Kapan | Sebelum memesan | Setelah order diterima |
| Siapa menulis | Provider, satu arah | Client, pemilik, pekerja yang ditugaskan |
| Terbaca siapa | Semua calon client | Peserta order itu saja |
| Masa aktif | Selama listing tayang | `ACCEPTED` sampai `settlement_due_at`, lalu read-only |

**Percakapan pra-order sengaja tidak ada.** Alasan utamanya posisi penelitian: tanya jawab sebelum order adalah langkah pertama menuju model quotation yang sudah ditolak D23, dan begitu masuk, pembeda direct browse-and-book di usulan ide hilang. Ditambah tidak ada SLA yang bisa ditegakkan, volume tidak terbatas, dan risiko disintermediasi maksimal.

**Jangan menamainya chat.** `chat_sessions` dan `chat_messages` milik chatbot AI. Di laporan selalu disebut "pesan dalam order".

### 3.3 Kebijakan Delete

| Kebijakan | Dipakai untuk |
|---|---|
| `restrict` | Semua relasi yang menyentuh order dan uang (`orders`, `payments`, `refunds`, `disputes`, `reviews`, `wallet_transactions`, `withdrawals`), plus `provider_workers.user_id` dan `order_checkins.worker_id` |
| `cascade` | Data turunan murni (`user_addresses`, `verification_tokens`, `refresh_tokens`, `kyc_documents`, `listing_photos`, `listing_faqs`, `listing_option_prices`, `worker_listings`, `order_crew`, `order_messages`, `order_status_histories`, `chat_messages`, `dispute_evidences`) |
| `set null` | Kolom aktor opsional (`changed_by_user_id`, `reviewed_by`, `verified_by`, `updated_by`, `approved_by`, `accepted_by`) |
| Soft delete | `listings.deleted_at`, `subcategory_attributes.is_active`, `listing_faqs.is_active` |

**Perhatikan `provider_workers.user_id` memakai `restrict`, bukan `cascade`.** Karena `orders.assigned_worker_id` merujuk ke sana, kalau akun pekerja dihapus, riwayat order yang pernah dia kerjakan tidak boleh ikut hilang.

### 3.4 Constraint SQL Manual (Wajib)

Prisma tidak mendukung partial unique index maupun CHECK constraint. Migrasi kedua (`migration-constraints.sql`) berisi 19 CHECK constraint dan 12 index. **Tanpa file ini, dua belas pengaman kritikal tidak aktif.**

| ID | Constraint | Kalau tidak ada |
|---|---|---|
| H1 | Saldo wallet tidak boleh negatif | Provider bisa menarik dana melebihi saldonya |
| H2 | Satu order satu pembayaran lunas dan satu invoice aktif | Client membayar dua kali dari tab lama, escrow di-hold dua kali |
| H3 | Satu order satu `ESCROW_HOLD` dan satu `ESCROW_RELEASE`, selamanya | Dana bisa dilepas ganda |
| H4 | **Satu pekerja tidak boleh punya dua order in-flight** | Satu orang menerima dua pekerjaan fisik bersamaan |
| H5, H53 | Komposisi dan konsistensi nominal order | Nominal order tidak konsisten, dan tidak jelas sisi mana yang salah |
| H6 | Ledger harus bergerak, rating 1 sampai 5, `distance_meters >= 0` | Baris sampah masuk ledger |
| H18 | Index GIN untuk `listings.attributes` | Filter atribut dinamis melakukan full table scan |
| H23 | **Eksklusivitas keanggotaan pekerja** | Satu orang aktif di dua usaha, `is_available` jadi ambigu dan H4 pecah |
| H24 | `assigned_worker_id` wajib terisi mulai `ACCEPTED` | Order berjalan tanpa penanggung jawab |
| H32 | Unique pemetaan pekerja ke listing | Pemetaan ganda |
| H33, H62 | Unique token verifikasi dan refresh token | Tabrakan token |
| H44 | Unique kru order | Satu pekerja tercatat dua kali sebagai pendamping |
| H54 | Unique harga opsi per listing | Satu opsi punya dua harga |
| H63 | Sesi chat wajib punya identitas | Sesi tanpa identitas, rate limiting per sesi tidak bisa ditegakkan |
| H69 | Peran dan panjang pesan dalam order | Admin ikut mengirim dan `read_at` jadi ambigu |

#### Definisi in-flight (H4)

**Kuncinya pindah dari provider ke pekerja (D40).** Kalau index lama pada `provider_profile_id` dipertahankan, usaha dengan lima pekerja tetap hanya bisa memegang satu order, dan fitur tenaga kerja yang diminta Pembimbing 1 justru diblokir oleh constraint sendiri.

Predikat in-flight bergantung pada status **dan** mode, karena "sedang terikat pekerjaan" berarti berbeda di dua mode.

| Status | In-flight | Alasan |
|---|---|---|
| `PENDING_ACCEPTANCE` | Tidak | Pekerja belum ditugaskan, `assigned_worker_id` masih NULL |
| `ACCEPTED`, `PAID` | **Hanya `AVAILABLE_NOW`** | Available Now berarti sekarang, jendelanya hanya belasan menit. Order `SCHEDULED` bisa berstatus `PAID` selama berhari-hari sebelum jadwalnya, jadi kalau ikut dihitung, mode Scheduled praktis tidak bisa dipakai |
| `ON_THE_WAY`, `ARRIVED`, `IN_PROGRESS`, `AWAITING_VERIFICATION` | Ya | Pekerjaan fisik sedang berlangsung |
| `COMPLETED` | Tidak | Pekerjaan sudah selesai. Holding window murni soal uang |
| `DISPUTED` | **Tidak** | Dispute adalah proses administratif yang bisa makan berhari-hari. Kalau memblokir, client yang jengkel bisa membuka dispute semata-mata untuk melumpuhkan penghasilan penyedia |
| Terminal lainnya | Tidak | |

```sql
CREATE UNIQUE INDEX uniq_inflight_order_per_worker
  ON orders (assigned_worker_id)
  WHERE assigned_worker_id IS NOT NULL
    AND (status IN ('ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_VERIFICATION')
         OR (booking_mode = 'AVAILABLE_NOW' AND status IN ('ACCEPTED', 'PAID')));
```

**Satu index, bukan dua.** Kalau predikatnya dipecah menjadi dua index terpisah, pekerja yang sedang `IN_PROGRESS` masih bisa menerima order Available Now baru, karena keduanya jatuh di index berbeda dan tidak saling bertabrakan.

Pelanggaran constraint (Prisma `P2002`) dipetakan ke 409 `WORKER_HAS_INFLIGHT_ORDER`, bukan 500.

#### Yang tidak dijaga basis data

Empat aturan penting ditegakkan **service layer**, jadi wajib punya unit test sendiri:

| ID | Aturan | Kenapa tidak bisa di basis data |
|---|---|---|
| H25 | Bentrok jadwal antar order `SCHEDULED` | Unique index tidak bisa memeriksa **irisan rentang waktu**, hanya kesamaan nilai. Solusi kedapnya butuh `EXCLUDE` constraint dengan `btree_gist` dan kolom `tstzrange` baru |
| H45 | Pendamping ikut diblokir ketersediaannya | Index in-flight hanya melihat `assigned_worker_id` |
| H70 | Masa aktif pesan dalam order | Bergantung pada status order dan perbandingan terhadap `now()`, yang tidak immutable |
| H71 | Pengirim pesan wajib peserta order | Pemeriksaan join, bukan pemeriksaan per baris |

**Rumus bentrok jadwal (H25):**

```
Untuk order SCHEDULED, tolak kalau ada order SCHEDULED lain milik pekerja
yang sama (sebagai assigned_worker_id ATAU sebagai pendamping di order_crew)
dengan rentang

    [scheduled_at, scheduled_at + snapshot_duration_minutes + buffer)

yang beririsan dengan rentang order baru.
Status yang dihitung: ACCEPTED dan PAID.
```

**Kasus batas yang wajib masuk unit test:** order yang berdempetan persis, dan order yang hanya beririsan di buffer.

**Kasus silang antar mode (H28):** pekerja punya jadwal pukul 14.00, lalu pukul 13.00 masuk order Available Now. Tolak Available Now kalau ada order `SCHEDULED` berstatus `PAID` milik pekerja itu yang jatuh dalam rentang `now + snapshot_duration_minutes + buffer`.

### 3.5 Parameter Sistem (`platform_settings`)

Disimpan sebagai key-value JSONB supaya bisa diubah saat eksperimen tanpa deploy ulang.

| Key | Nilai default | Fungsi |
|---|---|---|
| `platform_fee_percentage` | 10 | Komisi platform dari penyedia |
| `geolocation_radius_meters` | 100 | Radius toleransi validasi kedatangan |
| `available_now_response_minutes` | 5 | SLA respons mode Available Now |
| `scheduled_approval_hours` | 24 | SLA respons mode Scheduled |
| `settlement_holding_hours` | 24 | Holding window escrow dan batas buka dispute |
| `payment_window_minutes` | 10 | Batas waktu bayar setelah order diterima |
| `verification_max_attempts` | 5 | Batas percobaan kode verifikasi |
| `verification_lockout_minutes` | 15 | Durasi lockout setelah batas terlampaui |
| `available_now_offer_limit` | 5 | Jumlah pekerja yang ditawari satu order mendadak |
| `worker_presence_timeout_minutes` | 10 | Toleransi putus sinyal sebelum pekerja dianggap offline |
| `worker_location_move_threshold_meters` | 200 | Perpindahan minimum sebelum koordinat dikirim ulang |
| `worker_location_max_interval_minutes` | 5 | Batas waktu antar pengiriman koordinat |
| `schedule_conflict_buffer_minutes` | 30 | Jeda perjalanan antar order Scheduled |
| `email_retry_max_attempts` | 3 | Percobaan ulang pengiriman email gagal |
| `guest_chat_message_limit` | 20 | Batas pesan per sesi chatbot tamu |
| `guest_chat_ip_hourly_limit` | 50 | Batas pesan chatbot per alamat IP per jam |
| `guest_chat_daily_global_limit` | ditetapkan saat pengujian | Rem darurat seluruh chatbot tamu |
| `access_token_ttl_minutes` | 15 | Masa berlaku access token |
| `refresh_token_ttl_days` | 30 | Masa berlaku refresh token |
| `listing_faq_max_items` | 10 | Batas butir FAQ per listing |
| `order_message_max_length` | 2000 | Batas panjang satu pesan dalam order |
| `order_message_rate_per_minute` | 20 | Batas pesan per menit per pengirim |
| `kyc_document_max_size_mb` | 5 | Batas ukuran satu dokumen e-KYC |
| `dispute_evidence_max_size_mb` | 5 | Batas ukuran satu bukti dispute |
| `orphan_upload_cleanup_hours` | 24 | Umur berkas tanpa baris basis data sebelum dibersihkan cron |

### 3.6 State Machine Order

15 status, 22 transisi legal. Detail guard dan efek samping ada di `State-Machine-Order.md`.

```
PENDING_ACCEPTANCE -> ACCEPTED | REJECTED* | EXPIRED* | CANCELLED
ACCEPTED           -> PAID | PAYMENT_EXPIRED* | CANCELLED
PAID               -> ON_THE_WAY | CANCELLED
ON_THE_WAY         -> ARRIVED | CANCELLED
ARRIVED            -> IN_PROGRESS | DISPUTED
IN_PROGRESS        -> AWAITING_VERIFICATION | DISPUTED
AWAITING_VERIFICATION -> COMPLETED | DISPUTED
COMPLETED          -> SETTLED* | DISPUTED
DISPUTED           -> SETTLED* | REFUNDED*
CANCELLED          -> REFUNDED*          (hanya jika sudah ada pembayaran lunas)

* = terminal
```

**Penambahan tenaga kerja tidak menambah satu pun state.** Yang berubah adalah siapa pelakunya:

| Transisi | Pelaku |
|---|---|
| Menerima atau menolak, mode `SCHEDULED` | Pemilik provider, sekaligus menugaskan pekerja |
| Menerima atau menolak, mode `AVAILABLE_NOW` | **Pekerja atau pemilik**, siapa cepat dia dapat (D70) |
| Berangkat, check-in, mulai, selesai, verifikasi kode | **Pekerja yang ditugaskan saja** |
| Membatalkan dan membuka sengketa | Client, pemilik, admin. **Pekerja tidak** |

**Kenapa pekerja tidak boleh membatalkan atau membuka sengketa.** Keduanya menyentuh dana yang masuk ke wallet usaha. Pekerja yang berhalangan memberi tahu pemiliknya, dan pemilik memakai penggantian penanggung jawab yang tidak membatalkan order sama sekali.

Tiga sifat yang membuat alur dana mudah dibuktikan:

1. **Uang hanya bergerak di empat transisi:** `ACCEPTED -> PAID`, `COMPLETED -> SETTLED`, `DISPUTED -> SETTLED`, `DISPUTED -> REFUNDED`. Audit cukup memeriksa empat jalur, bukan dua puluh dua
2. **`ESCROW_RELEASE` hanya terjadi satu kali di satu pintu**, karena semua jalur sukses bermuara ke `SETTLED` yang bersifat terminal
3. **Refund selalu memotong `balance_pending`, tidak pernah `balance_available`**, karena refund hanya mungkin dari `CANCELLED` atau `DISPUTED`

**Aturan implementasi:** tidak ada satu pun bagian kode yang boleh menulis `orders.status` secara langsung. Semua lewat `transitionOrder()` yang mengunci baris dengan `SELECT ... FOR UPDATE`, memvalidasi transisi (409 jika ilegal), memvalidasi aktor (403 jika tidak berhak), **memvalidasi identitas pelaksana** (403 jika bukan `assigned_worker_id`), menjalankan guard, menulis `order_status_histories`, lalu menjalankan efek samping. Seluruhnya dalam satu transaksi basis data, kecuali panggilan API eksternal yang wajib dilakukan setelah commit.

**Pengecualian: klaim Available Now tidak lewat `transitionOrder()`.** `SELECT ... FOR UPDATE` tidak cukup saat lima pekerja menekan tombol bersamaan, karena barisnya belum terkunci. Klaimnya memakai UPDATE bersyarat atomik lebih dulu, baru guard diperiksa di transaksi yang sama:

```sql
UPDATE orders
SET    status = 'ACCEPTED',
       assigned_worker_id = :worker_id,
       accepted_by = :actor_user_id,
       accepted_at = now()
WHERE  id = :order_id
  AND  status = 'PENDING_ACCEPTANCE'
  AND  assigned_worker_id IS NULL
RETURNING id;
```

Nol baris berarti sudah keduluan: 409 `ORDER_ALREADY_CLAIMED`, dan kirim event Socket.IO supaya kartunya hilang dari layar pekerja lain dan dari dashboard pemilik.

### 3.7 Operasi yang Mengubah Order Tanpa Mengubah Status

Dua operasi ini bukan transisi, jadi tidak lewat `transitionOrder()`, tapi wajib dicatat di `order_status_histories` lewat `metadata`.

| Operasi | Aktor | Batas waktu | Guard |
|---|---|---|---|
| Ganti penanggung jawab (D44) | Pemilik | Sebelum `ON_THE_WAY` | Pengganti terpetakan ke listing, `ACTIVE`, `accepts_assignments = true`, tidak in-flight, tidak bentrok jadwal |
| Ubah daftar pendamping (D69) | Pemilik | Sebelum `ON_THE_WAY`, **mode `SCHEDULED` saja** | Tiap pendamping `ACTIVE`, tidak in-flight, tidak bentrok jadwal. Tidak wajib terpetakan |

Penggantian penanggung jawab inilah yang membuat keputusan menugaskan pekerja saat accept (D42) tidak kaku. Fleksibilitas pemilik tetap ada, cuma pindah dari "menunda keputusan" jadi "boleh mengubah keputusan".

---

## 4. API Endpoints dan Contracts

### 4.1 Konvensi Umum

| Aspek | Ketentuan |
|---|---|
| Base URL | `/api/v1` |
| Format | JSON, `Content-Type: application/json` |
| Autentikasi | `Authorization: Bearer <access token JWT>`, masa berlaku 15 menit |
| Perpanjangan sesi | `POST /auth/refresh` dengan refresh token, yang sekaligus dirotasi |
| Penamaan | Path `kebab-case` jamak, field body `snake_case` mengikuti kolom basis data |
| Timestamp | ISO 8601 UTC (`2026-09-30T07:30:00.000Z`) |
| Uang | Integer rupiah dalam JSON, `decimal` di basis data. Tidak ada pecahan sen |
| Koordinat | `number` derajat desimal, latitude 8 desimal, longitude 8 desimal |
| Paginasi | Query `page` (default 1) dan `limit` (default 20, maksimal 100) |
| Idempotency | Endpoint transisi order aman diulang: pengulangan menghasilkan 409, bukan efek samping ganda |

**Envelope respons sukses:**

```json
{ "success": true, "data": { }, "meta": { "page": 1, "limit": 20, "total": 0 } }
```

**Envelope respons gagal:**

```json
{ "success": false, "error": { "code": "ORDER_TRANSITION_NOT_ALLOWED", "message": "…", "details": [] } }
```

### 4.2 Status Code

| Kode | Dipakai untuk |
|---|---|
| 200 | Berhasil |
| 201 | Sumber daya dibuat |
| 400 | Bentuk permintaan salah, misalnya JSON tidak sah |
| 401 | Token tidak ada atau tidak valid |
| 403 | Aktor tidak berhak, termasuk pekerja yang bukan penanggung jawab |
| 404 | Tidak ada atau bukan milik pemanggil |
| 409 | Kondisi sumber daya tidak sesuai |
| 422 | Isi permintaan tidak lolos validasi |
| 429 | Melewati rate limit atau terkena lockout |
| 500 | Kesalahan tidak tertangani |
| 502 | Layanan eksternal (Xendit, Gemini, SMTP) gagal merespons |
| 503 | Dependensi wajib tidak dapat dihubungi |

**Tiga pembedaan yang disengaja.** 409 dan 400: masalahnya bukan input yang salah melainkan kondisi order. 403 dan 409: transisi `COMPLETED -> SETTLED` legal, tetapi hanya boleh dilakukan `SYSTEM`. 403 karena peran dan 403 karena identitas: pekerja boleh melakukan `PAID -> ON_THE_WAY`, tapi hanya untuk order yang ditugaskan kepadanya.

### 4.3 Daftar Endpoint

Kolom akses: **P** publik, **C** client (user login), **PR** provider terverifikasi, **W** pekerja aktif, **A** admin, **S** sistem (webhook, tanpa JWT).

#### Authentication dan sesi

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| POST | `/auth/register` | P | Registrasi akun, mengirim email verifikasi |
| POST | `/auth/login` | P | Login, mengembalikan access token dan refresh token |
| POST | `/auth/refresh` | P | Tukar refresh token, sekaligus merotasinya |
| POST | `/auth/logout` | C | Cabut refresh token perangkat ini |
| POST | `/auth/logout-all` | C | Cabut seluruh refresh token milik user |
| GET | `/auth/sessions` | C | Daftar perangkat yang aktif |
| GET | `/auth/me` | C | Profil pemanggil beserta status provider dan pekerja |
| POST | `/auth/verify-email` | P | Verifikasi lewat token dari email |
| POST | `/auth/resend-verification` | C | Kirim ulang, membatalkan token lama |
| POST | `/auth/forgot-password` | P | **Selalu membalas sukses**, walau email tidak terdaftar |
| POST | `/auth/reset-password` | P | Ganti password lewat token, mencabut seluruh sesi |
| POST | `/auth/confirm-email-change` | P | Konfirmasi lewat token dari inbox baru |

#### User dan alamat

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| PATCH | `/users/me` | C | Ubah nama, telepon, avatar |
| POST | `/users/me/change-password` | C | Ganti password |
| PATCH | `/users/me/email` | C | Ajukan penggantian email, **wajib password saat ini** |
| DELETE | `/users/me/email-change` | C | Batalkan permintaan penggantian |
| GET | `/users/me/addresses` | C | Daftar alamat |
| POST | `/users/me/addresses` | C | Tambah alamat |
| PATCH | `/users/me/addresses/:id` | C | Ubah alamat |
| DELETE | `/users/me/addresses/:id` | C | Hapus alamat |

#### Provider dan e-KYC

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| POST | `/providers/apply` | C | Ajukan diri menjadi provider, memilih `provider_type` |
| POST | `/providers/me/kyc-documents` | C | Unggah dokumen e-KYC sesuai tipe. **`multipart/form-data`, berkasnya lewat API** (D80) |
| GET | `/providers/me` | C | Status pengajuan dan profil sendiri |
| PATCH | `/providers/me` | PR | Ubah profil bisnis, alamat basis, radius layanan |
| POST | `/providers/me/type-upgrade` | PR | Ajukan perubahan `provider_type` |
| GET | `/providers/:id` | P | Profil publik penyedia |
| GET | `/admin/provider-applications` | A | Daftar pengajuan, filter status |
| POST | `/admin/provider-applications/:id/approve` | A | Setujui, memicu pembuatan wallet **dan baris pekerja pemilik** |
| POST | `/admin/provider-applications/:id/reject` | A | Tolak beserta alasan |
| GET | `/admin/type-upgrade-requests` | A | Antrean pengajuan perubahan tipe |
| PATCH | `/admin/type-upgrade-requests/:id` | A | Setujui atau tolak perubahan tipe |

#### Pekerja dan pemetaan

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| POST | `/providers/:id/worker-applications` | C | Melamar jadi pekerja, sekaligus mencentang listing yang sanggup dikerjakan |
| GET | `/providers/me/workers` | PR | Daftar pekerja dan pelamar |
| POST | `/providers/me/workers/:id/approve` | PR | Setujui pelamar beserta pemetaan finalnya |
| POST | `/providers/me/workers/:id/reject` | PR | Tolak pelamar |
| DELETE | `/providers/me/workers/:id` | PR | Keluarkan pekerja, jadi `RESIGNED` |
| PUT | `/providers/me/workers/:id/listings` | PR | Atur ulang pemetaan pekerja ke listing |
| PUT | `/providers/me/listings/:id/workers` | PR | Atur pemetaan dari sisi listing |
| PATCH | `/providers/me/workers/:id/assignments-setting` | PR | Ubah `accepts_assignments` |
| GET | `/workers/me` | W | Profil keanggotaan sendiri |
| PATCH | `/workers/me/availability` | W | Toggle `is_available`, **wajib menyertakan koordinat** |
| PATCH | `/workers/me/location` | W | Perbarui posisi terkini |
| GET | `/workers/me/orders` | W | Order yang ditugaskan, yang sedang ditawarkan, dan yang diikuti sebagai pendamping |

#### Katalog

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| GET | `/categories` | P | Daftar kategori aktif |
| GET | `/categories/:id/subcategories` | P | Sub-kategori dalam satu kategori |
| GET | `/subcategories/:id/attributes` | P | Definisi atribut dinamis, dipakai form listing dan panel filter |
| POST/PATCH/DELETE | `/admin/categories[/:id]` | A | CRUD kategori |
| POST/PATCH/DELETE | `/admin/subcategories[/:id]` | A | CRUD sub-kategori |
| POST/PATCH/DELETE | `/admin/subcategories/:id/attributes[/:attrId]` | A | CRUD atribut dinamis |
| POST | `/taxonomy-requests` | PR | Ajukan usulan taksonomi, validasi bercabang per jenis |
| GET | `/taxonomy-requests/mine` | PR | Usulan milik sendiri beserta statusnya |
| GET | `/admin/taxonomy-requests` | A | Antrean usulan, dikelompokkan per sub-kategori dan atribut |
| PATCH | `/admin/taxonomy-requests/:id` | A | Setujui, tolak, atau tandai `MERGED` |

#### Listing, harga opsi, dan FAQ

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| GET | `/listings` | P | Pencarian dan filter |
| GET | `/listings/:id` | P | Detail listing, penyedia, foto, FAQ, opsi berbayar, review |
| POST | `/providers/me/listings` | PR | Buat listing |
| PATCH | `/providers/me/listings/:id` | PR | Ubah listing |
| DELETE | `/providers/me/listings/:id` | PR | Soft delete |
| PUT | `/providers/me/listings/:id/option-prices` | PR | Atur opsi yang dilayani beserta deltanya |
| POST | `/providers/me/listings/:id/photos` | PR | Tambah foto |
| DELETE | `/providers/me/listings/:id/photos/:photoId` | PR | Hapus foto |
| GET | `/listings/:id/faqs` | P | Daftar FAQ sebuah listing |
| PUT | `/providers/me/listings/:id/faqs` | PR | Tulis ulang seluruh FAQ listing |

Query parameter `GET /listings`:

| Parameter | Tipe | Keterangan |
|---|---|---|
| `q` | string | Kata kunci pada judul dan deskripsi |
| `category_id`, `subcategory_id` | uuid | Filter kategori |
| `lat`, `lng`, `radius_km` | number | Filter lokasi. Wajib bertiga jika salah satu diisi |
| `available_now` | boolean | Hanya listing yang punya pekerja idle. **Join ke `worker_listings` dan `provider_workers`**, bukan membaca kolom |
| `booking_mode` | enum | `SCHEDULED` atau `AVAILABLE_NOW` |
| `price_min`, `price_max` | integer | Rentang harga dasar listing |
| `attr[<key>]` | string | Filter atribut dinamis, contoh `attr[jenis_kendaraan]=SUV` |
| `sort` | enum | `distance`, `price_asc`, `price_desc`, `rating`, `popular` |

**Aturan implementasi filter lokasi (wajib):** jalankan bounding box terlebih dahulu di klausa WHERE, baru hitung Haversine presisi pada baris yang lolos. Kalau Haversine dihitung langsung untuk semua baris, index tidak terpakai dan hasil stress testing akan buruk.

**Catatan harga pada hasil pencarian.** Karena opsi berbayar, harga di kartu hasil ditampilkan sebagai "mulai dari", yaitu `listings.price` tanpa delta.

#### Order

| Method | Path | Akses | Transisi |
|---|---|---|---|
| POST | `/orders` | C | (buat) `PENDING_ACCEPTANCE` |
| GET | `/orders` | C/PR/W | Daftar order sesuai peran |
| GET | `/orders/:id` | C/PR/W/A | Detail order |
| GET | `/orders/:id/history` | C/PR/W/A | Audit trail transisi |
| POST | `/orders/:id/accept` | PR/W | T1 `-> ACCEPTED`. Scheduled oleh pemilik, Available Now oleh pekerja maupun pemilik |
| POST | `/orders/:id/reject` | PR/W | T2 `-> REJECTED` |
| PATCH | `/orders/:id/assignment` | PR | Ganti penanggung jawab (bukan transisi) |
| PUT | `/orders/:id/crew` | PR | Atur pendamping, `SCHEDULED` saja (bukan transisi) |
| POST | `/orders/:id/cancel` | C/PR/A | T4, T7, T9, T11 `-> CANCELLED` |
| POST | `/orders/:id/depart` | W | T8 `-> ON_THE_WAY` |
| POST | `/orders/:id/check-in` | W | T10 `-> ARRIVED` |
| POST | `/orders/:id/start` | W | T12 `-> IN_PROGRESS` |
| POST | `/orders/:id/finish` | W | T14 `-> AWAITING_VERIFICATION`, membuat kode |
| GET | `/orders/:id/verification-code` | C | Menampilkan kode 6 digit, hanya client pemilik order |
| POST | `/orders/:id/verify` | W | T16 `-> COMPLETED` |
| GET | `/orders/:id/messages` | C/PR/W/A | Riwayat pesan, terpaginasi. Admin membaca saja |
| POST | `/orders/:id/messages` | C/PR/W | Kirim pesan, hanya selama masa aktif |
| PATCH | `/orders/:id/messages/read` | C/PR/W | Tandai pesan sisi lawan sudah dibaca |

#### Pembayaran dan webhook

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| GET | `/orders/:id/payment` | C | Invoice aktif beserta `invoice_url` |
| POST | `/orders/:id/payment` | C | Buat ulang invoice bila yang lama kedaluwarsa dan order masih `ACCEPTED` |
| POST | `/webhooks/xendit/invoice` | S | Callback status pembayaran |
| POST | `/webhooks/xendit/payout` | S | Callback status pencairan |
| POST | `/webhooks/xendit/refund` | S | Callback status refund |

#### Wallet dan withdrawal

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| GET | `/providers/me/wallet` | PR | Saldo available dan pending |
| GET | `/providers/me/wallet/transactions` | PR | Riwayat ledger, terpaginasi |
| POST | `/providers/me/withdrawals` | PR | Ajukan pencairan, saldo langsung didebit |
| GET | `/providers/me/withdrawals` | PR | Riwayat pengajuan |
| GET | `/admin/withdrawals` | A | Antrean pengajuan |
| POST | `/admin/withdrawals/:id/approve` | A | Setujui, memanggil Xendit Payout |
| POST | `/admin/withdrawals/:id/reject` | A | Tolak, memicu `WITHDRAWAL_REVERSAL` |

#### Dispute dan review

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| POST | `/orders/:id/disputes` | C/PR | Buka sengketa, order `-> DISPUTED`. **Pekerja tidak berhak** |
| GET | `/disputes/:id` | C/PR/A | Detail sengketa, bukti, dan **seluruh pesan dalam order** |
| POST | `/disputes/:id/evidences` | C/PR | Unggah bukti. **`multipart/form-data`** (D80) |
| GET | `/admin/disputes` | A | Antrean sengketa |
| POST | `/admin/disputes/:id/review` | A | `OPEN -> UNDER_REVIEW` |
| POST | `/admin/disputes/:id/resolve` | A | Putusan: `RELEASE`, `PARTIAL`, atau `REFUND` |
| POST | `/orders/:id/review` | C | Beri rating dan ulasan |
| GET | `/listings/:id/reviews` | P | Ulasan sebuah listing |
| POST | `/providers/me/reviews/:id/reply` | PR | Balasan penyedia |

#### Chatbot

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| POST | `/chat/guest-sessions` | P | Mulai sesi tamu, mengembalikan `guest_token` |
| POST | `/chat/sessions` | C | Mulai sesi terdaftar, menyusun `personalization_snapshot` |
| POST | `/chat/sessions/:id/claim` | C | Klaim sesi tamu setelah mendaftar |
| GET | `/chat/sessions` | C | Riwayat sesi |
| GET | `/chat/sessions/:id/messages` | P/C | Riwayat percakapan |
| POST | `/chat/sessions/:id/messages` | P/C | Kirim pesan, memanggil Gemini |
| POST | `/chat/sessions/:id/end` | P/C | Akhiri sesi |

Akses **P** pada endpoint chatbot berarti sesi tamu, yang diidentifikasi lewat `guest_token`, bukan JWT.

#### Notifikasi, berkas, admin

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| GET | `/notifications` | C | Daftar notifikasi, filter `is_read` |
| PATCH | `/notifications/:id/read` | C | Tandai dibaca |
| PATCH | `/notifications/read-all` | C | Tandai semua dibaca |
| POST | `/uploads/signed-url` | C | Signed URL Supabase Storage untuk unggah langsung. **Hanya untuk foto listing** (D80) |
| GET | `/admin/reports/transactions` | A | Laporan transaksi, filter periode |
| GET | `/admin/reports/providers` | A | Laporan performa penyedia termasuk SLA miss |
| GET | `/admin/reports/workers` | A | Laporan performa pekerja, akurasi check-in, SLA miss |
| GET | `/admin/reports/revenue` | A | Laporan pendapatan platform |
| GET | `/admin/settings` | A | Baca `platform_settings` |
| PATCH | `/admin/settings` | A | Ubah parameter sistem |
| GET | `/health` | P | Health check (status API dan basis data) |

### 4.4 Kontrak Endpoint Kritikal

#### POST /orders

Request:

```json
{
  "listing_id": "uuid",
  "booking_mode": "SCHEDULED",
  "scheduled_at": "2026-10-05T02:00:00.000Z",
  "address_id": "uuid",
  "service_notes": "pagar warna hijau",
  "location_source": "SAVED_ADDRESS",
  "location_accuracy_m": null,
  "selected_options": {
    "jenis_kendaraan": "SUV",
    "layanan_tambahan": ["Poles Body"],
    "jumlah_unit": 3
  }
}
```

**Yang TIDAK boleh ada di request:** `total_amount`, `platform_fee`, `provider_earning`, atau angka nominal apa pun. Server menghitung sendiri dari `listing_option_prices`. Kalau client boleh mengirim total, siapa pun bisa memesan jasa premium seharga seribu rupiah lewat alat seperti Postman.

Alur server:

```
1. Validasi listing ACTIVE dan tidak deleted
2. Validasi selected_options terhadap subcategory_attributes:
     atribut OPTION wajib terisi
     nilai SELECT ada di options dan is_active
     nilai NUMBER lolos validation_rule
     opsi yang dipilih punya baris listing_option_prices dengan is_offered = true
3. HITUNG harga dari listing_option_prices:
     listing_base_amount = listings.price
     options_amount      = jumlah delta sesuai pricing_mode
     total_amount        = keduanya
     platform_fee        = total_amount * platform_fee_percentage
     provider_earning    = total_amount - platform_fee
4. Snapshot judul, atribut SPEC, opsi terpilih beserta deltanya, dan durasi
5. Set response_deadline_at sesuai mode
6. Mode AVAILABLE_NOW: susun daftar penerima tawaran, maksimal
   available_now_offer_limit pekerja terdekat yang memenuhi syarat,
   lalu kirim Socket.IO ke mereka DAN ke dashboard pemilik
7. Mode SCHEDULED: notifikasi ke pemilik
```

Response 201 memuat rincian harga baris per baris, supaya client bisa menampilkan perhitungannya.

#### POST /orders/:id/accept

Request untuk mode `SCHEDULED`:

```json
{ "assigned_worker_id": "uuid", "crew_worker_ids": ["uuid", "uuid"] }
```

Request untuk mode `AVAILABLE_NOW` oleh pekerja: body kosong, pekerja adalah dirinya sendiri.
Request untuk mode `AVAILABLE_NOW` oleh pemilik: `{ "assigned_worker_id": "uuid" }`, tanpa `crew_worker_ids`.

Guard yang diperiksa, seluruhnya di dalam satu transaksi:

| Guard | Kode error kalau gagal |
|---|---|
| `now() < response_deadline_at` | 409 `RESPONSE_DEADLINE_PASSED` |
| Listing masih `ACTIVE` | 409 `LISTING_NOT_AVAILABLE` |
| Pekerja terpetakan ke listing itu | 422 `WORKER_NOT_MAPPED_TO_LISTING` |
| Keanggotaan `ACTIVE` dan `accepts_assignments = true` | 422 `WORKER_NOT_ASSIGNABLE` |
| Pekerja tidak in-flight | 409 `WORKER_HAS_INFLIGHT_ORDER` |
| Tidak bentrok jadwal | 409 `WORKER_SCHEDULE_CONFLICT` |
| Pendamping hanya pada `SCHEDULED` | 422 `CREW_NOT_ALLOWED_FOR_MODE` |
| Mode `AVAILABLE_NOW` sudah diklaim | 409 `ORDER_ALREADY_CLAIMED` |

#### POST /orders/:id/check-in

Request:

```json
{ "latitude": -8.6512345, "longitude": 115.2167890, "accuracy_meters": 12.5 }
```

Alur server:

```
1. Pastikan pemanggil adalah assigned_worker_id, bukan pekerja lain
   dan bukan pendamping                         -> 403 kalau bukan
2. Hitung Haversine DI SERVER terhadap
   service_latitude dan service_longitude       -> jangan percaya jarak dari client
3. Tulis baris order_checkins dengan worker_id, apapun hasilnya
4. Kalau jarak > radius_threshold_meters        -> 422 CHECKIN_OUT_OF_RADIUS
5. Kalau lolos, transisi ke ARRIVED
```

**Baris `order_checkins` ditulis walaupun gagal.** Justru data percobaan gagal itulah yang paling berharga untuk Bab IV.

#### POST /orders/:id/verify

Request: `{ "code": "483920" }`

```
1. Pastikan pemanggil adalah assigned_worker_id  -> 403 kalau bukan
2. Kalau verification_locked_until belum lewat   -> 429 VERIFICATION_LOCKED
3. NAIKKAN verification_attempts DULU, baru bandingkan kode.
   Kalau dibalik, percobaan yang request-nya putus di tengah tidak terhitung
4. Kalau attempts >= verification_max_attempts,
   set verification_locked_until = now() + verification_lockout_minutes
5. Kalau kode cocok dan belum kedaluwarsa, transisi ke COMPLETED
```

#### POST /webhooks/xendit/invoice

```
1. Verifikasi header x-callback-token            -> 401 kalau tidak cocok
2. Susun event_id = invoice:<invoice_id>:<status>
3. TRANSAKSI 1: catat webhook_events, commit langsung
4. Ambil lock dengan UPDATE bersyarat atomik.
   Nol baris berarti sedang diproses pihak lain atau sudah selesai,
   balas 200 tanpa melakukan apa-apa
5. TRANSAKSI 2: proses bisnisnya, transisi ACCEPTED -> PAID,
   tulis ledger ESCROW_HOLD
6. Balas 200 apapun hasilnya, supaya Xendit tidak retry
   untuk kegagalan yang bukan salah jaringan
```

**Dua transaksi terpisah itu wajib.** Kalau satu transaksi, baris event ikut ter-roll back saat proses gagal dan `processing_status = FAILED` tidak akan pernah terisi.

#### POST /providers/me/kyc-documents

`Content-Type: multipart/form-data`

```
document_type: KTP
file:          <berkas biner>
```

**Berkasnya lewat API, bukan signed URL (D80).** Ini berbeda dari foto listing, dan bedanya disengaja: dokumen e-KYC menentukan seseorang layak jadi penyedia atau tidak, jadi platform harus benar-benar memeriksanya.

Alur server:

```
1. multer memoryStorage, batas kyc_document_max_size_mb
   -> 413 PAYLOAD_TOO_LARGE kalau lewat
2. Periksa MAGIC BYTES berkasnya, BUKAN Content-Type dan BUKAN
   ekstensi nama berkas. Terima image/jpeg, image/png, application/pdf
   -> 422 UNSUPPORTED_FILE_TYPE kalau bukan
3. Unggah ke Supabase Storage bucket PRIVATE
   -> 502 kalau gagal, dan JANGAN tulis baris basis data
4. Baru tulis baris kyc_documents dengan file_url
5. Kalau document_type NPWP atau BUSINESS_LICENSE, pastikan
   provider_type = BUSINESS   -> 422 kalau tidak
```

**Urutan langkah 3 dan 4 tidak boleh dibalik.** Kalau baris basis data ditulis lebih dulu lalu unggah gagal, akan ada dokumen yang tercatat tapi berkasnya tidak ada, dan admin melihat pengajuan yang tidak bisa diperiksa.

**Kenapa memeriksa magic bytes, bukan `Content-Type`.** Header itu dikirim client dan bisa dipalsukan. Berkas `.exe` yang diberi nama `ktp.jpg` dengan `Content-Type: image/jpeg` akan lolos kalau yang diperiksa hanya headernya.

Endpoint `POST /disputes/:id/evidences` memakai pola yang sama, dengan batas `dispute_evidence_max_size_mb`.

#### POST /uploads/signed-url

**Hanya untuk foto listing (D80).** Berkas publik yang jumlahnya banyak dan ukurannya besar sengaja tidak melewati API, supaya endpoint yang diukur di pengujian beban tidak ikut terbebani.

```
1. Balas signed URL bucket publik, berumur pendek
2. Frontend melakukan PUT langsung ke URL itu
3. Frontend memanggil POST /providers/me/listings/:id/photos
   dengan file_url hasilnya
```

**Celah berkas yatim.** Kalau langkah 3 tidak pernah dipanggil, berkasnya nyangkut di Storage tanpa baris `listing_photos`. Ditutup cron harian yang menghapus berkas lebih tua dari `orphan_upload_cleanup_hours` yang tidak punya baris perujuk. Jalur multipart tidak punya masalah ini, karena unggah dan penulisan baris terjadi dalam satu permintaan.

#### POST /orders/:id/messages

Request: `{ "content": "saya sudah di gerbang, unit yang mana?" }`

| Guard | Kode error |
|---|---|
| Pengirim adalah client pemilik order, pemilik provider, atau `assigned_worker_id` | 403 `NOT_ORDER_PARTICIPANT` |
| Status order antara `ACCEPTED` dan sebelum `settlement_due_at` lewat | 409 `MESSAGE_WINDOW_CLOSED` |
| Panjang isi 1 sampai `order_message_max_length` | 422 `VALIDATION_ERROR` |
| Belum melewati `order_message_rate_per_minute` | 429 `RATE_LIMIT_EXCEEDED` |

Efek samping: kirim lewat Socket.IO ke room `order:<order_id>`, lalu notifikasi ke sisi lawan.

#### POST /chat/sessions/:id/messages

```
1. Tentukan identitas: JWT (terdaftar) atau guest_token (tamu)
2. Tamu: periksa tiga lapis rate limit
     per guest_token   -> 429 GUEST_CHAT_LIMIT_REACHED
     per alamat IP     -> 429 RATE_LIMIT_EXCEEDED
     global harian     -> 503 CHATBOT_TEMPORARILY_UNAVAILABLE
3. Terdaftar: rate limit per akun
4. Susun prompt: daftar sub-kategori aktif
   + personalization_snapshot (NULL untuk tamu)
   + riwayat percakapan
5. Panggil Gemini dengan structured output
6. Rekam extracted_intent, intent_confidence, token_usage, latency_ms
7. Cari listing sesuai intent, kembalikan rekomendasi
```

**Jawaban ke tamu tidak boleh memuat data pribadi penyedia** seperti nomor telepon atau alamat persis, hanya yang tampil di halaman listing publik.

#### POST /providers/me/withdrawals

```
1. Validasi saldo available cukup           -> 422 INSUFFICIENT_BALANCE
2. TRANSAKSI: buat baris withdrawals status REQUESTED,
   tulis ledger WITHDRAWAL (available -= amount)
3. Commit, lalu tampilkan di antrean admin
```

Saldo didebit saat **pengajuan**, bukan saat selesai, supaya penyedia tidak bisa mengajukan berkali-kali melebihi saldonya.

---

## 5. Security dan Compliance

### 5.1 Autentikasi

| Aspek | Ketentuan |
|---|---|
| Password | bcrypt, cost factor 10 |
| Access token | JWT 15 menit, tanpa state, memuat `user_id`, `role`, `provider_profile_id`, `worker_id` |
| Refresh token | 30 hari, disimpan sebagai hash SHA-256 di `refresh_tokens` |
| Rotasi | Setiap pemakaian mencabut token lama dan menerbitkan pengganti dalam `family_id` yang sama |
| Deteksi pemakaian ulang | Token yang sudah `revoked_at` dipakai lagi berarti ada salinan dicuri. **Seluruh `family_id` dicabut** |
| Verifikasi email | Wajib sebelum membuat order, mengajukan diri jadi provider, atau melamar jadi pekerja |

**Kenapa payload JWT memuat `provider_profile_id` dan `worker_id`.** Karena peran ditentukan relasi, tanpa ini setiap request harus melakukan join untuk tahu pemanggil provider atau pekerja. Konsekuensinya: saat keanggotaan berubah (disetujui, resign, dikeluarkan), token lama masih memuat nilai lama sampai maksimal 15 menit. Itu dapat diterima karena middleware tetap memverifikasi keanggotaan pada operasi yang sensitif.

### 5.2 Role-Based Access Control

Middleware berlapis, dijalankan berurutan:

| Middleware | Memeriksa |
|---|---|
| `requireAuth` | Access token valid |
| `requireEmailVerified` | `email_verified_at` terisi |
| `requireProvider` | Punya `provider_profiles` berstatus `VERIFIED` |
| `requireWorker` | Punya `provider_workers` berstatus `ACTIVE` |
| `requireAdmin` | `users.role = 'ADMIN'` |
| `requireOrderParticipant` | Pemanggil adalah client, pemilik penyedia, atau pekerja yang ditugaskan |
| `requireAssignedWorker` | Pemanggil **persis** `orders.assigned_worker_id` |

**`requireAssignedWorker` adalah lapis yang paling mudah terlupa.** Peran `WORKER` saja tidak cukup: tanpa lapis ini, seorang pekerja di usaha yang sama bisa menekan Berangkat untuk order rekannya, atau memasukkan kode verifikasi order orang lain. Berlaku untuk lima transisi pelaksanaan: depart, check-in, start, finish, verify.

Pendamping di `order_crew` **tidak lolos** `requireAssignedWorker` maupun `requireOrderParticipant`, jadi mereka tidak bisa melakukan apa pun selain melihat order itu di daftar mereka sendiri.

### 5.3 Enkripsi dan Data Sensitif

| Data | Perlakuan | Alasan |
|---|---|---|
| Password | bcrypt (hash) | Satu arah, tidak pernah perlu dibalik |
| Token email dan refresh token | SHA-256 (hash) | Tidak pernah perlu ditampilkan lagi ke pengguna |
| Kode verifikasi order | **AES (reversible)** | Client harus bisa melihatnya berulang kali di layar |
| Dokumen e-KYC | Diunggah **lewat API** supaya divalidasi server, disimpan di Supabase Storage bucket **private**, dibaca admin lewat signed URL berumur pendek | Berisi KTP dan selfie. Server memeriksa magic bytes, bukan `Content-Type` dari client |
| Nomor rekening | Disimpan apa adanya, hanya terlihat pemiliknya dan admin | Dibutuhkan untuk payout |

**Kontras hash dan enkripsi ini bahan sidang yang bagus**, karena menunjukkan kedua perlakuan dipilih sadar, bukan asal. Yang sebenarnya melindungi uang bukan enkripsi kode verifikasi, melainkan lockout-nya: ruang kode 6 digit hanya 1 juta kombinasi, dan tanpa batas percobaan, script sederhana bisa menghabiskannya.

### 5.4 Keamanan Lapisan Aplikasi

| Aspek | Ketentuan |
|---|---|
| Helmet | Header keamanan standar |
| CORS | Whitelist origin lewat env `CORS_ORIGIN` |
| Body limit | 1 MB. Dua route unggah multipart punya batas sendiri, `kyc_document_max_size_mb` dan `dispute_evidence_max_size_mb` |
| Unggah berkas | `multer` dengan `memoryStorage`, tidak meninggalkan berkas sementara di server. **Validasi magic bytes**, bukan `Content-Type` dari client |
| Validasi input | Zod pada seluruh body, query, dan param |
| SQL injection | Dicegah Prisma. Query mentah hanya dipakai untuk `SELECT ... FOR UPDATE` dan klaim atomik, keduanya dengan parameter terikat |
| **Perhitungan harga** | **Selalu di server.** Request tidak pernah memuat nominal |
| Enumerasi akun | `forgot-password` selalu membalas sukses |
| Webhook | Verifikasi `x-callback-token` pada setiap panggilan |

### 5.5 Rate Limiting

| Endpoint | Batas | Alasan |
|---|---|---|
| `/auth/login` | 10 per 15 menit per IP | Mencegah penebakan password |
| `/auth/forgot-password` | 3 per jam per IP | Mencegah banjir email |
| `/auth/resend-verification` | 1 per menit per akun | Setiap panggilan mengirim email sungguhan |
| `/users/me/email` | 3 per hari per akun | Endpoint ini bisa dipakai membanjiri inbox orang lain |
| `/chat/sessions/:id/messages` terdaftar | 30 per jam per akun | Setiap pesan memanggil Gemini yang berbiaya |
| `/chat/sessions/:id/messages` tamu | 20 per sesi, 50 per jam per IP, plus rem global harian | **Prioritas tinggi.** Tanpa identitas login, endpoint ini terbuka untuk siapa saja |
| `/orders/:id/messages` | 20 per menit per pengirim | Mencegah banjir pesan |
| `/taxonomy-requests` | 3 usulan aktif per provider, lintas jenis | Menjaga antrean admin tetap wajar |
| Global | 100 per menit per IP | Pengaman umum |

### 5.6 Environment Variables

```
DATABASE_URL
JWT_SECRET
JWT_ACCESS_TTL_MINUTES
REFRESH_TOKEN_TTL_DAYS
VERIFICATION_CODE_AES_KEY
XENDIT_SECRET_KEY
XENDIT_CALLBACK_TOKEN
GEMINI_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
SMTP_FROM_ADDRESS
APP_BASE_URL
CORS_ORIGIN
NODE_ENV
PORT
```

Seluruhnya divalidasi dengan Zod saat boot. Aplikasi **gagal start** kalau ada yang kosong, bukan jalan lalu error di tengah jalan.

### 5.7 Compliance dan Etika Penelitian

| Aspek | Ketentuan |
|---|---|
| Data responden UAT | Akun uji dihapus setelah penelitian selesai |
| Dokumen e-KYC saat pengujian | Memakai data simulasi, bukan KTP asli responden |
| Nama usaha di data simulasi | Karangan, tidak memakai nama usaha nyata |
| Harga di data simulasi | Diambil dari rentang wajar pasaran, dicatat sumbernya untuk Bab IV |
| Percakapan chatbot | Direkam sebagai data penelitian, disebutkan di lembar persetujuan responden |

---

## 6. Non-Functional Requirements

### 6.1 Latensi

| Endpoint | Target p95 | Catatan |
|---|---|---|
| `GET /listings` tanpa filter lokasi | < 300 ms | |
| `GET /listings` dengan filter lokasi dan atribut | < 500 ms | Bounding box dulu, baru Haversine |
| `GET /listings?available_now=true` | < 600 ms | Join ke `worker_listings` dan `provider_workers` |
| `POST /orders` | < 500 ms | Termasuk perhitungan harga dan penyusunan daftar penerima tawaran |
| `POST /orders/:id/accept` | < 400 ms | Termasuk seluruh guard dan pemeriksaan bentrok jadwal |
| Webhook Xendit | < 200 ms sampai balas 200 | Pemrosesan bisnis boleh menyusul |
| `POST /chat/.../messages` | < 3000 ms | Didominasi latensi Gemini |
| Selain di atas | < 400 ms | |

### 6.2 Throughput dan Beban

| Skenario | Target |
|---|---|
| Pencarian listing | 50 concurrent user, error rate < 1% |
| Webhook pembayaran | 20 request per detik, tanpa duplikasi ledger |
| Klaim Available Now bersamaan | 10 klaim paralel untuk satu order, tepat 1 berhasil |

### 6.3 Ketersediaan dan Keandalan

| Aspek | Ketentuan |
|---|---|
| Transaksi basis data | Seluruh operasi yang menyentuh uang dalam satu transaksi |
| Panggilan API eksternal | **Tidak boleh** di dalam transaksi basis data |
| Idempotency webhook | `event_id` unik, lock lewat UPDATE bersyarat atomik |
| Pemulihan proses macet | Cron mengembalikan baris `PROCESSING` yang `locked_at` lebih dari 5 menit ke `FAILED` |
| Timer | Tidak ada timer di memori. Seluruh deadline disimpan sebagai kolom |

### 6.4 Penanganan Kegagalan Layanan Eksternal

| Kegagalan | Perilaku |
|---|---|
| Xendit tidak merespons saat membuat invoice | 502 dengan pesan ramah. Order tetap `ACCEPTED`, client bisa memicu pembuatan ulang invoice |
| Xendit gagal saat payout | Withdrawal tetap `APPROVED`, `failure_code` dicatat, admin bisa mencoba ulang |
| Gemini timeout atau over quota | 502 dengan pesan ramah. Sesi chat tetap tersimpan, pesan user tetap direkam |
| SMTP gagal | `email_status = FAILED`, cron mencoba ulang maksimal 3 kali. **Tidak pernah membatalkan transisi order** |
| Supabase Storage gagal | Unggahan gagal tanpa membuat baris dokumen setengah jadi |

**Aturan lintas modul:** panggilan API eksternal tidak boleh berada di dalam transaksi basis data. Pola yang benar adalah commit dulu, panggil API, lalu perbarui hasilnya lewat webhook.

### 6.5 Skalabilitas dan Maintainability

| Aspek | Ketentuan |
|---|---|
| Model penskalaan | Vertikal (satu instance). Horizontal di luar cakupan, dan akan menuntut pemindahan rate limiter serta cache ke store bersama |
| Indexing | Seluruh kolom filter utama terindeks, termasuk `idx_listing_search`, `idx_worker_geo`, `idx_worker_matching`, `idx_order_worker_status`, `idx_order_worker_schedule`, `idx_order_sla_sweep`, `idx_order_settlement_sweep`, dan index GIN pada `listings.attributes` |
| Kueri N+1 | Dilarang. Gunakan `include` atau `select` Prisma secara eksplisit |
| Type safety | TypeScript `strict: true`. Tipe hasil generate Prisma dipakai bersama antara `apps/api` dan `apps/web` |
| Migrasi | Seluruh perubahan skema lewat Prisma Migrate. Constraint manual sebagai migrasi terpisah yang ikut masuk version control |
| Observability | Log terstruktur dengan `request_id` per permintaan, dan waktu eksekusi setiap transisi order |

### 6.6 Aturan Bisnis yang Bersifat Mengikat

Ringkasan aturan yang tidak boleh dilanggar implementasi mana pun:

1. `orders.status` hanya boleh berubah lewat `transitionOrder()`, kecuali klaim atomik Available Now yang tetap diikuti seluruh guard dalam transaksi yang sama
2. Transisi pelaksanaan hanya boleh oleh `orders.assigned_worker_id`, bukan sembarang pekerja di usaha yang sama
3. Baris `wallet_transactions` tidak pernah di-UPDATE atau dihapus
4. Satu order hanya boleh punya satu `ESCROW_HOLD` dan satu `ESCROW_RELEASE`, selamanya
5. Saldo penyedia didebit saat withdrawal diajukan, bukan saat selesai
6. Refund selalu memotong `balance_pending`, tidak pernah `balance_available`
7. **Harga selalu dihitung ulang di server**, tidak pernah menerima nominal dari client
8. Harga, atribut, opsi terpilih, dan nama penanggung jawab di-snapshot ke order saat pemesanan
9. Perhitungan jarak Haversine dilakukan di server, tidak pernah mempercayai nilai dari client
10. Seluruh deadline disimpan sebagai kolom, tidak pernah sebagai timer di memori
11. Setiap provider wajib punya minimal satu pekerja `ACTIVE` dengan `accepts_assignments = true`
12. Listing tidak boleh berpindah dari `DRAFT` ke `ACTIVE` tanpa pekerja terpetakan
13. Unggahan multipart divalidasi lewat magic bytes, dan barisnya ditulis hanya setelah berkasnya benar-benar masuk Storage

---

## 7. Background Jobs dan Real-Time

### 7.1 Cron

| Job | Jadwal | Aksi |
|---|---|---|
| Sweep response deadline | tiap 1 menit | Order `PENDING_ACCEPTANCE` yang `response_deadline_at` lewat menjadi `EXPIRED`. Untuk Available Now, catat SLA miss dan **matikan toggle `is_available`** seluruh pekerja yang ditawari |
| Sweep payment deadline | tiap 1 menit | Order `ACCEPTED` yang `payment_deadline_at` lewat menjadi `PAYMENT_EXPIRED`, invoice di-expire di Xendit, **kunci slot tentatif pekerja dan pendamping dilepas** |
| Sweep settlement | tiap 5 menit | Order `COMPLETED` yang `settlement_due_at` lewat dan tidak punya dispute `OPEN` atau `UNDER_REVIEW` menjadi `SETTLED` beserta `ESCROW_RELEASE`. Jalur pesan jadi read-only |
| Sweep presence pekerja | tiap 2 menit | Pekerja yang koneksi Socket.IO-nya putus lebih dari `worker_presence_timeout_minutes` dimatikan `is_available`-nya, supaya tampilan dashboard jujur |
| Pemulihan webhook macet | tiap 5 menit | `webhook_events` berstatus `PROCESSING` dengan `locked_at` lebih dari 5 menit dikembalikan ke `FAILED` supaya bisa diproses ulang |
| Percobaan ulang email | tiap 5 menit | `notifications` dengan `email_status = FAILED` dan percobaan kurang dari `email_retry_max_attempts` dikirim ulang |
| Pembersihan sesi tamu | tiap 1 jam | `chat_sessions` tamu yang `expires_at` lewat ditandai `ENDED`. Datanya tidak dihapus, karena jadi bahan pengukuran Bab IV |
| Pembersihan token kedaluwarsa | tiap 1 hari | `verification_tokens` dan `refresh_tokens` yang sudah lewat masa berlaku dihapus |
| Pembersihan berkas yatim | tiap 1 hari | Berkas di bucket foto listing yang lebih tua dari `orphan_upload_cleanup_hours` dan tidak punya baris `listing_photos` yang merujuknya dihapus dari Storage |

Setiap job memproses per batch dengan `FOR UPDATE SKIP LOCKED` dan mencatat jumlah baris yang diproses ke log.

### 7.2 Socket.IO

Autentikasi koneksi memakai access token yang sama. Room yang dipakai:

| Room | Anggota |
|---|---|
| `user:<user_id>` | Satu pengguna, di seluruh perangkatnya |
| `order:<order_id>` | Client, pemilik penyedia, dan pekerja yang ditugaskan |
| `provider:<provider_profile_id>` | Pemilik, untuk dashboard usaha |

| Event | Arah | Isi |
|---|---|---|
| `order:status_changed` | server ke room order | `order_id`, `from_status`, `to_status`, `timestamp` |
| `order:offer` | server ke pekerja terpilih dan ke room provider | Ringkasan order Available Now beserta sisa waktu respons |
| `order:offer_closed` | server ke pekerja terpilih dan ke room provider | Order sudah diklaim pihak lain, kartunya dihapus dari layar |
| `order:assignment_changed` | server ke room order | Penanggung jawab diganti, beserta nama lama dan baru |
| `order:location_update` | pekerja ke server ke client | Posisi pekerja saat `ON_THE_WAY` |
| `order:message` | server ke room order | Pesan baru dalam order |
| `worker:presence` | pekerja ke server | Denyut koneksi, dasar penentuan online |
| `notification:new` | server ke `user:<id>` | Notifikasi baru |

Socket.IO hanya mengirim pemberitahuan. **Seluruh perubahan state tetap lewat REST API**, supaya ada satu jalur otorisasi dan satu jalur audit. Satu-satunya pengecualian adalah `worker:presence`, yang memang tidak mengubah state apa pun.

---

## 8. Strategi Pengujian

| Jenis | Cakupan | Alat |
|---|---|---|
| Unit | Haversine, kalkulasi nominal order dan delta opsi, validator atribut dinamis, `ALLOWED_TRANSITIONS`, pemeriksaan bentrok jadwal | Vitest |
| Integrasi | Endpoint terhadap basis data uji, termasuk transaksi, constraint, dan klaim paralel | Vitest + Supertest |
| Black Box | 127 test case pada 15 modul fungsional (`PPL_A_2305551065_UAS.docx`), ditambah sekitar 85 test case state machine | Manual dan terdokumentasi |
| UAT | Responden menjalankan skenario end-to-end sebagai empat aktor, mengisi kuesioner Likert | Kuesioner |
| Stress | Pencarian listing, webhook pembayaran, klaim Available Now | k6 |

### 8.1 Pemetaan test case state machine

| Jenis | Jumlah |
|---|---|
| Positif, guard terpenuhi | 22 |
| Negatif, guard gagal | 22 |
| Negatif, aktor salah | 18 |
| **Negatif, pekerja salah** (bukan penanggung jawab) | 5 |
| Negatif, transisi ilegal | minimal 10 |
| Operasi non-transisi (ganti penanggung jawab, ubah pendamping) | 8 |

### 8.2 Tujuh skenario negatif yang paling layak ditonjolkan di laporan

1. **Webhook duplikat.** Kirim `invoice.paid` yang sama dua kali. Harapan: ledger hanya bertambah satu baris `ESCROW_HOLD`
2. **Klaim bersamaan.** Dua pekerja mengklaim order Available Now yang sama pada saat bersamaan. Harapan: tepat satu berhasil, yang kalah dapat 409 `ORDER_ALREADY_CLAIMED`. **Wajib integration test yang benar-benar menembakkan dua request paralel**, bukan unit test
3. **Pekerja ganda.** Tugaskan satu pekerja ke dua order in-flight. Harapan: yang kedua ditolak `uniq_inflight_order_per_worker`
4. **Pekerja salah.** Pekerja lain di usaha yang sama menekan Berangkat untuk order yang bukan miliknya. Harapan: 403, bukan berhasil
5. **Harga palsu.** Kirim `total_amount` palsu di body `POST /orders`. Harapan: diabaikan, server menghitung sendiri
6. **Lockout kode.** Masukkan kode verifikasi salah enam kali. Harapan: percobaan keenam ditolak karena lockout, bukan karena kodenya salah
7. **Bentrok jadwal.** Dua order Scheduled dengan rentang beririsan untuk pekerja yang sama. Harapan: yang kedua ditolak 409 `WORKER_SCHEDULE_CONFLICT`. Termasuk kasus batas: berdempetan persis, dan hanya beririsan di buffer

### 8.3 Kueri verifikasi

Dijalankan setelah seeding dan setelah seluruh pengujian, hasilnya masuk Bab IV. Seluruhnya ada di `migration-constraints.sql`.

| Kueri | Memeriksa | Hasil benar |
|---|---|---|
| V1 | Rekonsiliasi ledger terhadap cache saldo | 0 baris |
| V2 | Akurasi validasi geolokasi | tabel hasil |
| V3 | Performa intent extraction, dipecah tamu dan terdaftar | tabel hasil |
| V4 | Pendapatan platform beserta komposisi nominal | tabel hasil |
| V5 | Tidak ada pekerja terikat dua pekerjaan | 0 baris |
| V6 | Setiap provider punya pekerja aktif yang bersedia ditugaskan | 0 baris |
| V7 | Tidak ada listing `ACTIVE` tanpa pekerja terpetakan | 0 baris |
| V8 | Tidak ada pendamping yang bentrok dengan order lain | 0 baris |
| V9 | Konversi sesi chat tamu jadi pendaftaran | angka |
| V10 | Usulan taksonomi yang jadi taksonomi resmi | angka |
| V11 | Tidak ada pesan dari bukan peserta order | 0 baris |
| V12 | Tidak ada listing melebihi batas FAQ | 0 baris |

### 8.4 Kebutuhan data simulasi

Data seed harus menyertakan kombinasi yang memungkinkan skenario di atas dijalankan:

- Minimal satu provider `INDIVIDUAL` (pemilik sekaligus pekerja tunggal)
- Minimal satu provider `BUSINESS` dengan **tiga pekerja** dan pemetaan listing yang tumpang tindih, untuk menguji order paralel dan perebutan
- Satu order dokumentasi acara dengan pendamping, untuk menunjukkan aturan kru
- Listing dengan 2 atribut dan listing dengan 7 atribut, untuk menunjukkan rentang Hybrid Approach
- Listing servis AC dengan `PER_UNIT` plus dua `SELECT` berbayar, sebagai kasus utama test perhitungan harga
- Koordinat client dan pekerja yang menghasilkan check-in lolos maupun gagal

---

## 9. Milestone Implementasi

Seluruh fase berstatus **belum dikerjakan**. Urutan mengikuti dependency tree, bukan urutan tabel jadwal pada usulan ide.

| Fase | Keluaran backend | Kriteria selesai |
|---|---|---|
| **0. Fondasi** | Monorepo, `prisma migrate`, `migration-constraints.sql`, health check, error handler, logger Pino, validasi env, envelope respons | Kueri verifikasi V1 sampai V12 berjalan tanpa galat, `/health` mengembalikan 200 |
| **1. Auth dan akun** | Register, login, refresh token dengan rotasi, verifikasi email, reset password, ganti email, alamat | Rotasi terbukti mencabut `family_id` saat token lama dipakai ulang. Middleware `requireEmailVerified` aktif |
| **2. Provider dan pekerja** | e-KYC, verifikasi admin, pembuatan wallet dan baris pekerja pemilik, lamaran pekerja, keanggotaan, `accepts_assignments` | Dual-role berjalan. Eksklusivitas keanggotaan terbukti lewat V6. Satu orang tidak bisa aktif di dua usaha |
| **3. Katalog** | Kategori, sub-kategori, atribut dinamis dengan `attribute_role` dan `pricing_mode`, validasi JSONB, usulan taksonomi | Sub-kategori baru beserta atribut berbayar bisa ditambah tanpa migrasi |
| **4. Listing dan pemetaan** | CRUD listing, harga opsi, foto, FAQ, pemetaan pekerja ke listing dari dua arah | Listing tanpa pekerja terpetakan tertahan di `DRAFT`, terbukti lewat V7 |
| **5. Pencarian** | Filter kategori, harga, atribut, lokasi (bounding box lalu Haversine), dan `available_now` turunan | Query plan memakai index, bukan sequential scan. `idx_worker_geo` terpakai |
| **6. Order** | `transitionOrder()`, tiga lapis pemeriksaan, seluruh endpoint transisi, penugasan, kru, klaim atomik, cron SLA, Socket.IO | 22 transisi lulus uji positif dan negatif. Dua klaim paralel menghasilkan tepat satu pemenang |
| **7. Pembayaran** | Invoice Xendit, webhook idempotent dua transaksi, ledger escrow, cron settlement | Webhook duplikat menghasilkan satu `ESCROW_HOLD`. V1 tetap 0 baris |
| **8. Uang lanjutan** | Withdrawal, payout, refund, dispute beserta bukti dan riwayat pesan | Rekonsiliasi ledger tetap 0 baris setelah seluruh skenario |
| **9. Chatbot** | Sesi tamu dan terdaftar, klaim sesi, personalisasi, structured output Gemini, rate limiting tiga lapis | Intent terekam beserta confidence dan latensi. Batas tamu terbukti menahan pemakaian berlebih |
| **10. Pelengkap** | Review, pesan dalam order, notifikasi email, laporan admin, `platform_settings` | Laporan cocok dengan data transaksi. Pesan hanya bisa dikirim peserta order |

**Kenapa pekerja masuk sedini Fase 2.** Karena hampir seluruh modul di hilirnya bergantung padanya: pemetaan listing (Fase 4), filter `available_now` (Fase 5), dan seluruh transisi pelaksanaan (Fase 6). Menundanya berarti menulis ulang tiga fase.

**Paralel sejak sekarang, jangan menunggu fase mana pun:** pengumpulan 30 sampai 50 skenario percakapan berlabel untuk mengukur akurasi intent extraction (H15). Pekerjaan ini tidak bisa dikebut di bulan kelima, dan tanpa dataset ini tidak ada angka apa pun untuk Bab IV.

---

## 10. Pertanyaan Terbuka

| # | Pertanyaan | Dampak kalau tidak diputuskan |
|---|---|---|
| 1 | **Revisi dokumen usulan ide.** Tabel Aktor Sistem sekarang empat aktor, padahal dokumen sudah ditandatangani dengan tiga | Administratif. Perlu ditanyakan ke Pembimbing 1 apakah dokumen direvisi atau cukup dijelaskan di Bab III |
| 1a | **Opsi kustom bebas oleh provider**, seperti option group di aplikasi pesan antar makanan | Ditunda, akan ditanyakan ke Pembimbing 1. Opsi buatan provider tidak bisa ikut difilter lintas penyedia, sedangkan filter lintas penyedia adalah tujuan penelitian nomor 1 |
| 1b | **Bolehkah provider membuat sub-kategori sendiri** tanpa persetujuan admin | Ditunda, akan ditanyakan ke Pembimbing 1. Saran kemiripan mengurangi duplikasi tapi tidak menghilangkannya, dan struktur atribut jadi berbeda antar provider untuk jasa yang sama |
| 2 | Nominal minimum withdrawal dan admin fee | Kolom `admin_fee` sudah ada, nilainya belum ditetapkan |
| 3 | Target angka UAT, akurasi chatbot, dan jumlah concurrent user | Bab IV butuh ambang yang disepakati sebelum pengujian, bukan sesudah |
| 4 | Dasar penetapan komisi 10 persen dan holding window 24 jam | Angka bisnis, wajar di pasaran, tetapi penguji biasanya menanyakan dasarnya. Siapkan pembanding platform sejenis |

**Sudah ditutup sejak versi 1.x:** definisi in-flight (D40), batas bayar mode Scheduled (D43), verifikasi email wajib atau tidak (D62), dan refresh token (D76).

---

## Lampiran A. Ringkasan Kode Error

### A.1 Aturan bisnis

| Kode | HTTP | Arti |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Body atau query tidak lolos validasi Zod |
| `UNAUTHORIZED` | 401 | Token tidak ada atau tidak valid |
| `EMAIL_NOT_VERIFIED` | 403 | Alamat email belum diverifikasi |
| `FORBIDDEN_ACTOR` | 403 | Aktor tidak berhak melakukan transisi |
| `NOT_ASSIGNED_WORKER` | 403 | Pemanggil bukan penanggung jawab order ini |
| `NOT_ORDER_PARTICIPANT` | 403 | Pemanggil bukan peserta percakapan order ini |
| `NOT_FOUND` | 404 | Sumber daya tidak ada atau bukan milik pemanggil |
| `ORDER_TRANSITION_NOT_ALLOWED` | 409 | Transisi tidak ada di tabel transisi |
| `ORDER_ALREADY_CLAIMED` | 409 | Order Available Now sudah diklaim pihak lain |
| `RESPONSE_DEADLINE_PASSED` | 409 | SLA respons sudah lewat |
| `PAYMENT_DEADLINE_PASSED` | 409 | Batas bayar sudah lewat |
| `WORKER_HAS_INFLIGHT_ORDER` | 409 | Pekerja sedang mengerjakan order lain |
| `WORKER_SCHEDULE_CONFLICT` | 409 | Jadwal pekerja bentrok dengan order lain |
| `WORKER_NOT_ASSIGNABLE` | 422 | Keanggotaan tidak aktif atau tidak bersedia ditugaskan |
| `WORKER_NOT_MAPPED_TO_LISTING` | 422 | Pekerja tidak terpetakan ke listing ini |
| `CREW_NOT_ALLOWED_FOR_MODE` | 422 | Pendamping hanya tersedia pada mode Scheduled |
| `PROVIDER_HAS_NO_ACTIVE_WORKER` | 409 | Provider wajib punya minimal satu pekerja aktif yang bersedia ditugaskan |
| `LISTING_HAS_NO_WORKER` | 409 | Listing tidak bisa diaktifkan tanpa pekerja terpetakan |
| `LISTING_NOT_AVAILABLE` | 409 | Listing tidak aktif atau tidak ada pekerja idle |
| `ORDER_ALREADY_PAID` | 409 | Order sudah punya pembayaran lunas |
| `MESSAGE_WINDOW_CLOSED` | 409 | Di luar masa aktif pesan dalam order |
| `DISPUTE_ALREADY_EXISTS` | 409 | Satu order hanya boleh punya satu dispute |
| `DISPUTE_WINDOW_CLOSED` | 409 | Sudah melewati `settlement_due_at` |
| `ATTRIBUTE_VALIDATION_FAILED` | 422 | Atribut listing tidak sesuai definisi sub-kategori |
| `OPTION_NOT_OFFERED` | 422 | Opsi yang dipilih tidak dilayani penyedia ini |
| `UNSUPPORTED_FILE_TYPE` | 422 | Berkas bukan JPEG, PNG, atau PDF menurut magic bytes |
| `STORAGE_UPLOAD_FAILED` | 502 | Supabase Storage gagal menerima berkas |
| `CHECKIN_OUT_OF_RADIUS` | 422 | Jarak melebihi radius toleransi |
| `VERIFICATION_CODE_INVALID` | 422 | Kode salah |
| `VERIFICATION_CODE_EXPIRED` | 422 | Kode kedaluwarsa |
| `VERIFICATION_LOCKED` | 429 | Terkunci setelah percobaan melebihi batas |
| `INSUFFICIENT_BALANCE` | 422 | Saldo available tidak cukup |
| `TOKEN_INVALID` | 422 | Token verifikasi tidak dikenali |
| `TOKEN_EXPIRED` | 422 | Token verifikasi kedaluwarsa |
| `TOKEN_ALREADY_USED` | 422 | Token verifikasi sudah dipakai |
| `TAXONOMY_REQUEST_LIMIT` | 429 | Melewati batas usulan aktif per provider |
| `GUEST_CHAT_LIMIT_REACHED` | 429 | Sesi chatbot tamu melewati batas pesan |
| `RATE_LIMIT_EXCEEDED` | 429 | Melewati batas permintaan |
| `GEMINI_UNAVAILABLE` | 502 | Gemini API gagal merespons |
| `PAYMENT_GATEWAY_ERROR` | 502 | Xendit gagal merespons |
| `EMAIL_DELIVERY_FAILED` | 502 | SMTP gagal, dicatat tapi tidak membatalkan operasi |
| `CHATBOT_TEMPORARILY_UNAVAILABLE` | 503 | Rem global harian chatbot tamu aktif |

### A.2 Lapisan infrastruktur

Tidak menyangkut aturan bisnis, dibentuk oleh middleware bersama pada Fase 0.

| Kode | HTTP | Arti |
|---|---|---|
| `INVALID_JSON` | 400 | Body bukan JSON yang sah. Masalah bentuk dibalas 400, bukan 422 |
| `PAYLOAD_TOO_LARGE` | 413 | Body melewati batas 1 MB |
| `CORS_ORIGIN_NOT_ALLOWED` | 403 | Origin tidak ada di whitelist |
| `SERVICE_UNAVAILABLE` | 503 | Dependensi wajib tidak dapat dihubungi. Dipakai `GET /health` saat basis data mati |
| `INTERNAL_ERROR` | 500 | Error tidak tertangani. Pesan ke client selalu generik, stack trace hanya masuk log Pino |

---

## Lampiran B. Riwayat Revisi

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 18 September 2026 | Versi awal. Disusun dari register keputusan D1 sampai D30, state machine order, dan skema basis data 25 tabel |
| 1.1 | 18 September 2026 | Definisi in-flight (H4) difinalkan menjadi predikat gabungan status dan mode |
| 1.2 | 18 September 2026 | Lampiran kode error lapisan infrastruktur ditambahkan |
| 2.1 | 30 September 2026 | Pola unggah berkas dipisah per sifat (D80). Dokumen e-KYC dan bukti dispute jadi multipart lewat API dengan validasi magic bytes, foto listing tetap signed URL. Kontrak dua endpoint unggah ditambahkan di Bagian 4.4, cron pembersih berkas yatim, tiga parameter sistem, aturan mengikat nomor 13 |
| **2.0** | **30 September 2026** | **Tulis ulang penuh.** Menyesuaikan D31 sampai D79: tenaga kerja sebagai entitas dengan akun sendiri, pemetaan pekerja ke listing, penerimaan order per mode dengan klaim atomik, kru order, atribut berbayar dan penamaan nominal baru, usulan taksonomi, notifikasi email dan verifikasi akun, refresh token, chatbot tamu, FAQ listing, serta pesan dalam order. Skema jadi 34 tabel dan 35 enum. Tujuan bertambah jadi tujuh dengan masuknya O5 penugasan tenaga kerja. Seluruh milestone direset ke belum dikerjakan |
