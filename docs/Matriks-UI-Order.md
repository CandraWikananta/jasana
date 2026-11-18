# Matriks UI Order: Status x Penampil

**Artefak frontend 3 dari 4**
Platform Jasana, Tugas Akhir I Nyoman Gede Candra Wikananta (2305551065)
**Versi 1.1**, 19 November 2026

Dokumen ini menurunkan `State-Machine-Order.md` ke sisi antarmuka: untuk setiap status order, apa yang dilihat tiap penampil, tombol apa yang ditawarkan, endpoint mana yang dipanggil, dan kapan tombol itu muncul.

**Rujukan:** `State-Machine-Order.md` (v2.6), `PRD-Backend.md` (v2.5), `Keputusan-Desain-Sistem.md`, `PRD-Frontend.md`, `Design-System.md`.

> **Catatan sinkronisasi.** Sejak versi 1.1, kapabilitas, endpoint aksi, dan event di dokumen ini sudah dicocokkan dengan backend yang berjalan saat W0 bagian 4 (register v2.45, D236 sampai D239). Transisi dan aktor di Bagian 2 cocok dengan `ALLOWED_TRANSITIONS` di `packages/shared`.
>
> Versi 1.0 disusun dari register v2.11 (D1 sampai D99) ditambah keputusan lanjutan yang sudah diketahui (D102, D106, D111, D112, D114, D115, D119). Register di repo sudah v2.39 (D1 sampai D203). **Sebelum Fase W3 dan W5**, cocokkan tabel di sini dengan `docs/State-Machine-Order.md`, `docs/Keputusan-Desain-Sistem.md`, dan route `apps/api/src/modules/orders/*` terbaru. Kalau ada yang berbeda, dokumen di repo yang menang. Perbarui matriks ini dulu, baru kodenya.

---

## 0. Aturan Tunggal

Backend punya satu pintu untuk mengubah status: `transitionOrder()`. Frontend punya padanannya, yaitu satu pintu untuk menentukan tombol:

```ts
getOrderActions(order, viewer, now): OrderAction[]
```

**Tombol aksi order tidak boleh ditentukan lewat if-else status yang tersebar di JSX.** Komponen `OrderActionBar` hanya merender hasil fungsi ini. Fungsinya murni (tanpa fetch, tanpa hook), diuji unit, dan tabel di Bagian 2 adalah spesifikasinya.

**Server tetap penentu.** Matriks ini hanya menentukan tombol apa yang **ditawarkan**. Kalau server menolak dengan 403, 409, atau 422, tampilkan pesan dari peta kode error (Bagian 6), lalu refetch order. Jangan pernah mengubah status order di cache client sebelum server menjawab.

---

## 1. Kapabilitas Penampil

Satu peran tidak cukup untuk menentukan tombol. Seorang pemilik usaha bisa sekaligus penanggung jawab order yang sama. Karena itu yang dihitung adalah **kumpulan kapabilitas**, bukan satu peran.

| Kapabilitas | Benar kalau | Sumber data |
|---|---|---|
| `isClient` | `order.client_id === me.id` | `GET /auth/me`, detail order |
| `isOwner` | `me.provider.id === order.provider.id` dan provider berstatus `VERIFIED` | `GET /auth/me`, detail order |
| `isAssignee` | `me.worker.id === order.assigned_worker.id` | `GET /auth/me`, detail order |
| `isCrew` | `me.worker.id` ada di daftar pendamping order | `GET /orders?as=worker`. Pendamping mendapat 403 di `GET /orders/:id` (H133) |
| `isOfferRecipient` | Order `AVAILABLE_NOW` berstatus `PENDING_ACCEPTANCE` dan pekerja ini ada di daftar penerima tawaran (D102). Diturunkan: pekerja di usaha yang sama dan bukan pemilik, karena server hanya memperlihatkan order itu kepada penerima yang belum menolak. Pemilik yang juga pekerja memakai opsi `offered` (D237) | `GET /orders?as=worker`, event `order:offer` |
| `isAdmin` | `me.role === 'ADMIN'` | `GET /auth/me` |

