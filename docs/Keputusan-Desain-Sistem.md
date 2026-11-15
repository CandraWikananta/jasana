# Register Keputusan Desain Sistem

**Tugas Akhir:** Rancang Bangun Platform Marketplace Jasa On-Demand Berbasis Web yang Terintegrasi dengan Kecerdasan Buatan
**Nama sistem:** Jasana
**Penyusun:** I Nyoman Gede Candra Wikananta (2305551065)
**Bidang Keahlian:** Sistem Informasi, Teknologi Informasi, Universitas Udayana
**Versi:** 2.30
**Terakhir diperbarui:** 15 November 2026 (versi 2.30)
**Tahap saat ini:** Implementasi backend. Fase 0 sampai Fase 8 selesai, Fase 9 berjalan (sesi 9a selesai)

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
| Katalog lanjutan dan sumber durasi (D87 sampai D90) | 4 | 0 |
| Listing dan pemetaan (D91 sampai D97) | 7 | 0 |
| Pencarian: lokasi dan status online (D98 sampai D99) | 2 | 0 |
| Durasi opsi, pembagian transisi, dan penerima tawaran (D100 sampai D103) | 4 | 0 |
| Order Scheduled (D104 sampai D106) | 3 | 0 |
| Available Now dan real-time (D107 sampai D109) | 3 | 0 |
| Pelaksanaan dan kode verifikasi (D110 sampai D114) | 5 | 0 |
| Cron deadline (D115 sampai D116) | 2 | 0 |
| Hasil audit hutang teknis (D117 sampai D118) | 2 | 0 |
| Webhook pembayaran (D119 sampai D122) | 4 | 0 |
| Endpoint dan invoice pembayaran (D123 sampai D124) | 2 | 0 |
| Invoice yatim (D125) | 1 | 0 |
| Webhook invoice (D126 sampai D128) | 3 | 0 |
| Penutupan Fase 7 (D129 sampai D130) | 2 | 0 |
| Uang lanjutan (D131 sampai D135) | 5 | 0 |
| Refund dan payout dari sandbox (D136 sampai D137) | 2 | 0 |
| Approve withdrawal (D138 sampai D139) | 2 | 0 |
| Refund dan rekonsiliasi (D140 sampai D147) | 8 | 0 |
| Sengketa (D148 sampai D150) | 3 | 0 |
| Chatbot (D151 sampai D155) | 5 | 0 |
| Gateway LLM dan model (D156 sampai D160) | 5 | 0 |
| Keputusan terbuka tanpa nomor D (Bagian 7) | | 0 |

**Perubahan pada versi 2.30:**

1. Timeout LLM 8 detik (D156), fake ditolak di produksi (D157), dan `store: false` (D158)
2. Model `gemini-3.5-flash-lite` dari hasil smoke (D159) dan rem global tamu 250 per hari (D160)
3. Catatan sesi 9a. H14 ditutup, H110 baru

**Perubahan pada versi 2.29:**

1. Port `LlmGateway` dengan implementasi fake (D151)
2. Gemini hanya untuk ekstraksi intent dan klarifikasi, lima jenis intent, templat untuk pesan di luar pencarian (D152)
3. Definisi akurasi intent extraction (D153)
4. Penyimpanan tiga lapis rate limit tamu (D154) dan masa berlaku sesi tamu (D155)
5. Pembagian Fase 9 dalam tiga sesi

**Perubahan pada versi 2.28:**

1. Batas bukti 5 per pihak (D148), reason refund sengketa (D149), dan penghitung order hanya naik di T16 (D150)
2. Catatan implementasi sengketa dan penutupan Fase 8. H100 dan H108 ditutup, H78 dan H79 berlaku untuk jalur bukti sengketa

**Perubahan pada versi 2.27:**

1. Aturan eksekusi refund dengan status yang memisahkan "belum dijawab" dari "jalur API buntu" (D140)
2. `refunds.initiated_by` nullable dan dua kolom jalur manual (D141, D142)
3. Sinkronisasi hanya lewat aksi admin, beserta aturannya (D143 sampai D145)
4. Penanda order batal setelah bayar dan payment tanpa invoice id (D146, D147)
5. H99 bagian pembayaran telat, H101, dan H106 ditutup. H107 dan H108 baru
6. Hasil uji sandbox 8c dan H109 (batas waktu transaksi) ditutup lewat perbaikan susulan

**Perubahan pada versi 2.26:**

1. Aturan approve withdrawal untuk payout diterima, gagal sementara, dan ditolak final (D138)
2. Xendit 409 diperlakukan sebagai galat sementara (D139)
3. Catatan implementasi dan hasil sesi 8b. H83, H102, dan H105 ditutup
4. Hasil uji sandbox payout. H106 baru

**Perubahan pada versi 2.25:**

1. Refund dua jalur dipilih dari metode pembayaran, menutup keputusan terbuka nomor 6 (D136)
2. Payout v2 dengan status akhir hanya dari webhook (D137)
3. Hasil uji sandbox sesi 8a dan fixture payload sungguhan. H105 baru

**Perubahan pada versi 2.24:**

1. Refund pembatalan setelah bayar selalu penuh termasuk platform fee (D131)
2. `REFUND_DEDUCTION` ditulis di transisi pemicu refund, uang bergerak di enam transisi (D132)
3. Rumus putusan PARTIAL (D133)
4. Tiga kejadian pembalikan withdrawal dan idempotency payout (D134)
5. Refund pembayaran telat otomatis, pembayaran dobel ditangani admin (D135)
6. Keputusan terbuka nomor 6 soal jalur eksekusi refund, ditutup setelah sesi 8a. Pembagian Fase 8 dalam empat sesi. H99 diperbarui, H101 sampai H104 baru

**Perubahan pada versi 2.23:**

1. Hasil uji sandbox Xendit sungguhan dicatat di penutupan Fase 7

**Perubahan pada versi 2.22:**

1. Endpoint wallet dimajukan ke Fase 7 (D129) dan pengecualian ledger append-only untuk seed demo (D130)
2. Catatan implementasi T18 dan penutupan Fase 7. H3 terbukti lewat perilaku, H100 baru

**Perubahan pada versi 2.21:**

1. Definisi bayar dobel diperluas ke payment PAID di baris mana pun, dengan urutan pemeriksaan yang mencegah salah tanda (D126)
2. Status SETTLED diproses seperti PAID (D127)
3. Galat sebelum kunci event dibalas 5xx supaya Xendit mengirim ulang (D128)
4. Catatan implementasi webhook dan urutan kunci di jalur uang
5. H10 sampai H13 ditutup. Tanpa perubahan skema

**Perubahan pada versi 2.20:**

1. Perlakuan webhook PAID untuk invoice yatim dan pembayaran dobel (D125)
2. H99 diperluas ke pembayaran dobel. Tanpa perubahan skema

**Perubahan pada versi 2.19:**

1. Aturan `GET` dan `POST /orders/:id/payment`, termasuk pembuatan payment baru kalau invoice sempat di-expire sebelum deadline (D123)
2. Satu baris payment hanya memegang satu invoice (D124)
3. Catatan implementasi adapter Xendit dan hasil uji sandbox: Xendit menerima `external_id` ganda, sehingga webhook wajib dicocokkan lewat invoice id
4. H96 ditutup. Tanpa perubahan skema

**Perubahan pada versi 2.18:**

1. Pembayaran yang telat dicatat tanpa menghidupkan kembali order, dan di-refund di Fase 8 (D119, H99)
2. T5 hanya jalan kalau nominal yang dibayar sama dengan tagihan (D120)
3. Event webhook FAILED diproses ulang maksimal 3 kali (D121)
4. Webhook EXPIRED hanya mengubah payment dengan invoice id yang cocok (D122)
5. Pembagian Fase 7 dalam tiga sesi. Tanpa perubahan skema

**Perubahan pada versi 2.17:**

1. `trust proxy` diambil dari env `TRUST_PROXY` (D117)
2. `forgot-password` juga dibatasi per alamat email tujuan (D118)
3. Hasil audit hutang teknis: 14 H di 8.1 dicentang setelah diverifikasi `db:check-constraints`, 14 H lain lulus audit dan dicentang (247 test, 0 skipped), rumusan H55 diselaraskan, H93 dibuka kembali, dan catatan desain retry H37

**Perubahan pada versi 2.16:**

1. Penolakan tawaran ditolak setelah deadline lewat (D115)
2. Pekerja yang terkena SLA miss diberi notifikasi (D116)
3. Catatan implementasi: satu fungsi T3, pola sweep dengan `SKIP LOCKED`, urutan kunci T3 Available Now, dan pemicu sweep untuk pengujian
4. **Fase 6 ditutup.** Seluruh kriteria PRD Bagian 9 menurut D101 terpenuhi, rinciannya di Bagian 4K
5. H95 ditutup penuh. H4, H46, dan H49 dicentang setelah diverifikasi. Tanpa perubahan skema

**Perubahan pada versi 2.15:**

1. Percobaan kode direset setelah lockout lewat (D110), dan client bisa meminta kode baru setelah kode kedaluwarsa (D111)
2. `order:location_update` hanya diteruskan, tidak menulis basis data (D112)
3. Tiga guard waktu memakai 409 `ORDER_TRANSITION_NOT_ALLOWED` (D113)
4. Kode kedaluwarsa ditolak sebelum percobaan dihitung, mengubah urutan langkah verify di PRD 4.4 (D114)
5. Catatan implementasi: pola catat lalu commit baru tolak, penamaan radius check-in, dan `requireAssignedWorker`
6. H7, H8, dan H9 ditutup. Tanpa perubahan skema

**Perubahan pada versi 2.14:**

1. Radius Available Now diukur dari posisi pekerja ke lokasi client (D107)
2. Order Scheduled ACCEPTED maupun PAID memblokir Available Now, merevisi H28 (D108)
3. Room order diisi lewat event `order:join`, dan pekerja lama dikeluarkan saat penugasan diganti (D109)
4. Catatan implementasi: peran OFFERED, jalur accept Available Now menurut isi body, penanda online untuk pengujian, dan toleransi presence
5. H28, H38, H40, H41, H45, H92, dan H94 ditutup, H95 sebagian. Tanpa perubahan skema baru

**Perubahan pada versi 2.13:**

1. Invoice yang gagal dibuat saat T1 tidak membatalkan penerimaan, dan invoice untuk order yang sudah batal langsung di-expire (D104)
2. Listing yang masih punya order berjalan tidak bisa dihapus, menutup H88 (D105)
3. Empat aturan pembuatan dan pembatalan order: larangan memesan jasa usaha sendiri, batas respons sebelum jadwal, notifikasi pembatalan, dan radius layanan diperiksa server (D106)
4. Catatan implementasi: guard in-flight pada T1 Scheduled dipertahankan, peran pelaku dipilih per endpoint, dan format `order_number`
5. H24, H25, H26, H44, H47, H88, dan H93 ditutup. Hutang teknis baru H97 dan H98. Tanpa perubahan skema

**Perubahan pada versi 2.12:**

1. Durasi bisa melekat pada nilai opsi, dan durasi opsi yang dipilih client menjadi `snapshot_duration_minutes` saat order dibuat (D100). Menutup keputusan terbuka nomor 5
2. Opsi "Dua Hari" di B.6 dihapus, liputan dua hari dipesan sebagai dua order (D75)
3. Seluruh 22 transisi dipasang di Fase 6 dan diuji di tingkat unit, transisi uang end-to-end menunggu Fase 7 dan 8, dan Xendit dibungkus port `PaymentGateway` dengan implementasi palsu. Kriteria milestone Fase 6 sampai 8 disesuaikan (D101)
4. Daftar penerima tawaran Available Now disimpan di tabel baru `order_offers`, pekerja boleh menolak tawarannya sendiri, dan T2 hanya oleh pemilik (D102)
5. Aturan D100 nomor (2) dan (3) hanya menghitung baris aktif (D103)
6. Hutang teknis H93 sampai H95
7. Tidak ada lagi keputusan terbuka. Skema bertambah satu tabel menjadi 35 tabel dan 35 enum

**Perubahan pada versi 2.11:**

1. Arti filter lokasi pencarian ditetapkan: jarak diukur dari lokasi tetap usaha, atau dari pekerja online terdekat untuk Available Now, dan client wajib berada di dalam `service_radius_km` (D98)
2. Status online pekerja dibaca dari memori proses API, bukan Redis. Redis tetap tidak dipakai (D99)
3. Dua persiapan stress testing dicatat: rate limiter dan pekerja online simulasi (H91, H92)

**Perubahan pada versi 2.10:**

1. Tujuh usulan dari implementasi Fase 4 dicatat sebagai D91 sampai D97: endpoint baca listing milik provider, syarat menayangkan listing, pemetaan sisi listing yang tidak menyentuh pelamar, perubahan status lewat PATCH, minimal satu mode pemesanan, detail publik hanya untuk provider VERIFIED, dan listing bertanda yang tetap boleh diturunkan
2. Konfigurasi bucket `listing-photos` dicatat
3. Tiga catatan untuk fase berikutnya: hapus listing saat order berjalan (Fase 6), nilai 0 pada parameter angka (Fase 6 dan 8), dan foto terhapus yang masih bisa diakses sampai cron berjalan (H88 sampai H90)

**Perubahan pada versi 2.9:**

1. Tiga usulan dari implementasi Fase 3 dicatat: tipe atribut dikunci setelah dibuat (D87), sub-kategori hasil usulan lahir nonaktif (D88), dan nilai PER_UNIT wajib bilangan bulat (D89)
2. Sumber durasi listing disatukan ke kolom `listings.estimated_duration_minutes`, dan atribut `durasi_estimasi` dihapus dari Lampiran B (D90). Rentang atribut di B.13 menjadi 2 sampai 6
3. Lampiran B.3 dilengkapi daftar option `jenis_kendaraan`
4. Satu keputusan terbuka baru: durasi untuk jasa yang lamanya ditentukan opsi pilihan client
5. Hutang teknis H85 sampai H87

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

**Dampak kumulatif terhadap skema:** dari 25 tabel dan 26 enum menjadi **35 tabel dan 35 enum** (`order_offers` ditambahkan di versi 2.12, D102).

**Status artefak per versi 2.12 (per 31 Oktober 2026):**

| Artefak | Versi | Keterangan |
|---|---|---|
| `PRD-Backend.md` | 2.15 | Sumber snapshot durasi di langkah pembuatan order (D100), Bagian 10 tanpa pertanyaan terbuka, kriteria milestone Fase 6 sampai 8, endpoint simulasi pembayaran dan env `PAYMENT_GATEWAY` (D101), endpoint `decline-offer` dan jumlah tabel (D102), status milestone Fase 0 sampai 5 selesai |
| `CLAUDE.md` | | Rujukan D1 sampai D101, jebakan nomor 7 menyebut `PaymentGateway`, jebakan nomor 13 menyebut durasi opsi |
| `skema-database-final.dbml`, `schema.prisma` | 2.12 | Tabel `order_offers` beserta relasi baliknya (D102). `docs/schema.prisma` sekaligus disamakan dengan kode, termasuk `idx_provider_base_geo` dari Fase 5 |
| `Panduan-Struktur-Database.md` | 2.9 | **Belum disinkronkan**, penjelasan tabel `order_offers` menyusul |
| `State-Machine-Order.md` | 2.12 | T2 hanya pemilik, T3 juga terpicu saat seluruh penerima menolak, guard klaim memeriksa `order_offers` (D102). Contoh `transitionOrder()` di Bagian 8 disamakan dengan implementasi sesi 6b. Kasus silang antar mode menghitung ACCEPTED dan PAID (D108) |
| `migration-constraints.sql` | 2.6 | Constraint `order_offers` ditambahkan di sesi 6d (H94) |
| Kode Fase 0 sampai 5 | | Fase 5 selesai (commit `a3c6cc5`). D100 dan D103 diterapkan di kode katalog pada sesi 6a (357 test lulus). Sesi 6b: `transitionOrder()`, port `PaymentGateway`, dan H89 (427 test lulus). Sesi 6c: order Scheduled sampai PAID, D104 sampai D106 (477 test lulus, Postman Fase 6 lulus). Sesi 6d: Available Now, Socket.IO, dan `order_offers`, D107 sampai D109 (503 test lulus). Sesi 6e: pelaksanaan di lokasi dan kode verifikasi, D110 sampai D114 (526 test lulus). Sesi 6f: cron deadline T3 dan T6, D115 dan D116 (561 test lulus, Postman Fase 6 84 request). **Fase 6 selesai.** Tabel `order_offers` dimigrasikan di sesi 6d (D102) |
| Usulan ide (Tabel Aktor Sistem) | | Tidak direvisi (A7) |

**Status artefak per versi 2.11 (per 22 Oktober 2026):**

| Artefak | Versi | Keterangan |
|---|---|---|
| `PRD-Backend.md` | 2.5 | Dua endpoint baca listing provider (D91), arti filter lokasi dan `available_now` di pencarian (D98, D99), status milestone |
| `CLAUDE.md` | | Rujukan D1 sampai D99 |
| `skema-database-final.dbml`, `schema.prisma`, `Panduan-Struktur-Database.md` | 2.9 | Tidak terdampak, versi 2.10 tidak mengubah skema |
| `migration-constraints.sql`, `State-Machine-Order.md` | 2.6 | Tidak terdampak |
| Kode Fase 0 sampai 4 | | Seluruh D91 sampai D97 sudah diterapkan dan teruji di Fase 4 (310 test, collection Postman 60 dari 60) |
| Usulan ide (Tabel Aktor Sistem) | | Tidak direvisi (A7) |

---|---|---|
| `skema-database-final.dbml` | 2.9 | Note kolom durasi di `listings`, `subcategories`, dan `taxonomy_requests` (D90). Struktur tidak berubah |
| `schema.prisma` | 2.9 | Komentar saja (D90) |
| `migration-constraints.sql` | 2.6 | Tidak terdampak |
| `Panduan-Struktur-Database.md` | 2.9 | Contoh atribut tanpa `durasi_estimasi`, kolom durasi di tabel `listings` |
| `State-Machine-Order.md` | 2.6 | Tidak terdampak, rumus bentrok jadwal tetap memakai `snapshot_duration_minutes` |
| `PRD-Backend.md` | 2.3 | O1 dan data simulasi 2 sampai 6 atribut, sumber snapshot durasi, kode error `TAXONOMY_REQUEST_STATE_CONFLICT`, status milestone |
| `CLAUDE.md` | | Rujukan D1 sampai D90, penamaan durasi di jebakan nomor 13 |
| Kode Fase 3 (`scripts/catalog-data.mjs` dan test rekap B.13) | | **Perlu diubah di awal Fase 4**: buang 11 atribut `durasi_estimasi` dari seed, sesuaikan hitungan rekap, dan nonaktifkan atribut itu di basis data pengembangan (D90) |
| Usulan ide (Tabel Aktor Sistem) | | Tidak direvisi (A7) |

---|---|---|
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
   -> daftar penerima disimpan di order_offers                (D102)

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

6. Kalau tidak ada yang menerima sampai 5 menit lewat, atau seluruh
   penerima sudah menolak lebih dulu (D102):
   -> status EXPIRED
   -> SLA miss dicatat untuk penerima yang belum menolak
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
| Hybrid Approach menampung bentuk berbeda (D2) | Ganti oli (2 atribut) versus foto prewedding (6 atribut, tipe campur) |
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
| Berapa lama biasanya dikerjakan? | Nilai awal `subcategories.estimated_duration_minutes` (D90) |
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
| Global harian untuk seluruh lalu lintas tamu | 250 pesan per hari WITA (D160) | Rem darurat kalau dua lapis di atas ditembus |

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

## 4D. Keputusan Versi 2.9 (D87 sampai D90)

D87 sampai D89 muncul saat implementasi Fase 3 dan sudah diterapkan di kode. D90 diputuskan sebelum Fase 4. Versi ini tidak mengubah skema.

| # | Keputusan | Alasan |
|---|---|---|
| D87 | **`data_type`, `attribute_role`, dan `pricing_mode` tidak bisa diubah setelah atribut dibuat**, sama seperti `attribute_key`. PATCH atribut hanya menerima `label`, `options`, `unit`, `is_required`, `is_filterable`, `is_active`, `validation_rule`, dan `display_order`. Untuk mengganti tipe, admin menonaktifkan atribut lama lalu membuat yang baru | Ketiganya menentukan di mana dan bagaimana nilai lama disimpan. NUMBER yang diubah jadi SELECT membuat nilai lama tidak bermakna, SPEC yang diubah jadi OPTION memindahkan tempat penyimpanan dari `listings.attributes` ke `listing_option_prices`, dan `pricing_mode` yang diubah membuat harga listing yang sudah tayang dihitung dengan cara lain tanpa sepengetahuan provider. Alasan yang sama dengan D67 poin 3 |
| D88 | **Sub-kategori hasil persetujuan usulan `NEW_SUBCATEGORY` dibuat dengan `is_active = false`.** Admin melengkapi atributnya lewat CRUD, lalu mengaktifkannya. `resulting_id` tetap terisi saat persetujuan | Merancang seluruh atribut sekaligus di dalam satu permintaan persetujuan tidak praktis (D74 menyebut beban admin untuk jenis ini berat). Tanpa aturan ini, sub-kategori kosong tanpa atribut langsung tampil di katalog publik |
| D89 | **Nilai atribut OPTION bertipe NUMBER dengan `pricing_mode = PER_UNIT` wajib bilangan bulat.** NUMBER berperan SPEC tetap boleh pecahan | Seluruh atribut PER_UNIT di Lampiran B adalah hitungan (unit AC, item, orang, lokasi, titik), dan nilainya dikalikan ke harga. 2,5 unit AC tidak punya arti di lapangan |
| D90 | **Durasi listing hanya punya satu sumber, yaitu kolom `listings.estimated_duration_minutes`.** Wajib diisi provider, 15 sampai 720 menit, divalidasi saat listing ditulis. Saat order dibuat, nilainya disalin ke `orders.snapshot_duration_minutes` (D10) yang dipakai pemeriksaan bentrok jadwal (D41). Atribut `durasi_estimasi` dihapus dari Lampiran B. `subcategories.estimated_duration_minutes` menjadi nilai awal di form listing | Rancangan sebelumnya punya dua sumber: atribut `durasi_estimasi` di JSONB (Lampiran B) dan kolom di `listings` (DBML). Dua sumber pasti berbeda isi, persis masalah yang dihindari D45, dan ganti oli malah tidak punya atribut durasi sama sekali. Kolom bertipe integer juga lebih tepat untuk pemeriksaan rentang waktu daripada nilai di dalam JSONB |

