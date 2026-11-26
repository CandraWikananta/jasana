# Register Keputusan Desain Sistem

**Tugas Akhir:** Rancang Bangun Platform Marketplace Jasa On-Demand Berbasis Web yang Terintegrasi dengan Kecerdasan Buatan
**Nama sistem:** Jasana
**Penyusun:** I Nyoman Gede Candra Wikananta (2305551065)
**Bidang Keahlian:** Sistem Informasi, Teknologi Informasi, Universitas Udayana
**Versi:** 2.57
**Terakhir diperbarui:** 27 November 2026 (versi 2.57)
**Tahap saat ini:** Implementasi backend Fase 0 sampai Fase 10 selesai, data simulasi sudah terisi di Supabase dev. Frontend dibangun ulang di lapisan visual di branch `feat/frontend-v2` dengan Design System v2.10 (D241 sampai D274); logika W0 dan W2 dipertahankan, versi lama diarsipkan di tag `frontend-v1`. Berikutnya migrasi W0 dan W2 ke v2.1, field `OrderDto` di backend (H131), W1, stress test k6, dan UAT

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
| Sesi dan pesan chat (D161 sampai D164) | 4 | 0 |
| Hasil sandbox chatbot (D165 sampai D166) | 2 | 0 |
| Klaim, personalisasi, dan evaluasi chatbot (D167 sampai D175) | 9 | 0 |
| Protokol evaluasi akurasi (D176) | 1 | 0 |
| Pelengkap: notifikasi, review, laporan, dan parameter (D177 sampai D181) | 5 | 0 |
| Notifikasi dan retry email (D182 sampai D186) | 5 | 0 |
| Pesan, review, dan perbaikan sandbox 10a (D187 sampai D197) | 11 | 0 |
| Parameter dan laporan admin (D198 sampai D203) | 6 | 0 |
| Data simulasi (D204 sampai D209) | 6 | 0 |
| Frontend: keputusan dasar (D210 sampai D223) | 14 | 0 |
| Frontend: hasil W0 dan W2 (D224 sampai D230) | 7 | 0 |
| Frontend: sesi login (D231 sampai D235) | 5 | 0 |
| Frontend: aksi order dan real-time (D236 sampai D240) | 5 | 0 |
| Frontend: Design System v2.0 (D241) | 1 | 0 |
| Frontend: review Design System v2.1 (D242 sampai D250) | 9 | 0 |
| Frontend: logo (D251) | 1 | 0 |
| Frontend: halaman cari (D252 sampai D254) | 3 | 0 |
| Frontend: detail jasa (D255) | 1 | 0 |
| Frontend: ruang aman layar (D256) | 1 | 0 |
| Frontend: tombol ikon dan navigasi pelanggan desktop (D257) | 1 | 0 |
| Frontend: halaman autentikasi (D258 sampai D261, D258 dibatalkan) | 4 | 0 |
| Frontend: halaman akun (D262 sampai D263) | 2 | 0 |
| Frontend: peta dan alamat (D264 sampai D265) | 2 | 0 |
| Frontend: halaman Asisten (D266 sampai D270) | 5 | 0 |
| Frontend: widget Asisten dan klaim sesi (D271 sampai D274) | 4 | 0 |
| Keputusan terbuka tanpa nomor D (Bagian 7) | | 0 |

**Perubahan pada versi 2.57:**

1. Empat keputusan dari widget Asisten dan klaim sesi W8b (D271 sampai D274, Bagian 4AX). Fase W8 selesai. Design System naik ke v2.10, PRD Frontend 5.15 direvisi. H157 sampai H161 baru. Data uji frontend dicatat di Data-Simulasi Bagian 11

**Perubahan pada versi 2.56:**

1. Lima keputusan dari halaman Asisten W8a (D266 sampai D270, Bagian 4AW). Design System naik ke v2.9. H153 sampai H156 baru

**Perubahan pada versi 2.55:**

1. Dua keputusan dari alamat dengan peta W1c (D264 dan D265, Bagian 4AV). Design System naik ke v2.8, PRD Frontend 2.2 direvisi. H149 ditutup. H150 sampai H152 baru

**Perubahan pada versi 2.54:**

1. Dua keputusan dari halaman akun W1b (D262 dan D263, Bagian 4AU). Design System naik ke v2.7. H127 ditutup. H145 sampai H149 baru

**Perubahan pada versi 2.53:**

1. Empat keputusan dari halaman autentikasi W1a (D258 sampai D261, Bagian 4AT). D258 dibatalkan. H143 dan H144 baru

**Perubahan pada versi 2.52:**

1. Ukuran tombol `icon` dan navigasi pelanggan di desktop (D257, Bagian 4AS). Design System naik ke v2.6. H142 baru

**Perubahan pada versi 2.51:**

1. Ruang aman layar untuk iPhone (D256, Bagian 4AR). Design System naik ke v2.5. H140 (data profil penyedia) dan H141 (foto dan judul data simulasi) baru

**Perubahan pada versi 2.50:**

1. `EscrowNote` di detail jasa (D255, Bagian 4AQ) dan catatan pelaksanaan D254. Design System naik ke v2.4

**Perubahan pada versi 2.49:**

1. Tiga keputusan dari desain ulang halaman cari (D252 sampai D254, Bagian 4AP). Design System naik ke v2.3

**Perubahan pada versi 2.48:**

1. Logo Jasana (D251, Bagian 4AO). Design System naik ke v2.2

**Perubahan pada versi 2.47:**

1. Sembilan keputusan dari review Design System v2.0 dengan empat skill desain (D242 sampai D250, Bagian 4AN). Merevisi bagian penanda mode Sekarang dan menu aktif di D241. Design System naik ke v2.1. H139 baru

**Perubahan pada versi 2.46:**

1. Design System v2.0 dengan palet baru (D241, Bagian 4AM). Merevisi bagian warna D224 dan D225

**Perubahan pada versi 2.45:**

1. Empat keputusan dari W0 bagian 4: `order:join` dari client (D236), signature `getViewer` dan `getOrderActions` (D237), aturan sambung ulang socket (D238), label enum di luar order (D239), dan sesi tertunda saat API bermasalah (D240). Bagian 4AL
2. Penutupan W0 frontend
3. H131 sampai H138 baru, H137 langsung ditutup lewat D240. H131 diprioritaskan sebelum W3

**Perubahan pada versi 2.44:**

1. Lima keputusan dari implementasi sesi login frontend (W0 bagian 3): dua cookie sesi (D231), `X-Forwarded-For` dari entri paling kanan (D232), pemeriksaan `Origin` di Route Handler sesi (D233), logout yang selalu mencabut refresh token di server (D234), dan fungsi kapabilitas area (D235). Bagian 4AK
2. H128 sampai H130 baru

**Perubahan pada versi 2.43:**

1. Empat belas keputusan dasar frontend dari PRD Frontend Bagian 3 (usulan FE1 sampai FE14) dicatat sebagai D210 sampai D223 (Bagian 4AJ)
2. Tujuh keputusan dari implementasi W0 dan W2 (D224 sampai D230): Design System dan penjaga token, label status dan badge mode, host gambar, filter pencarian, halaman tidak ditemukan, ikon kategori, dan alur kerja branch
3. Desain antarmuka (artefak 8) selesai dalam bentuk Design System v1.5 dan mockup, menggantikan Figma
4. H124 sampai H127 baru

**Perubahan pada versi 2.42:**

1. Opsi skala data simulasi untuk Supabase dev (D209) dan hasil jalannya (Bagian 4AI)
2. H16 ditutup, H123 baru

**Perubahan pada versi 2.41:**

1. Data simulasi Bali (D204), pengecualian ledger untuk data simulasi yang memperluas D130 (D205), foto simulasi (D206), `--bulk` hanya lokal (D207), dan penonaktifan listing akun uji (D208)
2. H16 ditutup setelah dijalankan ke Supabase dev, H122 baru

**Perubahan pada versi 2.40:**

1. Hasil evaluasi run 3 dan rekap tiga run (D176): 74,15 persen, target D85 tidak tercapai, 94,0 persen atas skenario yang dijawab
2. Penutupan Fase 9 (Bagian 4AG). H15 ditutup
3. Hasil uji sandbox 10c

**Perubahan pada versi 2.39:**

1. Registri parameter dan tabel rentang (D198), PATCH atomik dengan advisory lock (D199)
2. Periode laporan per hari WITA dan V4 per bulan WITA (D200), definisi kolom laporan (D201), SQL mentah terikat (D202), dan waktu status dari riwayat (D203)
3. Catatan sesi 10c dan penutupan Fase 10. H118 dan H120 baru. Bagian 6.5 menandai empat kunci yang tidak dibaca server

**Perubahan pada versi 2.38:**

1. Masa aktif pesan per status yang merevisi D79 (D187), kanal notifikasi pesan dan review (D188), endpoint admin review (D189), dan revisi V11 (D190)
2. Batas teks dan nama reviewer disamarkan (D191), serta review di detail listing (D192)
3. Perbaikan temuan sandbox 10a: batas umur retry (D193), backoff (D194), format waktu WITA (D195), dan nomor order WITA (D196)
4. Urutan kunci seragam penyedia lalu listing (D197)
5. Catatan sesi 10b. H70 sampai H72 ditutup, H117 baru
6. Hasil uji sandbox 10b di Supabase dev

**Perubahan pada versi 2.37:**

1. Tabel event notifikasi (D182), endpoint notifikasi (D183), dan whitelist serta render generik retry email yang merevisi D177 (D184)
2. Hitungan dan klaim retry termasuk baris PENDING yatim (D185), dan enum `ORDER_MESSAGE` (D186)
3. Catatan sesi 10a. H37 ditutup, H114 sampai H116 baru
4. Hasil uji sandbox 10a dengan SMTP sungguhan dan empat temuan yang diperbaiki di sesi 10b

**Perubahan pada versi 2.36:**

1. Retry email dengan render ulang (D177), notifikasi in-app selektif (D178), dan aturan review (D179)
2. Laporan admin per hari WITA yang dibuktikan cocok dengan V4 dan ledger (D180), dan validasi `PATCH /admin/settings` (D181)
3. Pembagian Fase 10 dalam tiga sesi

**Perubahan pada versi 2.35:**

1. Protokol evaluasi akurasi tiga run (D176) dan hasil evaluasi run 1

**Perubahan pada versi 2.34:**

1. Hasil uji sandbox 9c: klaim, personalisasi, dan retry terbukti dengan Gemini sungguhan, taksonomi demo dinonaktifkan di Supabase dev

**Perubahan pada versi 2.33:**

1. Rincian retry (D167), isi dan pemakaian snapshot personalisasi (D168, D169), kode galat klaim sesi (D170)
2. V3 per pesan yang merevisi catatan D164 (D171), pemisahan akun baru di V9 (D172), kriteria taksonomi demo (D173)
3. Relasi kartu listing paralel (D174) dan constraint sesi tamu yang diklaim (D175)
4. Catatan sesi 9c. H66 dan H111 ditutup, H112 dan H113 baru

**Perubahan pada versi 2.32:**

1. Satu kali retry untuk galat 5xx dari Gemini (D165) dan saran templat "tidak ada hasil" yang mengikuti slot (D166)
2. Hasil uji sandbox 9b dengan Gemini sungguhan, termasuk analisis latensi. H111 baru

**Perubahan pada versi 2.31:**

1. Baris ASSISTANT saat Gemini gagal (D161), kode galat akses sesi (D162), urutan batas tamu (D163), dan definisi tamu untuk rem global (D164)
2. Catatan implementasi sesi 9b. H19 dan H67 ditutup, H66 sebagian

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
| D79 | **Pesan dalam order**, tabel `order_messages`. Satu percakapan per order, sejak `ACCEPTED` sampai `settlement_due_at` lewat, lalu read-only. Teks saja, tanpa lampiran. Peserta: client, pemilik, dan pekerja yang ditugaskan | Menutup gesekan operasional nyata, terutama pekerja yang kesulitan menemukan alamat. Sudah ada order, ada SLA, dan ada batas waktu, jadi tidak membuka jalur pribadi permanen. Pengirimannya menumpang Socket.IO yang sudah ada, tidak ada komponen baru **Direvisi D187:** masa aktif ditetapkan per status, dan DISPUTED read-only |

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
| D130 | **Seed demo Fase 6 dan Fase 7 menghapus `wallet_transactions` milik wallet akun demo** sebelum menghapus akun itu. Akun demo dikenali dari email yang persis tercantum di daftar `ACTORS`. Seed menolak jalan saat `NODE_ENV=production`. Ini satu-satunya pengecualian aturan ledger append-only (CLAUDE.md aturan 3), dan kodenya diberi komentar yang menyebut itu | Sejak 7b, simulate-payment menulis ledger. Menghapus akun demo ikut menghapus wallet lewat cascade, sedangkan `wallet_transactions` memakai RESTRICT, sehingga seed tidak bisa dijalankan dua kali. Data yang dihapus adalah data buatan tanpa nilai audit, dan cakupannya dibatasi ke email yang dikenal persis. Terbukti di sesi 7c: seed dijalankan ulang setelah newman, ledger demo kembali 0, dan baris lain tidak tersentuh **Diperluas D205:** data simulasi `@sim.jasana.test` |

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

## 4Y. Keputusan Versi 2.31 (D161 sampai D164)

Dari sesi 9b. D161 sampai D163 dijawab sebelum rencana disusun, D164 dari review rencana. Tanpa perubahan skema.

| # | Keputusan | Alasan |
|---|---|---|
| D161 | **Kalau Gemini gagal, tetap ditulis baris ASSISTANT** berisi pesan ramah, `extracted_intent` NULL, dan `latency_ms` terukur, lalu dibalas 502. Pesan USER dan kenaikan `message_count` sudah ter-commit lebih dulu. Baris gagal tidak ikut dikirim sebagai riwayat prompt. Pada evaluasi akurasi (D153), skenario yang gagal dihitung salah dan jumlahnya dilaporkan terpisah | Kegagalan Gemini adalah data penelitian. Kolom `gagal_ekstraksi` di V3 hanya bermakna kalau kegagalan tercatat sebagai baris, bukan sekadar pesan user tanpa balasan. Kegagalan merespons tetap bagian dari kinerja sistem |
| D162 | **Kode galat akses sesi chat.** Tanpa identitas, format `X-Guest-Token` salah, atau JWT rusak: 401, dan JWT rusak tidak pernah diperlakukan sebagai tamu. Sesi tidak ada atau milik orang lain: 404. Sesi tamu ENDED atau kedaluwarsa: 409 `CHAT_SESSION_ENDED` untuk semua aksi. Sesi terdaftar ENDED: riwayat tetap bisa dibaca, tetapi kirim pesan dan end dibalas 409 | 404 untuk sesi milik orang lain mencegah penebakan id sesi yang ada. Riwayat sesi terdaftar bersifat permanen (D77), sedangkan sesi tamu memang dirancang sementara |
| D163 | **Urutan pemeriksaan batas tamu: IP, lalu global, lalu per sesi.** Merevisi urutan di PRD 4.4. IP diperiksa di middleware memori sebelum basis data. Global hanya membaca dan diperiksa sebelum kenaikan per sesi. Per sesi paling akhir lewat satu UPDATE bersyarat, langsung disusul insert pesan USER di transaksi yang sama | Banjir permintaan dengan token palsu tertahan sebelum menyentuh basis data. Penolakan 503 tidak memakan kuota sesi tamu. Hanya pemeriksaan terakhir yang mengubah data, sehingga tidak perlu mengembalikan kuota yang sudah terpotong |
| D164 | **Rem global menghitung pesan USER dari sesi dengan `user_id IS NULL`** pada hari kalender WITA, bukan dari sesi yang punya `guest_token` | Setelah diklaim di 9c, sesi itu milik akun dan dibatasi batas per akun, sehingga tidak ikut memakan jatah tamu. Definisinya sama dengan `jenis_sesi` di V3, sehingga angka di Bab IV konsisten. **Direvisi D171:** V3 kini menghitung jenis sesi per pesan lewat `claimed_at`, sedangkan rem global tetap `user_id IS NULL` |

**Catatan implementasi sesi 9b tanpa nomor D:**

- **`guest_token` disimpan sebagai hash SHA-256** (pola D63, 64 karakter, kolom tidak berubah). Token mentah dikembalikan sekali saat sesi dibuat, dan dikirim lewat header `X-Guest-Token`
- `message_count` juga naik untuk sesi terdaftar (tanpa batas), supaya artinya sama di laporan. Batas pengguna terdaftar 30 pesan per jam per akun ditulis sebagai konstanta mengikuti PRD 5.5
- Konstanta baru: riwayat 6 pesan ke prompt, panjang pesan maksimal 1.000 karakter, dan 5 rekomendasi per jawaban. Kode galat baru `CHAT_SESSION_ENDED` (409)
- Daftar sub-kategori aktif untuk prompt di-cache di memori 5 menit dan di-invalidasi saat admin mengubah katalog. Yang dikirim ke prompt hanya kunci, nama, dan nama kategori, sedangkan id dipakai server untuk memetakan kunci
- `cari_jasa` tanpa lokasi (koordinat dari body atau alamat default terdaftar) tidak memicu pencarian, melainkan templat yang meminta izin lokasi, dan intent tetap tercatat `cari_jasa`. Waktu SEKARANG menjadi filter `available_now`, dan `budget_maks` menjadi harga maksimum
- `latency_ms` mencatat waktu panggilan Gemini saja. Waktu proses total satu giliran bisa dihitung dari selisih `created_at` pesan ASSISTANT dan pesan USER, dan dipakai untuk target PRD 6.1 karena k6 memakai fake
- Kartu rekomendasi memakai DTO pencarian publik. Test memeriksa bahwa telepon, email, id user, dan alamat penyedia tidak ikut (H67)
- **Seed Postman Fase 9 menurunkan batas tamu di basis data yang ditunjuk `DATABASE_URL`.** Hanya boleh dijalankan ke `jasana_test`. Kalau terlanjur ke Supabase dev, hapus empat baris `guest_chat_*` di `platform_settings`
- `shortcut:` baru: `lokasi.teks` tidak di-geocode, `slot.atribut` belum jadi filter, COUNT rem global tanpa kunci sehingga pesan paralel bisa sedikit melewati batas, dan belum ada index `chat_messages(created_at)`

**Hasil sesi 9b:** typecheck bersih, 819 test di 42 berkas lulus, 34 dari 34 mutan tertangkap. Postman Fase 9: 31 request dan 85 assertion tanpa gagal, dijalankan dua kali. Regresi Fase 1 sampai 8 tanpa gagal. `db:verify` lulus, dan V3 berbaris untuk tamu dan terdaftar.

---

## 4Z. Keputusan Versi 2.32 (D165 sampai D166) dan Hasil Uji Sandbox 9b

Dari uji sandbox 9b dengan Gemini sungguhan. Diimplementasikan di sesi 9c. Tanpa perubahan skema.

| # | Keputusan | Alasan |
|---|---|---|
| D165 | **Satu kali retry otomatis untuk galat HTTP 5xx dari Gemini** (500, 502, 503, 504), dengan jeda sekitar 1 detik. Kedua percobaan berbagi satu tenggat 8 detik (D156): retry memakai sisa waktu dan tidak dijalankan kalau sisanya terlalu kecil untuk satu panggilan. Tidak ada retry untuk `invalid_output`, timeout, kuota habis (429), atau 4xx lain. Jumlah percobaan dicatat di log (`llm_attempts`). Pada evaluasi akurasi (D153), skenario yang baru berhasil setelah retry dihitung terpisah | Uji sandbox mencatat dua kegagalan dari sepuluh panggilan, dan yang terkonfirmasi lewat log adalah 503 `service_unavailable` dengan `llm_quota_exceeded` false, yaitu server Gemini sedang padat. Pesan yang sama berhasil saat dikirim ulang. Galat semacam ini sementara, sehingga satu retry menaikkan peluang berhasil tanpa membebani pengguna. Retry untuk `invalid_output` atau kuota hanya membuang kuota karena hasilnya hampir pasti sama. Satu pesan bisa memakan dua request dari jatah 15 RPM, masih aman untuk UAT yang dijalankan bertahap |
| D166 | **Saran pada templat "tidak ada hasil" mengikuti slot yang diekstrak.** Kalau ada budget, sarankan menaikkan budget. Kalau ada waktu, sarankan mengganti waktu. Kalau keduanya kosong, sarankan mencoba lokasi lain atau sebutkan kategori lain yang tersedia | Templat 9b selalu menyarankan "ubah waktu atau budget-nya", padahal pada uji sandbox pengguna tidak menyebut waktu maupun budget. Saran yang tidak nyambung membuat chatbot terasa tidak memahami pesan, padahal intent-nya sudah diekstrak dengan benar |

**Hasil uji sandbox 9b (16 November 2026, dijalankan penyusun di Supabase dev dengan `LLM_GATEWAY=gemini` dan model `gemini-3.5-flash-lite`):**