Bentuk `GET /auth/me` sudah dicek di W0 bagian 3: `provider: { id, provider_type, verification_status }` dengan status apa pun, dan `worker: { id, provider_profile_id, is_owner }` yang hanya terisi untuk keanggotaan ACTIVE.

**Kombinasi yang pasti muncul:**

| Kombinasi | Kapan | Perlakuan |
|---|---|---|
| `isOwner && isAssignee` | Pemilik provider INDIVIDUAL selalu begini. Pemilik BUSINESS kadang begini, karena pemilik otomatis terdaftar sebagai pekerja (D33) | Tampilkan **gabungan** aksi kedua kapabilitas |
| `isOwner && isOfferRecipient` | Pemilik yang juga pekerja online menerima tawaran Available Now | Satu kartu tawaran, tombol Ambil (untuk diri sendiri) dan Terima dengan pilihan pekerja |
| `isClient` bersama `isOwner` atau `isAssignee` | **Tidak pernah** pada order yang sama, karena memesan jasa usaha sendiri ditolak (D106) | Tidak perlu ditangani |
| `isCrew` saja | Pekerja pendamping order Scheduled | Baca saja, **tanpa aksi apa pun** (D69) |

---

## 2. Matriks Aksi per Status

Singkatan penampil: **C** client, **O** pemilik usaha, **W** penanggung jawab, **Wo** penerima tawaran Available Now, **K** pendamping, **A** admin.

Kolom "Ditonjolkan" berisi informasi utama di banner atas halaman detail. Label status di badge sama untuk semua penampil (lihat `Design-System.md` Bagian 7), yang berbeda hanya teks banner.

### 2.1 PENDING_ACCEPTANCE

| Penampil | Ditonjolkan | Aksi | Endpoint dan transisi |
|---|---|---|---|
| C | "Menunggu konfirmasi penyedia" + hitung mundur `response_deadline_at` | Batalkan pesanan | `POST /orders/:id/cancel` (T4) |
| O, mode SCHEDULED | Kartu pesanan baru: jadwal, alamat, opsi terpilih, total dari server, hitung mundur | **Terima**: dialog memilih penanggung jawab dan pendamping (opsional). **Tolak**: dialog konfirmasi | `POST /orders/:id/accept` dengan `{ assigned_worker_id, crew_worker_ids }` (T1). `POST /orders/:id/reject` (T2) |
| O, mode AVAILABLE_NOW | Kartu tawaran di dashboard usaha, hitung mundur 5 menit | **Terima**: pilih pekerja **dari daftar penerima tawaran saja** (D70). **Tolak** | `POST /orders/:id/accept` dengan `{ assigned_worker_id }` (T1). `POST /orders/:id/reject` (T2, hanya pemilik, D102). Daftar penerima tawaran belum diekspos backend (H132) |
| Wo | Kartu tawaran realtime: jasa, jarak ke lokasi, estimasi durasi, hitung mundur | **Ambil**. **Lewati** (menolak tawaran untuk diri sendiri, order tetap hidup untuk penerima lain) | `POST /orders/:id/accept` dengan body kosong (klaim atomik). `POST /orders/:id/decline-offer` tanpa body (D102) |
| A | Baca saja | | |

Aturan tampilan:

- Tombol Terima, Ambil, dan Lewati **dinonaktifkan** begitu hitung mundur habis di client, dengan teks "Waktu respons habis". Statusnya tidak diubah di client, cron server yang mengubahnya ke `EXPIRED` dalam satu menit
- Lewati ditolak server setelah deadline (D115), jadi tombolnya ikut dinonaktifkan pada saat yang sama
- Klaim kalah (`409 ORDER_ALREADY_CLAIMED`) dan event `order:offer_closed` sama-sama **menghapus kartu** dari layar, disertai toast "Pesanan sudah diambil"
- Dialog Terima mode SCHEDULED: kandidat penanggung jawab adalah pekerja `ACTIVE` dengan `accepts_assignments = true` yang **terpetakan ke listing itu** (D50). Pendamping boleh pekerja aktif mana pun, maksimal jumlah pekerja aktif dikurangi satu (D69). Bentrok jadwal tidak disaring di client: kirim, lalu tangani `409 WORKER_SCHEDULE_CONFLICT`. Kalau backend punya endpoint daftar kandidat yang sudah tersaring, pakai itu
- Pemilik INDIVIDUAL tidak pernah melihat pilihan pekerja. Penanggung jawabnya otomatis dirinya sendiri, dan bagian pendamping disembunyikan