**Konsekuensi D90 yang disadari.** Batas durasi khusus per sub-kategori (misalnya cuci mobil 30 sampai 180 menit) diganti satu batas umum 15 sampai 720 menit. Batas itu bukan klaim penelitian. Rentang jumlah atribut di B.13 berubah dari 2 sampai 7 menjadi 2 sampai 6, dan klaim tujuan penelitian nomor 1 tidak terpengaruh karena yang dibuktikan adalah bentuk atribut yang berbeda tanpa perubahan skema, bukan jumlah tertentu.

**Penerapan D90 di kode Fase 3.** Seed katalog sudah membuat 11 atribut `durasi_estimasi` di basis data pengembangan. Atribut itu **dinonaktifkan** (`is_active = false`, D67 poin 3), bukan dihapus, dan data seed serta test rekap B.13 disesuaikan. Dikerjakan di awal Fase 4.

---

## 4E. Keputusan Versi 2.10 (D91 sampai D97)

Seluruhnya muncul saat implementasi Fase 4, sudah diterapkan di kode, dan teruji. Tidak ada perubahan skema.

| # | Keputusan | Alasan |
|---|---|---|
| D91 | **`GET /providers/me/listings` dan `GET /providers/me/listings/:id`** untuk provider membaca listing miliknya sendiri, termasuk DRAFT dan INACTIVE, tanpa yang sudah dihapus. Detailnya memuat status, `attributes_need_update`, pekerja terpetakan, dan seluruh baris harga opsi | PRD versi 2.3 hanya punya endpoint buat, ubah, dan hapus. Endpoint publik hanya menampilkan listing ACTIVE, sehingga listing DRAFT, yang justru ditahan D53 sampai ada pekerja terpetakan, tidak bisa dibaca ulang oleh pemiliknya |
| D92 | **Syarat menayangkan listing (ke ACTIVE)**: punya minimal satu pekerja terpetakan berkeanggotaan ACTIVE (D53), sub-kategorinya aktif, atribut SPEC lolos validasi, dan setiap atribut OPTION wajib yang aktif punya minimal satu opsi `is_offered`. Pemeriksaan kelengkapan memakai satu fungsi yang sama dengan PUT harga opsi | Diturunkan dari D53, D67, dan H48. Listing yang tayang dengan OPTION wajib tanpa opsi tidak bisa dipesan sama sekali |
| D93 | **PUT pemetaan dari sisi listing hanya mengganti pemetaan pekerja ACTIVE.** Centangan pelamar PENDING tidak tersentuh | Menurut D52, centangan pelamar adalah usulan yang menunggu disahkan pemilik. Menimpanya dari sisi listing akan menghapus usulan itu tanpa sepengetahuan pelamar |
| D94 | **Status listing diubah lewat field `status` di PATCH**, hanya ACTIVE atau INACTIVE. SUSPENDED hanya bisa diberikan admin | Satu jalur ubah listing, dan provider tidak bisa mencabut penangguhan dari admin |
| D95 | **Listing wajib mendukung minimal satu mode pemesanan.** `supports_scheduled` atau `supports_available_now` harus true, saat dibuat maupun diubah | Tanpa ini, listing bisa tayang tapi tidak bisa dipesan lewat mode apa pun |
| D96 | **Detail publik listing mensyaratkan provider berstatus VERIFIED**, selain listing ACTIVE dan belum dihapus | Listing milik usaha yang ditangguhkan tidak boleh tetap terlihat dan dipesan |
| D97 | **Listing bertanda `attributes_need_update` tetap boleh diturunkan ke INACTIVE** lewat PATCH yang hanya berisi `status`, tanpa melengkapi atribut. Penandanya tetap menyala, dan menayangkan ulang tetap wajib lengkap. Menyempurnakan H48 | Tujuan H48 adalah mencegah listing yang tidak lengkap tetap dipakai. Kalau provider tidak bisa menurunkannya, listing itu malah tetap tayang dan tetap bisa dipesan, kebalikan dari tujuannya |

**Konfigurasi bucket `listing-photos` (D80).** Publik, tipe berkas hanya `image/jpeg`, `image/png`, dan `image/webp`, batas 5 MB. SVG sengaja tidak diizinkan, karena berkas SVG di bucket publik bisa membawa script yang berjalan di browser orang yang membukanya. `file_url` foto hanya diterima dari folder milik pemanggil sendiri, `listing-photos/<user_id>/`. Cron pembersih berkas yatim (H80) sudah diuji ke Storage sungguhan: dari dua berkas uji, hanya yang tidak dirujuk yang terhapus.

---

## 4F. Keputusan Versi 2.11 (D98 sampai D99)

Diputuskan sebelum Fase 5 karena PRD hanya menulis parameter `lat`, `lng`, dan `radius_km` tanpa menjelaskan jaraknya diukur dari mana. Tidak ada perubahan skema dari keputusan ini.

| # | Keputusan | Alasan |
|---|---|---|
| D98 | **Arti filter lokasi pencarian.** Titik `lat`, `lng` adalah lokasi client, yaitu tempat jasa dikerjakan. Listing muncul kalau lokasi client berada **di dalam `service_radius_km` usahanya**. Jarak diukur dari **lokasi tetap usaha** (`base_latitude`, `base_longitude`) untuk pencarian biasa, dan dari **pekerja online terdekat** yang terpetakan ke listing itu kalau `available_now=true`. `radius_km` dari client adalah penyaring tambahan yang opsional, dan `sort=distance` memakai jarak yang sama. Bounding box tetap dijalankan sebelum Haversine (D6) | Seluruh jasa dikerjakan di lokasi client (D75), jadi yang menentukan adalah apakah usaha itu mau datang ke client, bukan seberapa dekat client ke usaha. Untuk Available Now yang berangkat adalah pekerja online, sehingga posisinya yang relevan, dan karena itu `idx_worker_geo` menjadi kriteria selesai Fase 5 |
| D99 | **Status online pekerja dibaca dari memori proses API, tanpa Redis.** API dan Socket.IO berjalan di satu proses, sehingga daftar ID pekerja yang terhubung disisipkan ke query sebagai `id = ANY(...)`. Di Fase 5 pelacak itu belum ada, jadi filter `available_now` sementara memakai `is_available` saja dan ditandai `shortcut:` di kode. Di Fase 6 filter ditambah daftar pekerja online. Cron presence tetap ada supaya tampilan dashboard pekerja jujur | Redis baru dibutuhkan kalau API berjalan di beberapa server sekaligus. Menambahkannya berarti infrastruktur baru untuk dev dan test, menulis ulang rate limiter Fase 1, dan perubahan dokumen, tanpa manfaat di skala penelitian. Batasan satu instance sudah tertulis di Bagian 2.2, dan hasil stress test dibaca sebagai kapasitas satu instance. Beberapa instance dengan Redis masuk saran pengembangan |

## 4G. Keputusan Versi 2.12 (D100 sampai D103)

Ketiganya diputuskan sebelum Fase 6. D100 menutup keputusan terbuka nomor 5, D101 menyesuaikan kriteria milestone dengan urutan fase, dan D102 menambah tabel `order_offers` yang ternyata kurang saat menyusun rencana Fase 6. D100 dan D101 tidak mengubah skema, karena `subcategory_attributes.options` sudah berupa JSONB dan D101 hanya menyangkut kode serta urutan kerja. D102 menambah satu tabel. D103 memperjelas aturan D100 yang muncul saat implementasi sesi 6a, tanpa perubahan skema.

| # | Keputusan | Alasan |
|---|---|---|
| D100 | **Durasi bisa melekat pada nilai opsi.** Setiap nilai di `subcategory_attributes.options` boleh membawa `duration_minutes`, misalnya `{ "value": "4 Jam", "is_active": true, "duration_minutes": 240 }`. Saat order dibuat, `snapshot_duration_minutes` diambil dari durasi opsi yang dipilih client. Kalau sub-kategorinya tidak punya atribut berdurasi yang aktif, durasi tetap dari `listings.estimated_duration_minutes` (D90). Aturannya: (1) hanya atribut SELECT, berperan OPTION, dan wajib diisi yang boleh membawa durasi, dan status wajibnya tidak boleh dicabut selama durasi itu ada; (2) maksimal satu atribut berdurasi per sub-kategori; (3) kalau satu nilai opsi punya `duration_minutes`, seluruh nilai opsi atribut itu wajib punya, berupa bilangan bulat 15 sampai 720; (4) durasi ditetapkan admin di taksonomi, bukan provider per listing, dan nilai opsi baru lewat `NEW_ATTRIBUTE_OPTION` (D74) diberi durasinya oleh admin saat menyetujui; (5) mengubah durasi sebuah opsi hanya berlaku untuk order berikutnya, karena order lama memakai snapshot. Opsi "Dua Hari" di B.6 dihapus | Label opsinya sendiri sudah menyebut durasi, sehingga durasi adalah bagian dari definisi opsi, bukan nilai yang perlu diisi ulang tiap provider. Dua provider yang menawarkan "4 Jam" pasti maksudnya sama, jadi menaruhnya di taksonomi menutup kemungkinan durasi bertentangan dengan label. Delta durasi per listing ditolak karena butuh migration dan justru membuka inkonsistensi itu. Memecah paket menjadi listing terpisah ditolak karena menghilangkan atribut OPTION dari B.5 dan B.6 dan melemahkan tujuan penelitian nomor 1. "Dua Hari" melewati batas 720 menit dan melanggar satu order satu kedatangan (D75), sehingga liputan dua hari dipesan sebagai dua order |
| D101 | **Pembagian transisi antar fase dan gerbang pembayaran.** (1) Fase 6 memasang seluruh 22 transisi di `ALLOWED_TRANSITIONS` dan `ALLOWED_ACTORS`, dan guard-nya diuji di tingkat unit. (2) Yang diuji end-to-end lewat API di Fase 6 adalah T1 sampai T4, T6 sampai T8, T10, T12, T14, dan T16, ditambah T5 lewat gateway palsu. (3) Seluruh panggilan Xendit dibungkus interface `PaymentGateway` di `apps/api/src/lib/payment-gateway.ts` dengan dua implementasi: palsu untuk dev dan test, Xendit untuk Fase 7. Pilihannya lewat env `PAYMENT_GATEWAY` (`fake` atau `xendit`), dan aplikasi gagal start kalau `fake` dipakai bersama `NODE_ENV=production`. (4) Selama memakai gateway palsu, T5 dipicu lewat `POST /dev/orders/:id/simulate-payment` yang hanya terdaftar saat `PAYMENT_GATEWAY=fake`. Endpoint itu memanggil fungsi service yang sama dengan yang nanti dipanggil handler webhook. Di Fase 6 fungsi itu menulis `payments` berstatus PAID dan mengubah slot pekerja dari tentatif menjadi pasti. Ledger `ESCROW_HOLD` ditambahkan ke fungsi yang sama di Fase 7. (5) T5 lewat webhook sungguhan dan T18 dipasang di Fase 7. T9, T11, T13, T15, T17, T19, dan T20 sampai T22 dipasang di Fase 8. Sampai fasenya tiba, `POST /orders/:id/cancel` untuk order berstatus PAID atau ON_THE_WAY menolak dengan 409 `ORDER_TRANSITION_NOT_ALLOWED` dan ditandai `shortcut:` di kode | Kriteria lama Fase 6, yaitu 22 transisi lulus end-to-end, tidak bisa dipenuhi tanpa Fase 7 dan 8, karena T5 butuh webhook, T9 dan T11 butuh refund, dan T13 sampai T22 butuh dispute serta ledger. Memasang seluruh transisi di tabel sejak awal menjaga state machine tetap utuh dan teruji, sedangkan efek samping uang menunggu fasenya. Port `PaymentGateway` membuat kode order tidak berubah saat Xendit dipasang, dan sekaligus memudahkan test karena tidak bergantung pada sandbox. Endpoint simulasi memakai fungsi service yang sama dengan webhook supaya yang teruji di Fase 6 adalah jalur yang benar-benar dipakai nanti |
| D102 | **Daftar penerima tawaran Available Now disimpan di tabel `order_offers`**, satu baris per pekerja yang ditawari, berisi `distance_meters`, `offered_at`, `declined_at`, dan `sla_missed_at`. Aturannya: (1) baris ditulis di transaksi yang sama dengan pembuatan order; (2) pekerja hanya bisa mengklaim kalau punya baris dan belum menolak, dan pemilik hanya boleh memilih pekerja dari baris yang belum menolak (D70). Guard H41 tetap diperiksa ulang; (3) pekerja boleh menolak tawarannya sendiri lewat `POST /orders/:id/decline-offer`. Penolakan hanya mengisi `declined_at`, bukan transisi, dan tidak mematikan order. Kalau seluruh penerima sudah menolak, order langsung EXPIRED lewat T3 dengan aktor SYSTEM di transaksi yang sama (D56); (4) saat deadline lewat, T3 mengisi `sla_missed_at` hanya untuk penerima yang belum menolak, lalu mematikan `is_available` mereka (D57). Yang menolak dianggap sudah merespons; (5) T2 (menolak seluruh order) hanya bisa dilakukan pemilik di kedua mode, merevisi State Machine yang sebelumnya mengizinkan pekerja pada Available Now; (6) yang kalah perebutan klaim tidak kena catatan apa pun, pemenangnya tercatat di `orders.assigned_worker_id` | Daftar penerima dibutuhkan di empat tempat: cron T3, validasi pilihan pemilik (D70), syarat "seluruh yang ditawari menolak" di D56, dan laporan admin yang memuat SLA miss per pekerja dan per penyedia. Disimpan di memori proses, daftar itu hilang saat restart. Dihitung ulang saat cron jalan, hasilnya berbeda karena posisi dan status online pekerja sudah berubah. Menumpang tabel `notifications` ditolak karena kolom referensinya polymorphic tanpa FK dan notifikasi bukan data kritikal. Kolom array di `orders` ditolak karena tanpa FK dan tidak bisa menyimpan penolakan per pekerja. T2 oleh pekerja ditolak karena satu pekerja yang menolak akan mematikan order padahal rekannya masih bisa menerima, bertentangan dengan D56. Pemilik yang menolak mewakili keputusan usaha |
| D103 | **Aturan D100 nomor (2) dan (3) hanya menghitung baris aktif.** (1) All-or-none hanya berlaku untuk nilai opsi yang aktif, sehingga nilai nonaktif boleh tanpa `duration_minutes`. Nilai yang punya durasi tetap dicek 15 sampai 720 walaupun nonaktif. (2) Mengaktifkan ulang nilai opsi tanpa durasi pada atribut berdurasi ditolak. (3) Batas satu atribut berdurasi per sub-kategori hanya menghitung atribut aktif, sehingga atribut berdurasi yang dinonaktifkan tidak menghalangi atribut pengganti. (4) Mengaktifkan ulang atribut berdurasi saat sudah ada atribut berdurasi lain yang aktif ditolak. Muncul dari implementasi sesi 6a | Nilai nonaktif tidak bisa dipilih client (D67), jadi tidak pernah masuk `snapshot_duration_minutes`. Kalau ikut dihitung, nilai "Dua Hari" yang sudah ada di basis data pengembangan tidak bisa diberi durasi yang sah karena dua hari melewati 720 menit, sehingga `durasi_liputan` tidak akan pernah bisa berdurasi. Menghitung atribut nonaktif juga menutup jalur D87, yaitu menonaktifkan atribut lama lalu membuat yang baru. Pemeriksaan saat mengaktifkan ulang menutup celah yang dibuka pengecualian ini |

**Konsekuensi yang disadari.** D90 tidak dibongkar. Kolom durasi listing tetap wajib dan tetap satu-satunya sumber durasi untuk sepuluh sub-kategori lainnya. Untuk B.5 dan B.6 nilainya hanya cadangan, dipakai kalau atribut durasinya dinonaktifkan. Durasi juga tetap bukan atribut: yang ditambahkan adalah properti pada nilai opsi, dan kode tetap tidak membaca durasi dari `listings.attributes`.

**Penerapan.** Di awal Fase 6, kode Fase 3 diubah: validasi `options` di skema dan service katalog menerima `duration_minutes` dengan aturan (1) sampai (3), seed B.5 diberi 240 dan 480 menit, seed B.6 diberi 120, 240, dan 480 menit, dan opsi "Dua Hari" yang sudah ada di basis data pengembangan dinonaktifkan (`is_active = false`, D67), bukan dihapus. Pengisian `snapshot_duration_minutes` dibangun di Fase 6 bersama pembuatan order (H93).

**Pembagian transisi menurut D101:**

| Fase | Transisi yang diuji end-to-end lewat API |
|---|---|
| 6 | T1, T2, T3, T4, T6, T7, T8, T10, T12, T14, T16, ditambah T5 lewat gateway palsu |
| 7 | T5 lewat webhook Xendit, T18 |
| 8 | T9, T11, T13, T15, T17, T19, T20, T21, T22 |

Pelaksanaan Fase 6 dibagi enam sesi: 6a penerapan D100, 6b mesin state machine dan port `PaymentGateway`, 6c order Scheduled, 6d Available Now dan real-time, 6e pelaksanaan di lokasi, 6f cron SLA dan penutup.

**Dampak D102 pada skema.** Satu tabel baru `order_offers` tanpa enum baru, sehingga skema menjadi 35 tabel dan 35 enum. Migration dan constraint-nya dibuat di sesi 6d (H94, H95).

## 4H. Keputusan Versi 2.13 (D104 sampai D106)

Seluruhnya muncul saat menyusun rencana sesi 6c dan sudah diterapkan di kode sesi itu. Tidak ada perubahan skema.

| # | Keputusan | Alasan |
|---|---|---|
| D104 | **Invoice yang gagal dibuat saat T1 tidak membatalkan penerimaan.** Baris `payments` berstatus PENDING beserta `xendit_external_id` ditulis di transaksi T1. Pembuatan invoice berjalan di `afterCommit`, lalu mengisi `xendit_invoice_id`, `invoice_url`, `expires_at`, dan `raw_response`. Kalau gateway gagal, accept tetap membalas 200 dengan `invoice_url = null`, order tetap ACCEPTED, dan errornya dicatat. Balasan 502 di PRD 6.4 berlaku untuk `POST /orders/:id/payment` (pembuatan ulang invoice, Fase 7). Kalau order sudah dibatalkan sebelum invoice selesai dibuat, invoice yang baru jadi langsung di-expire | Pemanggilan gateway berada di luar transaksi (jebakan 7), jadi saat gateway gagal, penerimaan sudah ter-commit. Membalas 502 ke pemilik akan terbaca seolah penerimaan gagal, lalu percobaan ulangnya dibalas 409 karena order sudah ACCEPTED. Pemeriksaan pembatalan menutup celah invoice yang tetap hidup untuk order CANCELLED, yang di Fase 7 berarti webhook menerima pembayaran untuk order batal |
| D105 | **Listing tidak bisa dihapus selama masih punya order berstatus PENDING_ACCEPTANCE sampai AWAITING_VERIFICATION.** `DELETE` ditolak 409 `LISTING_HAS_ACTIVE_ORDERS` dengan pesan yang menyarankan menonaktifkan listing lebih dulu. Order COMPLETED, DISPUTED, dan terminal tidak menghalangi. Menutup H88 | Order yang sedang berjalan sebenarnya aman karena snapshot (D10), tapi order PENDING akan tertahan sampai kedaluwarsa 24 jam karena guard T1 mensyaratkan listing ACTIVE. Jalan keluarnya tetap ada: nonaktifkan listing, tolak order PENDING lewat T2, lalu hapus. Penolakan otomatis lewat T2 ditolak karena menambah kode untuk kasus yang jarang |
| D106 | **Empat aturan pembuatan dan pembatalan order yang belum diatur dokumen.** (1) Pemanggil yang punya keanggotaan ACTIVE di usaha pemilik listing, baik pemilik maupun pekerja, ditolak 403 `FORBIDDEN_ACTOR` saat membuat order. (2) `response_deadline_at = min(now + scheduled_approval_hours, scheduled_at - payment_window_minutes)`, dan order ditolak 422 kalau batas itu sudah lewat saat dibuat. (3) T4 dan T7 memberi notifikasi ke pihak lawan: client membatalkan, pemilik dan pekerja yang ditugaskan diberi tahu; pemilik membatalkan, client dan pekerja diberi tahu. (4) Lokasi layanan wajib berada di dalam `service_radius_km` dari lokasi tetap usaha, dihitung Haversine di server, selain itu 409 `LISTING_NOT_AVAILABLE` | (1) Tanpa ini pemilik bisa memesan jasanya sendiri untuk menaikkan `order_count` dan memberi review palsu, dan data itu ikut terbaca di Bab IV. (2) Rumus lama membolehkan order diterima tepat sebelum jadwal, padahal client masih punya 10 menit untuk membayar, sehingga order bisa lunas setelah jadwalnya lewat. (3) Pihak lawan perlu tahu order dibatalkan, dan peta notifikasi D58 belum menyebutnya. (4) D98 menetapkan yang menentukan adalah apakah usaha mau datang ke lokasi client. Kalau hanya dijaga filter pencarian, order di luar radius bisa dibuat lewat Postman |

**Catatan implementasi sesi 6c tanpa nomor D:**

