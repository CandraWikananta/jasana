# State Machine Order

**Artefak desain 3 dari 8**
Platform Jasana, Tugas Akhir I Nyoman Gede Candra Wikananta (2305551065)
**Versi 2.6**, 30 September 2026

Dokumen ini mendefinisikan seluruh kondisi yang boleh dialami sebuah order, perpindahan yang diizinkan di antaranya, dan efek samping yang wajib terjadi pada setiap perpindahan.

**Aturan tunggal yang mengikat seluruh kode:** tidak ada satu pun bagian sistem yang boleh menulis `orders.status` secara langsung. Semua perubahan status melewati satu fungsi `transitionOrder()`. Di luar fungsi itu, kolom `status` bersifat read-only.

Rujukan keputusan lengkap ada di `Keputusan-Desain-Sistem.md` (D1 sampai D79). Nomor D di dokumen ini menunjuk ke sana.

---

## 0. Apa yang Berubah di Versi 2.5

Penambahan tenaga kerja (D31 sampai D53) tidak menambah satu pun state baru, dan itu disengaja. Yang berubah adalah **siapa yang melakukan transisi** dan **apa yang dijaga guard-nya**.

| Aspek | Versi sebelumnya | Versi 2.5 |
|---|---|---|
| Jumlah state | 15 | 15, tidak berubah |
| Jumlah transisi | 22 | 22, tidak berubah |
| Yang berangkat dan check-in | Provider | **Pekerja** yang ditugaskan |
| Yang menerima order Scheduled | Provider | Pemilik provider, **sekaligus menugaskan pekerja** |
| Yang menerima order Available Now | Provider | **Pekerja atau pemilik**, siapa cepat dia dapat (D70) |
| Kunci in-flight pada guard T1 | Per provider | **Per pekerja** (D40) |
| Bentrok jadwal pada guard T1 | Per provider | **Per pekerja**, rentang waktu (D41) |
| Efek samping T1 dan T6 | Toggle `listings.is_available_now` | Tidak ada toggle, kolom itu dibuang (D45) |
| Aktor pada enum | CLIENT, PROVIDER, ADMIN, SYSTEM | Ditambah **WORKER** |

Satu aturan lama yang **dihapus**: dulu ada efek samping yang otomatis menolak antrean `PENDING_ACCEPTANCE` lain milik provider yang sama saat satu order diterima. Aturan itu tidak berlaku lagi, karena pada model klaim (D70) order `PENDING_ACCEPTANCE` belum terikat ke pekerja manapun (`assigned_worker_id` masih NULL). Satu order yang ditawarkan ke lima pekerja tetap terbuka untuk empat pekerja lain walaupun salah satunya sudah mengambil order berbeda.

---

## 1. Daftar State

| State | Arti | Terminal |
|---|---|---|
| `PENDING_ACCEPTANCE` | Order dibuat, menunggu diterima. Pekerja belum ditugaskan | Tidak |
| `ACCEPTED` | Order diterima **dan pekerja sudah ditugaskan**, menunggu client membayar | Tidak |
| `PAID` | Pembayaran lunas, dana ditahan escrow | Tidak |
| `ON_THE_WAY` | Pekerja menyatakan berangkat ke lokasi | Tidak |
| `ARRIVED` | Pekerja tiba, check-in geolokasi lolos validasi Haversine | Tidak |
| `IN_PROGRESS` | Pekerjaan sedang dikerjakan | Tidak |
| `AWAITING_VERIFICATION` | Pekerja menandai selesai, menunggu kode 6 digit | Tidak |
| `COMPLETED` | Kode valid, pekerjaan selesai. Holding window berjalan | Tidak |
| `SETTLED` | Holding window lewat, dana cair ke saldo usaha | **Ya** |
| `DISPUTED` | Sengketa dibuka, menunggu putusan admin | Tidak |
| `REJECTED` | Order ditolak | **Ya** |
| `EXPIRED` | Tidak ada yang merespons sampai deadline | **Ya** |
| `PAYMENT_EXPIRED` | Client tidak membayar sampai deadline | **Ya** |
| `CANCELLED` | Dibatalkan sebelum pekerja tiba di lokasi | Ya, kecuali ada pembayaran lunas |
| `REFUNDED` | Dana dikembalikan ke client | **Ya** |

`CANCELLED` bersifat terminal hanya kalau order belum pernah dibayar. Kalau sudah ada `payments` berstatus `PAID`, order wajib lanjut ke `REFUNDED` setelah proses refund Xendit selesai.

**Batas `assigned_worker_id`.** Kolom ini NULL hanya pada `PENDING_ACCEPTANCE` dan pada state terminal yang dicapai dari sana (`REJECTED`, `EXPIRED`, `CANCELLED` sebelum diterima). Mulai `ACCEPTED` kolom ini wajib terisi, ditegakkan CHECK constraint `chk_order_worker_assigned` (H24).

---

## 2. Tabel Transisi

Kolom Aktor memakai singkatan: **C** client, **O** pemilik provider, **W** pekerja yang ditugaskan, **A** admin, **S** sistem.

