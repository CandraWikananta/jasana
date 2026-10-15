# Register Keputusan Desain Sistem

**Tugas Akhir:** Rancang Bangun Platform Marketplace Jasa On-Demand Berbasis Web yang Terintegrasi dengan Kecerdasan Buatan
**Nama sistem:** Jasana
**Penyusun:** I Nyoman Gede Candra Wikananta (2305551065)
**Bidang Keahlian:** Sistem Informasi, Teknologi Informasi, Universitas Udayana
**Versi:** 2.8
**Terakhir diperbarui:** 15 Oktober 2026 (versi 2.8)
**Tahap saat ini:** Implementasi backend. Fase 0 dan Fase 1 selesai, Fase 2 sedang berjalan

---

## 1. Ringkasan Status

| Kategori | Jumlah keputusan | Terbuka |
|---|---|---|
| Administratif dan metodologi (A) | 7 | 0 |
| Technology stack (S) | 12 | 0 |
| Arsitektur dan model data (D1 sampai D30) | 30 | 0 |
| Tenaga kerja (D31 sampai D49) | 19 | 0 |
| Pemetaan, penerimaan order, dan notifikasi (D50 sampai D64) | 15 | 0 |
| Presence, kru order, dan cakupan contoh jasa (D65 sampai D71) | 7 | 0 |
| Harga bertingkat dan usulan taksonomi (D72 sampai D74) | 3 | 0 |
| Batas cakupan satu order (D75) | 1 | 0 |
| Sesi login dan chatbot tamu (D76 sampai D77) | 2 | 0 |
| Komunikasi pra-order dan dalam order (D78 sampai D79) | 2 | 0 |
| Pola unggah berkas (D80) | 1 | 0 |
| Penutupan keputusan terbuka (D81 sampai D86) | 6 | 0 |

**Perubahan pada versi 2.8:**

1. Seluruh keputusan terbuka ditutup. Tidak ada lagi pertanyaan yang menggantung
2. Dokumen usulan ide tidak direvisi, perubahan sistem dijelaskan di laporan (A7)
3. Opsi kustom bebas dan sub-kategori buatan provider ditolak, dikukuhkan Pembimbing 1 pada bimbingan 30 September 2026 (D81, D82)
4. Biaya metode pembayaran payment gateway ditanggung platform dari komisi, ditulis sebagai batasan (D83)
5. Minimum withdrawal Rp50.000 dan admin fee flat Rp6.500 (D84)
6. Target pengujian UAT, akurasi chatbot, beban normal, dan stress ditetapkan (D85)
7. Dasar komisi 10 persen dan holding window 24 jam dicatat (D86)
8. Perapian: status artefak, langkah berikutnya, rujukan silang yang keliru, dan urutan riwayat revisi
9. Rumusan D25 diperjelas: dispute boleh dibuka sejak ARRIVED, menyamakan dengan state machine
10. Seluruh artefak lain disinkronkan ke versi ini (lihat tabel status artefak)

**Perubahan pada versi 2.7:**

1. Pola unggah berkas dipisah berdasarkan sifatnya: dokumen e-KYC dan bukti dispute lewat multipart ke API supaya bisa divalidasi server, foto listing tetap signed URL langsung ke Storage
2. Celah berkas yatim pada jalur signed URL ditutup

**Perubahan pada versi 2.6:**

1. FAQ per listing, provider menulis tanya jawab di muka
2. Pesan dalam order antara client dan penyedia, terbatas per order dan punya masa aktif
3. Percakapan pra-order **ditolak** dengan alasan yang dicatat, karena menggeser posisi platform ke model quotation yang sudah ditolak D23

**Perubahan pada versi 2.5:**

1. Refresh token dengan rotasi dan deteksi pemakaian ulang, menutup keputusan terbuka nomor 3
2. Chatbot bisa dipakai sebelum punya akun, dua tingkat: tamu dan sudah login. Merevisi D26, berasal dari arahan Pembimbing 1

**Perubahan pada versi 2.4:**

1. Tiga batas cakupan order ditetapkan: seluruh jasa dikerjakan di lokasi client, satu order sama dengan satu kedatangan, dan penyerahan hasil digital berada di luar cakupan escrow
2. Definisi atribut dua belas sub-kategori **selesai seluruhnya**, lihat Lampiran B

**Perubahan pada versi 2.3:**

1. Atribut dinamis bisa memengaruhi harga. Atribut dibedakan jadi SPEC (diisi provider) dan OPTION (dipilih client, punya delta harga)
2. Penamaan kolom nominal order diperjelas: `base_price` jadi `listing_base_amount`, ditambah `options_amount`
3. Provider bisa mengusulkan penambahan taksonomi ke admin dalam tiga jenis: sub-kategori baru, atribut baru, dan option baru
4. Definisi atribut untuk kategori Otomotif ditetapkan

**Perubahan pada versi 2.2:**

1. Presence pekerja diturunkan dari koneksi Socket.IO, bukan dari umur koordinat. Lokasi dikirim berdasarkan perpindahan, bukan interval tetap (merevisi D57)
2. Aturan perubahan definisi atribut dinamis oleh admin setelah ada listing yang memakainya
3. Satu penanggung jawab per order, ditambah pencatatan pekerja pendamping lewat tabel `order_crew`, khusus mode Scheduled
4. Order Available Now boleh diterima pemilik maupun pekerja, siapa duluan dia yang menentukan (merevisi D54)
5. Cakupan contoh jasa ditetapkan: 4 kategori, 12 sub-kategori, seluruhnya jasa yang dikerjakan di lokasi client

**Perubahan pada versi 2.1:**

1. Pemetaan pekerja ke listing lewat tabel `worker_listings`, supaya sistem tahu siapa bisa mengerjakan jasa apa
2. Penerimaan order dipisah per mode, dengan pola siapa cepat dia dapat untuk Available Now
3. Notifikasi email, verifikasi akun, dan penggantian alamat email lewat tabel `verification_tokens`

**Catatan waktu revisi.** Revisi besar versi 2.1 sampai 2.7 dilakukan saat Fase 0 (fondasi monorepo, migrasi, health check, error handler, logger, validasi env) baru selesai dan Fase 1 belum dimulai, sehingga tidak ada kode logika bisnis yang perlu dibongkar. Versi 2.8 tidak mengubah skema.

**Dampak kumulatif terhadap skema:** dari 25 tabel dan 26 enum menjadi **34 tabel dan 35 enum**.

**Status artefak per versi 2.8 (seluruhnya sinkron per 15 Oktober 2026):**

| Artefak | Versi | Perubahan karena versi 2.8 |
|---|---|---|
| `skema-database-final.dbml` | 2.8 | Dua parameter withdrawal, note `withdrawals.amount` dan `admin_fee`, rujukan D70, D81, dan D82. Struktur tidak berubah |
| `schema.prisma` | 2.8 | Komentar saja: daftar parameter ditulis dalam snake_case sesuai key yang dibaca kode, dua parameter withdrawal, rujukan D70, D81, D82, dan D84 |
| `migration-constraints.sql` | 2.6 | Tidak terdampak |
| `Panduan-Struktur-Database.md` | 2.8 | Parameter withdrawal, lima pertanyaan sidang baru, judul tabel ringkasan perubahan |
| `State-Machine-Order.md` | 2.6 | Tidak terdampak. Sudah memakai ARRIVED sebagai batas bawah dispute, yang kini jadi rumusan D25 |
| `PRD-Backend.md` | 2.2 | Bagian 1.3, 1.4, 3.5, kontrak withdrawal, 6.2, 8, 9, 10, kode error `WITHDRAWAL_BELOW_MINIMUM` |
| `CLAUDE.md` | | Rujukan D1 sampai D86, aturan withdrawal di jebakan nomor 4, dua butir di luar cakupan |
| Usulan ide (Tabel Aktor Sistem) | | Tidak direvisi (A7) |

---|---|
| `skema-database-final.dbml` | Sinkron versi 2.7. Perlu tambahan kecil dari D84: dua parameter withdrawal di catatan `platform_settings` dan note kolom `withdrawals.admin_fee` |
| `schema.prisma` | Sinkron versi 2.7, tidak terdampak versi 2.8 |
| `migration-constraints.sql` | Sinkron versi 2.7, tidak terdampak versi 2.8 |
| `Panduan-Struktur-Database.md` | Sinkron versi 2.7 |
| `State-Machine-Order.md` | Sinkron versi 2.6, tidak terdampak versi 2.8 |
| `PRD-Backend.md` | Versi 2.1. Perlu sinkron dengan D81 sampai D86: Bagian 1.3 (O6), 6.2, 8, 10, dan daftar parameter |
| Usulan ide (Tabel Aktor Sistem) | Tidak direvisi (A7) |

---

## 2. Keputusan Final (Versi 1.0)

### 2.1 Administratif dan Metodologi

| # | Keputusan | Catatan |
|---|---|---|
| A1 | Judul final: "Rancang Bangun Platform Marketplace Jasa On-Demand Berbasis Web yang Terintegrasi dengan Kecerdasan Buatan" | Sudah diterima di seminar ide |
| A2 | Pembimbing 1: Dr. Ir. Ni Kadek Ayu Wirdiani, S.T., M.T., IPU | Pengusul fitur AI service discovery chatbot dan pengusul penambahan tenaga kerja |
| A3 | Pembimbing 2: Dr. Ir. Anak Agung Kompiang Oka Sudana, S.Kom., M.T., IPM | Ditugaskan di seminar ide |
| A4 | Metode pengembangan: Waterfall | Sistematis dan berurutan, cocok untuk cakupan yang terdefinisi di awal |
| A5 | Metode pengujian: Black Box, UAT (skala Likert), Stress Testing | Sesuai tujuan penelitian nomor 6. Target angkanya di D85 |
| A6 | Rentang waktu: 6 bulan, pengembangan modul per bulan | Sesuai Tabel 3 usulan ide |
| A7 | **Dokumen usulan ide tidak direvisi.** Perubahan sistem sejak usulan, termasuk aktor yang menjadi empat (client, provider, pekerja, admin), dijelaskan di laporan, terutama Bab III | Usulan ide berfungsi menentukan kelayakan ide sebagai tugas akhir dan sudah disetujui. Apa pun yang berhubungan dengan usulan ide dibiarkan. Menutup keputusan terbuka nomor 1 (versi 2.8) |

### 2.2 Technology Stack

| # | Komponen | Pilihan | Alasan |
|---|---|---|---|
| S1 | Frontend | Next.js (React) + TypeScript + Tailwind CSS | |
| S2 | Backend | Express.js + TypeScript, REST API | Efisiensi sumber daya untuk beban RESTful API (Hadinata & Stianingsih, 2024) |
| S3 | Basis data | PostgreSQL via Supabase | JSONB dan index GIN dibutuhkan Hybrid Approach |
| S4 | ORM | Prisma | |
| S5 | Real-time | Socket.IO | Mode Available Now dan notifikasi status order |
| S6 | Payment gateway | Xendit (Invoice, Refund, Payout API) | |
| S7 | Peta | Leaflet.js + OpenStreetMap | Tanpa biaya lisensi |
| S8 | LLM | Gemini API | Arahan Pembimbing 1 |
| S9 | Penyimpanan berkas | Supabase Storage | Dokumen e-KYC dan foto listing |
| S10 | Autentikasi | JWT + bcrypt | |
| S11 | Struktur repository | Monorepo: `apps/web`, `apps/api`, `packages/database`, `packages/shared` | Tipe hasil generate Prisma bisa diimpor kedua aplikasi |
| S12 | Pengiriman email | Layanan SMTP pihak ketiga dengan kuota gratis | **Baru di versi 2.1.** Jangan memakai akun Gmail pribadi lewat SMTP, deliverability-nya buruk dan gampang diblokir saat pengujian beban |

Tidak memakai Redis. Rate limiting in-memory dan cache sub-kategori dengan TTL 5 menit, berlaku selama API berjalan sebagai satu instance. Ditulis sebagai batasan, bukan celah yang tidak disadari.

### 2.3 Arsitektur dan Model Data

| # | Keputusan | Alasan / konsekuensi |
|---|---|---|
| D1 | Pola three-tier: frontend, backend REST API, basis data | |
| D2 | Hybrid Approach dengan 2-level hierarchy: `categories` > `subcategories` > atribut dinamis JSONB | Memenuhi tujuan penelitian nomor 1 |
| D3 | Atribut dinamis di `listings.attributes` (JSONB), divalidasi terhadap `subcategory_attributes` | Tanpa tabel definisi, JSONB jadi liar dan filter tidak bisa jalan |
| D4 | PROVIDER bukan role. Provider adalah user yang punya `provider_profiles` berstatus VERIFIED | Konsekuensi konsep dual-role |
| D5 | Haversine untuk validasi kedatangan, radius toleransi 100 meter | Memenuhi tujuan penelitian nomor 3 |
| D6 | Query lokasi wajib bounding box dulu, baru Haversine presisi | Kalau langsung Haversine, index tidak terpakai |
| D7 | Kode verifikasi 6 digit sebagai bukti penyelesaian pekerjaan | |
| D8 | Escrow di lapisan aplikasi, hanya pembayaran non-tunai | Batasan ruang lingkup penelitian |
| D9 | SLA: 5 menit penerimaan order (Available Now), 24 jam approval (Scheduled) | |
| D10 | Harga, judul listing, dan atribut di-snapshot ke `orders` saat pemesanan | Perubahan harga besok tidak boleh mengubah order kemarin |
| D11 | Deadline SLA disimpan sebagai kolom, bukan timer memori. Cron melakukan sweep | Timer memori hilang saat server restart |
| D12 | Wallet punya dua saldo: `balance_available` dan `balance_pending` | Provider bisa melihat dana yang sedang ditahan escrow |
| D13 | `wallet_transactions` adalah ledger append-only, model delta dua kolom | Satu event ESCROW_RELEASE mengubah dua saldo sekaligus |
| D14 | Kolom saldo di `wallets` adalah cache yang selalu bisa direkonsiliasi dari ledger | Invariant yang diuji di kueri verifikasi V1 |
| D15 | Saldo didebit saat withdrawal diajukan, bukan saat COMPLETED | Mencegah pengajuan berkali-kali melebihi saldo |
| D16 | Webhook idempotent lewat `event_id` yang disusun sendiri (`invoice:<id>:<status>`) | Xendit tidak menyediakan header webhook id dan retry sampai 6 kali |
| D17 | Pengambilan lock webhook pakai UPDATE bersyarat atomik | Pola baca-lalu-cek punya race condition |
| D18 | Status internal withdrawal dipisah dari status mentah Xendit | Kata REQUESTED punya arti berbeda di kedua sistem |
| D19 | Alur order: provider accept dulu, baru client bayar (kedua mode) | Kalau dibalik, setiap order yang tidak diterima harus di-refund |
| D20 | Status COMPLETED dan SETTLED dipisah | Jaraknya adalah holding window, ruang hidup fitur dispute |
| D21 | Kebijakan delete: `restrict` untuk relasi yang menyentuh order dan uang, `cascade` hanya untuk data turunan murni | Data transaksi tidak boleh ikut terhapus |
| D22 | Soft delete pada `listings` (`deleted_at`) | Listing yang pernah dipesan tidak boleh hilang |

### 2.4 Keputusan Bisnis Inti (eks T1 sampai T6)

| # | Keputusan | Alasan |
|---|---|---|
| D23 | **Mode Available Now: DIRECT.** Client memilih listing milik satu penyedia, bukan menyebar permintaan ke banyak penyedia | Konsisten dengan model direct browse-and-book di usulan ide. Tidak perlu tabel `order_offers`. **Catatan versi 2.1:** penawaran internal ke beberapa pekerja dalam satu usaha (D55) tidak melanggar keputusan ini, karena penyedianya sudah dipilih client lebih dulu |
| D24 | **Holding window 24 jam** antara COMPLETED dan SETTLED, disimpan sebagai `settlement_holding_hours` | Kalau instan, provider bisa withdraw dalam hitungan menit dan platform menanggung refund dari kantong sendiri. Dasar angkanya di D86 |
| D25 | **Batas akhir komplain sama dengan akhir holding window**, yaitu `settlement_due_at`. **Diperjelas pada versi 2.8:** dispute boleh dibuka sejak order berstatus ARRIVED (transisi T13, T15, T17, dan T19 di `State-Machine-Order.md`), bukan hanya saat COMPLETED | Aturan tunggal untuk batas akhir, satu pengecekan di kode. Batas bawahnya ARRIVED karena sebelum pekerja tiba, masalah masih bisa diselesaikan lewat pembatalan biasa. Rumusan lama "hanya selama COMPLETED" tidak sesuai dengan state machine, DBML, PRD, dan Panduan Struktur Database yang sudah memakai ARRIVED sejak versi 2.x |
| D26 | **Chatbot wajib login.** `chat_sessions.user_id` NOT NULL. **Direvisi oleh D77:** chatbot terbuka untuk tamu dengan personalisasi dinonaktifkan, atas arahan Pembimbing 1 | Personalisasi menuntut identitas. Rekomendasi berbasis lokasi butuh `user_addresses`, biaya Gemini butuh rate limiting berbasis identitas |
| D27 | **Empat sumber personalisasi** dirangkum ke `chat_sessions.personalization_snapshot` | Riwayat kategori, alamat default, rata-rata rating yang diberikan, rentang harga order sebelumnya |
| D28 | **Platform fee = komisi dari provider, 10 persen.** Client membayar harga listing apa adanya | Client tidak melihat biaya tersembunyi. Biaya metode pembayaran ditanggung platform dari komisi (D83), dasar angkanya di D86 |
| D29 | **Platform fee dikembalikan penuh** saat refund akibat kesalahan provider | Paling mudah dipertahankan secara etis di sidang |
| D30 | **Kode verifikasi dienkripsi AES (reversible)**, bukan di-hash | Client harus bisa melihat kodenya berulang kali. Yang melindungi uang adalah lockout, bukan enkripsinya |

**Rumus nominal order (versi 1.0, direvisi oleh D73 di Bagian 4B.1):**

```
base_price       = harga listing saat dipesan     contoh: 100.000
total_amount     = base_price                             100.000   (dibayar client)
platform_fee     = base_price * 10 persen                  10.000
provider_earning = base_price - platform_fee               90.000
```

Fee tidak dipungut sebagai transaksi terpisah. Saat ESCROW_HOLD, yang masuk ke `balance_pending` hanya `provider_earning`, sehingga selisihnya otomatis tertinggal sebagai pendapatan platform di akun Xendit.

---

## 3. Keputusan Tenaga Kerja (D31 sampai D49)

Sumber: bimbingan online dengan Pembimbing 1 tanggal 18 September 2026, dilanjutkan klarifikasi lewat Telegram pada tanggal yang sama.

**Arahan asli Pembimbing 1:** rancangan lama tidak bisa mengakomodasi provider yang punya banyak tenaga kerja. Model seperti Gojek mengontrak driver sebagai individu sehingga akun melekat ke orangnya, bukan ke perusahaannya. Akun pekerja perlu dipisahkan dari akun provider.

**Tiga jawaban lanjutan yang sudah dikonfirmasi beliau:**

1. Pemilik ikut didaftarkan sebagai pekerja di usahanya sendiri
2. e-KYC cukup di tingkat usaha, tidak perlu per pekerja
3. Status ketersediaan dan lokasi real-time menyesuaikan pekerja

### 3.1 Model Dasar