- **Guard in-flight pada T1 mode Scheduled tetap berlaku**, persis seperti di State Machine Bagian 3. Guard ini menutup celah rumus bentrok di Bagian 3.1, yang hanya menghitung order ACCEPTED dan PAID. Tanpa guard ini, pekerja yang sedang IN_PROGRESS pada order Scheduled hari ini bisa ditugaskan ke order lain di jam yang sama. Konsekuensinya, pemilik INDIVIDUAL yang sedang bekerja baru bisa menerima order baru setelah pekerjaannya selesai, dan itu wajar dengan SLA 24 jam
- **Peran pelaku dipilih per endpoint**, bukan dengan prioritas global. Cancel menerima CLIENT, PROVIDER, lalu ADMIN; accept dan reject hanya PROVIDER. Dengan begitu pemilik INDIVIDUAL yang sekaligus penanggung jawab bertindak sebagai WORKER di transisi pelaksanaan sesi 6e
- **Format `order_number` adalah `ORD-YYYYMMDD-XXXXXXXX`** dengan 8 hex acak, menggantikan contoh nomor urut `ORD-20260914-0001` di DBML. Nomor urut butuh kunci atau sequence, dan itu tidak sepadan di skala penelitian. Unique index tetap jadi penjaga terakhir (H98)

## 4I. Keputusan Versi 2.14 (D107 sampai D109)

Seluruhnya muncul saat menyusun rencana sesi 6d dan sudah diterapkan di kode sesi itu. Tidak ada perubahan skema di luar `order_offers` yang sudah ditetapkan D102.

| # | Keputusan | Alasan |
|---|---|---|
| D107 | **Radius order Available Now diukur dari posisi pekerja.** Hanya pekerja yang posisinya berada di dalam `service_radius_km` dari lokasi client yang ditawari, sama dengan pencarian `available_now` (D98). Lokasi tetap usaha tidak diperiksa untuk mode ini. D106 nomor 4 tetap berlaku untuk Scheduled | Pada Available Now yang berangkat adalah pekerja, bukan basis usahanya. Kalau basis usaha juga diperiksa, listing yang muncul di pencarian `available_now` bisa ditolak saat client memesan, dan kejanggalan itu langsung terlihat saat UAT |
| D108 | **Order Scheduled berstatus ACCEPTED maupun PAID memblokir pencocokan dan klaim Available Now** dalam rentang `now + durasi + buffer`. Merevisi rumusan H28 yang hanya menyebut PAID | Sesuai D43, slot tentatif juga memblokir. Kalau hanya PAID, pekerja bisa menerima Available Now jam 13.00, lalu beberapa menit kemudian client Scheduled jam 14.00 membayar, dan pekerja itu terkena double booking |
| D109 | **Room `order:<id>` diisi lewat event `order:join { order_id }`** dengan ack. Server memeriksa pemanggil lewat `resolveOrderAccess`, dan hanya CLIENT, PROVIDER, dan WORKER penanggung jawab yang boleh masuk. Pekerja yang ditawari dan pendamping tidak boleh. Saat penanggung jawab diganti (D44), socket pekerja lama dikeluarkan dari room setelah commit | PRD 7.2 mendefinisikan room order tanpa menjelaskan cara anggotanya masuk. Event join lebih sederhana daripada server memasukkan pengguna ke semua room ordernya pada setiap koneksi. Tanpa pengeluaran saat penugasan diganti, pekerja lama tetap menerima event order yang sudah bukan miliknya, termasuk posisi pekerja baru di Fase 6e |

**Catatan implementasi sesi 6d tanpa nomor D:**

- **Peran OFFERED di `resolveOrderAccess`.** Peran ini dimiliki pekerja ACTIVE yang punya baris `order_offers` belum menolak, selama order masih PENDING_ACCEPTANCE. Peran ini dipakai untuk klaim, `decline-offer`, dan detail order, dan dipetakan ke aktor WORKER. Setelah klaim atau penolakan, perannya hilang, jadi alamat client tidak terus terbuka bagi pekerja yang kalah. OFFERED tidak dihitung sebagai peserta room order maupun pesan dalam order
- **Jalur accept Available Now ditentukan isi body.** Body kosong berarti pekerja mengklaim untuk dirinya sendiri. Body berisi `assigned_worker_id` berarti pemilik memilih dari daftar penerima. Dengan begitu pemilik usaha BUSINESS yang kebetulan juga ditawari tetap bisa memilih rekannya
- **Penanda pekerja online untuk pengujian (H92)** memakai `POST /dev/workers/presence { worker_ids }`, yang hanya terdaftar saat `PAYMENT_GATEWAY=fake`. Endpoint ini dihitung sebagai satu denyut presence dan kedaluwarsa sesuai `worker_presence_timeout_minutes`, sehingga script k6 harus mengirim ulang secara berkala
- **Toleransi presence 10 menit lebih lama dari SLA Available Now 5 menit.** Pekerja yang menutup tab beberapa menit lalu masih dianggap online, sehingga masih bisa ditawari dan terkena SLA miss. Nilainya parameter (D65), jadi bisa disetel tanpa mengubah kode. Dibahas di laporan

## 4J. Keputusan Versi 2.15 (D110 sampai D114)

D110 sampai D113 muncul saat menyusun rencana sesi 6e, D114 dari review sesi itu. Seluruhnya sudah diterapkan di kode. Tidak ada perubahan skema.

| # | Keputusan | Alasan |
|---|---|---|
| D110 | **Setelah `verification_locked_until` lewat, percobaan berikutnya mereset `verification_attempts` ke 0** di transaksi yang sama, sehingga pekerja punya 5 percobaan per jendela lockout. Guard T16 `verification_attempts < verification_max_attempts` dibaca sebagai nilai sebelum kenaikan, jadi percobaan kelima dengan kode benar tetap diterima | Tanpa reset, guard T16 membuat pekerja terkunci selamanya setelah lockout pertama. Opsi satu percobaan per 15 menit ditolak karena menghukum dua kali: pekerja yang salah ketik akibat layar ponsel client buram bisa tertahan di lokasi berjam-jam. Rumusan H8 sendiri berbunyi tolak sampai `verification_locked_until` lewat |
| D111 | **Client pemilik order bisa meminta kode baru lewat `POST /orders/:id/verification-code`**, hanya saat AWAITING_VERIFICATION. Kalau kode masih berlaku, kode yang sama dikembalikan tanpa rotasi. Saat terkunci ditolak 429 `VERIFICATION_LOCKED`. Kode baru mereset `verification_attempts` ke 0, mengosongkan `verification_locked_until`, dan mengatur `verification_expires_at = now + 60 menit` | Kode yang kedaluwarsa tidak punya jalan keluar, karena order tertahan di AWAITING_VERIFICATION. Pekerja tidak diberi hak meminta kode baru supaya tidak bisa dipakai untuk menghindari lockout. Client tidak boleh mengganti kode saat terkunci, supaya lockout tetap punya arti |
| D112 | **`order:location_update` hanya diteruskan ke room `order:<id>`, tidak menulis basis data.** Event diterima hanya dari penanggung jawab saat order ON_THE_WAY. `current_latitude` dan `current_longitude` pekerja tetap diperbarui lewat `PATCH /workers/me/location` sesuai D66 | Posisi di basis data hanya dipakai pencocokan Available Now, sedangkan pekerja yang ON_THE_WAY sedang in-flight sehingga tidak ikut pencocokan. Dengan begitu aturan PRD 7.2, satu-satunya event socket yang mengubah state adalah `worker:presence`, tetap utuh |
| D113 | **Tiga guard tanpa kode di Lampiran A memakai 409 `ORDER_TRANSITION_NOT_ALLOWED`** dengan pesan yang jelas: berangkat lebih dari 60 menit sebelum jadwal, membaca atau memperbarui kode di luar AWAITING_VERIFICATION, dan start tanpa check-in valid | Konsisten dengan preseden `assertBeforeDeparture` di sesi 6d. Ketiganya pada dasarnya kasus "belum waktunya", dan frontend tetap bisa menampilkan pesan spesifik dari field `message` |
| D114 | **Kode yang sudah kedaluwarsa ditolak 422 `VERIFICATION_CODE_EXPIRED` sebelum `verification_attempts` dinaikkan.** Mengubah urutan langkah verify di PRD 4.4 | Kode yang kedaluwarsa tidak mungkin diterima, jadi percobaan terhadapnya bukan tebakan dan tidak perlu dihitung. Kalau dihitung, pekerja yang mencoba lima kali setelah kode kedaluwarsa akan terkunci, dan D111 menolak client meminta kode baru selama terkunci, sehingga semua pihak menunggu 15 menit tanpa alasan. Aturan "naikkan dulu" tetap berlaku untuk kode yang masih berlaku |

**Catatan implementasi sesi 6e tanpa nomor D:**

- **Pola "catat, commit, baru tolak"** untuk check-in yang gagal dan verifikasi yang salah. Callback transaksi mengembalikan error penolakan alih-alih melemparnya, sehingga baris `order_checkins` dan kenaikan `verification_attempts` tetap tersimpan, lalu error dilempar setelah commit. Lapis 1 sampai 3 diperiksa sebelum menulis apa pun. Dibuktikan dengan uji mutasi: kalau penolakan dilempar di dalam transaksi, kedua test gagal
- **Penamaan radius check-in.** Nilainya dibaca dari parameter `geolocation_radius_meters` (PRD 3.5), dibulatkan ke bilangan bulat, lalu disimpan sebagai snapshot di kolom `order_checkins.radius_threshold_meters`. State Machine T10 dan PRD 4.4 disesuaikan
- **`requireAssignedWorker`** dipasang di kelima endpoint pelaksanaan. Rekan seusaha sudah tertahan lebih dulu oleh `requireOrderParticipant` (403 `FORBIDDEN_ACTOR`), sedangkan pemilik BUSINESS yang bukan penanggung jawab ditolak 403 `NOT_ASSIGNED_WORKER`

## 4K. Keputusan Versi 2.16 (D115 sampai D116) dan Penutupan Fase 6

Keduanya muncul di sesi 6f dan sudah diterapkan di kode. Tidak ada perubahan skema.

| # | Keputusan | Alasan |
|---|---|---|
| D115 | **`POST /orders/:id/decline-offer` ditolak 409 `RESPONSE_DEADLINE_PASSED` setelah `response_deadline_at` lewat.** Pemeriksaannya dilakukan setelah baris order terkunci | Tanpa aturan ini, pekerja yang tidak merespons bisa menolak di sela waktu antara deadline lewat dan cron berjalan, yang bisa sampai satu menit, lalu lolos dari SLA miss (D102 nomor 4). Data SLA miss dipakai di laporan admin dan Bab IV, jadi harus mencerminkan siapa yang benar-benar tidak merespons. Konsisten dengan accept dan reject yang sudah menolak setelah deadline |
| D116 | **Pada T3 karena deadline, pekerja yang terkena SLA miss diberi notifikasi** bahwa toggle Available Now-nya dimatikan karena tidak merespons tawaran. Barisnya ditulis di transaksi, emailnya lewat `afterCommit`. Pekerja yang sudah menolak tidak mendapat notifikasi ini | Sebelumnya toggle dimatikan diam-diam (D57). Saat UAT, pekerja akan bingung kenapa tawaran berhenti masuk. Biayanya hanya satu panggilan notifikasi di efek samping yang sudah ada |

**Catatan implementasi sesi 6f tanpa nomor D:**

- **T3 hanya punya satu implementasi**, `expireUnanswered(cause)`, yang dipakai penolakan terakhir (`ALL_DECLINED`) maupun cron (`DEADLINE`). Pada jalur `ALL_DECLINED`, himpunan penerima yang terkena SLA miss otomatis kosong
- **Sweep membaca kandidat tanpa kunci**, lalu mengunci per order dengan `FOR UPDATE SKIP LOCKED` dan memeriksa ulang deadline. Tiap order diproses di transaksinya sendiri, jadi satu kegagalan tidak membatalkan order lain. Dibuktikan dengan uji mutasi: tanpa `SKIP LOCKED`, kedua test balapan T3 gagal
- **Urutan kunci T3 Available Now sama dengan klaim**: pekerja dulu, baru order. Kalau dibalik, cron dan klaim yang berjalan bersamaan bisa deadlock. Belum bisa diuji secara deterministik, pencegahannya bersandar pada urutan kunci yang sama
- **Order yang terjebak** (payment PAID tapi status masih ACCEPTED) sengaja ditolak guard T6 dan terhitung gagal setiap menit, supaya keadaan itu terlihat di log
- **Pemicu sweep untuk pengujian**: `PATCH /dev/orders/:id/deadline` memundurkan `response_deadline_at` atau `payment_deadline_at`, dan `POST /dev/jobs/:job/run` menjalankan sweep yang sama dengan cron. Keduanya hanya terdaftar saat `PAYMENT_GATEWAY=fake`

**Penutupan Fase 6 (9 November 2026).** Seluruh kriteria PRD Bagian 9 menurut D101 terpenuhi:

| Kriteria | Bukti |
|---|---|
| 22 transisi lulus uji positif dan negatif di tingkat unit | Tabel di `order-state-machine.test.ts`, ditambah 22 kasus lewat `transitionOrder()` di `order-transition.test.ts`: aktor benar mengubah status dan menambah satu histori, aktor salah ditolak 403 tanpa histori. Guard bisnis T9, T11, T13, T15, dan T17 sampai T22 menyusul di Fase 7 dan 8 (D101 nomor 5) |
| T1 sampai T4, T6 sampai T8, T10, T12, T14, T16, dan T5 lewat gateway palsu teruji end-to-end | `orders.test.ts`, `available-now.test.ts`, `order-execution.test.ts`, `order-expiry.test.ts`, dan collection Postman Fase 6 folder 04 sampai 09 |
| Dua klaim paralel menghasilkan tepat satu pemenang | `available-now.test.ts`, dua request sungguhan dengan pola tahan kunci lalu lepas, dibuktikan gagal kalau UPDATE bersyarat diganti pola baca lalu cek |

Angka penutupan: 561 test lulus di 29 file, collection Postman Fase 6 84 request dengan 142 assertion tanpa gagal. Keputusan yang lahir selama Fase 6: D100 sampai D116. Belum diperiksa: event `order:offer_closed` dari T3 karena deadline lewat klien Socket.IO, cron yang benar-benar berjalan menurut jadwalnya, dan perilaku saat jam server aplikasi dan basis data berbeda.

## 4L. Keputusan Versi 2.17 (D117 sampai D118)

Keduanya muncul dari audit hutang teknis sebelum Fase 7 (9 November 2026), dan diterapkan di sesi perapian sebelum Fase 7. Tidak ada perubahan skema.

| # | Keputusan | Alasan |
|---|---|---|
| D117 | **Pengaturan `trust proxy` Express diambil dari env `TRUST_PROXY`**, berupa jumlah hop proxy tepercaya. Variabel ini **wajib diisi tanpa nilai bawaan**, sama dengan variabel env lain (PRD 5.6): 0 untuk lokal dan pengujian, dan sesuai jumlah proxy di lingkungan deploy. String kosong juga ditolak. Sebelumnya di-hardcode 1 | Seluruh rate limit per IP, termasuk batas tebak password di login, membaca `req.ip`. Kalau API berjalan tanpa proxy di depannya tapi `trust proxy` bernilai 1, siapa pun bisa mengirim header `X-Forwarded-For` palsu yang berganti-ganti dan melewati semua batas itu. Kalau jumlah hop tidak sesuai, batasnya mengenai alamat yang salah. Berkaitan dengan H91, karena pengaturan pengujian beban k6 juga bergantung pada cara alamat IP dibaca. Dibuat wajib karena lupa mengisinya di lingkungan deploy yang punya proxy, misalnya Railway atau Render, akan membuat semua pengguna terbaca dari satu IP proxy dan berbagi kuota rate limit. Dengan variabel wajib, kesalahan itu langsung terlihat saat aplikasi gagal start |
| D118 | **`POST /auth/forgot-password` juga dibatasi 3 kali per jam per alamat email tujuan**, selain batas 3 per jam per IP yang sudah ada. Permintaan yang melewati batas diabaikan diam-diam: email tidak dikirim, tapi balasannya tetap 200 dengan isi yang sama | Batas per IP saja tidak mencegah inbox satu korban dibanjiri dari banyak alamat IP, padahal itu tujuan H36. Balasan yang tetap 200 menjaga endpoint ini tidak bisa dipakai menebak email mana yang terdaftar, sama seperti perilaku untuk email yang tidak terdaftar |

**Catatan audit hutang teknis (9 November 2026).** Audit membaca kode dan test untuk H yang belum dicentang. Temuan yang tidak menjadi keputusan baru:

- **Rumusan H55 diselaraskan.** Kode, test, CLAUDE.md jebakan 4, dan PRD 8.2 memperlakukan nominal palsu dari client sebagai **diabaikan**, bukan ditolak. Register mengikuti perilaku itu
- **H93 dibuka kembali.** Cabang "listing tanpa atribut berdurasi memakai kolom listing" ternyata tidak punya integration test, karena fixture order selalu memakai atribut berdurasi. Satu test yang sama menutup H85 dan H93
- **Desain retry email H37 belum bisa dibangun dengan skema sekarang.** Tabel `notifications` tidak punya kolom hitungan percobaan, dan isi email non-token tidak disimpan lengkap. Diputuskan di awal Fase 10: kolom `email_attempts` ditambah penyimpanan isi email lengkap, atau render ulang dari `reference_type` dan `reference_id`

## 4M. Keputusan Versi 2.18 (D119 sampai D122)

Diputuskan sebelum Fase 7, untuk empat kasus webhook pembayaran yang tidak diatur dokumen. Tidak ada perubahan skema.

| # | Keputusan | Alasan |
|---|---|---|
| D119 | **Pembayaran yang masuk setelah order tidak lagi ACCEPTED** (sudah PAYMENT_EXPIRED atau CANCELLED) dicatat apa adanya: `payments` ditandai PAID beserta `paid_amount` dan `paid_at`. Order tidak ditransisikan, ledger `ESCROW_HOLD` tidak ditulis, dan kasusnya ditandai untuk refund otomatis di Fase 8 (H99) | Uangnya memang sudah masuk, jadi catatan pembayaran harus jujur. Menghidupkan kembali order yang sudah mati akan membongkar slot pekerja yang sudah dilepas dan bisa sudah dipakai order lain. Kasus ini bisa terjadi kalau panggilan expire invoice ke Xendit gagal atau terlambat |
| D120 | **T5 hanya dijalankan kalau `paid_amount` sama dengan `amount`.** Kalau berbeda, payment tetap PENDING, `paid_amount` tetap disimpan, event dicatat FAILED dengan pesan selisih nominal, dan diserahkan ke admin. Event seperti ini tidak diproses ulang otomatis oleh D121 | Menjaga H12. Pada Invoice API selisih nominal hampir mustahil, tapi kalau terjadi, menerima pembayaran kurang sebagai lunas berarti escrow berisi uang yang tidak ada. Memproses ulang otomatis tidak ada gunanya, karena hasilnya akan sama |
| D121 | **Cron pemulihan webhook juga memproses ulang event FAILED dari payload yang tersimpan**, maksimal 3 kali lewat kolom `retry_count`, selain mengembalikan event PROCESSING yang macet lebih dari 5 menit ke FAILED. Event yang ditandai tidak boleh diulang, seperti D120, dilewati | Handler selalu membalas 200 (PRD 4.4 langkah 6), jadi Xendit tidak akan mengirim ulang event yang gagal karena error sementara, misalnya koneksi basis data putus sebentar. Tanpa pemrosesan ulang, pembayaran yang sah bisa tidak pernah tercatat |
| D122 | **Webhook invoice berstatus EXPIRED hanya mengubah payment yang `xendit_invoice_id`-nya cocok, dan hanya kalau masih PENDING.** Order tidak pernah ditransisikan dari webhook ini | T6 tetap tugas cron, sehingga jalur kedaluwarsa order hanya satu. Pencocokan lewat invoice id mencegah callback EXPIRED untuk invoice lama mematikan payment baru, setelah client membuat ulang invoice lewat `POST /orders/:id/payment` (D104) |

**Pembagian Fase 7 dalam tiga sesi:** 7a adapter Xendit, timeout gateway (H96), dan endpoint pembayaran; 7b webhook invoice, T5 lewat webhook dengan `ESCROW_HOLD`, D119 sampai D122, dan cron pemulihan webhook; 7c settlement T18 dengan `ESCROW_RELEASE`, uji rekonsiliasi V1, collection Postman Fase 7, uji end-to-end ke sandbox lewat tunnel, dan penutupan Fase 7.

## 4N. Keputusan Versi 2.19 (D123 sampai D124)

Keduanya muncul di sesi 7a dan sudah diterapkan di kode. Tidak ada perubahan skema.

| # | Keputusan | Alasan |
|---|---|---|
| D123 | **Aturan dua endpoint pembayaran.** (1) `POST /orders/:id/payment` menolak order yang bukan ACCEPTED dengan 409 `ORDER_TRANSITION_NOT_ALLOWED` (preseden D113), dan menolak `payment_deadline_at` yang sudah lewat dengan 409 `PAYMENT_DEADLINE_PASSED`. (2) Kalau order ACCEPTED tidak punya payment PENDING dan deadline belum lewat, dibuat baris PENDING baru dengan `external_id` baru, dijaga `uniq_payment_pending_per_order`. (3) `GET /orders/:id/payment` mengembalikan payment terbaru apa pun statusnya, dan 404 kalau order belum punya payment. Keduanya hanya untuk client pemilik order | PRD hanya menyebut kedua endpoint tanpa aturan rinci. Poin (2) menutup jalan buntu: kalau invoice sempat di-expire sebelum deadline, misalnya manual dari dashboard Xendit lalu ditandai EXPIRED lewat D122, client tetap bisa membayar alih-alih order mati di T6 tanpa kesalahan siapa pun |
| D124 | **Satu baris payment hanya memegang satu invoice.** Invoice hanya diisi ke baris yang `xendit_invoice_id`-nya masih kosong. Pembuat invoice yang kalah balapan langsung meng-expire invoicenya sendiri dan tidak menimpa baris. Kalau expire itu juga gagal, galatnya dicatat ke log dan prosesnya lanjut, sehingga client tetap menerima invoice pemenang | Balapan ini nyata: `afterCommit` T1 bisa menunggu Xendit sampai timeout, dan selama itu client sudah melihat order ACCEPTED lalu menekan bayar. Tanpa aturan ini, invoice pertama tertimpa di baris payment padahal masih bisa dibayar |