| No | Dari | Ke | Trigger | Aktor | Mode |
|---|---|---|---|---|---|
| T1 | PENDING_ACCEPTANCE | ACCEPTED | Menerima order sekaligus menugaskan pekerja | **O** (Scheduled), **W atau O** (Available Now) | Keduanya |
| T2 | PENDING_ACCEPTANCE | REJECTED | Menolak order | **O** (Scheduled), **W atau O** (Available Now) | Keduanya |
| T3 | PENDING_ACCEPTANCE | EXPIRED | Deadline respons lewat | S (cron) | Keduanya |
| T4 | PENDING_ACCEPTANCE | CANCELLED | Client membatalkan | C | Keduanya |
| T5 | ACCEPTED | PAID | Webhook invoice berstatus lunas | S (Xendit) | Keduanya |
| T6 | ACCEPTED | PAYMENT_EXPIRED | Deadline bayar lewat | S (cron) | Keduanya |
| T7 | ACCEPTED | CANCELLED | Membatalkan sebelum bayar | C / O | Keduanya |
| T8 | PAID | ON_THE_WAY | Pekerja menekan Berangkat | **W** | Keduanya |
| T9 | PAID | CANCELLED | Membatalkan setelah bayar | C / O / A | Keduanya |
| T10 | ON_THE_WAY | ARRIVED | Check-in lokasi lolos validasi | **W** | Keduanya |
| T11 | ON_THE_WAY | CANCELLED | Membatalkan saat perjalanan | C / O / A | Keduanya |
| T12 | ARRIVED | IN_PROGRESS | Pekerja menekan Mulai Kerjakan | **W** | Keduanya |
| T13 | ARRIVED | DISPUTED | Membuka sengketa | C / O | Keduanya |
| T14 | IN_PROGRESS | AWAITING_VERIFICATION | Pekerja menandai pekerjaan selesai | **W** | Keduanya |
| T15 | IN_PROGRESS | DISPUTED | Membuka sengketa | C / O | Keduanya |
| T16 | AWAITING_VERIFICATION | COMPLETED | Pekerja memasukkan kode 6 digit dengan benar | **W** | Keduanya |
| T17 | AWAITING_VERIFICATION | DISPUTED | Membuka sengketa | C / O | Keduanya |
| T18 | COMPLETED | SETTLED | Holding window lewat | S (cron) | Keduanya |
| T19 | COMPLETED | DISPUTED | Membuka sengketa | C / O | Keduanya |
| T20 | DISPUTED | SETTLED | Admin memutuskan dana dilepas (penuh atau sebagian) | A | Keduanya |
| T21 | DISPUTED | REFUNDED | Admin memutuskan refund penuh | A | Keduanya |
| T22 | CANCELLED | REFUNDED | Refund Xendit selesai | S (Xendit) | Keduanya |

**Transisi yang tidak ada di tabel ini ilegal.** Percobaan melakukannya harus ditolak dengan HTTP 409 Conflict, bukan 400, karena masalahnya bukan input yang salah melainkan kondisi order yang tidak sesuai.

**Kenapa pekerja tidak boleh membuka sengketa (T13, T15, T17, T19).** Sengketa adalah urusan antara client dan penyedia sebagai badan yang bertanggung jawab, dan putusannya menyangkut uang yang masuk ke wallet usaha (D48). Pekerja melaporkan masalah ke pemiliknya, dan pemilik yang membuka sengketa. Kalau pekerja boleh membuka sendiri, satu pekerja yang kesal bisa membekukan dana usaha tempatnya bekerja.

**Kenapa pekerja tidak boleh membatalkan (T7, T9, T11).** Alasannya sama: pembatalan setelah pembayaran memicu refund yang mengurangi saldo usaha. Pekerja yang berhalangan memberi tahu pemiliknya, dan pemilik memakai **penggantian penanggung jawab** (Bagian 4) yang tidak membatalkan order sama sekali.

---

## 3. Guard dan Efek Samping