### 2.2 ACCEPTED

| Penampil | Ditonjolkan | Aksi | Endpoint dan transisi |
|---|---|---|---|
| C | "Menunggu pembayaran" + nama penanggung jawab (`snapshot_assignee_name`) + rincian harga dari server + hitung mundur `payment_deadline_at` | **Bayar sekarang** (aksi utama). Batalkan | `GET /orders/:id/payment` lalu buka `invoice_url`. Kalau invoice kedaluwarsa tapi order masih ACCEPTED dan batas bayar belum lewat: `POST /orders/:id/payment`. Batalkan: `POST /orders/:id/cancel` (T7) |
| O | "Menunggu pembayaran client" | Batalkan. Ganti penanggung jawab. Atur pendamping (**SCHEDULED saja**) | T7. `PATCH /orders/:id/assignment`. `PUT /orders/:id/crew` |
| W | "Kamu ditugaskan. Menunggu pembayaran client" | | |
| K | "Kamu ikut sebagai pendamping" | | |
| A | Baca saja | | |

Pesan dalam order **mulai aktif** pada status ini (Bagian 3.2).

### 2.3 PAID

| Penampil | Ditonjolkan | Aksi | Endpoint dan transisi |
|---|---|---|---|
| C | SCHEDULED: "Terjadwal" + `scheduled_at`. AVAILABLE_NOW: "Pekerja segera berangkat" | Batalkan, dengan dialog yang menjelaskan dana akan dikembalikan | `POST /orders/:id/cancel` (T9) |
| O | Jadwal, penanggung jawab, pendamping | Batalkan. Ganti penanggung jawab. Atur pendamping (SCHEDULED saja) | T9. `PATCH /orders/:id/assignment`. `PUT /orders/:id/crew` |
| W | Jadwal, alamat, catatan lokasi (`service_notes`), peta | **Berangkat** | `POST /orders/:id/depart` (T8) |
| K | Jadwal dan alamat | | |
| A | Baca saja | Batalkan | T9 |

Aturan tombol Berangkat:

- AVAILABLE_NOW: langsung aktif
- SCHEDULED: aktif mulai `scheduled_at` dikurangi 60 menit (guard T8). Sebelum itu tombol dinonaktifkan dengan teks "Bisa berangkat mulai pukul 13.00 WITA". Kalau backend mengekspos nilai jeda ini, ambil dari sana, jangan menulis angka 60 di beberapa tempat

### 2.4 ON_THE_WAY

| Penampil | Ditonjolkan | Aksi | Endpoint dan transisi |
|---|---|---|---|
| C | "Dalam perjalanan" + peta posisi penanggung jawab | Batalkan | T11 |
| O | Status dan peta (opsional) | Batalkan. **Ganti penanggung jawab dan pendamping sudah tidak tersedia** | T11 |
| W | Peta ke lokasi layanan, perkiraan jarak dari posisi GPS, tautan "Buka di Google Maps" | **Saya sudah sampai** | Ambil posisi GPS saat tombol ditekan, lalu `POST /orders/:id/check-in` dengan `{ latitude, longitude, accuracy_meters }` (T10) |
| A | Baca saja | Batalkan | T11 |

Aturan:

- Selama status ini, perangkat penanggung jawab mengirim posisi lewat event `order:location_update` (D112, hanya diteruskan, tidak ditulis ke basis data). Client menggerakkan penanda di peta tanpa refetch
- Jarak yang ditampilkan ke pekerja **hanya panduan**. Yang menentukan lolos atau tidak adalah Haversine di server. Frontend tidak pernah mengirim jarak
- `422 CHECKIN_OUT_OF_RADIUS`: "Kamu masih di luar radius lokasi. Dekati alamat lalu coba lagi." Kalau `error.details` memuat jarak, tampilkan angkanya
- Posisi untuk check-in diambil **saat tombol ditekan** dengan `enableHighAccuracy: true`, bukan dari posisi terakhir yang tersimpan