**Catatan implementasi sesi 7a tanpa nomor D:**

- **Adapter Xendit memakai fetch langsung** dengan `AbortSignal.timeout` 10 detik (H96), mengikuti preseden `lib/supabase.ts`, tanpa SDK. Timeout, galat jaringan, dan respons non-2xx dipetakan ke 502 `PAYMENT_GATEWAY_ERROR` tanpa membawa kunci maupun isi balasan Xendit
- **`POST /orders/:id/payment` mengunci baris order** sebelum memeriksa status dan deadline. Tanpa kunci ini, pembatalan yang commit bersamaan bisa meninggalkan invoice yang masih bisa dibayar untuk order yang sudah batal
- **Kalau order batal saat invoice sedang dibuat**, id invoice tetap tercatat di baris payment walaupun expire-nya gagal, supaya webhook masih bisa menemukannya sebagai kasus D119

**Hasil uji sandbox Xendit (10 November 2026)** lewat `apps/api/scripts/xendit-smoke.ts`, yang memanggil adapter asli:

- Invoice Rp10.000 dengan durasi 10 menit berhasil dibuat dan di-expire. Batas minimum nominal dan durasi Xendit tidak menjadi masalah untuk rentang harga di Lampiran B
- **Xendit menerima `external_id` ganda dan memberi invoice id yang berbeda.** Akibatnya, setelah T1 timeout bisa ada dua invoice hidup untuk satu payment. Webhook PAID di sesi 7b wajib dicocokkan lewat `xendit_invoice_id`, bukan `external_id`. Perlakuan untuk invoice yatim yang ternyata dibayar diputuskan di awal sesi 7b

## 4O. Keputusan Versi 2.20 (D125)

Diputuskan sebelum sesi 7b, berdasarkan hasil uji sandbox di Bagian 4N. Tidak ada perubahan skema.

| # | Keputusan | Alasan |
|---|---|---|
| D125 | **Webhook PAID mencari payment lewat `xendit_invoice_id` lebih dulu, lalu lewat `external_id` kalau tidak ketemu.** Yang ketemu lewat `external_id` adalah invoice yatim, yaitu invoice yang dibuat Xendit saat T1 timeout tapi tidak tercatat di baris payment. (1) Kalau payment-nya belum PAID: baris payment dipindahkan ke invoice yang dibayar (`xendit_invoice_id` diganti), invoice yang tadinya tercatat di-expire lewat `afterCommit`, lalu diproses seperti PAID biasa, yaitu T5 atau D119, dengan D120 tetap berlaku. (2) Kalau payment-nya sudah PAID (client membayar dua kali): tidak dibuat baris baru, event dicatat dengan penanda bayar dobel, ditulis ke log sebagai error, dan menjadi kasus H99. (3) Kalau `external_id` tidak dikenal sama sekali: event dicatat, tidak ada yang diubah, dan dibalas 200. Satu-satunya pengecualian D124: baris payment boleh berganti invoice, tapi hanya ke invoice yang sudah terbukti dibayar | Uji sandbox membuktikan Xendit menerima `external_id` ganda dan memberi invoice id berbeda, sehingga setelah T1 timeout bisa ada dua invoice hidup untuk satu payment. Client bisa membayar invoice yatim karena Xendit dapat mengirim tautannya ke email client. Skema membatasi pilihannya: `xendit_external_id` bersifat unique sehingga invoice yatim tidak bisa jadi baris baru, dan `uniq_payment_paid_per_order` hanya membolehkan satu payment PAID per order sehingga pembayaran kedua tidak bisa dicatat sebagai PAID. Catatan pembayaran mengikuti uang yang benar-benar masuk |

## 4P. Keputusan Versi 2.21 (D126 sampai D128)

Ketiganya muncul saat menyusun rencana sesi 7b dan sudah diterapkan di kode. Tidak ada perubahan skema.

| # | Keputusan | Alasan |
|---|---|---|
| D126 | **Bayar dobel berarti order sudah punya payment PAID di baris mana pun**, baik payment yang ditemukan lewat invoice id maupun lewat jalur invoice yatim. Event dicatat FAILED dengan penanda `DOUBLE_PAYMENT`, tidak diproses ulang, ditulis ke log sebagai error, dan menjadi kasus H99. Pemeriksaan ini dijalankan **setelah** pemeriksaan "invoice yang sama sudah PAID di baris yang sama", yang berakhir IGNORED. Memperluas D125 nomor 2 | Rumusan D125 nomor 2 hanya menangkap "baris yang ditemukan sudah PAID". Ada kasus yang lolos: payment lama di-expire lewat D122, client membayar payment baru, lalu juga membayar invoice yatim milik payment lama. Tanpa perluasan ini, event-nya menabrak `uniq_payment_paid_per_order`, diulang tiga kali oleh cron, lalu berakhir FAILED tanpa penanda, sehingga uang yang masuk dua kali tidak terlihat sebagai kasus refund. Urutan pemeriksaan mencegah SETTLED setelah PAID salah ditandai bayar dobel |
| D127 | **Webhook invoice berstatus SETTLED diproses lewat jalur yang sama dengan PAID.** Kalau PAID untuk invoice yang sama sudah tercatat, event SETTLED berakhir IGNORED. Status selain PAID, SETTLED, dan EXPIRED dicatat IGNORED | Xendit bisa mengirim SETTLED, dan untuk sebagian metode bisa datang tanpa PAID lebih dulu. Mengabaikannya berisiko kehilangan pembayaran. Jalur PAID sudah idempoten di level payment, jadi aman diproses dua kali |
| D128 | **Galat sebelum kunci event diambil dibalas 5xx** lewat error handler, supaya Xendit mengirim ulang. Galat yang dimaksud terjadi di transaksi 1 atau saat UPDATE kunci. Setelah kunci diambil, balasannya selalu 200 dan kegagalan ditangani kolom FAILED serta cron (D121). Memperjelas PRD 4.4 langkah 6 | Aturan "selalu balas 200" ditujukan untuk kegagalan bisnis yang sudah tercatat dan bisa dipulihkan cron. Sebelum event tercatat, tidak ada apa pun di basis data yang bisa dipulihkan, sehingga pengiriman ulang dari Xendit adalah satu-satunya jalan. Event yang terkirim dua kali tetap aman karena `event_id` unique |

**Catatan implementasi sesi 7b tanpa nomor D:**

- **T5 hanya punya satu implementasi**, `settlePaid`, yang dipakai webhook dan simulate-payment. Keduanya menulis `ESCROW_HOLD`. Saldo wallet dinaikkan lewat satu UPDATE dengan increment, yang mengunci baris wallet dan mengembalikan saldo sesudahnya untuk kolom `balance_*_after`
- **Urutan kunci di jalur uang: order, lalu payment, lalu wallet.** Kunci `webhook_events` diambil lewat UPDATE bersyarat yang commit sendiri, jadi tidak dipegang selama transaksi 2. Settlement T18 di sesi 7c wajib mengikuti urutan yang sama
- **Kasus D119 bisa dicari di log basis data**: event berstatus PROCESSED dengan pesan pembayaran telat di `error_message`
- **Seluruh jalur PAID dan SETTLED mengunci baris payment dengan `FOR UPDATE` setelah order dikunci.** Tanpa kunci ini, pemindahan invoice yatim (D125 nomor 1) bisa menimpa invoice baru dari jalur renew yang terisi bersamaan tanpa meng-expire-nya. Dibuktikan dengan test balapan yang deterministik dan uji mutasi: tanpa `FOR UPDATE`, test gagal 3 dari 3 kali
- **Webhook ikut kena batas global 100 request per menit per IP.** Aman di skala penelitian, tapi stress test k6 untuk webhook harus memperhitungkannya (H91)

---

## 4Q. Keputusan Versi 2.22 (D129 dan D130)

Keduanya diusulkan di sesi 7c dan sudah diterapkan di kode. Tidak ada perubahan skema.

| # | Keputusan | Alasan |
|---|---|---|
| D129 | **`GET /providers/me/wallet` dan `GET /providers/me/wallet/transactions` dimajukan dari Fase 8 ke Fase 7.** Keduanya hanya membaca dan hanya untuk pemilik usaha (`requireProvider`). Riwayat transaksi dipaginasi sesuai PRD 4.1, urut terbaru dulu, nominal dalam rupiah bulat. Withdrawal tetap di Fase 8 | Kriteria Fase 7 (satu `ESCROW_HOLD`, saldo available bertambah setelah T18) harus bisa dibuktikan lewat API di Postman, bukan hanya lewat kueri basis data. Endpoint baca tidak mengubah alur uang, jadi memajukannya tidak menggeser lingkup Fase 8 |
| D130 | **Seed demo Fase 6 dan Fase 7 menghapus `wallet_transactions` milik wallet akun demo** sebelum menghapus akun itu. Akun demo dikenali dari email yang persis tercantum di daftar `ACTORS`. Seed menolak jalan saat `NODE_ENV=production`. Ini satu-satunya pengecualian aturan ledger append-only (CLAUDE.md aturan 3), dan kodenya diberi komentar yang menyebut itu | Sejak 7b, simulate-payment menulis ledger. Menghapus akun demo ikut menghapus wallet lewat cascade, sedangkan `wallet_transactions` memakai RESTRICT, sehingga seed tidak bisa dijalankan dua kali. Data yang dihapus adalah data buatan tanpa nilai audit, dan cakupannya dibatasi ke email yang dikenal persis. Terbukti di sesi 7c: seed dijalankan ulang setelah newman, ledger demo kembali 0, dan baris lain tidak tersentuh |

**Catatan implementasi sesi 7c tanpa nomor D:**

- **T18 dijalankan `settleOrder` lewat `sweepSettlements`, cron tiap 5 menit.** Kunci order diambil dulu, lalu wallet lewat `writeEscrow`, sesuai urutan di Bagian 4P. `holdEscrow` diganti `writeEscrow(tx, order, 'ESCROW_HOLD' | 'ESCROW_RELEASE')`, tetap satu UPDATE increment sehingga kolom `balance_*_after` tetap benar
- **Order dengan dispute OPEN atau UNDER_REVIEW disaring sejak pemilihan kandidat**, supaya tidak menyumbat kepala antrean, lalu diperiksa ulang oleh guard di dalam transaksi
- Satu order yang gagal tidak menghentikan order lain di batch yang sama. Log sweep settlement menyebut `settled`, bukan `expired`. Bentuk `SweepResult` tidak berubah karena Postman Fase 6 membacanya
- Router dev: `PATCH /dev/orders/:id/deadline` menerima `settlement_due_at` untuk order COMPLETED, dan `POST /dev/jobs/:job/run` menerima `settlement` serta `webhook-recovery`. Hasil job settlement berbentuk `{candidates, settled, failed}`
- `settled_at` belum ada di DTO order, jadi Postman memeriksa status SETTLED saja
- Masa aktif pesan diturunkan dari `settlement_due_at`, jadi T18 tidak butuh kode tambahan untuk itu. Penegakannya tetap di modul pesan Fase 10 (H70)
- **H3 kini terbukti lewat perilaku untuk sisi `ESCROW_RELEASE`**: dua sweep bersamaan menghasilkan satu RELEASE, dan RELEASE ganda ditolak `uniq_escrow_event_per_order`
- **Guard dispute di dalam `settleOrder` belum punya test**, karena jalur pembuka sengketa (T19) baru dibangun di Fase 8. Dicatat sebagai H100 supaya tidak terlupa

**Penutupan Fase 7 (11 November 2026).** Seluruh kriteria PRD Bagian 9 dan D101 nomor 5 terpenuhi di `jasana_test`. Typecheck bersih, 627 test di 34 file lulus. Postman Fase 7: 58 request dan 113 assertion tanpa gagal, diulang sekali di server baru. Regresi Postman Fase 1 sampai 6, masing-masing dengan seed sendiri: 391 request dan 997 assertion tanpa gagal.

| Kriteria | Bukti | Status |
|---|---|---|
| Webhook duplikat menghasilkan satu `ESCROW_HOLD` | Test duplikat paralel di 7b dan Postman Fase 7 folder 01 (dikirim ulang, ledger tetap satu baris) | Lulus |
| V1 tetap 0 baris | `afterEach` di test webhook dan settlement, ditambah `db:verify` saat ledger berisi HOLD dan RELEASE. V1, V5 sampai V8, V11, dan V12 semuanya 0 baris | Lulus |
| T5 lewat webhook, end-to-end | Test alur T1 sampai T18 lewat endpoint webhook dan Postman folder 01 | Lulus, termasuk dengan webhook dari sandbox Xendit sungguhan (lihat di bawah) |
| T18 end-to-end | Test alur lengkap dan Postman folder 05: saldo available sama dengan earning, pending 0 | Lulus |
| D119, D120, D122 lewat API | Postman folder 02 sampai 04 | Lulus |
| D101 nomor 5 | T5 lewat webhook dan T18 terpasang. T9, T11, T13, T15, T17, dan T19 sampai T22 tetap di Fase 8 | Sesuai |

**Uji sandbox Xendit (12 November 2026, dijalankan penyusun).** `PAYMENT_GATEWAY=xendit` dengan secret key dan verification token mode test, basis data Supabase dev, webhook diterima lewat tunnel ngrok. Quick tunnel cloudflared tidak bisa dipakai karena dashboard Xendit menolak menyimpan URL-nya dengan pesan URL mengandung IP privat atau lokal, padahal URL itu bisa diakses publik.

| Langkah | Hasil |
|---|---|
| Order `ORD-20261112-176E38E0` dibuat lalu di-accept pemilik (T1) | Accept pukul 16:33:37 UTC, batas bayar 16:43:35, invoice di `checkout-staging.xendit.co` sebesar Rp1.500.000 |
| Invoice dibayar di checkout mode test | Xendit mencatat `paid_at` 16:34:56 |
| Webhook `invoice:6af5ea62a4105c5a534037b8:PAID` | Diterima 16:35:00.936, `signature_valid` true, PROCESSED pada 16:35:06.316, `error_message` kosong |
| Order dan payment | Order PAID (`paid_at` 16:35:04), payment PAID |
| Ledger | Tepat satu `ESCROW_HOLD`, pending +Rp1.350.000 (`provider_earning`, bukan total tagihan), available 0 |
| `db:verify` di Supabase dev | V1, V5 sampai V8, V11, dan V12 nol baris |

Tidak ada event SETTLED untuk invoice ini, jadi jalur D127 hanya terbukti lewat test. Jarak sekitar 5,4 detik antara `received_at` dan `processed_at` adalah waktu transaksi 2 yang bolak-balik dari mesin lokal ke Supabase dev. Xendit tetap menerima 200, tapi angka ini menjadi catatan untuk stress test: latensi jaringan ke basis data akan mendominasi kalau k6 dan API tidak dijalankan dekat dengan basis data (H91, H92)

---

## 4R. Keputusan Versi 2.24 (D131 sampai D135)

Diputuskan sebelum Fase 8, untuk aturan uang yang belum diatur dokumen. Sebagian dipicu temuan bahwa Refund API Xendit tidak mendukung Virtual Account. Tidak ada tabel atau kolom baru, hanya dua partial unique index (H101, H102).

| # | Keputusan | Alasan |
|---|---|---|
| D131 | **Refund pembatalan setelah bayar (T9, T11) selalu penuh**, sebesar `total_amount` termasuk platform fee (`platform_fee_refunded = platform_fee`), siapa pun yang membatalkan: client, pemilik, atau admin. Tidak ada biaya pembatalan. Memperluas D29, yang hanya mengatur refund akibat kesalahan provider | Sistem tidak punya mekanisme kompensasi untuk pekerja yang sudah berangkat, jadi potongan dari client tidak punya tujuan yang jelas di alur dana. Biaya pembatalan berjenjang menambah aturan yang harus dipertahankan tanpa menambah apa pun pada mekanisme escrow yang diteliti. Dicatat sebagai batasan (H103) |
| D132 | **`REFUND_DEDUCTION` ditulis di transisi yang memicu refund, di transaksi yang sama**: T9 dan T11 (`pending -= provider_earning`), T20 parsial (bagian provider menurut D133), dan T21 (`pending -= provider_earning`). T22 hanya mengubah status order dan baris `refunds`, tidak menulis ledger. Satu order paling banyak punya satu `REFUND_DEDUCTION` (H101). Akibatnya uang bergerak di **enam** transisi: T5, T9, T11, T18, T20, dan T21 | Begitu order batal atau diputus refund, dana escrow bukan lagi hak penyedia, terlepas dari kapan uangnya sampai ke client. Menunda pencatatan sampai webhook refund membuat ledger bergantung pada pihak luar yang bisa lambat, gagal, atau untuk Virtual Account tidak ada sama sekali. Rumusan lama T22 "kalau belum ditulis" membuka dua tempat penulisan untuk kejadian yang sama |
| D133 | **Rumus putusan PARTIAL (T20).** Admin mengisi `refund_amount` dalam rupiah bulat dengan 0 < `refund_amount` < `total_amount`. `platform_fee_refunded = round(platform_fee × refund_amount / total_amount)`. Bagian provider `= refund_amount − platform_fee_refunded`, ditulis sebagai `REFUND_DEDUCTION`. `ESCROW_RELEASE = provider_earning − bagian provider`. Kedua baris ledger ditulis di transaksi yang sama. Putusan REFUND penuh mengembalikan platform fee penuh (D29), putusan RELEASE melepas `provider_earning` penuh | Platform fee dikembalikan sebanding dengan porsi refund, sehingga platform tidak untung dari layanan yang dinilai cacat sebagian. Bagian provider dihitung sebagai selisih, bukan dibulatkan sendiri, jadi `refund_amount` selalu terbagi habis tanpa rupiah yang hilang. Karena `refund_amount < total_amount`, bagian provider selalu lebih kecil dari earning sehingga `ESCROW_RELEASE` tetap positif dan saldo pending tidak pernah negatif |
| D134 | **Pembalikan withdrawal.** `WITHDRAWAL_REVERSAL` sebesar `amount` penuh, termasuk admin fee, ditulis pada tiga kejadian: admin menolak pengajuan (REJECTED), payout berakhir FAILED, dan payout yang sudah SUCCEEDED berubah REVERSED. Satu withdrawal paling banyak punya satu reversal (H102). Payout dikirim dengan idempotency key berupa id withdrawal, sehingga percobaan ulang admin setelah panggilan gagal atau timeout tidak mengirim uang dua kali | Saldo didebit saat pengajuan (D15), jadi setiap jalan buntu wajib mengembalikannya, kalau tidak saldo penyedia hilang tanpa uang yang keluar. Admin fee hanya sah kalau payout benar-benar terjadi. Tanpa constraint, webhook FAILED yang dikirim ulang Xendit bisa mengembalikan saldo dua kali |
| D135 | **Refund untuk pembayaran yang tidak menghidupkan order (H99).** Pembayaran telat (D119) di-refund otomatis penuh: dibuat baris `refunds` FULL untuk payment itu tanpa menulis ledger, karena `ESCROW_HOLD` tidak pernah ditulis. Status order tidak berubah, karena T22 hanya untuk order yang batal lewat T9 atau T11. Pembayaran dobel (D125 nomor 2, D126) tidak dicatat di `refunds`, karena invoice-nya tidak punya baris payment, dan ditangani admin di luar sistem berdasarkan event `webhook_events` bertanda `DOUBLE_PAYMENT` (H104) | Kasus D119 punya semua data yang dibutuhkan refund. Kasus bayar dobel sangat jarang dan butuh kolom invoice baru di `refunds` hanya untuk dirinya |

**Pembagian Fase 8 dalam empat sesi:**

- **8a.** Adapter `PaymentGateway.refund()` dan `.payout()` beserta timeout dan implementasi fake, lalu skrip smoke ke sandbox: refund invoice e-wallet, refund invoice VA, dan payout ke rekening uji. Payload webhook refund dan payout dicatat. Hasilnya menutup keputusan terbuka nomor 6, sama seperti 7a menghasilkan D123 dan D124
- **8b.** Withdrawal: pengajuan (H83), approve dan reject admin, payout setelah commit, webhook payout (`payout:<id>:<status>`), reversal (D134), dan H102
- **8c.** Pembatalan berbayar T9 dan T11, refund sesuai keputusan nomor 6, webhook refund, T22, refund pembayaran telat (D135), dan H101
- **8d.** Dispute T13, T15, T17, dan T19, unggah bukti multipart (H78, H79), review dan putusan admin T20 dan T21 (D133), test wajib H100, lalu Postman Fase 8, regresi, audit, uji sandbox, dan penutupan Fase 8

Urutannya sengaja withdrawal dulu karena modul itu paling mandiri dan tidak menyentuh state machine order. Dispute di akhir karena T20 dan T21 memakai fungsi refund dari 8c.

---

## 4S. Keputusan Versi 2.25 (D136 sampai D137)

Berdasarkan uji sandbox sesi 8a (14 November 2026). D136 menutup keputusan terbuka nomor 6. Tidak ada perubahan skema.