| # | Keputusan | Alasan |
|---|---|---|
| D31 | **Tenaga kerja jadi entitas dengan akun sendiri**, tabel baru `provider_workers`. Order selalu dikerjakan pekerja, tidak pernah oleh akun provider secara langsung | Arahan Pembimbing 1. Provider jadi entitas usaha yang mengelola, pekerja jadi entitas yang bergerak ke lokasi |
| D32 | **Model tunggal, bukan dua alur.** Freelancer adalah kasus khusus dari usaha, yaitu usaha dengan satu pekerja yang kebetulan pemiliknya sendiri. Dibedakan hanya lewat kolom `provider_type` (INDIVIDUAL atau BUSINESS) | Variasi diserap sebagai data, bukan sebagai struktur atau alur baru. Sejalan dengan prinsip Hybrid Approach yang sudah dipakai di katalog. Dua alur terpisah berarti dua versi check-in, dua versi matching, dan dua versi penyelesaian order yang harus ditulis dan diuji |
| D33 | **Pemilik otomatis terdaftar sebagai pekerja** (`is_owner = true`) saat admin menyetujui e-KYC provider. Tombol lamar hanya muncul untuk orang luar yang ingin bergabung ke usaha orang lain | Kalau lewat apply, freelancer harus melamar ke usahanya sendiri, dan itu janggal saat ditanya penguji |
| D34 | **e-KYC hanya di tingkat usaha.** Pekerja divalidasi oleh pemilik provider, bukan oleh admin platform | Arahan Pembimbing 1. Ditulis eksplisit sebagai batasan penelitian: platform memverifikasi usaha, usaha bertanggung jawab atas pekerjanya |
| D35 | **WORKER bukan nilai enum `role`.** Pekerja didefinisikan sebagai user yang punya baris berstatus ACTIVE di `provider_workers` | Konsisten dengan D4. Satu orang bisa jadi client sekaligus pekerja di usaha orang lain |

### 3.2 Keanggotaan Pekerja

| # | Keputusan | Alasan |
|---|---|---|
| D36 | **Satu orang hanya boleh punya satu keanggotaan aktif.** Ditegakkan partial unique index pada `user_id` dengan predikat `membership_status = 'ACTIVE'` | Kalau boleh lintas usaha, `is_available` jadi ambigu: orang yang sama bisa idle di usaha A padahal sedang dikirim oleh usaha B. Lebih berat lagi, kunci in-flight pecah karena index mengunci per baris pekerja, bukan per orang. Menutupnya butuh denormalisasi atau trigger, dua-duanya menambah materi sidang tanpa menambah kontribusi penelitian. Multi-provider masuk saran pengembangan di Bab V |
| D37 | **Status keanggotaan berupa enum**, bukan boolean: PENDING, ACTIVE, REJECTED, RESIGNED | Pelamar bukan anggota aktif, tapi juga bukan tidak ada. Efek sampingnya bagus: orang boleh melamar ke beberapa usaha sekaligus, dan begitu satu menerima, lamaran lain otomatis gugur karena bertabrakan dengan index D36 |
| D38 | **Status ketersediaan dan lokasi real-time pindah** dari `provider_profiles` ke `provider_workers` | Yang bergerak adalah pekerja. `service_radius_km` tetap di `provider_profiles` karena itu kebijakan usaha, bukan per orang |
| D39 | **`accepts_assignments` dipisah dari `is_available`.** Yang pertama menandai pekerja bersedia turun ke lapangan sama sekali, yang kedua adalah toggle online harian untuk mode Available Now. Setiap provider wajib punya minimal satu pekerja ACTIVE dengan `accepts_assignments = true` | Penugasan Scheduled tidak melihat `is_available`, dia melihat bentrok jadwal. Kalau pemilik yang cuma mengelola hanya mematikan `is_available`, dia tetap muncul di dropdown penugasan Scheduled. Aturan minimal satu pekerja juga mencegah usaha kosong yang listing-nya masih tayang tapi tidak ada yang bisa dikirim |

**Konsekuensi yang disadari dari D33 dan D36:** pemilik usaha tidak bisa sekaligus jadi pekerja di usaha orang lain, dan pekerja yang ingin membuka usaha sendiri harus mengundurkan diri lebih dulu. Ini benar secara konsep, bukan batasan yang mengganggu: orang yang mengelola usahanya sendiri tidak seharusnya bisa ditugaskan ke lokasi oleh usaha lain pada jam yang sama. Ditulis satu baris di batasan penelitian, dan error yang keluar harus menjelaskan sebabnya, bukan sekadar 409.

### 3.3 Penugasan dan Penguncian

| # | Keputusan | Alasan |
|---|---|---|
| D40 | **Kunci in-flight pindah dari level provider ke level pekerja.** `uniq_inflight_order_per_provider` diganti `uniq_inflight_order_per_worker`, predikat statusnya tetap sama persis | Usaha dengan lima pekerja memang harus bisa memegang lima order paralel. Kalau index lama dibiarkan, fitur yang diminta Pembimbing 1 justru diblokir oleh constraint sendiri. Kode error `PROVIDER_HAS_INFLIGHT_ORDER` jadi `WORKER_HAS_INFLIGHT_ORDER` |
| D41 | **Dua jenis penguncian dipisah.** Kunci in-flight ditegakkan database lewat partial unique index. Kunci jadwal ditegakkan service layer lewat pemeriksaan tumpang tindih rentang waktu | Keduanya menyangkut pekerja tapi artinya berbeda. Yang dikunci pada mode Scheduled bukan tanggal dan bukan orangnya, melainkan rentang waktu. Pekerja yang punya jadwal 12 September tetap boleh menerima pekerjaan 8 September |
| D42 | **Penugasan pekerja dilakukan saat ACCEPT, bukan setelah pembayaran.** Berlaku untuk kedua mode | Accept adalah janji ketersediaan. Kalau assign ditunda sampai setelah bayar, provider bisa menerima lima order untuk jam yang sama padahal hanya punya tiga pekerja, dan dua di antaranya harus dibatalkan setelah uang masuk escrow. Itu persis beban refund yang D19 dirancang untuk dihindari |
| D43 | **Slot dikunci dua tingkat.** Tentatif saat ACCEPTED (label "menunggu pembayaran", lepas otomatis saat PAYMENT_EXPIRED atau CANCELLED), pasti saat PAID (label "terjadwal") | Keduanya memblokir accept order lain di rentang yang sama, jadi tidak ada double booking. Bedanya hanya label dan apakah bisa lepas sendiri, sehingga tidak ada slot yang tersandera selamanya oleh order yang tidak dibayar. Keputusan ini sekaligus menutup pertanyaan terbuka nomor 1 pada PRD |
| D44 | **Pemilik boleh mengganti pekerja yang ditugaskan** selama status order belum ON_THE_WAY, asal pengganti terpetakan ke listing itu dan bebas di rentang waktunya. Perubahan dicatat di `order_status_histories` | Fleksibilitas pemilik tetap ada, cuma pindah dari "menunda keputusan" jadi "boleh mengubah keputusan". Realistis karena pekerja bisa sakit mendadak |
| D45 | **`listings.is_available_now` dibuang.** Status online jadi turunan: listing bisa dipesan mendadak kalau punya minimal satu pekerja **terpetakan** yang `is_available = true`, presence-nya belum basi, dan tidak sedang in-flight. `listings.supports_available_now` tetap sebagai kapabilitas | Kalau kolom dan pekerja sama-sama menyimpan ketersediaan, ada dua sumber kebenaran dan pasti bentrok. Konsekuensinya filter `available_now=true` pada `GET /listings` jadi join ke `worker_listings` dan `provider_workers`, dan `idx_worker_geo` wajib ada sebelum stress testing |

**Rumus pemeriksaan bentrok jadwal (D41):**

```
tolak kalau ada order SCHEDULED milik pekerja yang sama dengan rentang
[scheduled_at, scheduled_at + snapshot_duration_minutes + buffer)
yang beririsan dengan rentang order baru
```

Buffer 30 sampai 60 menit untuk perjalanan antar lokasi. Kolom `snapshot_duration_minutes` yang sudah ada di `orders` inilah pemakainya.

**Kasus silang antar mode:** pekerja punya jadwal pukul 14.00, lalu pukul 13.00 masuk order Available Now. Guard yang sudah ada di PRD tetap berlaku, tolak Available Now kalau ada order Scheduled berstatus PAID yang jatuh dalam rentang `now + durasi + 30 menit`, hanya subjeknya dipindah dari provider ke pekerja.

### 3.4 Tipe Usaha, Uang, dan Reputasi

| # | Keputusan | Alasan |
|---|---|---|
| D46 | **`provider_type` dipilih saat apply**, bukan setting bebas di dashboard. Pilihan tipe ada di langkah pertama form dan menentukan dokumen apa yang diminta: INDIVIDUAL cukup KTP dan selfie, BUSINESS perlu tambahan NPWP atau izin usaha | Kalau bisa diganti sendiri dari settings, seseorang bisa lolos verifikasi sebagai INDIVIDUAL lalu menaikkan diri jadi BUSINESS tanpa pernah menyerahkan dokumen usaha. Itu lubang verifikasi yang mudah ditanyakan penguji |
| D47 | **Perubahan tipe diperlakukan sebagai pengajuan.** Naik ke BUSINESS butuh unggah dokumen usaha dan persetujuan admin, turun ke INDIVIDUAL boleh langsung asal hanya tersisa satu pekerja aktif. `verification_status` tidak pernah dikembalikan ke PENDING, pengajuan ditampung di kolom `requested_provider_type` | Kalau status verifikasi direset, listing yang sedang tayang ikut mati dan order berjalan jadi kacau. Usaha harus tetap beroperasi selama pengajuan diproses. Pemicunya bisa otomatis: begitu pemilik INDIVIDUAL menekan tambah pekerja, sistem mengarahkan ke form pengajuan |
| D48 | **Wallet dan withdrawal tetap milik provider.** Pekerja tidak punya dompet, penggajian di luar cakupan sistem | Tanggung jawab hukum dan finansial ada pada usaha. Ini juga menjaga alur dana tetap sesederhana rancangan lama |
| D49 | **Rating tetap jatuh ke `provider_profile_id`**, bukan ke pekerja. `assigned_worker_id` disimpan di order sebagai jejak audit, termasuk saat dispute | Reputasi yang dilihat client di listing adalah reputasi usaha. Kalau rating per pekerja, client harus memilih pekerja saat memesan, dan itu mengubah alur pemesanan jauh lebih dalam dari yang diminta Pembimbing 1. Pertanyaan ini besar kemungkinan muncul di sidang |

---

## 4. Keputusan Versi 2.1 (D50 sampai D64)

### 4.1 Pemetaan Pekerja ke Listing

| # | Keputusan | Alasan |
|---|---|---|
| D50 | **Tabel penghubung `worker_listings`**, relasi banyak ke banyak. Satu pekerja boleh dipetakan ke beberapa listing, satu listing boleh punya beberapa pekerja | Satu provider boleh punya banyak listing yang jenisnya berbeda, misalnya cuci mobil dan fotografi. Tanpa pemetaan, pencocokan Available Now bisa mengirim fotografer untuk mencuci mobil |
| D51 | **Pemetaan di level listing, bukan sub-kategori** | Yang dipesan client adalah listing, jadi pertanyaannya "bisakah orang ini mengerjakan listing ini". Pemetaan ke sub-kategori terlalu kasar: seseorang bisa sanggup foto produk tapi tidak sanggup prewedding 8 jam, padahal dua-duanya sub-kategori fotografi |
| D52 | **Pilihan pelamar bersifat usulan, pemilik yang mengesahkan.** Baris `worker_listings` dibuat sejak pelamar mencentang, tapi baru berlaku ketika `membership_status = 'ACTIVE'` | Konsisten dengan D34. Pemetaan adalah klaim kemampuan, dan yang bertanggung jawab atas pekerjanya adalah pemilik usaha. Kalau pelamar bisa menetapkan sendiri, siapa pun bisa mendeklarasikan diri fotografer tanpa ada yang memverifikasi. Tidak perlu kolom status tambahan karena semua kueri pencocokan sudah menyaring dengan predikat keanggotaan |
| D53 | **Listing tanpa satu pun pekerja terpetakan tidak boleh dipublikasikan**, statusnya tertahan di DRAFT. Untuk provider INDIVIDUAL pemetaan dibuat otomatis saat listing dibuat | Sejajar dengan D39. Sistem tidak pernah menayangkan jasa yang tidak ada orangnya |

**Alur antarmuka pemetaan:**

```
Dari sisi pelamar (halaman publik profil provider):
  Tombol "Lamar jadi pekerja di sini" muncul hanya untuk user login
  yang belum punya keanggotaan aktif.
  Form berisi tiga bagian:
    - daftar centang listing aktif milik provider itu   (minimal satu wajib)
    - pengalaman, berupa teks bebas
    - unggah dokumen pendukung yang diminta usaha

Dari sisi pemilik (halaman Pekerja, dua tab: Pelamar dan Aktif):
  Kartu pelamar menampilkan daftar centang tadi.
  Pemilik boleh menambah atau mencoret sebelum menyetujui.
  Pemetaan pekerja aktif tetap bisa diubah kapan saja.

Dari sisi listing (form buat atau ubah listing):
  Bagian "Siapa yang bisa mengerjakan", berisi daftar centang pekerja aktif.
  Menulis ke tabel yang sama, jadi pemetaan bisa diatur dari dua arah.

Provider INDIVIDUAL tidak pernah melihat satu pun antarmuka di atas.
```

### 4.2 Penerimaan Order per Mode

| # | Keputusan | Alasan |
|---|---|---|
| D54 | **Penerima order berbeda per mode.** Available Now diterima **pekerja** yang sedang online, Scheduled diterima **pemilik** provider. **Direvisi oleh D70:** pemilik juga boleh menerima order Available Now, siapa duluan dia yang menentukan | SLA 5 menit tidak masuk akal kalau yang harus merespons adalah orang yang tidak sedang memegang laptop. Pemilik usaha cuci mobil dengan lima kru tidak mungkin memantau dashboard sepanjang hari. Sebaliknya, menerima order Scheduled berarti mengunci slot masa depan dan memilih di antara beberapa pekerja, itu keputusan manajerial. Untuk provider INDIVIDUAL keduanya orang yang sama |
| D55 | **Available Now memakai pola siapa cepat dia dapat.** Order ditawarkan ke maksimal `available_now_offer_limit` pekerja yang memenuhi syarat, diurutkan dari yang terdekat. Yang pertama menerima yang mendapat order | Mengandalkan satu orang merespons dalam 5 menit itu rapuh. Kalau yang terdekat sedang memegang selang air, order hangus padahal ada rekannya yang menganggur. Penawarannya terbatas pada pekerja di satu usaha yang sudah dipilih client, jadi ini bukan broadcast lintas penyedia dan D23 tetap utuh |
| D56 | **Tidak ada pelemparan berantai.** Kalau semua yang ditawari menolak atau 5 menit lewat, order langsung EXPIRED dan client memilih ulang | Pelemparan berantai adalah model broadcast yang sudah ditolak di D23, dan begitu masuk akan menyeret deadline total versus deadline per pekerja, urutan pelemparan, serta penanganan kalau semua menolak. Masuk saran pengembangan di Bab V |
| D57 | **Toggle Available Now ada di dashboard pekerja**, dengan syarat `accepts_assignments = true` dan izin geolokasi browser diberikan. **Direvisi oleh D65:** penanda online diambil dari koneksi Socket.IO, bukan dari umur koordinat | Tanpa aturan presence basi, sistem akan menawarkan order ke orang yang sudah menutup tab dan pulang. Predikat ini dipakai di pencocokan dan di rumus D45, ditambah cron kecil yang mematikan toggle supaya tampilan dashboard jujur |

**Alur Available Now yang direvisi:**

```
1. Client memilih listing yang sedang bisa dipesan mendadak (D45)

2. Sistem menyusun daftar penerima:
   - terpetakan ke listing itu                        (D50)
   - membership_status = ACTIVE
   - accepts_assignments = true dan is_available = true
   - presence belum basi                              (D57)
   - tidak sedang in-flight                           (D40)
   - tidak punya jadwal Scheduled yang bentrok        (D41)
   diurutkan dari yang terdekat, diambil maksimal 5   (D55)

3. Order dibuat dengan assigned_worker_id MASIH KOSONG
   -> status PENDING_ACCEPTANCE, SLA 5 menit
   -> notifikasi Socket.IO ke seluruh penerima
   -> SEKALIGUS muncul di dashboard pemilik                   (D70)

4. Yang pertama berhasil yang mendapat order, entah pekerja
   yang mengklaim untuk dirinya sendiri, atau pemilik yang
   menerima sambil memilih pekerja dari daftar penerima tawaran
   yang sama. Klaimnya memakai UPDATE bersyarat atomik, pola
   yang sama dengan pengambilan lock webhook di D17.
   accepted_by mencatat siapa yang menekan tombol, dan bisa
   berbeda dari assigned_worker_id.

5. Yang kalah menerima 409 ORDER_ALREADY_CLAIMED, dan
   kartunya dihapus dari layar lewat event Socket.IO, termasuk
   dari dashboard pemilik, supaya tidak ada yang menekan tombol
   lalu dapat error.
   Yang kalah tidak kena catatan apa pun dan toggle-nya
   tetap menyala.

6. Kalau tidak ada yang merespons sampai 5 menit lewat:
   -> status EXPIRED
   -> SLA miss dicatat untuk semua yang ditawari
   -> toggle Available Now mereka dimatikan

7. Setelah diterima, alur identik dengan Scheduled mulai dari
   pembayaran, hanya tanpa jeda tanggal.
```

**Klaim order (D55):**

```sql
UPDATE orders
SET    status = 'ACCEPTED',
       assigned_worker_id = :worker_id,
       accepted_at = now()
WHERE  id = :order_id
  AND  status = 'PENDING_ACCEPTANCE'
  AND  assigned_worker_id IS NULL
RETURNING id;
```

Nol baris berarti sudah keduluan. **Jangan memakai pola baca lalu cek**, karena dua orang yang menekan pada detik yang sama bisa lolos berdua. Saat menerima, guard di service layer tetap memeriksa ulang pemetaan listing, status keanggotaan, dan kondisi in-flight, karena keadaan bisa berubah dalam 5 menit itu.

**Kapan toggle mati sendiri:**

| Pemicu | Perilaku |
|---|---|
| Logout | Mati |
| Presence basi melewati ambang | Dianggap offline, lalu dimatikan cron |
| Order kelewat 5 menit (SLA miss) | Mati, sekaligus dicatat sebagai SLA miss |
| Sedang in-flight | Tetap menyala, pekerja cukup disaring lewat predikat in-flight |

### 4.3 Notifikasi Email dan Verifikasi Akun

| # | Keputusan | Alasan |
|---|---|---|
| D58 | **Notifikasi email dikirim setelah commit**, bukan di dalam transaksi order. Baris `notifications` ditulis di dalam transaksi, pengiriman dilakukan sesudahnya, hasilnya dicatat di `email_status`. Kegagalan kirim tidak pernah membatalkan transisi order | Aturan PRD sudah jelas: panggilan API eksternal tidak boleh berada di dalam transaksi basis data. Uang dan status pekerjaan tidak boleh bergantung pada SMTP. Cron kecil mengirim ulang baris FAILED maksimal tiga kali |
| D59 | **Email adalah kanal pelengkap, bukan kanal utama untuk Available Now.** SLA 5 menit dilayani Socket.IO, email menyusul. Untuk Scheduled yang SLA-nya 24 jam, email adalah kanal yang tepat | Email butuh belasan detik sampai beberapa menit sampai ke inbox, itu pun kalau tidak masuk spam |
| D60 | **Kode verifikasi order tidak pernah dikirim lewat email.** Email hanya memberi tahu bahwa pekerjaan selesai dan kode bisa dilihat di aplikasi | Kode itu bukti kehadiran fisik. Kalau bisa dibaca dari inbox, client tidak perlu berada di lokasi untuk memberikannya, dan seluruh nilai validasi dua lapis (D5 dan D7) runtuh |
| D61 | **Satu orang satu akun, satu alamat email, verifikasi cukup sekali saat registrasi.** Tidak ada email terpisah untuk peran provider maupun pekerja | Konsekuensi langsung D4 dan D35. Peran muncul dari relasi, bukan dari akun terpisah. Kalau tiap peran punya email sendiri, dual-role rusak: orang harus login bergantian dan tidak bisa memesan jasa orang lain dari akun providernya |
| D62 | **Verifikasi email wajib** sebelum membuat order, mengajukan diri jadi provider, atau melamar jadi pekerja. Login dan menjelajah katalog tetap boleh | Ketiganya memicu email notifikasi ke pihak lain, jadi tidak masuk akal kalau alamatnya sendiri belum terbukti ada. Cukup satu middleware, kodenya `EMAIL_NOT_VERIFIED` dengan status 403. Ini sekaligus menutup keputusan terbuka nomor 2 pada versi 2.0 |