| Jenis | Skenario | Hasil |
|---|---|---|
| `sapaan` | "halo kak" (tamu) dan "halo" (terdaftar) | Lulus, templat sapaan |
| `perlu_klarifikasi` | "butuh fotografer" (tamu) | Lulus, Gemini menanyakan jenis foto (produk, prewedding, dan seterusnya) |
| `cari_jasa`, ada hasil | dokumentasi acara seminar, tamu dengan koordinat | Lulus, sub-kategori `fotografi/dokumentasi-acara`, 2 rekomendasi |
| `cari_jasa`, ada hasil | dokumentasi acara seminar dengan budget, terdaftar memakai alamat default | Lulus, 2 rekomendasi |
| `cari_jasa`, kosong | "buat prewedding di pantai", tamu dengan koordinat | Lulus, sub-kategori `fotografi/foto-prewedding`, templat kosong. Dicek lewat SQL: Supabase dev memang belum punya listing Foto Prewedding |
| `jasa_tidak_tersedia` | "les piano anak" (terdaftar) | Lulus, templat menyebut kategori yang tersedia |
| `di_luar_cakupan` | "gimana cara daftar jadi penyedia?" (tamu) | Lulus pada percobaan kedua |
| Gemini gagal | dua kali, pada percobaan pertama "gimana cara daftar jadi penyedia?" (2.129 ms) dan "buat prewedding di pantai" (4.789 ms) | Ditangani sesuai D161: baris ASSISTANT berisi pesan ramah, 502 `GEMINI_UNAVAILABLE`. Kegagalan kedua terkonfirmasi lewat log sebagai 503 `service_unavailable` tanpa kuota habis. Log kegagalan pertama tidak diambil, tetapi polanya sama dan pesan itu berhasil saat diulang |

Semua jenis intent menghasilkan klasifikasi yang benar pada percobaan yang berhasil, dengan confidence 0,95 sampai 1 (H110). Pemakaian token 1.223 sampai 1.496 per panggilan.

**Latensi.** `latency_ms` (panggilan Gemini saja) dan waktu total satu giliran (selisih `created_at` pesan ASSISTANT dan pesan USER) pada delapan panggilan yang berhasil:

| Kelompok | Latensi Gemini | Waktu total | Selisih (overhead server) |
|---|---|---|---|
| Jawaban templat dan klarifikasi (5 panggilan) | 1.533 sampai 5.418 ms | 2.294 sampai 6.567 ms | 720 sampai 1.432 ms |
| `cari_jasa` dengan pencarian listing (3 panggilan) | 1.715 sampai 4.781 ms | 4.849 sampai 7.241 ms | 2.460 sampai 3.134 ms |

- Hanya 2 dari 8 giliran di bawah target 3 detik PRD 6.1, keduanya jawaban templat pada saat Gemini cepat
- Latensi Gemini terbagi dua kelompok: sekitar 1,5 sampai 1,9 detik dan sekitar 4,8 sampai 5,4 detik, padahal panjang prompt hampir sama. Pada smoke 9a rata-ratanya sekitar 1,5 detik. Kelompok lambat jatuh berdekatan dengan dua 503, sehingga dugaan kuatnya beban server Gemini pada saat itu. Model preview di free tier tidak punya jaminan latensi. Kebetulan semua panggilan lambat berasal dari sesi tamu, sehingga evaluasi 9c memisahkan latensi per jenis sesi untuk memastikan ini bukan efek dari isi prompt
- Overhead `cari_jasa` sekitar 1,7 sampai 2,4 detik lebih besar dari jawaban templat. Ini waktu pencarian listing dan penyusunan kartu rekomendasi ke Supabase dev yang jaraknya jauh (pola yang sama dengan H109). Dicatat sebagai H111
- Target 3 detik ditetapkan dengan asumsi Gemini menjawab sekitar 1,5 detik. Pengukuran di Bab IV memisahkan latensi Gemini dari overhead server, supaya bagian yang dikendalikan sistem bisa dinilai sendiri

**Catatan:** kategori dan sub-kategori demo dari fase sebelumnya ("Kebersihan Rumah (Demo F3)", "Otomotif (Demo Postman)", dan satu "Otomotif" ganda) masih aktif di Supabase dev, sehingga muncul di templat `jasa_tidak_tersedia` dan ikut terkirim ke prompt Gemini. Wajib dinonaktifkan sebelum evaluasi akurasi dan UAT (H16).

---

## 4AA. Keputusan Versi 2.33 (D167 sampai D175)

Dari sesi 9c. D168 sampai D173 dijawab penyusun sebelum rencana disusun, D167, D174, dan D175 dari pertanyaan selama implementasi. Satu migrasi constraint, tanpa tabel atau kolom baru.

| # | Keputusan | Alasan |
|---|---|---|
| D167 | **Rincian retry D165.** Retry dilewati kalau sisa tenggat setelah jeda 1 detik kurang dari 3000 ms. `latency_ms` adalah waktu total langkah LLM sejak percobaan pertama, termasuk jeda dan percobaan kedua. Jumlah percobaan dikembalikan gateway dan dicatat di log (`llm_attempts`), tanpa kolom baru | Percobaan kedua dengan sisa waktu di bawah 3 detik hampir pasti terpotong timeout saat Gemini lambat, sehingga hanya membuang kuota. Akibatnya 503 yang datang setelah sekitar 4 detik tidak di-retry, dan itu disengaja. Latensi total adalah waktu yang benar-benar ditunggu pengguna |
| D168 | **Isi dan pemakaian `personalization_snapshot`.** Sumbernya order berstatus PAID sampai SETTLED, di luar order batal, kedaluwarsa, sengketa, dan refund. Isinya maksimal 3 kunci riwayat sub-kategori, kota alamat default tanpa koordinat, rata-rata rating yang diberikan, dan rentang `listing_base_amount`. Gemini hanya menerima kunci riwayat sub-kategori yang masih aktif, dengan aturan bahwa riwayat boleh dipakai memilih sub-kategori hanya kalau pesan merujuknya secara eksplisit ("kayak kemarin"). Rentang harga dipakai server untuk mengurutkan ulang rekomendasi, bukan menyaring. Alamat, rating, dan angka harga tidak pernah dikirim ke Gemini | Dua efek personalisasi yang bisa ditunjukkan: Gemini memahami rujukan ke riwayat, dan urutan rekomendasi mengikuti kebiasaan harga pengguna. Rujukan wajib eksplisit supaya aturan label `perlu_klarifikasi` di H15 tidak bergeser. Rentang harga dari harga dasar listing supaya urutan ulang membandingkan harga dasar dengan harga dasar, bukan dengan total yang memuat opsi dan biaya lain. Data pribadi tetap di server |
| D169 | **Snapshot dihitung saat sesi terdaftar dibuat dan saat klaim**, sekali per sesi, tidak per pesan | Akun lama yang login lalu mengklaim sesi tetap mendapat personalisasi. Snapshot yang tetap selama sesi bisa diaudit, dan giliran sebelum klaim tetap tercatat tanpa personalisasi |
| D170 | **Kode galat klaim sesi** `POST /chat/sessions/:id/claim`. Tanpa JWT atau tanpa `X-Guest-Token`: 401. Token tidak cocok: 404. Sesi yang sudah diklaim, oleh akun siapa pun termasuk akun yang sama: 409 `CHAT_SESSION_ALREADY_CLAIMED` (kode baru). Sesi berakhir atau kedaluwarsa: 409 `CHAT_SESSION_ENDED`. Setelah diklaim, token tamu lama dibalas 404 di semua aksi | Satu jalur lewat UPDATE bersyarat atomik, tanpa baca tambahan. Frontend memperlakukan `ALREADY_CLAIMED` sebagai sudah beres. 404 untuk token lama mencegah token yang tertinggal di localStorage perangkat bersama membuka percakapan yang kini milik akun |
| D171 | **`jenis_sesi` pada V3 dihitung per pesan:** tamu kalau sesi belum diklaim atau pesan dikirim sebelum `claimed_at`, selain itu terdaftar. **Merevisi catatan D164.** Rem global tetap menghitung `user_id IS NULL`, sehingga klaim mengurangi hitungan rem pada hari itu | Pesan sebelum klaim memang dijawab tanpa personalisasi, jadi harus terhitung tamu di Bab IV. Rem global adalah pengaman kuota, bukan metrik, sehingga definisi yang lebih sederhana cukup |
| D172 | **V9 memisahkan akun baru dan akun lama** lewat `users.created_at >= chat_sessions.started_at`. Persen konversi H68 dihitung dari akun baru saja, dan klaim oleh akun lama ditampilkan terpisah | Yang ingin diukur H68 adalah tamu yang mendaftar setelah mencoba chatbot. Tanpa pemisahan, angka konversi melambung oleh pengguna lama yang kebetulan bertanya sebagai tamu. Tidak butuh angka jendela waktu yang ditetapkan sembarangan |
| D173 | **Kriteria taksonomi demo (H16)** adalah kategori atau sub-kategori aktif yang pasangan slug-nya tidak ada di `scripts/catalog-data.mjs`. Skripnya hanya menonaktifkan, tanpa menghapus, dan bawaannya dry-run | Acuannya katalog resmi Lampiran B, sehingga objektif dan sekaligus menangkap sisa demo yang tidak terpikirkan. Dry-run menampilkan target dan listing ACTIVE terdampak sebelum ada yang diubah |
| D174 | **Relasi kartu listing dibaca paralel.** Kueri listing tanpa relasi, lalu sub-kategori, profil penyedia, dan foto utama dibaca bersamaan lewat `Promise.all` di luar transaksi interaktif. Event query Prisma dinyalakan di env test untuk menghitung kueri | Prisma 6 terbukti membaca relasi itu berurutan. Jumlah kueri tetap, tetapi perjalanan berurutan ke basis data turun dari 4 menjadi 2, dan ikut mempercepat `GET /listings`. Hitungan kueri dikunci test sebagai pengaman regresi N+1 |
| D175 | **`chk_guest_session_expiry` menjadi `user_id IS NOT NULL OR guest_token IS NULL OR expires_at IS NOT NULL`** (migrasi `20261116120000_guest_session_expiry_unclaimed`) | Constraint lama menolak klaim yang mempertahankan `guest_token` (untuk V9) sambil mengosongkan `expires_at` (D155). Maknanya tetap: sesi tamu yang belum diklaim wajib punya masa kedaluwarsa. Constraint baru lebih longgar, sehingga semua baris lama tetap sah |

**Catatan implementasi sesi 9c tanpa nomor D:**

- **`last_intent` pada evaluasi sama dengan produksi.** Di produksi, `chat_sessions.last_intent` diisi intent utuh yang lolos Zod di transaksi yang sama dengan baris ASSISTANT, dan giliran gagal tidak mengubahnya. Skrip evaluasi memakai penyusun input dan pemangkasan 6 pesan riwayat yang sama. Skenario lanjutan memakai field `intent_terakhir`, atau kalau kosong dan riwayat diakhiri pertanyaan ASSISTANT, diturunkan sebagai `perlu_klarifikasi` dengan slot kosong. Ditemukan dan disamakan perbedaan urutan kunci JSON antara prompt produksi dan dataset, dibuktikan test bahwa teks prompt identik
- **Dataset evaluasi** `apps/api/eval/intent-dataset.json` punya field `asal` (penyusun, teman, draf_ai) dan `catatan` per skenario. Ringkasan melaporkan akurasi total terhadap target 80 persen (D85), akurasi per jenis, per asal, confusion matrix, akurasi slot per field yang berlabel, latensi, dan token. Meta mencatat model, hash commit, hash prompt dan skema, serta hash dataset. Asal pesan dilaporkan terbuka di Bab IV, tidak dikecualikan
- Fake gateway: pesan berisi `#uji-503` gagal sekali sebagai HTTP 503 lalu berhasil, untuk membuktikan retry di test dan Postman
- `AbortSignal.timeout` menolak milidetik pecahan, sehingga sisa tenggat retry dibulatkan ke bawah (bug yang ditemukan saat implementasi)
- Pemangkasan kecil di jalur chat: kenaikan `message_count` tamu memakai satu UPDATE bersyarat yang langsung mengembalikan nilai baru, dan dua baca parameter tamu dijalankan bersamaan. Kueri per giliran (termasuk BEGIN dan COMMIT): templat tamu 15 menjadi 13, `cari_jasa` tamu 21 menjadi 19, `cari_jasa` terdaftar 18 menjadi 17
- Satu mutan bertahan: syarat `user_id IS NULL` pada UPDATE klaim. Mutan ini setara dengan kode asli karena klaim pertama sudah mengosongkan `expires_at`, sehingga syarat kedaluwarsa ikut menolak klaim kedua. Syaratnya dipertahankan sebagai pengaman eksplisit

**Hasil sesi 9c:** typecheck bersih, 888 test di 46 berkas lulus, 52 dari 53 mutan tertangkap (satu mutan setara, lihat di atas). Postman Fase 1 sampai 9 tanpa gagal, Fase 9 dengan 50 request dan 122 assertion. `db:verify` lulus di `jasana_test`. Uji sandbox 9c dengan Gemini sungguhan, migrasi D175 ke Supabase dev, dan evaluasi akurasi penuh dijalankan penyusun.

**Hasil uji sandbox 9c (16 November 2026, dijalankan penyusun di Supabase dev dengan Gemini sungguhan):**

| Langkah | Hasil |
|---|---|
| Migrasi D175 | Hanya `20261116120000_guest_session_expiry_unclaimed` yang diterapkan, migrasi lain sudah sinkron |
| Nonaktif taksonomi demo (D173) | Dry-run menampilkan 7 target, semuanya demo berawalan `postman-` (3 kategori, 4 sub-kategori), lalu diterapkan. Dua listing ACTIVE di bawah sub-kategori demo tetap aktif karena skrip hanya mengubah taksonomi, dicek sebelum UAT |
| Pesan sebelum klaim | `sapaan`, sesi tamu |
| Klaim | 200, `claimed_at` terisi, `expires_at` null, tipe menjadi REGISTERED, snapshot dihitung dengan sumber `klaim` |
| Personalisasi | "mau pesan yang kayak kemarin lagi dong" tanpa menyebut jenis jasa menghasilkan `cari_jasa` `fotografi/dokumentasi-acara` dari riwayat akun, dengan 2 rekomendasi lewat alamat default |
| Retry (D165, D167) | Panggilan untuk pesan personalisasi gagal pada percobaan pertama dan berhasil pada percobaan kedua (`llm_attempts` 2, latensi total 4.848 ms termasuk jeda) |
| Token tamu lama | 404 `NOT_FOUND` |
| Klaim ulang | 409 `CHAT_SESSION_ALREADY_CLAIMED` |
| Isi snapshot | Riwayat `fotografi/dokumentasi-acara`, rentang harga dasar Rp1.500.000, tanpa koordinat dan alamat. `kota_alamat_default` null karena kolom kota pada alamat seed kosong |
| Evaluasi `--check` dan `--limit 5` | Lima skenario template benar (100 persen), dua di antaranya baru berhasil setelah retry. Hasil uji coba ini tidak dipakai untuk Bab IV |
| `db:verify` | Kueri integritas lulus. V3 menghitung pesan sebelum klaim sebagai tamu (D171). V9: 2 sesi tamu, 1 diklaim akun lama, konversi akun baru 0 persen (D172) |

- **Overhead server (H111).** Giliran `cari_jasa` terdaftar pada sandbox 9c: total 6.346 ms, Gemini 4.848 ms, overhead 1.498 ms. Pada sandbox 9b overhead `cari_jasa` 2.460 sampai 3.134 ms. Penurunan sekitar 1 sampai 1,6 detik sejalan dengan D174, tetapi baru dari satu sampel
- **503 dari Gemini sering muncul.** Tiga dari tujuh panggilan pada malam itu butuh retry. Tanpa D165, ketiganya akan berakhir sebagai `GEMINI_UNAVAILABLE`

---

## 4AB. Keputusan Versi 2.35 (D176) dan Evaluasi Akurasi Run 1

Ditetapkan penyusun setelah run 1 dan **sebelum** run berikutnya dijalankan. Tanpa perubahan kode maupun skema.

| # | Keputusan | Alasan |
|---|---|---|
| D176 | **Protokol evaluasi akurasi tiga run.** Dataset 49 skenario dijalankan tiga kali pada waktu berbeda: run 1 (16 November 2026, sekitar 23.00 WITA), run 2 pagi WITA, dan run 3 siang atau sore WITA, dengan jarak minimal beberapa jam. **Semua run dilaporkan, tidak ada yang dibuang.** Akurasi utama yang dibandingkan dengan target 80 persen (D85) adalah rata-rata akurasi ketiga run, dengan kegagalan tetap dihitung salah (D161). Dua metrik pendukung dilaporkan terpisah: akurasi atas skenario yang dijawab Gemini (kualitas ekstraksi) dan tingkat respons berhasil (ketersediaan layanan). Ketiga run memakai dataset, prompt, skema, dan model yang sama, dibuktikan lewat hash di meta hasil, dan run 2 serta run 3 dijalankan dari commit yang bersih. Selama run, server tidak dipakai untuk chat lain supaya jatah RPM tidak terbagi | Run 1 menunjukkan bahwa satu run sangat bergantung pada ketersediaan layanan pada jam itu: 14 dari 15 kesalahan adalah kegagalan Gemini merespons, menumpuk di paruh kedua run, sedangkan dari 35 skenario yang dijawab hanya 1 yang salah klasifikasi. Model preview di free tier tidak punya jaminan ketersediaan. Jumlah run dan cara menghitung ditetapkan sebelum run berikutnya dan run yang buruk tetap dihitung, sehingga ini bukan mengulang sampai hasilnya bagus. Pemisahan dua metrik pendukung membedakan kemampuan memahami bahasa dari ketersediaan layanan, dan menjadi dasar saran pengembangan |

**Hasil evaluasi run 1 (16 November 2026, 22.54 sampai 23.04 WITA, `gemini-3.5-flash-lite`, 49 skenario: 38 ditulis penyusun, 11 ditulis teman):**

| Metrik | Hasil |
|---|---|
| Akurasi (kegagalan dihitung salah, D161) | 34 dari 49, **69,39 persen** |
| Salah klasifikasi | 1 (S21, "listrik rumah turun terus tiap nyalain rice cooker, kenapa ya?" dibaca `di_luar_cakupan`, label `cari_jasa`) |
| Gagal merespons | 14: 9 timeout dan 5 HTTP 503 yang tetap gagal setelah retry |
| Berhasil setelah retry (D165) | 6 |
| Akurasi atas skenario yang dijawab | 34 dari 35, 97,1 persen |
| Tingkat respons berhasil | 35 dari 49, 71,4 persen |
| Per jenis (benar/n) | `cari_jasa` 25/30, `perlu_klarifikasi` 2/6, `jasa_tidak_tersedia` 3/4, `sapaan` 3/4, `di_luar_cakupan` 1/5. Seluruh kesalahan di luar `cari_jasa` adalah kegagalan merespons |
| Per asal | penyusun 27/38 (71,05 persen), teman 7/11 (63,64 persen) |
| Slot (metrik pendukung) | `waktu_jenis` 24/30 (80 persen), `budget_maks` 25/29 (86,21 persen) |
| Latensi Gemini, panggilan berhasil | rata-rata 3.589 ms, p50 3.257 ms, p95 7.224 ms. Token rata-rata 1.136 per panggilan |

- Kegagalan menumpuk mulai skenario ke-16, sejalan dengan 503 yang sering muncul pada sandbox 9b dan 9c di jam yang sama. p95 latensi yang mendekati timeout 8 detik (D156) menunjukkan sebagian timeout adalah panggilan yang sangat lambat, bukan ditolak
- Meta run 1 mencatat `commit_dirty` true karena dataset belum di-commit saat run dijalankan. Hash dataset dan prompt tetap tercatat dan menjadi acuan run 2 dan run 3

**Hasil evaluasi run 2 (17 November 2026, 07.13 sampai 07.23 WITA, commit `60ee854` bersih, hash dataset dan prompt identik dengan run 1):**

| Metrik | Run 1 | Run 2 |
|---|---|---|
| Akurasi (kegagalan dihitung salah, D161) | 34/49, 69,39 persen | 38/49, **77,55 persen** |
| Salah klasifikasi | 1 | 5 |
| Gagal merespons | 14 (9 timeout, 5 HTTP 503) | 6 (semuanya timeout) |
| Berhasil setelah retry (D165) | 6 | 1 |
| Akurasi atas skenario yang dijawab | 34/35, 97,1 persen | 38/43, 88,4 persen |
| Tingkat respons berhasil | 35/49, 71,4 persen | 43/49, 87,8 persen |
| Per jenis (benar/n) | `cari_jasa` 25/30, `perlu_klarifikasi` 2/6, `jasa_tidak_tersedia` 3/4, `sapaan` 3/4, `di_luar_cakupan` 1/5 | `cari_jasa` 26/30, `perlu_klarifikasi` 2/6, `jasa_tidak_tersedia` 2/4, `sapaan` 4/4, `di_luar_cakupan` 4/5 |
| Per asal | penyusun 71,05, teman 63,64 persen | penyusun 76,32, teman 81,82 persen |
| Slot `waktu_jenis` / `budget_maks` | 80 / 86,21 persen | 86,67 / 93,1 persen |
| Latensi Gemini rata-rata / p50 / p95 | 3.589 / 3.257 / 7.224 ms | 3.739 / 3.902 / 6.788 ms |