| No | Guard (syarat yang harus terpenuhi) | Efek samping (wajib terjadi dalam transaksi yang sama) |
|---|---|---|
| T1 | `now() < response_deadline_at`; listing masih `ACTIVE`; **pekerja yang ditugaskan terpetakan ke listing itu** (`worker_listings`), keanggotaannya `ACTIVE`, `accepts_assignments = true`; **pekerja itu tidak punya order lain berstatus in-flight**; **tidak bentrok jadwal** (lihat rumus di bawah); untuk Available Now, `assigned_worker_id` order ini masih NULL | Set `assigned_worker_id`, `snapshot_assignee_name`, `accepted_by`, `accepted_at`; set `payment_deadline_at = now() + payment_window_minutes`; kunci slot pekerja **tentatif** (D43); untuk Scheduled, simpan pekerja pendamping ke `order_crew` kalau dicentang (D69); buat invoice Xendit; **buka jalur `order_messages`** (D79); notifikasi client dan pekerja |
| T2 | `now() < response_deadline_at` | Set `cancelled_at`, `cancelled_by = PROVIDER`; notifikasi client |
| T3 | `response_deadline_at < now()` | Notifikasi kedua pihak; untuk `AVAILABLE_NOW`, catat SLA miss untuk **seluruh pekerja yang ditawari** dan **matikan toggle `is_available`** mereka (D57) |
| T4 | Belum ada `payments` berstatus `PAID` | Set `cancelled_at`, `cancelled_by = CLIENT` |
| T5 | Signature `x-callback-token` valid; `event_id` belum pernah diproses; belum ada `payments` lain berstatus `PAID` untuk order ini | Set `paid_at`; **ledger `ESCROW_HOLD`: `pending += provider_earning`**; kunci slot pekerja jadi **pasti** (D43); notifikasi pemilik, pekerja, dan client |
| T6 | `payment_deadline_at < now()`; tidak ada payment `PAID` | Expire invoice di Xendit; **lepas kunci slot tentatif** pekerja dan seluruh pendampingnya (D43, H26) |
| T7 | Belum ada payment `PAID` | Set `cancelled_at`, `cancelled_by`; expire invoice; lepas kunci slot |
| T8 | Ada payment `PAID`; pemanggil adalah `assigned_worker_id`; untuk mode `SCHEDULED`, `now() >= scheduled_at - 60 menit` | Set `started_at`; **bekukan daftar pendamping** (tidak bisa diubah lagi); mulai pembaruan lokasi pekerja via Socket.IO |
| T9 | Ada payment `PAID` | Set `cancelled_at`, `cancelled_by`; buat baris `refunds`; panggil Refund API Xendit; lepas kunci slot pekerja dan pendamping |
| T10 | Pemanggil adalah `assigned_worker_id`; jarak Haversine ke `service_latitude`/`service_longitude` <= `radius_threshold_meters` | Tulis baris `order_checkins` dengan `worker_id` dan `is_valid = true`; notifikasi client |
| T11 | Ada payment `PAID` | Sama dengan T9 |
| T12 | Pemanggil adalah `assigned_worker_id`; sudah ada check-in valid untuk order ini | Notifikasi client |
| T13, T15, T17, T19 | `now() <= settlement_due_at` atau `settlement_due_at` belum diset; belum ada dispute untuk order ini | Buat baris `disputes` berstatus `OPEN`; **hentikan cron settlement untuk order ini**; **seluruh `order_messages` order itu otomatis jadi bukti** yang ditampilkan ke admin (D79); notifikasi admin |
| T14 | Pemanggil adalah `assigned_worker_id` | **Generate kode 6 digit** dengan `crypto.randomInt`, simpan terenkripsi di `verification_code_encrypted`; set `verification_expires_at = now() + 60 menit`; reset `verification_attempts = 0`; tampilkan kode **di aplikasi client**, dan kirim email yang memberi tahu kode bisa dilihat di aplikasi **tanpa memuat kodenya** (D60) |
| T16 | Pemanggil adalah `assigned_worker_id`; kode cocok; `now() < verification_expires_at`; `verification_attempts < verification_max_attempts`; `verification_locked_until` null atau sudah lewat | Set `verified_at`, `completed_at`; **set `settlement_due_at = now() + settlement_holding_hours`**; lepas kunci in-flight pekerja dan pendamping; naikkan `listings.order_count` dan `provider_profiles.completed_orders_count`; buka form review untuk client |
| T18 | `settlement_due_at < now()`; tidak ada dispute berstatus `OPEN` atau `UNDER_REVIEW` | Set `settled_at`; **ledger `ESCROW_RELEASE`: `pending -= earning`, `available += earning`**; **jalur `order_messages` jadi read-only** (D79); notifikasi pemilik |
| T20 | Dispute berstatus `UNDER_REVIEW`; putusan `RESOLVED_RELEASE` atau `RESOLVED_PARTIAL` | Set `settled_at`; kalau parsial, buat baris `refunds` sebesar `refund_amount` dan isi `platform_fee_refunded`; **ledger `ESCROW_RELEASE` sebesar sisa** |
| T21 | Dispute berstatus `UNDER_REVIEW`; putusan `RESOLVED_REFUND` | Buat baris `refunds` penuh; set `platform_fee_refunded = platform_fee`; **ledger `REFUND_DEDUCTION`: `pending -= earning`**; panggil Refund API Xendit |
| T22 | Refund Xendit berstatus selesai | Set `refunds.completed_at`; **ledger `REFUND_DEDUCTION` kalau belum ditulis**; notifikasi client |

Seluruh efek samping harus berada dalam **satu transaksi basis data** bersama perubahan status dan penulisan `order_status_histories`. Kalau salah satu gagal, semuanya batal.

Pengecualian: pemanggilan API eksternal (invoice Xendit, Refund API, pengiriman email) tidak boleh berada di dalam transaksi basis data, karena panggilan jaringan bisa menggantung dan mengunci baris terlalu lama. Pola yang benar adalah commit transaksi dulu, baru panggil API, lalu perbarui hasilnya lewat webhook. Untuk email, baris `notifications` ditulis di dalam transaksi dan pengirimannya dilakukan sesudah commit (D58).

### 3.1 Rumus Pemeriksaan Bentrok Jadwal (guard T1)