**Peta kejadian dan penerima notifikasi:**

| Kejadian | Client | Pemilik | Pekerja |
|---|---|---|---|
| Order Scheduled masuk | | ya | |
| Order Available Now ditawarkan | | | ya (Socket.IO utama) |
| Order diterima, pekerja ditugaskan | ya | ya | ya |
| Order ditolak atau kedaluwarsa | ya | ya | |
| Pembayaran berhasil | ya | ya | ya |
| Pekerja berangkat | ya | | |
| Pekerja check-in di lokasi | ya | | |
| Pekerjaan selesai, minta kode verifikasi | ya | | |
| Order COMPLETED | ya | ya | ya |
| Dana cair ke saldo available | | ya | |
| Dispute dibuka atau diputus | ya | ya | |
| Lamaran pekerja disetujui atau ditolak | | | ya |
| Penugasan diganti (D44) | ya | | pekerja lama dan baru |

### 4.4 Tabel Token dan Penggantian Email

| # | Keputusan | Alasan |
|---|---|---|
| D63 | **Tabel `verification_tokens` generik** dengan kolom `purpose`, dipakai untuk EMAIL_VERIFICATION, PASSWORD_RESET, dan EMAIL_CHANGE. Token disimpan sebagai **hash SHA-256**, token mentah tidak pernah tersimpan | Satu tabel untuk tiga keperluan yang mekanismenya identik lebih rapi daripada enam kolom yang berserakan di `users`. Token di-hash karena kalau isi basis data bocor, hash tidak bisa dipakai, sama alasannya dengan password. Ini justru memperkuat argumen D30: token link tidak pernah perlu ditampilkan lagi sehingga hash sudah benar, sedangkan kode verifikasi order harus bisa dilihat berulang sehingga harus reversible |
| D64 | **Penggantian email diizinkan, dengan empat pengaman:** minta password saat ini, alamat lama tetap aktif sampai yang baru terverifikasi (`users.pending_email`), kirim pemberitahuan ke alamat lama, dan periksa ulang keunikan di dalam transaksi saat verifikasi | Email merangkap identitas login dan kanal notifikasi, jadi mengunci penggantiannya adalah batasan yang janggal, padahal ongkos membangunnya kecil karena mekanisme token sudah ada. Password menutup skenario laptop ditinggal terbuka. Alamat lama tetap aktif supaya satu salah ketik tidak mengunci orang dari akunnya sendiri |

**Alur verifikasi email:**

```
1. User mendaftar -> users.email_verified_at = NULL

2. Backend membuat token
   token mentah  = crypto.randomBytes(32).toString('hex')
   yang disimpan = SHA-256 dari token mentah
   purpose       = EMAIL_VERIFICATION
   expires_at    = now + 24 jam

3. Email berisi link dengan token mentah sebagai query parameter

4. POST /auth/verify-email { token }

5. Backend mem-hash token yang masuk lalu mencarinya lewat index unique.
   Empat pemeriksaan:
     ketemu?                  tidak -> 422 TOKEN_INVALID
     purpose benar?           tidak -> 422 TOKEN_INVALID
     used_at masih NULL?      tidak -> 422 TOKEN_ALREADY_USED
     expires_at belum lewat?  tidak -> 422 TOKEN_EXPIRED

6. Dalam SATU transaksi:
   users.email_verified_at = now()
   verification_tokens.used_at = now()
```

Langkah 6 wajib satu transaksi. Kalau terpisah dan proses mati di tengah, bisa terjadi email tervalidasi tapi token masih bisa dipakai ulang, atau sebaliknya.

**Alur penggantian email:**

```
1. User mengisi email baru DAN password saat ini              (pengaman 1)

2. Backend memeriksa email baru belum dipakai user lain,
   menyimpannya ke users.pending_email.
   users.email TIDAK berubah, user tetap login                (pengaman 2)

3. Dua email dikirim:
   ke alamat BARU : link verifikasi, purpose EMAIL_CHANGE
   ke alamat LAMA : pemberitahuan tanpa link, alamat baru
                    disamarkan, disertai saran segera ganti
                    password kalau ini bukan dia              (pengaman 3)

4. User membuka link di inbox barunya

5. Dalam satu transaksi:
   periksa ULANG email itu belum dipakai user lain            (pengaman 4)
   users.email = pending_email
   users.pending_email = NULL
   users.email_verified_at = now()
   token.used_at = now()
```

**Aturan pelengkap tabel token:**

| Aturan | Keterangan |
|---|---|
| Masa berlaku | EMAIL_VERIFICATION 24 jam, EMAIL_CHANGE 24 jam, PASSWORD_RESET 1 jam karena dampaknya pengambilalihan akun |
| Kirim ulang | Membuat token baru **dan** membatalkan token lama dengan mengisi `used_at`. Tanpa itu beberapa link aktif berkeliaran sekaligus |
| Permintaan ganti email baru | Membatalkan permintaan lama dan menimpa `pending_email`. Tidak boleh ada dua permintaan berjalan bersamaan |
| Tombol batalkan | Mengosongkan `pending_email` dan membatalkan tokennya |
| Lupa password | `POST /auth/forgot-password` **selalu** membalas sukses, bahkan kalau email tidak terdaftar, supaya endpoint itu tidak bisa dipakai menebak siapa saja yang punya akun. Saat password benar-benar diganti, semua token PASSWORD_RESET milik user itu dibatalkan |
| Rate limit | Kirim ulang verifikasi 1 per menit per akun, ganti email 3 per hari per akun. Tanpa ini endpoint tersebut jadi alat membanjiri inbox orang lain |

**Yang tidak boleh masuk ke tabel ini:**

| Hal | Rumahnya | Alasan |
|---|---|---|
| Kode verifikasi order | `orders.verification_code_encrypted` | Dienkripsi bukan di-hash (D30), punya lockout (H8), diketik manual, terikat ke order bukan ke user |
| Sesi atau refresh token | Tabel `refresh_tokens` tersendiri (D76) | Berumur panjang, diperbarui berkali-kali, perlu dicabut massal. Token di tabel ini sekali pakai lalu mati |
| Verifikasi dokumen e-KYC | `kyc_documents` | Alur persetujuan manusia, bukan token |

---

## 4A. Keputusan Versi 2.2 (D65 sampai D71)

### 4A.1 Presence dan Pembaruan Lokasi

| # | Keputusan | Alasan |
|---|---|---|
| D65 | **Penanda online diambil dari koneksi Socket.IO**, bukan dari umur koordinat. `worker_presence_timeout_minutes` tetap dipakai sebagai toleransi putus sinyal sesaat. Merevisi D57 | Koneksi socket adalah penanda yang jujur tentang apakah orangnya masih di depan layar. Memakai `location_updated_at` berarti pekerja harus mengirim koordinat cuma untuk membuktikan dia masih hidup, padahal penandanya sudah tersedia |
| D66 | **Lokasi dikirim berdasarkan perpindahan, bukan interval tetap.** Frontend memakai `navigator.geolocation.watchPosition` dan mengirim hanya kalau berpindah lebih dari `worker_location_move_threshold_meters` atau sudah lewat `worker_location_max_interval_minutes` | Sekali rekam saat toggle dinyalakan tidak cukup, karena pencocokan Available Now memilih pekerja terdekat dan koordinat jadi makin salah seiring waktu. Tapi polling interval pendek juga boros. Pekerja yang diam seharian praktis hanya mengirim 12 permintaan per jam, sedangkan yang sedang berkendara mengirim lebih sering, dan memang saat itulah posisinya berubah |

### 4A.2 Perubahan Definisi Atribut Dinamis

| # | Keputusan | Alasan |
|---|---|---|
| D67 | **Empat aturan saat admin mengubah definisi atribut yang sudah dipakai listing:** (1) validasi hanya dijalankan saat tulis, tidak pernah saat baca, sehingga listing lama tetap tayang; (2) atribut wajib baru hanya berlaku untuk listing baru, listing lama ditandai perlu dilengkapi dan dipaksa mengisi pada kali berikutnya diedit; (3) penghapusan atribut dan `option` bersifat soft lewat `is_active = false`; (4) tidak ada backfill otomatis | Tanpa aturan ini, satu perubahan admin membuat seluruh listing lama tidak valid padahal masih tayang. Poin 3 yang paling penting: kalau baris definisi benar-benar dihapus, nilai lama di `listings.attributes` jadi key tanpa arti, dan angka di Bab IV tidak bisa dijelaskan. Sistem tidak pernah menebak nilai atas nama provider |

### 4A.3 Penanggung Jawab dan Kru Order

| # | Keputusan | Alasan |
|---|---|---|
| D68 | **Satu penanggung jawab per order.** `orders.assigned_worker_id` tetap tunggal, dan di antarmuka dinamai "Penanggung jawab", bukan "Pekerja yang mengerjakan". Snapshot-nya dinamai `snapshot_assignee_name` | Kalau penugasan jadi jamak, empat hal rusak sekaligus: kunci in-flight tidak lagi bisa memakai partial unique index, tidak jelas siapa yang mengubah status dan mengetik kode verifikasi, check-in menghasilkan beberapa koordinat dengan hasil berbeda, dan tabel akurasi geolokasi di Bab IV jadi ambigu. Polanya konsisten dengan D34, D48, dan D49: platform berhubungan dengan usaha, usaha yang mengatur orangnya |
| D69 | **Pekerja pendamping dicatat lewat tabel `order_crew`, khusus mode Scheduled.** Efeknya hanya satu, yaitu memblokir ketersediaan mereka selama rentang order itu. Pendamping tidak bisa mengubah status, tidak bisa check-in, dan tidak bisa memasukkan kode verifikasi | Tanpa pencatatan, pekerja yang ikut turun tetap terlihat bebas dan bisa ditawari order lain di jam yang sama. Ketersediaan pekerja adalah sumber kebenaran tunggal untuk pencocokan (D38, D45, D65), jadi kalau bolong, semua yang bertumpu padanya ikut goyah. Bentuk ini tidak merusak apa pun karena penugasan tetap tunggal |
| D70 | **Order Available Now boleh diterima pemilik maupun pekerja**, keduanya berhak sejak awal dan yang pertama berhasil yang menang. Tidak ada percabangan berdasarkan apakah pemilik sedang online. Pemilik hanya boleh memilih dari daftar yang sama dengan penerima tawaran. **Pendamping tidak tersedia pada mode ini.** Merevisi D54 | Percabangan "kalau pemilik online" selalu bocor di tepinya, misalnya pemilik online lalu tabnya mati tepat saat order masuk. UPDATE bersyarat atomik di D55 sudah menangani perebutannya tanpa perubahan. Pendamping tidak disediakan karena itu keputusan perencanaan sedangkan mode ini tidak punya fase perencanaan, dan kalau hanya pemilik yang boleh menambahkannya, hasil satu order jadi bergantung pada siapa yang lebih cepat menekan tombol |

**Aturan pendamping (D69):**

| Aturan | Keterangan |
|---|---|
| Berlaku pada | Mode SCHEDULED saja, apa pun siapa yang menerima |
| Kunci in-flight | Pendamping disaring di service layer, bukan lewat index. `uniq_inflight_order_per_worker` tetap hanya melihat `assigned_worker_id` |
| Bentrok jadwal | Pendamping ikut pemeriksaan yang sama dengan penanggung jawab (D41) |
| Pemetaan listing | **Tidak wajib** terpetakan (D50), karena pendamping bisa saja hanya membantu mengangkat. Yang wajib terpetakan hanya penanggung jawab |
| Batas jumlah | Jumlah pekerja aktif dikurangi satu, dihitung bukan diparameterkan |
| Batas waktu ubah | Sampai status ON_THE_WAY, sama dengan reassign (D44) |
| Tampilan pekerja | Order yang diikuti sebagai pendamping tetap muncul di dashboard pekerja, tanpa tombol aksi apa pun |
| Tampilan client | Jumlah pendamping tidak ditampilkan ke client |

### 4A.4 Cakupan Contoh Jasa

| # | Keputusan | Alasan |
|---|---|---|
| D71 | **Empat kategori dan dua belas sub-kategori** dipakai sebagai contoh jasa: Otomotif, Fotografi, Kecantikan, dan Perbaikan. Kategori jasa digital dan remote **dikeluarkan dari cakupan** | Jasa remote tidak punya kedatangan fisik, sehingga seluruh mekanisme check-in geolokasi (D5) tidak berlaku dan kamu harus merancang alur penyelesaian order kedua. Batasan yang ditulis: platform ini khusus jasa yang dikerjakan di lokasi client. Jumlahnya dibatasi karena setiap sub-kategori butuh definisi atribut, listing contoh, provider, pekerja, pemetaan, dan order simulasi. Dua belas yang matang lebih berguna daripada dua puluh yang setengah jadi |

**Komposisi dan peran tiap sub-kategori dalam pengujian:**

| Kategori | Sub-kategori | Peran dalam pengujian |
|---|---|---|
| Otomotif | Cuci mobil panggilan | Kedua mode, MULTISELECT layanan tambahan |
| | Servis motor panggilan | Available Now, kasus darurat |
| | Ganti oli panggilan | Atribut minimalis, kontras terhadap listing beratribut banyak |
| Fotografi | Foto produk | Scheduled, NUMBER jumlah item |
| | Foto prewedding | Scheduled, durasi panjang, DATE |
| | Dokumentasi acara | Scheduled, BUSINESS beberapa pekerja, contoh kasus pendamping |
| Kecantikan | Makeup artist acara | INDIVIDUAL, Scheduled |
| | Makeup pengantin | Harga tinggi, durasi panjang |
| | Potong rambut panggilan | Kedua mode, atribut sangat sedikit |
| Perbaikan | Servis AC | NUMBER dengan satuan, kedua mode |
| | Tukang listrik | Available Now, kasus darurat |
| | Servis mesin cuci | Scheduled, SELECT merek |

**Peta ke klaim penelitian:**

| Klaim | Dibuktikan oleh |
|---|---|
| Hybrid Approach menampung bentuk berbeda (D2) | Ganti oli (2 atribut) versus foto prewedding (7 atribut, tipe campur) |
| Dual-mode bermakna | Tukang listrik dan servis AC (darurat) versus foto wedding dan makeup pengantin (wajib dijadwal) |
| Model tenaga kerja (D31 sampai D70) | Dokumentasi acara sebagai BUSINESS dengan 3 fotografer, makeup artist sebagai INDIVIDUAL, bengkel sebagai BUSINESS dengan pemetaan tumpang tindih |
| Geolokasi dan check-in (D5) | Seluruh sub-kategori, karena semuanya mendatangi lokasi client |

Harga acuan diambil dari rentang wajar di pasaran sebagai dasar `suggested_price_min/max` dan harga listing simulasi, dicatat sumbernya untuk Bab IV. Nama penyedia, foto, deskripsi, dan review tetap karangan, dan tidak memakai nama usaha nyata.

---

## 4B. Keputusan Versi 2.3 (D72 sampai D74)

### 4B.1 Atribut Berbayar dan Penamaan Nominal

| # | Keputusan | Alasan |
|---|---|---|
| D72 | **Atribut punya dua peran, ditentukan admin.** SPEC diisi provider saat membuat listing dan tidak memengaruhi harga. OPTION dipilih client saat memesan dan punya delta harga yang nominalnya diisi provider. Ditambah `pricing_mode`: NONE, FLAT_PER_OPTION, atau PER_UNIT | Ini menyelesaikan pilihan antara atribut sebagai spesifikasi jasa atau sebagai cakupan layanan: provider menyatakan apa yang dia layani, client memilih satu saat memesan, harga mengikuti pilihan. Sekaligus memperkuat klaim tujuan penelitian nomor 1, dari "atribut dinamis memungkinkan filter tanpa ubah skema" jadi "atribut dinamis menampung struktur harga yang berbeda antar jasa tanpa ubah skema" |
| D73 | **Nominal order dipecah jadi `listing_base_amount` dan `options_amount`**, menggantikan `base_price`. Harga **selalu dihitung ulang di server**, request pemesanan hanya berisi pilihan opsi, tidak pernah berisi angka | Nama `base_price` jadi menyesatkan begitu isinya sudah termasuk tambahan. Perhitungan di server itu wajib, bukan opsional: kalau client boleh mengirim total, siapa pun bisa memesan jasa premium seharga seribu rupiah lewat alat seperti Postman. Ini celah paling klasik di e-commerce |

**Tiga cara menghitung delta (`pricing_mode`):**

| Tipe atribut | Cara hitung | Contoh |
|---|---|---|
| SELECT | satu delta terpilih | Jenis kendaraan: Sedan +0, SUV +20.000 |
| MULTISELECT | jumlah semua delta terpilih | Poles body +50.000, vacuum +25.000 |
| BOOLEAN | delta datar kalau true | Layanan malam +30.000 |
| NUMBER | delta dikali nilai (PER_UNIT) | Servis AC 75.000 per unit, client isi 3 unit |

**Rumus nominal order yang direvisi:**

```
listing_base_amount = harga listing saat dipesan          50.000
options_amount      = jumlah seluruh delta opsi          +70.000
--------------------------------------------------------------
total_amount        = listing_base_amount + options_amount 120.000  (dibayar client)
platform_fee        = total_amount * 10 persen             12.000
provider_earning    = total_amount - platform_fee         108.000
```

Rumus komisi D28 dan seluruh mekanisme escrow, refund, serta ledger **tidak berubah sama sekali**. Yang berubah hanya cara `total_amount` didapat.

**Konvensi penamaan yang dipegang seterusnya:** `price` untuk daftar harga yang belum terikat transaksi (`listings.price`, `listing_option_prices.price_delta`, `suggested_price_min`), `amount` untuk nominal yang sudah melekat pada satu order.

### 4B.2 Usulan Taksonomi dari Provider

| # | Keputusan | Alasan |
|---|---|---|
| D74 | **Provider bisa mengusulkan tiga jenis penambahan taksonomi** lewat tabel `taxonomy_requests`: sub-kategori baru, atribut baru pada sub-kategori yang ada, dan option baru pada atribut yang ada. Admin yang menyetujui. Provider **tidak** boleh membuat sendiri tanpa persetujuan | Model terpusat menjaga kosakata tetap seragam, dan itu syarat mutlak filter lintas penyedia yang jadi tujuan penelitian nomor 1. Kalau provider bebas membuat sendiri, dalam sebulan akan ada "SUV", "Suv", dan "Kendaraan Besar" sebagai nilai berbeda, dan filter gagal tanpa terlihat gagal. Tapi tanpa saluran usulan, provider yang jasanya belum ada tidak punya jalan sama sekali. Mekanisme ini menutup kelemahan model terpusat dari tiga arah. **Dikukuhkan Pembimbing 1 pada bimbingan 30 September 2026 (D81, D82)** |

**Bobot tiap jenis usulan:**

| Jenis | Beban admin | Efek ke listing lama |
|---|---|---|
| `NEW_SUBCATEGORY` | Berat, admin merancang seluruh atributnya | Tidak ada |
| `NEW_ATTRIBUTE` | Sedang, admin meninjau lalu **selalu masuk sebagai opsional** | Tidak ada, karena opsional (D67) |
| `NEW_ATTRIBUTE_OPTION` | Ringan, admin menambah satu nilai ke array `options` | Tidak ada |

Usulan atribut tidak pernah otomatis wajib. Kalau admin menilai atribut itu memang harus wajib, itu keputusan terpisah yang dia ambil sadar, bukan efek samping menyetujui usulan satu orang. Satu provider tidak boleh memaksa puluhan provider lain mengisi kolom baru.

**Alur form bercabang:**