- Lima salah klasifikasi run 2: S21 ("listrik turun ... kenapa ya?") dan S26 ("aki motor tekor") dibaca bukan `cari_jasa`, K02 ("nemenin aku bermain") dibaca `di_luar_cakupan` alih-alih `jasa_tidak_tersedia`, serta K03 dan K06 (permintaan perbaikan yang ambigu) dibaca `jasa_tidak_tersedia` atau `di_luar_cakupan` alih-alih `perlu_klarifikasi`. Kesalahannya berkumpul di batas antar jenis non-pencarian, bukan di pemilihan sub-kategori
- **Jawaban berbeda antar run untuk input yang sama.** S26 dan K02 benar di run 1 tetapi salah di run 2 (K03 dan K06 gagal merespons di run 1, sedangkan S21 salah di kedua run). Adapter tidak mengirim `temperature` (catatan kode: diabaikan model 3.6 ke atas), sehingga model memakai nilai bawaannya dan keluarannya tidak deterministik. Karena protokol D176 mewajibkan konfigurasi yang sama di ketiga run, ini tidak diubah selama evaluasi. Variasi antar run justru menjadi alasan protokol tiga run, dan dilaporkan di Bab IV
- Semua kegagalan run 2 adalah timeout 8 detik (D156), dengan p95 latensi yang berhasil 6,8 detik. Ketersediaan layanan pagi hari lebih baik daripada malam hari (tidak ada 503 yang tersisa setelah retry)

**Hasil evaluasi run 3 (17 November 2026, 13.26 sampai 13.37 WITA, commit `a8b2f45` bersih, hash dataset dan prompt identik):** 37/49, **75,51 persen**. Satu salah klasifikasi (S21, sama dengan run 1 dan run 2) dan 11 gagal merespons, semuanya timeout. Dua skenario berhasil setelah retry. Latensi Gemini rata-rata 4.454 ms, p50 4.914 ms, p95 7.788 ms, paling lambat di antara ketiga run dan mendekati timeout 8 detik.

**Rekap evaluasi akurasi tiga run (D176):**

| Metrik | Run 1 (23.00 WITA) | Run 2 (07.13 WITA) | Run 3 (13.26 WITA) | Gabungan |
|---|---|---|---|---|
| **Akurasi utama, kegagalan dihitung salah (D85, D161)** | 69,39% | 77,55% | 75,51% | **74,15%** (rata-rata; 109/147) |
| Akurasi atas skenario yang dijawab (kualitas ekstraksi) | 97,1% (34/35) | 88,4% (38/43) | 97,4% (37/38) | **94,0%** (109/116) |
| Tingkat respons berhasil (ketersediaan layanan) | 71,4% | 87,8% | 77,6% | **78,9%** (116/147) |
| Salah klasifikasi | 1 | 5 | 1 | 7 |
| Gagal merespons | 14 (9 timeout, 5 HTTP 503) | 6 timeout | 11 timeout | 31 (26 timeout, 5 HTTP 503) |
| Berhasil setelah retry (D165) | 6 | 1 | 2 | 9 |
| Latensi Gemini p95 | 7.224 ms | 6.788 ms | 7.788 ms | |

| Jenis (gabungan tiga run, benar/n) | Hasil |
|---|---|
| `cari_jasa` | 77/90 (85,6%) |
| `perlu_klarifikasi` | 7/18 (38,9%) |
| `jasa_tidak_tersedia` | 8/12 (66,7%) |
| `sapaan` | 9/12 (75,0%) |
| `di_luar_cakupan` | 8/15 (53,3%) |
| Slot `waktu_jenis` / `budget_maks` | 76/90 (84,4%) / 78/87 (89,7%) |

**Kesimpulan terhadap D85:** target akurasi intent extraction 80 persen **tidak tercapai** menurut definisi yang ditetapkan sebelum pengujian (rata-rata 74,15 persen dengan kegagalan dihitung salah). Dari 38 skenario yang tidak benar di ketiga run, **31 (81,6 persen) adalah kegagalan Gemini merespons** (timeout 8 detik dan 503), dan hanya 7 yang salah klasifikasi. Pada skenario yang dijawab, Gemini mengklasifikasikan dengan benar 94,0 persen. Artinya kemampuan model memahami pesan berbahasa Indonesia sudah melampaui target, sedangkan yang menahan angka utama adalah ketersediaan dan latensi layanan model preview pada free tier, yang bervariasi menurut jam. Kesalahan klasifikasi berkumpul di batas antar jenis non-pencarian, terutama `perlu_klarifikasi`, bukan pada pemilihan sub-kategori. S21 salah di ketiga run dan menjadi kasus batas yang konsisten. Hasil ini dilaporkan apa adanya di Bab IV. Saran pengembangan: tier berbayar atau model yang sudah stabil, peninjauan ulang timeout D156 terhadap latensi p95 yang terukur, dan pengaturan `temperature` supaya keluaran deterministik

---

## 4AC. Keputusan Versi 2.36 (D177 sampai D181)

Diputuskan sebelum Fase 10 (pelengkap). Satu kolom baru (`notifications.email_attempts`) dan satu parameter sistem baru (`review_window_days`), keduanya dibuat di sesi yang mengimplementasikannya.

| # | Keputusan | Alasan |
|---|---|---|
| D177 | **Retry email (H37) lewat kolom `email_attempts` dan render ulang.** Cron mengirim ulang baris email FAILED sampai `email_retry_max_attempts`. Isi email tidak disimpan, melainkan dirender ulang dari `reference_type` dan `reference_id` saat retry. Email yang memuat token (verifikasi email, reset password, ganti email) tidak di-retry cron, karena pengguna cukup meminta kirim ulang | Menyimpan isi email lengkap berarti menyimpan token mentah, padahal token selalu disimpan sebagai hash (D63). Token yang dikirim ulang oleh cron juga bisa sudah kedaluwarsa. Render ulang menjaga isi email selalu sesuai data terbaru. Menutup catatan skema di Bagian 4L **Direvisi D184:** isi email retry disusun ulang dari `title` dan `body` yang tersimpan, bukan dari referensi |
| D178 | **Notifikasi in-app selektif.** Notifikasi dibuat hanya untuk event yang membutuhkan perhatian pihak tertentu, bukan untuk setiap transisi. Daftar event ditetapkan di sesi 10a dan ditulis di dokumen. Barisnya ditulis di dalam transaksi yang memicunya, mengikuti pola D58. Untuk pesan dalam order, notifikasi ke sisi lawan hanya dibuat kalau belum ada notifikasi pesan yang belum dibaca untuk order itu | Notifikasi untuk setiap transisi menenggelamkan yang penting, sehingga pengguna berhenti membacanya. Penulisan di dalam transaksi menjamin notifikasi tidak pernah ada tanpa event-nya dan sebaliknya. Aturan anti-spam pesan mencegah 20 pesan menghasilkan 20 notifikasi |
| D179 | **Aturan review.** Client bisa memberi review setelah order mencapai COMPLETED (T16 membuka form review), termasuk order yang kemudian disengketakan, dalam `review_window_days` (14 hari) sejak `completed_at`. Satu review per order dan tidak bisa diedit. Penyedia bisa membalas sekali. `rating_average` dan `rating_count` listing dan penyedia diperbarui di transaksi yang sama dengan review. Admin bisa menyembunyikan review lewat `is_visible`, dan review yang disembunyikan keluar dari hitungan rating | Pengalaman buruk yang berujung sengketa justru informasi paling berguna bagi calon client. Review yang tidak bisa diedit dan dibatasi satu per order mencegah manipulasi rating. Batas waktu menjaga review tetap mencerminkan pengalaman yang masih segar. Cache diperbarui di transaksi yang sama supaya angka di pencarian selalu cocok dengan baris review |
| D180 | **Laporan admin dihitung per hari kalender WITA** dan diambil dari sumber yang sama dengan V4 dan ledger. Test membuktikan total laporan identik dengan V4 dan ledger untuk data yang sama | Kriteria selesai Fase 10 adalah laporan cocok dengan data transaksi. Sumber yang sama dan pembuktian lewat test menjadikan kecocokan itu bukti, bukan asumsi. Zona WITA sama dengan D154 |
| D181 | **`PATCH /admin/settings` hanya menerima kunci terdaftar**, dengan validasi tipe dan rentang per kunci, misalnya radius 10 sampai 1.000 meter dan komisi 0 sampai 30 persen. Setiap perubahan mencatat `updated_by`, dan cache parameter langsung diinvalidasi | Parameter penelitian memang dirancang bisa diubah tanpa deploy, tetapi nilai di luar akal sehat bisa merusak alur uang dan validasi kedatangan. Jejak `updated_by` menjawab pertanyaan siapa yang mengubah parameter saat eksperimen **Dirinci D198 dan D199:** parameter tidak di-cache, sehingga perubahan langsung berlaku tanpa invalidasi |

**Pembagian Fase 10 dalam tiga sesi:**

- **10a. Notifikasi.** Layanan notifikasi in-app terpusat, daftar event (D178), `GET /notifications` serta tandai dibaca satu dan semua, kolom `email_attempts`, dan cron retry email (D177, H37)
- **10b. Pesan dan review.** Pesan dalam order dengan masa aktif, peserta, dan rate limit (H70 sampai H72), realtime lewat room `order:<id>`, `read_at`, dan notifikasi ke sisi lawan. Review: buat, daftar per listing, balasan penyedia, sembunyikan oleh admin, dan cache rating (D179)
- **10c. Admin dan penutupan.** `GET` dan `PATCH /admin/settings` (D181), empat laporan admin (D180), Postman, regresi, dan penutupan Fase 10

**Batasan selama run 2 dan run 3 evaluasi akurasi (D176) belum selesai:** Fase 10 tidak boleh mengubah berkas yang membentuk prompt Gemini (`llm-prompt.ts`, `llm-intent.ts`, perilaku `llm-gateway.ts`), dataset evaluasi, maupun daftar sub-kategori aktif di Supabase dev.

---

## 4AD. Keputusan Versi 2.37 (D182 sampai D186)

Dari sesi 10a. Semua dijawab penyusun sebelum rencana disusun, kecuali tambahan pada D185 yang berasal dari review rencana. Satu migrasi (`20261116180000_notifications_10a`): kolom `notifications.email_attempts`, nilai enum `ORDER_MESSAGE`, dan CHECK `chk_notification_email_attempts`.

| # | Keputusan | Alasan |
|---|---|---|
| D182 | **Tabel event notifikasi (D178)** ditulis lengkap di PRD Bagian 7.3. Setiap event non-akun yang sudah punya email kini juga punya kembaran IN_APP, kecuali T12 (pekerjaan dimulai) yang tetap email saja. Pekerja pendamping baru mendapat notifikasi in-app saat ditambahkan lewat accept dengan kru atau `PUT /orders/:id/crew`, hanya untuk yang belum ada di kru sebelumnya. Sengketa dibuka kini juga memberi tahu pihak lawan, menutup selisih dengan peta D58. Empat email akun tetap email saja | Saat T12, client sedang bersama pekerja di lokasi dan perubahan status sudah sampai realtime, sehingga notifikasi in-app tidak menambah informasi. Pendamping sebelumnya tidak diberi tahu sama sekali, padahal dialah yang harus datang. Notifikasi antrean untuk admin dan lamaran yang gugur tidak dibuat (H115) |
| D183 | **`GET /notifications` dan kedua endpoint tandai-dibaca hanya menyentuh baris IN_APP milik pemanggil.** Notifikasi milik orang lain dan baris EMAIL dibalas 404 `NOT_FOUND` yang sama. `unread_count` di meta selalu menghitung seluruh IN_APP yang belum dibaca, tidak terpengaruh filter. Tandai dibaca bersifat idempoten | Baris EMAIL adalah catatan pengiriman, bukan isi kotak notifikasi. Kalau ikut tampil, setiap event muncul dua kali dan email reset password ikut masuk daftar. 404 yang sama untuk milik orang lain mencegah penebakan id, mengikuti pola D162 |
| D184 | **Retry hanya untuk `reference_type` yang terdaftar** (order, withdrawal, provider_profile, provider_worker, taxonomy_request), dan isinya disusun ulang secara generik dari `title` dan `body` yang tersimpan, ditambah baris referensi, ke `users.email` terkini. Referensi yang sudah hilang langsung ditandai FAILED tanpa dikirim. **Merevisi rumusan D177** | Daftar yang diizinkan lebih aman daripada daftar yang dikecualikan: jenis email bertoken baru di masa depan tidak akan ikut di-retry tanpa sengaja, dan email bertoken (`verification_token`) maupun pemberitahuan ganti email (`reference_type` NULL) tidak pernah lolos. `title` dan `body` sudah bebas token dan mencatat isi saat event terjadi, sedangkan template per jenis harus menebak varian email dari kondisi terkini yang mungkin sudah berubah. Akibatnya email retry untuk KYC, lamaran, dan taksonomi lebih ringkas daripada email pertamanya |
| D185 | **`email_attempts` hanya menghitung retry**, maksimal `email_retry_max_attempts` (3) setelah pengiriman pertama, dan nilai 0 mematikan retry. Cron berjalan tiap 5 menit dan mengklaim setiap baris lewat UPDATE bersyarat. Baris PENDING dengan `email_attempts` 0 yang berumur lebih dari 15 menit ikut diambil | Sesuai D58 ("maksimal tiga kali") dan pola `retry_count` pada `webhook_events`. Klaim bersyarat membuat dua instance cron tidak bisa mengirim email yang sama dua kali, dibuktikan test paralel. Baris PENDING lama adalah email yang tidak pernah terkirim karena proses mati setelah commit dan sebelum pengiriman, dan pengiriman normal selesai jauh di bawah 15 menit |
| D186 | **Nilai enum `notification_type` `ORDER_MESSAGE`** untuk notifikasi pesan dalam order, dipakai pemeriksa anti-spam D178 di sesi 10b | Jenis notifikasinya jelas dan bisa difilter klien, sedangkan `reference_type` tetap jujur menunjuk ke order |

**Catatan implementasi sesi 10a tanpa nomor D:**

- Satu fungsi terpusat `recordNotification` menulis baris IN_APP dan, kalau event-nya juga dikirim email, baris EMAIL lewat jalur D58 yang sama, keduanya di dalam transaksi pemicu. `dispatchNotifications` setelah commit mengirim email dan event Socket.IO `notification:new` ke room `user:<id>`
- Fungsi `hasUnreadMessageNotification` disiapkan untuk aturan anti-spam pesan di sesi 10b
- Runner newman sesi ini memakai SMTP palsu. Run newman sebelum sesi 10a kemungkinan memakai SMTP dari `.env`, sehingga ada email yang terkirim ke alamat uji `@postman.jasana.test` yang tidak ada

**Hasil sesi 10a:** typecheck bersih, 909 test di 48 berkas lulus, 13 dari 13 mutan tertangkap. Postman Fase 1 sampai 10 tanpa gagal, Fase 10 dengan 17 request dan 30 assertion. Migrasi diuji ke basis data kosong dan ke `jasana_test` tanpa drift, `db:verify` dan `check-constraints` lulus.

**Hasil uji sandbox 10a (17 November 2026, dijalankan penyusun di Supabase dev dengan SMTP Ethereal sungguhan):**

| Langkah | Hasil |
|---|---|
| Migrasi `20261116180000_notifications_10a` | Diterapkan, `db:verify` lulus |
| Order Scheduled `ORD-20261116-EB9FD5ED` dibuat saat kredensial SMTP sengaja salah | Order tetap terbuat. Pemilik mendapat baris IN_APP "Order baru masuk", dan baris EMAIL tercatat FAILED dengan galat `535 Authentication failed` dan `email_attempts` 0 (D58) |
| `GET /notifications` sebagai pemilik | Hanya baris IN_APP yang tampil, `unread_count` 1, lalu 0 setelah ditandai dibaca (D183) |
| Kredensial diperbaiki, retry dipicu | Baris EMAIL menjadi SENT dengan `email_attempts` 1. Email diterima Ethereal dengan subjek "Jasana: Order baru masuk (ORD-20261116-EB9FD5ED)", sapaan, isi notifikasi, dan baris "Nomor order" (D184) |
| Order dibatalkan client | Pemilik mendapat IN_APP dan EMAIL "Order dibatalkan", email langsung SENT dengan `email_attempts` 0 |

**Temuan sandbox 10a, diperbaiki di sesi 10b lewat D193 sampai D196:**

1. **Retry tanpa batas umur.** Supabase dev menyimpan tumpukan email FAILED dari uji Fase 7 dan Fase 8. Cron mengirim semuanya, termasuk email sejak 31 Oktober 2026. Email seperti "Pembayaran berhasil" yang datang dua minggu terlambat menyesatkan pengguna
2. **Jatah retry habis terlalu cepat.** Selama kredensial SMTP salah sekitar 15 menit, cron tiap 5 menit menghabiskan jatah 3 retry pada 50 email lama. Gangguan SMTP yang sedikit lebih lama membuat email gagal permanen. Jeda retry perlu makin panjang
3. **Waktu di isi notifikasi ditulis sebagai ISO UTC mentah**, misalnya batas respons `2026-11-17T16:24:03.779Z` yang sebenarnya 18 November pukul 00.24 WITA. Berasal dari template sejak Fase 6, berlaku untuk email maupun notifikasi in-app
4. **Tanggal di nomor order memakai UTC.** Order yang dibuat 17 November pukul 00.24 WITA bernomor `ORD-20261116-...`, sedangkan hari bisnis memakai WITA (D154, D180)

---

## 4AE. Keputusan Versi 2.38 (D187 sampai D197)

Dari sesi 10b. D187 sampai D192 dijawab penyusun sebelum rencana disusun, D193 sampai D196 dari temuan uji sandbox 10a, dan D197 dari pemeriksaan urutan kunci yang diminta saat review rencana. Tanpa migrasi, tiga parameter baru memakai nilai bawaan di kode.

| # | Keputusan | Alasan |
|---|---|---|
| D187 | **Masa aktif pesan dalam order per status.** Kirim pesan dibuka sejak ACCEPTED sampai AWAITING_VERIFICATION, dan saat COMPLETED selama `settlement_due_at` belum lewat. **DISPUTED read-only apa pun status asalnya** (T15 maupun T19). PENDING_ACCEPTANCE, SETTLED, REFUNDED, CANCELLED, REJECTED, EXPIRED, dan PAYMENT_EXPIRED dibalas 409 `MESSAGE_WINDOW_CLOSED`. Membaca dan menandai dibaca selalu boleh. Pengiriman mengunci baris order lebih dulu. **Merevisi rumusan D79** yang memakai `settlement_due_at` saja | Begitu sengketa dibuka, seluruh percakapan menjadi bukti yang dibaca admin. Kalau masih bisa ditambah, bukti berubah setelah pemeriksaan dimulai dan masing-masing pihak bisa menyusun percakapan untuk menguatkan posisinya. Bukti tambahan tetap punya jalur resmi lewat `dispute_evidences`. Rumusan D79 literal membuat sengketa dari T15 tetap terbuka sedangkan dari T19 tertutup, padahal keduanya sengketa yang sama |
| D188 | **Notifikasi pesan baru, review baru, dan balasan review in-app saja.** Isi pesan tidak masuk body notifikasi. `PATCH /orders/:id/messages/read` ikut menandai notifikasi `ORDER_MESSAGE` milik pemanggil untuk order itu | Pesan sudah sampai realtime lewat `order:message`, dan review tidak mendesak, sehingga email hanya menyesakkan kotak masuk. Tanpa ikut menandai notifikasi, aturan anti-spam D178 akan menahan notifikasi pesan berikutnya selamanya |
| D189 | **Endpoint admin review:** `GET /admin/reviews` (filter `is_visible` dan `listing_id`, terpaginasi) dan `PATCH /admin/reviews/:id/visibility` yang idempoten, dengan cache rating dihitung ulang di transaksi yang sama | Tanpa daftar yang memuat review tersembunyi, review yang sudah disembunyikan tidak bisa ditemukan lagi untuk ditampilkan kembali |
| D190 | **Revisi V11:** pengirim pekerja sah kalau ia penanggung jawab saat ini atau pernah tercatat sebagai `from_worker_id` di riwayat `ASSIGNMENT_CHANGED` order itu | Penanggung jawab yang mengirim pesan lalu diganti (D44) sah saat mengirim. Tanpa revisi, V11 menghasilkan pelanggaran palsu. Melonggarkan ke semua pekerja usaha itu terlalu longgar |
| D191 | **Komentar review dan balasan penyedia 1 sampai 1.000 karakter** (konstanta, bukan parameter). **Nama reviewer di halaman publik disamarkan** menjadi kata pertama ditambah inisial, misalnya "Komang K." | Cukup untuk keluhan yang rinci tanpa membebani halaman listing. Pembaca tetap tahu ulasan berasal dari orang sungguhan tanpa nama lengkap client terpajang, sejalan dengan H67 |
| D192 | **Detail listing memuat 3 review tampil terbaru**, memakai bentuk yang sama dengan daftar review | Memenuhi isi PRD bahwa detail listing menampilkan review. Daftar lengkap tetap lewat `/listings/:id/reviews` |
| D193 | **Retry email hanya untuk baris berumur paling lama 24 jam** (`EMAIL_RETRY_MAX_AGE_HOURS`), baik FAILED maupun PENDING yatim. Baris yang lebih tua dibiarkan FAILED | Uji sandbox 10a: cron mengirim email FAILED sejak 31 Oktober. Email yang datang berhari-hari terlambat menyesatkan pengguna |
| D194 | **Backoff retry kumulatif 5, 30, dan 120 menit dari `created_at`** (`EMAIL_RETRY_BACKOFF_MINUTES`), tanpa kolom baru. Retry di luar panjang larik memakai nilai terakhir | Uji sandbox 10a: gangguan SMTP sekitar 15 menit menghabiskan seluruh jatah 3 retry. Dengan backoff, email bertahan melewati gangguan sampai sekitar 2 jam |
| D195 | **Waktu di notifikasi, email, dan pesan galat yang dibaca pengguna ditulis dalam WITA yang mudah dibaca** lewat `formatWita` ("18 Nov 2026 pukul 00.24 WITA"), dengan nama bulan Indonesia tanpa bergantung pada ICU. Dipakai di empat template notifikasi dan dua pesan galat `VERIFICATION_LOCKED` | Uji sandbox 10a: batas respons ditulis `2026-11-17T16:24:03.779Z`, yang dibaca penyedia sebagai jam 16.24 padahal batas sebenarnya 18 November pukul 00.24 WITA. Salah baca seperti ini membuat order kedaluwarsa |
| D196 | **Tanggal di `order_number` mengikuti hari kalender WITA** (D154). Order lama tidak diubah | Uji sandbox 10a: order yang dibuat 17 November pukul 00.24 WITA bernomor `ORD-20261116-...`. Nomor order dicocokkan admin dengan laporan harian yang memakai WITA (D180) |
| D197 | **Urutan kunci seragam `provider_profiles` lalu `listings` di semua jalur.** T16 ditukar dua barisnya (`completed_orders_count` sebelum `order_count`). Kunci cache rating memakai `FOR NO KEY UPDATE` | Pemeriksaan kode menemukan `updateListing` dan `setOptionPrices` sudah mengunci penyedia lebih dulu, sedangkan T16 sebaliknya, sehingga edit listing dan penyelesaian order pada listing yang sama bisa deadlock sejak sebelum Fase 10. `FOR NO KEY UPDATE` setara dengan kunci UPDATE biasa: penulis cache tetap bergiliran, tetapi insert yang hanya mereferensikan baris itu lewat FK (order, review, pemetaan pekerja) tidak tertahan |