### 2.5 ARRIVED

| Penampil | Ditonjolkan | Aksi | Endpoint dan transisi |
|---|---|---|---|
| C | "Pekerja sudah tiba" | Ajukan komplain | `POST /orders/:id/disputes` (T13) |
| O | "Pekerja sudah tiba" | Ajukan komplain | T13 |
| W | "Kamu sudah check-in" | **Mulai kerjakan** | `POST /orders/:id/start` (T12) |
| A | Baca saja | | |

Mulai dari status ini, **pembatalan tidak tersedia lagi** untuk siapa pun. Jalurnya komplain (State Machine Bagian 6).

### 2.6 IN_PROGRESS

| Penampil | Ditonjolkan | Aksi | Endpoint dan transisi |
|---|---|---|---|
| C | "Sedang dikerjakan" | Ajukan komplain | T15 |
| O | "Sedang dikerjakan" | Ajukan komplain | T15 |
| W | "Sedang dikerjakan" | **Tandai selesai**, dengan dialog konfirmasi | `POST /orders/:id/finish` (T14) |
| A | Baca saja | | |

### 2.7 AWAITING_VERIFICATION

| Penampil | Ditonjolkan | Aksi | Endpoint dan transisi |
|---|---|---|---|
| C | **Kode verifikasi 6 digit berukuran besar** + sisa waktu `verification_expires_at` + peringatan "Berikan kode ini hanya kalau pekerjaan sudah selesai dan sesuai" | Minta kode baru (hanya setelah kode kedaluwarsa, D111). Ajukan komplain | `GET /orders/:id/verification-code`. `POST /orders/:id/verification-code` (D111): kode lama dikembalikan selama masih berlaku, 409 atau 429 `VERIFICATION_LOCKED` selama terkunci. T17 |
| O | "Menunggu client memberikan kode" | Ajukan komplain | T17 |
| W | Input 6 kotak angka | **Verifikasi** | `POST /orders/:id/verify` dengan `{ code }` (T16) |
| A | Baca saja | | |

Aturan kode verifikasi:

- Kode **hanya** ditampilkan ke `isClient`. Tidak pernah ke pemilik, pekerja, admin, notifikasi, atau email (D60)
- Kode tidak disimpan di `localStorage`, `sessionStorage`, atau cache yang bertahan. Ambil ulang setiap kali halaman dibuka
- Respons verifikasi yang perlu ditangani di sisi pekerja:

| Kode | Tampilan |
|---|---|
| `VERIFICATION_CODE_INVALID` | "Kode salah." Tampilkan sisa percobaan kalau server mengirimnya |
| `VERIFICATION_CODE_EXPIRED` | "Kode sudah kedaluwarsa. Minta client membuat kode baru." (D114: kode kedaluwarsa ditolak sebelum percobaan dihitung) |
| `VERIFICATION_LOCKED` (429) | Input dikunci, hitung mundur sampai `verification_locked_until` |

### 2.8 COMPLETED

| Penampil | Ditonjolkan | Aksi | Endpoint dan transisi |
|---|---|---|---|
| C | "Selesai" + hitung mundur "Batas ajukan komplain" (`settlement_due_at`) | **Beri ulasan** (kalau belum). Ajukan komplain | `POST /orders/:id/review`. T19 |
| O | "Selesai. Dana ditahan sampai [settlement_due_at]" | Ajukan komplain | T19 |
| W | "Selesai" | | |
| A | Baca saja | | |

### 2.9 DISPUTED

| Penampil | Ditonjolkan | Aksi | Endpoint |
|---|---|---|---|
| C, O | Status komplain (`OPEN`, `UNDER_REVIEW`), bukti yang sudah diunggah, putusan kalau ada | Tambah bukti | `GET /disputes/:id`. `POST /disputes/:id/evidences` (**multipart**, D80) |
| W | "Pesanan ini sedang dalam komplain dan ditangani pemilik usaha" | | |
| A | Di area admin: bukti, **seluruh pesan dalam order**, riwayat status | Mulai tinjau. Putuskan: lepas dana, sebagian, atau refund | `POST /admin/disputes/:id/review`. `POST /admin/disputes/:id/resolve` (T20, T21) |