```
Langkah 1: Apa yang tidak Anda temukan?
  ( ) Jenis jasanya belum ada sama sekali          -> NEW_SUBCATEGORY
  ( ) Jasanya ada, tapi ada hal yang belum bisa
      saya sampaikan                                -> NEW_ATTRIBUTE
  ( ) Atributnya ada, tapi pilihannya belum lengkap -> NEW_ATTRIBUTE_OPTION

Langkah 2: pilih konteksnya
  NEW_SUBCATEGORY       -> langsung ke form
  NEW_ATTRIBUTE         -> pilih sub-kategori, daftar atribut yang sudah
                           ada ditampilkan
  NEW_ATTRIBUTE_OPTION  -> pilih sub-kategori dan atribut, daftar option
                           yang sudah ada ditampilkan

Langkah 3: isi form sesuai jenisnya
```

Pertanyaan di langkah 1 sengaja tidak memakai istilah sub-kategori, atribut, maupun option. Provider tidak perlu memahami model data untuk tahu apa yang dia butuhkan. Konteks dipilih **sebelum** form muncul, karena menampilkan daftar yang sudah ada adalah pencegah duplikasi paling efektif, lebih ampuh daripada saran kemiripan yang baru muncul setelah provider mengetik.

**Pertanyaan pada form usulan sub-kategori** (jawabannya jadi bahan mentah admin menyusun atribut):

| Pertanyaan ke provider | Dipakai admin untuk |
|---|---|
| Nama jasa | `name` sub-kategori |
| Masuk kategori mana | `category_id` |
| Jelaskan singkat pekerjaannya | Konteks |
| Apa yang membuat harganya berbeda antar pesanan? | Menentukan atribut OPTION |
| Hal apa yang biasanya ditanyakan client sebelum memesan? | Menentukan atribut SPEC |
| Berapa lama biasanya dikerjakan? | `durasi_estimasi` dan `validation_rule` |
| Cocok dipesan mendadak, dijadwalkan, atau keduanya? | `supports_available_now` |
| Kisaran harga di pasaran | `suggested_price_min/max` |

**Pertanyaan pada form usulan atribut** diterjemahkan admin jadi: peran SPEC atau OPTION, `pricing_mode`, dan `data_type`. Yang tetap ditentukan admin sendiri adalah `attribute_key` (harus snake_case dan tidak boleh bentrok) serta `is_filterable`.

**Kriteria admin menyetujui usulan atribut:**

| Terima kalau | Tolak kalau |
|---|---|
| Relevan untuk banyak penyedia di sub-kategori itu | Hanya relevan untuk satu penyedia |
| Client kemungkinan ingin memfilter atau membandingkannya | Sudah tercakup atribut yang ada, hanya beda kata |
| Nilainya terbatas dan bisa didaftar | Jawabannya teks bebas yang tidak bisa dibandingkan |

Baris terakhir penting: atribut bertipe TEXT hampir selalu bukan atribut, melainkan isi deskripsi listing. Kalau semua usulan TEXT diterima, sub-kategori berakhir dengan belasan kolom teks yang tidak berguna untuk filter.

**Aturan yang melekat:**

| Aturan | Keterangan |
|---|---|
| Siapa yang boleh mengusulkan | Provider berstatus VERIFIED saja, supaya antrean tidak dibanjiri akun asal |
| Batas usulan aktif | 3 per provider, dihitung **lintas jenis**, bukan per jenis |
| Saran kemiripan | Peringatan lunak, boleh diabaikan. Pencocokan teks tidak bisa dipercaya untuk menyimpulkan kesamaan makna |
| Listing yang menunggu | Tidak perlu dibatalkan. Simpan sebagai DRAFT dengan option yang belum ada ditandai menunggu, terbitkan setelah disetujui |
| Status MERGED | Untuk usulan yang ternyata sudah ada. Provider dapat notifikasi berisi tautan langsung ke yang sudah ada, bukan sekadar ditolak |
| Notifikasi | Lewat jalur email D58 yang sudah ada |

`resulting_id` pada tabel berguna untuk Bab IV: kamu bisa menunjukkan berapa usulan dari lapangan yang berubah jadi taksonomi resmi, sebagai bukti terukur bahwa Hybrid Approach bisa tumbuh mengikuti kebutuhan nyata tanpa perubahan skema.

---

### 4B.3 Batas Cakupan Satu Order

| # | Keputusan | Alasan |
|---|---|---|
| D75 | **Tiga batas cakupan order:** (1) seluruh jasa dikerjakan di lokasi client, tidak ada opsi yang mengharuskan client mendatangi penyedia; (2) satu order sama dengan satu kedatangan, jasa yang butuh beberapa kunjungan dipesan sebagai beberapa order; (3) penyerahan hasil digital berada di luar cakupan escrow, yang divalidasi kode verifikasi adalah selesainya pekerjaan di lokasi | Ketiganya menjaga asumsi inti sistem tetap tunggal: satu `assigned_worker_id`, satu baris `order_checkins`, satu kode verifikasi, satu transisi ke COMPLETED. Melonggarkan salah satunya membongkar state machine order dan mekanisme escrow |

**Kasus yang memicu tiap batas, beserta penanganannya:**

| Kasus nyata | Batas yang berlaku | Penanganan |
|---|---|---|
| Foto produk yang dikerjakan di studio penyedia | Batas 1 | Nilai "Di studio penyedia" dibuang dari `options`. Platform ini jasa on-demand yang hadir langsung di lokasi, jadi opsi yang membalik arah kedatangan tidak punya tempat, dan check-in geolokasi oleh pekerja jadi tidak bermakna |
| Trial makeup sebelum hari pernikahan | Batas 2 | Trial dibuat sebagai listing terpisah, client memesan dua kali. Kalau dijadikan opsi berbayar dalam satu order, satu order butuh dua check-in dan dua kode verifikasi |
| Prewedding yang hasilnya jadi 14 hari kemudian | Batas 3 | `waktu_pengerjaan_hari` tetap atribut SPEC informasional. Menambah status menunggu hasil berarti holding window jadi variabel per listing, escrow tertahan berminggu-minggu, dan definisi COMPLETED jadi dua macam |

Penyerahan hasil bertahap dan order multi-kunjungan masuk saran pengembangan di Bab V.

---

### 4B.4 Sesi Login dan Chatbot Tamu

| # | Keputusan | Alasan |
|---|---|---|
| D76 | **Refresh token dengan rotasi dan deteksi pemakaian ulang**, tabel `refresh_tokens` tersendiri. Access token JWT 15 menit, refresh token 30 hari, di-hash seperti token email (D63). Setiap pemakaian merotasi token dalam `family_id` yang sama | Tanpa ini logout hanya client-side, access token yang sudah terlanjur dikeluarkan tetap sah sampai kedaluwarsa. Rotasi membuat token yang bocor hanya berguna sampai pemakaian berikutnya. Tabel sendiri, bukan menumpang `verification_tokens`, karena siklus hidupnya berbeda: token email sekali pakai lalu mati, refresh token berumur panjang dan dirotasi berkali-kali. Menutup keputusan terbuka nomor 3 |
| D77 | **Chatbot terbuka untuk tamu**, tanpa akun, dengan personalisasi dinonaktifkan. `chat_sessions.user_id` jadi nullable, ditambah `guest_token` dan `expires_at`. **Merevisi D26.** Berasal dari arahan Pembimbing 1 | Orang tidak akan mendaftar lebih dulu untuk mencari tahu apakah platformnya punya yang dia butuhkan, padahal justru di titik itulah chatbot paling berguna. Tiga alasan asli D26 tetap dijaga dengan memisahkan tingkat, bukan dengan menutup aksesnya |

**Empat pemicu pencabutan refresh token (D76):**

| Pemicu | Cakupan |
|---|---|
| Logout | Satu token, satu perangkat |
| Logout semua perangkat | Semua token milik user |
| Ganti password | Semua token milik user |
| Terdeteksi pemakaian ulang token yang sudah dicabut | Seluruh `family_id` |

Deteksi pemakaian ulang adalah alasan rotasi itu ada: kalau token yang sudah `revoked_at` dipakai lagi, berarti ada salinan yang dicuri, dan seluruh rantai sesi itu dicabut. `user_agent` dan `ip_address` disimpan bukan untuk keamanan, melainkan supaya ada halaman daftar perangkat yang aktif.

**Dua tingkat chatbot (D77):**

| | Tamu (belum login) | Sudah login |
|---|---|---|
| Intent extraction | ya | ya |
| Pencarian dan rekomendasi listing | ya | ya |
| Sumber lokasi | izin geolokasi browser, per percakapan | `user_addresses` |
| Riwayat kategori dan rentang harga | tidak | ya |
| `personalization_snapshot` (D27) | null | terisi |
| Melanjutkan ke pemesanan | diminta login dulu | langsung |
| Riwayat percakapan | sampai `expires_at` | permanen |

Yang hilang untuk tamu hanya personalisasi, bukan fungsinya. Ini sekaligus jadi ajakan mendaftar yang wajar, karena chatbot bisa menyebutkan bahwa rekomendasinya akan lebih tepat kalau lokasi dan riwayat pesanan diketahui.

**Klaim sesi saat tamu mendaftar.** Sesi chat tamu diklaim ke akun barunya lewat satu UPDATE yang mengisi `user_id`. Percakapan tidak hilang dan bisa langsung dilanjutkan ke pemesanan. Kolom penandanya juga memberi metrik untuk Bab IV: berapa persen sesi chat tamu yang berlanjut jadi pendaftaran akun. Itu menjawab pertanyaan "apa gunanya chatbot ini" dengan angka, bukan dengan klaim.

**Pengaman yang wajib menyertai D77.** Rate limiting berbasis identitas hilang untuk tamu, padahal tiap pesan memanggil Gemini yang ada biayanya. Tiga lapis, nilainya di `platform_settings`:

| Lapis | Batas awal | Alasan |
|---|---|---|
| Per `guest_token` | 20 pesan per sesi | Batas dasar |
| Per alamat IP | 50 pesan per jam | `guest_token` gampang dibuang dan dibuat baru |
| Global harian untuk seluruh lalu lintas tamu | ditetapkan saat pengujian | Rem darurat kalau dua lapis di atas ditembus |

Jawaban chatbot ke tamu tidak boleh memuat data pribadi penyedia seperti nomor telepon atau alamat persis, hanya yang tampil di halaman listing publik.

---

### 4B.5 Komunikasi Pra-Order dan Dalam Order

| # | Keputusan | Alasan |
|---|---|---|
| D78 | **FAQ per listing**, tabel `listing_faqs`. Provider menulis sendiri tanya jawabnya di muka, tampil di halaman listing, terbaca semua calon client. Teks saja, maksimal `listing_faq_max_items` butir per listing | Pertanyaan sebelum memesan seharusnya dijawab STRUKTUR, bukan percakapan. Atribut SPEC sudah menjawab sebagian besar (`sumber_air`, `sparepart`, `material`, `merek_dilayani` semuanya adalah pertanyaan pra-order yang sudah jadi kolom), dan FAQ menutup sisanya. Bedanya dengan percakapan: yang terbantu semua calon client, bukan satu penanya, dan provider tidak perlu online |
| D79 | **Pesan dalam order**, tabel `order_messages`. Satu percakapan per order, sejak `ACCEPTED` sampai `settlement_due_at` lewat, lalu read-only. Teks saja, tanpa lampiran. Peserta: client, pemilik, dan pekerja yang ditugaskan | Menutup gesekan operasional nyata, terutama pekerja yang kesulitan menemukan alamat. Sudah ada order, ada SLA, dan ada batas waktu, jadi tidak membuka jalur pribadi permanen. Pengirimannya menumpang Socket.IO yang sudah ada, tidak ada komponen baru |

**Percakapan PRA-ORDER ditolak.** Ini perlu dicatat beserta alasannya, karena pertanyaan "bagaimana client bertanya sebelum memesan" hampir pasti muncul di sidang.

| Alasan | Penjelasan |
|---|---|
| Menggeser posisi platform | Tanya jawab sebelum order adalah langkah pertama menuju model quotation. Alurnya berubah pelan-pelan: client tanya, provider jawab, lalu menawar, dan order jadi formalitas di akhir. Begitu itu terjadi, harga di listing tidak lagi bermakna, dan pembeda direct browse-and-book yang ditulis di usulan ide hilang. D23 dan non-goal PRD sudah menolak model tawar-menawar |
| Tidak ada SLA yang bisa ditegakkan | Belum ada order, jadi tidak ada deadline. Provider bebas mengabaikan, client menunggu tanpa kepastian |
| Volume tidak terbatas | Setiap orang yang menjelajah bisa mengirim pesan, tanpa pengait seperti order yang membatasi |
| Disintermediasi maksimal | Percakapan tanpa order adalah jalur bebas. Bertukar nomor lalu bertransaksi di luar platform jadi sangat mudah, dan escrow terlewati |
| Menimbun pertanyaan berulang | Sepuluh client menanyakan hal yang sama, dan tidak ada yang tertinggal untuk client kesebelas |

**Jawaban berlapis tiga kalau ditanya penguji:** atribut SPEC sudah menjawab pertanyaan yang umum, FAQ listing menutup sisanya, dan chatbot AI membantu menemukan penyedia yang cocok tanpa perlu bertanya ke siapa pun. Justru chatbot itu yang mengambil peran yang biasanya dipegang percakapan pra-order, dan menambahkannya malah membuat klaim kebaruan chatbot terlihat kurang dipercaya.

**Mekanisme yang sudah ada untuk mengurangi kebutuhan bertanya.** Form usulan taksonomi (D74) menanyakan ke provider "hal apa yang biasanya ditanyakan client sebelum memesan", dan jawabannya dipakai admin menyusun atribut SPEC. Jadi pertanyaan yang berulang diubah jadi atribut terstruktur, dan sejak itu terjawab untuk semua client. Kalau masih banyak yang bertanya, itu sinyal definisi atributnya kurang lengkap, bukan sinyal butuh jalur percakapan.

**Penamaan: JANGAN pakai kata chat.** `chat_sessions` dan `chat_messages` sudah dipakai chatbot AI. Kalau fitur ini juga dinamai chat, akan ada dua hal berbeda dengan nama sama di skema, di kode, dan di laporan, dan penguji yang membaca Bab IV akan bingung angka "rata-rata pesan per sesi" merujuk yang mana. Di laporan selalu disebut **"pesan dalam order"**, dan istilah chat dicadangkan untuk chatbot AI saja.

**Client bicara dengan ORDER, bukan dengan orang.**

| Model | Masalahnya |
|---|---|
| Client ke pemilik | Pemilik jadi perantara padahal yang di lokasi pekerja. Lambat dan tidak menyelesaikan masalah |
| Client ke pekerja | Membuka jalur pribadi ke pekerja. Pemilik kehilangan visibilitas atas apa yang dijanjikan atas nama usahanya |
| **Client ke order** | Pemilik dan pekerja sama-sama melihat dan bisa membalas, tiap pesan berlabel pengirim |

Yang dipilih model ketiga, konsisten dengan D68 dan D49: yang bertanggung jawab adalah usaha, pekerja hanya penanggung jawab pelaksanaan. Client tidak perlu tahu nomor pribadi siapa pun, dan pemilik tetap bisa mengawasi.

**Percakapan punya DUA SISI, bukan tiga.** Client di satu sisi, penyedia di sisi lain, dan pemilik maupun pekerja sama-sama berada di sisi penyedia. Penyederhanaan ini yang membuat `read_at` cukup satu kolom: artinya dibaca oleh sisi lawan. Kalau dibuat per orang, butuh tabel tanda baca tersendiri, dan itu tidak sebanding untuk cakupan ini.

**Aturan yang melekat pada D79:**

| Aturan | Ketentuan |
|---|---|
| Cakupan | Satu percakapan per order. Tidak ada percakapan lintas order, tidak ada percakapan tanpa order |
| Peserta | Client, pemilik provider, dan `assigned_worker_id`. **Pendamping tidak** (D69) |
| Masa aktif | Sejak `ACCEPTED` sampai `settlement_due_at` lewat. Setelah itu read-only, tidak dihapus |
| Isi | Teks saja. Tidak ada lampiran, foto, atau berbagi lokasi |
| Admin | Membaca saja saat menangani dispute, tidak mengirim pesan. Komunikasi admin lewat `disputes.resolution_note` |
| Saat dispute | Seluruh percakapan otomatis jadi bukti dan ditampilkan ke admin, melengkapi `dispute_evidences` yang diunggah manual |

**Kenapa hanya teks.** Begitu ada lampiran, muncul urusan penyimpanan, ukuran berkas, jenis berkas, dan moderasi konten, dan itu modul tersendiri. Kalau nanti dibutuhkan, lampiran masuk saran pengembangan.

**Kenapa tidak ada tabel `order_conversations` terpisah.** Satu order satu percakapan, jadi order itu sendiri yang jadi wadahnya. Tabel percakapan terpisah hanya akan berisi kolom turunan seperti waktu pesan terakhir, yang bisa dihitung dari `order_messages` dengan index yang sudah ada.

---

### 4B.6 Pola Unggah Berkas

| # | Keputusan | Alasan |
|---|---|---|
| D80 | **Pola unggah dipisah berdasarkan sifat berkasnya.** Dokumen e-KYC dan bukti dispute diunggah lewat **multipart ke API**, sehingga server memvalidasi dan menyimpannya ke Storage. Foto listing tetap memakai **signed URL** langsung ke Storage. Dalam kedua pola, berkasnya tetap tidak disimpan di basis data, yang tersimpan tetap `file_url` | Ketiganya punya profil yang berbeda dan tidak layak diperlakukan sama |

**Latar belakang.** Rancangan awal memakai signed URL untuk seluruh unggahan, artinya backend tidak pernah menerima byte berkasnya sama sekali. Pola itu benar untuk berkas publik bervolume besar, tapi keliru untuk dokumen e-KYC: platform jadi tidak pernah memeriksa apa yang diunggah, padahal justru dokumen itu yang menentukan seseorang layak jadi penyedia atau tidak.

| Berkas | Pola | Alasan |
|---|---|---|
| Dokumen e-KYC | **Multipart ke API** | Sensitif (KTP, selfie), volumenya kecil (3 sampai 4 per penyedia, sekali seumur akun), dan platform **harus benar-benar memvalidasinya**, bukan mempercayai client |
| Bukti dispute | **Multipart ke API** | Sama sifatnya, jadi barang bukti putusan admin, jumlahnya sedikit |
| Foto listing | Signed URL | Publik, jumlahnya banyak, ukurannya besar. Kalau lewat API, endpoint yang diukur di pengujian beban ikut terbebani |

**Kenapa pemisahan ini memperkuat argumen, bukan sekadar kompromi.** Kalau penguji bertanya bagaimana platform memastikan dokumen e-KYC benar berupa gambar dan bukan berkas lain, jawabannya konkret: server memeriksa **magic bytes** dan ukurannya sebelum menyimpan, bukan percaya pada `Content-Type` yang dikirim client. Berkas `.exe` yang diberi nama `ktp.jpg` ditolak.

Sebaliknya untuk foto listing jawabannya juga rapi: berkas publik bervolume besar sengaja tidak melewati API supaya tidak membebani endpoint yang diukur.

**Ketentuan jalur multipart:**

| Aspek | Ketentuan |
|---|---|
| Middleware | `multer` dengan `memoryStorage`, bukan `diskStorage`, supaya tidak meninggalkan berkas sementara di server |
| Batas ukuran | `kyc_document_max_size_mb` dan `dispute_evidence_max_size_mb`, nilai awal 5 MB. Khusus route ini, batas body 1 MB yang umum tetap berlaku di route lain |
| Tipe diterima | `image/jpeg`, `image/png`, `application/pdf` |
| Validasi | Periksa **magic bytes**, bukan `Content-Type` dari client dan bukan ekstensi nama berkas |
| Urutan | Validasi, unggah ke Storage, **baru** tulis baris basis data. Kalau unggah gagal, baris tidak ditulis sama sekali |
| Bucket | Tetap private. Admin membacanya lewat signed URL berumur pendek |

**Berkas yatim pada jalur signed URL.** Celah ini ada sejak rancangan awal dan belum pernah ditutup: kalau seseorang meminta signed URL, mengunggah berkasnya, lalu tidak pernah memanggil endpoint yang mencatat metadatanya, berkas itu nyangkut di Storage tanpa baris basis data dan tidak ada yang membersihkan.

