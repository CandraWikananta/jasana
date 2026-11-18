# PRD Frontend: Jasana

**Platform Marketplace Jasa On-Demand Berbasis Web yang Terintegrasi dengan Kecerdasan Buatan**

| | |
|---|---|
| Versi | 1.2 |
| Penyusun | I Nyoman Gede Candra Wikananta (2305551065) |
| Program Studi | Teknologi Informasi, Universitas Udayana |
| Bidang Keahlian | Sistem Informasi |
| Tanggal | 18 November 2026 |
| Cakupan dokumen | **Frontend saja** (`apps/web`, Next.js). Logika bisnis, basis data, dan integrasi eksternal ada di `PRD-Backend.md` |

**Artefak frontend:**

| # | Berkas | Isi |
|---|---|---|
| 1 | `PRD-Frontend.md` | Dokumen ini: arsitektur, usulan keputusan, peta rute, spesifikasi halaman, milestone |
| 2 | `Design-System.md` | Token, tipografi, komponen, label status, format, glosarium |
| 3 | `Matriks-UI-Order.md` | Tampilan dan tombol per status order per penampil, spesifikasi `getOrderActions()` |
| 4 | `apps/web/CLAUDE.md` | Aturan mengikat dan jebakan untuk Claude Code |

**Dokumen rujukan backend:** `PRD-Backend.md`, `State-Machine-Order.md`, `Keputusan-Desain-Sistem.md`, `schema.prisma`.

> **Catatan sinkronisasi.** Versi awal dokumen ini disusun dari register v2.11 dan PRD Backend v2.5. Sejak versi 1.1, usulan FE1 sampai FE14 sudah disetujui dan dicatat di register **v2.43 sebagai D210 sampai D223**, ditambah D224 sampai D230 dari implementasi W0 dan W2, dan D231 sampai D235 dari sesi login (register v2.44). **Kontrak endpoint di dokumen ini adalah peta, bukan kontrak final.** Sebelum setiap fase, Claude Code wajib mencocokkan endpoint yang dipakai dengan `docs/PRD-Backend.md` terbaru dan `apps/api/src/modules/*/*.routes.ts` serta `*.schema.ts`. Daftar hal yang wajib dicek ada di Bagian 12, dan temuan dari fase yang sudah berjalan ada di Bagian 12.3.

---

## Daftar Isi

