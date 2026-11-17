# Jasana, Frontend (apps/web)

Frontend marketplace jasa on-demand untuk Tugas Akhir. Satu aplikasi Next.js untuk tamu dan empat aktor (client, provider, pekerja, admin). Backend Express sudah selesai dan **menjadi penentu seluruh logika bisnis**. Frontend menampilkan, mengumpulkan pilihan pengguna, dan meneruskannya.

Aturan dari `CLAUDE.md` di root repo tetap berlaku: **dokumen desain adalah sumber kebenaran, bukan kode.** Kalau menemukan alasan kuat untuk mengubah perilaku, **sampaikan usulannya, jangan langsung terapkan.** Setiap keputusan baru dicatat di register sebelum masuk kode.

## Dokumen rujukan

| Berkas | Isi | Baca kapan |
|---|---|---|
| `docs/PRD-Frontend.md` | Arsitektur, usulan keputusan FE, peta rute, spesifikasi halaman, milestone W0 sampai W9, peta kode error | **Setiap awal sesi**, minimal bagian fase yang dikerjakan |
| `docs/Design-System.md` | Token warna, tipografi, komponen, label status, format, glosarium | Setiap kali membuat atau mengubah tampilan |
| `docs/Matriks-UI-Order.md` | Tombol dan tampilan per status order per penampil, spesifikasi `getOrderActions()` | Setiap kali menyentuh order |
| `docs/PRD-Backend.md` | Kontrak endpoint, kode error, Socket.IO | Saat memanggil endpoint |
| `docs/State-Machine-Order.md` | 15 status, 22 transisi, guard | Saat menyentuh order |
| `docs/Keputusan-Desain-Sistem.md` | Register keputusan D1 sampai terbaru | Kalau ragu kenapa sesuatu dirancang begitu |
| `apps/api/src/modules/*/*.routes.ts` dan `*.schema.ts` | **Kontrak endpoint yang benar-benar berjalan** | Sebelum memanggil endpoint apa pun |

Dokumen frontend disusun dari register v2.11. Kalau isinya berbeda dengan register atau route terbaru di repo, **register dan route yang menang**. Laporkan perbedaannya di awal sesi, jangan diam-diam menyesuaikan.

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript `strict`, Tailwind CSS v4, shadcn/ui, lucide-react, TanStack Query v5, react-hook-form + Zod, socket.io-client, Leaflet + react-leaflet, sonner, Vitest, Playwright.

**Versi dipin setelah Fase W0.** Jangan menaikkan versi mayor tanpa keputusan tercatat.

Sejak Next.js 16, `middleware.ts` bernama **`proxy.ts`** dan fungsinya bernama `proxy`. Jangan membuat `middleware.ts`.

## Struktur

```
apps/web/src/
  app/
    (publik)/  (auth)/  (pelanggan)/  usaha/  pekerja/  admin/
    api/session/       Route Handler sesi SAJA (login, refresh, logout)
    dev/ui/            galeri komponen, development saja
  components/
    ui/                shadcn/ui
    layout/            header, sidebar, bottom-nav, role-switcher
    shared/            komponen domain lintas fitur
  features/<domain>/   api.ts, queries.ts, schemas.ts, components/
  lib/                 api-client, session, socket, query-keys, error-messages,
                       order-status, enum-labels, format, time, geo
  types/api/           tipe respons API, snake_case
proxy.ts
```

---

## Tiga belas aturan yang tidak boleh dilanggar