**Catatan implementasi sesi 10b tanpa nomor D:**

- Pesan dalam order di modul `orders` (`order-messages.*`), review di modul baru `reviews`. Peserta diperiksa lewat `resolveOrderAccess`, dan admin hanya boleh membaca pesan
- Review kedua ditolak lewat unique index `reviews.order_id` (409 `REVIEW_ALREADY_EXISTS`), balasan kedua lewat UPDATE bersyarat `provider_reply IS NULL` (409 `REVIEW_ALREADY_REPLIED`). Kode galat baru: `NOT_ORDER_PARTICIPANT`, `REVIEW_NOT_ALLOWED`, `REVIEW_WINDOW_CLOSED`, `REVIEW_ALREADY_EXISTS`, `REVIEW_ALREADY_REPLIED`
- Parameter baru dengan nilai bawaan di kode: `order_message_max_length` (2000), `order_message_rate_per_minute` (20), `review_window_days` (14). Batas atas `order_message_max_length` terhadap CHECK basis data ditangani validasi D181 di sesi 10c
- Room `order:<id>` sejak Fase 6 hanya menerima client, pemilik VERIFIED, dan penanggung jawab ACTIVE. Pendamping dan pekerja lain ditolak saat bergabung, dibuktikan test realtime
- Belum teruji deterministik: kunci order pada pengiriman pesan terhadap pembukaan sengketa, dan urutan kunci D197 (dibuktikan lewat pembacaan kode)
- Regresi newman membaca kredensial Storage dari `.env`, sehingga unggahan e-KYC dan bukti sengketa di Fase 2 dan 8 masuk ke bucket Supabase dev, sama seperti sesi sebelumnya

**Hasil sesi 10b:** typecheck bersih, 953 test di 51 berkas lulus, 42 dari 42 mutan tertangkap termasuk test paralel cache rating. Postman Fase 1 sampai 10 tanpa gagal, Fase 10 dengan 68 request dan 123 assertion. `db:verify` di `jasana_test` lulus dengan V11 nol baris.

**Hasil uji sandbox 10b (17 November 2026, dijalankan penyusun di Supabase dev, gateway pembayaran fake, SMTP Ethereal):**

| Uji | Hasil |
|---|---|
| Nomor order (D196) | Order dibuat 17 November pukul 02.2x WITA (16 November UTC) bernomor `ORD-20261117-3A32B12E` |
| Dua pesan dari client pada order ACCEPTED | Pemilik dan penanggung jawab masing-masing mendapat **satu** notifikasi `ORDER_MESSAGE`, tanpa email (D188) |
| Pekerja lain di usaha yang sama mengirim pesan | 403 `NOT_ORDER_PARTICIPANT` |
| Pemilik menandai dibaca | 2 pesan sisi lawan mendapat `read_at`, notifikasi pesan pemilik ikut terbaca, lalu pesan berikutnya memunculkan notifikasi baru (anti-spam D178). Penanggung jawab yang belum membaca tidak mendapat notifikasi kedua |
| Kirim pesan pada order SETTLED | 409 `MESSAGE_WINDOW_CLOSED`, riwayat tetap bisa dibaca (D187) |
| Review pada order SETTLED yang selesai 14 November | Rating listing dari 0/0 menjadi 4/1, nama reviewer tampil "Sari P." (D191), dan detail listing memuat review (D192). Review kedua 409 `REVIEW_ALREADY_EXISTS`. Pemilik mendapat notifikasi "Ulasan baru" |
| Balasan penyedia | Berhasil, balasan kedua 409 `REVIEW_ALREADY_REPLIED`, client mendapat notifikasi "Balasan ulasan" |
| Admin menyembunyikan lalu menampilkan review | Rating kembali ke 0/0, lalu ke 4/1 (D189) |
| `db:verify` di Supabase dev | Kueri integritas lulus, V11 nol baris |

- Skrip uji sempat terkena batas percobaan login per IP karena login ulang di setiap perintah, membuktikan rate limiter login bekerja. Skrip diperbaiki dengan menyimpan token selama masa berlakunya

---

## 4AF. Keputusan Versi 2.39 (D198 sampai D203) dan Penutupan Fase 10

Dari sesi 10c. Semua dijawab penyusun sebelum rencana disusun, kecuali advisory lock pada D199 dan V4 per bulan WITA pada D200 yang berasal dari review rencana. Tanpa migrasi.

| # | Keputusan | Alasan |
|---|---|---|
| D198 | **Registri parameter tunggal** (`SETTING_REGISTRY`) berisi 25 kunci beserta nilai bawaan, rentang, dan deskripsi. Tabel rentangnya di PRD 3.5, antara lain komisi 0 sampai 30 persen (0 sah), radius 10 sampai 1.000 meter, `order_message_max_length` 100 sampai 2.000 mengikuti CHECK basis data, dan `guest_chat_daily_global_limit` paling banyak 500 mengikuti kuota harian Gemini. Rentang hanya dijaga saat menulis. Empat kunci yang tidak dibaca server (`access_token_ttl_minutes`, `refresh_token_ttl_days`, `worker_location_move_threshold_meters`, `worker_location_max_interval_minutes`) dikecualikan dari GET maupun PATCH | Satu sumber untuk nilai bawaan, rentang, dan deskripsi mencegah ketiganya saling menyimpang. Kunci TTL dibaca dari env, dan dua kunci lokasi pekerja hanya relevan untuk frontend (D66). Admin yang mengubah kunci yang tidak dibaca server lalu melihat tidak ada efeknya akan mengira sistemnya rusak |
| D199 | **`PATCH /admin/settings` menerima banyak kunci sekaligus secara atomik**, diawali `pg_advisory_xact_lock` sehingga dua PATCH bersamaan diserialkan. Relasi antarkunci dinilai terhadap nilai sesudah perubahan (`withdrawal_admin_fee` harus lebih kecil dari `withdrawal_min_amount`). `listing_faq_max_items` yang lebih kecil dari jumlah FAQ aktif terbanyak dibalas 409 `SETTING_CONFLICTS_WITH_DATA` | Pasangan kunci yang saling bergantung bisa diubah sekaligus tanpa harus melewati kondisi antara yang tidak sah. Advisory lock mencegah dua admin yang masing-masing mengubah satu kunci secara sah menghasilkan pasangan yang melanggar relasi, dibuktikan test paralel |
| D200 | **Periode laporan per hari kalender WITA kejadiannya sendiri**, `from` dan `to` wajib dan inklusif, paling panjang 366 hari. Laporan penyedia dan pekerja terpaginasi (bawaan 20, maksimal 100). **V4 dikelompokkan per bulan WITA**, `DATE_TRUNC('month', settled_at AT TIME ZONE 'Asia/Makassar')` | Setiap angka dihitung pada hari terjadinya, sehingga laporan pendapatan identik dengan V4 dan laporan pekerja identik dengan V2. V4 per bulan UTC menempatkan order yang settled pada malam terakhir bulan di bulan berikutnya, padahal seluruh aturan hari memakai WITA (D154, D180, D196) |
| D201 | **Definisi kolom keempat laporan** di PRD 4.4. SLA miss penyedia adalah order EXPIRED karena deadline pada mode Scheduled, atau pada Available Now yang punya `order_offers.sla_missed_at`. Order Available Now yang ditolak semua pekerja (ALL_DECLINED) bukan SLA miss. Persen SLA miss penyedia dihitung terhadap order yang direspons atau seharusnya direspons di periode itu, sehingga tidak pernah lebih dari 100. Laporan pendapatan memenuhi identitas nilai transaksi = pendapatan bersih + dana dilepas ke penyedia + dikembalikan ke client | ALL_DECLINED berarti pekerja menolak secara aktif, bukan diam, jadi bukan kegagalan merespons. Identitas tiga suku menurunkan rumus D133 dan membuktikan tidak ada rupiah yang hilang di laporan |
| D202 | **Pengecualian SQL mentah untuk laporan:** hanya SELECT lewat `$queryRaw` dengan `Prisma.sql` dan seluruh nilai terikat, ditambah `$executeRaw` untuk advisory lock D199. Tanpa `Prisma.raw` maupun `$queryRawUnsafe`, dan disertai test injeksi | Laporan butuh pengelompokan per hari WITA dan `generate_series` untuk hari kosong, yang tidak bisa dinyatakan lewat Prisma `groupBy`. Logikanya sama dengan V4 dan V2 yang juga SQL mentah, sehingga kecocokannya mudah dibuktikan. Mengikuti preseden pencarian Fase 5 |
| D203 | **Waktu kejadian EXPIRED, PAYMENT_EXPIRED, dan REFUNDED diambil dari `order_status_histories`** baris dengan `to_status` yang bersangkutan, tanpa kolom baru | Tabel riwayat adalah audit trail yang selalu ditulis `transitionOrder` di transaksi yang sama, sehingga waktunya akurat. `updated_at` bergeser setiap ada perubahan lain pada baris order |

**Catatan implementasi sesi 10c tanpa nomor D:**

- **Parameter tidak di-cache.** Setiap pembacaan mengambil satu baris lewat primary key, sehingga perubahan lewat PATCH langsung berlaku di permintaan berikutnya, dibuktikan test. Ini cara memenuhi syarat "cache langsung diinvalidasi" pada D181
- Laporan penyedia dan pekerja menaruh `period`, `rows`, dan `totals` di `data`, seragam dengan laporan transaksi dan pendapatan. Kolom rating diberi nama `rating_average_saat_ini` karena berasal dari cache, bukan per periode
- Salinan V4 lama di komentar migrasi September 2026 tidak diubah, karena mengubahnya mengubah checksum migrasi yang sudah diterapkan
- Skrip bantu kini tersimpan di repo, di `scripts/dev/`: runner newman per fase, `regresi.ps1` untuk Fase 1 sampai 10, builder Postman, dan skrip mutasi

**Hasil sesi 10c:** typecheck bersih, 1.004 test di 53 berkas lulus, 38 dari 38 mutan tertangkap. Postman Fase 1 sampai 10 tanpa gagal, Fase 10 dengan 97 request dan 179 assertion. `db:verify` di `jasana_test` lulus.

**Penutupan Fase 10 (17 November 2026):**

| Kriteria PRD Bagian 9 | Bukti | Status |
|---|---|---|
| Laporan cocok dengan data transaksi | Total laporan pendapatan identik dengan V4, termasuk per bulan WITA dengan order yang settled pukul 23.59 WITA tanggal terakhir dan 00.00 WITA tanggal 1. Cocok dengan ledger (`ESCROW_RELEASE`, refund) dan identitas tiga suku. Laporan transaksi cocok dengan payments dan `ESCROW_HOLD`, laporan pekerja cocok dengan V2 (`admin-reports.test.ts`) | Lulus |
| Pesan hanya bisa dikirim peserta order | `order-messages.test.ts`, test realtime, Postman folder 02, V11 nol baris di `jasana_test` dan Supabase dev (uji sandbox 10b) | Lulus |
| Review | `reviews.test.ts` termasuk test paralel cache rating, Postman folder 03, uji sandbox 10b | Lulus |
| Notifikasi dan email | Sesi 10a, uji sandbox 10a dengan SMTP sungguhan, perbaikan D193 sampai D196 | Lulus |
| `platform_settings` | `admin-settings.test.ts`, Postman folder 04 | Lulus |

Hitungan akhir Fase 10: 1.004 test (dari 888 sebelum Fase 10), mutan 13 dari 13 (10a), 42 dari 42 (10b), dan 38 dari 38 (10c). H37, H66, H70 sampai H72, dan H111 ditutup sepanjang Fase 9 dan 10.

**Hasil uji sandbox 10c (17 November 2026, dijalankan penyusun di Supabase dev, tanpa migrasi):**

| Uji | Hasil |
|---|---|
| `GET /admin/settings` | 25 kunci, kunci TTL tidak tampil (D198) |
| PATCH ditolak | Fee 60.000 ditolak rentang (maksimal 50.000). Fee 50.000 sendirian ditolak relasi ("harus lebih kecil dari `withdrawal_min_amount` (50000)"). Kunci `access_token_ttl_minutes` ditolak sebagai kunci tak dikenal. Radius 5 ditolak rentang. Client ditolak 403 `FORBIDDEN_ACTOR` |
| PATCH dua kunci sekaligus | Minimum 100.000 dan fee 50.000 diterima bersama, keduanya `DATABASE` dengan `updated_by` Admin Jasana (D199) |
| Perubahan langsung berlaku | `order_message_max_length` diturunkan ke 100 tanpa restart server. Pada order baru yang diterima, pesan 101 karakter ditolak 422 dan pesan 100 karakter terkirim |
| Laporan pendapatan November | Totals identik dengan baris V4 November (2 order, nilai transaksi Rp3.000.000, fee Rp300.000, fee dikembalikan Rp12.346, pendapatan bersih Rp287.654). Identitas tiga suku terpenuhi: 287.654 + 2.588.889 (dana dilepas) + 123.457 (dikembalikan ke client, sama dengan refund PARTIAL sandbox 8d) = 3.000.000 |
| Laporan transaksi 16 sampai 17 November | Tiga order uji masuk ke 17 November, termasuk `ORD-20261116-EB9FD5ED` yang dibuat 16 November pukul 16.24 UTC (00.24 WITA), bukti pengelompokan per hari WITA (D200) |
| Laporan penyedia dan pekerja | Dana dilepas penyedia sama dengan total laporan pendapatan, check-in pekerja (2 dari 2 valid) sama dengan V2 |
| Periode terbalik | 422 "to tidak boleh sebelum from" |
| Pengembalian parameter | Minimum Rp50.000, fee Rp6.500, dan batas pesan 2.000 karakter dipulihkan, `db:verify` lulus |

---

## 4AG. Penutupan Fase 9 (17 November 2026)

| Kriteria PRD Bagian 9 | Bukti | Status |
|---|---|---|
| Intent terekam beserta confidence dan latensi | Setiap giliran mencatat `extracted_intent`, `intent_confidence`, `latency_ms`, `token_usage`, dan model. V3 menampilkan latensi Gemini, latensi total, dan overhead per jenis sesi (per pesan, D171) dan per jenis intent | Lulus |
| Batas tamu terbukti menahan pemakaian berlebih | Tiga lapis (IP, global WITA, per sesi) teruji termasuk paralel di batas sesi dan batas hari (D163, D164), Postman Fase 9 | Lulus |
| Klaim sesi dan personalisasi | Test dan uji sandbox 9c dengan Gemini sungguhan: klaim, token lama 404, klaim ulang 409, rujukan riwayat "kayak kemarin" dipahami (D168 sampai D170) | Lulus |
| Ketahanan terhadap kegagalan Gemini | Kegagalan tercatat sebagai baris ASSISTANT dan dibalas 502 (D161), retry 5xx terbukti di sandbox dan evaluasi (D165, D167) | Lulus |
| Akurasi intent extraction (D85) | Protokol tiga run D176, dataset 49 skenario (H15): 74,15 persen, target 80 persen tidak tercapai, dengan 94,0 persen atas skenario yang dijawab. Penyebab utama dan kesimpulannya di Bagian 4AB | Dilaporkan, target tidak tercapai |

Fase 9 ditutup. Seluruh hasil evaluasi tiga run tersimpan di `apps/api/eval/results/` beserta meta dan hash yang bisa ditelusuri.

---

## 4AH. Keputusan Versi 2.41 (D204 sampai D208): Data Simulasi

Dari sesi data simulasi (H16). Semua dijawab penyusun sebelum dan saat review rencana. Tanpa migrasi. Panduannya di `docs/Data-Simulasi.md`.

| # | Keputusan | Alasan |
|---|---|---|
| D204 | **Data simulasi Bali** lewat `npm run seed:simulasi`. Wilayahnya Denpasar, Badung selatan, dan Gianyar (Ubud). Semua akun simulasi memakai domain `@sim.jasana.test`. Seluruh order yang menyangkut uang dibuat lewat service layer dengan gateway fake, bukan insert langsung. Jalan normal berarti reset lalu bangun ulang secara deterministik (PRNG berseed tetap). Reset menolak jalan kalau ada data akun non-simulasi yang terkait data simulasi. Target lokal (`localhost` dengan nama basis data memuat `test`) langsung jalan, host lain wajib `--confirm-host` yang sama persis, dan `NODE_ENV=production` ditolak. Akun admin UAT (`uat-admin-01` sampai `03@uat.jasana.test`) disiapkan skrip dan tidak pernah dihapus reset, sedangkan responden client, penyedia, dan pekerja mendaftar sendiri | Satu order SETTLED melibatkan payment, ledger, saldo, dan riwayat status. Membuatnya lewat service menjaga V1 tetap nol dan laporan admin tetap cocok. Penanda domain memungkinkan reset tanpa menyentuh data lain. Pengaman data asing mencegah reset menghapus jejak transaksi responden UAT. Pendaftaran dan e-KYC adalah alur yang diuji responden, sedangkan akun ADMIN tidak punya jalur daftar sendiri |
| D205 | **Pengecualian kedua aturan ledger (perluasan D130), hanya untuk wallet milik akun `@sim.jasana.test`:** kolom waktu `wallet_transactions` digeser bersama order-nya saat riwayat disebar ke 60 hari terakhir, dan reset menghapus ledger simulasi. Nominal tidak pernah diubah. Notifikasi milik order yang digeser dihapus, karena teksnya memuat jam saat skrip dijalankan | Tanpa pergeseran waktu, grafik laporan admin hanya berisi satu hari dan batas review 14 hari tidak bisa ditunjukkan. Karena nominal tetap, V1 tetap nol, dan pengecualiannya hanya berlaku di skrip simulasi, tidak pernah di kode aplikasi |
| D206 | **Foto listing simulasi berupa PNG buatan lokal** (gradien per kategori dan pola per sub-kategori, tanpa dependensi baru), dengan folder override `scripts/sim-photos/<sub-kategori>/` yang di-gitignore. Isi folder override hanya gambar tanpa wajah orang, milik sendiri atau berlisensi bebas | Tidak memakai foto orang sungguhan dari internet. Gambar buatan cukup untuk pengerjaan frontend, dan bisa diganti foto yang lebih menarik sebelum UAT tanpa mengubah skrip |
| D207 | **`--bulk N` hanya untuk basis data lokal stress test** (insert massal penyedia dan listing tanpa order dan foto, tetap mematuhi V6 dan V7). Skrip berhenti sebelum koneksi kalau target bukan lokal | Stress test mengukur kinerja API, bukan latensi jaringan ke Supabase (H109, H111). Ribuan listing massal juga akan mengotori data UAT dan kuota free tier |
| D208 | **Listing ACTIVE milik akun uji Postman dan sandbox di Supabase dev dinonaktifkan** lewat `npm run listings:deactivate-test` (dry-run lebih dulu), termasuk dua listing di bawah sub-kategori demo yang sudah nonaktif (temuan 9c). Akunnya dibiarkan | Responden UAT tidak melihat listing uji di pencarian, tetapi akun uji tetap bisa login kalau suatu saat diperlukan |

**Catatan implementasi tanpa nomor D:**

- Isi satu jalan normal: 40 penyedia (26 BUSINESS, 14 INDIVIDUAL), 100 pekerja, 130 listing di seluruh dua belas sub-kategori dengan kepadatan berbeda, 276 foto, 293 order (280 riwayat dan 13 order hidup), 154 review (71 dibalas), 473 baris ledger, dan 5 withdrawal. Akun demo per peran tercatat di panduan
- Order hidup berubah sendiri lewat cron (misalnya ACCEPTED kedaluwarsa sekitar 10 menit), sehingga seed dijalankan ulang sebelum sesi demo frontend, selama UAT belum dimulai. Tabelnya di panduan
- Langkah di dalam satu order riwayat hanya berjarak beberapa detik, kecuali pencairan dana yang sehari setelah selesai, sebagai konsekuensi pergeseran waktu yang sama rata
- `expireUnpaid` di `order-expiry.service.ts` diekspor supaya skrip bisa mengedaluwarsakan satu order tanpa menyapu order lain
- Penyedia simulasi dibuat VERIFIED tanpa dokumen e-KYC, dan endpoint detail penyedia admin tetap berjalan (smoke 200)
- Peringatan di panduan: seed Postman tidak boleh dijalankan ke Supabase dev karena akan mengaktifkan lagi listing uji