Ini satu-satunya guard penting yang **tidak dijaga basis data**, jadi wajib punya unit test sendiri (H25).

```
Untuk order SCHEDULED, tolak kalau ada order SCHEDULED lain milik
pekerja yang sama (sebagai assigned_worker_id ATAU sebagai pendamping
di order_crew) dengan rentang

    [scheduled_at, scheduled_at + snapshot_duration_minutes + buffer)

yang beririsan dengan rentang order baru.
Status yang dihitung: ACCEPTED dan PAID.
buffer = schedule_conflict_buffer_minutes, nilai awal 30 menit.
```

Yang dikunci **bukan tanggal dan bukan orangnya, melainkan rentang waktu**. Pekerja yang punya jadwal 12 September tetap boleh menerima pekerjaan 8 September.

**Kasus silang antar mode.** Pekerja punya jadwal pukul 14.00, lalu pukul 13.00 masuk order Available Now. Tolak Available Now kalau ada order Scheduled berstatus `PAID` milik pekerja itu yang jatuh dalam rentang `now + snapshot_duration_minutes + buffer` (H28).

**Kasus batas yang wajib masuk unit test:** order yang berdempetan persis (selesai 14.00, berikutnya mulai 14.00), dan order yang hanya beririsan di buffer (selesai 14.00, berikutnya mulai 14.20 dengan buffer 30 menit).

### 3.2 Klaim Order Available Now (guard T1, mode AVAILABLE_NOW)

D70. Order ditawarkan ke maksimal `available_now_offer_limit` pekerja terdekat yang memenuhi syarat, **dan sekaligus muncul di dashboard pemilik**. Yang pertama berhasil yang menang.

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

Nol baris berarti sudah keduluan: balas 409 `ORDER_ALREADY_CLAIMED`, dan kirim event Socket.IO supaya kartunya hilang dari layar pekerja lain **dan dari dashboard pemilik**, bukan dibiarkan sampai mereka menekan tombol dan dapat error.

**Jangan memakai pola baca lalu cek**, karena dua orang yang menekan pada detik yang sama bisa lolos berdua. Pola ini identik dengan pengambilan lock webhook di `webhook_events`, jadi tidak ada konsep baru yang perlu dijelaskan di sidang.

Guard sisanya (pemetaan listing, keanggotaan, in-flight, bentrok jadwal) tetap diperiksa **setelah** klaim berhasil, di dalam transaksi yang sama, karena keadaan bisa berubah dalam 5 menit sejak tawaran dikirim (H41). Kalau guard gagal, transaksi di-rollback dan klaimnya batal.

**Kenapa tidak ada percabangan "kalau pemilik sedang online".** Percabangan seperti itu selalu bocor di tepinya, misalnya pemilik online lalu tabnya mati tepat saat order masuk. Dengan membiarkan keduanya berhak sejak awal, tidak ada deteksi yang perlu dilakukan.

**Kenapa tidak ada pelemparan berantai** kalau semua menolak (D56). Pelemparan berantai adalah model broadcast yang sudah ditolak di D23, dan begitu masuk akan menyeret deadline total versus deadline per pekerja, urutan pelemparan, serta penanganan kalau semua menolak. Order langsung `EXPIRED` dan client memilih ulang. Masuk saran pengembangan di Bab V.

---

## 4. Operasi yang Mengubah Order Tanpa Mengubah Status

Dua operasi ini bukan transisi, jadi tidak lewat `transitionOrder()`. Tapi keduanya mengubah order dan wajib dicatat di `order_status_histories` lewat kolom `metadata`, karena menyangkut siapa yang bertanggung jawab.

### 4.1 Penggantian penanggung jawab (D44)

`PATCH /orders/:id/assignment`

| Aspek | Ketentuan |
|---|---|
| Aktor | Pemilik provider saja |
| Batas waktu | Selama status **belum** `ON_THE_WAY` |
| Guard | Pekerja pengganti terpetakan ke listing itu, keanggotaan `ACTIVE`, `accepts_assignments = true`, tidak in-flight, tidak bentrok jadwal |
| Efek | Ganti `assigned_worker_id` dan `snapshot_assignee_name`; lepas kunci pekerja lama, kunci pekerja baru; catat di `order_status_histories` dengan `from_status = to_status`; notifikasi client, pekerja lama, dan pekerja baru |

Inilah yang membuat keputusan menugaskan pekerja di saat accept (D42) tidak kaku. Fleksibilitas pemilik tetap ada, cuma pindah dari "menunda keputusan" jadi "boleh mengubah keputusan". Realistis, karena pekerja bisa sakit mendadak.

### 4.2 Perubahan daftar pendamping (D69)

`PUT /orders/:id/crew`

| Aspek | Ketentuan |
|---|---|
| Aktor | Pemilik provider saja |
| Mode | **SCHEDULED saja** (H47) |
| Batas waktu | Selama status belum `ON_THE_WAY` |
| Guard | Tiap pendamping keanggotaannya `ACTIVE`, tidak in-flight, tidak bentrok jadwal. **Tidak wajib** terpetakan ke listing, karena pendamping bisa saja hanya membantu mengangkat. Jumlah maksimal = pekerja aktif dikurangi satu |
| Efek | Tulis ulang baris `order_crew`; sesuaikan kunci ketersediaan |