1. **`apps/web` tidak pernah mengimpor `@prisma/client`, `packages/database`, atau apa pun dari `apps/api`.** Seluruh data lewat REST API Express. Tidak ada Server Action yang menulis data. Yang boleh diimpor dari monorepo hanya `packages/shared`
2. **Request tidak pernah memuat nominal.** `total_amount`, `platform_fee`, `provider_earning`, `admin_fee`, `net_amount`, dan angka uang hasil hitungan lain tidak pernah dikirim. Pratinjau harga boleh, berlabel "Perkiraan". Angka final selalu dari respons server
3. **Tombol aksi order hanya dari `getOrderActions()`.** Tidak ada if-else status order di JSX. `OrderActionBar` hanya merender hasil fungsi itu
4. **Status order dan uang tidak pernah diubah di cache sebelum server menjawab.** Tidak ada optimistic update untuk transisi order, pembayaran, saldo, maupun pencairan
5. **Pembayaran lunas hanya kalau server bilang `PAID`.** Kembali dari halaman sukses Xendit bukan bukti
6. **Batas waktu dibaca dari kolom server** (`response_deadline_at`, `payment_deadline_at`, `verification_expires_at`, `verification_locked_until`, `settlement_due_at`). Tidak ada nilai `platform_settings` yang ditulis ulang di frontend: komisi, batas waktu, minimum pencairan, biaya admin, radius, ambang lokasi
7. **Access token hanya di memori. Refresh token hanya di cookie `httpOnly`** lewat `/api/session/*`. Tidak ada token akun di `localStorage` atau `sessionStorage`. Satu-satunya pengecualian: `guest_token` Asisten di `sessionStorage`
8. **Warna, radius, dan huruf hanya dari token Design System.** Tidak ada hex, `rgb()`, nilai arbitrer (`bg-[#...]`, `p-[13px]`), atau palet bawaan Tailwind (`bg-teal-700`, `text-gray-500`) di `className`
9. **Seluruh teks UI berbahasa Indonesia sesuai glosarium** Design System Bagian 9. Kata "chat" hanya untuk Asisten. Pesan dalam order bernama "Pesan"
10. **Setiap halaman data punya empat state:** memuat (skeleton), kosong, error (dengan Coba lagi), berhasil
11. **Lokasi check-in diambil dari GPS saat tombol ditekan.** Frontend tidak pernah mengirim jarak. Jarak yang ditampilkan ke pekerja hanya panduan
12. **Pola unggah mengikuti D80.** e-KYC dan bukti komplain: multipart ke API. Foto listing: signed URL, PUT ke Storage, lalu **wajib** memanggil endpoint pencatat foto
13. **Socket.IO hanya pemicu.** Event masuk memicu invalidasi cache. Client hanya mengirim `worker:presence` dan `order:location_update`. Tidak ada perubahan state lewat socket

---

## Jebakan yang sering terjadi

### 1. Tipe Prisma bukan bentuk JSON API

Terlihat praktis mengimpor tipe `Order` dari Prisma, tapi salah:

| | Prisma | JSON API |
|---|---|---|
| Nama field | `assignedWorkerId` | `assigned_worker_id` |
| Uang | `Decimal` | integer rupiah |
| Waktu | `Date` | string ISO 8601 UTC |

Tulis tipe respons di `src/types/api/` dalam snake_case. Enum dan `ALLOWED_TRANSITIONS` ambil dari `packages/shared`. Kalau `packages/shared` ternyata mengimpor `@prisma/client` untuk enumnya, **laporkan**, jangan ikut mengimpor Prisma.

### 2. Rotasi refresh token dan banyak tab

Backend memakai rotasi dengan deteksi pemakaian ulang (D76). Kalau dua request atau dua tab me-refresh dengan token yang sama, request kedua terbaca sebagai pencurian dan **seluruh sesi pengguna dicabut**.

```ts
// lib/session.ts
// 1. Single-flight di dalam tab: semua 401 yang datang bersamaan
//    menunggu SATU promise refresh yang sama.
// 2. Antar tab: bungkus dengan navigator.locks.request('jasana-refresh', ...).
//    Tab yang menunggu otomatis mengirim cookie terbaru, karena browser
//    membaca cookie saat request dibuat.
```

Wajib diuji di W0: buka dua tab, paksa access token kedaluwarsa, muat ulang keduanya bersamaan, pengguna harus tetap masuk.

### 3. Route Handler sesi menyembunyikan IP pengguna

`/api/session/login` memanggil Express dari server Next, jadi Express melihat IP server Next, bukan IP pengguna. Rate limit login 10 per 15 menit per IP akan habis untuk **semua** pengguna sekaligus saat UAT.

Teruskan `X-Forwarded-For` dan `User-Agent` dari request asli. Di backend, `TRUST_PROXY` (D117) diatur supaya header itu dipercaya. `User-Agent` yang diteruskan juga yang tampil di halaman Perangkat aktif.

### 4. `proxy.ts` bukan pengaman

`proxy.ts` hanya mengalihkan tamu ke `/masuk` berdasarkan ada tidaknya cookie sesi. Otorisasi tetap di layout area (kapabilitas dari `/auth/me`) dan **terutama di Express**. Jangan menaruh pemeriksaan hak akses yang penting hanya di proxy.

### 5. Leaflet tidak bisa dirender di server

Leaflet membaca `window` saat diimpor. Muat lewat:

```ts
const MapView = dynamic(() => import('@/components/shared/map-view'), { ssr: false })
```

Impor juga `leaflet/dist/leaflet.css`. Ikon penanda bawaan Leaflet sering hilang setelah dibundel karena path gambarnya rusak. Pakai ikon sendiri (`L.divIcon` dengan ikon lucide), jangan bergantung pada ikon bawaan.

### 6. `window`, `navigator`, dan hook di Server Component

Geolokasi, socket, `navigator.locks`, dan seluruh hook React hanya di Client Component (`'use client'`). Server Component dipakai untuk halaman publik saja (FE2).