**Hasil uji di `jasana_test`:** jalan normal 236 sampai 297 detik, jalan ulang identik kecuali UUID dan nomor order, reset menghapus 142 akun, 293 order, dan 276 berkas foto, pengaman reset berhenti dengan exit 1, `--bulk 2000` menghasilkan 4.173 listing ACTIVE dengan V6 dan V7 lulus, smoke HTTP 21 pemeriksaan lulus, `db:verify` lulus di setiap tahap, 1.012 test lulus, dan mutan 15 dari 15 (skrip simulasi) serta 4 dari 4 (skrip penonaktif) tertangkap.

---

## 4AI. Keputusan Versi 2.42 (D209): Jalan Data Simulasi ke Supabase Dev

Dari jalan seed ke Supabase dev, 18 November 2026. Tanpa migrasi.

| # | Keputusan | Alasan |
|---|---|---|
| D209 | **Supabase dev diisi dengan skala 0,25 dan satu foto per listing** lewat dua flag baru: `--skala <angka di atas 0 sampai 1>` mengalikan jumlah tiap jenis order riwayat (minimal 1 per jenis), dan `--foto-maks <1 sampai 3>` membatasi foto per listing. Penyedia, pekerja, listing, client, dan 13 order hidup tidak ikut dikecilkan. Angka acak jumlah foto tetap diambil dari PRNG supaya urutan acak data lainnya sama dengan jalan penuh. Unggah foto dicoba ulang sampai empat kali dengan nama berkas baru | Satu order riwayat butuh sekitar satu menit ke Supabase di Seoul, sehingga jalan penuh 293 order makan sekitar lima jam dan rawan putus. Dengan skala 0,25 setiap jenis status tetap ada untuk frontend dan UAT. Stress test tidak terpengaruh karena memakai basis data lokal (D207). Jalan penuh tetap bisa dilakukan sebelum UAT (H123) |

**Hasil jalan ke Supabase dev (18 November 2026):**

- Perintah: `npm run seed:simulasi -- --skala 0.25 --foto-maks 1 --confirm-host aws-0-ap-northeast-2.pooler.supabase.com`, selesai dalam 3.427 detik (sekitar 57 menit)
- Tiga percobaan sebelumnya berhenti di tengah: timeout unggah Storage sebelum ada coba ulang, jalan penuh yang dihentikan manual di order ke-51 karena lambat, dan proses yang ikut tertutup bersama editor. Reset di awal jalan berikutnya membersihkan sisanya
- Isi: 142 akun `@sim`, 40 penyedia, 130 listing di dua belas sub-kategori, 130 foto, 86 order (73 riwayat dan 13 order hidup), 38 review (21 dibalas), 133 baris ledger, dan withdrawal COMPLETED 3, REQUESTED 1, REJECTED 1
- Status akhir riwayat: SETTLED 55 (termasuk dispute dirilis dan dibagi), EXPIRED 5, CANCELLED 4, PAYMENT_EXPIRED 3, REJECTED 3, dan REFUNDED 3 (termasuk dispute refund). Kesebelas jenis riwayat terbentuk
- Satu koneksi ke Supabase terputus (`ConnectionReset`) saat menandai notifikasi email terkirim. Errornya ditangkap `deliver`, dan seluruh order tetap terbentuk
- `db:verify` lulus (V1, V5 sampai V8, V11, dan V12 nol baris), dan 10 test `seed-simulasi` lulus

---

## 4AJ. Keputusan Versi 2.43 (D210 sampai D230): Frontend

Disetujui penyusun 18 November 2026. D210 sampai D223 adalah usulan FE1 sampai FE14 di `PRD-Frontend.md` Bagian 3, dicatat dengan nomor ini karena D204 sampai D209 sudah terpakai untuk data simulasi. D224 sampai D230 muncul dari implementasi W0 bagian 1 dan 2 serta W2. Tanpa migrasi dan tanpa perubahan backend.

### Keputusan dasar (usulan FE1 sampai FE14)

| # | Keputusan | Alasan |
|---|---|---|
| D210 | **App Router dengan grup rute per area** (FE1). URL halaman pengguna berbahasa Indonesia: `/cari`, `/listing/[id]`, `/pesanan`, `/usaha`, `/pekerja`, `/admin` | Pengguna dan responden UAT melihat URL. Grup rute memisahkan layout dan penjagaan tiap area tanpa mengubah URL |
| D211 | **Server Component hanya untuk halaman publik** yang datanya sama untuk semua orang (FE2): beranda, detail listing, profil penyedia. Halaman yang butuh login memakai Client Component dan TanStack Query | Access token hanya ada di memori browser (D212), jadi server Next tidak memegangnya. Satu pola per jenis halaman lebih mudah dijaga |
| D212 | **Sesi lewat Route Handler tipis** (FE3). Refresh token di cookie `httpOnly` milik domain Next lewat `/api/session/login`, `/refresh`, `/logout`. Access token hanya di memori. Refresh dibungkus *single-flight* di dalam tab dan `navigator.locks` antar tab. Route Handler meneruskan `X-Forwarded-For` dan `User-Agent` | Rotasi dengan deteksi pemakaian ulang (D76) mencabut seluruh `family_id` kalau dua tab me-refresh dengan token yang sama. Dengan cookie, tab yang menunggu kunci otomatis mengirim token terbaru. Refresh token 30 hari di `localStorage` bisa dibaca lewat XSS. **Syarat:** bentuk respons `/auth/login` dan `/auth/refresh` serta pengaturan `TRUST_PROXY` (D117) dicek di awal W0 bagian 3 |
| D213 | **Tipe respons API ditulis sendiri** di `apps/web/src/types/api` dalam snake_case (FE4). Enum, kode error, dan konstanta state machine diambil dari `packages/shared` sebagai `import type`. Frontend tidak pernah mengimpor `@prisma/client` | Menyempurnakan S11. Tipe Prisma tidak menggambarkan JSON API (camelCase, `Decimal`, `Date`), dan mengimpornya menyeret kode server ke bundle browser |
| D214 | **Satu pintu aksi order: `getOrderActions()`** (FE5), dengan spesifikasi di `Matriks-UI-Order.md`. Tidak ada percabangan status order di JSX | Padanan `transitionOrder()` di sisi tampilan, sehingga tombol yang tampil selalu sesuai state machine |
| D215 | **Seluruh waktu ditampilkan dan diinput dalam WITA** (UTC+08:00) dengan label eksplisit, tidak mengikuti zona perangkat (FE6) | Jadwal jasa terikat lokasi layanan di Bali, bukan lokasi perangkat. Indonesia tanpa waktu musim panas, jadi konversinya offset tetap |
| D216 | **Pratinjau harga di client** memakai rumus D73 dan berlabel "Perkiraan" (FE7). Request tidak pernah memuat nominal, dan angka final selalu dari respons server | Pengguna perlu melihat total berubah saat memilih opsi. Pembayaran baru terjadi setelah penyedia menerima (D19), dan rincian dari server tampil sebelum membayar |
| D217 | **Satu koneksi Socket.IO per tab** setelah login (FE8). Event memicu invalidasi cache TanStack Query, kecuali posisi pekerja dan kartu tawaran yang disimpan sebagai state lokal. Client hanya mengirim `worker:presence` dan `order:location_update` | Menjaga satu sumber data per layar, yaitu respons REST |
| D218 | **Tanpa layanan geocoding** (FE9). Alamat diketik pengguna, titiknya dipilih di peta atau dari GPS | Kebijakan pemakaian Nominatim ketat, dan validasi kehadiran hanya butuh koordinat |
| D219 | **Bahasa Indonesia saja, tanpa library i18n** (FE10). Sapaan "kamu", istilah mengikuti glosarium Design System Bagian 9 | Satu bahasa tidak butuh lapisan terjemahan. Glosarium menjaga konsistensi istilah antararea |
| D220 | **Area ditentukan kapabilitas, bukan role** (FE11). Menu area muncul dari `GET /auth/me`. Pemilik provider INDIVIDUAL melihat area Usaha dan area Pekerja | Konsekuensi D4, D33, dan D35 |
| D221 | **Pola unggah mengikuti D80** (FE12). e-KYC dan bukti komplain multipart ke API, foto listing lewat signed URL lalu wajib memanggil endpoint pencatat. Cek ukuran dan tipe di client hanya untuk kenyamanan | Server tetap memeriksa magic bytes. Cek di client hanya supaya pengguna tidak menunggu unggahan yang pasti ditolak |
| D222 | **Tanpa mode gelap dan tanpa PWA** (FE13) | Tidak menambah nilai pada pertanyaan penelitian, dan menggandakan pengecekan visual |
| D223 | **Pengujian frontend:** Vitest untuk fungsi murni dan `getOrderActions()`, Playwright untuk screenshot dan smoke E2E alur utama (FE14). Pengujian utama tetap Black Box dan UAT (D85) | Uji otomatis difokuskan pada logika yang paling mahal kalau salah: tombol order, format uang, dan waktu |

### Keputusan dari implementasi W0 dan W2

| # | Keputusan | Alasan |
|---|---|---|
| D224 | **Design System v1.5 dan mockup menggantikan mockup Figma** (artefak desain 8). Seluruh warna, radius, dan huruf berasal dari CSS variable di `globals.css` yang dipetakan lewat `@theme` Tailwind v4. Skrip `check-design-tokens.mjs` di `npm run lint` menolak hex, `rgb()`, nilai arbitrer, palet bawaan Tailwind, dan varian `dark:`. Pengecualian per baris hanya lewat komentar `token-check-ignore: <alasan>` | Dokumen token dan mockup yang ditinjau bersama sudah cukup untuk membangun seluruh area secara konsisten. Penjaga token membuat satu perubahan nilai di `globals.css` berlaku ke seluruh aplikasi, dan mencegah warna lepas yang tidak ikut berubah |
| D225 | **Label status `PAID` adalah "Sudah dibayar"**, dan badge mode Terjadwal memakai varian `outline`. Pill berwarna selalu berarti status. Mode Sekarang tetap lime solid | Label "Terjadwal" sebelumnya dipakai bersamaan oleh status `PAID` dan mode `SCHEDULED`, dan keduanya tampil berdampingan di kartu pesanan dengan warna yang sama |
| D226 | **`next/image` hanya menerima pola tetap `*.supabase.co/storage/v1/object/public/**`**, menggantikan variabel `NEXT_PUBLIC_STORAGE_PUBLIC_HOST` di PRD Frontend 9.4 | Pola path publik otomatis menolak signed URL privat (dokumen e-KYC dan bukti komplain), sehingga optimizer Next tidak pernah menyimpan salinannya. Satu variabel lingkungan berkurang |
| D227 | **Pencarian memisahkan filter mode dan ketersediaan saat ini.** Pilihan Terjadwal atau Sekarang mengirim `booking_mode`, sedangkan switch terpisah "Bisa datang sekarang" mengirim `available_now=true`. Seluruh filter tersimpan di URL | "Mendukung mode Sekarang" dan "ada pekerja yang siap sekarang" adalah dua pertanyaan berbeda. Hasil kosong saat tidak ada pekerja online justru menunjukkan filter membaca kondisi nyata (D99) |
| D228 | **Id listing atau penyedia yang tidak dikenal ditampilkan sebagai "tidak ditemukan"**, baik dari 404 `NOT_FOUND` maupun 422 `VALIDATION_ERROR` untuk id bukan UUID. Statusnya 200 dengan `noindex` (soft-404), ditambah halaman 404 global berbahasa Indonesia | Halaman publik memakai streaming, sehingga status sudah terkirim sebelum datanya diketahui tidak ada. Bagi pengguna tampilannya sama, dan mesin pencari tidak mengindeks halamannya |
| D229 | **Ikon kategori dari whitelist statis** `apps/web/src/lib/category-icons.ts` yang memetakan `categories.icon_name` (kebab-case) ke ikon lucide. Nama kosong atau tidak dikenal memakai ikon generik. Form kategori admin (W7) memilih dari whitelist yang sama | Sesuai catatan kolom `icon_name` di skema. Peta statis hanya membawa ikon yang terdaftar ke bundle, dan nilai sembarang dari basis data tidak bisa membuat halaman gagal |
| D230 | **Frontend dikerjakan di branch `feat/frontend` dan hanya menyentuh `apps/web`.** Perubahan backend, `packages/shared`, dan dokumen di `docs/` dikerjakan di `main`, lalu `main` di-merge ke `feat/frontend`. Commit dilakukan penyusun, Claude Code hanya mengusulkan berkas dan pesan commit | Riwayat backend yang sudah selesai tidak tercampur pekerjaan frontend, dan setiap perubahan diperiksa penyusun sebelum masuk riwayat |

**Progres frontend sampai versi ini:**

- W0 bagian 1: scaffold Next.js 16, token Design System, Plus Jakarta Sans, komponen dasar shadcn yang disesuaikan ke token, `ORDER_STATUS_META`, layout publik, galeri `/dev/ui`, dan penjaga token
- W0 bagian 2: `api-client` tanpa autentikasi, TanStack Query, `format` dan `time` WITA beserta test, tipe API untuk listing, katalog, penyedia, dan ulasan, `MoneyText`, dan `ListingCard` dengan data asli
- W2 untuk lingkup demo: beranda, `/cari` (kategori, mode, ketersediaan, urutan, lokasi, paginasi), `/listing/[id]` (spesifikasi dari atribut dinamis, pilihan dan harga, FAQ, ulasan), `/penyedia/[id]`, dan 404 global. Sub-kategori, filter atribut dinamis, radius, dan rentang harga di `/cari` masih terbuka
- Belum pada versi 2.43: sesi login (D212), `proxy.ts`, socket (D217), `getOrderActions()` (D214), serta W1 dan W3 sampai W9. Sesi login dan `proxy.ts` selesai di versi 2.44 (Bagian 4AK)

---

## 4AK. Keputusan Versi 2.44 (D231 sampai D235): Sesi Login Frontend

Dari implementasi W0 bagian 3, 18 November 2026. Menjabarkan D212. Tanpa perubahan backend.

**Hasil pengecekan kontrak sebelum implementasi:** `POST /auth/login` dan `POST /auth/refresh` mengembalikan refresh token di body, sehingga syarat D212 terpenuhi. Login menerima email atau nomor ponsel, persis salah satu. Rotasi D76 tidak punya jeda toleransi: dua refresh dengan token yang sama mencabut seluruh family. `POST /auth/logout` membutuhkan Bearer dan refresh token di body. `GET /auth/me` memuat `provider` dengan status apa pun dan `worker` yang hanya terisi untuk keanggotaan ACTIVE.

| # | Keputusan | Alasan |
|---|---|---|
| D231 | **Dua cookie sesi.** Refresh token di cookie `httpOnly` bernama `SESSION_COOKIE_NAME` dengan `Path=/api/session`, ditambah cookie penanda tanpa rahasia `jasana_sesi=1` dengan `Path=/` yang terbaca `proxy.ts` dan JavaScript. Keduanya `SameSite=Lax`, `Secure` dari env, dan kedaluwarsa bersama refresh token. Keduanya dihapus saat logout, saat API menolak refresh, dan saat penanda ada tanpa cookie refresh. Saat API mati atau membalas 5xx, keduanya dibiarkan | Refresh token 30 hari hanya terkirim ke Route Handler sesi, tidak ke setiap request halaman. Penanda membuat `proxy.ts` bisa mengalihkan tamu, dan tamu tidak perlu memanggil refresh yang pasti gagal. Penanda yang basi tidak berbahaya, karena hanya penyaring kasar (jebakan 4) dan langsung dihapus begitu refresh ditolak |
| D232 | **Route Handler sesi meneruskan hanya entri paling kanan `X-Forwarded-For`**, ditambah `User-Agent` asli browser | Next 16 tidak menimpa `X-Forwarded-For` kiriman browser. Kalau seluruh header diteruskan, pengguna bisa memalsukan IP untuk menghindari rate limit login. `User-Agent` asli dipakai halaman perangkat aktif, dan terbukti muncul di `GET /auth/sessions` |
| D233 | **Ketiga Route Handler sesi menolak `Origin` asing atau kosong** dengan 403 `CORS_ORIGIN_NOT_ALLOWED`, dan hanya menerima `application/json` | Lapisan tambahan di atas `SameSite=Lax`. Biayanya beberapa baris, dan login, refresh, maupun logout tidak bisa dipicu dari situs lain |
| D234 | **Logout wajib mencabut refresh token di server.** Kalau access token tidak ada atau tersisa kurang dari 30 detik, client me-refresh dulu, lalu logout di bawah kunci refresh yang sama. Tab lain diberi tahu lewat `BroadcastChannel` | `/auth/logout` butuh Bearer. Tanpa aturan ini, logout setelah access token kedaluwarsa hanya menghapus cookie di browser, sedangkan refresh token di basis data tetap berlaku 30 hari |
| D235 | **Kapabilitas area dihitung `getCapabilities(me)`** dari `GET /auth/me`: pelanggan selalu, usaha kalau punya profil penyedia dengan status apa pun, pekerja kalau keanggotaan ACTIVE, admin kalau `role = ADMIN`. `getViewer(order, me)` dari Matriks Bagian 7 dibangun di atasnya | Menjabarkan D220. Dua nama untuk dua pertanyaan: area apa yang boleh dibuka akun ini, dan sebagai siapa akun ini melihat satu order |

**Hasil uji:** 86 unit test dan 6 skenario Playwright lulus, termasuk muat ulang dua tab bersamaan tiga putaran, 401 paksa di dua tab, logout setelah access token kedaluwarsa (refresh token lama ditolak API sesudahnya), dan cookie refresh sampah yang membuat kedua cookie terhapus. Uji mutasi 8 dari 8 tertangkap. Mutan tanpa `navigator.locks` membuat uji dua tab gagal karena family dicabut, sehingga kebutuhan D212 terbukti lewat pengujian. Mutan itu meninggalkan tiga log `refresh_token_reuse` milik akun demo client di Supabase dev, dan itu disengaja.

---

## 4AL. Keputusan Versi 2.45 (D236 sampai D240): Aksi Order dan Real-Time Frontend

Dari W0 bagian 4, 19 November 2026. Menutup W0. Tanpa perubahan backend.

**Hasil pencocokan Matriks UI Order dengan backend:** transisi dan aktor di `ALLOWED_TRANSITIONS` cocok dengan Matriks Bagian 2. Perbedaannya: `GET /workers/me/orders` tidak ada (yang berjalan `GET /orders?as=worker`, termasuk tawaran yang masih terbuka), tolak tawaran lewat `POST /orders/:id/decline-offer`, minta kode baru lewat `POST /orders/:id/verification-code`, pendamping mendapat 403 di detail order, dan event room order hanya sampai ke socket yang sudah bergabung ke room.

| # | Keputusan | Alasan |
|---|---|---|
| D236 | **Client mengirim `order:join { order_id }`** untuk masuk room order, lewat `joinOrderRoom(id)` yang mengulanginya setiap kali tersambung ulang. Event ini hanya meminta masuk room dan tidak mengubah state. Aturan 13 di `apps/web/CLAUDE.md` diperbarui | Backend hanya mengirim event room order (`status_changed`, `assignment_changed`, `message`, `location_update`) ke socket yang sudah bergabung. Tanpa event ini, halaman detail pesanan tidak menerima pembaruan seketika (W-O5). Semangat D217 tetap: tidak ada perubahan state lewat socket |
| D237 | **Signature fungsi aksi order:** `getViewer(order, me, opts?: { offered?: boolean })` dan `getOrderActions(order, viewer, now, ctx?: { verification? })`, ditambah field `confirmText` pada setiap aksi. `isOfferRecipient` diturunkan dari visibilitas order, karena server hanya memperlihatkan tawaran kepada penerima yang belum menolak. Batas berangkat sementara memakai konstanta yang sama dengan backend (60 menit) | `OrderDto` belum memuat batas kode verifikasi, komplain, dan ulasan (H131), sehingga data itu masuk lewat `ctx` sampai backend menambahkannya. `confirmText` membuat dialog konfirmasi tidak perlu memeriksa status sendiri, sejalan dengan D214. Diuji dengan 90 test, termasuk loop seluruh status dan penampil untuk memastikan paling banyak satu tombol utama |
| D238 | **Socket tidak disambung ulang paksa saat access token berganti.** Callback `auth` membaca token terbaru saat sambung ulang berikutnya. Setiap kali tersambung ulang, room order di-join ulang, lalu query order, tawaran, pesan, dan notifikasi diinvalidasi | Server hanya memeriksa token saat handshake, sehingga sambung ulang paksa setiap 15 menit hanya membuat jeda tanpa event. Event selama koneksi putus tidak dikirim ulang, jadi tanpa invalidasi, layar bisa tertinggal sampai dimuat ulang. Merevisi PRD Frontend Bagian 8 |
| D239 | **Label enum di luar order ditetapkan di Design System 7.2**, termasuk `CLOSED` pada komplain, tujuh status pencairan, empat status pengembalian dana, dan tiga status email, seluruhnya lewat `EnumBadge`. Tipe enum sementara di `apps/web/src/types/api/enums.ts` | Design System sebelumnya hanya menulis pola nada untuk enum tersebut. `packages/shared` baru memuat enum order (H135) |
| D240 | **Sesi tertunda.** Kalau refresh gagal karena API mati atau 5xx, status menjadi tamu tetapi cookie penanda tetap ada (`isSessionSuspended()`). Area login menampilkan "Layanan sedang tidak tersedia" dengan tombol Coba lagi, bukan mengalihkan ke `/masuk`. Pengalihan hanya terjadi kalau penanda sudah dihapus, artinya refresh ditolak 401. `apiFetch` meneruskan 503 ke pemanggil tanpa menghapus sesi | Menjabarkan D231 di sisi client dan menutup H137. Pengguna tidak ter-logout hanya karena API bermasalah sebentar. Konsekuensinya, kalau API mati lama dan refresh token ternyata sudah tidak berlaku, hal itu baru terdeteksi setelah API menjawab 401. Diuji dengan empat test baru, uji mutasi kode lama, dan pengecekan di browser dengan refresh yang dibuat membalas 503 lalu 401 |

