# Data Simulasi (H16)

Panduan skrip `apps/api/scripts/seed-simulasi.ts`. Skrip ini mengisi basis data dengan data karangan berlatar Bali untuk tiga keperluan:

1. **Pengerjaan frontend.** Halaman pencarian, detail listing, dan dashboard terisi.
2. **Stress test k6 (D85).** Ada mode `--bulk` khusus basis data lokal.
3. **UAT dengan 30 responden (D85).**

Keputusan yang terkait panduan ini adalah D204 sampai D209, tercatat di register Bagian 4AH dan 4AI.

Jumlah di bawah adalah jalan penuh. Supabase dev saat ini diisi dengan `--skala 0.25 --foto-maks 1` (D209): 86 order (73 riwayat dan 13 order hidup), 130 foto, 38 review, dan 5 withdrawal. Penyedia, pekerja, listing, dan client tetap sama.

---

## 1. Isi data

| Jenis | Jumlah | Keterangan |
|---|---|---|
| Penyedia | 40 | 26 usaha (BUSINESS) dengan 2 sampai 6 pekerja, 14 perorangan (INDIVIDUAL). Seluruhnya VERIFIED tanpa dokumen e-KYC |
| Pekerja | 100 | Termasuk pemilik (D33). Pada usaha dengan 4 pekerja atau lebih, pemilik `accepts_assignments = false` dan tidak dipetakan, karena pemiliknya tidak turun ke lapangan |
| Listing | 130 | Keduabelas sub-kategori Lampiran B terisi, masing-masing 1 sampai 3 foto. Sekitar separuhnya punya FAQ |
| Client | 41 | `demo.client` dan `klien.01` sampai `klien.40`. Seluruhnya punya alamat Rumah, seperempatnya juga alamat Kantor |
| Order riwayat | 280 | Tersebar di 60 hari terakhir, lebih rapat di minggu-minggu terakhir |
| Order hidup | 13 | Bertanggal saat skrip dijalankan (Bagian 4) |
| Review | 154 | 71 di antaranya sudah dibalas penyedia |
| Withdrawal | 5 | 3 COMPLETED, 1 REQUESTED milik `demo.usaha`, 1 REJECTED |
| Admin | 1 + 3 | `demo.admin`, ditambah `uat-admin-01` sampai `uat-admin-03` |

Status akhir order riwayat:

| Status | Jumlah |
|---|---|
| SETTLED | 216 |
| CANCELLED | 15 |
| EXPIRED | 16 |
| REJECTED | 12 |
| REFUNDED | 11 |
| PAYMENT_EXPIRED | 10 |

Rincian per kasus:

- **SETTLED (216)** terdiri atas 210 order normal, 3 sengketa RELEASE, dan 3 sengketa PARTIAL.
- **CANCELLED (15)** dibatalkan sebelum bayar: 10 oleh client, 5 oleh penyedia.
- **EXPIRED (16)** terdiri atas 10 order Scheduled dan 6 order Available Now. Sebagian yang Available Now kedaluwarsa karena semua penerima tawaran menolak.
- **REFUNDED (11)** terdiri atas 8 order yang dibatalkan setelah bayar dan 3 sengketa REFUND.

**Wilayah.** Titik jangkar berada di permukiman Denpasar, Badung selatan, dan Gianyar:

- Denpasar: Renon, Sanur, Panjer, Sesetan, Sidakarya, Teuku Umar, Gatot Subroto, Padangsambian
- Badung selatan: Kuta, Tuban, Legian, Seminyak, Kerobokan, Canggu, Dalung, Jimbaran, Nusa Dua
- Gianyar: Ubud, Peliatan, Mas, Sayan, Sukawati

Untuk titik di pesisir, jangkarnya dipilih sekitar 800 m ke darat dari garis pantai, dan setiap titik digeser acak paling jauh 400 m. `service_radius_km` acak antara 5 dan 25 km, jadi cakupan penyedia saling tumpang tindih.

