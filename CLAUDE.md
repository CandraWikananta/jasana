# Jasana, Backend

Marketplace jasa on-demand berbasis web. Ini kode untuk Tugas Akhir, jadi **dokumen desain adalah sumber kebenaran, bukan kode**. Kalau kode dan dokumen berbeda, dokumennya yang menang sampai ada keputusan baru yang dicatat.

## Dokumen rujukan

| Berkas | Isi |
|---|---|
| `docs/Keputusan-Desain-Sistem.md` | Register keputusan D1 sampai D80 beserta alasannya. **Baca ini kalau ragu kenapa sesuatu dirancang begitu** |
| `docs/State-Machine-Order.md` | 15 status, 22 transisi, guard, efek samping, dan kode `ALLOWED_TRANSITIONS` |
| `docs/PRD-Backend.md` | Kontrak endpoint, NFR, cron, Socket.IO, milestone |
| `packages/database/prisma/schema.prisma` | 34 model, 35 enum |
| `packages/database/prisma/migrations/*/migration.sql` | Termasuk constraint manual |

Jangan mengubah keputusan desain sendiri. Kalau menemukan alasan kuat untuk mengubah sesuatu, **sampaikan usulannya, jangan langsung terapkan.** Setiap keputusan punya nomor D dan harus dicatat di register sebelum masuk kode.

## Stack

Node.js 20, Express + TypeScript, Prisma 6.19.3 (**versinya dipin, jangan `npm install prisma` tanpa versi**), PostgreSQL via Supabase, Socket.IO, Zod, Pino, Vitest.

Tidak memakai Redis. Rate limiting in-memory dan cache sub-kategori TTL 5 menit, valid karena API berjalan satu instance.

## Struktur

```
apps/api/src/
  config/        env loader (Zod), konstanta
  middlewares/   auth, rbac, emailVerified, validate, rateLimit, errorHandler
  modules/<domain>/
      *.routes.ts  *.controller.ts  *.service.ts  *.schema.ts
  jobs/          cron
  realtime/      Socket.IO
  lib/           haversine, crypto, xendit, gemini, mailer, supabase
packages/
  database/prisma/
  shared/        order-state-machine.ts, tipe bersama
```

Dua aturan lapisan yang mengikat:

- **Controller tidak boleh menyentuh Prisma**
- **Service tidak boleh menyentuh `req` atau `res`**

Logika bisnis seluruhnya di service supaya bisa diuji tanpa HTTP.

---

## Tiga belas aturan yang tidak boleh dilanggar

1. `orders.status` hanya berubah lewat `transitionOrder()`. Satu-satunya pengecualian adalah klaim atomik Available Now, yang tetap menjalankan seluruh guard di transaksi yang sama
2. Transisi pelaksanaan hanya boleh oleh `orders.assigned_worker_id`, **bukan sembarang pekerja di usaha yang sama**
3. Baris `wallet_transactions` tidak pernah di-UPDATE atau dihapus. Koreksi lewat baris `ADJUSTMENT` berlawanan arah
4. Satu order hanya boleh punya satu `ESCROW_HOLD` dan satu `ESCROW_RELEASE`, selamanya
5. Saldo didebit saat withdrawal **diajukan**, bukan saat selesai
6. Refund selalu memotong `balance_pending`, tidak pernah `balance_available`
7. **Harga selalu dihitung ulang di server.** Request tidak pernah memuat nominal
8. Harga, atribut, opsi terpilih, dan nama penanggung jawab di-snapshot ke order saat pemesanan
9. Haversine dihitung di server, tidak pernah mempercayai jarak dari client
10. Seluruh deadline disimpan sebagai kolom, tidak pernah sebagai timer di memori
11. Setiap provider wajib punya minimal satu pekerja `ACTIVE` dengan `accepts_assignments = true`
12. Listing tidak boleh berpindah dari `DRAFT` ke `ACTIVE` tanpa pekerja terpetakan
13. Unggahan multipart divalidasi lewat **magic bytes**, dan barisnya ditulis hanya setelah berkasnya benar-benar masuk Storage

---

## Jebakan yang sering terjadi

### 1. Jangan tambahkan `@@unique([userId])` ke `ProviderWorker`

Terlihat benar, tapi salah. Aturannya "satu orang satu keanggotaan **AKTIF**", bukan satu keanggotaan seumur hidup. Unique biasa membuat orang yang sudah resign tidak bisa bergabung ke usaha lain selamanya.