Penutupnya cukup satu cron harian yang menghapus berkas di bucket foto listing yang lebih tua dari 24 jam dan tidak punya baris `listing_photos` yang merujuknya. Jalur multipart tidak punya masalah ini, karena unggah dan penulisan baris terjadi dalam satu permintaan.

---

## 4C. Keputusan Versi 2.8 (D81 sampai D86)

Versi ini tidak mengubah skema. Isinya menutup seluruh keputusan terbuka di Bagian 7, sebagian berasal dari bimbingan dengan Pembimbing 1 tanggal 30 September 2026.

### 4C.1 Taksonomi Tetap Terpusat

| # | Keputusan | Alasan |
|---|---|---|
| D81 | **Provider tidak boleh membuat opsi kustom bebas** seperti option group di aplikasi pesan antar makanan. Seluruh opsi berasal dari definisi atribut buatan admin, dan kebutuhan opsi baru disalurkan lewat usulan `NEW_ATTRIBUTE_OPTION` (D74). Tabel `listing_custom_options` tidak dibuat. Dikukuhkan Pembimbing 1 pada bimbingan 30 September 2026 | Opsi buatan provider tidak bisa ikut difilter lintas penyedia karena kosakatanya tidak seragam, sedangkan filter lintas penyedia adalah tujuan penelitian nomor 1. Menutup keputusan terbuka 1a |
| D82 | **Provider tidak boleh membuat sub-kategori sendiri** tanpa persetujuan admin. Jalurnya tetap usulan `NEW_SUBCATEGORY` (D74). Fitur penggabungan sub-kategori tidak diperlukan. Dikukuhkan Pembimbing 1 pada bimbingan 30 September 2026 | Saran kemiripan mengurangi duplikasi tapi tidak menghilangkannya, dan struktur atribut jadi berbeda antar provider untuk jasa yang sama. Menutup keputusan terbuka 1b |

### 4C.2 Biaya Pihak Ketiga dan Withdrawal

| # | Keputusan | Alasan |
|---|---|---|
| D83 | **Biaya metode pembayaran dari payment gateway** (Virtual Account, QRIS, e-wallet) **diasumsikan ditanggung platform dari komisi** dan tidak dimodelkan dalam alur dana. Tidak ada perubahan skema, rumus nominal order, maupun logika refund | Ruang lingkup penelitian adalah mekanisme escrow dan integritas dana, bukan kelayakan bisnis platform. Pengujian memang berjalan di Xendit test mode, tapi alasan yang dipakai di laporan adalah ruang lingkup, bukan test mode. Ditulis sebagai batasan (H81) |
| D84 | **Minimum withdrawal Rp50.000 dan admin fee flat Rp6.500 per pengajuan**, disimpan sebagai `withdrawal_min_amount` dan `withdrawal_admin_fee`. `net_amount = amount - admin_fee`, dihitung di server, dan saldo tetap didebit sebesar `amount` saat pengajuan (D15) | Admin fee mengikuti perkiraan biaya payout Xendit, sehingga platform tidak mengambil untung dari pencairan dan pendapatannya hanya komisi. Nilai flat dipilih daripada rumus persentase karena pencairan bukan fokus penelitian. Minimum Rp50.000 menjaga admin fee paling besar sekitar 13 persen dari nominal. Menutup keputusan terbuka nomor 2 |

**Tarif Xendit yang menjadi acuan** (halaman harga resmi Xendit, dicek 15 Oktober 2026, belum termasuk pajak):

| Layanan | Tarif |
|---|---|
| Payout ke rekening bank | 1 persen (minimal Rp2.500) ditambah biaya proses Rp4.000 |
| Invoice lewat Virtual Account | Rp9.000 ditambah biaya proses Rp4.000 |
| Invoice lewat QRIS | 0,7 persen ditambah biaya proses Rp4.000 |
| Invoice lewat e-wallet | 2 sampai 5,5 persen tergantung penyedia, ditambah biaya proses Rp4.000 |

Admin fee Rp6.500 sama persis dengan biaya payout sebenarnya untuk nominal sampai Rp250.000. Di atas itu biaya sebenarnya sedikit lebih besar dan selisihnya ditanggung platform (H82).

**Bahan diskusi Bab IV atau V, bukan untuk diimplementasikan.** Dengan komisi 10 persen, biaya metode pembayaran baru tertutup kalau nilai order minimal sekitar Rp130.000 untuk Virtual Account dan sekitar Rp43.000 untuk QRIS. Beberapa sub-kategori contoh seperti ganti oli, cuci mobil, dan potong rambut punya rentang harga di bawah angka tersebut. Pada platform nyata hal ini biasanya diatasi dengan biaya layanan terpisah yang dibayar client, dan itu bisa masuk saran pengembangan.

### 4C.3 Target Pengujian

| # | Keputusan | Alasan |
|---|---|---|
| D85 | **Target pengujian ditetapkan sebelum pengujian dijalankan**, rinciannya di tabel bawah. Menutup keputusan terbuka nomor 3 | Ambang yang ditetapkan sesudah melihat hasil tidak punya arti. Pemisahan beban normal dan stress mengikuti definisi stress testing di Bab II, yaitu beban yang melampaui kondisi normal untuk mengetahui batas kemampuan sistem |

| Pengujian | Target |
|---|---|
| UAT, responden | 30 orang: 15 client, 6 provider, 6 pekerja, 3 admin |
| UAT, kriteria lulus | Persentase kelayakan minimal kategori **Layak (di atas 60 persen)** pada **setiap aspek** (fungsionalitas, kemudahan penggunaan, kepuasan) dan **setiap aktor**, mengacu Tabel 2.11 Bab II. Yang diharapkan kategori Sangat Layak (di atas 80 persen) |
| Akurasi intent extraction | Minimal 80 persen pada 30 sampai 50 skenario percakapan berlabel (H15) |
| Beban normal, kriteria lulus | 50 virtual user, latensi persentil ke-95 sesuai PRD Bagian 6.1, error rate di bawah 1 persen. Webhook 20 request per detik tanpa duplikasi ledger, dan 10 klaim Available Now paralel menghasilkan tepat 1 pemenang (PRD Bagian 6.2) |
| Stress, tanpa kriteria lulus | Beban dinaikkan bertahap ke 100, 150, dan 250 virtual user. Yang dicatat adalah titik saat latensi persentil ke-95 melewati target atau error rate melewati 1 persen, sebagai batas kemampuan sistem |
| `guest_chat_daily_global_limit` | Ditetapkan pada fase chatbot, menyesuaikan kuota API key Gemini yang dipakai |

Kriteria UAT dipasang per aspek dan per aktor, bukan hanya rata-rata keseluruhan, karena rata-rata bisa menutupi satu aspek atau satu aktor yang hasilnya buruk.

### 4C.4 Dasar Angka Bisnis

| # | Keputusan | Alasan |
|---|---|---|
| D86 | **Komisi 10 persen (D28) dan holding window 24 jam (D24) dipertahankan.** Keduanya tetap parameter (`platform_fee_percentage`, `settlement_holding_hours`) sehingga bisa diubah tanpa menyentuh kode. Menutup keputusan terbuka nomor 4 | Dasar masing-masing di bawah |

**Dasar komisi 10 persen.** Pembanding terdekat di Indonesia adalah batas potongan aplikasi ojek online: maksimal 20 persen menurut KP Menteri Perhubungan Nomor 1001 Tahun 2022, lalu diturunkan menjadi maksimal 8 persen sejak 1 Juli 2026 berdasarkan Perpres Nomor 27 Tahun 2026. Aturan tersebut khusus angkutan penumpang roda dua, sehingga tidak berlaku untuk marketplace jasa. Komisi 10 persen berada di separuh batas lama, dan kalau penguji menyinggung batas 8 persen, jawabannya adalah perbedaan jenis layanan tersebut.

**Dasar holding window 24 jam:**

1. Seluruh jasa dikerjakan di lokasi client (D75) dan hasilnya langsung terlihat. Saat client menyerahkan kode verifikasi, itu sudah bentuk persetujuan atas pekerjaan
2. Marketplace jasa digital menahan dana jauh lebih lama karena kualitas hasil digital butuh waktu untuk dinilai, sedangkan jasa fisik tidak. Kalau Fiverr dipakai sebagai pembanding, ketentuan terbarunya dicek dulu sebelum dikutip di laporan
3. Pekerja lapangan butuh dana yang cepat cair, sementara 24 jam cukup untuk menyadari masalah yang muncul belakangan, misalnya AC yang bocor lagi pada malam harinya

Sumber: halaman harga Xendit (xendit.co/en/pricing) dan Bisnis.com, 1 Juli 2026, "Grab, Gojek & Maxim Berlakukan Potongan Ojol 8% Mulai Hari Ini 1 Juli".

---

## 5. Alur Sistem End-to-End

### 5.1 Onboarding

```
 1. Seseorang mendaftar sebagai user. Role bawaan CLIENT
 2. Verifikasi email lewat link                                  (D62)
 3. Client mengajukan diri menjadi provider
    3a. Memilih provider_type: INDIVIDUAL atau BUSINESS          (D46)
    3b. Mengunggah dokumen e-KYC sesuai tipe yang dipilih
    3c. Menunggu persetujuan admin
 4. Admin menyetujui. Sistem melakukan dua hal sekaligus:
    4a. Membuat wallet untuk provider
    4b. Membuat baris provider_workers untuk pemilik,
        is_owner = true, membership_status = ACTIVE              (D33)
 5. Provider membuat listing jasa beserta atribut dinamisnya
    5a. INDIVIDUAL: pemetaan pekerja dibuat otomatis             (D53)
    5b. BUSINESS: pemilik mencentang siapa yang bisa mengerjakan (D50)
    5c. Listing tanpa pekerja terpetakan tertahan di DRAFT       (D53)

Jalur terpisah, hanya untuk BUSINESS:
 6. Orang lain yang sudah punya akun melamar jadi pekerja
    6a. Mencentang listing mana yang bisa dia kerjakan           (D52)
    6b. Mengunggah dokumen yang diminta pemilik usaha
    6c. membership_status = PENDING                              (D37)
 7. Pemilik provider menyetujui atau menolak                     (D34)
    7a. Pemilik boleh menambah atau mencoret centangan pelamar   (D52)
 8. Jika disetujui, membership_status = ACTIVE dan lamaran
    pelamar tersebut ke usaha lain otomatis gugur                (D36)
```

Pemilik yang hanya ingin mengelola tanpa turun ke lapangan mengatur `accepts_assignments = false` pada barisnya sendiri. Hanya boleh untuk BUSINESS, karena INDIVIDUAL akan kehabisan pekerja aktif (D39).

### 5.2 Mode Scheduled

```
 1. Client memilih listing dan tanggal, lalu membuat order
    -> status PENDING_ACCEPTANCE, SLA approval 24 jam           (D9)
    -> harga, judul, atribut, dan durasi di-snapshot            (D10)
    -> notifikasi email ke pemilik provider                     (D58)

 2. PEMILIK menerima order SEKALIGUS memilih pekerja            (D54, D42)
    -> dropdown menyaring dua lapis: terpetakan ke listing itu  (D50)
       DAN jadwalnya bebas di rentang waktunya                  (D41)
    -> assigned_worker_id dan snapshot_assignee_name terisi   (D68)
    -> pemilik boleh menambah pekerja pendamping lewat
       tombol tambah, sebanyak pekerja aktif dikurangi satu  (D69)
    -> ketersediaan pendamping ikut terblokir di rentang itu
    -> status ACCEPTED, slot pekerja terkunci TENTATIF          (D43)
    -> invoice Xendit dibuat, batas bayar mulai berjalan
    -> notifikasi ke client dan pekerja yang ditugaskan

 3. Client membayar
    -> webhook invoice.paid masuk, idempotent lewat event_id    (D16)
    -> status PAID, slot pekerja terkunci PASTI                 (D43)
    -> ESCROW_HOLD: provider_earning masuk balance_pending      (D12)
    -> dashboard provider menampilkan card "dana ditahan"

    Jika batas bayar lewat: status PAYMENT_EXPIRED dan
    slot pekerja otomatis dilepas                               (D43)

 4. Pemilik boleh mengganti pekerja selama belum ON_THE_WAY     (D44)

 5. Pada hari-H, pekerja berangkat
    -> status ON_THE_WAY, lokasi dikirim lewat Socket.IO

 6. Pekerja tiba dan melakukan check-in geolokasi
    -> Haversine dihitung di server, radius toleransi 100 meter (D5)
    -> order_checkins mencatat worker_id sebagai bukti          (D31)
    -> status ARRIVED

 7. Pekerja mulai bekerja -> status IN_PROGRESS

 8. Pekerjaan selesai, pekerja menekan selesai
    -> sistem membuat kode verifikasi 6 digit, terenkripsi AES  (D30)
    -> status AWAITING_VERIFICATION
    -> email ke client memberi tahu kode bisa dilihat di
       aplikasi, kodenya TIDAK ikut dikirim                     (D60)

 9. Client membuka kode di aplikasinya, pekerja memasukkannya
    -> salah 5 kali memicu lockout                              (H8)
    -> status COMPLETED, settlement_due_at = now + 24 jam       (D24)

10. Holding window 24 jam berjalan
    -> client boleh membuka dispute selama window ini           (D25)
    -> dana masih di balance_pending

11a. Tanpa komplain: cron settlement mengubah status ke SETTLED
     -> ESCROW_RELEASE: pending berkurang, available bertambah  (D13)
     -> provider boleh mengajukan withdrawal                    (D15)

11b. Ada komplain: status DISPUTED, admin memutuskan
     -> RELEASE, PARTIAL, atau REFUND
     -> refund selalu memotong balance_pending                  (D20)

12. Penggajian pekerja dilakukan provider di luar sistem        (D48)
```

### 5.3 Mode Available Now

Identik dengan alur di atas mulai langkah 3, dengan tiga perbedaan di awal:

| Langkah | Perbedaan |
|---|---|
| 1 | Client hanya melihat listing yang punya minimal satu pekerja terpetakan dan idle, hasil turunan bukan kolom (D45). SLA 5 menit, bukan 24 jam |
| 2 | Order ditawarkan ke maksimal 5 pekerja terdekat yang memenuhi syarat, dan sekaligus muncul di dashboard pemilik. Pemilik maupun pekerja sama-sama berhak, yang pertama berhasil yang menang (D55, D70). Tidak ada pendamping pada mode ini |
| 5 | Pekerja langsung berangkat, tidak ada jeda tanggal, jadi kunci tentatif dan kunci pasti praktis berdempetan |

### 5.4 Ringkasan Perpindahan Tanggung Jawab

| Hal | Sebelum revisi | Sesudah revisi |
|---|---|---|
| Yang datang ke lokasi | Akun provider | Pekerja yang ditugaskan |
| Yang menerima order Available Now | Provider | Pekerja atau pemilik, siapa cepat dia dapat |
| Yang menerima order Scheduled | Provider | Provider (tidak berubah) |
| Check-in geolokasi | `provider_profiles` | `order_checkins.worker_id` |
| Input kode verifikasi | Provider | Pekerja |
| Lokasi real-time | `provider_profiles` | `provider_workers` |
| Toggle Available Now | `listings.is_available_now` | `provider_workers.is_available`, listing jadi turunan |
| Kunci satu order berjalan | Per provider | Per pekerja |
| Order paralel | Satu per provider | Sebanyak pekerja idle |
| Wallet dan withdrawal | Provider | Provider (tidak berubah) |
| Rating | Provider | Provider (tidak berubah) |
| e-KYC | Provider | Provider (tidak berubah) |

---

## 6. Dampak ke Skema Basis Data

Dari 25 tabel dan 26 enum menjadi **34 tabel dan 35 enum**.

### 6.1 Tabel Baru

```
Table provider_workers {
  id                   uuid                      [pk]
  provider_profile_id  uuid                      [not null]
  user_id              uuid                      [not null]
  display_name         varchar(100)              [not null]
  photo_url            text
  experience_note      text
  is_owner             boolean                   [not null, default: false]
  membership_status    worker_membership_status  [not null, default: 'PENDING']
  accepts_assignments  boolean                   [not null, default: true]
  is_available         boolean                   [not null, default: false]
  current_latitude     decimal(10,8)
  current_longitude    decimal(11,8)
  location_updated_at  timestamptz
  approved_by          uuid    [note: 'pemilik yang menyetujui, null untuk baris pemilik sendiri']
  approved_at          timestamptz
  created_at           timestamptz               [not null, default: `now()`]
  updated_at           timestamptz               [not null, default: `now()`]

  indexes {
    (current_latitude, current_longitude) [name: 'idx_worker_geo']
    (provider_profile_id, membership_status, is_available)
  }
}

Table worker_listings {
  id          uuid         [pk]
  worker_id   uuid         [not null]
  listing_id  uuid         [not null]
  created_at  timestamptz  [not null, default: `now()`]

  indexes {
    (worker_id, listing_id) [unique]
    (listing_id)
  }
}

Table order_crew {
  id          uuid         [pk]
  order_id    uuid         [not null]
  worker_id   uuid         [not null]
  added_by    uuid         [not null, note: 'pemilik yang mencentang']
  created_at  timestamptz  [not null, default: `now()`]

  indexes {
    (order_id, worker_id) [unique]
    (worker_id) [note: 'dipanggil di setiap pencocokan dan dropdown penugasan']
  }
}

Table listing_option_prices {
  id             uuid          [pk]
  listing_id     uuid          [not null]
  attribute_key  varchar(50)   [not null]
  option_value   varchar(100)  [note: 'null untuk BOOLEAN dan NUMBER']
  price_delta    decimal(12,2) [not null, default: 0]
  is_offered     boolean       [not null, default: true, note: 'opsi yang tidak dicentang provider tidak muncul ke client']

  indexes { (listing_id, attribute_key, option_value) [unique] }
}

Table taxonomy_requests {
  id                  uuid                     [pk]
  request_type        taxonomy_request_type    [not null]
  provider_profile_id uuid                     [not null]

  category_id         uuid        [note: 'NEW_SUBCATEGORY']
  subcategory_id      uuid        [note: 'NEW_ATTRIBUTE dan NEW_ATTRIBUTE_OPTION']
  attribute_key       varchar(50) [note: 'NEW_ATTRIBUTE_OPTION']

  proposed_name       varchar(150) [not null, note: 'nama jasa, atribut, atau nilai option']
  work_description    text
  price_factors       text        [note: 'bahan atribut OPTION']
  common_questions    text        [note: 'bahan atribut SPEC']
  proposed_data_type  varchar(20)
  proposed_role       varchar(10) [note: 'SPEC atau OPTION menurut provider']
  affects_price       boolean
  proposed_options    text        [note: 'satu nilai per baris']
  reason              text
  duration_min_minutes int
  duration_max_minutes int
  booking_mode_suggestion varchar(20)
  market_price_min    decimal(12,2)
  market_price_max    decimal(12,2)

  status              taxonomy_request_status  [not null, default: 'PENDING']
  admin_note          text        [note: 'alasan penolakan atau catatan penggabungan']
  resulting_id        uuid        [note: 'id taksonomi yang terbentuk kalau disetujui']
  reviewed_by         uuid
  reviewed_at         timestamptz
  created_at          timestamptz [not null, default: `now()`]

  indexes { (provider_profile_id, status)  (status, request_type) }
}

Table listing_faqs {
  id            uuid          [pk]
  listing_id    uuid          [not null]
  question      varchar(200)  [not null]
  answer        text          [not null]
  display_order int           [not null, default: 0]
  is_active     boolean       [not null, default: true]
  created_at    timestamptz   [not null, default: `now()`]
  updated_at    timestamptz   [not null, default: `now()`]

  indexes { (listing_id, display_order) }
}

Table order_messages {
  id             bigserial        [pk, increment]
  order_id       uuid             [not null]
  sender_user_id uuid             [not null]
  sender_role    order_actor_type [not null, note: 'CLIENT, PROVIDER, atau WORKER saja']
  content        text             [not null]
  read_at        timestamptz      [note: 'dibaca oleh SISI LAWAN, bukan per orang']
  created_at     timestamptz      [not null, default: `now()`]

  indexes {
    (order_id, id)
    (order_id, read_at)
  }
}

Table refresh_tokens {
  id          uuid          [pk]
  user_id     uuid          [not null]
  token_hash  varchar(255)  [not null, unique, note: 'SHA-256 dari token mentah']
  family_id   uuid          [not null, note: 'rantai rotasi, satu per sesi login']
  expires_at  timestamptz   [not null]
  revoked_at  timestamptz
  replaced_by uuid          [note: 'token pengganti saat rotasi']
  user_agent  varchar(255)  [note: 'untuk halaman perangkat aktif, bukan untuk keamanan']
  ip_address  varchar(45)
  created_at  timestamptz   [not null, default: `now()`]

  indexes { (user_id, revoked_at)  (family_id) }
}

Table verification_tokens {
  id          uuid          [pk]
  user_id     uuid          [not null]
  token_hash  varchar(255)  [not null, unique, note: 'SHA-256 dari token mentah']
  purpose     token_purpose [not null]
  expires_at  timestamptz   [not null]
  used_at     timestamptz
  created_at  timestamptz   [not null, default: `now()`]

  indexes {
    (user_id, purpose)
  }
}
```