**Hasil uji:** 200 test Vitest lulus (90 aksi order, 20 socket, 4 sesi tertunda), 6 skenario Playwright sesi lulus ulang, uji mutasi 15 dari 15 penjaga tertangkap, dan indikator "Pembaruan otomatis terputus" diuji langsung dengan mematikan lalu menyalakan API. Layout empat area dicek dengan akun demo client, usaha, pekerja, dan admin di 390, 768, dan 1280 px.

**Penutupan W0.** Fondasi frontend selesai: token dan komponen, `api-client` dengan sesi, `src/proxy.ts`, `getCapabilities`, `getViewer`, `getOrderActions`, label enum, layout empat area, dan klien Socket.IO. Polling cadangan, toast perubahan status, dan judul tab tawaran dipindah ke fase pemakainya (W3 dan W5).

---

## 4AM. Keputusan Versi 2.46 (D241): Design System v2.0

Dari tinjauan mockup 21 November 2026 (frame 05f, "Status berhasil: sebelum dan sesudah", dan "Pilihan menu sidebar aktif"). Tanpa perubahan backend. Kode W0 dan W2 dipindahkan ke v2.0 dalam satu sesi frontend sesuai `Design-System.md` Bagian 14.

| # | Keputusan | Alasan |
|---|---|---|
| D241 | **Palet Design System v2.0.** Hitam hangat `#1C1917` menjadi primary untuk aksi. Hijau terang `#22C55E` menjadi secondary (token `--brand`) untuk yang terpilih, aktif, dan sedang terjadi, termasuk mode Sekarang yang kini dibedakan lewat bentuk (kartu putih dengan garis tepi kiri, titik live, pill putih bergaris hijau). Teks di atas hijau terang selalu hitam, dan teks hijau memakai `--brand-strong` `#15803D`. Status berhasil memakai teal `#0F766E`. Bintang rating kuning. Menu sidebar, navigasi bawah, dan tab aktif solid hijau. Cincin fokus hitam. Token lime `--now*` dan `--primary-subtle*` dihapus. Merevisi bagian warna D224 dan pill Sekarang di D225 | Palet v1.6 (hijau zamrud sebagai aksi, lime untuk Sekarang) dinilai kurang cocok setelah dicoba di mockup. Aturan tiga warna (hitam untuk lakukan ini, hijau untuk terpilih atau sedang terjadi, teal untuk sudah berhasil) menjaga status tidak tertukar dengan aksen. Hijau terang dipakai tanpa teks putih karena kontrasnya hanya 2,28:1, sedangkan teks hitam di atasnya 7,67:1 |

## 4AN. Keputusan Versi 2.47 (D242 sampai D250): Review Design System v2.0

Dari review 22 November 2026. Halaman peraga `/dev/ds` dibangun persis mengikuti Design System v2.0, lalu ditinjau berurutan oleh empat skill desain di Claude Code: ui-ux-pro-max (rekomendasi untuk marketplace jasa), taste (pola generik atau template), impeccable (hierarki, tipografi, detail, dan detektor pola), dan web-design-guidelines (audit aksesibilitas dan formulir). Hasilnya 40 temuan yang digabung dalam satu tabel, lalu dipilah: yang menyentuh D241 diputuskan satu per satu, tambahan yang tidak bertabrakan diterima sebagai paket, dan koreksi angka masuk langsung ke Design System v2.1 tanpa nomor keputusan. Untuk penanda mode Sekarang, empat varian dicoba berdampingan di `/dev/ds` sebelum dipilih. Tanpa perubahan backend.

| # | Keputusan | Alasan |
|---|---|---|
| D242 | **Penanda mode Sekarang tanpa garis tepi kiri.** `OfferCard` dan `AvailabilityToggle` memakai `ModeBadge` Sekarang (pill putih bergaris `--brand` dengan titik live), bentuk yang sama dengan kartu listing dan kartu pesanan. `OfferCard`: label "Tawaran baru" di kiri atas, badge di kanan atas, hitung mundur di bawah judul. Garis tepi kiri dan bayangan tipis dihapus. Merevisi bagian mode Sekarang di D241 | Kartu dengan garis tepi kiri berwarna ditandai impeccable sebagai pola klise ("side-tab"). Dari empat varian (garis kiri, badge di pojok, garis penuh, kepala pucat), tiga skill memilih kepala pucat dan taste memilih badge. Badge dipilih karena satu bentuk punya satu arti di semua tempat dan paling minimalis. Bayangan dihapus supaya selaras dengan aturan kartu tanpa bayangan |
| D243 | **Penanda posisi aktif pucat.** Menu sidebar, navigasi bawah, dan tab aktif memakai latar `--brand-subtle` dengan teks dan ikon `--brand-subtle-foreground` (6,49:1), tebal 600. Solid `--brand` hanya untuk tombol varian `now` dan titik live. Lencana angka di item aktif memakai `--primary` dengan teks putih. Merevisi pilihan H (menu aktif solid) di D241 | ui-ux-pro-max dan impeccable sama-sama menemukan hijau solid memegang dua tugas dengan intensitas yang sama: "kamu di sini" dan "lakukan sekarang". Di layar pekerja, navigasi bawah aktif bersaing dengan tombol Ambil |
| D244 | **Switch menyala memakai `--brand-hover`** `#16A34A` untuk trek dan garisnya, thumb `--card` | Trek `--brand` hanya 2,28:1 terhadap kartu dan thumb putih, di bawah syarat 3:1 komponen UI (WCAG 1.4.11), padahal switch adalah kontrol utama pekerja. Dengan `--brand-hover` menjadi 3,30:1. Satu-satunya kegagalan WCAG nyata dari review |
| D245 | **Label `SETTLED` menjadi "Dana cair"** (ikon `BadgeCheck`), mengganti "Tuntas" | "Selesai" dan "Tuntas" hampir sinonim, sama-sama teal, dan sering tampil berdekatan. "Dana cair" sudah menjadi istilah glosarium untuk settlement dan langsung menjelaskan apa yang berubah |
| D246 | **`ModeBadge` di `ListingCard` hanya untuk mode Sekarang.** Kartu dan detail pesanan tetap menampilkan kedua mode | Terjadwal adalah mode bawaan. Badge yang diulang di setiap kartu menambah kebisingan tanpa informasi baru (taste) |
| D247 | **Skala tipografi dan lebar baris.** `display` 30/36 px di HP dan 40/48 px mulai `md`, `h1` 28/36, `h2` 22/30, `h3` 18/26 tetap, lewat token `text-display` sampai `text-h3`. Paragraf `max-w-xl` untuk `body` dan `max-w-lg` untuk `body-sm`. Pesan error `body-sm` 14 px bobot 500. `text-balance` untuk judul, `text-pretty` untuk paragraf. Badge 28 px dengan teks bobot 600 | Rasio skala lama sekitar 1,12, sehingga judul kartu hampir sama dengan isi. `max-w-prose` dengan Plus Jakarta Sans menghasilkan 94 sampai 98 karakter per baris, melanggar target sekitar 70 di dokumen sendiri. Error 12 px terlalu kecil untuk pekerja di lapangan (impeccable) |
| D248 | **Aturan formulir dan aksesibilitas tambahan.** Atribut `name`, `autoComplete`, dan `inputMode` per jenis field (kode verifikasi `one-time-code`). Fokus ke field error pertama setelah kirim gagal. Fokus pindah ke teks status saat aksi jadi nonaktif karena waktu habis. Tawaran baru diumumkan lewat `aria-live`. Tab dan filter disimpan di query URL. Label proses berakhiran "…". Tautan "Lewati ke konten", `touch-action: manipulation`, `overscroll-behavior: contain` di Sheet, konteks `sr-only` untuk lencana angka, `translate="no"` untuk nama merek dan nomor pesanan, kursor `pointer` di tombol. Denyut titik live hanya lewat `transform` dan `opacity` dan berhenti setelah tiga kali | Hasil audit web-design-guidelines dan ui-ux-pro-max. Menutup lubang nyata di alur pekerja (fokus hilang saat waktu tawaran habis, tawaran baru tidak terdengar pembaca layar, kode verifikasi tanpa isi otomatis) tanpa mengubah aturan yang sudah ada |
| D249 | **Aturan komposisi dan nada.** Paling banyak dua lapis kotak. Pill hanya untuk yang tidak bisa ditekan dan switch; semua yang bisa ditekan, termasuk chip filter, memakai radius 10 px (indikator aktif navigasi bawah boleh pill karena penanda). Judul memakai fakta, bukan klaim ("tepercaya", "terbaik", "mudah" dilarang). Pemisah "·" hanya untuk pasangan metadata | taste dan impeccable menemukan kartu di dalam kartu (empat kelompok), dua bentuk kontrol yang bercampur, dan judul hero berupa klaim yang cocok untuk bisnis apa pun |
| D250 | **Komponen domain `EscrowNote`**: ikon `ShieldCheck` dan kalimat "Dana ditahan sampai pekerjaan selesai", nada netral, di form pesan, halaman bayar, dan banner `PAID` | Escrow adalah pembeda utama Jasana, tapi sebelumnya hanya muncul di glosarium. ui-ux-pro-max menekankan pola kepercayaan untuk transaksi uang |

**Yang dipertahankan setelah review:**

- Primary hitam hangat. ui-ux-pro-max untuk jasa rumah menyarankan biru, tapi tidak mengusulkan perubahan: hitam paling netral (17,49:1) dan kesan kepercayaan dibawa `EscrowNote` (D250)
- `--brand` tetap `#22C55E`. taste mencatat hampir semua nilai warna sama dengan palet bawaan Tailwind dan mengusulkan `#26C281`. Tidak diambil: identitas Jasana dibawa pola (aturan tiga warna, badge Sekarang, nada teks), bukan oleh satu nilai hex yang beda tipis
- Plus Jakarta Sans. Detektor impeccable menandainya sebagai huruf yang terlalu sering dipakai, sedangkan ui-ux-pro-max merekomendasikannya. Alasan di Design System (huruf karya desainer Indonesia, angka tabular) tetap berlaku

**Ditunda:** baris "N pekerja bisa datang sekarang di Denpasar" di hero beranda (taste). Butuh angka dari API, dicatat sebagai H139.

**Tanpa nomor keputusan:** koreksi angka kontras di Design System Bagian 1.5 (dibulatkan, bukan dipotong), daftar penanda grafis di bawah 3:1 yang dibenarkan, state `secondary`, `ghost`, dan `destructive` beserta token `--destructive-hover`, chip filter tidak aktif, lebar cincin fokus dan garis input error, tinggi tab 44 px, serta beberapa aturan yang sebelumnya saling bertabrakan di v2.0.

## 4AO. Keputusan Versi 2.48 (D251): Logo

Dari persiapan M3 frontend, 22 November 2026. Sebelumnya merek hanya berupa teks "Jasana" dengan ukuran yang berbeda-beda dan tidak berasal dari token (24 px di header, 20 px di footer). Tanpa perubahan backend.

| # | Keputusan | Alasan |
|---|---|---|
| D251 | **Logo Jasana: ikon diikuti teks.** Ikon berupa huruf J dengan kotak hijau (`public/brand/jasana-mark.svg`, dipotong rapat dari berkas asli), diikuti teks "Jasana". Header publik, halaman masuk, sidebar, dan header pekerja: ikon 28 px, jarak 8 px, teks token baru `text-logo` 22/28 px bobot 700. Footer: ikon 20 px, teks `text-h3` bobot 700. Ikon dekoratif (`alt=""`), teks memakai `translate="no"`. Favicon dari berkas asli berkanvas persegi (`src/app/icon.svg`), `favicon.ico` bawaan Next dihapus | Warna ikon persis `--primary` dan `--brand`, jadi menyatu dengan aturan tiga warna. Teks tetap ditampilkan karena ikon belum dikenal pengguna. Satu token untuk semua header menggantikan ukuran campuran yang tidak berasal dari token. 22 px berada di antara `h3` dan `h1`, sehingga logo terlihat tanpa menyaingi judul halaman |

## 4AP. Keputusan Versi 2.49 (D252 sampai D254): Halaman Cari

Dari M3 putaran 2 (desain ulang `/cari`), 22 November 2026. Ketiganya diusulkan Claude Code saat membangun halaman, tidak langsung dibangun karena butuh pola yang belum ada di Design System. Tanpa perubahan backend.

| # | Keputusan | Alasan |
|---|---|---|
| D252 | **Tombol `md` naik ke 44 px, `sm` hanya di area usaha dan admin.** Area publik, pelanggan, dan pekerja memakai `md` atau `lg` | Design System bertentangan dengan dirinya sendiri: Bagian 11 meminta area sentuh 44 px, sedangkan `sm` 36 px dan `md` 40 px. Dengan 44 px, tombol juga sama tinggi dengan input, sehingga kotak cari dan tombolnya sejajar. Area usaha dan admin dipakai di desktop dengan mouse, jadi `sm` masih wajar di sana |
| D253 | **Chip filter aktif yang bisa dihapus satu per satu** (varian `removable`, komponen `ActiveFilters`) di antara baris judul dan hasil `/cari`. Kata kunci tidak ikut, karena sudah punya tombol "Hapus kata kunci" | Di HP panel filter tersembunyi di Sheet, sehingga tanpa baris ini pengguna tidak tahu filter apa yang sedang aktif. Menghapus satu filter tanpa membuka Sheet juga lebih cepat |
| D254 | **`ListingCard` varian `compact`** untuk hasil `/cari` di bawah `sm`: baris horizontal dengan foto 112 px di kiri dan teks di kanan. Beranda tetap varian biasa | Dua belas kartu varian biasa satu kolom di 390 px tingginya sekitar 5.700 px. Daftar horizontal memotongnya menjadi sekitar seperempatnya dan sudah akrab di aplikasi marketplace Indonesia. Beranda hanya menampilkan empat kartu di HP, jadi tetap varian biasa |

## 4AQ. Keputusan Versi 2.50 (D255): Detail Jasa

Dari M3 putaran 3 (desain ulang `/listing/[id]`), 23 November 2026. Tanpa perubahan backend.

| # | Keputusan | Alasan |
|---|---|---|
| D255 | **`EscrowNote` juga di detail jasa**: di panel harga di bawah tombol Pesan (desktop) dan di blok "Cara memesan" (HP). Memperluas D250, yang sebelumnya membatasinya ke form pesan, halaman bayar, dan banner `PAID` | Tamu yang menekan Pesan langsung diarahkan ke `/masuk`, sehingga jaminan dana ditahan tidak pernah terlihat sebelum ia memutuskan mendaftar. Escrow adalah alasan utama orang mau mencoba platform baru, jadi harus terlihat di titik keputusan |

**Catatan untuk D254.** Varian `compact` dipilih lewat container query (lebar daftar hasil di bawah 36rem), bukan titik henti `sm` lewat JavaScript. Percobaan pertama dengan hook `matchMedia` menimbulkan kilasan kartu compact di layar lebar (CLS 0,21 di 1280 px), karena halaman ikut dirender di server tanpa mengetahui lebar layar. Dengan CSS saja, CLS turun ke 0,006.

**Bentuk mode di detail jasa** (tanpa nomor keputusan, karena hanya menyusun komponen yang ada): blok "Cara memesan" berisi `ModeBadge` untuk setiap mode yang didukung, masing-masing dengan satu kalimat artinya. Kalimat mode Sekarang sengaja bersyarat ("kalau ada pekerja yang sedang siap"), karena API detail hanya tahu jasa ini mendukung mode Sekarang, bukan ada pekerja yang sedang online.

## 4AR. Keputusan Versi 2.51 (D256): Ruang Aman Layar

Dari M3 putaran 4 (profil penyedia), 23 November 2026. Tanpa perubahan backend.

| # | Keputusan | Alasan |
|---|---|---|
| D256 | **Ruang aman layar (safe area).** Viewport `viewport-fit=cover`. Utilitas `pb-safe` (`padding-bottom: env(safe-area-inset-bottom)`) di bar yang menempel di bawah: bar Pesan detail jasa serta navigasi bawah pelanggan dan pekerja; tinggi isi bar tetap, ruang aman ditambahkan di bawahnya. Utilitas `pb-nav-safe` (`calc(6rem + env(safe-area-inset-bottom))`) menggantikan `pb-24` di `main` area pelanggan dan pekerja. Utilitas `px-safe` (kiri dan kanan) di `body` dan di bar Pesan, supaya isi tidak masuk ke bawah notch saat HP miring. Semua bernilai nol di desktop dan di HP tanpa notch | Di iPhone tanpa tombol home, area sekitar garis gestur (sekitar 34 px) bisa menimpa bar yang menempel di bawah, sehingga tombol sempit ditekan atau ketukan terbaca sebagai gestur sistem. Area pekerja dirancang untuk HP (P3) dan bar bawah ada di tiga tempat. Aturan token melarang nilai `env()` ditulis langsung di kelas, jadi utilitasnya didaftarkan di Design System. Diukur di emulasi iPhone 14 dengan ruang aman tersimulasi |

**Celah yang diketahui:** saat HP miring, latar header dan footer tidak sampai ke bawah notch, sehingga terlihat strip `--background` di sisi itu (warnanya nyaris sama dengan `--card`). Di detail jasa, bar Pesan di iPhone setinggi 107 px sedangkan `scroll-pb-24` 96 px, jadi elemen yang difokus bisa tertutup sekitar 11 px; masih memenuhi WCAG 2.4.11 karena tidak tertutup penuh.

## 4AS. Keputusan Versi 2.52 (D257): Tombol Ikon dan Navigasi Pelanggan Desktop

Dari M3 putaran layout empat area, 23 November 2026. Tanpa perubahan backend.

| # | Keputusan | Alasan |
|---|---|---|
| D257 | **Ukuran tombol `icon` 44 x 44 px**, untuk tombol berisi ikon saja (Menu sidebar, Notifikasi), ikon 20 px, wajib punya nama aksesibel. **Navigasi pelanggan di desktop:** mulai `md`, header pelanggan yang login menampilkan tautan "Pesanan" (pola tautan aktif header publik) dan tombol `icon` `Bell` ke Notifikasi dengan lencana notifikasi baru; "Akun" masuk menu avatar. Di HP, navigasi bawah pelanggan juga tampil di Beranda dan Cari untuk pengguna yang login | Navigasi bawah pelanggan disembunyikan mulai `md`, sehingga di desktop Notifikasi dan Akun tidak bisa dicapai sama sekali dan Pesanan hanya lewat menu avatar. Tombol Menu sidebar sebelumnya mengakali ukuran lewat `className`; dengan ukuran resmi, tombol ikon seragam dan memenuhi area sentuh 44 px. Lencana notifikasi dan pola tautan aktif sudah ada di Design System 6.4, jadi tidak ada pola visual baru selain ukuran tombol |

## 4AT. Keputusan Versi 2.53 (D258 sampai D261): Halaman Autentikasi

Dari W1a (halaman daftar, verifikasi email, lupa dan atur ulang sandi, konfirmasi email), 23 November 2026. D259 butuh perubahan kecil di backend.

| # | Keputusan | Alasan |
|---|---|---|
| D258 | **Dibatalkan.** Semula: `export const instant = false` di empat layout area untuk menghilangkan peringatan "instant-unrendered-segment" di mode dev. Diganti catatan di `apps/web/CLAUDE.md` bahwa peringatan itu sudah diketahui penyebabnya dan tidak perlu diperbaiki | Saat dicoba, ekspor di layout tidak cukup karena Next 16.4 tetap memvalidasi halaman di bawahnya. Menambahkannya di setiap halaman area berarti beban di puluhan halaman W3 sampai W7, dan mematikan validasi lewat konfigurasi ikut mematikan pemeriksaan halaman publik. Peringatannya hanya muncul di mode dev dan tidak mengubah perilaku production. Tujuan awalnya, supaya sesi Claude Code berikutnya tidak menyelidikinya lagi, cukup dicapai dengan catatan |
| D259 | **Path halaman link email mengikuti PRD Frontend 4.2**: `/verifikasi-email`, `/atur-ulang-sandi`, `/konfirmasi-email`. Template `account-emails.ts` di backend disesuaikan | Seluruh rute frontend berbahasa Indonesia. Backend semula memakai `/verify-email`, `/reset-password`, dan `/confirm-email-change`, sehingga link di email membuka 404. Mengubah tiga string di sumbernya lebih bersih daripada menambah lapisan redirect |
| D260 | **Setelah daftar berhasil, frontend langsung masuk** dengan kredensial yang sama, lalu menampilkan konfirmasi "Akunmu sudah dibuat" dengan tombol Lanjut ke `next` atau beranda. Kalau masuk otomatis gagal (misalnya kena batas 429), tombolnya menjadi Masuk | `POST /auth/register` tidak mengembalikan token. D62 membolehkan masuk sebelum verifikasi email. W8 mensyaratkan tamu yang mendaftar di tengah percakapan dengan Asisten bisa langsung melanjutkan |
| D261 | **`/verifikasi-email` dan `/konfirmasi-email` menunggu satu ketukan tombol**, bukan mengirim permintaan otomatis saat halaman dibuka | Pemindai link di layanan email yang menjalankan JavaScript bisa menghabiskan token sekali pakai sebelum pengguna sempat mengklik. Permintaan otomatis juga terkirim dua kali di React StrictMode dan berujung `TOKEN_ALREADY_USED` |