| # | Keputusan | Alasan |
|---|---|---|
| D136 | **Refund memakai dua jalur, dipilih dari `payments.payment_method`.** (1) Pembayaran `EWALLET` di-refund lewat `POST /refunds` dengan `invoice_id`, `reference_id` berisi `refunds.id`, dan header idempotency berisi nilai yang sama. Baris `refunds` menjadi PROCESSING dengan `xendit_refund_id` terisi. (2) Metode lain, termasuk Virtual Account, tidak memanggil API: baris `refunds` tetap REQUESTED, admin mentransfer di luar sistem, lalu menandainya selesai lewat endpoint admin. (3) Kalau jalur API ditolak dengan galat 4xx apa pun, refund jatuh ke jalur manual. Jalur tidak pernah ditentukan dari `error_code`. (4) Webhook refund dicocokkan lewat `data.reference_id` = `refunds.id`. `refund.succeeded` menjadikan refund COMPLETED, yang untuk order batal memicu T22. `refund.failed` menjadikan refund FAILED, lalu admin menyelesaikannya lewat jalur manual. Ledger tidak tersentuh di sini, karena sudah ditulis saat transisi (D132) | Sandbox membuktikan refund e-wallet lewat `invoice_id` diterima penuh maupun parsial, dengan respons PENDING lalu webhook SUCCEEDED. Refund VA ditolak dengan dua kode berbeda (`REFUND_NOT_SUPPORTED` dan `TRANSACTION_NOT_FOUND`), jadi kode galat tidak bisa dijadikan penentu jalur. `payment_method` sudah tersimpan dari webhook PAID sejak Fase 7. Mencocokkan lewat id kita sendiri membuat webhook tetap bisa diproses walaupun panggilan API timeout sebelum `xendit_refund_id` tersimpan, celah yang sama dengan invoice yatim di Fase 7 (D125) |
| D137 | **Payout memakai `POST /v2/payouts`.** `withdrawals.bank_code` menyimpan kode channel Xendit (misalnya `ID_BCA`), dan nominal payout adalah `net_amount`. Respons awal Xendit selalu ACCEPTED, termasuk untuk payout yang nanti gagal, sehingga setelah API menerima withdrawal berpindah ke DISBURSING, dan COMPLETED atau FAILED hanya ditentukan webhook. Webhook payout dicocokkan lewat `data.reference_id` = `withdrawals.id`. `xendit_payout_status` menyimpan status mentah dan `failure_code` disalin apa adanya (D18). FAILED memicu reversal menurut D134 | Sandbox membuktikan respons awal untuk rekening pemicu gagal (999999 dan 121212) tetap ACCEPTED, lalu `payout.failed` datang sekitar 1,5 menit kemudian dengan `REJECTED_BY_CHANNEL` dan `INVALID_DESTINATION`. Payout kedua dengan Idempotency-key dan payload sama mengembalikan id yang sama di tiga percobaan, jadi D134 terbukti. `reference_id` dan `idempotency_key` di webhook sama dengan id yang kita kirim |

**Hasil uji sandbox sesi 8a (14 November 2026, dijalankan penyusun di Supabase dev):**

| Uji | Hasil |
|---|---|
| Refund penuh e-wallet GoPay, dua invoice | Diterima PENDING, webhook `refund.succeeded` sekitar 1 sampai 2 detik kemudian |
| Refund parsial e-wallet Rp5.000 dari Rp20.000 | Diterima PENDING, webhook `refund.succeeded` |
| Refund VA BNI | Ditolak 400 `REFUND_NOT_SUPPORTED` |
| Refund VA Permata | Ditolak 400 `TRANSACTION_NOT_FOUND` |
| Payout Rp10.000 ke rekening uji | ACCEPTED, `payout.succeeded` sekitar 5 detik kemudian |
| Payout dengan Idempotency-key dan payload sama | Id sama, Xendit tidak membuat payout kedua |
| Payout ke 999999 dan 121212 | ACCEPTED, lalu `payout.failed` dengan `REJECTED_BY_CHANNEL` dan `INVALID_DESTINATION` |
| Invoice dari skrip dibayar | Webhook PAID tercatat IGNORED karena `external_id` tidak dikenal, membuktikan D125 nomor 3 dengan webhook sungguhan |

**Catatan sesi 8a tanpa nomor D:**

- Payload webhook invoice PAID untuk e-wallet memuat `payment_id` (awalan `ewc_`), sedangkan untuk VA tidak. Kalau refund legacy suatu saat dimatikan, migrasi ke `POST /v3/refunds` bisa memakai `payment_id` dari payload yang sudah tersimpan tanpa perubahan skema. Payouts v3 juga sudah tersedia. Keduanya hanya menyentuh `payment-gateway.ts`, karena service lain hanya mengenal port `PaymentGateway`
- Tombol "Test and save" di dashboard mengirim event contoh sungguhan. Event itu ikut tercatat di `webhook_events` sebagai IGNORED dan tidak perlu dihapus
- Payload sungguhan disimpan sebagai fixture di `apps/api/tests/fixtures/xendit-sandbox-8a.json` dengan `business_id` disamarkan
- Di dashboard, URL refund dipasang di kolom Unified Refunds (succeeded dan failed), dan URL payout di kolom Payouts v2

---

## 4T. Keputusan Versi 2.26 (D138 sampai D139)

Dari sesi 8b. D138 ditetapkan sebelum sesi berdasarkan hasil sandbox 8a, D139 muncul saat menyusun rencana. Satu partial unique index baru (H102), tanpa tabel atau kolom baru.

| # | Keputusan | Alasan |
|---|---|---|
| D138 | **Aturan approve withdrawal.** (1) REQUESTED menjadi APPROVED lalu commit, baru payout dipanggil sebesar `net_amount` dengan Idempotency-key id withdrawal dan payload yang seluruhnya dibentuk dari baris withdrawal, termasuk deskripsi, sehingga setiap percobaan ulang identik. (2) Xendit menerima: DISBURSING, `xendit_payout_id` dan status mentah diisi. (3) Timeout, galat jaringan, 5xx, atau balasan yang tidak dikenali: tetap APPROVED, `failure_code` dicatat, dibalas 502 `PAYMENT_GATEWAY_ERROR`. Approve pada status APPROVED berarti coba ulang dengan key yang sama. (4) Ditolak 4xx: FAILED dan `WITHDRAWAL_REVERSAL` di satu transaksi, dibalas 200 dengan status FAILED. Reversal hanya ditulis kalau UPDATE bersyarat dari APPROVED mengenai tepat satu baris, sehingga webhook yang mendahului tidak menghasilkan reversal kedua. (5) Webhook SUCCEEDED, FAILED, dan CANCELLED diterima dari APPROVED maupun DISBURSING, karena webhook bisa datang sebelum respons API diproses | Sandbox 8a membuktikan respons awal payout selalu ACCEPTED, termasuk untuk payout yang nanti gagal, dan Idempotency-key yang sama dengan payload sama tidak membuat payout kedua. Timeout berarti status payout tidak diketahui, sehingga mengembalikan saldo berisiko membayar dua kali, sedangkan mencoba ulang aman. Penolakan 4xx berarti payout pasti tidak dibuat, sehingga saldo harus langsung kembali. Kode HTTP memberi tahu admin apakah hasilnya final (200) atau harus dicoba lagi (502), sama seperti pembuatan ulang invoice di Fase 7 |
| D139 | **Xendit 409 dikecualikan dari D138 nomor 4.** 409 berarti Idempotency-key sudah dipakai payout lain dengan payload berbeda. Diperlakukan seperti galat sementara: tetap APPROVED, `failure_code` dicatat, tanpa reversal, dan admin memeriksa di dashboard Xendit. Webhook payout untuk key itu tetap dicocokkan lewat `reference_id` dan menyelesaikan statusnya | Payout dengan key itu sudah ada di Xendit, jadi uangnya mungkin sudah atau sedang keluar. Menjadikannya FAILED dengan reversal bisa membuat penyedia menarik dana yang sama dua kali. Karena payload dibentuk deterministik dari baris withdrawal (D138 nomor 1), 409 seharusnya tidak pernah muncul, dan kalau muncul itu tanda ada yang salah sehingga perlu diperiksa manusia |

**Catatan implementasi sesi 8b tanpa nomor D:**

- **Debit saldo pengajuan lewat satu UPDATE bersyarat** (`balance_available >= amount`), bukan baca lalu cek. Dua pengajuan paralel yang jumlahnya melebihi saldo menghasilkan tepat satu yang berhasil, dibuktikan test yang menahan kunci wallet sampai kedua request benar-benar menunggu
- **Urutan kunci:** pengajuan hanya mengunci wallet. Seluruh jalur reversal (reject, payout 4xx, webhook FAILED atau CANCELLED, dan REVERSED) mengunci withdrawal dulu, baru wallet
- Webhook invoice dan payout memakai satu fungsi penerima dengan peta handler per domain. Cron pemulihan D121 ikut memproses domain PAYOUT. Event yang IGNORED tidak menimpa `xendit_payout_status`. Stub refund dari 8a tetap sampai sesi 8c
- Kode galat baru `WITHDRAWAL_STATE_CONFLICT` (409) untuk reject selain dari REQUESTED dan approve dari status selain REQUESTED atau APPROVED
- `withdrawal_admin_fee` boleh bernilai 0, yang berarti gratis. Pengajuan dengan `net_amount` nol atau negatif ditolak `WITHDRAWAL_BELOW_MINIMUM`, yang hanya mungkin terjadi kalau minimum disetel di bawah fee
- Pemilik usaha diberi notifikasi saat withdrawal REJECTED (beserta alasan), COMPLETED, FAILED, dan REVERSED. Untuk FAILED dan REVERSED disebutkan bahwa saldo sudah dikembalikan. Nomor rekening hanya ditampilkan empat digit terakhir
- DTO `/providers/me/wallet/transactions` kini memuat `withdrawal_id`
- **Saldo demo Postman Fase 8 dibuat lewat alur API sungguhan** (T1 sampai T18 di folder 00), bukan ditulis seed. Seed Fase 8 hanya membuat akun, sehingga seluruh baris ledger dihasilkan kode produksi
- Withdrawal yang macet di APPROVED setelah timeout hanya dicoba ulang kalau admin menekan approve lagi. Antrean admin bisa disaring per status untuk menemukannya
- H105 menemukan 12 galat tipe di 7 berkas test dan skrip yang selama ini lolos. Semuanya diperbaiki tanpa `any` atau `@ts-ignore`
- Satu `shortcut:` baru: filter status antrean admin belum punya index sendiri. Tambahkan `@@index([status, createdAt])` kalau antrean membesar

**Hasil sesi 8b:** typecheck bersih termasuk test dan skrip, 680 test lulus di 37 berkas, 21 dari 21 mutan mati. Postman Fase 8: 49 request dan 83 assertion tanpa gagal. Regresi Postman Fase 1 sampai 7 hijau. `db:verify` dan `db:check-constraints` lulus di `jasana_test`, termasuk index H102.

**Uji sandbox payout sesi 8b (14 November 2026, dijalankan penyusun di Supabase dev):** saldo diisi lewat folder 00 Postman Fase 8 dengan gateway fake, lalu server dijalankan ulang dengan gateway xendit. Withdrawal Rp100.000 ke rekening uji `1234567890` di-approve pukul 15:55:51 UTC, langsung DISBURSING dengan id `disb-f6cef850...`. Webhook `payout.succeeded` sebesar `net_amount` Rp93.500 datang sekitar 4 menit kemudian dengan `reference_id` sama dengan id withdrawal, tercatat PROCESSED, dan withdrawal menjadi COMPLETED. Withdrawal kedua ke rekening `121212` di-approve pukul 16:07:37 UTC dan masih Pending di dashboard Xendit lebih dari 20 menit kemudian tanpa webhook apa pun, padahal di sandbox 8a rekening yang sama gagal dalam 1,5 menit. Withdrawal-nya tetap DISBURSING, sesuai keadaan di Xendit. Kasus ini memperlihatkan celah H106. Waktu proses sandbox Xendit bervariasi dari detik sampai menit, sehingga test end-to-end tidak boleh menilai hasil dari satu kali cek.

---

## 4U. Keputusan Versi 2.27 (D140 sampai D147)

Dari sesi 8c. D140 ditetapkan sebelum sesi lalu diperbaiki saat review rencana, D141 sampai D143 dijawab sebelum rencana disusun, dan D144 sampai D147 muncul saat implementasi. Perubahan skema: `refunds.initiated_by` nullable, dua kolom baru di `refunds`, dan satu partial unique index (H101).

| # | Keputusan | Alasan |
|---|---|---|
| D140 | **Aturan eksekusi refund**, dijalankan setelah commit dan hanya dari REQUESTED. (1) Metode EWALLET atau FAKE memanggil Refund API dengan `reference_id` dan idempotency key berisi `refunds.id`, sebesar `paid_amount` (cadangan `amount`). Diterima: PROCESSING dengan `xendit_refund_id`. (2) Timeout, galat jaringan, 5xx, balasan yang tidak dikenali, atau **409**: PROCESSING tanpa id, karena status di Xendit belum pasti. (3) **4xx selain 409: FAILED**, yang berarti jalur API buntu dan diselesaikan manual, sama artinya dengan `refund.failed` dari webhook. (4) Metode lain tidak memanggil API dan tetap REQUESTED. (5) **Tandai selesai manual** hanya dari FAILED untuk metode apa pun, atau dari REQUESTED untuk metode non-API. Refund EWALLET atau FAKE yang REQUESTED atau PROCESSING ditolak 409 `REFUND_STATE_CONFLICT`. (6) Sync dari REQUESTED untuk metode API bertanya ke Xendit dulu, lalu mengulang eksekusi dengan key yang sama kalau tidak ditemukan | Status REQUESTED pada rumusan awal punya dua arti untuk refund e-wallet, yaitu "API belum menjawab" dan "API menolak, silakan manual". Admin tidak bisa membedakannya, sehingga transfer manual bisa terjadi tepat saat refund API sedang diproses, dan client menerima uang dua kali. Memisahkan keduanya ke status berbeda menutup jendela itu sepenuhnya. 409 diperlakukan seperti timeout karena alasan yang sama dengan D139. `paid_amount` dipakai karena refund pembayaran telat harus mengembalikan uang yang benar-benar masuk. Mengulang eksekusi aman karena idempotency key tidak berubah |
| D141 | **`refunds.initiated_by` nullable, null berarti refund dipicu sistem**, yaitu webhook pembayaran telat (D119, D135). Relasinya tetap Restrict | Refund pembayaran telat tidak diminta siapa pun. Mengisinya dengan id client mencatat sesuatu yang tidak terjadi, padahal jejak audit yang jujur adalah inti penelitian ini. Polanya sama dengan `created_by` SYSTEM di ledger |
| D142 | **Kolom `refunds.completion_note` dan `refunds.completed_by`** (FK users, SetNull) diisi jalur manual. Catatan transfer wajib saat admin menandai selesai | Transfer manual adalah kejadian uang keluar, jadi buktinya harus menempel di baris refund dan bisa dikueri langsung. Menyimpannya di metadata histori order memaksa refund pembayaran telat menulis baris histori tanpa transisi |
| D143 | **Sinkronisasi status ke Xendit (H106) hanya lewat aksi admin**, `POST /admin/withdrawals/:id/sync` dan `POST /admin/refunds/:id/sync`. Tidak ada cron, ditandai `shortcut:` | Pada skala penelitian admin cukup, dan antrean admin bisa disaring per status untuk menemukan yang tertahan. Ketiadaan cron dicatat sebagai batasan (H107) |
| D144 | **`getPayout` dan `getRefund` pada gateway palsu selalu mengembalikan SUCCEEDED** dengan id deterministik | Membuat sync bisa diuji lewat Postman dan test tanpa jaringan, dengan hasil yang bisa diramalkan |
| D145 | **Aturan sync.** Withdrawal boleh disync dari APPROVED, DISBURSING, atau COMPLETED, karena COMPLETED masih bisa berubah REVERSED. Refund boleh disync dari PROCESSING, atau dari REQUESTED untuk metode API. Hasil Xendit diterapkan lewat fungsi apply yang sama dengan webhook. Kalau tidak ditemukan di Xendit, dibalas 200 tanpa perubahan, dan galat gateway dibalas 502. Balasan berbentuk entitas beserta `sync: { gateway_status, outcome, message }` | Satu fungsi apply untuk webhook dan sync menjamin aturannya identik, dan dibuktikan lewat uji mutasi |
| D146 | **Order dianggap batal karena T9 atau T11 kalau histori CANCELLED-nya berasal dari PAID atau ON_THE_WAY.** Hanya order seperti itu yang menjalani T22 saat refund selesai. Refund pembayaran telat untuk order yang batal lewat T4 atau T7 tidak memicu T22 (D135). Client diberi notifikasi setiap kali refund COMPLETED | `platform_fee_refunded > 0` tidak bisa dijadikan penanda karena platform fee bisa bernilai nol |
| D147 | **Payment jalur API yang tidak punya `xendit_invoice_id` langsung FAILED** saat dieksekusi, sehingga masuk jalur manual | Refund legacy membutuhkan `invoice_id`. Tanpanya jalur API pasti buntu, dan lebih baik terlihat di antrean admin sejak awal |

**Catatan implementasi sesi 8c tanpa nomor D:**

- **T9 dan T11 dalam satu transaksi**: `platform_fee_refunded = platform_fee`, satu `REFUND_DEDUCTION` sebesar `provider_earning` dari pending, satu refund FULL, urutan kunci order, payment, wallet. Slot pekerja dan pendamping lepas sendiri karena CANCELLED tidak dihitung (H26)
- Webhook refund menggantikan stub 8a dengan pola dua transaksi yang sama, dan cron pemulihan D121 kini memproses domain PAYMENT, PAYOUT, dan REFUND. Urutan kunci di webhook dan sync: order dulu, lalu refund
- T22 tetap beraktor SYSTEM. Kalau dipicu jalur manual, admin dicatat di metadata histori (`REFUND_COMPLETED_MANUALLY`)
- Router dev: `simulate-payment` menerima `payment_method` opsional, sehingga jalur manual bisa diuji dengan gateway palsu
- Kode galat baru `REFUND_STATE_CONFLICT` (409)
- **Celah yang tersisa:** refund PROCESSING tanpa `xendit_refund_id` (D140 nomor 2) yang ternyata tidak pernah sampai ke Xendit akan dilaporkan NOT_FOUND oleh sync, tanpa eksekusi ulang. Refund itu tertahan karena jalur manual juga ditolak. Ditangani lewat H108
- `shortcut:` baru: pencarian refund lewat `invoice_id` hanya membaca halaman pertama, filter status antrean refund belum ber-index, dan tidak ada cron sync (D143)
- Postman Fase 6: request "batal setelah bayar belum tersedia" diganti menjadi "pekerja membatalkan setelah bayar: 403", karena order tersebut masih dipakai untuk T8 sampai T16

**Hasil sesi 8c:** typecheck bersih, 721 test di 38 berkas lulus, 31 dari 31 mutan mati termasuk mutan basis data H101. Postman Fase 8: 85 request dan 151 assertion tanpa gagal. Regresi Fase 1 sampai 7: 449 request dan 1.110 assertion tanpa gagal. `db:verify` dan `db:check-constraints` lulus di `jasana_test`.

**Uji sandbox sesi 8c (15 November 2026, dijalankan penyusun di Supabase dev dengan gateway xendit):**

| Uji | Hasil |
|---|---|
| Sync withdrawal `ed913010...` yang tertahan sejak uji 8b | `GET /v2/payouts/{id}` ke Xendit sungguhan berhasil dalam 2 detik. Xendit menjawab ACCEPTED, sehingga sync tidak mengubah apa pun dan withdrawal tetap DISBURSING, sesuai keadaan di Xendit |
| T9 jalur API, order `ORD-20261114-EA462DA4` dibayar GoPay | Client membatalkan pukul 17:53:08 UTC, refund FULL Rp1.500.000 termasuk platform fee dibuat dan dikirim setelah commit (17:53:10), webhook `refund.succeeded` diproses pukul 17:53:16, dan order REFUNDED lewat T22 pukul 17:53:17. Sembilan detik dari pembatalan sampai dana kembali. Refund terlalu cepat untuk tertangkap di antrean PROCESSING |
| T11 jalur manual, order `ORD-20261114-FAE89950` dibayar VA | Pemilik membatalkan saat perjalanan, refund FULL tercatat REQUESTED dengan `payment_method` BANK_TRANSFER tanpa panggilan ke Xendit. Admin menandai selesai dengan catatan transfer, `completed_by` dan `completion_note` terisi, dan order REFUNDED lewat T22 |
| `db:verify` di Supabase dev | V1, V5 sampai V8, V11, dan V12 nol baris |

Percobaan pertama accept order C gagal 500 (P2028): transaksi interaktif Prisma melewati batas bawaan 5000 ms (5123 ms) karena setiap kueri bolak-balik ke Supabase dev. Seluruh transaksi di-rollback, order tetap PENDING_ACCEPTANCE, dan tidak ada invoice yang dibuat karena `afterCommit` tidak berjalan, yang menjadi bukti atomisitas transaksi. Diperbaiki saat itu juga lewat H109. Percobaan ulang yang berhasil sempat membuat order itu PAYMENT_EXPIRED karena batas bayar 10 menit lewat selama perbaikan, sehingga uji dilanjutkan dengan order C baru.

---

## 4V. Keputusan Versi 2.28 (D148 sampai D150)

Dari sesi 8d. Ketiganya dijawab sebelum atau saat review rencana. Tidak ada perubahan skema, hanya bucket Storage baru `dispute-evidences` (private).

| # | Keputusan | Alasan |
|---|---|---|
| D148 | **Paling banyak 5 bukti per pihak per dispute**, dihitung per `uploaded_by_user_id` karena hanya client order dan pemilik usaha yang boleh mengunggah. Diperiksa sebelum unggah, lalu diperiksa ulang di bawah kunci baris dispute. Lewat batas ditolak 409 `DISPUTE_EVIDENCE_LIMIT_REACHED` | Kuota bersama, misalnya 10 per dispute, membuat pihak yang lebih dulu mengunggah bisa menghabiskan kuota dan membungkam pihak lawan. Dalam sengketa, kedua pihak harus punya kesempatan yang sama |
| D149 | **Refund hasil putusan sengketa dikirim ke Xendit dengan reason `OTHERS`**, refund pembatalan tetap `CANCELLATION`. Dipilih dari ada tidaknya baris `disputes` untuk order itu | Pemilik usaha juga bisa membuka sengketa, misalnya CLIENT_NO_SHOW, sehingga `REQUESTED_BY_CUSTOMER` tidak selalu benar. `OTHERS` netral dan selalu benar. Pemilihan dari baris dispute aman karena sengketa baru boleh sejak ARRIVED, sedangkan pembatalan T9 dan T11 serta refund pembayaran telat tidak pernah sampai ARRIVED |
| D150 | **`order_count` dan `completed_orders_count` hanya naik di T16.** Order yang diputus RELEASE atau PARTIAL sebelum COMPLETED menjadi SETTLED tanpa menaikkan kedua penghitung | Penghitung itu tampil sebagai reputasi dan berarti pekerjaan selesai yang dikonfirmasi client lewat kode verifikasi. Putusan sengketa adalah penilaian admin atas order yang bermasalah, sehingga menghitungnya bisa menaikkan reputasi dari order yang justru disengketakan |