### 6.2 Enum Baru

```
Enum provider_type            { INDIVIDUAL  BUSINESS }
Enum worker_membership_status { PENDING  ACTIVE  REJECTED  RESIGNED }
Enum token_purpose            { EMAIL_VERIFICATION  PASSWORD_RESET  EMAIL_CHANGE }
Enum notification_channel     { IN_APP  EMAIL }
Enum email_delivery_status    { PENDING  SENT  FAILED }
Enum attribute_role           { SPEC  OPTION }
Enum pricing_mode             { NONE  FLAT_PER_OPTION  PER_UNIT }
Enum taxonomy_request_type    { NEW_SUBCATEGORY  NEW_ATTRIBUTE  NEW_ATTRIBUTE_OPTION }
Enum taxonomy_request_status  { PENDING  APPROVED  REJECTED  MERGED }

// D79 sengaja TIDAK menambah enum baru. order_messages.sender_role memakai
// order_actor_type yang sudah ada, dibatasi CHECK ke CLIENT, PROVIDER, WORKER.
```

### 6.3 Perubahan Tabel Lama

| Tabel | Perubahan |
|---|---|
| `users` | Tambah `pending_email` (nullable, **tanpa unique**, karena alamat yang pernah diketik lalu ditinggalkan akan memblokir pemilik aslinya) |
| `provider_profiles` | Buang `current_latitude`, `current_longitude`, `location_updated_at`. Tambah `provider_type` dan `requested_provider_type` (nullable). `service_radius_km` tetap |
| `orders` | Tambah `assigned_worker_id` (nullable saat PENDING_ACCEPTANCE, wajib mulai ACCEPTED), `snapshot_assignee_name`, dan `accepted_by` (siapa yang menekan tombol terima, bisa berbeda dari penanggung jawab, D70). **`base_price` diganti nama jadi `listing_base_amount`**, tambah `options_amount` (default 0) dan `snapshot_selected_options` JSONB berisi key, label, nilai, dan delta saat pemesanan (D73) |
| `order_checkins` | Tambah `worker_id` not null |
| `listings` | Buang `is_available_now`. `supports_available_now` tetap. Tambah `attributes_need_update` (boolean), penanda listing lama yang belum memenuhi atribut wajib yang baru ditambahkan admin (D67) |
| `notifications` | Tambah `channel`, `email_status`, `email_error` |
| `chat_sessions` | `user_id` jadi **nullable**. Tambah `guest_token` (unique), `expires_at`, dan `claimed_at` (penanda sesi tamu yang diklaim setelah mendaftar). `personalization_snapshot` tetap null untuk tamu (D77) |
| `subcategory_attributes` | Tambah `is_active` untuk penghapusan yang bersifat soft (D67), plus `attribute_role` dan `pricing_mode` (D72). Nilai di dalam `options` juga ditandai aktif atau tidak, bukan dibuang |

### 6.4 Constraint yang Berubah

```sql
-- Menggantikan uniq_inflight_order_per_provider (D40)
CREATE UNIQUE INDEX uniq_inflight_order_per_worker
  ON orders (assigned_worker_id)
  WHERE status IN ('ON_THE_WAY','ARRIVED','IN_PROGRESS','AWAITING_VERIFICATION')
     OR (booking_mode = 'AVAILABLE_NOW' AND status IN ('ACCEPTED','PAID'));

-- Eksklusivitas keanggotaan, tetap mengizinkan pindah usaha (D36)
CREATE UNIQUE INDEX uniq_active_worker_membership
  ON provider_workers (user_id)
  WHERE membership_status = 'ACTIVE';

-- Pekerja wajib terisi begitu order diterima (D42)
-- Berlaku sama untuk kedua mode, karena klaim Available Now
-- mengisi assigned_worker_id pada transisi yang sama dengan ACCEPTED.
ALTER TABLE orders
  ADD CONSTRAINT chk_order_worker_assigned
  CHECK (
    status IN ('PENDING_ACCEPTANCE','REJECTED','EXPIRED','CANCELLED')
    OR assigned_worker_id IS NOT NULL
  );
```

```sql
-- Pesan dalam order hanya dari tiga peran, bukan ADMIN atau SYSTEM (D79)
ALTER TABLE order_messages
  ADD CONSTRAINT chk_order_message_sender_role
  CHECK (sender_role IN ('CLIENT', 'PROVIDER', 'WORKER'));

-- Pesan tidak boleh kosong dan tidak boleh melebihi batas panjang (D79)
ALTER TABLE order_messages
  ADD CONSTRAINT chk_order_message_content_length
  CHECK (char_length(content) BETWEEN 1 AND 2000);
```

```sql
-- Sesi chat wajib punya identitas, tamu maupun terdaftar (D77)
ALTER TABLE chat_sessions
  ADD CONSTRAINT chk_chat_session_identity
  CHECK (user_id IS NOT NULL OR guest_token IS NOT NULL);
```

```sql
-- Komposisi nominal: dari mana angkanya (D73)
ALTER TABLE orders
  ADD CONSTRAINT chk_order_total_composition
  CHECK (total_amount = listing_base_amount + options_amount);
```

`chk_order_amount_consistent` yang lama tidak berubah: dia menjaga sisi pembagian (ke mana angkanya pergi), sedangkan constraint baru menjaga sisi client (dari mana angkanya). Dua pertanyaan berbeda, dua constraint terpisah, sehingga kalau ada bug langsung ketahuan sisi mana yang salah. `chk_order_amount_non_negative` disesuaikan agar mencakup kolom baru.

`options_amount` wajib jadi kolom, bukan sekadar dijumlahkan dari `snapshot_selected_options`, karena CHECK constraint tidak bisa membaca isi JSONB. Tanpa kolom itu, invariant di atas tidak bisa ditegakkan database.

Kueri verifikasi V5 disesuaikan: pengelompokannya jadi `assigned_worker_id`, bukan `provider_profile_id`.

### 6.5 Parameter Sistem Baru

| Key | Nilai awal | Fungsi |
|---|---|---|
| `available_now_offer_limit` | 5 | Jumlah maksimal pekerja yang ditawari satu order Available Now (D55) |
| `worker_presence_timeout_minutes` | 10 | Ambang presence basi sebelum pekerja dianggap offline (D57) |
| `schedule_conflict_buffer_minutes` | 30 | Jeda perjalanan antar order Scheduled (D41) |
| `email_retry_max_attempts` | 3 | Percobaan ulang pengiriman email yang gagal (D58) |
| `worker_location_move_threshold_meters` | 200 | Perpindahan minimum sebelum koordinat dikirim ulang (D66) |
| `worker_location_max_interval_minutes` | 5 | Batas waktu maksimum antar pengiriman koordinat walaupun tidak berpindah (D66) |
| `guest_chat_message_limit` | 20 | Batas pesan per `guest_token` (D77) |
| `guest_chat_ip_hourly_limit` | 50 | Batas pesan per alamat IP per jam (D77) |
| `guest_chat_daily_global_limit` | ditetapkan saat pengujian | Rem darurat seluruh lalu lintas chatbot tamu (D77) |
| `access_token_ttl_minutes` | 15 | Masa berlaku access token JWT (D76) |
| `refresh_token_ttl_days` | 30 | Masa berlaku refresh token (D76) |
| `listing_faq_max_items` | 10 | Batas butir FAQ per listing (D78) |
| `order_message_max_length` | 2000 | Batas panjang satu pesan dalam order (D79) |
| `order_message_rate_per_minute` | 20 | Batas pesan per menit per pengirim (D79) |
| `kyc_document_max_size_mb` | 5 | Batas ukuran satu dokumen e-KYC (D80) |
| `dispute_evidence_max_size_mb` | 5 | Batas ukuran satu bukti dispute (D80) |
| `orphan_upload_cleanup_hours` | 24 | Umur berkas tanpa baris basis data sebelum dibersihkan cron (D80) |
| `withdrawal_min_amount` | 50000 | Nominal minimum satu pengajuan withdrawal dalam rupiah (D84) |
| `withdrawal_admin_fee` | 6500 | Admin fee flat per pengajuan withdrawal dalam rupiah (D84) |

### 6.6 Endpoint Baru

**Pekerja dan pemetaan**

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| POST | `/providers/:id/worker-applications` | C | Melamar jadi pekerja, sekaligus mencentang listing |
| GET | `/providers/me/workers` | PR | Daftar pekerja dan pelamar |
| POST | `/providers/me/workers/:id/approve` | PR | Setujui pelamar beserta pemetaan finalnya |
| POST | `/providers/me/workers/:id/reject` | PR | Tolak pelamar |
| DELETE | `/providers/me/workers/:id` | PR | Keluarkan pekerja, jadi RESIGNED |
| PUT | `/providers/me/workers/:id/listings` | PR | Atur ulang pemetaan pekerja ke listing |
| PUT | `/providers/me/listings/:id/workers` | PR | Atur pemetaan dari sisi listing |
| PATCH | `/providers/me/workers/:id/assignments-setting` | PR | Ubah `accepts_assignments` |
| PATCH | `/orders/:id/assignment` | PR | Ganti penanggung jawab (D44) |
| PUT | `/orders/:id/crew` | PR | Atur pekerja pendamping, SCHEDULED saja (D69) |
| POST | `/providers/me/type-upgrade` | PR | Ajukan perubahan `provider_type` (D47) |
| GET | `/admin/type-upgrade-requests` | A | Antrean pengajuan perubahan tipe |

**Sisi pekerja**

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| PATCH | `/workers/me/availability` | W | Toggle `is_available`, wajib menyertakan koordinat |
| PATCH | `/workers/me/location` | W | Perbarui posisi terkini dan presence |
| GET | `/workers/me/orders` | W | Order yang ditugaskan dan yang sedang ditawarkan |
| POST | `/orders/:id/accept` | PR/W | Scheduled oleh pemilik. Available Now oleh pekerja maupun pemilik, siapa duluan (D70) |

**FAQ dan pesan dalam order**

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| POST | `/providers/me/kyc-documents` | C | Unggah dokumen e-KYC, **multipart** (D80) |
| POST | `/disputes/:id/evidences` | C/PR | Unggah bukti dispute, **multipart** (D80) |
| POST | `/uploads/signed-url` | C | Signed URL Storage, **hanya untuk foto listing** (D80) |
| GET | `/listings/:id/faqs` | P | Daftar FAQ sebuah listing (D78) |
| PUT | `/providers/me/listings/:id/faqs` | PR | Tulis ulang seluruh FAQ listing |
| GET | `/orders/:id/messages` | C/PR/W/A | Riwayat pesan, terpaginasi. Admin membaca saja |
| POST | `/orders/:id/messages` | C/PR/W | Kirim pesan, hanya selama masa aktif (D79) |
| PATCH | `/orders/:id/messages/read` | C/PR/W | Tandai pesan sisi lawan sudah dibaca |

**Usulan taksonomi**

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| POST | `/taxonomy-requests` | PR | Ajukan usulan, validasi bercabang per `request_type` |
| GET | `/taxonomy-requests/mine` | PR | Usulan milik sendiri beserta statusnya |
| GET | `/admin/taxonomy-requests` | A | Antrean usulan, dikelompokkan per sub-kategori dan atribut |
| PATCH | `/admin/taxonomy-requests/:id` | A | Setujui, tolak, atau tandai MERGED |

**Akun dan email**

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| POST | `/auth/refresh` | P | Tukar refresh token, sekaligus merotasinya (D76) |
| POST | `/auth/logout` | C | Cabut refresh token perangkat ini |
| POST | `/auth/logout-all` | C | Cabut seluruh refresh token milik user |
| GET | `/auth/sessions` | C | Daftar perangkat yang aktif |
| POST | `/chat/guest-sessions` | P | Mulai sesi chat tamu, mengembalikan `guest_token` (D77) |
| POST | `/auth/verify-email` | P | Verifikasi lewat token |
| POST | `/auth/resend-verification` | C | Kirim ulang, membatalkan token lama |
| POST | `/auth/forgot-password` | P | Selalu membalas sukses |
| POST | `/auth/reset-password` | P | Ganti password lewat token |
| PATCH | `/users/me/email` | C | Ajukan penggantian email, wajib password saat ini |
| POST | `/auth/confirm-email-change` | P | Konfirmasi lewat token dari inbox baru |
| DELETE | `/users/me/email-change` | C | Batalkan permintaan penggantian |

Kolom akses **W** adalah pekerja aktif, yaitu user yang punya baris `provider_workers` berstatus ACTIVE. Bukan role baru, melainkan hasil pengecekan di middleware, sama polanya dengan PR.

---

## 7. Keputusan Terbuka

**Tidak ada keputusan terbuka per versi 2.8.** Seluruh pertanyaan sebelumnya sudah ditutup:

| # | Pertanyaan | Ditutup oleh |
|---|---|---|
| 1 | Revisi dokumen usulan ide (Tabel Aktor Sistem) | A7, tidak direvisi |
| 1a | Opsi kustom bebas oleh provider | D81, ditolak (Pembimbing 1, 30 September 2026) |
| 1b | Provider membuat sub-kategori sendiri tanpa persetujuan admin | D82, ditolak (Pembimbing 1, 30 September 2026) |
| 2 | Nominal minimum withdrawal dan admin fee | D84 |
| 3 | Target angka UAT, akurasi chatbot, dan jumlah concurrent user | D85 |
| 4 | Dasar penetapan komisi 10 persen dan holding window 24 jam | D86 |

**Ditutup pada versi sebelumnya:** batas bayar mode Scheduled (oleh D43), verifikasi email wajib atau tidak (oleh D62), dan refresh token (oleh D76).

**Nilai yang menyusul, bukan keputusan terbuka:** `guest_chat_daily_global_limit`, ditetapkan pada fase chatbot (D85).

---

## 8. Hutang Teknis

### 8.1 Constraint SQL Manual

- [ ] **H1** Saldo wallet tidak boleh negatif
- [ ] **H2** Satu order satu pembayaran lunas dan satu invoice aktif
- [ ] **H3** Satu order satu ESCROW_HOLD dan satu ESCROW_RELEASE, selamanya
- [ ] **H4** Satu pekerja tidak boleh punya dua order in-flight **(direvisi, D40)**
- [ ] **H5** Konsistensi nominal order dan batas fee yang dikembalikan
- [ ] **H6** Ledger harus bergerak, rating 1 sampai 5, jarak check-in tidak negatif
- [ ] **H18** Index GIN untuk `listings.attributes`
- [ ] **H23** Eksklusivitas keanggotaan pekerja (D36)
- [ ] **H24** `assigned_worker_id` wajib terisi mulai status ACCEPTED (D42)
- [ ] **H32** Unique `(worker_id, listing_id)` pada `worker_listings` **(baru, D50)**
- [ ] **H33** Unique pada `verification_tokens.token_hash` **(baru, D63)**
- [ ] **H44** Unique `(order_id, worker_id)` pada `order_crew`, plus index `(worker_id)` **(baru, D69)**
- [ ] **H53** `chk_order_total_composition` pada `orders` **(baru, D73)**
- [ ] **H54** Unique `(listing_id, attribute_key, option_value)` pada `listing_option_prices` **(baru, D72)**
- [ ] **H62** Unique pada `refresh_tokens.token_hash` **(baru, D76)**
- [ ] **H63** `chk_chat_session_identity` pada `chat_sessions` **(baru, D77)**
- [ ] **H69** `chk_order_message_sender_role` dan `chk_order_message_content_length` **(baru, D79)**

### 8.2 Keamanan Kode Verifikasi dan Token

- [ ] **H7** Generate kode order pakai `crypto.randomInt`, bukan `Math.random`
- [ ] **H8** Tolak input kalau `verification_attempts >= 5` sampai `verification_locked_until` lewat. Increment counter sebelum membandingkan, bukan sesudah
- [ ] **H9** Terapkan `verification_expires_at`
- [ ] **H34** Token email pakai `crypto.randomBytes(32)`, disimpan sebagai hash SHA-256 **(baru, D63)**. Token tidak punya lockout seperti H8, jadi ruang tebakannya harus besar
- [ ] **H35** Kirim ulang token membatalkan token lama, dan ganti password membatalkan seluruh token PASSWORD_RESET milik user itu **(baru)**
- [ ] **H36** Rate limit ketat pada `resend-verification`, `forgot-password`, dan `users/me/email` **(baru)**. Tanpa ini endpoint tersebut jadi alat membanjiri inbox orang lain
- [ ] **H64** Rotasi refresh token pada setiap pemakaian, plus deteksi pemakaian ulang yang mencabut seluruh `family_id` **(baru, D76)**. Wajib punya test: pakai token yang sudah dicabut, pastikan seluruh rantai ikut mati
- [ ] **H65** Pencabutan seluruh refresh token saat ganti password **(baru, D76)**

### 8.3 Integrasi Eksternal

- [ ] **H10** Handler webhook pakai dua transaksi terpisah
- [ ] **H11** Pengambilan lock pakai UPDATE bersyarat atomik, sediakan pemulihan baris PROCESSING yang macet
- [ ] **H12** Simpan `paid_amount` dari callback terpisah dari `amount` yang ditagih
- [ ] **H13** Verifikasi header `x-callback-token` pada setiap webhook
- [ ] **H14** Gemini dipanggil dengan structured output atau function calling
- [ ] **H19** **Prioritas tinggi setelah D77.** Rate limiting chatbot tiga lapis: per `guest_token`, per alamat IP, dan rem global harian. Tanpa identitas login, endpoint chatbot terbuka untuk siapa saja sedangkan tiap pesan memanggil Gemini yang ada biayanya
- [ ] **H37** Pengiriman email dilakukan setelah commit, bukan di dalam transaksi **(baru, D58)**. Cron mengirim ulang baris FAILED maksimal tiga kali

### 8.4 Logika Service Layer yang Tidak Bisa Dijaga Database