Penanggung jawab tidak bisa membuka maupun menambah bukti komplain, kecuali dia juga pemilik (`isOwner`).

### 2.10 Status Terminal

| Status | C | O | W dan K |
|---|---|---|---|
| `SETTLED` | "Tuntas". Ulasan kalau belum dan backend masih mengizinkan | "Dana sudah masuk saldo" + tautan ke halaman saldo | "Tuntas" |
| `REJECTED` | "Ditolak penyedia" + tombol **Cari jasa lain** | "Kamu menolak pesanan ini" | Tidak muncul |
| `EXPIRED` | "Penyedia tidak merespons tepat waktu" + **Pesan ulang** (tautan ke listing) | "Kedaluwarsa tanpa respons" | Tidak muncul |
| `PAYMENT_EXPIRED` | "Batas pembayaran lewat" + **Pesan ulang** | "Client tidak membayar" | "Dibatalkan sistem" |
| `CANCELLED` | Siapa yang membatalkan (`cancelled_by`). Kalau sudah dibayar: "Pengembalian dana sedang diproses" | Siapa yang membatalkan | "Dibatalkan" |
| `REFUNDED` | "Dana sudah dikembalikan" + nominal refund kalau tersedia | "Dana dikembalikan ke client" | "Dibatalkan" |

Pesan ulang **hanya tautan** ke halaman listing. Tidak ada pembuatan order otomatis dari order lama.

Pembayaran yang telat (D119) tercatat PAID tanpa menghidupkan order, lalu direfund. Kalau detail order memuat penanda ini, tampilkan ke client: "Pembayaranmu masuk setelah batas waktu. Dana akan dikembalikan." Bentuk datanya dicek di route Fase 7 dan 8.

---

## 3. Elemen Lintas Status

### 3.1 Hitung Mundur

| Status | Field server | Terlihat oleh | Saat habis |
|---|---|---|---|
| `PENDING_ACCEPTANCE` | `response_deadline_at` | C, O, Wo | Terima, Ambil, Lewati dinonaktifkan |
| `ACCEPTED` | `payment_deadline_at` | C, O | Bayar dinonaktifkan |
| `AWAITING_VERIFICATION` | `verification_expires_at` | C, W | Kode diganti tombol "Minta kode baru" di sisi client |
| `AWAITING_VERIFICATION` (terkunci) | `verification_locked_until` | W | Input kode dibuka lagi |
| `COMPLETED` | `settlement_due_at` | C, O | Tombol komplain disembunyikan |

Aturan:

1. Waktu habis **selalu** dihitung dari field server. Tidak pernah dari timer yang dimulai saat halaman dibuka, dan tidak pernah dari parameter `platform_settings` yang ditulis ulang di frontend
2. Saat hitung mundur mencapai nol, **status tidak diubah di client**. Tampilkan "Menunggu sistem memperbarui status", refetch tiap 15 detik sampai status berubah. Cron server berjalan tiap menit
3. Jam perangkat bisa meleset dari jam server. Karena itu tombol yang ditekan sesaat sebelum nol tetap dikirim, dan penolakan server (`409 RESPONSE_DEADLINE_PASSED`, `PAYMENT_DEADLINE_PASSED`, `ORDER_TRANSITION_NOT_ALLOWED`) ditampilkan sebagai pesan biasa, bukan error merah

### 3.2 Pesan dalam Order