Yang benar partial unique index di `migration-constraints.sql`:

```sql
CREATE UNIQUE INDEX uniq_active_worker_membership
  ON provider_workers (user_id)
  WHERE membership_status = 'ACTIVE';
```

Prisma tidak bisa menyatakan partial unique index. Itu bukan kekurangan yang perlu diakali.

### 2. `migration-constraints.sql` wajib dijalankan

`prisma migrate dev` berjalan mulus tanpanya dan semua terlihat normal, sampai suatu saat dua order masuk ke satu pekerja atau ledger dobel. **Dua belas pengaman kritikal ada di file itu, bukan di `schema.prisma`.**

```bash
npx prisma migrate dev --name init
npx prisma migrate dev --create-only --name add_integrity_constraints
# salin isi migration-constraints.sql ke migration.sql yang baru dibuat
npx prisma migrate dev
```

Setelah itu jalankan kueri verifikasi V1 sampai V12 di akhir file tersebut. V1, V5, V6, V7, V8, V11, dan V12 harus mengembalikan **nol baris**.

### 3. Jangan pakai `now()` di CHECK constraint

PostgreSQL menolaknya karena tidak immutable. Aturan yang bergantung pada waktu berjalan **harus** di service layer:

- Masa aktif pesan dalam order
- Batas membuka dispute
- Kedaluwarsa kode verifikasi

### 4. Harga tidak pernah datang dari client

`POST /orders` menerima **pilihan opsi**, bukan angka. Body yang memuat `total_amount`, `platform_fee`, atau `provider_earning` harus diabaikan, bukan dipakai.

```
listing_base_amount = listings.price
options_amount      = jumlah delta dari listing_option_prices sesuai pricing_mode
total_amount        = listing_base_amount + options_amount
platform_fee        = total_amount * platform_fee_percentage
provider_earning    = total_amount - platform_fee
```

Kalau client boleh mengirim total, siapa pun bisa memesan jasa premium seharga seribu rupiah lewat Postman.

### 5. Tiga lapis pemeriksaan di transisi order, bukan dua

```ts
// 1. transisi legal?
if (!ALLOWED_TRANSITIONS[order.status].includes(toStatus)) throw Conflict   // 409

// 2. peran berhak?
if (!ALLOWED_ACTORS[key]?.includes(actor)) throw Forbidden                  // 403

// 3. IDENTITAS cocok?  <- paling sering terlupa
if (ASSIGNEE_ONLY_TRANSITIONS.has(key)) {
  const worker = await getWorkerByUserId(tx, actorUserId)
  if (!worker || worker.id !== order.assignedWorkerId) throw Forbidden      // 403
}
```

`ASSIGNEE_ONLY_TRANSITIONS` berisi lima transisi: depart, check-in, start, finish, verify. Tanpa lapis ketiga, pekerja lain di usaha yang sama bisa menekan Berangkat untuk order rekannya atau memasukkan kode verifikasi order orang lain.

Pendamping di `order_crew` **tidak punya hak transisi apa pun**.

### 6. Klaim Available Now tidak lewat `transitionOrder()`

`SELECT ... FOR UPDATE` tidak cukup saat lima pekerja menekan tombol bersamaan, karena barisnya belum terkunci. Pakai UPDATE bersyarat atomik lebih dulu, baru guard diperiksa di transaksi yang sama:

```sql
UPDATE orders
SET    status = 'ACCEPTED', assigned_worker_id = $1,
       accepted_by = $2, accepted_at = now()
WHERE  id = $3 AND status = 'PENDING_ACCEPTANCE' AND assigned_worker_id IS NULL
RETURNING id;
```

Nol baris berarti sudah keduluan: 409 `ORDER_ALREADY_CLAIMED`. **Jangan pakai pola baca lalu cek**, dua orang yang menekan pada detik yang sama bisa lolos berdua.

Pola yang sama dipakai untuk lock `webhook_events`.

### 7. Panggilan API eksternal tidak boleh di dalam transaksi

Xendit, Gemini, dan SMTP semuanya di luar transaksi. Pola yang benar: commit dulu, panggil API, perbarui hasilnya lewat webhook.