**Harga.** Harga dasar diambil dari rentang `suggested_price_min` sampai `suggested_price_max` Lampiran B. Delta opsi diambil dari "contoh delta" Lampiran B, divariasikan ±20%, lalu dibulatkan ke Rp5.000. Lampiran B tidak mencantumkan delta untuk tiga kelompok opsi berikut, jadi nilainya diperkirakan dari rentang sub-kategori yang sama:

- `tambahan` dokumentasi acara (B.6)
- `tambahan` servis AC (B.10)
- tipe mesin servis mesin cuci (B.12)

Riset harga pasaran beserta sumbernya untuk Bab IV masih pekerjaan terpisah (register, Langkah Berikutnya nomor 4).

**Kebutuhan PRD Backend 8.4** terpenuhi sebagai berikut:

| Kebutuhan | Di data simulasi |
|---|---|
| Provider INDIVIDUAL | 14 penyedia, contohnya Rias Ayu Sari (`demo.perorangan`) |
| BUSINESS tiga pekerja dengan pemetaan tumpang tindih | Teknik Panjer Mandiri, Listrik Dewata, Canggu Cool AC, dan lainnya. Setiap listing usaha dilayani 2 sampai 3 pekerja, dan setiap pekerja melayani lebih dari satu listing |
| Order dokumentasi acara dengan pendamping | Order hidup "PAID besok" milik `demo.client` (penanggung jawab `demo.pekerja`, pendamping `demo.pendamping`), ditambah sekitar separuh order dokumentasi di riwayat |
| Listing 2 atribut dan 6 atribut | Ganti oli (B.3) dan foto prewedding (B.5) |
| Servis AC dengan PER_UNIT ditambah dua SELECT berbayar | Seluruh listing servis AC: `jumlah_unit`, `jenis_pekerjaan`, `kapasitas_pk`. Listing pertama tiap penyedia melayani seluruh opsinya |
| Check-in lolos dan gagal | Sekitar 20% order yang dikerjakan punya percobaan pertama 300 sampai 500 m meleset. V2 mencatat 262 percobaan, 36 di antaranya gagal |

### Penyedia

Jumlah ulasan dan order selesai di tabel ini berasal dari jalan normal di `jasana_test`. Hasilnya sama setiap kali skrip dijalankan (Bagian 6).