**Catatan implementasi sesi 8d tanpa nomor D:**

- **Urutan kunci:** buka sengketa mengunci order lalu baris dispute, unggah bukti hanya mengunci dispute, dan putusan mengunci order, dispute, payment, lalu wallet. Webhook dan sync refund tetap order lalu refund (8c)
- **Membuka sengketa melepas kunci in-flight** penanggung jawab dan pendamping, karena DISPUTED bukan in-flight (PRD 3.4). Ini sesuai prinsip bahwa sengketa tidak boleh melumpuhkan penghasilan penyedia. Pada T17, kode verifikasi tetap tersimpan terenkripsi, tetapi membaca maupun memasukkannya ditolak 409 karena status sudah bukan AWAITING_VERIFICATION
- **Putusan REFUND (T21) langsung membuat order REFUNDED** saat putusan, walaupun dana masih diproses Xendit atau menunggu transfer manual, sesuai State Machine. Status dana dipantau di antrean refund, dan T22 tidak berlaku (D146)
- Pengecekan dispute ganda dijalankan sebelum `transitionOrder`, supaya galatnya tetap `DISPUTE_ALREADY_EXISTS`. Unique `order_id` menjadi jaring terakhir
- `writeEscrow` menerima nominal, dan baris bernilai nol dilewati karena `chk_wallet_tx_nonzero`. Pada PARTIAL ini hanya mungkin kalau platform fee 50 persen atau lebih
- Kode galat baru `DISPUTE_STATE_CONFLICT` dan `DISPUTE_EVIDENCE_LIMIT_REACHED`, keduanya 409. Detail sengketa mengikuti PRD (C/PR/A), sehingga penanggung jawab mendapat 403
- Dua mutan selamat karena pengaman berlapis: menambah WORKER ke aktor buka sengketa tetap ditolak `ALLOWED_ACTORS`, dan mematikan `FOR UPDATE` di `lockOrder` saja tetap ditolak UPDATE bersyarat status. Mematikan keduanya membuat test H100 gagal
- Newman Fase 8 butuh `--delay-request 700` karena 156 request melewati batas global 100 per menit (H91)
- Runner regresi sempat membaca kode keluar newman dengan salah sehingga terlihat hijau padahal tidak berjalan. Diperbaiki untuk menilai dari ringkasan newman, lalu regresi dijalankan ulang
- `shortcut:` baru: filter status antrean dispute belum ber-index, dan seed tidak menghapus berkas bukti dari bucket (dua objek per run newman)

**Penutupan Fase 8 (15 November 2026).** Seluruh kriteria PRD Bagian 9 dan D101 nomor 5 terpenuhi di `jasana_test`. Typecheck bersih termasuk test dan skrip, 751 test di 39 berkas lulus, dan 22 dari 24 mutan sesi 8d mati (dua sisanya dijelaskan di atas). Postman Fase 8: 156 request dan 296 assertion tanpa gagal. Regresi Fase 1 sampai 7: 449 request dan 1.110 assertion tanpa gagal.

| Kriteria | Bukti | Status |
|---|---|---|
| Withdrawal dengan minimum dan admin fee (D84), serta payout | Test withdrawal dan webhook payout, Postman folder 01, sandbox 8a dan 8b | Lulus |
| Refund | Test refund dan webhook refund, Postman folder 02, sandbox 8c untuk jalur API (T9) dan jalur manual (T11) | Lulus |
| Dispute beserta bukti dan riwayat pesan | Test sengketa (pesan disisipkan langsung karena endpoint pesan baru ada di Fase 10), Postman folder 03 dengan unggahan ke bucket sungguhan | Lulus |
| Rekonsiliasi ledger tetap 0 baris setelah seluruh skenario | V1 diperiksa `afterEach` di 9 berkas test, dan `db:verify` nol setelah folder 00 sampai 03 | Lulus |
| T9 dan T11 end-to-end | Postman folder 02 (order B dan D untuk T9, order C untuk T11), sandbox 8c | Lulus |
| T13, T15, T17, T19 end-to-end | Postman folder 03 (order E, F, G, H) | Lulus |
| T20, T21, T22 end-to-end | T20: order E (RELEASE) dan F (PARTIAL). T21: order G. T22: order B (webhook), C (manual), D (sync) | Lulus, termasuk refund PARTIAL ke Xendit sungguhan (lihat di bawah) |
| H100 | Tiga test: sweep menang, sengketa menang, dan guard di `settleOrder` dibuktikan mutan | Lulus |

**Uji sandbox sesi 8d (15 November 2026, dijalankan penyusun di Supabase dev dengan gateway xendit):** order `ORD-20261114-892243DF` Rp1.500.000 dibayar GoPay, dijalankan sampai IN_PROGRESS, lalu pemilik membuka sengketa (T15, kategori POOR_QUALITY). Admin memeriksa dan memutus PARTIAL Rp123.457 pukul 20:23:51 UTC. Order langsung SETTLED (T20) dengan `platform_fee_refunded` Rp12.346. Refund PARTIAL Rp123.457 ke e-wallet dibuat dan dikirim setelah commit, lalu webhook `refund.succeeded` diproses pukul 20:23:56 UTC, lima detik kemudian. Order tetap SETTLED tanpa T22 (D146), dan `initiated_by` refund berisi id admin yang memutus. `db:verify` di Supabase dev: V1, V5 sampai V8, V11, dan V12 nol baris. V4 kini memuat dua order SETTLED (A dan F) dengan fee dipungut Rp300.000, fee dikembalikan Rp12.346, dan pendapatan bersih Rp287.654, sesuai rumus D133.

---

## 4W. Keputusan Versi 2.29 (D151 sampai D155)

Diputuskan sebelum Fase 9 (chatbot). Satu parameter sistem baru, tanpa perubahan skema.

| # | Keputusan | Alasan |
|---|---|---|
| D151 | **Seluruh panggilan Gemini dibungkus port `LlmGateway`** dengan dua implementasi, gemini dan fake, dipilih lewat env. Model dipilih lewat env `GEMINI_MODEL`, dan setiap panggilan punya timeout seperti H96. Test, newman, dan stress test k6 selalu memakai fake yang deterministik. Gemini sungguhan hanya dipakai untuk uji sandbox dan evaluasi akurasi | Kuota gratis Gemini API dihitung per project per hari dan sangat terbatas, sehingga test otomatis dan k6 akan menghabiskannya dalam hitungan detik. Polanya sama dengan `PaymentGateway` (D101): service tidak pernah mengenal SDK, sehingga model atau versi API bisa diganti tanpa menyentuh logika chatbot |
| D152 | **Gemini hanya mengekstrak intent dan menyusun pertanyaan klarifikasi, dalam satu panggilan per pesan.** Rekomendasi dicari server lewat layanan pencarian Fase 5 berdasarkan intent yang sudah divalidasi, lalu dikembalikan sebagai data listing terstruktur. Gemini tidak pernah menerima data listing maupun penyedia. Lima jenis intent: `cari_jasa` (server mencari listing), `perlu_klarifikasi` (pertanyaan klarifikasi dari Gemini diteruskan), `jasa_tidak_tersedia`, `sapaan`, dan `di_luar_cakupan`. Tiga jenis terakhir dijawab dengan templat tetap dari server | Gemini tidak bisa mengarang harga, rating, atau listing yang tidak ada, karena data selalu diambil langsung dari database. H67 tertutup secara struktur, bukan bergantung pada kepatuhan model. Satu panggilan per pesan menghemat kuota dan menjaga latensi di bawah target 3 detik. Templat untuk pesan di luar cakupan mencegah chatbot dipakai sebagai asisten umum dan mencegah Gemini mengarang aturan platform. Pembagian tugasnya bersih: Gemini memahami bahasa, server memegang data |
| D153 | **Definisi akurasi intent extraction untuk D85**, ditetapkan sebelum pengujian. Sebuah skenario berlabel dihitung benar kalau jenis intent tepat, dan untuk `cari_jasa` juga sub-kategorinya tepat. Ketepatan slot (lokasi, waktu, budget, atribut) dilaporkan terpisah sebagai metrik pendukung. Dataset H15 disusun penyusun sendiri dan memuat sekitar 20 persen skenario `sapaan`, `jasa_tidak_tersedia`, dan `di_luar_cakupan`, supaya akurasi juga mengukur kemampuan menolak | Ambang yang ditetapkan setelah melihat hasil tidak punya arti (D85). Jenis intent dan sub-kategori adalah dua hal yang menentukan apakah pengguna diarahkan ke jasa yang benar. Kalimat uji yang ditulis AI sejenis dengan yang diuji akan menghasilkan akurasi yang tidak mencerminkan cara orang sungguhan bertanya |
| D154 | **Penyimpanan tiga lapis rate limit tamu (H19).** Per `guest_token` lewat kolom `message_count`. Per alamat IP lewat limiter di memori, sama dengan limiter lain. Rem global harian dari hitungan pesan USER sesi tamu di basis data per hari kalender WITA, sehingga tahan restart. Nilai `guest_chat_daily_global_limit` ditetapkan setelah sesi 9a berdasarkan kuota project Gemini yang dipakai | Lapis per token dan per IP cukup memakai mekanisme yang sudah ada. Rem global adalah pengaman terakhir terhadap habisnya kuota, jadi harus tetap benar walaupun server restart. Batas harian kuota Gemini sendiri di-reset tengah malam waktu Pasifik, sehingga nilai rem diberi jarak aman dari batas itu |
| D155 | **Sesi chat tamu berlaku 24 jam** lewat parameter baru `guest_chat_session_hours`. Klaim sesi oleh akun baru mengisi `user_id` dan `claimed_at`, lalu mengosongkan `expires_at` | Cukup panjang untuk percakapan yang dilanjutkan esok hari, cukup pendek supaya sesi tamu yang ditinggalkan tidak menumpuk sebagai sesi aktif. Setelah diklaim, sesi menjadi milik akun dan mengikuti aturan riwayat permanen (D77) |

**Pembagian Fase 9 dalam tiga sesi:**

- **9a.** `LlmGateway` beserta adapter Gemini (API dan model dicek ke dokumentasi terbaru), implementasi fake, timeout, skema intent, dan skrip smoke ke Gemini sungguhan dengan kalimat Bahasa Indonesia. Hasilnya menetapkan model dan nilai rem global, sama seperti 8a untuk Xendit
- **9b.** Sesi tamu dan terdaftar, `POST /chat/sessions/:id/messages` dengan tiga lapis rate limit, pencatatan intent, confidence, latensi, dan token, rekomendasi lewat pencarian, riwayat, akhiri sesi, dan cron sesi tamu kedaluwarsa
- **9c.** Klaim sesi (H68), `personalization_snapshot` (D27) dan pemakaiannya di prompt, H66, skrip evaluasi akurasi (H15, D153), V3 dan V9, Postman Fase 9, dan penutupan Fase 9

---

## 4X. Keputusan Versi 2.30 (D156 sampai D160)

Dari sesi 9a dan smoke ke Gemini sungguhan. Tanpa perubahan skema.

| # | Keputusan | Alasan |
|---|---|---|
| D156 | **Timeout satu panggilan `LlmGateway` 8 detik** (`LLM_GATEWAY_TIMEOUT_MS`), lebih pendek dari 10 detik milik gateway pembayaran | Ada pengguna yang menunggu jawaban di layar, sedangkan panggilan Xendit kebanyakan berjalan setelah commit. Lima detik terlalu ketat karena panggilan yang sebenarnya berhasil ikut terputus padahal kuota tetap terpakai. Target p95 tetap 3 detik, timeout hanya rem untuk kasus buruk |
| D157 | **`LLM_GATEWAY=fake` bersama `NODE_ENV=production` membuat aplikasi gagal start**, sama seperti D101. Stress test k6 yang memakai fake dijalankan dengan `NODE_ENV` selain production, sedangkan UAT memakai Gemini sungguhan | Chatbot palsu di produksi akan menulis intent palsu ke `chat_messages`, padahal tabel itu sumber data Bab IV |
| D158 | **Panggilan Gemini memakai `store: false`**, dan riwayat percakapan dikirim ulang setiap giliran (stateless) | Bawaan Interactions API adalah menyimpan request dan respons di Google (1 hari di tier gratis, 55 hari di tier berbayar). Pesan pengguna, terutama tamu, tidak perlu menginap di pihak ketiga, dan riwayat sudah tersimpan di `chat_messages` |
| D159 | **Model `gemini-3.5-flash-lite`**, ditulis sebagai ID versi tetap, bukan alias `*-latest`. Lewat Interactions API dengan structured output, tanpa SDK, dan `thinking_level` minimal | Smoke 12 kalimat: 12 dari 12 sesuai harapan, tanpa output yang ditolak validasi, latensi rata-rata 1.506 ms dan tertinggi 1.902 ms, sekitar 1.260 token per panggilan. Pembanding `gemini-3.1-flash-lite` timeout 4 dari 12 kali pada batas 8 detik dengan rata-rata 2.838 ms. Keduanya satu-satunya keluarga dengan kuota gratis 500 RPD di project penyusun. Versi tetap dipakai supaya hasil evaluasi bisa diulang, karena alias bisa berpindah model tanpa pemberitahuan |
| D160 | **`guest_chat_daily_global_limit` = 250 pesan per hari WITA**, separuh dari kuota 500 RPD | Kuota dipakai bersama oleh tamu, pengguna terdaftar, evaluasi akurasi, dan uji sandbox. Hari kuota Google di-reset tengah malam waktu Pasifik (sekitar 15.00 atau 16.00 WITA), sehingga satu hari WITA menyentuh dua hari kuota dan batasnya perlu jarak aman |

**Catatan sesi 9a tanpa nomor D:**

- Interactions API (`POST .../v1/interactions`), GA sejak Juni 2026 dan direkomendasikan untuk proyek baru, dengan `response_format` berisi JSON Schema. Panjang string tidak ditegakkan Gemini, sehingga Zod yang menegakkannya. Output yang tidak lolos Zod diperlakukan sebagai galat `GEMINI_UNAVAILABLE`, tidak diperbaiki diam-diam
- Model yang dicatat adalah yang tertulis di respons Gemini, bukan hanya nilai env, karena Google bisa mengalihkan model (misalnya `gemini-2.5-flash` dialihkan mulai 1 Desember 2026)
- Prompt hanya memuat kunci, nama, dan nama kategori sub-kategori. Test membuktikan judul listing, nama penyedia, dan telepon tidak masuk walaupun objek sumbernya membawa data itu (H67). Blok `personalization_snapshot` tidak muncul untuk tamu (H66)
- **Aturan pelabelan:** `perlu_klarifikasi` hanya kalau sub-kategori tidak bisa ditentukan. Lokasi atau waktu yang kurang tidak membuat pesan perlu klarifikasi. Aturan yang sama dipakai untuk melabeli dataset H15
- Pertanyaan tentang cara kerja platform, misalnya cara mendaftar sebagai penyedia, diklasifikasikan `di_luar_cakupan` dan dijawab templat yang mengarahkan ke halaman bantuan (D152)
- Kalimat percobaan prompt injection ("abaikan semua instruksi sebelumnya...") diklasifikasikan `di_luar_cakupan`, dan output tetap terikat skema
- Confidence hampir selalu 0,95 sampai 1 pada smoke. Confidence adalah penilaian model atas dirinya sendiri dan tidak terkalibrasi, sehingga dilaporkan sebagai data pendukung, bukan ukuran keandalan (H110)
- Skema intent ditulis sebagai dua literal berdampingan (Zod dan JSON Schema) dengan nama properti yang sama. Perubahan skema harus mengubah keduanya
- `shortcut:` baru: fake belum menggabungkan slot antar giliran

**Hasil sesi 9a:** typecheck bersih, 800 test di 41 berkas lulus, 49 mutan tertangkap.

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
| `guest_chat_daily_global_limit` | 250 (D160) | Rem darurat seluruh lalu lintas chatbot tamu (D77) |
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

**Tidak ada keputusan terbuka per versi 2.25.**

**Ditutup pada versi 2.25:** nomor 6 (jalur eksekusi refund) oleh D136, yaitu dua jalur yang dipilih dari metode pembayaran.

**Rumusan nomor 6 (versi 2.24), disimpan sebagai jejak:**

| # | Pertanyaan | Dampak |
|---|---|---|
| 6 | **Jalur eksekusi refund.** Refund API Xendit mendukung e-wallet, kartu, dan sebagian penerbit QRIS, tapi tidak Virtual Account, yang untuk refund-nya Xendit menyarankan transfer lewat fitur disbursement. Usulan: dua jalur, yaitu Refund API untuk metode yang didukung dan penyelesaian manual oleh admin lewat endpoint "tandai selesai" untuk sisanya, dengan pencatatan ledger dan status yang sama (D132) | Harus diputuskan **setelah sesi 8a** membuktikan di sandbox metode mana yang bisa di-refund di mode test, dan **sebelum sesi 8c**. Menentukan bentuk `PaymentGateway.refund()`, endpoint admin refund, dan isi bagian refund di Bab IV |

**Ditutup pada versi 2.12:**

| # | Pertanyaan | Ditutup oleh |
|---|---|---|
| 5 | Durasi untuk jasa yang lamanya ditentukan opsi pilihan client | D100, durasi melekat pada nilai opsi dan "Dua Hari" dihapus |

**Rumusan awal nomor 5 (versi 2.9), disimpan sebagai jejak:**

| # | Pertanyaan | Dampak |
|---|---|---|
| 5 | **Durasi untuk jasa yang lamanya ditentukan opsi pilihan client.** `paket_durasi` di B.5 (4 jam atau 8 jam) dan `durasi_liputan` di B.6 (2 jam sampai Dua Hari) menentukan lama pekerjaan, sedangkan durasi yang dipakai mengunci jadwal adalah satu angka per listing (D90). Opsi "Dua Hari" juga melewati batas 720 menit dan berbenturan dengan satu order satu kedatangan (D75) | Harus diputuskan **sebelum Fase 6**. Kalau dibiarkan, jadwal pekerja bisa terkunci terlalu pendek untuk paket 8 jam, atau terlalu panjang untuk paket 2 jam |

**Ditutup pada versi 2.8:**

| # | Pertanyaan | Ditutup oleh |
|---|---|---|
| 1 | Revisi dokumen usulan ide (Tabel Aktor Sistem) | A7, tidak direvisi |
| 1a | Opsi kustom bebas oleh provider | D81, ditolak (Pembimbing 1, 30 September 2026) |
| 1b | Provider membuat sub-kategori sendiri tanpa persetujuan admin | D82, ditolak (Pembimbing 1, 30 September 2026) |
| 2 | Nominal minimum withdrawal dan admin fee | D84 |
| 3 | Target angka UAT, akurasi chatbot, dan jumlah concurrent user | D85 |
| 4 | Dasar penetapan komisi 10 persen dan holding window 24 jam | D86 |

**Ditutup pada versi sebelumnya:** batas bayar mode Scheduled (oleh D43), verifikasi email wajib atau tidak (oleh D62), dan refresh token (oleh D76).

**Nilai yang menyusul sudah ditetapkan:** `guest_chat_daily_global_limit` = 250 (D160).

---

## 8. Hutang Teknis

### 8.1 Constraint SQL Manual