Untuk email, baris `notifications` ditulis **di dalam** transaksi, pengirimannya **setelah** commit. Kegagalan SMTP tidak pernah membatalkan transisi order.

### 8. Webhook butuh dua transaksi terpisah

Transaksi 1 mencatat event dan commit langsung. Transaksi 2 memproses bisnisnya. Kalau digabung, baris event ikut ter-roll back saat proses gagal dan `processing_status = FAILED` tidak akan pernah terisi.

### 9. `listings.is_available_now` tidak ada

Kolom itu sudah dibuang (D45). Status online adalah **turunan**: listing bisa dipesan mendadak kalau punya minimal satu pekerja terpetakan yang `is_available = true`, presence belum basi, dan tidak in-flight.

Filter `available_now=true` adalah join ke `worker_listings` dan `provider_workers`, bukan membaca kolom.

### 10. Filter lokasi: bounding box dulu, baru Haversine

Kalau Haversine dihitung untuk semua baris, index tidak terpakai dan hasil stress testing jelek.

### 11. Empat aturan yang hanya hidup di service layer

Database tidak menjaganya, jadi wajib punya unit test sendiri:

| Aturan | Rujukan |
|---|---|
| Bentrok jadwal antar order `SCHEDULED` | H25, rumus di State Machine Bagian 3.1 |
| Pendamping ikut diblokir ketersediaannya | H45 |
| Masa aktif pesan dalam order | H70 |
| Pengirim pesan wajib peserta order | H71 |

Untuk bentrok jadwal, uji dua kasus batas: order yang berdempetan persis, dan order yang hanya beririsan di buffer.

### 12. Dua pola unggah berkas, jangan disamakan

Sifat berkasnya berbeda, jadi polanya juga berbeda (D80).

| Berkas | Pola | Endpoint |
|---|---|---|
| Dokumen e-KYC | **Multipart lewat API** | `POST /providers/me/kyc-documents` |
| Bukti dispute | **Multipart lewat API** | `POST /disputes/:id/evidences` |
| Foto listing | Signed URL langsung ke Storage | `POST /uploads/signed-url` |

Untuk jalur multipart:

```ts
// multer memoryStorage, BUKAN diskStorage
// Jangan meninggalkan berkas sementara di server.

// 1. Batas ukuran dari platform_settings  -> 413 kalau lewat
// 2. Periksa MAGIC BYTES, bukan Content-Type dan bukan ekstensi nama
//    -> 422 UNSUPPORTED_FILE_TYPE
// 3. Unggah ke Storage bucket private     -> 502 kalau gagal
// 4. BARU tulis baris basis data
```

**Urutan 3 dan 4 tidak boleh dibalik.** Kalau baris ditulis lebih dulu lalu unggah gagal, ada dokumen tercatat yang berkasnya tidak ada, dan admin melihat pengajuan yang tidak bisa diperiksa.

**`Content-Type` dikirim client dan bisa dipalsukan.** Berkas `.exe` bernama `ktp.jpg` dengan `Content-Type: image/jpeg` akan lolos kalau yang diperiksa hanya headernya. Periksa byte pertamanya.

Jalur signed URL punya celah **berkas yatim**: kalau frontend mengunggah lalu tidak pernah memanggil endpoint pencatat metadata, berkasnya nyangkut tanpa baris basis data. Ditutup cron harian, jangan dilupakan.

### 13. Penamaan yang jangan tertukar

| Jangan | Pakai | Alasan |
|---|---|---|
| `chat` untuk pesan dalam order | `order_messages`, "pesan dalam order" | `chat_sessions` dan `chat_messages` milik chatbot AI |
| `base_price` | `listing_base_amount` | Isinya tidak lagi harga dasar sejak ada opsi berbayar |
| `price` untuk nominal order | `amount` | `price` untuk daftar harga, `amount` untuk yang melekat pada order |
| Role `PROVIDER` atau `WORKER` | Cek relasi | Keduanya bukan nilai enum `role` |

---

## Empat aktor, dua nilai role

| Aktor | Cara mengenalinya |
|---|---|
| Client | Setiap user yang login |
| Provider | Punya `provider_profiles` berstatus `VERIFIED` |
| Pekerja | Punya `provider_workers` berstatus `ACTIVE` |
| Admin | `users.role = 'ADMIN'` |