| Penyedia | Tipe | Wilayah | Radius km | Pekerja | Listing | Rating (ulasan) | Selesai |
|---|---|---|---|---|---|---|---|
| Dingin Jaya Teknik | Usaha | Renon | 21 | 6 | AC ×2, listrik, mesin cuci | 3,86 (7) | 7 |
| Sejuk Bali Service | Usaha | Kuta | 12 | 4 | AC ×3, listrik, mesin cuci | 4,40 (5) | 8 |
| Teknik Panjer Mandiri | Usaha | Panjer | 7 | 3 | AC, listrik, mesin cuci | 3,67 (3) | 6 |
| Listrik Dewata | Usaha | Gatot Subroto | 21 | 3 | listrik ×2, AC ×2, mesin cuci | 4,10 (10) | 18 |
| Ubud Elektrik | Usaha | Ubud | 23 | 2 | listrik, AC, mesin cuci | 4,33 (6) | 6 |
| Canggu Cool AC | Usaha | Canggu | 22 | 3 | AC ×2, listrik | 4,00 (10) | 16 |
| Rumah Mesin Cuci Sesetan | Usaha | Sesetan | 21 | 2 | mesin cuci ×2, AC, listrik | 4,14 (7) | 9 |
| Jimbaran Teknik | Usaha | Jimbaran | 10 | 4 | AC, listrik, mesin cuci | 3,82 (11) | 13 |
| Nusa Dua Servis | Usaha | Nusa Dua | 6 | 3 | AC ×2, listrik, mesin cuci | belum ada | 1 |
| Bli Komang Listrik | Perorangan | Kerobokan | 7 | 1 | listrik, AC | 4,50 (2) | 4 |
| Pak Ketut Servis AC | Perorangan | Teuku Umar | 10 | 1 | AC ×2 | 3,25 (4) | 6 |
| Wayan Teknisi Rumah | Perorangan | Mas | 8 | 1 | mesin cuci, listrik | 5,00 (1) | 1 |
| Kilap Mobil Bali | Usaha | Sanur | 18 | 5 | cuci mobil ×3, oli, motor | 4,20 (5) | 7 |
| Seminyak Car Wash | Usaha | Seminyak | 14 | 4 | cuci mobil ×3 | 4,00 (1) | 4 |
| Bengkel Panggilan Sesetan | Usaha | Sidakarya | 22 | 3 | motor ×2, oli | 4,50 (4) | 5 |
| Motor Sehat Denpasar | Usaha | Gatot Subroto | 22 | 4 | motor ×2, oli | 3,50 (2) | 3 |
| Cuci Bersih Kuta | Usaha | Tuban | 8 | 3 | cuci mobil ×3, motor | 4,20 (5) | 8 |
| Ubud Moto Care | Usaha | Peliatan | 5 | 2 | motor, cuci mobil | 4,25 (4) | 4 |
| Jimbaran Auto Clean | Usaha | Jimbaran | 14 | 2 | cuci mobil ×2, oli, motor | 3,67 (3) | 3 |
| Legian Motor Service | Usaha | Legian | 7 | 3 | motor ×2, cuci mobil | 3,75 (4) | 7 |
| Bli Made Cuci Mobil | Perorangan | Dalung | 6 | 1 | cuci mobil ×2 | 3,00 (1) | 1 |
| Gede Servis Motor | Perorangan | Padangsambian | 14 | 1 | motor ×2, oli | 3,60 (5) | 6 |
| Putu Cuci Mobil | Perorangan | Nusa Dua | 13 | 1 | cuci mobil | 4,50 (2) | 3 |
| Lensa Dewata Production (`demo.usaha`) | Usaha | Renon | 15 | 4 | dokumentasi ×2, prewedding, foto produk | 4,60 (10) | 15 |
| Kanvas Prewedding Bali | Usaha | Ubud | 10 | 3 | prewedding ×2, dokumentasi ×2 | 3,67 (3) | 4 |
| Sanur Foto Studio | Usaha | Sanur | 21 | 3 | dokumentasi ×2, foto produk, prewedding | 3,00 (1) | 2 |
| Seminyak Visual | Usaha | Seminyak | 5 | 4 | dokumentasi ×2, prewedding ×2 | 5,00 (2) | 3 |
| Cerita Cahaya | Usaha | Kerobokan | 22 | 2 | dokumentasi, prewedding, foto produk | 4,00 (4) | 6 |
| Komang Foto | Perorangan | Panjer | 6 | 1 | foto produk, dokumentasi | 3,50 (4) | 8 |
| Ayu Lens | Perorangan | Sayan | 21 | 1 | prewedding, foto produk | 5,00 (1) | 1 |
| Rias Ayu Sari (`demo.perorangan`) | Perorangan | Renon | 12 | 1 | MUA acara ×2, pengantin | 4,33 (6) | 8 |
| Sanggar Rias Puspa | Usaha | Sesetan | 25 | 4 | pengantin ×2, MUA acara ×2, potong rambut | 4,60 (5) | 6 |
| Glow Bali MUA | Usaha | Seminyak | 21 | 3 | MUA acara ×2, pengantin ×2, potong rambut | 3,40 (5) | 7 |
| Potong Rambut Keliling Denpasar | Usaha | Teuku Umar | 17 | 4 | potong rambut ×3, MUA acara | 4,00 (2) | 4 |
| Ubud Beauty Home | Usaha | Ubud | 25 | 3 | MUA acara ×2, pengantin, potong rambut | 4,40 (5) | 6 |
| Dewi MUA | Perorangan | Kuta | 13 | 1 | MUA acara ×3, potong rambut | 4,00 (2) | 4 |
| Kadek Barber Panggilan | Perorangan | Canggu | 6 | 1 | potong rambut ×2 | 4,00 (1) | 1 |
| Luh Rias Pengantin | Perorangan | Sukawati | 22 | 1 | pengantin ×2 | belum ada | 0 |
| Nyoman Cukur Rumahan | Perorangan | Jimbaran | 16 | 1 | potong rambut ×2 | 3,00 (1) | 1 |
| Sinta Makeup | Perorangan | Sanur | 21 | 1 | MUA acara ×2, potong rambut | belum ada | 0 |