1. [Overview dan Tujuan](#1-overview-dan-tujuan)
2. [Arsitektur dan Tech Stack](#2-arsitektur-dan-tech-stack)
3. [Usulan Keputusan Frontend](#3-usulan-keputusan-frontend)
4. [Area, Navigasi, dan Peta Rute](#4-area-navigasi-dan-peta-rute)
5. [Spesifikasi Halaman Kunci](#5-spesifikasi-halaman-kunci)
6. [Formulir Atribut Dinamis](#6-formulir-atribut-dinamis)
7. [Komunikasi dengan API](#7-komunikasi-dengan-api)
8. [Real-Time](#8-real-time)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Pengujian dan Dukungan UAT](#10-pengujian-dan-dukungan-uat)
11. [Milestone Implementasi](#11-milestone-implementasi)
12. [Pertanyaan Terbuka dan Hal yang Wajib Dicek](#12-pertanyaan-terbuka-dan-hal-yang-wajib-dicek)

---

## 1. Overview dan Tujuan

### 1.1 Konteks

Frontend Jasana adalah **satu aplikasi Next.js** untuk tamu dan empat aktor (client, provider, pekerja, admin). Aplikasi ini mengonsumsi REST API Express dan Socket.IO yang sudah selesai dibangun (Fase 0 sampai 10 backend).

**Frontend tidak punya logika bisnis sendiri.** Harga, status, batas waktu, dan hak melakukan aksi seluruhnya ditentukan server. Frontend menampilkan, mengumpulkan pilihan pengguna, dan meneruskannya. Prinsip ini sejalan dengan aturan backend "harga selalu dihitung ulang di server" dan "status hanya berubah lewat `transitionOrder()`".

Konsekuensi dual-role tetap berlaku di sisi tampilan: **satu akun bisa membuka beberapa area** (pelanggan, usaha, pekerja) tergantung relasi yang dimilikinya, bukan tergantung nilai `role`.

### 1.2 Tujuan

| # | Tujuan | Ukuran keberhasilan |
|---|---|---|
| W-O1 | **Setiap skenario UAT bisa dijalankan lewat UI** | Seluruh skenario per aktor di Bagian 10.3 bisa diselesaikan tanpa Postman, dengan target kategori Layak per aspek dan per aktor (D85) |
| W-O2 | **UI tidak pernah jadi sumber kebenaran** | Tidak ada nominal di body request. Tombol aksi order hanya dari `getOrderActions()`. Tidak ada parameter `platform_settings` yang ditulis ulang di frontend |
| W-O3 | **Satu produk, empat area** | Seluruh komponen membaca token `Design-System.md`. Tidak ada warna atau ukuran lepas di kode |
| W-O4 | **Pekerja menjalankan seluruh alur lapangan dari HP** | Toggle ketersediaan, terima tawaran, berangkat, check-in GPS, mulai, selesai, dan verifikasi kode berjalan mulus di lebar 390 px |
| W-O5 | **Tawaran Available Now terasa seketika** | Kartu tawaran muncul di layar pekerja dan pemilik lewat Socket.IO tanpa memuat ulang halaman, dan hilang dari layar yang kalah saat sudah diklaim |
| W-O6 | **Asisten bisa dipakai tamu dan pengguna login** | Rekomendasi Asisten tampil sebagai kartu jasa yang bisa langsung dibuka dan dipesan. Sesi tamu tetap tersambung setelah mendaftar (D77) |

### 1.3 Non-Goals

Yang secara sadar **tidak** dibangun di frontend:

- Mode gelap
- Multi-bahasa. Antarmuka hanya Bahasa Indonesia
- PWA, mode offline, dan push notification ke perangkat (non-goal backend, H42). Pekerja membiarkan tab terbuka untuk menerima tawaran
- Aplikasi native Android atau iOS
- Percakapan pra-order antara client dan penyedia (D78, D79)
- Lampiran pada pesan dalam order (D79)
- Pembayaran di dalam halaman Jasana. Pembayaran memakai halaman invoice Xendit
- Layanan geocoding pihak ketiga (FE9)
- SEO lanjutan (sitemap, data terstruktur). Cukup metadata dasar per halaman publik
- Analytics dan pelacakan pihak ketiga
- Grafik interaktif di laporan admin. Tabel sudah cukup, grafik sederhana opsional

---

## 2. Arsitektur dan Tech Stack

### 2.1 Pola Arsitektur

```
                         Browser
     ┌───────────────────────┼──────────────────────────────┐
     │                       │                              │
     │ halaman               │ REST + Bearer access token   │ PUT berkas
     v                       v                              v
 Next.js (apps/web)     Express API /api/v1            Supabase Storage
  ├─ Server Components   + Socket.IO                    (foto listing,
  │  (halaman publik)        ^                           signed URL)
  └─ Route Handler           │
     /api/session/*  ────────┘ server-ke-server:
     (cookie refresh token)    /auth/login, /auth/refresh, /auth/logout

 Browser ──tile──────> OpenStreetMap
 Browser ──redirect──> halaman invoice Xendit ──kembali──> /pesanan/[id]
```

Tiga aturan arsitektur:

1. **Seluruh data lewat Express.** `apps/web` tidak pernah mengimpor `@prisma/client`, `packages/database`, atau kode dari `apps/api`, dan tidak memakai Server Action untuk menulis data. Kalau aturan ini dilanggar, `transitionOrder()`, perhitungan harga server, dan seluruh guard terlewati tanpa terlihat
2. **Route Handler Next.js hanya untuk sesi** (FE3). Tidak ada endpoint bisnis yang dibuat ulang di Next
3. **Socket.IO hanya pemberitahuan.** Perubahan state tetap lewat REST (PRD Backend Bagian 7.2)

### 2.2 Tech Stack

| Lapisan | Pilihan | Catatan |
|---|---|---|
| Framework | **Next.js 16**, App Router, Turbopack | Sesuai S1 dan usulan ide bagian 3.4. Sejak Next.js 16, berkas `middleware.ts` bernama **`proxy.ts`** |
| UI | React 19, TypeScript `strict: true` | |
| Styling | **Tailwind CSS v4** | Sesuai S1. Konfigurasi token lewat CSS (`@theme`), lihat Design System Bagian 13 |
| Komponen dasar | shadcn/ui (Radix), `lucide-react` | Komponen disalin ke repo, jadi bisa dibaca dan diubah |
| Data fetching | TanStack Query v5 | Cache, refetch, invalidasi dari event socket |
| Formulir | react-hook-form + Zod | |
| Real-time | `socket.io-client` | Sesuai S5 |
| Peta | Leaflet + react-leaflet, tile OpenStreetMap | Sesuai S7. Dimuat dinamis tanpa SSR |
| Toast | sonner (bawaan shadcn) | |
| Huruf | Plus Jakarta Sans lewat `next/font/google` | |
| Pengujian | Vitest + Testing Library (unit), Playwright (smoke E2E dan verifikasi visual) | |

Versi persis mengikuti yang terpasang saat Fase W0 dan dicatat di `package.json`. **Jangan menaikkan versi mayor di tengah jalan** tanpa keputusan tercatat, sama seperti Prisma yang dipin di backend.

### 2.3 Struktur Folder

```
apps/web/
├── CLAUDE.md
├── next.config.ts
└── src/
    ├── proxy.ts                  # pengalihan kasar berdasarkan cookie penanda sesi (D231). Wajib di src/ karena app/ ada di src/
    ├── app/
    │   ├── (publik)/             # beranda, kategori, cari, listing, penyedia, asisten
    │   ├── (auth)/               # masuk, daftar, verifikasi email, lupa sandi, dst.
    │   ├── (pelanggan)/          # pesan, pesanan, akun, notifikasi
    │   ├── usaha/                # area pemilik usaha
    │   ├── pekerja/              # area pekerja
    │   ├── admin/                # area admin
    │   ├── api/session/          # Route Handler: login, refresh, logout
    │   ├── dev/ui/               # galeri komponen, development saja
    │   ├── layout.tsx
    │   ├── not-found.tsx
    │   └── globals.css           # token Design System
    ├── components/
    │   ├── ui/                   # shadcn/ui
    │   ├── layout/               # header, sidebar, bottom-nav, role-switcher
    │   └── shared/               # status-badge, money-text, countdown, empty-state, map-view, ...
    ├── features/
    │   └── <domain>/             # auth, catalog, listings, orders, payments, workers,
    │       ├── api.ts            #   providers, wallet, disputes, reviews, assistant,
    │       ├── queries.ts        #   notifications, admin
    │       ├── schemas.ts
    │       └── components/
    ├── lib/
    │   ├── api-client.ts         # fetch wrapper, envelope, ApiError, retry 401
    │   ├── session.ts            # access token di memori, single-flight refresh
    │   ├── socket.ts
    │   ├── query-keys.ts
    │   ├── error-messages.ts     # peta kode error -> pesan (Lampiran A)
    │   ├── order-status.ts       # ORDER_STATUS_META
    │   ├── enum-labels.ts
    │   ├── format.ts             # rupiah, jarak, durasi
    │   ├── time.ts               # WITA
    │   └── geo.ts                # geolocation, haversine panduan (bukan validasi)
    └── types/
        └── api/                  # tipe respons API, snake_case sesuai JSON
```

Nama grup rute dalam kurung tidak muncul di URL.

---

## 3. Usulan Keputusan Frontend

**Status: disetujui 18 November 2026**, dicatat di register v2.43 sebagai **D210 sampai D223** dengan urutan yang sama (FE1 = D210 sampai FE14 = D223). Nomor FE tetap boleh dipakai sebagai rujukan singkat di dokumen frontend. Keputusan lanjutan dari implementasi ada di register sebagai D224 sampai D230.

| # | Usulan | Alasan |
|---|---|---|
| FE1 (D210) | **App Router dengan grup rute per area.** URL halaman pengguna berbahasa Indonesia (`/cari`, `/pesanan`, `/usaha`, `/pekerja`) | Pengguna dan responden UAT melihat URL. Grup rute memisahkan layout dan guard tiap area tanpa mengubah URL |
| FE2 (D211) | **Server Component hanya untuk halaman publik** yang datanya sama untuk semua orang (beranda, kategori, detail listing, profil penyedia). Seluruh halaman yang butuh login memakai Client Component dan TanStack Query | Access token hanya ada di memori browser (FE3), jadi server Next memang tidak memegangnya. Satu pola per jenis halaman lebih mudah dijaga daripada campuran per komponen |
| FE3 (D212) | **Sesi lewat Route Handler tipis.** Refresh token disimpan di cookie `httpOnly` milik domain Next lewat `/api/session/login`, `/refresh`, `/logout`. Access token hanya di memori. Tidak ada token di `localStorage` atau `sessionStorage`. Refresh dibungkus *single-flight* di dalam tab dan `navigator.locks` antar tab | Dua alasan. **Pertama**, D76 memakai rotasi dengan deteksi pemakaian ulang: kalau dua tab me-refresh bersamaan dengan token yang sama, permintaan kedua terbaca sebagai pencurian dan **seluruh `family_id` dicabut**, pengguna ter-logout di semua tab. Dengan cookie, tab yang menunggu kunci otomatis mengirim token terbaru, karena browser membaca cookie saat request dibuat. **Kedua**, refresh token 30 hari di `localStorage` bisa dibaca script mana pun lewat XSS. **Syarat:** dicek dulu bahwa backend mengembalikan refresh token di body (Bagian 12) |
| FE4 (D213) | **Tipe respons API ditulis sendiri** di `src/types/api` dalam snake_case. Enum dan konstanta state machine diambil dari `packages/shared` | Menyempurnakan S11 untuk sisi frontend. Tipe Prisma tidak menggambarkan JSON API: nama field camelCase versus snake_case, `Decimal` versus number, `Date` versus string ISO. Mengimpor `@prisma/client` juga menyeret kode server ke bundle browser |
| FE5 (D214) | **Satu pintu aksi order: `getOrderActions()`** | Padanan `transitionOrder()` di sisi tampilan. Spesifikasinya `Matriks-UI-Order.md` |
| FE6 (D215) | **Seluruh waktu ditampilkan dan diinput dalam WITA** (UTC+08:00), label eksplisit, tidak mengikuti zona perangkat | Jadwal jasa terikat lokasi layanan, bukan lokasi perangkat. Lokasi data simulasi berada di zona WITA, dan responden atau penguji bisa memakai perangkat berzona lain. Indonesia tanpa waktu musim panas, jadi konversinya offset tetap |
| FE7 (D216) | **Pratinjau harga di client** memakai rumus D73 dan berlabel "Perkiraan". Angka final selalu dari respons server | Pengguna perlu melihat total berubah saat memilih opsi. Risikonya kecil, karena pembayaran baru terjadi setelah penyedia menerima (D19), dan client melihat rincian dari server sebelum membayar. Opsional: pindahkan fungsi hitung murni dari backend ke `packages/shared` supaya pratinjau dan server memakai kode yang sama |
| FE8 (D217) | **Satu koneksi Socket.IO per tab** setelah login. Event memicu invalidasi cache TanStack Query, kecuali posisi pekerja dan kartu tawaran yang disimpan sebagai state lokal | Menjaga satu sumber data per layar (respons REST). Event yang membawa data penuh mudah membuat tampilan berbeda dari server |
| FE9 (D218) | **Tanpa layanan geocoding.** Alamat diketik pengguna, titiknya dipilih di peta atau dari GPS | Nominatim (geocoding gratis OpenStreetMap) punya kebijakan pemakaian ketat. Validasi kehadiran hanya butuh koordinat, bukan alamat hasil geocoding |
| FE10 (D219) | **Bahasa Indonesia saja, tanpa library i18n.** Sapaan "kamu", istilah mengikuti glosarium Design System | Satu bahasa tidak butuh lapisan terjemahan. Glosarium menjaga konsistensi istilah |
| FE11 (D220) | **Area ditentukan kapabilitas, bukan role.** Menu area muncul dari `GET /auth/me`. Pemilik provider INDIVIDUAL melihat area Usaha **dan** area Pekerja | Konsekuensi D4, D33, dan D35. Pemilik selalu terdaftar sebagai pekerja di usahanya sendiri, jadi dialah yang menekan Berangkat dan check-in |
| FE12 (D221) | **Pola unggah mengikuti D80.** e-KYC dan bukti komplain multipart ke API, foto listing lewat signed URL lalu wajib memanggil endpoint pencatat. Cek ukuran dan tipe di client hanya untuk kenyamanan | Server tetap memeriksa magic bytes. Cek di client hanya supaya pengguna tidak menunggu unggahan yang pasti ditolak |
| FE13 (D222) | **Tanpa mode gelap dan tanpa PWA** | Tidak menambah nilai pada pertanyaan penelitian, dan menggandakan pekerjaan pengecekan visual |
| FE14 (D223) | **Pengujian frontend:** Vitest untuk fungsi murni dan `getOrderActions()`, Playwright untuk smoke E2E alur utama. Pengujian utama tetap Black Box dan UAT | Uji otomatis difokuskan pada logika yang paling mahal kalau salah, yaitu tombol order dan perhitungan tampilan |

---

## 4. Area, Navigasi, dan Peta Rute

### 4.1 Area

| Area | Untuk | Prefix | Orientasi | Navigasi |
|---|---|---|---|---|
| Publik | Tamu dan semua pengguna | `/` | Mobile-first | Header dan footer |
| Pelanggan | Pengguna login | `/pesan`, `/pesanan`, `/akun`, `/notifikasi` | Mobile-first | Header. Di HP: navigasi bawah (Beranda, Cari, Pesanan, Notifikasi, Akun) |
| Usaha | Pemilik provider, termasuk yang masih mendaftar | `/usaha` | Desktop-first | Sidebar |
| Pekerja | Pekerja berkeanggotaan ACTIVE | `/pekerja` | **Mobile-only** | Navigasi bawah (Beranda, Tugas, Profil) |
| Admin | `role = ADMIN` | `/admin` | Desktop | Sidebar |

**Pengalih area.** Menu avatar di header menampilkan area yang dimiliki pengguna saja: "Mode pelanggan", "Usaha saya", "Mode pekerja", "Panel admin". Area terakhir yang dibuka diingat di state aplikasi, bukan di storage.

### 4.2 Peta Rute

Kolom render: **S** Server Component, **K** Client Component.

#### Publik

| Path | Render | Endpoint utama | Catatan |
|---|---|---|---|
| `/` | S + K | `GET /categories`, `GET /listings?sort=popular&limit=8` | Kotak cari, kategori, jasa populer, ajakan memakai Asisten |
| `/kategori/[id]` | S | `GET /categories/:id/subcategories`, `GET /listings?category_id=` | |
| `/cari` | K | `GET /listings`, `GET /subcategories/:id/attributes` | Butuh geolokasi browser, jadi Client Component |
| `/listing/[id]` | S + K | `GET /listings/:id`, `GET /listings/:id/reviews`, `GET /listings/:id/faqs` | Metadata halaman dari judul listing |
| `/penyedia/[id]` | S + K | `GET /providers/:id` | Tombol "Lamar jadi pekerja di sini" |
| `/asisten` | K | `/chat/*` | Versi layar penuh dari widget Asisten |

#### Autentikasi

| Path | Endpoint |
|---|---|
| `/masuk?next=` | `/api/session/login` (meneruskan ke `POST /auth/login`) |
| `/daftar` | `POST /auth/register` |
| `/verifikasi-email?token=` | `POST /auth/verify-email` |
| `/lupa-sandi` | `POST /auth/forgot-password` (selalu menampilkan pesan sukses) |
| `/atur-ulang-sandi?token=` | `POST /auth/reset-password` |
| `/konfirmasi-email?token=` | `POST /auth/confirm-email-change` |

**Path halaman verifikasi, reset, dan konfirmasi email wajib sama dengan link yang dibuat template email backend** dari `APP_BASE_URL`. Cek template mailer dulu (Bagian 12). Kalau backend memakai path lain, salah satu disesuaikan dan dicatat.

#### Pelanggan

| Path | Endpoint utama | Catatan |
|---|---|---|
| `/pesan/[listingId]` | `GET /listings/:id`, `GET /users/me/addresses`, `POST /orders` | Formulir pesan bertahap (Bagian 5.3) |
| `/pesanan` | `GET /orders` | Tab: Berjalan, Selesai, Dibatalkan |
| `/pesanan/[id]` | `GET /orders/:id`, `/history`, `/messages`, `/payment`, `/verification-code` | Mengikuti `Matriks-UI-Order.md` |
| `/notifikasi` | `GET /notifications` | |
| `/akun` | `GET /auth/me`, `PATCH /users/me` | Profil |
| `/akun/alamat` | CRUD `/users/me/addresses` | Dengan `MapPicker` |
| `/akun/keamanan` | `POST /users/me/change-password`, `PATCH /users/me/email`, `DELETE /users/me/email-change`, `GET /auth/sessions`, `POST /auth/logout-all` | |

#### Usaha

| Path | Endpoint utama | Catatan |
|---|---|---|
| `/usaha/daftar` | `POST /providers/apply`, `POST /providers/me/kyc-documents`, `GET /providers/me` | Untuk pengguna berverifikasi email yang belum punya usaha (Bagian 5.8) |
| `/usaha` | `GET /orders`, `GET /providers/me/wallet` | Pesanan masuk, tawaran Available Now realtime, ringkasan saldo |
| `/usaha/pesanan`, `/usaha/pesanan/[id]` | `GET /orders`, `POST /orders/:id/accept`, `/reject`, `PATCH /orders/:id/assignment`, `PUT /orders/:id/crew` | |
| `/usaha/jasa` | `GET /providers/me/listings` | Termasuk DRAFT dan INACTIVE (D91) |
| `/usaha/jasa/baru`, `/usaha/jasa/[id]` | `POST`, `GET`, `PATCH /providers/me/listings[/:id]`, `PUT .../option-prices`, `.../photos`, `PUT .../faqs`, `PUT .../workers` | Editor bertahap (Bagian 5.9) |
| `/usaha/pekerja` | `GET /providers/me/workers` dan aksinya | Hanya BUSINESS. INDIVIDUAL melihat ajakan naik tipe (D47) |
| `/usaha/saldo` | `GET /providers/me/wallet`, `/wallet/transactions`, `POST`/`GET /providers/me/withdrawals` | |
| `/usaha/usulan` | `POST /taxonomy-requests`, `GET /taxonomy-requests/mine` | |
| `/usaha/profil` | `PATCH /providers/me`, `POST /providers/me/type-upgrade` | Nama usaha, bio, lokasi basis, radius layanan |

#### Pekerja

| Path | Endpoint utama | Catatan |
|---|---|---|
| `/pekerja` | `GET /workers/me`, `PATCH /workers/me/availability`, `GET /workers/me/orders` | Toggle ketersediaan, tawaran masuk, tugas aktif |
| `/pekerja/tugas` | `GET /workers/me/orders` | Tab: Aktif, Terjadwal, Sebagai pendamping, Selesai |
| `/pekerja/tugas/[id]` | `GET /orders/:id` dan endpoint transisi | Alur lapangan (Bagian 5.7) |
| `/pekerja/profil` | `GET /workers/me` | Keanggotaan dan jasa yang dipetakan |

#### Admin

| Path | Endpoint utama |
|---|---|
| `/admin` | Ringkasan antrean dan laporan singkat |
| `/admin/penyedia` | `GET /admin/provider-applications`, `/approve`, `/reject` |
| `/admin/perubahan-tipe` | `GET /admin/type-upgrade-requests`, `PATCH .../:id` |
| `/admin/katalog` | CRUD `/admin/categories`, `/admin/subcategories`, `/admin/subcategories/:id/attributes` |
| `/admin/usulan` | `GET /admin/taxonomy-requests`, `PATCH .../:id` |
| `/admin/pencairan` | `GET /admin/withdrawals`, `/approve`, `/reject` |
| `/admin/komplain`, `/admin/komplain/[id]` | `GET /admin/disputes`, `GET /disputes/:id`, `/review`, `/resolve` |
| `/admin/laporan` | `GET /admin/reports/transactions`, `/providers`, `/workers`, `/revenue` |
| `/admin/pengaturan` | `GET`, `PATCH /admin/settings` |

### 4.3 Penjagaan Rute

| Lapis | Tugas | Bukan tugasnya |
|---|---|---|
| `src/proxy.ts` | Mengalihkan tamu dari area login ke `/masuk?next=` berdasarkan **ada tidaknya** cookie penanda `jasana_sesi` (D231) | Otorisasi. Proxy hanya penyaring kasar, dan kerentanan bypass middleware di Next.js (CVE-2025-29927) menunjukkan kenapa lapis ini tidak boleh jadi satu-satunya pengaman |
| Layout tiap area | Memeriksa kapabilitas dari `/auth/me`. Tidak berhak: halaman 403 berbahasa Indonesia | Memeriksa kepemilikan data. Itu tugas server |
| Express | **Penentu akhir** seluruh hak akses | |

**Email belum diverifikasi (D62).** Banner tetap di atas halaman. Tombol Pesan, Daftar jadi penyedia, dan Lamar jadi pekerja mengarah ke halaman "Verifikasi email dulu" dengan tombol kirim ulang (`POST /auth/resend-verification`). Login dan menjelajah tetap boleh.

---

## 5. Spesifikasi Halaman Kunci

Halaman yang tidak disebut di sini mengikuti pola umum: data dari endpoint di Bagian 4.2, empat state (memuat, kosong, error, berhasil), dan komponen dari Design System.

### 5.1 Pencarian (`/cari`)

- **State filter disimpan di query URL** supaya bisa dibagikan dan tombol kembali browser bekerja: `q`, `category_id`, `subcategory_id`, `lat`, `lng`, `radius_km`, `available_now`, `booking_mode`, `price_min`, `price_max`, `attr[<key>]`, `sort`, `page`
- **Lokasi:** tombol "Pakai lokasiku" (geolokasi browser) atau pilih alamat tersimpan kalau login. Tanpa lokasi, filter radius dan urutan jarak disembunyikan, karena `lat` dan `lng` wajib berpasangan dan `radius_km` hanya sah kalau ada lokasi (D98)
- **Filter atribut dinamis** muncul setelah sub-kategori dipilih, dari `GET /subcategories/:id/attributes`, hanya atribut `is_filterable` dan `is_active` (pemetaan komponen di Bagian 6). Semantik filter bernilai banyak (cocok salah satu atau semua) mengikuti implementasi backend
- **Filter "Bisa datang sekarang"** mengisi `available_now=true`
- **Kartu hasil** (`ListingCard`): foto, judul, nama usaha, rating, "Mulai Rp...", jarak kalau ada lokasi, badge mode
- **Kosong:** sarankan melonggarkan filter atau bertanya ke Asisten
- Di HP, panel filter dibuka lewat `Sheet` dari bawah

### 5.2 Detail Listing (`/listing/[id]`)

- Galeri foto, judul, usaha (tautan profil, rating, jumlah pesanan selesai), deskripsi, durasi perkiraan, mode yang didukung
- **Spesifikasi** (atribut SPEC): label dan nilai
- **Pilihan dan harga** (atribut OPTION): daftar nilai yang dilayani beserta deltanya, sebagai informasi sebelum memesan
- FAQ dalam `Accordion` (D78), ulasan dengan balasan penyedia
- **Tidak ada** nomor telepon, alamat persis usaha, atau tombol kirim pesan ke penyedia (D78)
- Tombol **Pesan**:

| Kondisi | Perilaku |
|---|---|
| Tamu | Ke `/masuk?next=/pesan/[id]` |
| Email belum diverifikasi | Ke halaman "Verifikasi email dulu" |
| Jasa milik usahanya sendiri (D106) | Dinonaktifkan, teks "Ini jasa usahamu sendiri" |
| Normal | Ke `/pesan/[id]` |

### 5.3 Formulir Pesan (`/pesan/[listingId]`)

Bertahap dengan `Stepper`. Di desktop seluruh langkah boleh tampil dalam satu halaman dengan ringkasan harga menempel di samping.

| Langkah | Isi | Aturan |
|---|---|---|
| 1. Mode | Terjadwal atau Sekarang | Hanya mode yang didukung listing. "Sekarang" hanya kalau listing sedang bisa dipesan mendadak, dicek ulang saat langkah ini dibuka |
| 2. Waktu | Tanggal dan jam, **WITA** (FE6) | Hanya mode Terjadwal. Batas waktu terdekat yang boleh dipilih mengikuti aturan backend (D106). Kalau ditolak, tampilkan pesan server |
| 3. Lokasi | Alamat tersimpan, lokasi saat ini (GPS), atau pin di peta | Isi `location_source` sesuai cara memilih, dan `location_accuracy_m` hanya kalau dari GPS. Nilai enum `location_source` dicek ke `packages/shared`. Kalau lokasi di luar radius layanan usaha, server menolak, tampilkan pesannya |
| 4. Pilihan | Atribut OPTION lewat `OptionPicker` | Hanya opsi `is_offered`. Atribut wajib harus terisi. PER_UNIT bilangan bulat (D89) dalam batas `validation_rule` |
| 5. Catatan | `service_notes`, contoh "pagar hijau, rumah kedua dari ujung" | Opsional |
| 6. Ringkasan | `PriceBreakdown` berlabel **Perkiraan**, jadwal, alamat | Teks: "Kamu baru membayar setelah penyedia menerima pesanan" (D19) |

**Body `POST /orders` hanya berisi pilihan**, tidak pernah berisi angka nominal (aturan backend nomor 7). Setelah 201, arahkan ke `/pesanan/[id]` yang menampilkan rincian harga dari server.

### 5.4 Detail Pesanan (semua area)

Satu komponen `OrderDetail` dipakai di `/pesanan/[id]`, `/usaha/pesanan/[id]`, `/pekerja/tugas/[id]`, dan dari halaman komplain admin. Perbedaan per penampil seluruhnya datang dari `getViewer()` dan `getOrderActions()` (`Matriks-UI-Order.md`).

Susunan:

1. Kepala: nomor pesanan, `StatusBadge`, `ModeBadge`
2. Banner status sesuai penampil, dengan `Countdown` kalau ada
3. `OrderActionBar`. Di HP menempel di bawah layar
4. Info: jasa, jadwal, alamat dan peta, penanggung jawab
5. `PriceBreakdown` dari server (`listing_base_amount`, tiap opsi dari `snapshot_selected_options`, `total_amount`). Pemilik juga melihat potongan komisi dan pendapatan bersih
6. Tab: **Pesan** dan **Riwayat** (`OrderTimeline`)

### 5.5 Pembayaran

1. Tombol "Bayar sekarang" memanggil `GET /orders/:id/payment`, lalu membuka `invoice_url` di tab yang sama
2. Setelah kembali dari Xendit, halaman pesanan menampilkan "Menunggu konfirmasi pembayaran..." dan **menunggu status PAID dari server**, lewat event `order:status_changed` atau polling tiap 5 detik paling lama 2 menit
3. **Halaman sukses dari Xendit bukan bukti pembayaran.** Yang menjadi bukti adalah webhook yang sudah diproses server. Frontend tidak pernah menandai pesanan lunas sendiri
4. Kalau invoice kedaluwarsa tapi pesanan masih ACCEPTED dan batas bayar belum lewat, `POST /orders/:id/payment` untuk membuat invoice baru
5. Kalau 2 menit lewat tanpa PAID: "Pembayaran belum terkonfirmasi. Kalau sudah membayar, status akan berubah otomatis." Jangan menyuruh membayar ulang

### 5.6 Tawaran Available Now (pekerja dan pemilik)

- **Sumber:** `GET /workers/me/orders` (tawaran yang masih aktif) ditambah event `order:offer`. Pemilik menerima event yang sama lewat room usaha
- **`OfferCard`:** jasa, ringkasan pilihan, jarak ke lokasi, perkiraan durasi, `Countdown` 5 menit, tombol Ambil dan Lewati. Pemilik mendapat tombol Terima dengan pilihan pekerja dari daftar penerima tawaran (D70)
- Aksi dan penanganan error mengikuti Matriks Bagian 2.1
- Angka di judul tab, misalnya "(1) Tawaran baru", supaya terlihat walaupun tab lain sedang dibuka
- Karena tanpa push notification (H42), area pekerja menampilkan pengingat tetap: "Biarkan halaman ini terbuka supaya tawaran masuk"

### 5.7 Alur Lapangan Pekerja (`/pekerja`)

**Toggle "Siap terima pesanan sekarang"** (`AvailabilityToggle`):

| Kondisi | Perilaku |
|---|---|
| `accepts_assignments = false` | Toggle tidak tampil. Teks: "Pemilik usaha belum mengaktifkan penugasan untukmu" |
| Izin lokasi belum diberikan | Minta izin dulu. Kalau ditolak, jelaskan cara mengizinkan di pengaturan browser |
| Menyalakan | `PATCH /workers/me/availability` **wajib menyertakan koordinat**, lalu mulai `watchPosition` |
| Selama menyala | Kirim `PATCH /workers/me/location` hanya kalau berpindah lebih dari `worker_location_move_threshold_meters` atau sudah lewat `worker_location_max_interval_minutes` (D66). Nilainya dari backend kalau diekspos |
| Tab ditutup atau koneksi putus | Server menganggap offline setelah batas presence (D65). Toggle di layar disegarkan dari server saat tab dibuka lagi |

**Detail tugas** (`/pekerja/tugas/[id]`): tombol berukuran `lg` (48 px), alamat dan catatan lokasi dengan huruf besar, peta, dan tautan "Buka di Google Maps" yang berisi koordinat lokasi layanan. Tautan ini hanya tautan keluar, bukan integrasi API.

Selama status `ON_THE_WAY`, posisi dikirim lewat event `order:location_update` (D112). `watchPosition` dihentikan begitu status berubah atau halaman ditinggalkan.

### 5.8 Pendaftaran Penyedia (`/usaha/daftar`)

| Langkah | Isi | Aturan |
|---|---|---|
| 1. Tipe usaha | INDIVIDUAL (perorangan) atau BUSINESS (usaha dengan pekerja) | D46. Penjelasan singkat dokumen apa yang diminta tiap tipe |
| 2. Profil usaha | Nama usaha, deskripsi, lokasi basis (pin peta), radius layanan dalam km | Field persis mengikuti skema `POST /providers/apply` dan `PATCH /providers/me` |
| 3. Dokumen | KTP dan selfie. BUSINESS ditambah NPWP atau izin usaha | Satu unggahan per jenis dokumen, multipart (FE12). JPEG, PNG, atau PDF, maksimal 5 MB. Pratinjau sebelum kirim |
| 4. Status | PENDING: "Sedang diperiksa admin". REJECTED: alasan penolakan. VERIFIED: ke `/usaha` | |

Syarat masuk: email sudah diverifikasi (D62).

### 5.9 Editor Jasa (`/usaha/jasa/baru`, `/usaha/jasa/[id]`)

| Bagian | Isi | Endpoint |
|---|---|---|
| 1. Jenis jasa | Kategori lalu sub-kategori aktif. Tautan "Jenis jasaku tidak ada" ke formulir usulan (D74) | `GET /categories`, `GET /categories/:id/subcategories` |
| 2. Info dasar | Judul, deskripsi, harga dasar, durasi perkiraan (15 sampai 720 menit, nilai awal dari sub-kategori, D90), mode yang dilayani (minimal satu, D95) | `POST` atau `PATCH /providers/me/listings` |
| 3. Spesifikasi | Atribut SPEC lewat `AttributeFields`. Banner kalau `attributes_need_update` menyala (D67) | Sama dengan di atas |
| 4. Pilihan dan harga | Atribut OPTION: centang nilai yang dilayani dan isi deltanya. PER_UNIT diisi harga per unit, BOOLEAN diisi delta datar | `PUT .../option-prices` |
| 5. Foto | `FileDropzone` varian signed URL. JPEG, PNG, WebP, maksimal 5 MB, **tanpa SVG** | `POST /uploads/signed-url`, PUT ke Storage, lalu **wajib** `POST .../photos` |
| 6. FAQ | Daftar tanya jawab, maksimal `listing_faq_max_items` | `PUT .../faqs` (tulis ulang seluruhnya) |
| 7. Pekerja | Centang pekerja ACTIVE yang bisa mengerjakan. **Hanya BUSINESS.** INDIVIDUAL dipetakan otomatis (D53) | `PUT /providers/me/listings/:id/workers` (D93) |
| 8. Status | Draf, Tayang, Nonaktif. Tombol "Tayangkan" menampilkan daftar syarat D92 yang belum terpenuhi | `PATCH` field `status` (D94) |

Kalau pilihan yang dibutuhkan tidak tersedia, tautan "Usulkan pilihan" membuka formulir usulan dengan sub-kategori dan atribut sudah terisi.

### 5.10 Kelola Pekerja (`/usaha/pekerja`)

- Tab **Pelamar**: nama, pengalaman, dokumen, jasa yang dicentang pelamar. Pemilik boleh menambah atau mencoret centangan sebelum menyetujui (D52). Setujui atau Tolak
- Tab **Aktif**: pemetaan jasa (bisa diubah), toggle "Bisa ditugaskan" (`accepts_assignments`), tombol Keluarkan dengan konfirmasi
- Mematikan "Bisa ditugaskan" untuk pekerja terakhir yang aktif ditolak server (`409 PROVIDER_HAS_NO_ACTIVE_WORKER`, H27). Tampilkan alasannya
- Provider INDIVIDUAL melihat ajakan "Tambah pekerja" yang mengarah ke pengajuan naik tipe ke BUSINESS (D47)

### 5.11 Saldo dan Pencairan (`/usaha/saldo`)

- Dua kartu: **Saldo tersedia** dan **Saldo tertahan**, dengan penjelasan singkat "Dana pesanan ditahan sampai batas komplain lewat"
- Riwayat ledger: tanggal, jenis transaksi berlabel Indonesia, perubahan tersedia, perubahan tertahan, saldo setelahnya
- Formulir **Tarik saldo**: nominal dan rekening tujuan. **Minimum dan biaya admin dibaca dari backend, jangan ditulis 50.000 dan 6.500 di kode** (D84). Sebelum konfirmasi tampilkan: nominal, biaya admin, dan yang diterima di rekening. Body request hanya `amount` dan rekening tujuan
- Riwayat pencairan dengan status

### 5.12 Komplain

- Dibuka dari detail pesanan oleh client atau pemilik (Matriks Bagian 3.3): alasan dan penjelasan, lalu bukti opsional
- Bukti: multipart, JPEG, PNG, atau PDF, maksimal 5 MB per berkas
- Halaman komplain menampilkan status, bukti dari kedua pihak, dan putusan admin. Admin juga melihat seluruh pesan dalam order sebagai bukti (D79)

### 5.13 Ulasan

Rating 1 sampai 5 dan teks, dari detail pesanan setelah COMPLETED. Pemilik bisa membalas sekali dari halaman jasa (`POST /providers/me/reviews/:id/reply`).

### 5.14 Pesan dalam Order

Mengikuti Matriks Bagian 3.2. Daftar pesan terbaru di bawah, memuat pesan lama saat digulir ke atas, input dengan penghitung karakter, tanda dibaca sisi lawan (`PATCH /orders/:id/messages/read` saat panel dibuka).

### 5.15 Asisten Jasana

| Aspek | Ketentuan |
|---|---|
| Titik masuk | Tombol melayang "Tanya Asisten" di area publik dan pelanggan, dan halaman `/asisten` |
| Tamu | `POST /chat/guest-sessions`, simpan `guest_token` di **`sessionStorage`**. Ini satu-satunya token yang boleh di storage browser, karena hanya mengikat percakapan tamu, bukan akun |
| Lokasi tamu | Minta izin geolokasi per percakapan (H66). Ditolak: Asisten tetap jalan tanpa lokasi |
| Pengguna login | `POST /chat/sessions`, riwayat dari `GET /chat/sessions` |
| Mengirim | `POST /chat/sessions/:id/messages`. Respons bisa sampai 3 detik, tampilkan indikator mengetik |
| Rekomendasi | Ditampilkan sebagai `ListingCard` dengan tombol Lihat dan Pesan |
| Teks jawaban | Dirender sebagai **teks biasa** (atau markdown dengan daftar elemen terbatas). Tidak pernah sebagai HTML, karena isinya keluaran model |
| Tamu lalu mendaftar atau masuk | `POST /chat/sessions/:id/claim` supaya percakapan berlanjut (D77) |
| Batas | `GUEST_CHAT_LIMIT_REACHED`: ajak mendaftar. `CHATBOT_TEMPORARILY_UNAVAILABLE` dan `GEMINI_UNAVAILABLE`: "Asisten sedang tidak tersedia, kamu tetap bisa mencari lewat kolom pencarian" |
| Keterangan | Teks kecil: "Jawaban dibuat AI. Cek detail jasa sebelum memesan" |

Detail keputusan Fase 9 (D151 sampai D155) wajib dibaca di register terbaru sebelum Fase W8.

### 5.16 Notifikasi

Lonceng dengan angka belum dibaca di header. Daftar notifikasi dengan tautan ke pesanan atau halaman terkait, tandai dibaca satu per satu atau sekaligus. Pembaruan realtime dari `notification:new`.

### 5.17 Area Admin

- Tabel dengan filter status dan paginasi. Detail dibuka di `Sheet` samping
- Penolakan apa pun wajib mengisi alasan
- Dokumen e-KYC dibuka lewat signed URL di tab baru, tidak diproses `next/image`
- **Pengaturan:** satu baris per parameter dengan nama, nilai, satuan, dan keterangan. Peringatan sebelum menyimpan: "Perubahan langsung berlaku untuk seluruh pengguna"
- **Laporan:** filter rentang tanggal, tabel. Grafik sederhana opsional dan tidak memblokir fase

### 5.18 Akun

- Avatar: tampilkan inisial. Unggah foto hanya kalau backend menyediakan jalurnya (Bagian 12)
- Ganti email wajib password saat ini. Selama `pending_email` terisi, tampilkan banner "Menunggu konfirmasi di [email baru]" dengan tombol Batalkan (D64)
- Perangkat aktif dari `GET /auth/sessions`, tombol "Keluar dari semua perangkat"

---

## 6. Formulir Atribut Dinamis

Atribut dinamis muncul di tiga tempat dengan perender yang berbeda. Ketiganya membaca definisi yang sama dari `GET /subcategories/:id/attributes`.

| `data_type` | SPEC di editor jasa | OPTION di formulir pesan | Filter di pencarian |
|---|---|---|---|
| `TEXT` | Input atau textarea | Tidak dipakai | Tidak difilter |
| `NUMBER` | Input angka, boleh pecahan | **Stepper bilangan bulat** (PER_UNIT, D89), batas dari `validation_rule`, delta dikali nilai | Tidak difilter |
| `BOOLEAN` | Switch | Switch dengan "+Rp..." | Switch |
| `SELECT` | Select atau radio | **Kartu radio** dengan delta tiap nilai | Daftar checkbox |
| `MULTISELECT` | Grup checkbox | **Kartu checkbox**, delta dijumlahkan | Daftar checkbox |
| `DATE` | Pemilih tanggal | Tidak dipakai | Tidak difilter |

Aturan bersama:

- Hanya atribut `is_active` dan nilai opsi yang aktif. Urutan mengikuti `display_order`
- Label, satuan, dan tanda wajib dari definisi. Tidak ada label atribut yang ditulis di kode
- Validasi di client mengikuti `is_required` dan `validation_rule` hanya untuk kenyamanan. Error 422 `ATTRIBUTE_VALIDATION_FAILED` dari server dipetakan ke field yang sesuai lewat `details`
- Atribut SPEC tidak pernah muncul di formulir pesan, dan atribut OPTION tidak pernah muncul di bagian spesifikasi editor
- Perender ditulis **sekali** sebagai komponen generik. Tidak boleh ada formulir khusus per sub-kategori, karena itu mematahkan klaim Hybrid Approach (D2)

---

## 7. Komunikasi dengan API

### 7.1 `api-client`

| Aspek | Ketentuan |
|---|---|
| Base URL | `NEXT_PUBLIC_API_BASE_URL`, contoh `http://localhost:3000/api/v1` |
| Header | `Authorization: Bearer <access token dari memori>` |
| Envelope | Respons `{ success: true, data, meta }` dikembalikan sebagai `{ data, meta }`. Respons gagal dilempar sebagai `ApiError { status, code, message, details }` |
| 401 | Refresh sekali lewat `/api/session/refresh` (single-flight), ulangi request. 401 kedua: hapus sesi, ke `/masuk?next=` |
| Body | JSON snake_case apa adanya, tidak dikonversi ke camelCase. Satu bentuk dari API sampai komponen |
| Multipart | Fungsi terpisah `uploadMultipart()`, tanpa header `Content-Type` manual supaya boundary diisi browser |

### 7.2 Penanganan Error

| Status | Perilaku |
|---|---|
| 400, 422 | `details` dipetakan ke field formulir. Kalau tidak bisa dipetakan, tampil di atas formulir |
| 401 | Lihat 7.1 |
| 403 `EMAIL_NOT_VERIFIED` | Ke halaman "Verifikasi email dulu" |
| 403 lainnya | Pesan dari peta. Untuk aksi order, refetch `/auth/me` dan data terkait |
| 404 | Halaman "Tidak ditemukan" |
| 409 | Pesan dari peta, lalu refetch data terkait. 409 berarti kondisi sudah berubah, bukan input yang salah |
| 413 | "Berkas terlalu besar. Maksimal 5 MB" |
| 429 | Pesan dari peta. Kalau ada header `Retry-After`, tampilkan kapan bisa mencoba lagi |
| 500, 502, 503 | Pesan ramah + "Coba lagi". Tanpa detail teknis |

Seluruh pesan diambil dari `lib/error-messages.ts` (Lampiran A). Kode yang tidak dikenal memakai pesan umum dan dicatat di console development.

### 7.3 Kunci Query dan Invalidasi

| Kunci | Diinvalidasi oleh |
|---|---|
| `['me']` | Login, logout, refresh yang mengubah keanggotaan, persetujuan provider atau pekerja, 403 pada aksi order |
| `['orders', 'list', filter]` | Aksi order apa pun, `order:status_changed` |
| `['orders', 'detail', id]` | Aksi pada order itu, `order:status_changed`, `order:assignment_changed` |
| `['orders', 'messages', id]` | Kirim pesan, `order:message` |
| `['worker', 'orders']` | `order:offer`, `order:offer_closed`, aksi pekerja |
| `['wallet']` | Pengajuan pencairan, `order:status_changed` ke SETTLED atau REFUNDED |
| `['notifications']` | `notification:new`, tandai dibaca |
| `['listings', ...]` | Simpan di editor jasa |

Seluruh kunci dibuat lewat satu factory di `lib/query-keys.ts`.

### 7.4 Paginasi

Query `page` dan `limit` (bawaan 20), total dari `meta.total`. Daftar panjang di area pelanggan dan pekerja memakai tombol "Muat lebih banyak". Tabel admin dan usaha memakai komponen `Pagination`.

---

## 8. Real-Time

| Aspek | Ketentuan |
|---|---|
| Koneksi | Satu per tab, dibuat setelah login, autentikasi dengan access token yang sama (PRD Backend Bagian 7.2) |
| Setelah refresh token | Putus lalu sambung ulang dengan access token baru |
| Logout | Putus koneksi |
| Event masuk | Mengikuti Matriks Bagian 5 |
| Event keluar | `worker:presence` (denyut, area pekerja) dan `order:location_update` (penanggung jawab saat ON_THE_WAY). Tidak ada event lain yang dikirim dari client |
| Koneksi putus | Indikator kecil "Pembaruan otomatis terputus", polling cadangan (tawaran 10 detik, detail order aktif 15 detik), kembali normal saat tersambung |

---

## 9. Non-Functional Requirements

### 9.1 Performa

| Aspek | Target |
|---|---|
| Halaman publik | Largest Contentful Paint di bawah 2,5 detik pada Lighthouse mobile, lingkungan staging |
| Ukuran bundle | Peta, Asisten, dan editor jasa dimuat terpisah (dynamic import), tidak ikut di bundle awal |
| Gambar | `next/image` dengan `sizes` yang benar untuk foto publik |
| Daftar panjang | Paginasi server. Tidak memuat seluruh data lalu memfilter di client |

### 9.2 Keamanan

| Aspek | Ketentuan |
|---|---|
| Token | Sesuai FE3. Tidak ada token akun di storage browser |
| Konten dari pengguna | Deskripsi jasa, FAQ, ulasan, pesan, dan jawaban Asisten dirender sebagai teks. **Tidak ada `dangerouslySetInnerHTML`** untuk konten dari pengguna atau model |
| Berkas privat | Signed URL e-KYC dan bukti komplain tidak di-cache dan tidak lewat optimizer gambar |
| Variabel lingkungan | Hanya `NEXT_PUBLIC_*` yang sampai ke browser. Tidak ada secret di variabel itu |
| Kode verifikasi | Tidak disimpan di storage, tidak ditulis ke log |

### 9.3 Kompatibilitas

- Chrome, Edge, Firefox, dan Safari dua versi terakhir. Chrome Android dan Safari iOS untuk area pelanggan dan pekerja
- **Geolokasi hanya jalan di HTTPS** (kecuali `localhost`). Uji di HP lewat jaringan lokal dengan alamat `http://192.168...` tidak akan bisa membaca lokasi. Pakai tunnel HTTPS atau staging
- Tiga lebar wajib: 390, 768, 1280 px

### 9.4 Variabel Lingkungan

```
NEXT_PUBLIC_API_BASE_URL        # URL REST API untuk browser
NEXT_PUBLIC_SOCKET_URL          # URL Socket.IO
API_INTERNAL_BASE_URL           # URL REST API untuk Route Handler (server ke server)
SESSION_COOKIE_NAME             # nama cookie refresh token. Cookie penanda bernama tetap jasana_sesi (D231)
SESSION_COOKIE_SECURE           # true di staging dan produksi
```

Divalidasi dengan Zod saat build atau boot. Aplikasi gagal start kalau ada yang kosong, sama seperti backend. Validasi Zod terpasang sejak W0 bagian 3 di `src/lib/env.ts` (variabel `NEXT_PUBLIC_*`) dan `src/lib/env.server.ts` (bertanda `server-only`). `next.config.ts` mengimpor keduanya, sehingga dev, build, dan start gagal kalau ada yang kosong.

Host gambar untuk `next/image` tidak lewat variabel lingkungan, melainkan pola tetap `*.supabase.co/storage/v1/object/public/**` di `next.config.ts` (D226). Pola path publik ini otomatis menolak signed URL privat.

Saat pengembangan, Next berjalan di `http://localhost:3100` dan API di `http://localhost:3000`.

**Penyesuaian di sisi backend** (bukan kode frontend, tapi wajib untuk FE3): `CORS_ORIGIN` memuat origin Next (sudah ditambahkan `http://localhost:3100` di `.env` lokal, contoh di `.env.example` menyusul lewat H127), dan `TRUST_PROXY` (D117) diatur supaya alamat IP pengguna yang diteruskan Route Handler lewat `X-Forwarded-For` terbaca. Tanpa ini, seluruh login lewat Route Handler terhitung dari satu IP server Next, dan rate limit login (10 per 15 menit per IP) akan habis saat UAT.

---

## 10. Pengujian dan Dukungan UAT

### 10.1 Unit (Vitest)

| Sasaran | Kasus minimal |
|---|---|
| `getOrderActions()`, `getViewer()` | Sesuai Matriks Bagian 7 |
| `lib/format.ts` | Rupiah, delta, jarak, durasi, termasuk nol dan negatif |
| `lib/time.ts` | Konversi input WITA ke UTC dan balik, pergantian tanggal tengah malam |
| Pratinjau harga | Kasus servis AC: tiga unit, 2 PK, isi freon (sama dengan kasus H55 backend). Hasilnya dibandingkan dengan respons server di test integrasi manual |
| `error-messages.ts` | Seluruh kode di Lampiran A punya pesan |
| Perender atribut | Satu kasus per baris tabel Bagian 6 |

### 10.2 Smoke E2E (Playwright)

| Alur | Catatan |
|---|---|
| Masuk, refresh di dua tab bersamaan, tetap masuk | Menguji FE3 |
| Cari, buka jasa, pesan Terjadwal | |
| Pemilik menerima dan menugaskan pekerja | |
| Pekerja berangkat, check-in di dalam radius dan di luar radius | Playwright bisa mengatur geolokasi palsu per konteks browser |
| Pekerja memasukkan kode benar dan salah sampai terkunci | |
| Dua pekerja mengambil tawaran Available Now yang sama | Dua konteks browser. Tepat satu berhasil, kartu hilang di yang lain |

Pembayaran Xendit tidak diotomasi. Langkah bayar dijalankan manual di sandbox, atau status dipindahkan lewat webhook uji yang sudah ada di backend.

### 10.3 Skenario UAT per Aktor

UI harus mendukung seluruh skenario ini tanpa bantuan alat lain (W-O1). Instrumen kuesioner disusun terpisah (H84).

| Aktor | Responden | Skenario inti |
|---|---|---|
| Client | 15 | Daftar dan verifikasi email. Cari jasa dengan filter lokasi dan atribut. Bertanya ke Asisten lalu memesan dari rekomendasi. Pesan Terjadwal, bayar, lihat pekerja datang, berikan kode, beri ulasan. Pesan Sekarang. Ajukan komplain |
| Provider | 6 | Daftar jadi penyedia dengan dokumen. Buat jasa dengan spesifikasi, pilihan berharga, foto, FAQ. Terima pesanan dan tugaskan pekerja. Ganti penanggung jawab. Kelola pelamar. Tarik saldo. Usulkan pilihan baru |
| Pekerja | 6 | Lamar ke usaha. Nyalakan siap terima pesanan. Ambil tawaran Available Now. Berangkat, sampai, mulai, selesai, masukkan kode. Lihat tugas sebagai pendamping |
| Admin | 3 | Verifikasi penyedia. Tambah sub-kategori dan atribut berbayar. Putuskan usulan taksonomi. Setujui pencairan. Putuskan komplain. Lihat laporan. Ubah parameter |

Responden pekerja butuh HP dengan GPS dan akses ke alamat **HTTPS** (Bagian 9.3).

### 10.4 Black Box

Setiap halaman di Bagian 4.2 dipetakan ke test case di dokumen `PPL_A_2305551065_UAS.docx` (127 test case) dan test case state machine. Halaman baru yang belum punya test case ditambahkan di dokumen itu, bukan di sini.

---

## 11. Milestone Implementasi

Satu fase dikerjakan sampai tuntas sebelum pindah, sama seperti backend. Satu fase bisa terdiri dari beberapa sesi Claude Code.

| Fase | Keluaran | Kriteria selesai |
|---|---|---|
| **W0. Fondasi** | Next.js di `apps/web`, token dan huruf, shadcn/ui, layout lima area, `api-client`, sesi (FE3), `proxy.ts`, TanStack Query, klien socket, `format` dan `time`, `ORDER_STATUS_META`, `enum-labels`, `error-messages`, `getOrderActions()` beserta test, galeri `/dev/ui` | Login, refresh, logout berjalan. **Refresh di dua tab bersamaan tidak memicu logout.** Galeri menampilkan seluruh komponen dan 15 badge. Typecheck, lint, dan test hijau |
| **W1. Autentikasi dan akun** | Daftar, verifikasi email, masuk, lupa dan atur ulang sandi, profil, alamat dengan peta, keamanan akun | Link dari email backend membuka halaman yang benar. Ganti email dan perangkat aktif berjalan |
| **W2. Publik dan pencarian** | Beranda, kategori, pencarian dengan filter lokasi dan atribut dinamis, detail jasa, profil penyedia | Filter tersimpan di URL. Filter atribut muncul sesuai sub-kategori. Lighthouse mobile halaman detail jasa memenuhi target 9.1 |
| **W3. Pemesanan sisi pelanggan** | Formulir pesan, daftar dan detail pesanan sisi client, pembayaran, kode verifikasi, ulasan, pesan dalam order, komplain | Skenario client end-to-end berjalan dengan Xendit sandbox. Pratinjau harga sama dengan angka server untuk kasus servis AC |
| **W4. Pendaftaran dan kelola usaha** | Daftar penyedia dan dokumen, profil usaha, editor jasa lengkap, kelola pekerja, usulan taksonomi, naik tipe | Jasa baru bisa dibuat sampai tayang. Syarat tayang D92 tampil saat belum terpenuhi. Unggah foto selalu diikuti pencatatan |
| **W5. Pesanan sisi usaha dan alur lapangan** | Kotak pesanan usaha, terima dan tugaskan, ganti penanggung jawab, pendamping, tawaran realtime, toggle ketersediaan dan lokasi, alur lapangan, posisi pekerja di peta client | Dua pekerja berebut satu tawaran: tepat satu menang, kartu hilang di layar lain dan di dashboard pemilik. Check-in di dalam dan di luar radius memberi hasil yang benar di HP lewat HTTPS |
| **W6. Uang** | Saldo, ledger, pencairan, komplain sisi usaha | Biaya admin dan nominal diterima tampil sebelum konfirmasi, dibaca dari backend |
| **W7. Admin** | Seluruh halaman Bagian 4.2 area admin | Seluruh skenario admin di 10.3 berjalan |
| **W8. Asisten** | Widget dan halaman Asisten, sesi tamu dan login, klaim sesi, kartu rekomendasi | Tamu yang mendaftar di tengah percakapan bisa melanjutkan percakapan yang sama |
| **W9. Notifikasi dan perapian** | Pusat notifikasi, audit empat state di seluruh halaman, audit aksesibilitas, cek responsif tiga lebar, uji coba skenario UAT | Seluruh skenario 10.3 dijalankan sekali tanpa hambatan |

**Status per 18 November 2026:**

| Fase | Status | Sisa |
|---|---|---|
| W0 | Sebagian. Bagian 1 (scaffold, token, komponen dasar, `ORDER_STATUS_META`, galeri, penjaga token), bagian 2 (`api-client`, TanStack Query, `format`, `time`, tipe API, `ListingCard`), dan bagian 3 (validasi env, sesi D231 sampai D234, retry 401, `src/proxy.ts`, `useMe`, `getCapabilities`, `/masuk`, menu avatar, smoke Playwright dua tab) | Bagian 4: `getOrderActions()` dan `getViewer()` beserta test, socket, `enum-labels` lengkap, layout area pelanggan, usaha, pekerja, dan admin |
| W2 | Selesai untuk lingkup demo: beranda, `/cari`, `/listing/[id]`, `/penyedia/[id]`, 404 global | `/kategori/[id]`, sub-kategori dan filter atribut dinamis di `/cari`, radius, rentang harga, Lighthouse halaman detail |

**Kenapa pemesanan sisi pelanggan (W3) sebelum kelola usaha (W4).** Data simulasi backend (`npm run seed:simulasi`, `docs/Data-Simulasi.md`) sudah berisi usaha, jasa, pekerja, order di setiap status, dan akun demo per peran, jadi alur pelanggan bisa dibangun dan diuji lebih dulu. Alur pelanggan juga yang paling banyak respondennya (15 dari 30).

**Kenapa fondasi (W0) memuat `getOrderActions()`.** Fungsi itu murni dan spesifikasinya sudah lengkap di Matriks, jadi bisa diselesaikan dan diuji sebelum halaman apa pun ada. Begitu W3 dan W5 dimulai, tinggal dipakai.

---

## 12. Pertanyaan Terbuka dan Hal yang Wajib Dicek

### 12.1 Wajib dicek ke repo sebelum fase terkait

| # | Hal | Sebelum fase | Dampak kalau tidak dicek |
|---|---|---|---|
| 1 | Bentuk respons `POST /auth/login` dan `/auth/refresh`: refresh token di body atau di cookie. **Dicek di W0 bagian 3:** di body, syarat FE3 terpenuhi (register 4AK) | W0 | FE3 bisa salah bentuk |
| 2 | Bentuk `GET /auth/me`: field untuk `provider_profile_id`, status usaha, `worker_id`, status keanggotaan, `email_verified_at`. **Dicek di W0 bagian 3:** `provider` berstatus apa pun, `worker` hanya ACTIVE, tanpa `accepts_assignments` (itu dari `/workers/me`) | W0 | `getViewer()` dan pengalih area salah |
| 3 | Path link di template email backend (verifikasi, reset sandi, konfirmasi ganti email) | W1 | Link di email membuka halaman 404 |
| 4 | Endpoint keputusan lanjutan yang menyentuh UI: tolak tawaran (D102), minta kode baru (D111), dan seluruh keputusan Fase 6 sampai 10 (D100 sampai D203) | W3, W5 | Tombol di Matriks memanggil endpoint yang salah |
| 5 | Endpoint yang mengekspos parameter publik: minimum dan biaya pencairan, ambang lokasi pekerja, jeda boleh berangkat | W5, W6 | Angka terpaksa ditulis di frontend |
| 6 | Nilai enum `location_source`, status pencairan, status refund, status dan putusan komplain, daftar bank tujuan | W3, W6 | Label dan formulir tidak cocok |
| 7 | Ada tidaknya endpoint daftar kandidat pekerja yang sudah tersaring untuk dialog Terima | W5 | Kalau tidak ada, dialog memakai pekerja terpetakan dan mengandalkan 409 |
| 8 | Semantik filter bernilai banyak di `GET /listings`. Belum terpakai, karena filter atribut dinamis di `/cari` belum dibuat | W2 lanjutan | Hasil filter membingungkan |
| 9 | Bentuk respons rekomendasi Asisten (D151 sampai D155) | W8 | Kartu rekomendasi tidak bisa dirender |
| 10 | Jalur unggah avatar | W1 | Avatar cukup inisial |

### 12.2 Perlu diputuskan

| # | Pertanyaan | Usulan |
|---|---|---|
| 1 | Seluruh FE1 sampai FE14 | **Selesai.** Dicatat sebagai D210 sampai D223 |
| 2 | Alamat staging berbasis HTTPS untuk UAT dan uji HP | Dibutuhkan paling lambat W5 |
| 3 | Mockup Figma (artefak desain 8): halaman mana yang dibuat lebih dulu | **Selesai dengan cara lain.** Design System v1.5 dan mockup menggantikan Figma (D224) |
| 4 | Penyesuaian `CORS_ORIGIN` dan `TRUST_PROXY` di backend untuk Route Handler sesi | `CORS_ORIGIN` sudah memuat origin Next. `TRUST_PROXY` dicek di awal W0 bagian 3 |

---

### 12.3 Temuan dari implementasi W0 dan W2

| # | Temuan | Penanganan |
|---|---|---|
| 1 | Kartu listing membawa `distance_km` (km, dua desimal), sementara endpoint lain memakai `distance_meters` | `formatJarak(meter)` dipertahankan. Kartu mengonversi `distance_km * 1000` |
| 2 | Penyedia di kartu listing dan di `GET /listings/:id` tidak membawa `display_name`, padahal `business_name` bisa null untuk INDIVIDUAL | Fallback "Penyedia perorangan". Perbaikan backend di `main` (H124) |
| 3 | `GET /listings/:id` sudah memuat FAQ dan tiga ulasan terbaru | Detail listing tidak memanggil `/faqs` dan `/reviews` saat tampilan awal. `/reviews` dipakai untuk paginasi |
| 4 | Id bukan UUID dijawab 422 `VALIDATION_ERROR`, bukan 400 | Halaman tidak ditemukan dicek dari kode error, bukan status (D228) |
| 5 | Seluruh `icon_name` kategori semula kosong | Diisi lewat SQL di Supabase dev, dipetakan lewat whitelist (D229). Skrip seed menyusul (H125) |
| 6 | Komponen shadcn bawaan (sheet, accordion, switch) memakai palet dan nilai arbitrer | Kelasnya ditulis ulang ke token. Urutan di `/cari` memakai `<select>` bawaan bergaya Input, bukan Select shadcn |
| 7 | Prop `priority` di `next/image` usang di Next 16 | Gambar di atas lipatan memakai `loading="eager"` |
| 8 | TanStack Query mencoba ulang tiga kali secara bawaan, sehingga error state baru muncul sekitar 7,6 detik saat API mati | Retry dibatasi sekali dan tidak untuk error 4xx |
| 9 | Atribut SPEC di detail listing hanya berupa pasangan kunci dan nilai | Label diambil dari `GET /subcategories/:id/attributes` |
| 10 | Untuk W7: form kategori admin | `icon_name` dipilih dari whitelist `category-icons.ts`, bukan diketik bebas (D229) |
| 11 | `proxy.ts` wajib di `src/`, bukan di akar `apps/web`, karena `app/` ada di `src/` | Bagian 2.3 dan `apps/web/CLAUDE.md` disesuaikan |
| 12 | Pesan `UNAUTHORIZED` di Lampiran A ("Sesimu sudah berakhir") salah arti untuk kata sandi yang salah | Halaman masuk memakai `LOGIN_UNAUTHORIZED_MESSAGE` (Lampiran A.1). Akun nonaktif sengaja tidak dibedakan |
| 13 | Cookie penanda tidak bisa diturunkan dari `SESSION_COOKIE_NAME`, karena client membacanya | Nama tetap `jasana_sesi` (D231) |
| 14 | Pemeriksaan `Origin` (D233) membandingkan dengan origin request yang dilihat Next | Dicek ulang di balik reverse proxy saat deploy (H128) |

---

## Lampiran A. Peta Kode Error ke Pesan

Isi awal `lib/error-messages.ts`. Kode baru dari Fase 6 sampai 10 ditambahkan saat ditemukan di backend. Sejak W0 bagian 2, `ERROR_MESSAGES` bertipe `Record<ErrorCode, string>` dari `packages/shared`, sehingga typecheck gagal kalau ada kode yang belum punya pesan. Empat belas kode di bagian akhir A.1 ditemukan di W0 bagian 2.

### A.1 Aturan bisnis

| Kode | Pesan |
|---|---|
| `VALIDATION_ERROR` | Ada isian yang belum sesuai. Periksa lagi yang ditandai. |
| `UNAUTHORIZED` | Sesimu sudah berakhir. Silakan masuk lagi. |
| `EMAIL_NOT_VERIFIED` | Verifikasi emailmu dulu untuk melanjutkan. |
| `FORBIDDEN_ACTOR` | Kamu tidak bisa melakukan aksi ini pada pesanan ini. |
| `NOT_ASSIGNED_WORKER` | Hanya penanggung jawab pesanan ini yang bisa melakukan aksi ini. |
| `NOT_ORDER_PARTICIPANT` | Kamu bukan peserta pesanan ini. |
| `NOT_FOUND` | Data tidak ditemukan. |
| `ORDER_TRANSITION_NOT_ALLOWED` | Status pesanan sudah berubah. Halaman diperbarui. |
| `ORDER_ALREADY_CLAIMED` | Pesanan ini sudah diambil. |
| `RESPONSE_DEADLINE_PASSED` | Waktu untuk merespons pesanan ini sudah habis. |
| `PAYMENT_DEADLINE_PASSED` | Batas waktu pembayaran sudah lewat. |
| `WORKER_HAS_INFLIGHT_ORDER` | Pekerja ini sedang mengerjakan pesanan lain. Pilih pekerja lain. |
| `WORKER_SCHEDULE_CONFLICT` | Jadwal pekerja ini bentrok dengan pesanan lain. Pilih pekerja lain. |
| `WORKER_NOT_ASSIGNABLE` | Pekerja ini sedang tidak bisa ditugaskan. |
| `WORKER_NOT_MAPPED_TO_LISTING` | Pekerja ini belum dipetakan ke jasa ini. |
| `CREW_NOT_ALLOWED_FOR_MODE` | Pendamping hanya bisa ditambahkan pada pesanan terjadwal. |
| `PROVIDER_HAS_NO_ACTIVE_WORKER` | Usahamu harus punya minimal satu pekerja aktif yang bisa ditugaskan. |
| `LISTING_HAS_NO_WORKER` | Jasa ini belum bisa ditayangkan karena belum ada pekerja yang dipetakan. |
| `LISTING_NOT_AVAILABLE` | Jasa ini sedang tidak tersedia. |
| `ORDER_ALREADY_PAID` | Pesanan ini sudah dibayar. |
| `MESSAGE_WINDOW_CLOSED` | Percakapan untuk pesanan ini sudah ditutup. |
| `DISPUTE_ALREADY_EXISTS` | Pesanan ini sudah punya komplain. |
| `DISPUTE_WINDOW_CLOSED` | Batas waktu mengajukan komplain sudah lewat. |
| `ATTRIBUTE_VALIDATION_FAILED` | Ada spesifikasi jasa yang belum sesuai. Periksa lagi yang ditandai. |
| `OPTION_NOT_OFFERED` | Pilihan ini tidak dilayani penyedia. Pilih yang lain. |
| `UNSUPPORTED_FILE_TYPE` | Jenis berkas tidak didukung. Gunakan JPG, PNG, atau PDF. |
| `STORAGE_UPLOAD_FAILED` | Berkas gagal diunggah. Coba lagi. |
| `CHECKIN_OUT_OF_RADIUS` | Kamu masih di luar radius lokasi. Dekati alamat lalu coba lagi. |
| `VERIFICATION_CODE_INVALID` | Kode salah. |
| `VERIFICATION_CODE_EXPIRED` | Kode sudah kedaluwarsa. Minta pelanggan membuat kode baru. |
| `VERIFICATION_LOCKED` | Terlalu banyak percobaan. Coba lagi setelah waktu tunggu selesai. |
| `INSUFFICIENT_BALANCE` | Saldo tersedia tidak cukup. |
| `WITHDRAWAL_BELOW_MINIMUM` | Nominal di bawah batas minimum penarikan. |
| `TOKEN_INVALID` | Link tidak valid. Minta link baru. |
| `TOKEN_EXPIRED` | Link sudah kedaluwarsa. Minta link baru. |
| `TOKEN_ALREADY_USED` | Link ini sudah pernah dipakai. |
| `TAXONOMY_REQUEST_LIMIT` | Kamu sudah punya 3 usulan yang menunggu. Tunggu salah satunya diputuskan. |
| `TAXONOMY_REQUEST_STATE_CONFLICT` | Usulan ini sudah diputuskan. |
| `GUEST_CHAT_LIMIT_REACHED` | Batas percakapan tamu sudah tercapai. Daftar gratis untuk melanjutkan. |
| `RATE_LIMIT_EXCEEDED` | Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi. |
| `GEMINI_UNAVAILABLE` | Asisten sedang tidak tersedia. Kamu tetap bisa mencari lewat kolom pencarian. |
| `PAYMENT_GATEWAY_ERROR` | Layanan pembayaran sedang bermasalah. Coba lagi beberapa saat. |
| `EMAIL_DELIVERY_FAILED` | Email belum terkirim. Sistem akan mencoba lagi. |
| `CHATBOT_TEMPORARILY_UNAVAILABLE` | Asisten sedang tidak tersedia. Kamu tetap bisa mencari lewat kolom pencarian. |
| `PROVIDER_STATE_CONFLICT` | Status pengajuan usahamu sudah berubah. Halaman diperbarui. |
| `WORKER_MEMBERSHIP_CONFLICT` | Kamu masih tercatat aktif di usaha lain, atau lamaranmu sudah pernah diproses. |
| `LISTING_HAS_ACTIVE_ORDERS` | Jasa ini masih punya pesanan yang belum selesai, jadi belum bisa dihapus. |
| `WITHDRAWAL_STATE_CONFLICT` | Status pencairan ini sudah berubah. Halaman diperbarui. |
| `REFUND_STATE_CONFLICT` | Status pengembalian dana ini sudah berubah. Halaman diperbarui. |
| `DISPUTE_STATE_CONFLICT` | Status komplain ini sudah berubah. Halaman diperbarui. |
| `DISPUTE_EVIDENCE_LIMIT_REACHED` | Kamu sudah mengunggah bukti sebanyak batas maksimal. |
| `CHAT_SESSION_ENDED` | Percakapan dengan Asisten ini sudah berakhir. Mulai percakapan baru. |
| `CHAT_SESSION_ALREADY_CLAIMED` | Percakapan ini sudah tersimpan ke akun. |
| `REVIEW_NOT_ALLOWED` | Ulasan hanya bisa diberikan untuk pesanan yang sudah selesai. |
| `REVIEW_WINDOW_CLOSED` | Batas waktu memberi ulasan sudah lewat. |
| `REVIEW_ALREADY_EXISTS` | Kamu sudah memberi ulasan untuk pesanan ini. |
| `REVIEW_ALREADY_REPLIED` | Ulasan ini sudah dibalas. |
| `SETTING_CONFLICTS_WITH_DATA` | Nilai ini bertentangan dengan data yang sudah ada. |
| `UNAUTHORIZED` di halaman masuk | Email, nomor ponsel, atau kata sandi salah. (Konstanta `LOGIN_UNAUTHORIZED_MESSAGE`, khusus halaman masuk) |

### A.2 Lapisan infrastruktur

| Kode | Pesan |
|---|---|
| `INVALID_JSON` | Permintaan tidak bisa diproses. Muat ulang halaman lalu coba lagi. |
| `PAYLOAD_TOO_LARGE` | Berkas terlalu besar. Maksimal 5 MB. |
| `CORS_ORIGIN_NOT_ALLOWED` | Permintaan ditolak server. (Pesan ini hanya muncul kalau konfigurasi `CORS_ORIGIN` salah) |
| `SERVICE_UNAVAILABLE` | Layanan sedang tidak tersedia. Coba lagi beberapa saat. |
| `INTERNAL_ERROR` | Terjadi kesalahan di server. Coba lagi beberapa saat. |
| Kode tidak dikenal | Terjadi kesalahan. Coba lagi. |

---

## Lampiran B. Riwayat Revisi

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 17 November 2026 | Versi awal (draf). Disusun dari PRD Backend v2.5, State Machine v2.6, dan register v2.11 ditambah keputusan lanjutan yang diketahui. Usulan FE1 sampai FE14 belum dicatat ke register |
| 1.1 | 18 November 2026 | FE1 sampai FE14 disetujui dan dicatat di register v2.43 sebagai D210 sampai D223. Variabel `NEXT_PUBLIC_STORAGE_PUBLIC_HOST` diganti pola tetap (D226). Status milestone W0 dan W2, temuan implementasi (Bagian 12.3), dan empat belas kode error baru di Lampiran A.1 |
| 1.2 | 18 November 2026 | Sesi login selesai (register v2.44, D231 sampai D235). `proxy.ts` pindah ke `src/`, contoh base URL ke port 3000, validasi Zod terpasang, hasil pengecekan 12.1 nomor 1 dan 2, temuan 11 sampai 14, dan pesan 401 khusus halaman masuk |