| Aspek | Ketentuan UI |
|---|---|
| Kapan bisa mengirim | Status `ACCEPTED` sampai sebelum `settlement_due_at` lewat (H70). Status terminal: baca saja |
| Siapa yang bisa mengirim | `isClient`, `isOwner`, `isAssignee`. **Pendamping tidak**, pekerja lain di usaha yang sama tidak (H71) |
| Admin | Membaca saja, dan hanya dari halaman komplain |
| Label pengirim | "Kamu", "[Nama usaha]" untuk pemilik, "[Nama], penanggung jawab" untuk pekerja |
| Tanda dibaca | Satu tanda per pesan, artinya sudah dibaca **sisi lawan** (client lawan sisi penyedia), bukan per orang |
| Batas | 1 sampai 2000 karakter dengan penghitung. `429 RATE_LIMIT_EXCEEDED`: "Terlalu banyak pesan. Tunggu sebentar." |
| Saat ditutup | Input diganti teks "Percakapan sudah ditutup" |
| Penamaan | Tab berlabel **"Pesan"**. Kata "chat" hanya untuk Asisten (D79) |

### 3.3 Tombol Komplain

Tampil kalau **semua** syarat ini terpenuhi:

```
status ∈ { ARRIVED, IN_PROGRESS, AWAITING_VERIFICATION, COMPLETED }
DAN (settlement_due_at kosong ATAU now <= settlement_due_at)
DAN order belum punya komplain
DAN (isClient ATAU isOwner)
```

Penanggung jawab yang bukan pemilik tidak pernah melihat tombol ini. Alasannya: putusan komplain menyangkut dana usaha (State Machine Bagian 2).

### 3.4 Tombol Batalkan

| Status | Yang melihat tombol | Transisi |
|---|---|---|
| `PENDING_ACCEPTANCE` | C | T4 |
| `ACCEPTED` | C, O | T7 |
| `PAID` | C, O, A | T9 |
| `ON_THE_WAY` | C, O, A | T11 |
| Lainnya | Tidak ada | |

Pekerja yang bukan pemilik **tidak pernah** melihat tombol batal. Pekerja yang berhalangan memberi tahu pemiliknya lewat jalur di luar sistem, dan pemilik memakai Ganti penanggung jawab.

Dialog konfirmasi pembatalan wajib menyebut akibatnya: sebelum bayar "Pesanan dibatalkan", sesudah bayar "Pesanan dibatalkan dan dana dikembalikan ke client".

### 3.5 Peta dan Lokasi

| Konteks | Yang ditampilkan |
|---|---|
| Form pesan | Pin lokasi layanan: dari alamat tersimpan, GPS, atau digeser manual |
| Detail order, semua status aktif | Pin lokasi layanan |
| `ON_THE_WAY`, sisi client | Pin lokasi layanan + penanda posisi penanggung jawab dari `order:location_update` |
| `ON_THE_WAY`, sisi penanggung jawab | Pin lokasi layanan + posisi sendiri + tautan navigasi eksternal |
| Status lain | Tidak ada posisi pekerja. Client tidak boleh melihat posisi pekerja di luar perjalanan |

---

## 4. Operasi Non-Transisi

Dua operasi ini mengubah order tanpa mengubah status (State Machine Bagian 4).

| Aspek | Ganti penanggung jawab (D44) | Atur pendamping (D69) |
|---|---|---|
| Endpoint | `PATCH /orders/:id/assignment` | `PUT /orders/:id/crew` |
| Tombol muncul untuk | `isOwner` | `isOwner` |
| Status | `ACCEPTED`, `PAID` (sebelum `ON_THE_WAY`) | `ACCEPTED`, `PAID`, **mode SCHEDULED saja** |
| Kandidat di dialog | Pekerja ACTIVE, `accepts_assignments = true`, terpetakan ke listing | Pekerja ACTIVE mana pun, tidak wajib terpetakan, maksimal pekerja aktif dikurangi satu |
| Error utama | `WORKER_HAS_INFLIGHT_ORDER`, `WORKER_SCHEDULE_CONFLICT`, `WORKER_NOT_MAPPED_TO_LISTING` | `WORKER_SCHEDULE_CONFLICT`, `CREW_NOT_ALLOWED_FOR_MODE` |
| Yang dilihat client | Nama penanggung jawab baru, toast "Penanggung jawab pesananmu diganti" | **Tidak ada.** Jumlah pendamping tidak ditampilkan ke client (D69) |
| Provider INDIVIDUAL | Tidak muncul | Tidak muncul |

---

## 5. Event Socket.IO dan Respons UI