Beberapa penyedia sengaja belum punya ulasan, supaya keadaan "penyedia baru" juga tampil di UI.

### Listing per sub-kategori

| Sub-kategori | Listing | Mode |
|---|---|---|
| Servis AC | 18 | Keduanya |
| Cuci Mobil Panggilan | 16 | Keduanya |
| Makeup Artist Acara | 14 | Scheduled |
| Potong Rambut Panggilan | 12 | Keduanya |
| Servis Motor Panggilan | 12 | Keduanya |
| Tukang Listrik | 12 | Keduanya |
| Dokumentasi Acara | 10 | Scheduled |
| Servis Mesin Cuci | 10 | Scheduled |
| Makeup Pengantin | 8 | Scheduled |
| Foto Prewedding | 8 | Scheduled |
| Ganti Oli Panggilan | 5 | Keduanya |
| Foto Produk | 5 | Scheduled |

Untuk sub-kategori yang mendukung kedua mode, sekitar 60% listing menerima Available Now. Sisanya Scheduled saja.

---

## 2. Akun demo

Seluruh akun simulasi memakai password **`Simulasi-Jasana-2026`** dan sudah terverifikasi emailnya.

| Peran | Email | Isi |
|---|---|---|
| Client | `demo.client@sim.jasana.test` | Riwayat tiap status terminal ditambah order hidup (Bagian 4). Punya alamat Renon dan Kuta |
| Pemilik perorangan | `demo.perorangan@sim.jasana.test` | Rias Ayu Sari, MUA di Renon. Punya satu order ACCEPTED dan satu COMPLETED |
| Pemilik usaha | `demo.usaha@sim.jasana.test` | Lensa Dewata Production, dokumentasi acara di Renon, 4 pekerja. Menyetujui lamaran pekerja responden UAT |
| Pekerja | `demo.pekerja@sim.jasana.test` | Penanggung jawab order IN_PROGRESS dan order PAID besok di Lensa Dewata |
| Pendamping | `demo.pendamping@sim.jasana.test` | Pendamping order dokumentasi PAID besok. Tidak punya hak transisi |
| Admin | `demo.admin@sim.jasana.test` | Admin demo yang memutus sengketa dan withdrawal di riwayat |
| Admin UAT | `uat-admin-01@uat.jasana.test` sampai `uat-admin-03@uat.jasana.test` | Untuk tiga responden admin (D85). Dibuat sekali dan **tidak pernah dihapus reset** |

Akun lain dengan password yang sama:

- `pemilik.<kunci>@sim.jasana.test`, contohnya `pemilik.dingin-jaya`
- `pekerja.<kunci>.<n>@sim.jasana.test`
- `klien.01@sim.jasana.test` sampai `klien.40@sim.jasana.test`

**Responden UAT.** Responden client, penyedia, dan pekerja mendaftar sendiri, karena alur pendaftaran, e-KYC, dan lamaran memang bagian dari yang diuji. Responden pekerja melamar ke **Lensa Dewata Production**, lalu lamarannya disetujui lewat akun `demo.usaha`.

---

## 3. Cara menjalankan

Prasyarat:

- Migrasi sudah diterapkan ke basis data tujuan.
- `.env` berisi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`, dan bucket publik `listing-photos` sudah ada.
- `VERIFICATION_CODE_AES_KEY` di `.env` harus sama dengan milik server yang akan membaca datanya. Kalau berbeda, kode verifikasi order AWAITING_VERIFICATION tidak bisa dibuka server.

| Perintah | Hasil |
|---|---|
| `npm run seed:simulasi -- --dry-run` | Mencetak host tujuan, rencana jumlah data, jumlah akun simulasi yang sudah ada, relasi data asing (kalau ada), dan daftar akun demo. Tidak menulis apa pun |
| `npm run seed:simulasi` | Reset, lalu membangun ulang seluruh data simulasi. Langsung jalan hanya kalau host-nya `localhost` dan nama basis datanya memuat `test` |
| `npm run seed:simulasi -- --confirm-host <host>` | Sama, untuk host lain (Supabase dev). `<host>` wajib sama persis dengan host yang dicetak `--dry-run` |
| `npm run seed:simulasi -- --reset [--confirm-host <host>]` | Hanya menghapus data simulasi beserta berkas fotonya |
| `npm run seed:simulasi -- --bulk <N>` | Jalan normal, lalu menambah N penyedia massal (Bagian 7). Hanya untuk basis data lokal |
| `... --skala <0 sampai 1>` | Jumlah tiap jenis order riwayat dikali skala, minimal 1 per jenis. Order hidup tidak ikut dikecilkan (D209) |
| `... --foto-maks <1 sampai 3>` | Paling banyak sekian foto per listing, bawaannya 3 (D209) |

Sifat skrip:

- **Host selalu dicetak lebih dulu.** Target yang tidak dikenali ditolak sebelum ada koneksi, begitu juga `NODE_ENV=production`.
- **Tidak ada email sungguhan.** Skrip memaksa `NODE_ENV=test` (mailer `jsonTransport`), `PAYMENT_GATEWAY=fake`, dan `LLM_GATEWAY=fake`. Notifikasi email tercatat SENT, jadi cron retry server dev tidak mengirimnya ulang.
- **Uang selalu lewat service layer.** Order, pembayaran, ledger, refund, sengketa, review, dan withdrawal dibuat lewat service dengan gateway palsu. Penyedia, pekerja, dan wallet di-insert langsung (pola seed Fase 6), sedangkan listing dibuat lewat `listings.service`.
- **Durasi.** Sekitar 4 sampai 5 menit ke `jasana_test` lokal. Ke Supabase dev lebih lama karena setiap transaksi menyeberang jaringan, perkiraannya 15 sampai 25 menit.
- **Hentikan server dev selama seed berjalan.** Kalau server menyala, cron T3, T6, dan T18 bisa ikut menyapu order yang sedang disusun skrip, lalu skrip berhenti di tengah jalan.

Setelah selesai, jalankan `npm run db:verify`. V1, V5 sampai V8, V11, dan V12 harus nol baris.

---

## 4. Order hidup dan masa berlakunya

Order hidup bertanggal saat skrip dijalankan, jadi sebagian berubah sendiri lewat cron server. Durasi di tabel memakai nilai bawaan `platform_settings`.

| Order | Akun | Berubah sendiri? |
|---|---|---|
| PENDING_ACCEPTANCE Scheduled, dokumentasi 3 hari lagi pukul 10.00 WITA | `demo.client`, menunggu `demo.usaha` | Ya. Menjadi EXPIRED setelah 24 jam (`scheduled_approval_hours`) |
| PENDING_ACCEPTANCE Available Now, servis AC, dua pekerja ditawari dan satu menolak | `demo.client`, Dingin Jaya Teknik | Ya. Menjadi EXPIRED sekitar 5 menit (`available_now_response_minutes`) |
| ACCEPTED, MUA 2 hari lagi | `demo.client`, `demo.perorangan` | Ya. Menjadi PAYMENT_EXPIRED sekitar 10 menit (`payment_window_minutes`) |
| PAID besok pukul 16.00 WITA, dengan pendamping | `demo.client`, `demo.pekerja`, `demo.pendamping` | Tidak. Bertahan sampai pekerja berangkat |
| PAID 30 menit lagi, tombol Berangkat sudah aktif | `klien.01`, Dingin Jaya Teknik | Tidak |
| ON_THE_WAY, cuci mobil | `demo.client`, Kilap Mobil Bali | Tidak |
| ARRIVED, check-in pertama gagal lalu kedua lolos | `klien.02`, Potong Rambut Keliling Denpasar | Tidak |
| IN_PROGRESS, dokumentasi | `klien.03`, `demo.pekerja` | Tidak |
| AWAITING_VERIFICATION | `demo.client`, Teknik Panjer Mandiri | Status bertahan. Kodenya kedaluwarsa 60 menit setelah selesai, lalu client membuat kode baru |
| AWAITING_VERIFICATION terkunci setelah kode salah berulang | `klien.04`, Listrik Dewata | Status bertahan. Lockout lepas setelah 15 menit (`verification_lockout_minutes`) |
| COMPLETED, boleh diulas | `demo.client`, `demo.perorangan` | Ya. Menjadi SETTLED setelah 24 jam (`settlement_holding_hours`). Batas ulasan 14 hari tetap berlaku |
| DISPUTED OPEN | `demo.client`, Motor Sehat Denpasar | Tidak. Bertahan sampai admin memutus |
| DISPUTED UNDER_REVIEW | `klien.05`, Sejuk Bali Service | Tidak. Bertahan sampai admin memutus |
| Withdrawal REQUESTED | `demo.usaha` | Tidak. Bertahan sampai admin menyetujui atau menolak |

**Available Now butuh pekerja online.** Status online disimpan di memori server (D65). Saat server baru menyala, `available_now=true` mengembalikan nol listing. Ada dua cara menyalakannya:

- Pekerja login dan menyalakan toggle ketersediaan.
- Panggil `POST /dev/workers/presence` (hanya ada kalau `PAYMENT_GATEWAY=fake`, H92).

Cron `presence-sweep` mematikan toggle pekerja yang tidak online lebih dari 10 menit.

**Kapan seed dijalankan ulang.** Sebelum sesi demo frontend, supaya order hidup kembali segar. Lakukan hanya **selama UAT belum dimulai** (Bagian 5).

---

## 5. Reset dan pengamannya

`--reset`, dan setiap jalan normal, menghapus seluruh data simulasi:

- akun `@sim.jasana.test` beserta usaha, pekerja, listing, order, review, refund, sengketa, dan withdrawal-nya
- ledger dompet usaha simulasi (perluasan D130, usulan D205)
- berkas foto di folder Storage milik setiap pemilik usaha simulasi
- notifikasi admin non-simulasi yang merujuk order simulasi

Admin `@uat.jasana.test` tidak ikut dihapus.

**Reset menolak jalan** kalau ada data akun non-simulasi yang terkait data simulasi. Contohnya:

- order responden ke listing simulasi
- lamaran pekerja responden ke usaha simulasi
- tindakan `demo.admin` atas akun responden

Skrip lalu menampilkan jumlah per jenis relasi dan keluar dengan kode 1.

> **Jangan menjalankan reset atau seed ulang selama dan sesudah UAT.** Pengaman di atas hanya menghitung relasi yang terdaftar di skrip, jadi bukan jaminan mutlak. Data simulasi yang sudah dipakai responden harus dibiarkan sampai penelitian selesai. Setelah itu, akun UAT dihapus sesuai PRD 5.7.

---

## 6. Determinisme dan batasan

- **Isi data identik setiap kali dijalankan**, karena pilihan acak memakai PRNG berseed tetap. Itu mencakup nama, wilayah, harga, opsi, rating, jumlah per status, dan V2. Yang berbeda hanya UUID, nomor order, dan kode verifikasi, yang dibuat acak oleh service.
- **Waktu riwayat digeser setelah alurnya selesai.** Seluruh jejak waktu order terminal digeser mundur dengan selisih yang sama, termasuk ledger (usulan D205). Akibatnya, langkah-langkah di dalam satu order (berangkat, tiba, mulai, selesai) hanya berjarak beberapa detik. Pengecualiannya pencairan dana, yang dipasang sehari setelah selesai.
- **Notifikasi order riwayat dihapus.** Teks notifikasi memuat jam saat skrip dijalankan, jadi akan menyesatkan kalau dibiarkan. Notifikasi order hidup dibiarkan.
- **Notifikasi sengketa ikut sampai ke admin non-simulasi.** Sengketa hidup memberi tahu seluruh admin aktif, termasuk admin asli di Supabase dev dan admin UAT, lewat notifikasi in-app.
- **Usia akun ikut dimundurkan.** Akun dan listing simulasi bertanggal sekitar dua sampai lima bulan lalu, selalu sebelum order pertamanya, supaya laporan pengguna baru tidak menumpuk di hari skrip dijalankan.

---

## 7. Data massal untuk k6 (`--bulk`)

`--bulk <N>` menambah N penyedia perorangan beserta 1 sampai 3 listing ACTIVE masing-masing. Datanya di-insert langsung per 1.000 baris, tanpa order dan tanpa foto. Datanya tetap mematuhi aturan basis data:

- setiap penyedia punya pekerja pemilik yang ACTIVE dan bersedia ditugaskan (V6)
- setiap listing terpetakan ke pekerja itu (V7)
- seluruh opsi wajib punya harga

Akunnya `bulk-<n>@sim.jasana.test`, jadi ikut terhapus reset.

`--bulk` **hanya untuk basis data lokal** yang dipakai stress test k6 (usulan D207). Ke host lain, skrip berhenti dengan peringatan, kecuali ada `--bulk-remote`. Di `jasana_test`, `--bulk 2000` menambah sekitar 4.000 listing dalam waktu sekitar 35 detik, di atas jalan normal.

---

## 8. Foto listing

Bawaan skrip adalah PNG 640×480 buatan sendiri (usulan D206):

- gradien warna kategori, dengan pola geometris yang berbeda per sub-kategori dan variasi per listing
- tanpa teks, wajah, maupun foto apa pun
- dibuat lewat zlib bawaan Node, tanpa dependensi

Gambar diunggah ke folder `<user_id>/<uuid>` milik pemilik usaha, lalu dicatat lewat `addPhoto`, persis jalur produksi.

Kalau folder `scripts/sim-photos/<slug-sub-kategori>/` berisi gambar, gambar itu yang dipakai. Aturannya ada di `scripts/sim-photos/README.md`:

- PNG atau JPEG, diperiksa lewat magic bytes, maksimal 5 MB
- tanpa wajah orang
- hanya milik sendiri atau berlisensi bebas

Folder itu di-gitignore kecuali README-nya.

---

## 9. Akun uji Postman dan sandbox

`npm run listings:deactivate-test` mencetak listing ACTIVE yang akan dinonaktifkan (dry-run). Dengan `-- --apply`, statusnya diubah menjadi INACTIVE. Targetnya:

- listing milik akun ber-domain `.test` selain `@sim` dan `@uat`, contohnya `@postman.jasana.test`
- listing di sub-kategori atau kategori nonaktif, termasuk dua temuan sandbox 9c

Akun ujinya dibiarkan, dan tidak ada baris yang dihapus (usulan D208).

> **Peringatan.** Menjalankan seed Postman ke Supabase dev memang sudah dilarang. Kalau tetap terjadi, seed itu membuat listing uji ACTIVE baru yang muncul di pencarian UAT. Jalankan `listings:deactivate-test -- --apply` lagi sesudahnya.

---

## 10. Langkah ke Supabase dev

Langkah ini dijalankan penyusun. Hentikan server dev lebih dulu.

1. `npm run listings:deactivate-test`. Periksa daftarnya, lalu jalankan `npm run listings:deactivate-test -- --apply`.
2. `npm run seed:simulasi -- --dry-run`. Catat host yang dicetak, dan pastikan tidak ada relasi data asing.
3. `npm run seed:simulasi -- --confirm-host <host>`.
4. `npm run db:verify`. V1, V5 sampai V8, V11, dan V12 harus nol baris.
5. Nyalakan server dev, lalu login dengan salah satu akun demo.

**Jangan pernah `--bulk` ke Supabase dev.**