## 4AU. Keputusan Versi 2.54 (D262 sampai D263): Halaman Akun

Dari W1b (profil dan keamanan akun), 24 November 2026. Tanpa perubahan backend.

| # | Keputusan | Alasan |
|---|---|---|
| D262 | **Setelah ganti kata sandi, frontend langsung masuk lagi** dengan kata sandi baru. Kalau gagal (misalnya kena batas 429), tampil "Kata sandi sudah diganti" dengan tombol Masuk | Server mencabut semua sesi termasuk sesi pemanggil (D76, H65). Tanpa ini pengguna terlempar ke `/masuk` sebelum pesannya terbaca. Pengguna baru saja membuktikan tahu kata sandi lama, jadi aman. Hasilnya sesuai harapan umum: perangkat ini tetap masuk, perangkat lain keluar. Polanya sama dengan D260 |
| D263 | **Formulir ganti email dan kata sandi dibuka di tempat**, bukan di Dialog, dan hanya satu yang terbuka sekaligus. Formulir ditutup saat halaman ditinggalkan. Dialog hanya untuk konfirmasi. Memperjelas "formulir pendek" di Design System 6.1 | Isian kata sandi di sheet bawah berisiko tertutup keyboard HP dan kurang cocok untuk pengelola kata sandi. Satu formulir terbuka menjaga satu tombol primary (P2). Formulir ditutup saat halaman ditinggalkan supaya isian kata sandi tidak tertinggal di halaman tersembunyi yang disimpan Next |

**Juga dari W1b:** port dev frontend dikunci di 3100, dan `.env.example` root kini menulis `APP_BASE_URL` dan `CORS_ORIGIN` ke alamat frontend (H127 ditutup). Toast (sonner) dipasang sesuai Design System 10, dengan jarak bawah `--toast-offset-bottom`.

## 4AV. Keputusan Versi 2.55 (D264 sampai D265): Peta dan Alamat

Dari W1c (alamat tersimpan dengan peta), 25 November 2026. Tanpa perubahan backend.

| # | Keputusan | Alasan |
|---|---|---|
| D264 | **Peta memakai Leaflet 1.9.4 langsung, tanpa react-leaflet.** Hanya `components/shared/map/leaflet-map.tsx` yang mengimpor `leaflet`; halaman memakai `MapView` dan `MapPicker`. Merevisi PRD Frontend 2.2 dan stack di `apps/web/CLAUDE.md` | `MapContainer` react-leaflet 5.0.0 menghapus peta saat efeknya dibersihkan dan tidak membuatnya lagi ketika halaman yang disimpan Next (`cacheComponents`) ditampilkan kembali, sehingga petanya mati. Dengan Leaflet langsung, peta dibuat dan dilepas di satu tempat dan posisinya bertahan. Diuji: peta tetap hidup setelah halaman disembunyikan lalu dibuka lagi |
| D265 | **Bentuk peta.** Kontrol dan atribusi bawaan Leaflet diganti komponen bertoken (tombol zoom `outline` ukuran `icon`, atribusi `caption` selalu terlihat dengan area sentuh 24 px). Penanda: lokasi layanan `MapPin` 40 px, basis usaha lingkaran `--neutral` 36 px, penanggung jawab lingkaran 16 px berdenyut tiga kali. `MapPicker` memakai pin diam di tengah, bisa digeser, diketuk, atau dengan tombol panah; titik baru sah mulai zoom 16; pusat awal Denpasar. `MapView` baca saja. Roda mouse tidak memperbesar peta | Warna bawaan Leaflet bukan token Design System. Pin diam di tengah tidak tertutup jari dan bisa dipakai lewat keyboard (WCAG 2.5.7). Titik yang terlalu kasar bisa menggagalkan check-in pekerja yang dicek berdasarkan radius |

**Juga dari W1c:** H149 ditutup lewat komponen `ResetOnLeave` di empat halaman autentikasi (ternyata `/masuk` yang dibuka lagi setelah keluar menampilkan email dan kata sandi pengguna sebelumnya, dengan tombol macet). Atribut field alamat ditambahkan ke Design System 6.1b.

## 4AW. Keputusan Versi 2.56 (D266 sampai D270): Halaman Asisten

Dari W8a (halaman `/asisten` dan komponen percakapan), 26 November 2026. Tanpa perubahan backend. Uji dengan Gemini sungguhan dibatasi paling banyak lima panggilan, sisanya memakai respons tiruan.

| # | Keputusan | Alasan |
|---|---|---|
| D266 | **Rekomendasi Asisten memakai `ListingCard` compact dengan baris aksi** (Lihat dan Pesan), badan kartu dan baris aksi bersaudara tanpa elemen interaktif bersarang, tiga kartu tampil dan sisanya lewat "Tampilkan N jasa lainnya" | PRD 5.15 meminta tombol Lihat dan Pesan, sedangkan D254 menetapkan kartu compact sebagai satu tautan penuh. Server mengirim sampai lima jasa per jawaban; lima kartu sekaligus sekitar 950 px di HP. Geser mendatar ditolak karena mudah terlewat dan bertabrakan dengan gestur HP |
| D267 | **Kerangka layar penuh untuk `/asisten`**: setinggi layar, tanpa footer dan navigasi bawah, kotak cari header disembunyikan di HP, hanya daftar pesan yang menggulir | Header publik dua baris ditambah footer menghabiskan ruang vertikal yang dibutuhkan percakapan di HP. Pola ini umum di aplikasi percakapan |
| D268 | **Komponen percakapan** (gelembung, indikator mengetik, kotak tulis, contoh pertanyaan, pemberitahuan, keterangan AI) sesuai Design System 6.2 | Komponen yang sama dipakai halaman `/asisten` dan widget W8b. Contoh pertanyaan mengisi kotak tulis, bukan langsung mengirim, supaya kuota Gemini tidak terpakai sebelum pengguna yakin. Indikator mengetik menandai menunggu server, bukan hiasan |
| D269 | **Izin lokasi Asisten lewat tombol**, di atas kotak tulis (tamu) dan di bawah jawaban yang butuh lokasi, tidak pernah diminta otomatis. Lokasi hanya disimpan di memori selama percakapan. Akun memakai alamat utama lebih dulu | Browser menghukum permintaan izin tanpa konteks, dan pengguna lebih mungkin mengizinkan saat jelas alasannya. Tanpa koordinat, server tidak mencari dan meminta lokasi (H66) |
| D270 | **Siklus percakapan**: sesi dibuat saat pesan pertama dikirim. Tamu satu percakapan per tab (`sessionStorage`). Akun memakai `?percakapan=<id>` dan riwayat di Sheet kanan. Kartu jawaban terakhir dimuat otomatis, yang lebih lama lewat tombol | Sesi yang dibuat saat halaman dibuka akan mengotori data percakapan dengan sesi kosong. Riwayat pesan dari server hanya membawa id jasa (H153), jadi kartu jawaban lama dimuat sesuai permintaan untuk menghemat panggilan |

## 4AX. Keputusan Versi 2.57 (D271 sampai D274): Widget Asisten dan Klaim Sesi

Dari W8b, 26 sampai 27 November 2026. Menutup fase W8: kriteria PRD 11 (tamu yang mendaftar di tengah percakapan bisa melanjutkan percakapan yang sama) terbukti dengan server sungguhan. Tanpa perubahan backend.

| # | Keputusan | Alasan |
|---|---|---|
| D271 | **`AssistantWidget`**: tombol "Tanya Asisten" di kanan bawah, hanya di layout publik dan pelanggan. Di bawah `md` tombolnya tautan ke `/asisten`; mulai `md` membuka panel non-modal 400 px yang tetap terbuka saat pindah halaman. Tidak tampil di `/asisten`, autentikasi, usaha, pekerja, admin, dan `/pesan/*`; di detail jasa baru tampil mulai `lg`. Merevisi PRD Frontend 5.15 (titik masuk di HP) | Panel layar penuh di HP akan sama dengan `/asisten` tapi tanpa penanganan keyboard HP-nya (D267). Panel non-modal di desktop membiarkan pengguna membuka jasa yang direkomendasikan sambil tetap melihat percakapan. Di detail jasa, bar Pesan adalah aksi utama (P2), dan menumpuk tombol Asisten di atasnya memenuhi area jempol |
| D272 | **Jarak bawah bersama tanpa JavaScript**: `--bottom-bar-height` diisi saat halaman punya navigasi bawah, lalu tombol Asisten, toast, dan `scroll-padding-bottom` mengikutinya. Toast naik di atas tombol, atau bergeser ke kiri panel yang terbuka | Elemen yang difokus tidak tertutup elemen yang menempel (WCAG 2.4.11), toast tidak menutupi tombol atau kotak tulis, dan tidak ada geseran tata letak. Sebagian H151 ikut tertutup |
| D273 | **Klaim sesi tamu** berjalan saat pengguna sudah masuk dan tab masih menyimpan sesi tamu, satu permintaan per tab, sebelum percakapan ditampilkan. Penanda "lanjutkan" (boolean di samping `guest_token`) membuat panel terbuka lagi di halaman asal. Pertanyaan yang tertahan batas tamu dipindah ke kotak tulis. `ALREADY_CLAIMED`: dibuka sebagai akun. `ENDED` atau 404: percakapan baru dengan pemberitahuan. Galat sementara: sesi tamu tetap disimpan dan bisa dicoba lagi | Selama sesi belum diklaim, token login menang atas token tamu dan server menjawab 404, jadi klaim harus selesai sebelum percakapan dimuat. Pesan yang ditolak batas tamu tidak tersimpan di server. Percakapan tidak boleh hilang diam-diam |
| D274 | **Titik masuk mengisi kotak tulis lewat `/asisten?isi=<teks>`** (contoh pertanyaan di beranda, kata kunci `/cari` tanpa hasil). Teks dipotong 1.000 karakter, dibuang dari URL, dan tidak pernah dikirim otomatis | Sama dengan D268: kuota Gemini tidak terpakai sebelum pengguna yakin. Beranda tetap Server Component tanpa JavaScript tambahan |

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
| `worker_location_move_threshold_meters` | 200 | Perpindahan minimum sebelum koordinat dikirim ulang (D66). **Tidak dibaca server, hanya relevan untuk frontend (D198)** |
| `worker_location_max_interval_minutes` | 5 | Batas waktu maksimum antar pengiriman koordinat walaupun tidak berpindah (D66). **Tidak dibaca server, hanya relevan untuk frontend (D198)** |
| `guest_chat_message_limit` | 20 | Batas pesan per `guest_token` (D77) |
| `guest_chat_ip_hourly_limit` | 50 | Batas pesan per alamat IP per jam (D77) |
| `guest_chat_daily_global_limit` | 250 (D160) | Rem darurat seluruh lalu lintas chatbot tamu (D77) |
| `access_token_ttl_minutes` | 15 | Masa berlaku access token JWT (D76). **Tidak dibaca server, nilainya dari env `JWT_ACCESS_TTL_MINUTES` (D198)** |
| `refresh_token_ttl_days` | 30 | Masa berlaku refresh token (D76). **Tidak dibaca server, nilainya dari env `REFRESH_TOKEN_TTL_DAYS` (D198)** |
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
- [x] **H19** **(ditutup di sesi 9b: tiga lapis teruji termasuk paralel di batas sesi dan batas hari WITA, D163, D164)** **Prioritas tinggi setelah D77.** Rate limiting chatbot tiga lapis: per `guest_token`, per alamat IP, dan rem global harian. Tanpa identitas login, endpoint chatbot terbuka untuk siapa saja sedangkan tiap pesan memanggil Gemini yang ada biayanya
- [x] **H37** **(ditutup di sesi 10a lewat D184 dan D185, cron tiap 5 menit dengan klaim bersyarat yang teruji paralel)** Pengiriman email dilakukan setelah commit, bukan di dalam transaksi **(baru, D58)**. Cron mengirim ulang baris FAILED maksimal tiga kali **(bagian pertama selesai di sesi perapian 10 November 2026: SMTP gagal tidak membatalkan operasi dan baris tercatat FAILED, dijaga test; bagian cron diputuskan lewat D177 dan dikerjakan di sesi 10a)**
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
- [x] **H70** **(ditutup di sesi 10b, D187)** Masa aktif pesan dalam order ditegakkan service layer **(baru, D79)**. Hanya boleh mengirim saat status order antara ACCEPTED dan sebelum `settlement_due_at` lewat. Setelah itu read-only, bukan terhapus
- [x] **H71** **(ditutup di sesi 10b, D187, D190)** Pengirim wajib peserta order itu **(baru, D79)**: client pemilik order, pemilik provider, atau `assigned_worker_id`. Pendamping dan pekerja lain di usaha yang sama DITOLAK, sama polanya dengan `ASSIGNEE_ONLY_TRANSITIONS` di state machine
- [x] **H72** **(ditutup di sesi 10b, D188, limit per akun dari `order_message_rate_per_minute`)** Rate limit pengiriman pesan per pengirim **(baru, D79)**
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

- [x] **H15** **(ditutup 17 November 2026: dataset 49 skenario dan evaluasi tiga run, D176, Bagian 4AB)** Kumpulkan 30 sampai 50 skenario percakapan berlabel untuk mengukur akurasi intent extraction. Mulai sekarang, jangan tunggu bulan ke-5 **(alat siap di sesi 9c: dataset berformat, validator `--check`, dan skrip evaluasi. Dataset 49 skenario selesai dan run 1 dijalankan, tersisa run 2 dan 3 menurut D176)**
- [ ] **H68** Ukur konversi sesi chat tamu jadi pendaftaran akun lewat `chat_sessions.claimed_at` **(baru, D77)**. Metrik ini menjawab pertanyaan kegunaan chatbot dengan angka **(alat siap di sesi 9c: klaim sesi D170 dan V9 D172. Datanya terkumpul saat UAT)**
- [x] **H16** **(ditutup 18 November 2026: dijalankan ke Supabase dev dengan skala 0,25, D209, Bagian 4AI)** Siapkan data simulasi, termasuk beberapa usaha BUSINESS dengan jumlah pekerja berbeda dan pemetaan listing yang tumpang tindih, supaya skenario order paralel dan perebutan bisa diuji **(skrip siap di sesi data simulasi, D204 sampai D208, ditutup setelah dijalankan ke Supabase dev)**
- [ ] **H20** Jalankan kueri verifikasi V1 sampai V5 setelah seeding dan setelah pengujian
- [ ] **H91** Rate limiter dihitung per alamat IP, sedangkan k6 menembak seluruh request dari satu IP. Sediakan pengaturan khusus lingkungan pengujian beban, misalnya batas yang dinaikkan lewat env, supaya yang terukur adalah API dan bukan rate limiter-nya. Pengaturan itu ditulis di laporan **(baru)**
- [x] **H92** **(ditutup di sesi 6d)** Sediakan cara menandai pekerja hasil seed sebagai online, hanya aktif di lingkungan pengujian, supaya skenario pencarian `available_now` di stress test tidak selalu kosong. Dibangun di Fase 6 bersama pelacak status online (D99). Sebaiknya k6 juga tidak dijalankan di mesin yang sama dengan API, dan kalau terpaksa, kondisinya ditulis di laporan **(baru)**
- [ ] **H84** Susun kuesioner UAT per aktor dan skenario uji masing-masing, lalu rencanakan rekrutmen 30 responden sesuai komposisi D85 **(baru)**

### 8.6 Yang Harus Ditulis di Laporan sebagai Batasan