Socket hanya pemberitahuan. Seluruh perubahan state tetap lewat REST (PRD Backend Bagian 7.2).

**Room order (D236).** Event room order hanya sampai ke socket yang sudah mengirim `order:join { order_id }`. `joinOrderRoom(id)` mengirimnya saat halaman order dibuka dan mengulanginya setiap kali tersambung ulang. Backend belum punya `order:leave`, sehingga socket tetap di room sampai koneksi berikutnya (H134). Bentuk payload tiap event ada di `apps/web/src/lib/socket-events.ts`.

**Setelah tersambung ulang (D238),** query order, tawaran, pesan, dan notifikasi diinvalidasi, karena event selama koneksi putus tidak dikirim ulang.

| Event | Penerima | Respons UI |
|---|---|---|
| `order:status_changed` | Room order | Invalidasi `['orders', 'detail', id]` dan daftar order. Toast singkat kalau perubahan dilakukan pihak lain |
| `order:offer` | Pekerja terpilih, room provider | Tambah kartu tawaran ke daftar (state lokal, bukan cache detail), tambah angka di judul tab "(1) Tawaran baru" |
| `order:offer_closed` | Pekerja terpilih, room provider | Hapus kartu tawaran |
| `order:assignment_changed` | Room order | Invalidasi detail. Toast ke pekerja lama dan baru |
| `order:location_update` | Room order | Gerakkan penanda di peta. **Tanpa** invalidasi cache |
| `order:message` | Room order | Invalidasi `['orders', 'messages', id]`, tambah lencana belum dibaca kalau panel tertutup |
| `notification:new` | Room user | Invalidasi daftar notifikasi dan angka belum dibaca |

Kalau koneksi socket putus, tampilkan indikator kecil "Pembaruan otomatis terputus" dan beralih ke polling: daftar tawaran tiap 10 detik, detail order aktif tiap 15 detik.

---

## 6. Kode Error pada Aksi Order

Seluruh pesan diambil dari `lib/error-messages.ts` (PRD Frontend Lampiran A), bukan ditulis di komponen. Tabel ini merangkum perilaku tambahan selain menampilkan pesan.

| Kode | HTTP | Perilaku UI tambahan |
|---|---|---|
| `ORDER_TRANSITION_NOT_ALLOWED` | 409 | Refetch order. Statusnya sudah berubah oleh pihak lain atau oleh cron |
| `ORDER_ALREADY_CLAIMED` | 409 | Hapus kartu tawaran |
| `RESPONSE_DEADLINE_PASSED` | 409 | Nonaktifkan Terima, refetch |
| `PAYMENT_DEADLINE_PASSED` | 409 | Nonaktifkan Bayar, refetch |
| `FORBIDDEN_ACTOR`, `NOT_ASSIGNED_WORKER` | 403 | Refetch `/auth/me` dan order. Biasanya token masih memuat keanggotaan lama (maksimal 15 menit) |
| `WORKER_HAS_INFLIGHT_ORDER` | 409 | Dialog tetap terbuka, minta pilih pekerja lain |
| `WORKER_SCHEDULE_CONFLICT` | 409 | Dialog tetap terbuka, minta pilih pekerja lain |
| `WORKER_NOT_MAPPED_TO_LISTING`, `WORKER_NOT_ASSIGNABLE` | 422 | Dialog tetap terbuka |
| `CREW_NOT_ALLOWED_FOR_MODE` | 422 | Tidak seharusnya terjadi kalau matriks benar. Catat ke console sebagai bug |
| `CHECKIN_OUT_OF_RADIUS` | 422 | Tetap di halaman, tombol check-in bisa ditekan lagi |
| `VERIFICATION_*` | 422 atau 429 | Lihat Bagian 2.7 |
| `MESSAGE_WINDOW_CLOSED` | 409 | Tutup input pesan |
| `DISPUTE_ALREADY_EXISTS`, `DISPUTE_WINDOW_CLOSED` | 409 | Sembunyikan tombol komplain, refetch |
| `PAYMENT_GATEWAY_ERROR` | 502 | "Layanan pembayaran sedang bermasalah. Coba lagi beberapa saat." |