- [ ] **H25** Pemeriksaan tumpang tindih jadwal pekerja (D41). Unique index tidak bisa memeriksa irisan rentang waktu. Wajib punya unit test, termasuk kasus batas: order berdempetan persis dan order yang hanya beririsan di buffer
- [ ] **H26** Pelepasan slot tentatif saat PAYMENT_EXPIRED atau CANCELLED (D43)
- [ ] **H27** Validasi minimal satu pekerja ACTIVE dengan `accepts_assignments = true` per provider (D39)
- [ ] **H28** Guard silang antar mode: tolak Available Now kalau ada jadwal pekerja yang akan datang dalam rentang `now + durasi + buffer`
- [ ] **H38** Klaim order Available Now pakai UPDATE bersyarat atomik **(baru, D55)**. Wajib punya integration test yang menembakkan dua klaim bersamaan, dan hasilnya harus tepat satu yang berhasil
- [ ] **H39** Listing tidak boleh berpindah dari DRAFT ke aktif kalau belum punya pekerja terpetakan **(baru, D53)**
- [ ] **H40** Cron mematikan toggle pekerja yang presence-nya basi **(baru, D57)**
- [ ] **H41** Guard `accept` memeriksa ulang pemetaan listing, status keanggotaan, dan kondisi in-flight, tidak mengandalkan daftar penerima notifikasi **(baru, D55)**
- [ ] **H45** Pendamping ikut disaring dari pencocokan Available Now dan dropdown penugasan Scheduled **(baru, D69)**. Database tidak menjaganya, karena `uniq_inflight_order_per_worker` hanya melihat `assigned_worker_id`
- [ ] **H46** Pendamping ikut pemeriksaan bentrok jadwal yang sama dengan penanggung jawab **(baru, D69)**
- [ ] **H47** Tolak penambahan pendamping pada order AVAILABLE_NOW **(baru, D70)**. Satu guard, tidak perlu memeriksa siapa yang menerima
- [ ] **H48** Atribut wajib baru memblokir penyimpanan listing lama pada kali berikutnya diedit, lewat penanda `attributes_need_update` **(baru, D67)**. Validasi tidak pernah dijalankan saat baca
- [ ] **H49** Presence diturunkan dari koneksi Socket.IO, dengan toleransi putus sinyal sesaat **(baru, D65)**. Cron yang mematikan toggle (H40) memakai penanda ini, bukan umur koordinat
- [ ] **H55** **Prioritas tinggi.** Harga dihitung ulang sepenuhnya di server dari `listing_option_prices`, tidak pernah menerima nominal dari client **(baru, D73)**. Wajib punya test yang mengirim total palsu lewat API dan memastikan ditolak
- [ ] **H56** Validasi bercabang pada `POST /taxonomy-requests` **(baru, D74)**. NEW_ATTRIBUTE wajib `subcategory_id`, NEW_ATTRIBUTE_OPTION wajib `subcategory_id` dan `attribute_key`. Validasi bersyarat seperti ini gampang lolos kalau hanya mengandalkan skema validasi datar
- [ ] **H57** Batas 3 usulan aktif per provider dihitung lintas jenis **(baru, D74)**
- [ ] **H70** Masa aktif pesan dalam order ditegakkan service layer **(baru, D79)**. Hanya boleh mengirim saat status order antara ACCEPTED dan sebelum `settlement_due_at` lewat. Setelah itu read-only, bukan terhapus
- [ ] **H71** Pengirim wajib peserta order itu **(baru, D79)**: client pemilik order, pemilik provider, atau `assigned_worker_id`. Pendamping dan pekerja lain di usaha yang sama DITOLAK, sama polanya dengan `ASSIGNEE_ONLY_TRANSITIONS` di state machine
- [ ] **H72** Rate limit pengiriman pesan per pengirim **(baru, D79)**
- [ ] **H73** Batas jumlah butir FAQ per listing **(baru, D78)**
- [ ] **H78** Validasi **magic bytes** pada unggahan multipart **(baru, D80)**, bukan `Content-Type` dari client dan bukan ekstensi nama berkas. Wajib punya test yang mengunggah berkas non-gambar bernama `.jpg` dan memastikan ditolak
- [ ] **H79** Urutan unggah multipart: validasi, kirim ke Storage, baru tulis baris basis data **(baru, D80)**. Kalau Storage gagal, jangan tinggalkan baris setengah jadi
- [ ] **H80** Cron pembersih berkas yatim di bucket foto listing **(baru, D80)**, berkas lebih tua dari `orphan_upload_cleanup_hours` yang tidak punya baris `listing_photos`
- [ ] **H83** Validasi pengajuan withdrawal **(baru, D84)**: `amount` minimal `withdrawal_min_amount`, `admin_fee` diambil dari `withdrawal_admin_fee` saat pengajuan, dan `net_amount` dihitung di server. Request tidak pernah memuat nominal fee

### 8.5 Persiapan Data Pengujian

- [ ] **H15** Kumpulkan 30 sampai 50 skenario percakapan berlabel untuk mengukur akurasi intent extraction. Mulai sekarang, jangan tunggu bulan ke-5
- [ ] **H68** Ukur konversi sesi chat tamu jadi pendaftaran akun lewat `chat_sessions.claimed_at` **(baru, D77)**. Metrik ini menjawab pertanyaan kegunaan chatbot dengan angka
- [ ] **H16** Siapkan data simulasi, termasuk beberapa usaha BUSINESS dengan jumlah pekerja berbeda dan pemetaan listing yang tumpang tindih, supaya skenario order paralel dan perebutan bisa diuji
- [ ] **H20** Jalankan kueri verifikasi V1 sampai V5 setelah seeding dan setelah pengujian
- [ ] **H84** Susun kuesioner UAT per aktor dan skenario uji masing-masing, lalu rencanakan rekrutmen 30 responden sesuai komposisi D85 **(baru)**

### 8.6 Yang Harus Ditulis di Laporan sebagai Batasan

- [ ] **H17** Validasi geolokasi berbasis browser dapat dipalsukan lewat DevTools. Sertakan mitigasinya: kode verifikasi 6 digit yang hanya dipegang client yang hadir secara fisik
- [ ] **H21** Perilaku cold start chatbot: pengguna baru tanpa riwayat hanya mendapat intent extraction
- [ ] **H66** Chatbot tamu tidak melakukan personalisasi sama sekali **(baru, D77)**. Lokasi diambil dari izin geolokasi browser per percakapan, bukan dari `user_addresses`, dan `personalization_snapshot` tetap null
- [ ] **H67** Jawaban chatbot ke tamu tidak boleh memuat data pribadi penyedia seperti nomor telepon atau alamat persis **(baru, D77)**, hanya yang tampil di halaman listing publik
- [ ] **H22** Kode verifikasi order **dienkripsi**, bukan di-hash, beserta alasannya, dan bedanya dengan token email yang di-hash
- [ ] **H29** Platform memverifikasi usaha, usaha bertanggung jawab atas pekerjanya (D34)
- [ ] **H30** Satu orang hanya boleh punya satu keanggotaan aktif, multi-provider masuk saran pengembangan (D36)
- [ ] **H31** Bentrok jadwal antar order SCHEDULED dijaga service layer, bukan database, karena unique index tidak bisa memeriksa irisan rentang waktu. Solusi kedap memerlukan `EXCLUDE` constraint dengan `btree_gist`, tidak sebanding dengan cakupan penelitian ini
- [ ] **H42** **Tanpa push notification ke perangkat (FCM sudah jadi non-goal)**, pekerja harus membiarkan tab terbuka untuk menerima tawaran Available Now. Mitigasinya aturan presence basi (D57): sistem tidak pernah menawarkan order ke pekerja yang koneksinya sudah mati
- [ ] **H43** Pelemparan berantai order Available Now tidak diimplementasikan, masuk saran pengembangan (D56)
- [ ] **H50** Sistem mencatat satu penanggung jawab per order **(baru, D68)**. Pengerahan tenaga kerja tambahan di lapangan adalah kewenangan internal penyedia, sejalan dengan kebijakan penggajian yang juga di luar cakupan. Pencatatan kru per order masuk saran pengembangan
- [ ] **H51** Pencatatan pekerja pendamping hanya tersedia pada mode Scheduled **(baru, D70)**. Pada mode Available Now, penyedia yang mengerahkan pekerja tambahan perlu menonaktifkan status ketersediaan pekerja tersebut secara manual
- [ ] **H52** Platform hanya melayani jasa yang dikerjakan di lokasi client **(baru, D71)**. Jasa digital dan remote di luar cakupan karena tidak punya kedatangan fisik yang bisa divalidasi geolokasi
- [ ] **H74** Percakapan pra-order tidak disediakan **(baru, D78, D79)**. Kebutuhan bertanya dikurangi secara struktural lewat atribut SPEC dan FAQ listing, bukan dilayani dengan menambah jalur komunikasi. Alasan lengkapnya di Bagian 4B.5
- [ ] **H75** Pesan dalam order hanya teks, tanpa lampiran **(baru, D79)**. Lampiran masuk saran pengembangan
- [ ] **H76** Isi FAQ ditulis provider dan tidak dimoderasi otomatis **(baru, D78)**. Admin bisa menonaktifkan lewat `is_active` kalau ada laporan
- [ ] **H77** Jalur pesan dibatasi per order dan punya masa aktif, bukan jalur pribadi permanen **(baru, D79)**. Ini mitigasi disintermediasi: escrow hanya bermakna kalau transaksinya tetap di dalam platform
- [ ] **H58** Penambahan option pada atribut merupakan kewenangan admin **(baru, D74)**. Provider tidak boleh menambah sendiri karena kosakata yang tidak seragam merusak filter lintas penyedia. Saluran usulan disediakan sebagai gantinya
- [ ] **H59** Deteksi kesamaan antara usulan provider dan taksonomi yang sudah ada dilakukan manual oleh admin, dibantu daftar yang ditampilkan dan saran kemiripan **(baru, D74)**. Sistem tidak melakukan pencocokan otomatis karena kesamaan makna tidak dapat disimpulkan dari kesamaan teks
- [ ] **H60** Satu order sama dengan satu kedatangan **(baru, D75)**. Jasa yang butuh beberapa kunjungan, seperti trial makeup sebelum hari pernikahan, dipesan sebagai beberapa order. Order multi-kunjungan masuk saran pengembangan
- [ ] **H61** Sistem memvalidasi selesainya pekerjaan di lokasi, bukan penyerahan hasil **(baru, D75)**. Untuk jasa yang hasilnya diserahkan belakangan, seperti foto prewedding, `waktu_pengerjaan_hari` hanya informasional dan tidak menahan escrow. Penyerahan hasil bertahap masuk saran pengembangan
- [ ] **H81** Biaya metode pembayaran dari payment gateway ditanggung platform dari komisi dan tidak dihitung dalam alur dana **(baru, D83)**. Analisis kelayakan bisnis berada di luar ruang lingkup penelitian. Biaya layanan terpisah untuk client masuk saran pengembangan
- [ ] **H82** Admin fee withdrawal berupa nilai flat yang mengikuti perkiraan biaya payout Xendit **(baru, D84)**. Untuk nominal di atas Rp250.000 biaya sebenarnya sedikit lebih besar dan selisihnya ditanggung platform

---

## 9. Progres Artefak Desain

| # | Artefak | Status | Catatan |
|---|---|---|---|
| 1 | Skema basis data (DBML) | Selesai, versi 2.8 | 34 tabel, 35 enum |
| 2 | `schema.prisma` dan `migration-constraints.sql` | Selesai, versi 2.8 dan 2.6 | |
| 3 | State machine order | Selesai, versi 2.6 | Tidak terdampak versi 2.8 |
| 4 | Kontrak REST API (PRD) | Selesai, versi 2.2 | |
| 5 | Diagram UML | Belum | Aktor jadi empat |
| 6 | Diagram Konteks dan DFD | Belum | Aktor jadi empat, tambah entitas eksternal layanan email |
| 7 | Conversation flow dan system prompt chatbot | Belum | |
| 8 | Desain antarmuka (Figma) | Belum | Tambah dashboard pekerja dan halaman pemetaan |

**Aset yang bisa dipakai ulang:** dokumen test case `PPL_A_2305551065_UAS.docx` berisi 127 test case pada 15 modul fungsional dan 1 modul performa.

---

## 10. Klaim yang Sudah Diverifikasi ke Sumber Eksternal

| Klaim | Hasil |
|---|---|
| Status payout Xendit mencakup REVERSED | Benar. ACCEPTED, REQUESTED, SUCCEEDED, FAILED, CANCELLED, REVERSED |
| `failure_code` payout Xendit | Benar. INSUFFICIENT_BALANCE, INVALID_DESTINATION, REJECTED_BY_CHANNEL, TEMPORARY_TRANSFER_ERROR, TRANSFER_ERROR, UNKNOWN_BANK_NETWORK_ERROR, DESTINATION_MAXIMUM_LIMIT |
| Xendit tidak menyediakan header `webhook-id` | Benar. Kunci idempotency harus disusun sendiri |
| Xendit melakukan retry webhook | Benar. Sampai 6 kali dengan exponential backoff |

Sumber: dokumentasi Xendit Payout Webhook Notification dan Handling Webhooks.

---

## 11. Langkah Berikutnya

1. Verifikasi Fase 2 (jalankan seluruh test, lalu commit), kemudian centang hutang teknis yang sudah tertutup oleh Fase 1 dan Fase 2
2. Lanjut Fase 3 sesuai PRD Bagian 9
3. Susun data simulasi untuk dua belas sub-kategori di Lampiran B, termasuk skenario perebutan Available Now dan pendamping pada dokumentasi acara
4. Riset ringan rentang harga pasaran untuk dua belas sub-kategori tersebut, catat sumbernya
5. Paralel sejak sekarang: kumpulkan H15 sedikit demi sedikit setiap minggu, dan mulai siapkan instrumen UAT (H84)

---

## Lampiran A. Riwayat Revisi

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 14 September 2026 | Versi awal. A1 sampai A6, S1 sampai S11, D1 sampai D30 |
| 2.0 | 19 September 2026 | Penambahan entitas tenaga kerja dari masukan Pembimbing 1 tanggal 18 September 2026. D31 sampai D49, alur sistem end-to-end, dampak skema, H23 sampai H31 |
| 2.1 | 19 September 2026 | Pemetaan pekerja ke listing (D50 sampai D53), penerimaan order per mode dan pola siapa cepat dia dapat (D54 sampai D57), notifikasi email dan verifikasi akun (D58 sampai D62), tabel token dan penggantian email (D63 dan D64). S12, lima enum baru, tiga tabel baru, empat parameter sistem, H32 sampai H43. Keputusan terbuka soal verifikasi email ditutup |
| 2.2 | 24 September 2026 | Presence dari koneksi Socket.IO dan pembaruan lokasi berbasis perpindahan (D65, D66, merevisi D57). Aturan perubahan definisi atribut dinamis (D67). Satu penanggung jawab per order dan tabel `order_crew` untuk pendamping, khusus Scheduled (D68, D69). Available Now boleh diterima pemilik maupun pekerja (D70, merevisi D54). Cakupan contoh jasa empat kategori dan dua belas sub-kategori (D71). Satu tabel baru, dua parameter sistem, H44 sampai H52 |
| 2.3 | 24 September 2026 | Atribut berbayar dengan peran SPEC dan OPTION (D72). Penamaan nominal `listing_base_amount` dan `options_amount`, harga dihitung server (D73). Usulan taksonomi provider tiga jenis lewat `taxonomy_requests` (D74). Dua tabel baru, empat enum baru, H53 sampai H59. Definisi atribut Otomotif di Lampiran B. Dua pertanyaan ditunda ke Pembimbing 1 |
| 2.4 | 29 September 2026 | Tiga batas cakupan order (D75): seluruh jasa on-site, satu order satu kedatangan, penyerahan hasil digital di luar escrow. H60 dan H61. Definisi atribut dua belas sub-kategori selesai seluruhnya di Lampiran B |
| 2.5 | 29 September 2026 | Refresh token dengan rotasi dan deteksi pemakaian ulang (D76), menutup keputusan terbuka nomor 3. Chatbot terbuka untuk tamu dengan personalisasi dinonaktifkan (D77, merevisi D26, arahan Pembimbing 1). Satu tabel baru, lima parameter sistem, H62 sampai H68 |
| 2.6 | 30 September 2026 | FAQ per listing (D78) dan pesan dalam order (D79). Percakapan pra-order ditolak dengan alasan yang dicatat. Dua tabel baru tanpa enum baru, tiga parameter sistem, H69 sampai H77 |
| 2.7 | 30 September 2026 | Pola unggah berkas dipisah per sifat (D80): e-KYC dan bukti dispute lewat multipart dengan validasi magic bytes, foto listing tetap signed URL. Celah berkas yatim ditutup lewat cron. Tiga parameter sistem, H78 sampai H80 |
| 2.8 | 15 Oktober 2026 | Seluruh keputusan terbuka ditutup. Usulan ide tidak direvisi (A7). Opsi kustom bebas dan sub-kategori buatan provider ditolak, dikukuhkan Pembimbing 1 pada bimbingan 30 September 2026 (D81, D82). Biaya payment gateway ditanggung platform (D83), withdrawal minimum Rp50.000 dengan admin fee Rp6.500 (D84), target pengujian (D85), dasar komisi dan holding window (D86). Dua parameter sistem, H81 sampai H84. Rumusan D25 diperjelas: dispute sejak ARRIVED. Perapian status artefak, rujukan silang, dan urutan riwayat revisi. Seluruh artefak lain disinkronkan. Tanpa perubahan skema |

---

## Lampiran B. Definisi Atribut per Sub-Kategori

Status: **selesai seluruhnya**, dua belas sub-kategori di empat kategori.

Pola yang dipakai di seluruh sub-kategori:

- Setiap sub-kategori punya minimal satu atribut OPTION, kalau tidak fitur harga bertingkat jadi mubazir
- `durasi_estimasi` selalu SPEC, wajib, dan tidak difilter, karena mengisi `snapshot_duration_minutes` yang dipakai pemeriksaan bentrok jadwal (D41)
- Atribut yang tidak memengaruhi harga tapi menentukan ekspektasi client tetap dimasukkan sebagai SPEC
- Jumlah atribut sengaja tidak seragam antar sub-kategori, karena keseragaman justru melemahkan klaim tujuan penelitian nomor 1

### B.1 Cuci Mobil Panggilan

Mode: kedua. Rentang harga acuan: 50.000 sampai 150.000

| Key | Label | Tipe | Peran | pricing_mode | Wajib | Filter |
|---|---|---|---|---|---|---|
| `jenis_kendaraan` | Jenis kendaraan | SELECT | OPTION | FLAT_PER_OPTION | ya | ya |
| `layanan_tambahan` | Layanan tambahan | MULTISELECT | OPTION | FLAT_PER_OPTION | tidak | ya |
| `sumber_air` | Sumber air | SELECT | SPEC | NONE | ya | ya |
| `durasi_estimasi` | Estimasi pengerjaan | NUMBER (menit) | SPEC | NONE | ya | tidak |

```
jenis_kendaraan   Sedan, SUV, MPV, Hatchback, Pickup, Van
                  contoh delta: Sedan +0, Hatchback +0, MPV +15.000,
                                SUV +20.000, Pickup +20.000, Van +30.000

layanan_tambahan  Poles Body, Vacuum Interior, Semir Ban,
                  Cuci Mesin, Pembersih Jamur Kaca
                  contoh delta: +25.000 sampai +50.000 per item

sumber_air        Dibawa penyedia, Disediakan client
durasi_estimasi   validation_rule { min: 30, max: 180 }
```

`sumber_air` adalah contoh atribut SPEC yang gunanya menyelaraskan ekspektasi, bukan menghitung harga. Sering jadi sumber kekecewaan client kalau tidak disebut di awal.

### B.2 Servis Motor Panggilan

Mode: kedua, condong Available Now. Rentang harga acuan: 50.000 sampai 200.000

| Key | Label | Tipe | Peran | pricing_mode | Wajib | Filter |
|---|---|---|---|---|---|---|
| `jenis_servis` | Jenis servis | SELECT | OPTION | FLAT_PER_OPTION | ya | ya |
| `tipe_motor` | Tipe motor yang dilayani | MULTISELECT | SPEC | NONE | ya | ya |
| `sparepart` | Penyediaan sparepart | SELECT | SPEC | NONE | ya | ya |
| `durasi_estimasi` | Estimasi pengerjaan | NUMBER (menit) | SPEC | NONE | ya | tidak |

```
jenis_servis     Servis Ringan, Servis Besar, Ganti Oli,
                 Ganti Kampas Rem, Servis CVT, Tune Up
                 contoh delta: Ganti Oli +0 sampai Servis Besar +150.000

tipe_motor       Bebek, Matic, Sport, Motor Besar
sparepart        Disediakan penyedia, Disediakan client, Keduanya bisa
durasi_estimasi  validation_rule { min: 30, max: 240 }
```

Sub-kategori ini adalah **contoh utama untuk mempertahankan klaim Hybrid Approach di sidang.** Bandingkan `tipe_motor` (MULTISELECT, SPEC, tidak memengaruhi harga) dengan `jenis_kendaraan` di B.1 (SELECT, OPTION, memengaruhi harga). Dua atribut yang namanya mirip di kategori yang sama, tapi peran dan perilakunya berbeda. Skema kolom konvensional tidak bisa menampung perbedaan semacam ini tanpa menambah tabel per jasa.