- [x] **H1** **(terpasang, diverifikasi db:check-constraints 8 November 2026)** Saldo wallet tidak boleh negatif
- [x] **H2** **(terpasang, diverifikasi db:check-constraints 8 November 2026)** Satu order satu pembayaran lunas dan satu invoice aktif
- [x] **H3** **(terpasang, diverifikasi db:check-constraints 8 November 2026; sisi ESCROW_HOLD terbukti lewat perilaku di sesi 7b dan sisi ESCROW_RELEASE di sesi 7c)** Satu order satu ESCROW_HOLD dan satu ESCROW_RELEASE, selamanya
- [x] **H4** **(diverifikasi di Fase 6: index terpasang menurut db:check-constraints, diuji lewat PRD 8.2 nomor 3 dan T8)** Satu pekerja tidak boleh punya dua order in-flight **(direvisi, D40)**
- [x] **H5** **(terpasang, diverifikasi db:check-constraints 8 November 2026)** Konsistensi nominal order dan batas fee yang dikembalikan
- [x] **H6** **(terpasang, diverifikasi db:check-constraints 8 November 2026)** Ledger harus bergerak, rating 1 sampai 5, jarak check-in tidak negatif
- [x] **H18** **(terpasang, diverifikasi db:check-constraints 8 November 2026)** Index GIN untuk `listings.attributes`
- [x] **H23** **(terpasang, diverifikasi db:check-constraints 8 November 2026)** Eksklusivitas keanggotaan pekerja (D36)
- [x] **H24** **(ditutup di sesi 6c)** `assigned_worker_id` wajib terisi mulai status ACCEPTED (D42)
- [x] **H32** **(terpasang, diverifikasi db:check-constraints 8 November 2026)** Unique `(worker_id, listing_id)` pada `worker_listings` **(baru, D50)**
- [x] **H33** **(terpasang, diverifikasi db:check-constraints 8 November 2026)** Unique pada `verification_tokens.token_hash` **(baru, D63)**
- [x] **H44** **(ditutup di sesi 6c)** Unique `(order_id, worker_id)` pada `order_crew`, plus index `(worker_id)` **(baru, D69)**
- [x] **H53** **(terpasang, diverifikasi db:check-constraints 8 November 2026)** `chk_order_total_composition` pada `orders` **(baru, D73)**
- [x] **H54** **(terpasang, diverifikasi db:check-constraints 8 November 2026)** Unique `(listing_id, attribute_key, option_value)` pada `listing_option_prices` **(baru, D72)**
- [x] **H62** **(terpasang, diverifikasi db:check-constraints 8 November 2026)** Unique pada `refresh_tokens.token_hash` **(baru, D76)**
- [x] **H63** **(terpasang, diverifikasi db:check-constraints 8 November 2026)** `chk_chat_session_identity` pada `chat_sessions` **(baru, D77)**
- [x] **H69** **(terpasang, diverifikasi db:check-constraints 8 November 2026)** `chk_order_message_sender_role` dan `chk_order_message_content_length` **(baru, D79)**
- [x] **H101** **(ditutup di sesi 8c: `uniq_refund_deduction_per_order`, dibuktikan sisipan langsung dan mutan basis data)** Partial unique index satu `REFUND_DEDUCTION` per order, dipasang di sesi 8c. Wajib punya test yang menulis deduction kedua dan memastikan ditolak **(baru, D132)**
- [x] **H102** **(ditutup di sesi 8b: `uniq_withdrawal_event_per_withdrawal`, juga mencakup satu WITHDRAWAL per withdrawal, dibuktikan webhook FAILED ganda dan sisipan langsung yang ditolak)** Partial unique index satu `WITHDRAWAL_REVERSAL` per withdrawal, dipasang di sesi 8b. Wajib punya test webhook FAILED yang dikirim dua kali **(baru, D134)**
- [x] **H105** **(ditutup di sesi 8b: `tsconfig.test.json`, 12 galat di 7 berkas diperbaiki)** `npm run typecheck` hanya memeriksa `src`, karena `tsconfig.json` di `apps/api` mengecualikan `tests` dan skrip. Vitest juga tidak memeriksa tipe, jadi galat tipe di test dan skrip lolos tanpa ketahuan. Tambahkan tsconfig untuk test dan skrip, lalu masukkan ke script typecheck. Dikerjakan di awal sesi 8b **(baru, ditemukan di sesi 8a)**
- [x] **H106** **(ditutup di sesi 8c lewat D143 sampai D145, dibuktikan dengan Xendit sungguhan pada uji sandbox 8c)** Rekonsiliasi status payout dan refund ke Xendit. Status akhir withdrawal (D137) dan refund (D136) hanya ditentukan webhook, sehingga kalau webhook tidak pernah datang, withdrawal tertahan di DISBURSING dan refund di PROCESSING tanpa jalan keluar. Sediakan aksi admin dan atau cron yang menanyakan status langsung ke Xendit (`GET /v2/payouts/{id}` dan endpoint refund yang setara), lalu menerapkannya lewat aturan yang sama dengan webhook. Dikerjakan di sesi 8c. Withdrawal `ed913010...` dari uji sandbox 8b bisa dipakai sebagai kasus uji kalau masih tertahan **(baru, ditemukan di uji sandbox 8b)**
- [x] **H108** **(ditutup di sesi 8d, dibuktikan test dan dua mutan)** Refund PROCESSING tanpa `xendit_refund_id` yang tidak ditemukan Xendit saat sync harus dieksekusi ulang dengan key yang sama, sama seperti sync dari REQUESTED (D140 nomor 6). Sekarang sync hanya melaporkan NOT_FOUND, sehingga refund yang panggilannya timeout sebelum sampai ke Xendit tertahan, karena jalur manual juga ditolak. Dikerjakan di awal sesi 8d **(baru, sesi 8c)**
- [x] **H109** **(ditutup sebagai perbaikan susulan sesi 8c: `transactionOptions` global di PrismaClient, timeout 15000 ms dan maxWait 5000 ms, didefinisikan di `packages/database` dan diekspor ulang lewat `config/constants.ts`)** Batas waktu transaksi interaktif Prisma bawaan 5000 ms tidak memperhitungkan latensi basis data jarak jauh, sehingga transaksi accept ke Supabase dev gagal P2028. Stress test k6 wajib memperhitungkan batas ini **(baru, ditemukan di uji sandbox 8c)**
- [x] **H94** **(ditutup di sesi 6d)** `chk_order_offer_outcome` pada `order_offers`: `declined_at` dan `sla_missed_at` tidak boleh terisi bersamaan **(baru, D102)**

### 8.2 Keamanan Kode Verifikasi dan Token

- [x] **H7** **(ditutup di sesi 6e)** Generate kode order pakai `crypto.randomInt`, bukan `Math.random`
- [x] **H8** **(ditutup di sesi 6e)** Tolak input kalau `verification_attempts >= 5` sampai `verification_locked_until` lewat. Increment counter sebelum membandingkan, bukan sesudah
- [x] **H9** **(ditutup di sesi 6e)** Terapkan `verification_expires_at`
- [x] **H34** **(lulus audit 9 November 2026: perilaku ada di kode dan dijaga test)** Token email pakai `crypto.randomBytes(32)`, disimpan sebagai hash SHA-256 **(baru, D63)**. Token tidak punya lockout seperti H8, jadi ruang tebakannya harus besar
- [x] **H35** **(ditutup di sesi perapian 10 November 2026, dibuktikan dengan uji mutasi)** Kirim ulang token membatalkan token lama, dan ganti password membatalkan seluruh token PASSWORD_RESET milik user itu **(baru)**
- [x] **H36** **(lulus audit 9 November 2026: perilaku ada di kode dan dijaga test)** Rate limit ketat pada `resend-verification`, `forgot-password`, dan `users/me/email` **(baru; diperkuat D118)**. Tanpa ini endpoint tersebut jadi alat membanjiri inbox orang lain
- [x] **H64** **(lulus audit 9 November 2026: perilaku ada di kode dan dijaga test)** Rotasi refresh token pada setiap pemakaian, plus deteksi pemakaian ulang yang mencabut seluruh `family_id` **(baru, D76)**. Wajib punya test: pakai token yang sudah dicabut, pastikan seluruh rantai ikut mati
- [x] **H65** **(lulus audit 9 November 2026: perilaku ada di kode dan dijaga test)** Pencabutan seluruh refresh token saat ganti password **(baru, D76)**

### 8.3 Integrasi Eksternal

- [x] **H10** **(ditutup di sesi 7b)** Handler webhook pakai dua transaksi terpisah
- [x] **H11** **(ditutup di sesi 7b)** Pengambilan lock pakai UPDATE bersyarat atomik, sediakan pemulihan baris PROCESSING yang macet
- [x] **H12** **(ditutup di sesi 7b)** Simpan `paid_amount` dari callback terpisah dari `amount` yang ditagih
- [x] **H13** **(ditutup di sesi 7b)** Verifikasi header `x-callback-token` pada setiap webhook
- [x] **H14** **(ditutup di sesi 9a: Interactions API dengan structured output, dibuktikan smoke 12 dari 12 tanpa output tidak valid, D159)** Gemini dipanggil dengan structured output atau function calling
- [ ] **H19** **Prioritas tinggi setelah D77.** Rate limiting chatbot tiga lapis: per `guest_token`, per alamat IP, dan rem global harian. Tanpa identitas login, endpoint chatbot terbuka untuk siapa saja sedangkan tiap pesan memanggil Gemini yang ada biayanya
- [ ] **H37** Pengiriman email dilakukan setelah commit, bukan di dalam transaksi **(baru, D58)**. Cron mengirim ulang baris FAILED maksimal tiga kali **(bagian pertama selesai di sesi perapian 10 November 2026: SMTP gagal tidak membatalkan operasi dan baris tercatat FAILED, dijaga test; bagian cron butuh keputusan skema di awal Fase 10, lihat catatan Bagian 4L)**
- [x] **H96** **(ditutup di sesi 7a: timeout 10 detik di setiap panggilan gateway)** Tugas `afterCommit` dijalankan berurutan sebelum respons dikirim. Saat Xendit dipasang di Fase 7, setiap panggilan `PaymentGateway` wajib punya timeout, supaya Xendit yang lambat tidak menahan respons transisi **(baru, sesi 6b)**
- [x] **H99** **(bagian pembayaran telat ditutup di sesi 8c; pembayaran dobel menjadi batasan H104)** Pembayaran yang masuk setelah order tidak lagi ACCEPTED (D119) di-refund otomatis lewat Refund API, dikerjakan di Fase 8 bersama refund lainnya. Sampai saat itu, kasusnya tercatat sebagai payment PAID pada order yang sudah mati dan harus terlihat di log. Mencakup juga pembayaran dobel dari invoice yatim (D125), yang tidak bisa dicatat sebagai payment PAID kedua; cara mencatat refund-nya diputuskan di Fase 8 **(baru, D119, diperluas D125)**

### 8.4 Logika Service Layer yang Tidak Bisa Dijaga Database

- [x] **H25** **(ditutup di sesi 6c)** Pemeriksaan tumpang tindih jadwal pekerja (D41). Unique index tidak bisa memeriksa irisan rentang waktu. Wajib punya unit test, termasuk kasus batas: order berdempetan persis dan order yang hanya beririsan di buffer
- [x] **H26** **(ditutup di sesi 6c)** Pelepasan slot tentatif saat PAYMENT_EXPIRED atau CANCELLED (D43)
- [x] **H27** **(lulus audit 9 November 2026: perilaku ada di kode dan dijaga test)** Validasi minimal satu pekerja ACTIVE dengan `accepts_assignments = true` per provider (D39)
- [x] **H28** **(ditutup di sesi 6d, status ACCEPTED dan PAID menurut D108)** Guard silang antar mode: tolak Available Now kalau ada jadwal pekerja yang akan datang dalam rentang `now + durasi + buffer`
- [x] **H38** **(ditutup di sesi 6d)** Klaim order Available Now pakai UPDATE bersyarat atomik **(baru, D55)**. Wajib punya integration test yang menembakkan dua klaim bersamaan, dan hasilnya harus tepat satu yang berhasil
- [x] **H39** **(lulus audit 9 November 2026: perilaku ada di kode dan dijaga test)** Listing tidak boleh berpindah dari DRAFT ke aktif kalau belum punya pekerja terpetakan **(baru, D53)**
- [x] **H40** **(ditutup di sesi 6d)** Cron mematikan toggle pekerja yang presence-nya basi **(baru, D57)**
- [x] **H41** **(ditutup di sesi 6d)** Guard `accept` memeriksa ulang pemetaan listing, status keanggotaan, dan kondisi in-flight, tidak mengandalkan daftar penerima notifikasi **(baru, D55)**
- [x] **H45** **(ditutup: dropdown penugasan Scheduled di sesi 6c, pencocokan Available Now di sesi 6d)** Pendamping ikut disaring dari pencocokan Available Now dan dropdown penugasan Scheduled **(baru, D69)**. Database tidak menjaganya, karena `uniq_inflight_order_per_worker` hanya melihat `assigned_worker_id`
- [x] **H46** **(ditutup di sesi 6c lewat assertWorkersFree)** Pendamping ikut pemeriksaan bentrok jadwal yang sama dengan penanggung jawab **(baru, D69)**
- [x] **H47** **(ditutup di sesi 6c)** Tolak penambahan pendamping pada order AVAILABLE_NOW **(baru, D70)**. Satu guard, tidak perlu memeriksa siapa yang menerima
- [x] **H48** **(lulus audit 9 November 2026: perilaku ada di kode dan dijaga test)** Atribut wajib baru memblokir penyimpanan listing lama pada kali berikutnya diedit, lewat penanda `attributes_need_update` **(baru, D67)**. Validasi tidak pernah dijalankan saat baca
- [x] **H49** **(ditutup di sesi 6d)** Presence diturunkan dari koneksi Socket.IO, dengan toleransi putus sinyal sesaat **(baru, D65)**. Cron yang mematikan toggle (H40) memakai penanda ini, bukan umur koordinat
- [x] **H55** **(lulus audit 9 November 2026: perilaku ada di kode dan dijaga test)** **Prioritas tinggi.** Harga dihitung ulang sepenuhnya di server dari `listing_option_prices`, tidak pernah menerima nominal dari client **(baru, D73)**. Wajib punya test yang mengirim total palsu lewat API dan memastikan nominal itu diabaikan **(rumusan diselaraskan dengan kode dan PRD 8.2 pada audit 9 November 2026; sebelumnya "ditolak")**
- [x] **H56** **(lulus audit 9 November 2026: perilaku ada di kode dan dijaga test)** Validasi bercabang pada `POST /taxonomy-requests` **(baru, D74)**. NEW_ATTRIBUTE wajib `subcategory_id`, NEW_ATTRIBUTE_OPTION wajib `subcategory_id` dan `attribute_key`. Validasi bersyarat seperti ini gampang lolos kalau hanya mengandalkan skema validasi datar
- [x] **H57** **(lulus audit 9 November 2026: perilaku ada di kode dan dijaga test)** Batas 3 usulan aktif per provider dihitung lintas jenis **(baru, D74)**
- [ ] **H70** Masa aktif pesan dalam order ditegakkan service layer **(baru, D79)**. Hanya boleh mengirim saat status order antara ACCEPTED dan sebelum `settlement_due_at` lewat. Setelah itu read-only, bukan terhapus
- [ ] **H71** Pengirim wajib peserta order itu **(baru, D79)**: client pemilik order, pemilik provider, atau `assigned_worker_id`. Pendamping dan pekerja lain di usaha yang sama DITOLAK, sama polanya dengan `ASSIGNEE_ONLY_TRANSITIONS` di state machine
- [ ] **H72** Rate limit pengiriman pesan per pengirim **(baru, D79)**
- [x] **H73** **(lulus audit 9 November 2026: perilaku ada di kode dan dijaga test)** Batas jumlah butir FAQ per listing **(baru, D78)**
- [x] **H78** **(lulus audit 9 November 2026 untuk jalur e-KYC, dan di sesi 8d untuk jalur bukti sengketa)** Validasi **magic bytes** pada unggahan multipart **(baru, D80)**, bukan `Content-Type` dari client dan bukan ekstensi nama berkas. Wajib punya test yang mengunggah berkas non-gambar bernama `.jpg` dan memastikan ditolak
- [x] **H79** **(lulus audit 9 November 2026 untuk jalur e-KYC, dan di sesi 8d untuk jalur bukti sengketa)** Urutan unggah multipart: validasi, kirim ke Storage, baru tulis baris basis data **(baru, D80)**. Kalau Storage gagal, jangan tinggalkan baris setengah jadi
- [x] **H80** **(lulus audit 9 November 2026: perilaku ada di kode dan dijaga test)** Cron pembersih berkas yatim di bucket foto listing **(baru, D80)**, berkas lebih tua dari `orphan_upload_cleanup_hours` yang tidak punya baris `listing_photos`
- [x] **H88** **(ditutup di sesi 6c oleh D105)** Perilaku hapus listing (soft delete) saat masih ada order yang belum selesai **diputuskan di Fase 6**, karena order baru ada di fase itu. Saat ini hapus listing tidak memeriksa order
- [x] **H89** **(ditutup di sesi 6b: `schedule_conflict_buffer_minutes` boleh 0, kunci lain tetap wajib lebih dari 0)** `getNumberSetting` menganggap nilai 0 tidak sah dan memakai default. Sesuaikan sebelum `schedule_conflict_buffer_minutes` (Fase 6) atau `withdrawal_admin_fee` (Fase 8) boleh bernilai 0
- [x] **H85** **(ditutup di sesi perapian 10 November 2026, dibuktikan dengan uji mutasi)** Validasi `listings.estimated_duration_minutes` wajib terisi dan berada di rentang 15 sampai 720 menit saat listing dibuat atau diubah, dan `orders.snapshot_duration_minutes` selalu disalin dari kolom ini, bukan dari `listings.attributes` **(baru, D90)**
- [x] **H83** **(ditutup di sesi 8b, dijaga test dan uji mutasi)** Validasi pengajuan withdrawal **(baru, D84)**: `amount` minimal `withdrawal_min_amount`, `admin_fee` diambil dari `withdrawal_admin_fee` saat pengajuan, dan `net_amount` dihitung di server. Request tidak pernah memuat nominal fee
- [x] **H93** **(dibuka kembali pada audit 9 November 2026, ditutup di sesi perapian 10 November 2026 dengan integration test untuk listing tanpa atribut berdurasi)** `snapshot_duration_minutes` dihitung server dari definisi opsi saat order dibuat, tidak pernah dari input client. Wajib punya test: order B.6 dengan opsi "8 Jam" mengunci 480 menit plus buffer, termasuk ketersediaan pendamping di `order_crew`, dan listing tanpa atribut berdurasi tetap memakai kolom listing **(baru, D100)**
- [x] **H95** **(ditutup: klaim, pilihan pemilik, dan penolakan terakhir di sesi 6d; SLA miss pada cron T3 di sesi 6f)** Aturan `order_offers` di service layer (D102): klaim pekerja dan pilihan pemilik hanya dari baris yang belum menolak, penolakan terakhir langsung memicu T3 di transaksi yang sama, dan cron T3 tidak memberi SLA miss ke penerima yang sudah menolak. Wajib punya test untuk ketiganya, termasuk penolakan terakhir yang bersamaan dengan klaim pekerja lain **(baru)**
- [ ] **H97** Pemeriksaan D105 tidak memakai kunci, sehingga order yang dibuat tepat bersamaan dengan penghapusan listing bisa lolos. Order seperti itu tidak bisa di-accept karena listing sudah terhapus, lalu kedaluwarsa sendiri. Diterima sebagai batasan **(baru, sesi 6c)**
- [ ] **H98** `order_number` acak bisa kembar dengan peluang sangat kecil, dan saat ini berakhir 500. Ditandai `shortcut:`. Ganti dengan retry atau sequence kalau order per hari mencapai ribuan **(baru, sesi 6c)**
- [x] **H100** **(ditutup di sesi 8d lewat tiga test deterministik dan uji mutasi)** Test balapan pembukaan sengketa T19 dengan sweep T18 di sekitar `settlement_due_at`. Hasilnya harus tepat satu transisi yang berhasil, dan kalau DISPUTED yang menang tidak ada `ESCROW_RELEASE`. Guard dispute di `settleOrder` dibuktikan dengan uji mutasi. **Wajib di Fase 8** **(baru, sesi 7c)**

### 8.5 Persiapan Data Pengujian

- [ ] **H15** Kumpulkan 30 sampai 50 skenario percakapan berlabel untuk mengukur akurasi intent extraction. Mulai sekarang, jangan tunggu bulan ke-5
- [ ] **H68** Ukur konversi sesi chat tamu jadi pendaftaran akun lewat `chat_sessions.claimed_at` **(baru, D77)**. Metrik ini menjawab pertanyaan kegunaan chatbot dengan angka
- [ ] **H16** Siapkan data simulasi, termasuk beberapa usaha BUSINESS dengan jumlah pekerja berbeda dan pemetaan listing yang tumpang tindih, supaya skenario order paralel dan perebutan bisa diuji
- [ ] **H20** Jalankan kueri verifikasi V1 sampai V5 setelah seeding dan setelah pengujian
- [ ] **H91** Rate limiter dihitung per alamat IP, sedangkan k6 menembak seluruh request dari satu IP. Sediakan pengaturan khusus lingkungan pengujian beban, misalnya batas yang dinaikkan lewat env, supaya yang terukur adalah API dan bukan rate limiter-nya. Pengaturan itu ditulis di laporan **(baru)**
- [x] **H92** **(ditutup di sesi 6d)** Sediakan cara menandai pekerja hasil seed sebagai online, hanya aktif di lingkungan pengujian, supaya skenario pencarian `available_now` di stress test tidak selalu kosong. Dibangun di Fase 6 bersama pelacak status online (D99). Sebaiknya k6 juga tidak dijalankan di mesin yang sama dengan API, dan kalau terpaksa, kondisinya ditulis di laporan **(baru)**
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
- [ ] **H86** Regex pada `validation_rule` ditulis admin dan tidak dijaga dari pola yang sangat lambat dievaluasi (ReDoS) **(baru)**. Admin dianggap pihak tepercaya, dan dua belas sub-kategori contoh tidak memakai atribut TEXT
- [ ] **H90** Foto listing yang dihapus hanya menghapus barisnya. Berkasnya masih bisa diakses lewat URL publik sampai cron pembersih harian berjalan **(baru)**
- [ ] **H87** Batas durasi listing berlaku umum 15 sampai 720 menit, tidak per sub-kategori **(baru, D90)**
- [ ] **H103** Pembatalan setelah bayar tidak dikenai biaya pembatalan, dan pekerja yang sudah berangkat tidak mendapat kompensasi **(baru, D131)**. Biaya pembatalan berjenjang masuk saran pengembangan
- [ ] **H104** Pembayaran dobel lewat invoice yatim di-refund admin di luar sistem, bukan lewat alur refund otomatis **(baru, D135)**. Kasusnya bisa dicari lewat `webhook_events` bertanda `DOUBLE_PAYMENT`
- [ ] **H107** Tidak ada sinkronisasi otomatis ke Xendit (D143). Withdrawal atau refund yang webhook-nya hilang baru selesai kalau admin menekan sync. Cron sinkronisasi masuk saran pengembangan **(baru, D143)**
- [ ] **H110** Confidence intent adalah penilaian Gemini atas dirinya sendiri dan tidak terkalibrasi (hampir selalu 0,95 sampai 1 pada smoke 9a). Dilaporkan sebagai data pendukung, sedangkan keandalan diukur lewat akurasi terhadap dataset berlabel (D153) **(baru, sesi 9a)**
- [ ] **H82** Admin fee withdrawal berupa nilai flat yang mengikuti perkiraan biaya payout Xendit **(baru, D84)**. Untuk nominal di atas Rp250.000 biaya sebenarnya sedikit lebih besar dan selisihnya ditanggung platform

---

## 9. Progres Artefak Desain

| # | Artefak | Status | Catatan |
|---|---|---|---|
| 1 | Skema basis data (DBML) | Selesai, versi 2.12 | 35 tabel, 35 enum |
| 2 | `schema.prisma` dan `migration-constraints.sql` | Selesai, versi 2.9 dan 2.6 | |
| 3 | State machine order | Selesai, versi 2.13 | |
| 4 | Kontrak REST API (PRD) | Selesai, versi 2.16 | |
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