---

## 7. Kerangka Implementasi

```ts
// apps/web/src/features/orders/order-actions.ts

export type OrderActionId =
  | 'cancel' | 'accept' | 'reject' | 'claim' | 'skip_offer'
  | 'pay' | 'reassign' | 'edit_crew'
  | 'depart' | 'check_in' | 'start' | 'finish' | 'verify'
  | 'request_new_code' | 'open_dispute' | 'add_evidence' | 'review'

export interface Viewer {
  isClient: boolean
  isOwner: boolean
  isAssignee: boolean
  isCrew: boolean
  isOfferRecipient: boolean
  isAdmin: boolean
  providerType: 'INDIVIDUAL' | 'BUSINESS' | null
}

export interface OrderAction {
  id: OrderActionId
  label: string                        // dari glosarium Design System
  variant: 'primary' | 'secondary' | 'destructive' | 'now'
  enabled: boolean
  disabledReason?: string              // contoh: "Bisa berangkat mulai pukul 13.00 WITA"
  needsConfirm: boolean
}

// Murni: tanpa fetch, tanpa hook, tanpa Date.now() di dalam.
// `now` dikirim dari luar supaya bisa diuji.
export function getOrderActions(
  order: OrderDetail,
  viewer: Viewer,
  now: Date,
): OrderAction[]

export function getViewer(order: OrderDetail, me: Me): Viewer
```

Paling banyak **satu** aksi bervarian `primary` per hasil. Kalau penampil punya dua aksi utama sekaligus (misalnya pemilik yang juga penanggung jawab), aksi pelaksanaan yang jadi primary dan aksi pengelolaan jadi secondary.

**Unit test minimal:**

| Kelompok | Kasus |
|---|---|
| Satu test per baris tabel Bagian 2 | Kurang lebih 40 kasus |
| Kombinasi | Pemilik sekaligus penanggung jawab mendapat gabungan aksi. Pendamping mendapat daftar kosong. INDIVIDUAL tidak mendapat `reassign` dan `edit_crew` |
| Batas waktu | Berangkat SCHEDULED 61 menit sebelum jadwal: disabled. 60 menit: enabled. Komplain 1 detik setelah `settlement_due_at`: tidak muncul |
| Mode | `edit_crew` tidak pernah muncul pada AVAILABLE_NOW |
| Pembatalan | Pekerja bukan pemilik tidak pernah mendapat `cancel` di status mana pun |

---

**Signature yang berjalan (D237).** `getViewer(order, me, opts?: { offered?: boolean })` dan `getOrderActions(order, viewer, now, ctx?: { verification?: VerificationCodeDto | null })`. `ctx.verification` diambil dari `GET /orders/:id/verification-code` sampai `OrderDto` memuat `verification_expires_at` dan `verification_locked_until` (H131). `OrderAction` punya field opsional `confirmText`, karena teks dialog batal berbeda sebelum dan sesudah bayar (Bagian 3.4), sehingga dialog tidak perlu memeriksa status. Batas berangkat SCHEDULED sementara memakai konstanta `DEPART_EARLY_MINUTES = 60` yang sama dengan backend, sampai `depart_available_at` tersedia (H131). Tombol Ulasan tampil di COMPLETED dan SETTLED, dan disembunyikan setelah 409 `REVIEW_ALREADY_EXISTS` sampai `has_review` tersedia.

---

## Lampiran. Riwayat Revisi

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 17 November 2026 | Versi awal (draf). Diturunkan dari State Machine v2.6 dan register v2.11, ditambah D102, D106, D111, D112, D114, D115, D119. Perlu dicocokkan dengan register v2.39 di repo |
| 1.1 | 19 November 2026 | Dicocokkan dengan backend saat W0 bagian 4: kapabilitas memakai bentuk `/auth/me` yang sebenarnya, sumber daftar pekerja `GET /orders?as=worker`, endpoint tolak tawaran dan minta kode baru, `order:join` (D236), invalidasi setelah tersambung ulang (D238), dan signature `getViewer` serta `getOrderActions` (D237). Celah H131 sampai H134 |