Ini konsekuensi dual-role: satu akun bisa jadi client sekaligus provider sekaligus pekerja di usaha orang lain. Kalau PROVIDER dijadikan nilai role, seorang provider tidak bisa memesan jasa orang lain.

Middleware berlapis: `requireAuth`, `requireEmailVerified`, `requireProvider`, `requireWorker`, `requireAdmin`, `requireOrderParticipant`, `requireAssignedWorker`.

---

## Urutan pengerjaan

Ikuti milestone di PRD Bagian 9. Satu fase sampai tuntas sebelum pindah.

```
0.  Fondasi        monorepo, migrasi, constraint, health check, error handler, env
1.  Auth           login, refresh + rotasi, verifikasi email, reset password
2.  Provider dan pekerja
3.  Katalog        atribut dinamis, attribute_role, pricing_mode
4.  Listing        harga opsi, FAQ, pemetaan pekerja
5.  Pencarian      bounding box, Haversine, available_now turunan
6.  Order          transitionOrder, klaim atomik, kru, cron SLA
7.  Pembayaran     invoice, webhook, ledger escrow
8.  Uang lanjutan  withdrawal, refund, dispute
9.  Chatbot        sesi tamu dan terdaftar, rate limit tiga lapis
10. Pelengkap      review, pesan dalam order, email, laporan
```

Pekerja sengaja ditaruh sedini Fase 2, karena pemetaan listing, filter pencarian, dan seluruh transisi pelaksanaan bergantung padanya.

## Konvensi kode

| Aspek | Ketentuan |
|---|---|
| TypeScript | `strict: true` |
| Validasi | Zod pada seluruh body, query, dan param |
| Uang di JSON | Integer rupiah. Tidak ada pecahan sen |
| Uang di DB | `Decimal`, jangan pernah `Float` |
| Koordinat | `Decimal(10,8)` lintang, `Decimal(11,8)` bujur. Jangan `Float`, galat pembulatannya bisa menggeser hasil validasi radius |
| Timestamp | `timestamptz`, ISO 8601 UTC di JSON |
| Penamaan kolom | `snake_case` di DB, `camelCase` di Prisma lewat `@map` |
| Kueri N+1 | Dilarang. Pakai `include` atau `select` eksplisit |
| Query mentah | Hanya untuk `SELECT ... FOR UPDATE` dan klaim atomik, keduanya dengan parameter terikat |
| Log | Pino, terstruktur, dengan `request_id` per permintaan |

## Pengujian

| Jenis | Alat | Catatan |
|---|---|---|
| Unit | Vitest | Haversine, kalkulasi nominal, validator atribut, `ALLOWED_TRANSITIONS`, bentrok jadwal |
| Integrasi | Vitest + Supertest | Termasuk transaksi dan constraint |
| Stress | k6 | Pencarian listing, webhook, klaim paralel |

Tujuh skenario negatif yang wajib ada, lengkapnya di PRD Bagian 8.2:

1. Webhook `invoice.paid` dikirim dua kali, ledger hanya bertambah satu `ESCROW_HOLD`
2. **Dua klaim paralel untuk satu order, tepat satu berhasil.** Wajib integration test dengan dua request sungguhan, bukan unit test
3. Satu pekerja ditugaskan ke dua order in-flight, yang kedua ditolak constraint
4. Pekerja lain menekan Berangkat untuk order yang bukan miliknya, harus 403
5. `total_amount` palsu di body, harus diabaikan
6. Kode verifikasi salah enam kali, yang keenam ditolak karena lockout
7. Dua order Scheduled beririsan untuk pekerja yang sama, yang kedua ditolak

## Yang di luar cakupan

Jangan membangun ini walaupun terasa kurang lengkap. Semuanya keputusan sadar yang tercatat:

- Percakapan pra-order dan pesan bebas antar pengguna (D78, D79)
- Push notification ke perangkat, FCM maupun Web Push
- Model broadcast dan tawar-menawar (D23)
- Pelemparan berantai order Available Now kalau semua menolak (D56)
- Lampiran pada pesan dalam order (D79)
- Dompet dan penggajian pekerja (D48)
- Pencatatan seluruh kru yang hadir, hanya penanggung jawab dan pendamping (D68)
- Order multi-kunjungan dan penyerahan hasil digital bertahap (D75)
- Verifikasi identitas pekerja oleh platform, itu tanggung jawab pemilik usaha (D34)
- Multi-currency, microservices, message queue