- [ ] **H17** Validasi geolokasi berbasis browser dapat dipalsukan lewat DevTools. Sertakan mitigasinya: kode verifikasi 6 digit yang hanya dipegang client yang hadir secara fisik
- [ ] **H21** Perilaku cold start chatbot: pengguna baru tanpa riwayat hanya mendapat intent extraction
- [x] **H66** **(ditutup di sesi 9c: tamu dan giliran sebelum klaim tidak menerima snapshot, riwayat, maupun alamat default, dibuktikan test, D168, D169)** Chatbot tamu tidak melakukan personalisasi sama sekali **(baru, D77)**. Lokasi diambil dari izin geolokasi browser per percakapan, bukan dari `user_addresses`, dan `personalization_snapshot` tetap null
- [x] **H67** **(ditutup secara struktur oleh D152, dibuktikan test prompt di sesi 9a dan test kartu rekomendasi di sesi 9b)** Jawaban chatbot ke tamu tidak boleh memuat data pribadi penyedia seperti nomor telepon atau alamat persis **(baru, D77)**, hanya yang tampil di halaman listing publik
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
- [x] **H111** **(ditutup di sesi 9c lewat D174 dan pemangkasan kueri jalur chat. Penghematan waktu di Supabase dev diukur di uji sandbox 9c)** Overhead server pada giliran `cari_jasa` 2,5 sampai 3,1 detik di Supabase dev, sekitar 1,7 sampai 2,4 detik lebih besar dari jawaban templat. Sesi 9c menghitung jumlah kueri pada jalur pencarian dan penyusunan kartu rekomendasi, lalu memangkas kueri berulang kalau ada **(baru, uji sandbox 9b)**
- [ ] **H112** Urutan ulang berdasarkan rentang harga (D168) hanya berlaku atas 5 hasil teratas berdasarkan jarak, sehingga listing yang cocok harganya tetapi di luar 5 terdekat tidak ikut naik **(baru, sesi 9c)**
- [ ] **H113** `rata_pesan_per_sesi` di V9 ikut menghitung pesan sesudah klaim **(baru, sesi 9c)**
- [ ] **H114** Baris EMAIL yang macet di PENDING di tengah retry (`email_attempts` 1 atau lebih), karena proses mati saat mengirim, tidak pernah diambil lagi. Tidak ada kolom waktu klaim untuk mendeteksinya. Pengiriman pertama yang macet sudah ditangani D185 **(baru, sesi 10a)**
- [ ] **H115** Lamaran ke usaha lain yang gugur otomatis saat pelamar diterima di satu usaha (D36) tidak diberi notifikasi **(baru, sesi 10a)**
- [ ] **H116** Baris `notifications` lama tidak pernah dibersihkan **(baru, sesi 10a)**
- [ ] **H117** Keanggotaan room `order:<id>` hanya diperiksa saat bergabung. Anggota yang keanggotaannya menjadi nonaktif, atau penyedia yang kehilangan status VERIFIED, tetap menerima event room sampai koneksinya putus **(baru, sesi 10b)**
- [ ] **H118** Penurunan `listing_faq_max_items` bisa berbalapan dengan penulisan FAQ yang berjalan bersamaan, karena jalur FAQ tidak memakai advisory lock D199. Pelanggarannya terdeteksi V12 **(baru, sesi 10c)**
- [ ] **H120** Belum ada index `order_status_histories(to_status, created_at)` untuk laporan yang membaca waktu status dari riwayat (D203). Belum diperlukan untuk skala data penelitian **(baru, sesi 10c)**
- [ ] **H122** Pengaman reset data simulasi hanya menghitung relasi yang terdaftar di skrip. Reset tidak boleh dijalankan selama dan sesudah UAT (D204) **(baru, sesi data simulasi)**
- [ ] **H123** Opsional: jalankan data simulasi skala penuh (293 order) ke Supabase dev sebelum UAT dimulai, kalau waktunya ada. Reset ikut menghapus order dan review yang dibuat dengan akun `@sim` saat mencoba frontend (D209) **(baru, jalan data simulasi)**
- [ ] **H124** Objek penyedia di kartu listing dan di `GET /listings/:id` tidak membawa `display_name`, sehingga penyedia INDIVIDUAL tanpa `business_name` tampil "Penyedia perorangan" di frontend. Usulan: tambahkan `display_name` seperti di `GET /providers/:id` **(baru, W0 bagian 2)**
- [ ] **H125** `categories.icon_name` di Supabase dev diisi manual lewat SQL (`cog`, `camera`, `perfume-bottle`, `wrench`) dan belum ada di skrip seed, sehingga hilang kalau katalog di-seed ulang (D229) **(baru, W2)**
- [ ] **H126** Halaman listing dan penyedia yang tidak ditemukan menjawab status 200 dengan `noindex`, bukan 404 (D228). Bisa dirapikan di W9 dengan memeriksa data sebelum streaming dimulai **(baru, W2)**
- [x] **H127** **(ditutup 24 November 2026 di W1b)** `.env.example` di root masih menulis `CORS_ORIGIN=http://localhost:3000`, padahal Next berjalan di `http://localhost:3100` saat pengembangan **(baru, W0 bagian 2)**
- [ ] **H128** Saat deploy, `TRUST_PROXY` (D117) harus sama dengan jumlah hop di jalur publik browser ke Express, dan `API_INTERNAL_BASE_URL` harus lewat jalur dengan jumlah hop yang sama. Kalau tidak, `req.ip` terbaca sebagai IP server Next dan rate limit login berlaku untuk seluruh pengguna sekaligus. Pemeriksaan `Origin` (D233) juga dicek ulang di balik reverse proxy. Pertimbangkan dukungan nilai berupa daftar IP atau loopback di D117 **(baru, W0 bagian 3)**
- [ ] **H129** Kalau tab ditutup tepat saat refresh berjalan, server sudah merotasi token tetapi browser tidak menerima cookie barunya. Refresh berikutnya terbaca sebagai pemakaian ulang dan pengguna ter-logout. Akibat rotasi tanpa jeda toleransi (D76), kemungkinannya kecil, dan ditulis sebagai batasan **(baru, W0 bagian 3)**
- [ ] **H130** Sesi login belum diuji di Firefox dan Safari, dan logout antar tab lewat `BroadcastChannel` belum diuji otomatis. Dikerjakan di W9 **(baru, W0 bagian 3)**
- [ ] **H131** **Prioritas, sebelum W3.** `OrderDto` belum memuat `verification_expires_at`, `verification_locked_until` (dari kolom `orders`), `dispute { id, status }` (relasi), `has_review` (relasi), `review_deadline_at` (`completed_at` ditambah parameter masa ulasan), `depart_available_at` (`scheduled_at` dikurangi jeda berangkat 60 menit di `order-execution.service.ts`), dan `provider.provider_type`. Tanpa ini tombol Ulasan muncul lalu hilang setelah 409, pekerja baru tahu terkunci setelah menekan Verifikasi, dan tambah bukti komplain tidak punya id komplain (D237) **(baru, W0 bagian 4)**
- [ ] **H132** Daftar penerima tawaran Available Now tidak diekspos ke pemilik, padahal dialog Terima memilih pekerja dari daftar itu (D70). Dikerjakan sebelum W5 **(baru, W0 bagian 4)**
- [ ] **H133** Pendamping mendapat 403 di `GET /orders/:id` karena `resolveOrderAccess` tidak menghitung kru sebagai peserta. Pendamping hanya melihat order lewat `GET /orders?as=worker`. Diputuskan sebelum W5 **(baru, W0 bagian 4)**
- [ ] **H134** Tidak ada event `order:leave`, sehingga socket tetap di room order sampai koneksi berikutnya. Dampaknya hanya invalidasi yang tidak perlu **(baru, W0 bagian 4)**
- [ ] **H135** Enum di luar order (verifikasi usaha, keanggotaan, listing, usulan, komplain, pencairan, pengembalian dana, email) belum ada di `packages/shared`, sehingga frontend menulis tipenya sendiri (D239) **(baru, W0 bagian 4)**
- [ ] **H136** Frontend: halaman placeholder `[...slug]` di area usaha, pekerja, dan admin dihapus begitu rute aslinya ada (paling lambat W9), dan `/usaha/daftar` dikeluarkan dari penjagaan area usaha di W4 **(baru, W0 bagian 4)**
- [x] **H137** **(ditutup 19 November 2026 lewat D240)** Kegagalan sementara saat refresh pernah mengalihkan pengguna ke `/masuk` sekali saat pengambilan screenshot, padahal menurut D231 sesi dibiarkan saat API mati atau 5xx. Penyebabnya dua jalur di client: `AreaGate` mengalihkan setiap status tamu, dan `apiFetch` menghapus sesi saat refresh setelah 401 gagal karena 5xx. Route Handler sudah benar **(baru, W0 bagian 4)**
- [ ] **H138** Selama sesi tertunda (D240), header masih menampilkan tombol Masuk dan halaman publik tampil sebagai tamu sampai dimuat ulang. Jarang terjadi, dirapikan di W9 **(baru, perbaikan H137)**
- [ ] **H139** Hero beranda belum menampilkan baris "N pekerja bisa datang sekarang" (usulan review taste, ditunda dari D242 sampai D250). Butuh angka jumlah pekerja online per area dari API. Cek dulu apakah endpoint pencarian sudah bisa memberi angka ini; kalau butuh endpoint baru, masuk saran pengembangan **(baru, review Design System)**
- [ ] **H140** `GET /providers/:id` hanya membawa `id` dan `title` per jasa dan tidak membawa ulasan, sedangkan `GET /listings` tidak punya filter `provider_id`. Akibatnya profil penyedia belum bisa memakai `ListingCard` (foto, harga, rating, mode) dan panel ulasan. Paling sederhana: endpoint penyedia menambah foto utama, harga, rating, dan `supports_available_now` per jasa, serta ringkasan ulasan. Dikerjakan di `main` **(baru, M3 profil penyedia)**
- [ ] **H141** Foto listing di data simulasi berupa gradien dan bentuk geometris, dan ada judul jasa yang sama berulang (misalnya "Servis Ringan dan Tune Up Motor" tiga kali). Halaman publik jadi terasa placeholder saat asistensi dan UAT. Ganti dengan foto asli berlisensi bebas dan judul yang beragam lewat script seed di `main`. Terkait H92: tanpa pekerja online simulasi, filter mode Sekarang menghasilkan nol jasa, sehingga fitur pembeda Jasana tidak bisa didemokan **(baru, review taste T2 di M3 beranda)**
- [ ] **H142** Tipe `PaginationMeta` di `packages/shared` belum memuat `unread_count`, padahal `GET /notifications` mengirimnya. Frontend sementara membacanya secara lokal di `features/notifications/api.ts`. Perbaiki tipenya di `main`, lalu hapus pembacaan lokal itu **(baru, M3 layout empat area)**
- [ ] **H143** `POST /auth/register` tidak punya batas permintaan, padahal masuk dan lupa sandi punya. Orang bisa membuat akun palsu secara massal. Tambahkan pembatas per IP di `main` **(baru, W1a)**
- [x] **H144** **(ditutup 23 November 2026 bersama D259)** CORS backend (`apps/api/src/app.ts`) hanya mengekspos `X-Request-Id`, sehingga browser tidak bisa membaca `Retry-After` dari jawaban 429 di lupa sandi dan kirim ulang verifikasi; frontend jatuh ke pesan umum. Tambahkan `Retry-After` ke `exposedHeaders`. `/masuk` tidak terdampak karena lewat Route Handler. Dikerjakan bersama D259 di `main` **(baru, W1a)**
- [ ] **H145** `GET /auth/sessions` tidak menandai sesi pemanggil, sehingga daftar perangkat aktif belum bisa menampilkan label "Perangkat ini". Frontend sengaja tidak menebak dari user agent **(baru, W1b)**
- [ ] **H146** `POST /users/me/change-password` tidak punya batas permintaan, sehingga kata sandi lama bisa ditebak berulang dari sesi yang dicuri. Tambahkan pembatas per pengguna di `main` **(baru, W1b)**
- [ ] **H147** Jalur unggah avatar belum ada di backend: `/uploads/signed-url` hanya untuk foto listing, dan `PATCH /users/me` hanya menerima `avatar_url` jadi. Frontend menampilkan inisial saja **(baru, W1b, PRD Frontend 12.1 nomor 10)**
- [ ] **H148** Link email `/subcategories/:id` di `taxonomy-emails.ts` tidak ada di peta rute frontend. Diputuskan saat W4 (usulan taksonomi) **(baru, W1b)**
- [x] **H149** **(ditutup 25 November 2026 di W1c, komponen `ResetOnLeave`)** Isian kata sandi di `/masuk` tertinggal di halaman tersembunyi yang disimpan Next setelah masuk. Formulir W1a lain perlu dicek juga. Perbaikannya sama dengan D263: tutup atau kosongkan formulir saat halaman ditinggalkan. Dikerjakan di awal W1c **(baru, W1b)**
- [ ] **H150** `POST /orders` dengan alamat tersimpan hanya menyalin `address_line` ke snapshot pesanan; kecamatan, kota, dan kode pos hilang di sisi pekerja. Sementara ditutup teks bantu di formulir alamat ("teks ini yang dilihat pekerja"). Perbaiki di `main` sebelum W5 **(baru, W1c)**
- [ ] **H151** Toast menutupi dialog yang tampil sebagai sheet bawah di HP. Baru dialog hapus alamat yang ditangani; dialog lain perlu pola yang sama, idealnya di komponen dialog atau Toaster supaya berlaku umum. Dikerjakan saat W3 menambah dialog baru **(baru, W1c)**
- [ ] **H152** Tile OpenStreetMap publik punya kebijakan pemakaian yang membatasi pemakaian berat. Aman untuk demo dan UAT, tapi pemakaian sungguhan butuh penyedia tile lain. Masuk saran pengembangan **(baru, W1c)**
- [ ] **H153** Riwayat pesan chat (`GET /chat/sessions/:id/messages`) hanya membawa `recommended_listing_ids`, bukan kartunya. Frontend mengambil sampai lima `GET /listings/:id` per jawaban, tanpa jarak. Idealnya backend menyertakan kartu ringkas di riwayat **(baru, W8a)**
- [ ] **H154** `chat_sessions.title` tidak pernah diisi, sehingga riwayat percakapan hanya bisa menampilkan tanggal dan jumlah pesan. Isi otomatis dari pesan pertama pengguna **(baru, W8a)**
- [ ] **H155** Templat jawaban Asisten menyebut "halaman Bantuan" yang tidak ada dan "alamat default di profilmu" (di UI: "alamat utama" di Akun), dan menulis "asisten Jasana" dengan huruf kecil. Selaraskan dengan glosarium Design System 9.2 **(baru, W8a)**
- [ ] **H156** Kirim ulang setelah 502 (Gemini gagal) mencatat pesan pengguna kedua dan memotong kuota tamu lagi. Di layar pasangan yang gagal diganti, tetapi di server keduanya tersimpan. Pertimbangkan endpoint ulang yang memakai pesan yang sama **(baru, W8a)**
- [ ] **H157** Siapa pun yang masuk di tab yang sama mengklaim percakapan tamu di tab itu, karena di perangkat bersama token di `sessionStorage` adalah satu-satunya bukti kepemilikan. Diterima sebagai batasan, dicatat untuk laporan **(baru, W8b)**
- [ ] **H158** `CHAT_SESSION_ALREADY_CLAIMED` tidak membedakan apakah pemiliknya pemanggil sendiri. Sebaiknya klaim ulang oleh akun yang sama mengembalikan 200 (idempoten). Dikerjakan di `main` **(baru, W8b)**
- [ ] **H159** Pertanyaan yang tertahan batas tamu hanya disimpan di memori, sehingga hilang kalau tab dimuat ulang penuh di antara meninggalkan percakapan dan kembali **(baru, W8b)**
- [ ] **H160** Kerangka judul hero beranda dua baris, padahal judulnya empat baris di HP, sehingga ada geseran tata letak (CLS 0,039 di 390 px, 0,010 di 1280 px). Sudah ada sejak W2 **(baru, W8b)**
- [ ] **H161** Panel `AssistantWidget` ditutup tanpa animasi keluar, padahal Design System 12 meminta 200 ms `ease-in`. Dirapikan di W9 **(baru, W8b)**
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
| 8 | Desain antarmuka | Selesai, Design System v2.10 | Design System dan mockup menggantikan Figma (D224). Layar per fase mengikuti Design System |

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

1. Frontend di branch `feat/frontend-v2` (versi lama di tag `frontend-v1`): W0 dan W2 selesai dan dipindah ke Design System v2.10 (D241 sampai D274). W1 selesai (W1a autentikasi, W1b akun, W1c alamat dengan peta). W8 (Asisten) selesai. Urutan berikutnya: W3, W5, W4, W6, W7, W9. Sebelum W3, kerjakan H131 di `main`. Sebelum W5, kerjakan H92, H141, dan H150 di `main`. Hutang backend lain di `main`: H124, H125, H140, H142, H143, H145 sampai H148
2. Fase 9 selesai 17 November 2026 setelah evaluasi tiga run (Bagian 4AB dan 4AG). Fase 10 selesai 17 November 2026 (1.004 test lulus, D177 sampai D203), dengan uji sandbox 10a dan 10b lulus dan uji sandbox 10c dijalankan penyusun. Paralel: penyusun menyusun dataset 30 sampai 50 skenario berlabel (H15, D153) dan mencatat model serta batas kuota project Gemini di AI Studio
3. Selesai: Fase 8 (15 November 2026, 751 test lulus, D131 sampai D150) beserta uji sandbox payout dan refund. Uji sandbox refund PARTIAL hasil putusan sengketa lulus. Sebelumnya Fase 7 (11 November 2026, 627 test lulus) beserta uji sandbox Xendit sungguhan (12 November 2026), sebelumnya audit hutang teknis (9 November 2026) dan sesi perapian (10 November 2026)
4. Selesai: data simulasi Bali di Supabase dev (D204 sampai D209)
5. Riset ringan rentang harga pasaran untuk dua belas sub-kategori tersebut, catat sumbernya
6. Paralel sejak sekarang: kumpulkan H15 sedikit demi sedikit setiap minggu, dan siapkan instrumen UAT (H84)

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
| 2.31 | 16 November 2026 | Empat keputusan dari sesi 9b: baris ASSISTANT saat Gemini gagal (D161), kode galat akses sesi (D162), urutan batas tamu (D163), dan definisi tamu untuk rem global (D164). H19 dan H67 ditutup. Tanpa perubahan skema |
| 2.32 | 16 November 2026 | Hasil uji sandbox 9b dengan Gemini sungguhan: semua jenis intent lulus, dua kegagalan 503 dari server Gemini ditangani sesuai D161, analisis latensi terhadap target 3 detik. Dua keputusan baru: retry 5xx (D165) dan saran templat kosong (D166). H111 baru. Tanpa perubahan skema |
| 2.33 | 16 November 2026 | Sembilan keputusan dari sesi 9c: rincian retry (D167), snapshot personalisasi (D168, D169), kode galat klaim (D170), V3 per pesan yang merevisi catatan D164 (D171), V9 akun baru (D172), kriteria taksonomi demo (D173), relasi kartu paralel (D174), dan constraint sesi tamu yang diklaim (D175). H66 dan H111 ditutup, H112 dan H113 baru. Satu migrasi constraint |
| 2.34 | 16 November 2026 | Hasil uji sandbox 9c dengan Gemini sungguhan: klaim sesi, personalisasi dari riwayat, dan retry 5xx terbukti, taksonomi demo dinonaktifkan, V3 dan V9 sesuai D171 dan D172. Tanpa keputusan baru dan tanpa perubahan skema |
| 2.35 | 16 November 2026 | Protokol evaluasi akurasi tiga run (D176) dan hasil run 1: 69,39 persen dengan kegagalan dihitung salah, 97,1 persen atas skenario yang dijawab, 14 kegagalan merespons dari Gemini. Tanpa perubahan kode dan skema |
| 2.36 | 16 November 2026 | Lima keputusan sebelum Fase 10: retry email dengan render ulang (D177), notifikasi in-app selektif (D178), aturan review (D179), laporan admin per hari WITA (D180), dan validasi parameter (D181). Pembagian Fase 10 dalam tiga sesi. Satu kolom dan satu parameter baru, dibuat di sesi implementasinya |
| 2.37 | 17 November 2026 | Lima keputusan dari sesi 10a: tabel event notifikasi (D182), endpoint notifikasi (D183), whitelist dan render generik retry yang merevisi D177 (D184), hitungan dan klaim retry (D185), dan enum `ORDER_MESSAGE` (D186). H37 ditutup, H114 sampai H116 baru. Satu migrasi Ditambah hasil uji sandbox 10a dan empat temuannya |
| 2.38 | 17 November 2026 | Sebelas keputusan dari sesi 10b: masa aktif pesan yang merevisi D79 (D187), notifikasi pesan dan review (D188), admin review (D189), revisi V11 (D190), batas teks dan nama disamarkan (D191), review di detail listing (D192), perbaikan sandbox 10a (D193 sampai D196), dan urutan kunci seragam (D197). H70 sampai H72 ditutup, H117 baru. Tanpa migrasi Ditambah hasil uji sandbox 10b |
| 2.39 | 17 November 2026 | Enam keputusan dari sesi 10c: registri dan rentang parameter (D198), PATCH atomik dengan advisory lock (D199), periode laporan per hari WITA dan V4 per bulan WITA (D200), definisi kolom laporan (D201), SQL mentah terikat (D202), dan waktu status dari riwayat (D203). Penutupan Fase 10. H118 dan H120 baru. Tanpa migrasi Ditambah hasil evaluasi run 2 |
| 2.40 | 17 November 2026 | Hasil evaluasi run 3, rekap tiga run, dan kesimpulan terhadap D85. Penutupan Fase 9. H15 ditutup. Tanpa keputusan baru dan tanpa perubahan kode Ditambah hasil uji sandbox 10c |
| 2.41 | 17 November 2026 | Lima keputusan data simulasi: data Bali lewat service layer (D204), pengecualian ledger simulasi yang memperluas D130 (D205), foto simulasi (D206), `--bulk` hanya lokal (D207), dan penonaktifan listing akun uji (D208). H122 baru. Tanpa migrasi |
| 2.42 | 18 November 2026 | Opsi skala data simulasi untuk Supabase dev (D209) dan hasil jalannya: 86 order, 130 foto, `db:verify` lulus. H16 ditutup, H123 baru. Tanpa migrasi |
| 2.43 | 18 November 2026 | Keputusan frontend: usulan FE1 sampai FE14 dicatat sebagai D210 sampai D223, ditambah tujuh keputusan dari W0 dan W2 (D224 sampai D230). Artefak desain 8 selesai sebagai Design System v1.5. Progres frontend W0 sebagian dan W2. H124 sampai H127 baru. Tanpa migrasi |
| 2.44 | 18 November 2026 | Lima keputusan sesi login frontend (D231 sampai D235): dua cookie sesi, `X-Forwarded-For` paling kanan, pemeriksaan `Origin`, logout yang mencabut token di server, dan `getCapabilities`. Hasil pengecekan kontrak dan uji mutasi. H128 sampai H130 baru. Tanpa migrasi |
| 2.45 | 19 November 2026 | Empat keputusan W0 bagian 4: `order:join` (D236), signature aksi order (D237), sambung ulang socket (D238), label enum (D239), dan sesi tertunda (D240). Penutupan W0 frontend. H131 sampai H138 baru, H137 ditutup. Tanpa migrasi |
| 2.46 | 21 November 2026 | Design System v2.0: primary hitam hangat, secondary hijau terang `--brand` termasuk mode Sekarang, status berhasil teal, bintang kuning, menu aktif solid hijau (D241). Tanpa migrasi |
| 2.47 | 22 November 2026 | Sembilan keputusan dari review Design System v2.0 dengan empat skill desain: penanda mode Sekarang tanpa garis tepi kiri (D242), penanda posisi aktif pucat (D243), switch `--brand-hover` (D244), `SETTLED` jadi "Dana cair" (D245), `ModeBadge` di kartu listing hanya Sekarang (D246), skala tipografi (D247), aturan formulir dan aksesibilitas (D248), aturan komposisi dan nada (D249), dan `EscrowNote` (D250). Design System v2.1. H139 baru. Tanpa migrasi |
| 2.48 | 22 November 2026 | Logo Jasana: ikon diikuti teks, token `text-logo`, favicon (D251). Design System v2.2. Tanpa migrasi |
| 2.49 | 22 November 2026 | Halaman cari: tombol `md` 44 px dan `sm` hanya di area usaha dan admin (D252), chip filter aktif yang bisa dihapus (D253), `ListingCard` varian `compact` di HP (D254). Design System v2.3. Tanpa migrasi |
| 2.50 | 23 November 2026 | `EscrowNote` di detail jasa (D255) dan catatan container query untuk D254. Design System v2.4. Tanpa migrasi |
| 2.51 | 23 November 2026 | Ruang aman layar (D256). Design System v2.5. H140 dan H141 baru. Tanpa migrasi |
| 2.52 | 23 November 2026 | Ukuran tombol `icon` dan navigasi pelanggan di desktop (D257). Design System v2.6. H142 baru. Tanpa migrasi |
| 2.53 | 23 November 2026 | Halaman autentikasi W1a: D258 dibatalkan, path link email (D259), masuk otomatis setelah daftar (D260), verifikasi lewat satu ketukan (D261). H143 dan H144 baru. Tanpa migrasi |
| 2.54 | 24 November 2026 | Halaman akun W1b: masuk lagi otomatis setelah ganti sandi (D262), formulir sensitif dibuka di tempat (D263). Design System v2.7. H127 ditutup, H145 sampai H149 baru. Tanpa migrasi |
| 2.55 | 25 November 2026 | Peta dan alamat W1c: Leaflet langsung tanpa react-leaflet (D264), bentuk peta (D265). Design System v2.8, PRD Frontend 2.2 direvisi. H149 ditutup, H150 sampai H152 baru. Tanpa migrasi |
| 2.56 | 26 November 2026 | Halaman Asisten W8a: rekomendasi (D266), kerangka layar penuh (D267), komponen percakapan (D268), izin lokasi (D269), siklus percakapan (D270). Design System v2.9. H153 sampai H156 baru. Tanpa migrasi |
| 2.57 | 27 November 2026 | Widget Asisten (D271), jarak bawah bersama (D272), klaim sesi tamu (D273), titik masuk lewat `?isi=` (D274). Fase W8 selesai. Design System v2.10. H157 sampai H161 baru. Tanpa migrasi |

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