Pendamping **tidak punya hak transisi apa pun**. Mereka tidak bisa mengubah status, tidak bisa check-in, dan tidak bisa memasukkan kode verifikasi. Efeknya hanya satu, yaitu memblokir ketersediaan mereka selama rentang order itu (H45).

### 4.3 Pesan dalam order (D79)

`POST /orders/:id/messages`

| Aspek | Ketentuan |
|---|---|
| Peserta | Client pemilik order, pemilik provider, dan `assigned_worker_id`. **Pendamping tidak**, pekerja lain di usaha yang sama juga tidak (H71) |
| Masa aktif | Sejak `ACCEPTED` sampai `settlement_due_at` lewat, lalu read-only (H70) |
| Isi | Teks saja, 1 sampai 2000 karakter |
| Admin | Membaca saja saat menangani dispute, tidak mengirim |
| Efek | Tulis baris `order_messages`; kirim lewat Socket.IO ke room `order:<order_id>`; notifikasi ke sisi lawan |

Pemeriksaan pesertanya **memakai pola yang sama dengan `ASSIGNEE_ONLY_TRANSITIONS`** di Bagian 8: peran saja tidak cukup, identitas pengirim harus cocok dengan salah satu dari tiga pihak itu. Tanpa itu, sembarang pekerja di usaha yang sama bisa ikut bicara di order milik rekannya.

Masa aktif dijaga service layer, bukan basis data, karena bergantung pada status order yang berubah-ubah dan perbandingan terhadap `now()`. CHECK constraint tidak boleh memakai fungsi yang tidak immutable.

---

## 5. Tiga Aturan yang Menyederhanakan Seluruh Alur Uang

Rancangan ini punya tiga sifat yang membuat pembuktian konsistensi dana jadi mudah. Ketiganya layak kamu tulis di bab pembahasan, dan **tidak satu pun berubah** oleh penambahan tenaga kerja.

**Uang hanya bergerak di empat transisi.** Dari 22 transisi, hanya T5, T18, T20, dan T21 yang menyentuh ledger. Sisanya murni perubahan status. Artinya audit alur uang cukup memeriksa empat jalur, bukan dua puluh dua.

**Escrow release hanya terjadi satu kali, di satu pintu.** Semua jalur sukses bermuara ke `SETTLED`, dan `SETTLED` adalah terminal. Tidak ada cara mencapai `ESCROW_RELEASE` dua kali untuk order yang sama, dan constraint `uniq_escrow_event_per_order` menegakkannya di level basis data.

**Refund selalu memotong dari `balance_pending`, tidak pernah dari `balance_available`.** Karena `SETTLED` terminal dan refund hanya bisa terjadi dari `CANCELLED` atau `DISPUTED`, dana yang direfund pasti masih berada di pending. Konsekuensinya saldo usaha yang sudah available tidak akan pernah ditarik mundur.

**Catatan yang layak disebut kalau ditanya:** seluruh modul uang tidak tersentuh penambahan tenaga kerja. Wallet tetap milik usaha (D48), rating tetap milik usaha (D49), dan pekerja tidak punya dompet. Yang berubah hanya siapa yang menekan tombol, bukan ke mana uang bergerak.

---

## 6. Batas Membatalkan dan Batas Bersengketa

**Batas membatalkan adalah kedatangan pekerja.** `CANCELLED` hanya boleh dari `PENDING_ACCEPTANCE`, `ACCEPTED`, `PAID`, dan `ON_THE_WAY`. Setelah pekerja tiba di lokasi (`ARRIVED`), pembatalan sepihak bukan lagi pembatalan melainkan konflik, dan harus lewat `DISPUTED` supaya ada pemeriksaan bukti oleh admin. Tanpa aturan ini, pekerja yang sudah menempuh perjalanan bisa dibatalkan begitu saja tanpa kompensasi.

**Batas membuka sengketa adalah `settlement_due_at`.** Sengketa boleh dibuka kapan saja sejak `ARRIVED` sampai holding window berakhir. Setelah `SETTLED`, sengketa ditutup permanen.

> **Revisi terhadap keputusan D25.** Sebelumnya D25 dirumuskan sebagai "window komplain sama dengan holding window", yang terbaca seolah sengketa hanya boleh dibuka saat status `COMPLETED`. Rumusan itu terlalu sempit: kasus pekerja tidak menyelesaikan pekerjaan atau meninggalkan lokasi terjadi sebelum `COMPLETED`, dan client harus bisa mengadu saat itu juga. Rumusan yang benar adalah **batas akhirnya** `settlement_due_at`, bukan jendela sempit di status `COMPLETED` saja.

**Kenapa pekerja yang berhalangan tidak memicu pembatalan.** Pemilik memakai penggantian penanggung jawab (Bagian 4.1), yang tidak menyentuh status sama sekali. Order tetap berjalan, client tidak dirugikan, dan tidak ada refund yang perlu diproses. Ini salah satu alasan penggantian itu ada.