### 7. Hydration mismatch karena waktu

Memformat `new Date()` atau tanggal relatif di server lalu di client menghasilkan teks berbeda. Waktu relatif dan hitung mundur dirender di client saja. Tanggal absolut selalu diformat dengan zona `Asia/Makassar` yang eksplisit, sehingga hasil server dan client sama.

### 8. Input waktu dan zona perangkat

`<input type="datetime-local">` menghasilkan waktu menurut zona perangkat. Seluruh jadwal dalam WITA (FE6). Konversi eksplisit:

```ts
// lib/time.ts
// "2026-11-20T14:00" yang dipilih pengguna adalah WITA:
const iso = new Date('2026-11-20T14:00:00+08:00').toISOString()
// -> "2026-11-20T06:00:00.000Z"
```

Indonesia tanpa waktu musim panas, jadi offset `+08:00` selalu benar. Jangan memakai `new Date('2026-11-20T14:00')` tanpa offset.

### 9. Uang sudah integer rupiah

Jangan dibagi atau dikali 100. Format hanya lewat `formatRupiah()`. Jangan memanggil `toLocaleString` langsung di komponen, karena `Intl` menyisipkan spasi tak terputus di antara "Rp" dan angka.

### 10. Geolokasi butuh HTTPS

`navigator.geolocation` hanya jalan di HTTPS atau `localhost`. Membuka dev server dari HP lewat `http://192.168.x.x` tidak akan pernah bisa membaca lokasi, dan errornya terlihat seperti izin ditolak. Uji di HP lewat tunnel HTTPS atau staging.

`watchPosition` wajib dihentikan (`clearWatch`) saat toggle dimatikan, status order berubah, atau komponen dilepas.

### 11. Kapabilitas, bukan role

`users.role` hanya CLIENT atau ADMIN. Provider dan pekerja ditentukan relasi (D4, D35). Pemilik usaha **juga** pekerja di usahanya sendiri (D33), jadi bisa sekaligus `isOwner` dan `isAssignee` pada satu order. Hitung lewat `getViewer()`, gabungkan aksinya.

Access token memuat `provider_profile_id` dan `worker_id` yang bisa basi sampai 15 menit setelah keanggotaan berubah. Setelah aksi yang mengubah keanggotaan, atau saat menerima 403 di aksi order, refetch `['me']`.

### 12. Hitung mundur dan jam perangkat

Jam perangkat bisa meleset dari jam server. Saat hitung mundur habis, **jangan mengubah status di client**. Nonaktifkan tombol terkait, tampilkan "Menunggu sistem memperbarui status", dan refetch berkala. Penolakan server karena deadline ditampilkan sebagai pesan biasa.

### 13. Berkas privat dan `next/image`

Signed URL dokumen e-KYC dan bukti komplain berumur pendek dan privat. Kalau dilewatkan ke `next/image`, optimizer server Next ikut menyimpan salinannya. Pakai `<img>` biasa atau buka di tab baru. `next/image` hanya untuk bucket publik foto listing, dengan host yang didaftarkan di `remotePatterns`.

### 14. Konten dari pengguna dan dari model

Deskripsi jasa, FAQ, ulasan, pesan dalam order, dan jawaban Asisten dirender sebagai teks. **Tidak ada `dangerouslySetInnerHTML`** untuk konten seperti ini.

### 15. Penamaan yang jangan tertukar

| Jangan | Pakai | Alasan |
|---|---|---|
| "Chat" untuk pesan dalam order | "Pesan" | Chat milik Asisten (D79) |
| "Pekerja yang mengerjakan" | "Penanggung jawab" | D68 |
| `base_price` | `listing_base_amount` | Isinya bukan lagi harga dasar sejak ada opsi berbayar |
| `price` untuk nominal order | `amount` | `price` untuk daftar harga, `amount` untuk yang melekat pada order |
| Membaca durasi dari `listings.attributes` | `estimated_duration_minutes` | D90 |
| `middleware.ts` | `proxy.ts` | Next.js 16 |

---

## Konvensi kode

| Aspek | Ketentuan |
|---|---|
| Nama berkas | `kebab-case.tsx`. Komponen `PascalCase`, hook `useSesuatu` |
| Data fetching | TanStack Query lewat hook di `features/<domain>/queries.ts`. Kunci query hanya dari `lib/query-keys.ts` |
| Pemanggilan API | Hanya lewat `lib/api-client.ts`. Tidak ada `fetch` mentah ke API di komponen |
| Formulir | react-hook-form + `zodResolver`. Error 422 dari server dipetakan ke field lewat `details` |
| Label status dan enum | Hanya dari `lib/order-status.ts` dan `lib/enum-labels.ts` |
| Pesan error | Hanya dari `lib/error-messages.ts` |
| Format angka dan waktu | Hanya dari `lib/format.ts` dan `lib/time.ts` |
| Komponen shadcn | Ditambah lewat CLI shadcn. Ubah seperlunya, dan catat alasannya di komentar |
| Komentar | Bahasa Indonesia, menjelaskan **kenapa**, bukan apa. Rujuk nomor D atau FE kalau ada |
| `any` | Dilarang. Pakai `unknown` lalu persempit |