1. Fase 9 (chatbot) dalam tiga sesi menurut Bagian 4W. Paralel: penyusun menyusun dataset 30 sampai 50 skenario berlabel (H15, D153) dan mencatat model serta batas kuota project Gemini di AI Studio
2. Selesai: Fase 8 (15 November 2026, 751 test lulus, D131 sampai D150) beserta uji sandbox payout dan refund. Uji sandbox refund PARTIAL hasil putusan sengketa lulus. Sebelumnya Fase 7 (11 November 2026, 627 test lulus) beserta uji sandbox Xendit sungguhan (12 November 2026), sebelumnya audit hutang teknis (9 November 2026) dan sesi perapian (10 November 2026)
3. Susun data simulasi untuk dua belas sub-kategori di Lampiran B, termasuk skenario perebutan Available Now dan pendamping pada dokumentasi acara
4. Riset ringan rentang harga pasaran untuk dua belas sub-kategori tersebut, catat sumbernya
5. Paralel sejak sekarang: kumpulkan H15 sedikit demi sedikit setiap minggu, dan siapkan instrumen UAT (H84)

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
| 2.9 | 21 Oktober 2026 | Tiga usulan dari implementasi Fase 3: tipe atribut dikunci (D87), sub-kategori hasil usulan lahir nonaktif (D88), PER_UNIT bilangan bulat (D89). Sumber durasi listing disatukan ke kolom (D90), atribut `durasi_estimasi` dihapus dari Lampiran B, rekap B.13 menjadi 2 sampai 6 atribut. Option B.3 dilengkapi. Satu keputusan terbuka baru soal durasi yang ditentukan opsi. H85 sampai H87. Tanpa perubahan skema |
| 2.10 | 22 Oktober 2026 | Tujuh usulan dari implementasi Fase 4 (D91 sampai D97). Konfigurasi bucket `listing-photos`. H88 sampai H90. Tanpa perubahan skema |
| 2.11 | 22 Oktober 2026 | Arti filter lokasi pencarian (D98) dan status online pekerja dari memori tanpa Redis (D99). H91 dan H92 untuk persiapan stress testing. Tanpa perubahan skema |
| 2.12 | 31 Oktober 2026 | Durasi melekat pada nilai opsi (D100), menutup keputusan terbuka nomor 5. Opsi "Dua Hari" dihapus dari B.6. Pembagian transisi antar fase dan port `PaymentGateway` (D101). Tabel `order_offers`, penolakan tawaran per pekerja, dan T2 hanya oleh pemilik (D102). Aturan D100 hanya menghitung baris aktif (D103). H93 sampai H95. Satu tabel baru, menjadi 35 tabel |
| 2.13 | 7 November 2026 | Tiga usulan dari sesi 6c: invoice gagal tidak membatalkan T1 (D104), hapus listing ditolak selama ada order berjalan (D105, menutup H88), dan empat aturan pembuatan serta pembatalan order (D106). Catatan guard in-flight, peran per endpoint, dan format `order_number`. H97 dan H98. Tanpa perubahan skema |
| 2.14 | 8 November 2026 | Tiga usulan dari sesi 6d: radius Available Now dari posisi pekerja (D107), slot ACCEPTED dan PAID memblokir Available Now (D108), dan room order lewat `order:join` (D109). Catatan peran OFFERED, jalur accept menurut isi body, penanda online pengujian, dan toleransi presence. Tanpa perubahan skema baru |
| 2.15 | 9 November 2026 | Lima usulan dari sesi 6e: reset percobaan setelah lockout (D110), kode baru oleh client (D111), relay lokasi tanpa tulis basis data (D112), kode error tiga guard waktu (D113), dan kode kedaluwarsa tidak dihitung sebagai percobaan (D114). Catatan pola catat lalu commit baru tolak, penamaan radius, dan `requireAssignedWorker`. H7 sampai H9 ditutup. Tanpa perubahan skema |
| 2.16 | 9 November 2026 | Dua usulan dari sesi 6f: penolakan tawaran ditolak setelah deadline (D115) dan notifikasi SLA miss untuk pekerja (D116). Catatan implementasi cron. Fase 6 ditutup dengan seluruh kriteria PRD Bagian 9 terpenuhi. H95 ditutup penuh, H4, H46, dan H49 dicentang. Tanpa perubahan skema |
| 2.17 | 9 November 2026 | Dua keputusan dari audit hutang teknis: `TRUST_PROXY` dari env (D117) dan batas `forgot-password` per email (D118). H di 8.1 dan H yang lulus audit dicentang, rumusan H55 diselaraskan, H93 dibuka kembali, catatan desain retry H37. Tanpa perubahan skema |
| 2.18 | 10 November 2026 | Empat keputusan webhook pembayaran sebelum Fase 7: pembayaran telat (D119), selisih nominal (D120), pemrosesan ulang event FAILED (D121), dan webhook EXPIRED (D122). H99. Pembagian Fase 7 dalam tiga sesi. Tanpa perubahan skema |
| 2.19 | 10 November 2026 | Dua keputusan dari sesi 7a: aturan endpoint pembayaran (D123) dan satu payment satu invoice (D124). Catatan adapter Xendit dan hasil uji sandbox. H96 ditutup. Tanpa perubahan skema |
| 2.20 | 10 November 2026 | Perlakuan webhook PAID untuk invoice yatim dan pembayaran dobel (D125). H99 diperluas. Tanpa perubahan skema |
| 2.21 | 10 November 2026 | Tiga keputusan dari sesi 7b: bayar dobel di baris mana pun (D126), SETTLED seperti PAID (D127), dan 5xx sebelum kunci event (D128). Catatan implementasi webhook dan urutan kunci. H10 sampai H13 ditutup. Tanpa perubahan skema |
| 2.22 | 11 November 2026 | Dua keputusan dari sesi 7c: endpoint wallet dimajukan ke Fase 7 (D129) dan pengecualian ledger append-only untuk seed demo (D130). Catatan implementasi T18. Fase 7 ditutup dengan seluruh kriteria PRD Bagian 9 terpenuhi. H3 terbukti lewat perilaku, H100 baru. Status artefak 3 dan 4 diselaraskan. Tanpa perubahan skema |
| 2.23 | 13 November 2026 | Hasil uji sandbox Xendit sungguhan dicatat di penutupan Fase 7: webhook PAID dari Xendit diproses, satu `ESCROW_HOLD`, V1 nol baris. Catatan tunnel dan latensi transaksi webhook. Tanpa keputusan baru dan tanpa perubahan skema |
| 2.24 | 13 November 2026 | Lima keputusan uang sebelum Fase 8: refund pembatalan penuh (D131), `REFUND_DEDUCTION` di transisi pemicu (D132), rumus PARTIAL (D133), pembalikan withdrawal (D134), dan refund pembayaran telat (D135). Keputusan terbuka nomor 6 soal jalur eksekusi refund. Pembagian Fase 8. H99 dirinci, H101 sampai H104. Tanpa tabel atau kolom baru, dua partial unique index menyusul di 8b dan 8c |
| 2.25 | 14 November 2026 | Dua keputusan dari uji sandbox sesi 8a: refund dua jalur dipilih dari metode pembayaran (D136, menutup keputusan terbuka nomor 6) dan payout v2 dengan status akhir dari webhook (D137). Hasil sandbox dan fixture payload sungguhan. H105. Tanpa perubahan skema |
| 2.26 | 14 November 2026 | Dua keputusan dari sesi 8b: aturan approve withdrawal (D138) dan pengecualian 409 (D139). Catatan implementasi withdrawal, payout, dan webhook payout. H83, H102, dan H105 ditutup. Satu partial unique index baru |
| 2.27 | 15 November 2026 | Delapan keputusan dari sesi 8c: aturan eksekusi refund (D140), kolom refund untuk sistem dan jalur manual (D141, D142), sinkronisasi admin (D143 sampai D145), penanda batal setelah bayar (D146), dan payment tanpa invoice id (D147). H99 bagian pembayaran telat, H101, dan H106 ditutup, H107 dan H108 baru. Perubahan skema pada `refunds` dan satu partial unique index |
| 2.28 | 15 November 2026 | Tiga keputusan dari sesi 8d: batas bukti per pihak (D148), reason refund sengketa (D149), dan penghitung order (D150). Catatan implementasi sengketa. Fase 8 ditutup dengan seluruh kriteria PRD Bagian 9 terpenuhi. H100 dan H108 ditutup. Tanpa perubahan skema |
| 2.29 | 15 November 2026 | Lima keputusan sebelum Fase 9: port `LlmGateway` (D151), pembagian tugas Gemini dan server beserta lima jenis intent (D152), definisi akurasi (D153), rate limit tamu (D154), dan sesi tamu 24 jam (D155). Pembagian Fase 9. Satu parameter sistem baru |
| 2.30 | 15 November 2026 | Lima keputusan dari sesi 9a dan smoke Gemini: timeout 8 detik (D156), fake ditolak di produksi (D157), `store: false` (D158), model `gemini-3.5-flash-lite` (D159), dan rem global tamu 250 (D160). H14 ditutup, H110 baru. Tanpa perubahan skema |

---

## Lampiran B. Definisi Atribut per Sub-Kategori

Status: **selesai seluruhnya**, dua belas sub-kategori di empat kategori.

Pola yang dipakai di seluruh sub-kategori:

- Setiap sub-kategori punya minimal satu atribut OPTION, kalau tidak fitur harga bertingkat jadi mubazir
- Durasi **bukan** atribut. Durasi diisi lewat kolom `listings.estimated_duration_minutes` yang disalin ke `snapshot_duration_minutes` untuk pemeriksaan bentrok jadwal (D90, D41). Pengecualiannya D100: nilai opsi boleh membawa `duration_minutes`, dan durasi opsi terpilih menggantikan kolom itu saat order dibuat. Dipakai di B.5 dan B.6
- Atribut yang tidak memengaruhi harga tapi menentukan ekspektasi client tetap dimasukkan sebagai SPEC
- Jumlah atribut sengaja tidak seragam antar sub-kategori, karena keseragaman justru melemahkan klaim tujuan penelitian nomor 1

### B.1 Cuci Mobil Panggilan

Mode: kedua. Rentang harga acuan: 50.000 sampai 150.000

| Key | Label | Tipe | Peran | pricing_mode | Wajib | Filter |
|---|---|---|---|---|---|---|
| `jenis_kendaraan` | Jenis kendaraan | SELECT | OPTION | FLAT_PER_OPTION | ya | ya |
| `layanan_tambahan` | Layanan tambahan | MULTISELECT | OPTION | FLAT_PER_OPTION | tidak | ya |
| `sumber_air` | Sumber air | SELECT | SPEC | NONE | ya | ya |

```
jenis_kendaraan   Sedan, SUV, MPV, Hatchback, Pickup, Van
                  contoh delta: Sedan +0, Hatchback +0, MPV +15.000,
                                SUV +20.000, Pickup +20.000, Van +30.000

layanan_tambahan  Poles Body, Vacuum Interior, Semir Ban,
                  Cuci Mesin, Pembersih Jamur Kaca
                  contoh delta: +25.000 sampai +50.000 per item

sumber_air        Dibawa penyedia, Disediakan client
```

`sumber_air` adalah contoh atribut SPEC yang gunanya menyelaraskan ekspektasi, bukan menghitung harga. Sering jadi sumber kekecewaan client kalau tidak disebut di awal.

### B.2 Servis Motor Panggilan

Mode: kedua, condong Available Now. Rentang harga acuan: 50.000 sampai 200.000

| Key | Label | Tipe | Peran | pricing_mode | Wajib | Filter |
|---|---|---|---|---|---|---|
| `jenis_servis` | Jenis servis | SELECT | OPTION | FLAT_PER_OPTION | ya | ya |
| `tipe_motor` | Tipe motor yang dilayani | MULTISELECT | SPEC | NONE | ya | ya |
| `sparepart` | Penyediaan sparepart | SELECT | SPEC | NONE | ya | ya |

```
jenis_servis     Servis Ringan, Servis Besar, Ganti Oli,
                 Ganti Kampas Rem, Servis CVT, Tune Up
                 contoh delta: Ganti Oli +0 sampai Servis Besar +150.000

tipe_motor       Bebek, Matic, Sport, Motor Besar
sparepart        Disediakan penyedia, Disediakan client, Keduanya bisa
```

Sub-kategori ini adalah **contoh utama untuk mempertahankan klaim Hybrid Approach di sidang.** Bandingkan `tipe_motor` (MULTISELECT, SPEC, tidak memengaruhi harga) dengan `jenis_kendaraan` di B.1 (SELECT, OPTION, memengaruhi harga). Dua atribut yang namanya mirip di kategori yang sama, tapi peran dan perilakunya berbeda. Skema kolom konvensional tidak bisa menampung perbedaan semacam ini tanpa menambah tabel per jasa.

### B.3 Ganti Oli Panggilan

Mode: kedua. Rentang harga acuan: 40.000 sampai 120.000

| Key | Label | Tipe | Peran | pricing_mode | Wajib | Filter |
|---|---|---|---|---|---|---|
| `jenis_kendaraan` | Jenis kendaraan | SELECT | SPEC | NONE | ya | ya |
| `oli_disediakan` | Oli disediakan penyedia | BOOLEAN | OPTION | FLAT_PER_OPTION | tidak | ya |

```
jenis_kendaraan  Mobil, Motor
```

`jenis_kendaraan` sengaja SELECT, bukan MULTISELECT. Harga dasar ganti oli mobil dan motor jauh berbeda, jadi satu listing melayani satu jenis kendaraan, dan penyedia yang melayani keduanya membuat dua listing. Daftar yang lebih rinci bisa ditambah lewat usulan `NEW_ATTRIBUTE_OPTION`.

Dua atribut saja, dan itu disengaja. Gunanya menjawab pertanyaan yang hampir pasti muncul: apakah Hybrid Approach memaksa semua penyedia mengisi banyak kolom? Jawabannya tidak, dan sub-kategori ini buktinya. Jasa sederhana tetap sederhana, definisi atributnya yang menyesuaikan.

`oli_disediakan` sebagai BOOLEAN berbayar melengkapi cakupan `pricing_mode` di kategori ini. PER_UNIT tidak dipakai di Otomotif, dan muncul di kategori lain seperti Servis AC (jumlah unit) dan Foto Produk (jumlah item).

### B.4 Foto Produk

Mode: Scheduled. Rentang harga acuan: 150.000 sampai 750.000

| Key | Label | Tipe | Peran | pricing_mode | Wajib | Filter |
|---|---|---|---|---|---|---|
| `jumlah_item` | Jumlah item difoto | NUMBER | OPTION | **PER_UNIT** | ya | tidak |
| `gaya_foto` | Gaya pemotretan | SELECT | OPTION | FLAT_PER_OPTION | ya | ya |
| `tambahan` | Layanan tambahan | MULTISELECT | OPTION | FLAT_PER_OPTION | tidak | ya |

```
jumlah_item      validation_rule { min: 1, max: 50 }
                 contoh delta: 25.000 per item

gaya_foto        Katalog Latar Putih, Flat Lay, Lifestyle, Detail Makro
                 contoh delta: Katalog +0, Flat Lay +50.000,
                               Lifestyle +100.000, Detail Makro +75.000

tambahan         Edit Retouch Lanjutan, Video Pendek, Foto 360 Derajat
                 contoh delta: +100.000 sampai +250.000

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

```
paket_durasi           Setengah Hari (4 jam), Sehari Penuh (8 jam)
                       duration_minutes (D100): 240, 480
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
```

Sub-kategori beratribut paling banyak di seluruh dua belas, disengaja sebagai kontras terhadap ganti oli yang hanya dua. Enam atribut dengan tiga tipe data dan dua `pricing_mode` dalam satu sub-kategori, tanpa satu pun kolom tambahan di skema.

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

```
jenis_acara            Ulang Tahun, Seminar, Wisuda, Gathering Perusahaan,
                       Pernikahan, Upacara Keagamaan
                       contoh delta: Ulang Tahun +0 sampai
                                     Pernikahan +1.500.000

durasi_liputan         2 Jam, 4 Jam, 8 Jam
                       duration_minutes (D100): 120, 240, 480
                       contoh delta: 2 Jam +0 sampai 8 Jam +2.000.000

tambahan               Cetak Instan di Lokasi, Live Streaming, Drone,
                       Same Day Edit, Photobooth
jenis_dokumentasi      Foto, Video, Foto dan Video
waktu_pengerjaan_hari  validation_rule { min: 1, max: 45 }
```

Opsi "Dua Hari" dihapus (D100). Liputan dua hari melewati batas 720 menit dan melanggar satu order satu kedatangan (D75), sehingga dipesan sebagai dua order.

**Sub-kategori ini adalah contoh utama aturan pendamping (D69).** Order dokumentasi pernikahan ditugaskan ke satu penanggung jawab, dua rekannya dicentang sebagai pendamping, dan ketersediaan mereka ikut terblokir. Pakai kasus ini saat demo.

### B.7 Makeup Artist Acara

Mode: Scheduled. Rentang harga acuan: 150.000 sampai 750.000. Contoh penyedia INDIVIDUAL.

| Key | Label | Tipe | Peran | pricing_mode | Wajib | Filter |
|---|---|---|---|---|---|---|
| `jumlah_orang` | Jumlah orang dirias | NUMBER | OPTION | **PER_UNIT** | ya | tidak |
| `jenis_acara` | Jenis acara | SELECT | OPTION | FLAT_PER_OPTION | ya | ya |
| `tambahan` | Layanan tambahan | MULTISELECT | OPTION | FLAT_PER_OPTION | tidak | ya |
| `kelas_produk` | Kelas produk kosmetik | SELECT | SPEC | NONE | ya | ya |

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
```

Trial makeup **tidak** dijadikan opsi berbayar di sini, melainkan listing terpisah, sesuai batas kedua D75.

### B.9 Potong Rambut Panggilan

Mode: kedua. Rentang harga acuan: 50.000 sampai 200.000

| Key | Label | Tipe | Peran | pricing_mode | Wajib | Filter |
|---|---|---|---|---|---|---|
| `jenis_layanan` | Jenis layanan | SELECT | OPTION | FLAT_PER_OPTION | ya | ya |
| `jumlah_orang` | Jumlah orang | NUMBER | OPTION | **PER_UNIT** | ya | tidak |

```
jenis_layanan    Potong Dewasa, Potong Anak, Potong dan Keramas,
                 Cukur Jenggot, Potong dan Pewarnaan
                 contoh delta: Potong Dewasa +0 sampai
                               Pewarnaan +150.000

jumlah_orang     validation_rule { min: 1, max: 10 }
                 contoh delta: 60.000 per orang
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

```
jenis_pekerjaan  Perbaikan Korsleting, Pasang Stop Kontak, Pasang Lampu,
                 Instalasi Baru, Pengecekan Instalasi, Pasang MCB
                 contoh delta: Pengecekan +0 sampai
                               Instalasi Baru +300.000

jumlah_titik     validation_rule { min: 1, max: 30 }
                 contoh delta: 50.000 per titik
material         Disediakan penyedia, Disediakan client, Keduanya bisa
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
```

`garansi_hari` satu-satunya atribut opsional bertipe SPEC di seluruh dua belas, disengaja sebagai contoh atribut yang jadi pembeda kompetitif: penyedia yang memberi garansi menonjol di hasil filter, yang tidak memberi tetap bisa mendaftar.

### B.13 Rekap dan Bahan Pembelaan Sidang

| Sub-kategori | Jumlah atribut | Tipe data terpakai | pricing_mode |
|---|---|---|---|
| Ganti oli | 2 | SELECT, BOOLEAN | FLAT |
| Potong rambut | 2 | SELECT, NUMBER | FLAT, PER_UNIT |
| Cuci mobil | 3 | SELECT, MULTISELECT | FLAT |
| Servis motor | 3 | SELECT, MULTISELECT | FLAT |
| Foto produk | 3 | SELECT, MULTISELECT, NUMBER | FLAT, PER_UNIT |
| Makeup artist acara | 4 | SELECT, MULTISELECT, NUMBER | FLAT, PER_UNIT |
| Makeup pengantin | 4 | SELECT, MULTISELECT, NUMBER | FLAT, PER_UNIT |
| Tukang listrik | 4 | SELECT, NUMBER, BOOLEAN | FLAT, PER_UNIT |
| Servis mesin cuci | 4 | SELECT, MULTISELECT, NUMBER | FLAT |
| Dokumentasi acara | 5 | SELECT, MULTISELECT, NUMBER | FLAT |
| Servis AC | 5 | SELECT, MULTISELECT, NUMBER | FLAT, PER_UNIT |
| Foto prewedding | 6 | SELECT, MULTISELECT, NUMBER | FLAT, PER_UNIT |

Total 45 atribut. Jumlah per sub-kategori sudah tanpa `durasi_estimasi` (D90).

Rentang 2 sampai 6 atribut dalam struktur yang sama persis, tanpa satu pun kolom tambahan di skema. Ini angka yang ditunjukkan di Bab IV sebagai bukti tujuan penelitian nomor 1.

**Tiga pasangan kontras yang siap dipakai kalau penguji bertanya:**

| Pasangan | Apa yang dibuktikan |
|---|---|
| `jenis_kendaraan` (cuci mobil, OPTION berbayar) versus `tipe_motor` (servis motor, SPEC) | Atribut bernama mirip di kategori yang sama bisa punya peran dan perilaku berbeda |
| `jenis_acara` (makeup artist, OPTION) versus `gaya_riasan` (makeup pengantin, SPEC) | Pola yang sama berulang di kategori lain, jadi bukan kebetulan |
| Ganti oli 2 atribut versus foto prewedding 6 atribut | Hybrid Approach tidak memaksa penyedia sederhana mengisi banyak kolom |
| `paket_durasi` (foto prewedding) versus kolom durasi listing (ganti oli) | Satu atribut OPTION bisa menentukan harga sekaligus lama pekerjaan, tanpa kolom tambahan di skema (D100) |

**Catatan tipe data yang tidak terpakai.** TEXT dan DATE tidak muncul di dua belas sub-kategori ini. DATE tertutup oleh `scheduled_at` yang sudah jadi kolom tersendiri, dan TEXT dihindari karena tidak bisa difilter serta hampir selalu sebenarnya milik deskripsi listing. Kalau ditanya, jawabannya: definisi tipe disediakan lengkap supaya admin bisa menambah jasa baru yang membutuhkannya, dan dua belas sub-kategori contoh belum tentu memakai seluruhnya. Sistemnya memang dirancang lebih luas dari datanya.