---

## 7. Perbedaan Antar Mode

Hanya lima tempat di mana `booking_mode` mengubah perilaku, naik dari tiga. Sisanya identik, dan itu memang tujuan menyatukan dua mode dalam satu state machine.

| Titik | `AVAILABLE_NOW` | `SCHEDULED` |
|---|---|---|
| `response_deadline_at` saat order dibuat | `now() + 5 menit` | `now() + 24 jam` |
| Siapa yang boleh melakukan T1 dan T2 | **Pekerja atau pemilik**, siapa cepat dia dapat (D70) | Pemilik saja |
| Cara T1 dijalankan | UPDATE bersyarat atomik (Bagian 3.2) | UPDATE biasa di dalam transaksi |
| Pendamping (`order_crew`) | **Tidak tersedia** (D70, H47) | Tersedia, sampai `ON_THE_WAY` |
| Guard T8 (boleh berangkat) | Kapan saja setelah `PAID` | `now() >= scheduled_at - 60 menit` |

Constraint `uniq_inflight_order_per_worker` berlaku untuk kedua mode, karena satu pekerja tidak boleh mengerjakan dua pekerjaan fisik bersamaan apapun modenya.

**Kenapa pendamping tidak tersedia pada Available Now.** Pendamping adalah keputusan perencanaan, sedangkan mode Available Now tidak punya fase perencanaan. Ada juga alasan teknis: pemilik dan pekerja sama-sama berhak mengklaim, jadi kalau hanya pemilik yang boleh menambahkan pendamping, hasil akhir satu order jadi bergantung pada siapa yang kebetulan lebih cepat menekan tombol. Aturan yang hasilnya ditentukan perlombaan seperti itu sulit dijelaskan di sidang.

---

## 8. Implementasi

```ts
// packages/shared/src/order-state-machine.ts

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_ACCEPTANCE:    ['ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
  ACCEPTED:              ['PAID', 'PAYMENT_EXPIRED', 'CANCELLED'],
  PAID:                  ['ON_THE_WAY', 'CANCELLED'],
  ON_THE_WAY:            ['ARRIVED', 'CANCELLED'],
  ARRIVED:               ['IN_PROGRESS', 'DISPUTED'],
  IN_PROGRESS:           ['AWAITING_VERIFICATION', 'DISPUTED'],
  AWAITING_VERIFICATION: ['COMPLETED', 'DISPUTED'],
  COMPLETED:             ['SETTLED', 'DISPUTED'],
  DISPUTED:              ['SETTLED', 'REFUNDED'],
  CANCELLED:             ['REFUNDED'],
  SETTLED:               [],
  REFUNDED:              [],
  REJECTED:              [],
  EXPIRED:               [],
  PAYMENT_EXPIRED:       [],
}

// PROVIDER = pemilik usaha. WORKER = pekerja yang ditugaskan.
// Keduanya bisa jadi orang yang sama pada provider INDIVIDUAL, tapi
// pemeriksaannya tetap dua jalur berbeda supaya BUSINESS ikut benar.
export const ALLOWED_ACTORS: Record<string, OrderActorType[]> = {
  // T1 dan T2: WORKER hanya sah pada mode AVAILABLE_NOW.
  // Pemeriksaan mode dilakukan di assertActorForMode(), bukan di sini,
  // karena tabel ini tidak tahu booking_mode.
  'PENDING_ACCEPTANCE->ACCEPTED':       ['PROVIDER', 'WORKER'],
  'PENDING_ACCEPTANCE->REJECTED':       ['PROVIDER', 'WORKER'],
  'PENDING_ACCEPTANCE->EXPIRED':        ['SYSTEM'],
  'PENDING_ACCEPTANCE->CANCELLED':      ['CLIENT'],
  'ACCEPTED->PAID':                     ['SYSTEM'],
  'ACCEPTED->PAYMENT_EXPIRED':          ['SYSTEM'],
  'ACCEPTED->CANCELLED':                ['CLIENT', 'PROVIDER'],
  'PAID->ON_THE_WAY':                   ['WORKER'],
  'PAID->CANCELLED':                    ['CLIENT', 'PROVIDER', 'ADMIN'],
  'ON_THE_WAY->ARRIVED':                ['WORKER'],
  'ON_THE_WAY->CANCELLED':              ['CLIENT', 'PROVIDER', 'ADMIN'],
  'ARRIVED->IN_PROGRESS':               ['WORKER'],
  'IN_PROGRESS->AWAITING_VERIFICATION': ['WORKER'],
  'AWAITING_VERIFICATION->COMPLETED':   ['WORKER'],
  'COMPLETED->SETTLED':                 ['SYSTEM'],
  'DISPUTED->SETTLED':                  ['ADMIN'],
  'DISPUTED->REFUNDED':                 ['ADMIN'],
  'CANCELLED->REFUNDED':                ['SYSTEM'],
  // Seluruh transisi ke DISPUTED. WORKER sengaja TIDAK termasuk:
  // putusan sengketa menyangkut dana usaha, jadi pemilik yang membuka.
  'ARRIVED->DISPUTED':                  ['CLIENT', 'PROVIDER'],
  'IN_PROGRESS->DISPUTED':              ['CLIENT', 'PROVIDER'],
  'AWAITING_VERIFICATION->DISPUTED':    ['CLIENT', 'PROVIDER'],
  'COMPLETED->DISPUTED':                ['CLIENT', 'PROVIDER'],
}

// Transisi yang HANYA boleh dilakukan pekerja yang benar-benar ditugaskan,
// bukan sembarang pekerja di usaha itu. Pendamping juga tidak termasuk.
export const ASSIGNEE_ONLY_TRANSITIONS = new Set([
  'PAID->ON_THE_WAY',
  'ON_THE_WAY->ARRIVED',
  'ARRIVED->IN_PROGRESS',
  'IN_PROGRESS->AWAITING_VERIFICATION',
  'AWAITING_VERIFICATION->COMPLETED',
])
```