---

## Cara kerja per sesi

1. Baca berkas ini dan bagian `PRD-Frontend.md` untuk fase yang dikerjakan
2. **Cocokkan endpoint yang akan dipakai** dengan `*.routes.ts` dan `*.schema.ts` di `apps/api`. Laporkan perbedaan dengan dokumen sebelum menulis kode
3. Susun rencana di Plan mode. Tunggu persetujuan
4. Kerjakan satu fase, atau satu bagian fase yang sudah disepakati
5. **Verifikasi visual:** jalankan dev server, ambil screenshot di **390 px dan 1280 px** (tambah 768 px untuk area usaha) lewat Playwright, bandingkan dengan Design System dan mockup acuan (tautan di `Design-System.md` bagian atas). Perbaiki yang meleset sebelum melapor selesai
6. Jalankan typecheck, lint, dan test. Semua hijau
7. Laporkan: apa yang selesai, usulan pesan commit, apa yang berbeda dari dokumen, dan usulan keputusan baru kalau ada

**Skill `frontend-design`.** Kalau aktif, arah estetika sudah ditetapkan di `Design-System.md` Bagian 0. Jangan memilih arah, palet, atau huruf baru. Kreativitas dipakai untuk komposisi dan detail interaksi di dalam batas token.

## Git dan branch

Seluruh pekerjaan frontend dilakukan di branch **`feat/frontend`**, bukan di `main`.

- Sebelum mulai sesi, pastikan `git branch --show-current` menampilkan `feat/frontend`. Kalau tidak, berhenti dan laporkan
- Perubahan hanya di `apps/web/`. Jangan mengubah `apps/api/`, `packages/database/`, atau skema Prisma dari branch ini
- Kalau butuh perubahan di `packages/shared` atau backend (endpoint kurang, field tidak ada, bug API), **jangan dikerjakan di sini**. Catat di laporan sesi. Perubahan itu dikerjakan di `main`, lalu `main` di-merge ke `feat/frontend`
- **Jangan commit, push, atau merge.** Commit dilakukan sendiri oleh Candra. Di akhir sesi, berikan daftar berkas yang berubah dan usulan pesan commit (format `feat(web): ...`, `fix(web): ...`, `docs(web): ...`). Kalau pekerjaannya lebih rapi dipecah, usulkan beberapa commit beserta berkasnya masing-masing
- Jangan menjalankan `git add`, `git commit`, `git stash`, `git reset`, atau `git checkout` yang mengubah working tree

## Urutan pengerjaan

Ikuti milestone di `PRD-Frontend.md` Bagian 11. Satu fase sampai tuntas sebelum pindah.

```
W0. Fondasi         token, layout, api-client, sesi, socket, format, getOrderActions, galeri
W1. Auth dan akun   daftar, verifikasi email, masuk, sandi, profil, alamat, keamanan
W2. Publik          beranda, kategori, pencarian dan filter, detail jasa, profil penyedia
W3. Pelanggan       formulir pesan, pesanan, bayar, kode, ulasan, pesan, komplain
W4. Usaha           daftar penyedia, editor jasa, kelola pekerja, usulan, naik tipe
W5. Lapangan        terima dan tugaskan, tawaran realtime, ketersediaan, alur pekerja
W6. Uang            saldo, ledger, pencairan
W7. Admin           verifikasi, katalog, usulan, pencairan, komplain, laporan, pengaturan
W8. Asisten         widget, sesi tamu dan login, klaim sesi, kartu rekomendasi
W9. Perapian        notifikasi, empat state, aksesibilitas, responsif, uji coba UAT
```

## Yang di luar cakupan

Jangan membangun ini walaupun terasa kurang lengkap:

- Mode gelap, multi-bahasa, PWA, mode offline, push notification
- Percakapan pra-order atau tombol "hubungi penyedia" di halaman jasa (D78, D79)
- Lampiran di pesan dalam order (D79)
- Pembayaran di dalam halaman. Pembayaran lewat halaman invoice Xendit
- Layanan geocoding (FE9)
- Formulir khusus per sub-kategori. Atribut dinamis selalu lewat perender generik
- Tampilan jumlah pendamping ke client (D69)
- Pemilihan pekerja oleh client saat memesan. Rating dan pilihan milik usaha (D49)
- Analytics pihak ketiga