### B.3 Ganti Oli Panggilan

Mode: kedua. Rentang harga acuan: 40.000 sampai 120.000

| Key | Label | Tipe | Peran | pricing_mode | Wajib | Filter |
|---|---|---|---|---|---|---|
| `jenis_kendaraan` | Jenis kendaraan | SELECT | SPEC | NONE | ya | ya |
| `oli_disediakan` | Oli disediakan penyedia | BOOLEAN | OPTION | FLAT_PER_OPTION | tidak | ya |

Dua atribut saja, dan itu disengaja. Gunanya menjawab pertanyaan yang hampir pasti muncul: apakah Hybrid Approach memaksa semua penyedia mengisi banyak kolom? Jawabannya tidak, dan sub-kategori ini buktinya. Jasa sederhana tetap sederhana, definisi atributnya yang menyesuaikan.

`oli_disediakan` sebagai BOOLEAN berbayar melengkapi cakupan `pricing_mode` di kategori ini. PER_UNIT tidak dipakai di Otomotif, dan muncul di kategori lain seperti Servis AC (jumlah unit) dan Foto Produk (jumlah item).

### B.4 Foto Produk

Mode: Scheduled. Rentang harga acuan: 150.000 sampai 750.000

| Key | Label | Tipe | Peran | pricing_mode | Wajib | Filter |
|---|---|---|---|---|---|---|
| `jumlah_item` | Jumlah item difoto | NUMBER | OPTION | **PER_UNIT** | ya | tidak |
| `gaya_foto` | Gaya pemotretan | SELECT | OPTION | FLAT_PER_OPTION | ya | ya |
| `tambahan` | Layanan tambahan | MULTISELECT | OPTION | FLAT_PER_OPTION | tidak | ya |
| `durasi_estimasi` | Estimasi pengerjaan | NUMBER (menit) | SPEC | NONE | ya | tidak |

```
jumlah_item      validation_rule { min: 1, max: 50 }
                 contoh delta: 25.000 per item

gaya_foto        Katalog Latar Putih, Flat Lay, Lifestyle, Detail Makro
                 contoh delta: Katalog +0, Flat Lay +50.000,
                               Lifestyle +100.000, Detail Makro +75.000

tambahan         Edit Retouch Lanjutan, Video Pendek, Foto 360 Derajat
                 contoh delta: +100.000 sampai +250.000

durasi_estimasi  validation_rule { min: 60, max: 480 }
```

`jumlah_item` adalah contoh PER_UNIT yang paling alami. Harga listing jadi biaya dasar pemotretan, lalu tiap item menambah, sehingga provider tidak perlu membuat listing terpisah untuk tiap jumlah.

Atribut `lokasi_pemotretan` sempat dipertimbangkan lalu **dibuang**, karena nilai "Di studio penyedia" membalik arah kedatangan dan menabrak batas cakupan D75.

### B.5 Foto Prewedding

Mode: Scheduled. Rentang harga acuan: 1.500.000 sampai 7.000.000

| Key | Label | Tipe | Peran | pricing_mode | Wajib | Filter |
|---|---|---|---|---|---|---|
| `paket_durasi` | Durasi pemotretan | SELECT | OPTION | FLAT_PER_OPTION | ya | ya |
| `jumlah_lokasi` | Jumlah lokasi | NUMBER | OPTION | **PER_UNIT** | ya | tidak |
| `tambahan` | Layanan tambahan | MULTISELECT | OPTION | FLAT_PER_OPTION | tidak | ya |
| `jumlah_foto_edit` | Jumlah foto diedit | NUMBER | SPEC | NONE | ya | ya |
| `gaya_fotografi` | Gaya fotografi | MULTISELECT | SPEC | NONE | ya | ya |
| `waktu_pengerjaan_hari` | Hasil jadi dalam | NUMBER (hari) | SPEC | NONE | ya | ya |
| `durasi_estimasi` | Estimasi di lokasi | NUMBER (menit) | SPEC | NONE | ya | tidak |

```
paket_durasi           Setengah Hari (4 jam), Sehari Penuh (8 jam)
                       contoh delta: Setengah Hari +0,
                                     Sehari Penuh +2.000.000

jumlah_lokasi          validation_rule { min: 1, max: 4 }
                       contoh delta: 500.000 per lokasi tambahan

tambahan               Sewa Gaun, Makeup Artist, Drone, Album Cetak,
                       Video Sinematik
                       contoh delta: +500.000 sampai +2.500.000

jumlah_foto_edit       validation_rule { min: 10, max: 300 }
gaya_fotografi         Klasik, Candid, Editorial, Sinematik, Tradisional
waktu_pengerjaan_hari  validation_rule { min: 3, max: 60 }
durasi_estimasi        validation_rule { min: 120, max: 600 }
```

Sub-kategori beratribut paling banyak di seluruh dua belas, disengaja sebagai kontras terhadap ganti oli yang hanya dua. Tujuh atribut dengan lima tipe data berbeda dalam satu sub-kategori, tanpa satu pun kolom tambahan di skema.

`waktu_pengerjaan_hari` hanya informasional dan tidak menahan escrow, sesuai batas ketiga D75.

### B.6 Dokumentasi Acara

Mode: Scheduled. Rentang harga acuan: 1.000.000 sampai 5.000.000

| Key | Label | Tipe | Peran | pricing_mode | Wajib | Filter |
|---|---|---|---|---|---|---|
| `jenis_acara` | Jenis acara | SELECT | OPTION | FLAT_PER_OPTION | ya | ya |
| `durasi_liputan` | Durasi liputan | SELECT | OPTION | FLAT_PER_OPTION | ya | ya |
| `tambahan` | Layanan tambahan | MULTISELECT | OPTION | FLAT_PER_OPTION | tidak | ya |
| `jenis_dokumentasi` | Jenis dokumentasi | MULTISELECT | SPEC | NONE | ya | ya |
| `waktu_pengerjaan_hari` | Hasil jadi dalam | NUMBER (hari) | SPEC | NONE | ya | ya |
| `durasi_estimasi` | Estimasi di lokasi | NUMBER (menit) | SPEC | NONE | ya | tidak |

```
jenis_acara            Ulang Tahun, Seminar, Wisuda, Gathering Perusahaan,
                       Pernikahan, Upacara Keagamaan
                       contoh delta: Ulang Tahun +0 sampai
                                     Pernikahan +1.500.000

durasi_liputan         2 Jam, 4 Jam, 8 Jam, Dua Hari
                       contoh delta: 2 Jam +0 sampai Dua Hari +3.000.000

tambahan               Cetak Instan di Lokasi, Live Streaming, Drone,
                       Same Day Edit, Photobooth
jenis_dokumentasi      Foto, Video, Foto dan Video
waktu_pengerjaan_hari  validation_rule { min: 1, max: 45 }
```

**Sub-kategori ini adalah contoh utama aturan pendamping (D69).** Order dokumentasi pernikahan ditugaskan ke satu penanggung jawab, dua rekannya dicentang sebagai pendamping, dan ketersediaan mereka ikut terblokir. Pakai kasus ini saat demo.

### B.7 Makeup Artist Acara

Mode: Scheduled. Rentang harga acuan: 150.000 sampai 750.000. Contoh penyedia INDIVIDUAL.

| Key | Label | Tipe | Peran | pricing_mode | Wajib | Filter |
|---|---|---|---|---|---|---|
| `jumlah_orang` | Jumlah orang dirias | NUMBER | OPTION | **PER_UNIT** | ya | tidak |
| `jenis_acara` | Jenis acara | SELECT | OPTION | FLAT_PER_OPTION | ya | ya |
| `tambahan` | Layanan tambahan | MULTISELECT | OPTION | FLAT_PER_OPTION | tidak | ya |
| `kelas_produk` | Kelas produk kosmetik | SELECT | SPEC | NONE | ya | ya |
| `durasi_estimasi` | Estimasi pengerjaan | NUMBER (menit) | SPEC | NONE | ya | tidak |

```
jumlah_orang     validation_rule { min: 1, max: 15 }
                 contoh delta: 150.000 per orang

jenis_acara      Wisuda, Pesta, Pemotretan, Acara Kantor, Lamaran
                 contoh delta: Wisuda +0, Pesta +50.000,
                               Pemotretan +100.000

tambahan         Penataan Rambut, Sanggul, Bulu Mata,
                 Sewa Softlens, Touch Up di Lokasi
                 contoh delta: +50.000 sampai +150.000

kelas_produk     Reguler, Premium, Hypoallergenic
durasi_estimasi  validation_rule { min: 45, max: 300 }
```

`kelas_produk` sengaja SPEC, bukan OPTION. Seorang perias punya satu set produk dan memakainya untuk semua client, jadi ini informasi tentang dirinya, bukan pilihan yang client ganti per pesanan.

### B.8 Makeup Pengantin

Mode: Scheduled. Rentang harga acuan: 1.500.000 sampai 10.000.000

| Key | Label | Tipe | Peran | pricing_mode | Wajib | Filter |
|---|---|---|---|---|---|---|
| `paket` | Paket riasan | SELECT | OPTION | FLAT_PER_OPTION | ya | ya |
| `jumlah_pendamping` | Jumlah pendamping dirias | NUMBER | OPTION | **PER_UNIT** | tidak | tidak |
| `tambahan` | Layanan tambahan | MULTISELECT | OPTION | FLAT_PER_OPTION | tidak | ya |
| `gaya_riasan` | Gaya riasan yang dikuasai | MULTISELECT | SPEC | NONE | ya | ya |
| `durasi_estimasi` | Estimasi pengerjaan | NUMBER (menit) | SPEC | NONE | ya | tidak |

```
paket              Akad Saja, Resepsi Saja, Akad dan Resepsi
                   contoh delta: Akad Saja +0, Resepsi Saja +500.000,
                                 Akad dan Resepsi +2.500.000

jumlah_pendamping  validation_rule { min: 0, max: 10 }
                   contoh delta: 200.000 per orang

tambahan           Sewa Gaun, Sanggul Tradisional, Penataan Rambut
                   Pendamping, Touch Up Sepanjang Acara, Aksesori
                   contoh delta: +300.000 sampai +1.500.000

gaya_riasan        Modern, Tradisional, Natural, Bold
durasi_estimasi    validation_rule { min: 90, max: 480 }
```

Trial makeup **tidak** dijadikan opsi berbayar di sini, melainkan listing terpisah, sesuai batas kedua D75.

### B.9 Potong Rambut Panggilan

Mode: kedua. Rentang harga acuan: 50.000 sampai 200.000

| Key | Label | Tipe | Peran | pricing_mode | Wajib | Filter |
|---|---|---|---|---|---|---|
| `jenis_layanan` | Jenis layanan | SELECT | OPTION | FLAT_PER_OPTION | ya | ya |
| `jumlah_orang` | Jumlah orang | NUMBER | OPTION | **PER_UNIT** | ya | tidak |
| `durasi_estimasi` | Estimasi pengerjaan | NUMBER (menit) | SPEC | NONE | ya | tidak |

```
jenis_layanan    Potong Dewasa, Potong Anak, Potong dan Keramas,
                 Cukur Jenggot, Potong dan Pewarnaan
                 contoh delta: Potong Dewasa +0 sampai
                               Pewarnaan +150.000

jumlah_orang     validation_rule { min: 1, max: 10 }
                 contoh delta: 60.000 per orang
durasi_estimasi  validation_rule { min: 20, max: 180 }
```

Kombinasi SELECT berbayar dengan PER_UNIT membuat satu listing melayani satu orang maupun satu keluarga tanpa listing terpisah.

### B.10 Servis AC

Mode: kedua. Rentang harga acuan: 75.000 sampai 600.000

| Key | Label | Tipe | Peran | pricing_mode | Wajib | Filter |
|---|---|---|---|---|---|---|
| `jenis_pekerjaan` | Jenis pekerjaan | SELECT | OPTION | FLAT_PER_OPTION | ya | ya |
| `jumlah_unit` | Jumlah unit AC | NUMBER | OPTION | **PER_UNIT** | ya | tidak |
| `kapasitas_pk` | Kapasitas PK | SELECT | OPTION | FLAT_PER_OPTION | ya | ya |
| `tambahan` | Layanan tambahan | MULTISELECT | OPTION | FLAT_PER_OPTION | tidak | ya |
| `merek_dilayani` | Merek yang dilayani | MULTISELECT | SPEC | NONE | ya | ya |
| `durasi_estimasi` | Estimasi pengerjaan | NUMBER (menit) | SPEC | NONE | ya | tidak |

```
jenis_pekerjaan  Cuci AC, Isi Freon, Bongkar Pasang, Perbaikan,
                 Pengecekan Rutin
                 contoh delta: Cuci AC +0, Isi Freon +150.000,
                               Bongkar Pasang +200.000

jumlah_unit      validation_rule { min: 1, max: 20 }
                 contoh delta: 75.000 per unit

kapasitas_pk     0.5 PK, 1 PK, 1.5 PK, 2 PK, Di atas 2 PK
                 contoh delta: 0.5 PK +0 sampai Di atas 2 PK +100.000

tambahan         Cuci Outdoor Unit, Pembersihan Pipa, Vakum Sistem
merek_dilayani   Daikin, Panasonic, LG, Sharp, Samsung, Gree, Polytron
durasi_estimasi  validation_rule { min: 30, max: 480 }
```

Sub-kategori paling padat secara perhitungan harga: PER_UNIT ditambah dua SELECT berbayar dalam satu order. **Pakai kasus ini sebagai contoh utama di test perhitungan server (H55)**, misalnya tiga unit AC 2 PK untuk isi freon.

### B.11 Tukang Listrik

Mode: kedua, condong Available Now. Rentang harga acuan: 75.000 sampai 500.000

| Key | Label | Tipe | Peran | pricing_mode | Wajib | Filter |
|---|---|---|---|---|---|---|
| `jenis_pekerjaan` | Jenis pekerjaan | SELECT | OPTION | FLAT_PER_OPTION | ya | ya |
| `jumlah_titik` | Jumlah titik | NUMBER | OPTION | **PER_UNIT** | tidak | tidak |
| `material` | Penyediaan material | SELECT | SPEC | NONE | ya | ya |
| `layanan_darurat` | Melayani panggilan darurat | BOOLEAN | SPEC | NONE | ya | ya |
| `durasi_estimasi` | Estimasi pengerjaan | NUMBER (menit) | SPEC | NONE | ya | tidak |

```
jenis_pekerjaan  Perbaikan Korsleting, Pasang Stop Kontak, Pasang Lampu,
                 Instalasi Baru, Pengecekan Instalasi, Pasang MCB
                 contoh delta: Pengecekan +0 sampai
                               Instalasi Baru +300.000

jumlah_titik     validation_rule { min: 1, max: 30 }
                 contoh delta: 50.000 per titik
material         Disediakan penyedia, Disediakan client, Keduanya bisa
durasi_estimasi  validation_rule { min: 30, max: 360 }
```

`layanan_darurat` sebagai BOOLEAN yang difilter penting untuk demo Available Now. Client yang lampunya mati malam hari memfilter ini dan langsung melihat siapa yang melayani, sehingga mode Available Now terbukti punya alasan ada.

### B.12 Servis Mesin Cuci

Mode: Scheduled. Rentang harga acuan: 100.000 sampai 500.000

| Key | Label | Tipe | Peran | pricing_mode | Wajib | Filter |
|---|---|---|---|---|---|---|
| `jenis_pekerjaan` | Jenis pekerjaan | SELECT | OPTION | FLAT_PER_OPTION | ya | ya |
| `tipe_mesin` | Tipe mesin cuci | SELECT | OPTION | FLAT_PER_OPTION | ya | ya |
| `merek_dilayani` | Merek yang dilayani | MULTISELECT | SPEC | NONE | ya | ya |
| `garansi_hari` | Garansi pengerjaan | NUMBER (hari) | SPEC | NONE | tidak | ya |
| `durasi_estimasi` | Estimasi pengerjaan | NUMBER (menit) | SPEC | NONE | ya | tidak |

```
jenis_pekerjaan  Pengecekan, Servis Ringan, Ganti Sparepart,
                 Perbaikan Mesin, Pembersihan Menyeluruh
                 contoh delta: Pengecekan +0 sampai
                               Perbaikan Mesin +250.000

tipe_mesin       Bukaan Atas 1 Tabung, Bukaan Atas 2 Tabung,
                 Bukaan Depan, Mesin Cuci dan Pengering
                 contoh delta: 1 Tabung +0 sampai
                               Cuci dan Pengering +150.000

merek_dilayani   Sharp, LG, Samsung, Polytron, Electrolux,
                 Panasonic, Aqua
garansi_hari     validation_rule { min: 0, max: 90 }
durasi_estimasi  validation_rule { min: 45, max: 240 }
```

`garansi_hari` satu-satunya atribut opsional bertipe SPEC di seluruh dua belas, disengaja sebagai contoh atribut yang jadi pembeda kompetitif: penyedia yang memberi garansi menonjol di hasil filter, yang tidak memberi tetap bisa mendaftar.

### B.13 Rekap dan Bahan Pembelaan Sidang

| Sub-kategori | Jumlah atribut | Tipe data terpakai | pricing_mode |
|---|---|---|---|
| Ganti oli | 2 | SELECT, BOOLEAN | FLAT |
| Potong rambut | 3 | SELECT, NUMBER | FLAT, PER_UNIT |
| Cuci mobil | 4 | SELECT, MULTISELECT, NUMBER | FLAT |
| Servis motor | 4 | SELECT, MULTISELECT, NUMBER | FLAT |
| Foto produk | 4 | SELECT, MULTISELECT, NUMBER | FLAT, PER_UNIT |
| Makeup artist acara | 5 | SELECT, MULTISELECT, NUMBER | FLAT, PER_UNIT |
| Makeup pengantin | 5 | SELECT, MULTISELECT, NUMBER | FLAT, PER_UNIT |
| Tukang listrik | 5 | SELECT, NUMBER, BOOLEAN | FLAT, PER_UNIT |
| Servis mesin cuci | 5 | SELECT, MULTISELECT, NUMBER | FLAT |
| Dokumentasi acara | 6 | SELECT, MULTISELECT, NUMBER | FLAT |
| Servis AC | 6 | SELECT, MULTISELECT, NUMBER | FLAT, PER_UNIT |
| Foto prewedding | 7 | SELECT, MULTISELECT, NUMBER | FLAT, PER_UNIT |

Rentang 2 sampai 7 atribut dalam struktur yang sama persis, tanpa satu pun kolom tambahan di skema. Ini angka yang ditunjukkan di Bab IV sebagai bukti tujuan penelitian nomor 1.

**Tiga pasangan kontras yang siap dipakai kalau penguji bertanya:**

| Pasangan | Apa yang dibuktikan |
|---|---|
| `jenis_kendaraan` (cuci mobil, OPTION berbayar) versus `tipe_motor` (servis motor, SPEC) | Atribut bernama mirip di kategori yang sama bisa punya peran dan perilaku berbeda |
| `jenis_acara` (makeup artist, OPTION) versus `gaya_riasan` (makeup pengantin, SPEC) | Pola yang sama berulang di kategori lain, jadi bukan kebetulan |
| Ganti oli 2 atribut versus foto prewedding 7 atribut | Hybrid Approach tidak memaksa penyedia sederhana mengisi banyak kolom |

**Catatan tipe data yang tidak terpakai.** TEXT dan DATE tidak muncul di dua belas sub-kategori ini. DATE tertutup oleh `scheduled_at` yang sudah jadi kolom tersendiri, dan TEXT dihindari karena tidak bisa difilter serta hampir selalu sebenarnya milik deskripsi listing. Kalau ditanya, jawabannya: definisi tipe disediakan lengkap supaya admin bisa menambah jasa baru yang membutuhkannya, dan dua belas sub-kategori contoh belum tentu memakai seluruhnya. Sistemnya memang dirancang lebih luas dari datanya.