Satu-satunya pintu masuk perubahan status:

```ts
// apps/api/src/services/order-transition.service.ts

export async function transitionOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
  toStatus: OrderStatus,
  actor: OrderActorType,
  actorUserId?: string,
  reason?: string,
) {
  // Kunci barisnya supaya dua request bersamaan tidak sama-sama lolos.
  const [order] = await tx.$queryRaw<Order[]>`
    SELECT * FROM orders WHERE id = ${orderId}::uuid FOR UPDATE
  `
  if (!order) throw new NotFoundError('Order tidak ditemukan')

  const key = `${order.status}->${toStatus}`

  if (!ALLOWED_TRANSITIONS[order.status].includes(toStatus)) {
    throw new ConflictError(`Transisi ${key} tidak diizinkan`)
  }
  if (!ALLOWED_ACTORS[key]?.includes(actor)) {
    throw new ForbiddenError(`${actor} tidak berhak melakukan transisi ${key}`)
  }

  // WORKER hanya sah menerima atau menolak pada mode AVAILABLE_NOW (D70).
  if (actor === 'WORKER'
      && key.startsWith('PENDING_ACCEPTANCE->')
      && order.bookingMode !== 'AVAILABLE_NOW') {
    throw new ForbiddenError(
      'Order terjadwal hanya bisa diterima atau ditolak pemilik usaha'
    )
  }

  // Transisi pelaksanaan hanya boleh oleh pekerja yang DITUGASKAN,
  // bukan sembarang pekerja di usaha itu, dan bukan pendamping.
  if (ASSIGNEE_ONLY_TRANSITIONS.has(key)) {
    const worker = await getWorkerByUserId(tx, actorUserId!)
    if (!worker || worker.id !== order.assignedWorkerId) {
      throw new ForbiddenError(
        'Hanya penanggung jawab order ini yang boleh melakukan transisi'
      )
    }
  }

  await assertGuards(tx, order, toStatus)          // Bagian 3, kolom Guard

  await tx.order.update({
    where: { id: orderId },
    data: { status: toStatus, ...timestampFor(toStatus) },
  })

  await tx.orderStatusHistory.create({
    data: {
      orderId,
      fromStatus: order.status,
      toStatus,
      actor,
      changedByUserId: actorUserId,
      reason,
    },
  })

  await runSideEffects(tx, order, toStatus)        // Bagian 3, kolom Efek Samping
}
```

Lima hal yang membuat fungsi ini benar dan gampang dilupakan:

`SELECT ... FOR UPDATE` mengunci baris order. Tanpa ini, dua request bersamaan bisa sama-sama membaca status `PENDING_ACCEPTANCE`, sama-sama lolos pengecekan, dan menghasilkan dua kali efek samping.

Pengecekan aktor dipisah dari pengecekan transisi. Transisi `COMPLETED -> SETTLED` legal, tapi hanya boleh dilakukan `SYSTEM`. Kalau client memanggil endpoint yang memicunya, itu 403 Forbidden, bukan 409 Conflict.

**Pengecekan `ASSIGNEE_ONLY_TRANSITIONS` adalah lapis ketiga**, dan yang paling mudah terlupa. Tanpa itu, seorang pekerja di usaha yang sama bisa menekan Berangkat untuk order rekannya, atau memasukkan kode verifikasi order orang lain. Peran `WORKER` saja tidak cukup, identitasnya harus cocok dengan `assigned_worker_id`.

**Klaim Available Now tidak lewat fungsi ini**, melainkan lewat UPDATE bersyarat atomik (Bagian 3.2) yang dijalankan lebih dulu, baru guard-nya diperiksa di dalam transaksi yang sama. `SELECT ... FOR UPDATE` tidak cukup untuk kasus itu, karena barisnya belum terkunci saat lima pekerja menekan tombol bersamaan.

`runSideEffects` menerima `tx`, bukan `prisma`. Kalau tidak, efek sampingnya jalan di luar transaksi dan bisa bertahan meskipun transisinya gagal.

---

## 9. Pemetaan ke Pengujian

Setiap baris di Bagian 2 menghasilkan minimal dua test case Black Box:

| Jenis | Cara menyusun | Jumlah |
|---|---|---|
| Positif | Jalankan transisi dengan guard terpenuhi, verifikasi status berubah, `order_status_histories` bertambah satu baris, dan efek sampingnya terjadi | 22 |
| Negatif, guard gagal | Jalankan transisi dengan guard sengaja dilanggar, verifikasi ditolak 409 dan **tidak ada** baris histori baru | 22 |
| Negatif, aktor salah | Jalankan transisi dengan aktor yang tidak berhak, verifikasi ditolak 403 | 18 |
| **Negatif, pekerja salah** | Jalankan transisi pelaksanaan dengan pekerja lain di usaha yang sama, verifikasi ditolak 403 | **5** |
| Negatif, transisi ilegal | Coba lompat, misalnya `PENDING_ACCEPTANCE -> COMPLETED`, verifikasi ditolak 409 | minimal 10 |
| **Operasi non-transisi** | Penggantian penanggung jawab dan perubahan pendamping, positif dan negatif | **8** |

Totalnya sekitar **85 test case** hanya untuk modul order, naik dari 72. Ini melengkapi dokumen `PPL_A_2305551065_UAS.docx` yang sudah memuat 127 test case, dan kolom Guard di Bagian 3 memberi skenario negatif yang konkret, bukan karangan.

Lima skenario negatif yang paling layak ditonjolkan di laporan:

1. Kirim webhook `invoice.paid` yang sama dua kali. Harapan: ledger hanya bertambah satu baris `ESCROW_HOLD`.
2. **Dua pekerja mengklaim order Available Now yang sama pada saat bersamaan.** Harapan: tepat satu berhasil, yang kalah dapat 409 `ORDER_ALREADY_CLAIMED`. Ini wajib integration test yang benar-benar menembakkan dua request paralel, bukan unit test (H38).
3. Tugaskan satu pekerja ke dua order in-flight. Harapan: yang kedua ditolak oleh `uniq_inflight_order_per_worker`.
4. **Pekerja lain di usaha yang sama menekan Berangkat untuk order yang bukan miliknya.** Harapan: 403, bukan berhasil.
5. Masukkan kode verifikasi salah enam kali. Harapan: percobaan keenam ditolak karena lockout, bukan karena kodenya salah.

Ditambah dua skenario bentrok jadwal yang tidak dijaga basis data (H25), jadi harus diuji di service layer: order berdempetan persis, dan order yang hanya beririsan di buffer.

---

## 10. Diagram

Sumber diagram ada di `state-machine-order.mermaid`. Untuk laporan, render di mermaid.live lalu ekspor sebagai SVG atau PNG beresolusi tinggi.

```
                    [mulai]
                       |
                       v
         +-- PENDING_ACCEPTANCE --+--------+--------+
         |          |             |        |        |
      ACCEPTED   REJECTED*    EXPIRED*  CANCELLED*  |
         |
         |  <-- pekerja DITUGASKAN di sini (D42)
         |
    +----+----+----------+
    |         |          |
  PAID   PAYMENT_     CANCELLED*
    |    EXPIRED*
    |
    +----+---------+
    |              |
 ON_THE_WAY   CANCELLED*
    |
    |  <-- daftar pendamping DIBEKUKAN di sini (D69)
    |
    +----+---------+
    |              |
 ARRIVED      CANCELLED*
    |    \
    |     \
IN_PROGRESS \
    |    \   \
    |     \   \
AWAITING_  \   \
VERIFICATION\   \
    |    \   \   \
COMPLETED \   \   \
    |    \ \   \   \
    |     v v   v   v
    |      DISPUTED
    |       |     \
    v       v      v
  SETTLED*      REFUNDED*

  * = state terminal
  CANCELLED lanjut ke REFUNDED kalau sudah ada pembayaran lunas

  Transisi ON_THE_WAY sampai COMPLETED hanya boleh oleh pekerja
  yang tercatat di assigned_worker_id, bukan sembarang pekerja.
```

Diagram ASCII di atas hanya untuk orientasi cepat. Gunakan versi Mermaid untuk laporan.

---

## Lampiran. Riwayat Revisi

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 17 September 2026 | Versi awal. 15 state, 22 transisi, guard dan efek samping, tiga aturan alur uang |
| 2.6 | 30 September 2026 | Menyesuaikan D78 dan D79. Jalur `order_messages` dibuka pada efek samping T1, jadi read-only saat T18, dan otomatis jadi bukti saat transisi ke DISPUTED. Bagian 4.3 baru |
| 2.5 | 30 September 2026 | Menyesuaikan D31 sampai D77. Aktor WORKER ditambahkan, transisi pelaksanaan pindah ke pekerja yang ditugaskan. Guard T1 memeriksa pemetaan listing, kunci in-flight per pekerja, dan bentrok jadwal per pekerja. Klaim atomik untuk Available Now (Bagian 3.2). Bagian 4 baru: operasi non-transisi (penggantian penanggung jawab dan pendamping). Toggle `listings.is_available_now` dihapus dari efek samping. Aturan auto-reject antrean dihapus. Test case naik dari 72 jadi 85 |
