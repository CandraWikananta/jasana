# Design System Jasana

**Artefak frontend 2 dari 4**
Platform Jasana, Tugas Akhir I Nyoman Gede Candra Wikananta (2305551065)
**Versi 2.1 (disetujui)**, 22 November 2026

Dokumen ini menetapkan bahasa visual dan bahasa teks seluruh antarmuka Jasana: warna, tipografi, jarak, komponen, label status, format angka dan waktu, serta glosarium. Tujuannya satu: **empat area (publik dan client, usaha, pekerja, admin) terlihat dan terbaca seperti satu produk**, walaupun dibangun dalam belasan sesi Claude Code yang terpisah.

> **Status nilai token.** Versi 2.0 **disetujui** pada 21 November 2026 setelah tinjauan mockup frame 05f, "Status berhasil: sebelum dan sesudah", dan "Pilihan menu sidebar aktif" (pilihan H) di [mockup Jasana](https://claude.ai/artifact/JbFfFaYxNEV4MBeJKBKUZA). Versi ini **mengganti palet v1.6 seluruhnya**: hijau zamrud dan lime tidak dipakai lagi. Kalau mockup dan dokumen ini berbeda, **dokumen ini yang menang**. Perubahan token berikutnya lewat revisi dokumen ini lebih dulu, baru kode. Yang tidak berubah adalah strukturnya: seluruh komponen membaca token, tidak ada nilai warna, radius, atau font yang ditulis lepas. Panduan memindahkan kode dari v1.6 ada di Bagian 14.

> **Versi 2.1** (22 November 2026) adalah hasil review v2.0 dengan empat skill desain (ui-ux-pro-max, taste, impeccable, web-design-guidelines) terhadap halaman peraga `/dev/ds`. Keputusannya D242 sampai D250. Palet warna tidak berubah. Yang berubah: penanda mode Sekarang tanpa garis tepi kiri (D242), penanda posisi aktif pucat (D243), switch (D244), label `SETTLED` (D245), skala tipografi (D247), serta aturan formulir, aksesibilitas, komposisi, dan nada yang sebelumnya belum ada. Halaman `/dev/ds` menjadi acuan visual pengganti mockup.

---

## 0. Prinsip

| # | Prinsip | Artinya di layar |
|---|---|---|
| P1 | **Jelas dulu, baru menarik** | UAT menilai fungsionalitas, kemudahan, dan kepuasan per aktor (D85). Pengguna harus selalu tahu status pesanannya dan langkah berikutnya tanpa membaca paragraf |
| P2 | **Satu layar, satu aksi utama** | Paling banyak satu tombol `primary` (hitam) per tampilan. Aksi lain `outline`, `secondary`, atau `ghost`. Pengecualian: tombol `now` di dalam kartu tawaran |
| P3 | **Pekerja memakai HP di lapangan** | Area pekerja dirancang untuk lebar 390 px, satu tangan, layar terkena matahari: tombol besar, kontras tinggi, teks pendek |
| P4 | **Angka datang dari server** | Uang, waktu, dan sisa waktu selalu dari respons API, diformat dengan satu set fungsi yang sama |
| P5 | **Status tidak hanya warna** | Setiap status punya teks dan ikon, bukan sekadar warna |

### Arah estetika

**Hangat, rapi, dan tepercaya, dengan satu warna yang menyala.** Platform ini menangani uang orang dan mengirim orang ke rumah orang lain, jadi dasarnya tenang. Hijau terang memberi energi dan menandai apa yang sedang aktif atau sedang terjadi.

**Aturan tiga warna:**

| Warna | Arti | Contoh |
|---|---|---|
| **Hitam hangat** `#1C1917` | **Lakukan ini.** Aksi utama | Tombol Pesan, Bayar, Verifikasi, Lanjut, Tambah jasa |
| **Hijau terang** `#22C55E` | **Ini yang terpilih, aktif, atau sedang terjadi** | Tombol Ambil dan Terima (solid), badge dan titik live mode Sekarang, switch menyala, serta menu dan tab aktif, opsi terpilih, dan chip filter aktif (pucat) |
| **Teal** `#0F766E` | **Ini sudah berhasil.** Hanya status | Badge Selesai, Terverifikasi, Dana cair, banner pesanan selesai |

| Pilihan | Alasan |
|---|---|
| Hitam hangat sebagai warna aksi utama | Netral, tegas, dan kontrasnya paling tinggi (17,49:1 dengan teks putih). Tombol utama selalu terbaca tanpa bersaing dengan warna status |
| Hijau terang sebagai secondary | Memberi karakter dan energi. Karena kontrasnya dengan putih rendah (2,28:1), hijau terang **tidak pernah jadi warna teks di atas terang** dan teks di atasnya selalu hitam. Teks dan tautan hijau memakai `--brand-strong` |
| Mode Sekarang memakai hijau yang sama, dibedakan lewat **bentuk** | Satu bentuk di semua tempat: badge pill putih bergaris hijau dengan titik live, dipakai sama di kartu listing, kartu pesanan, kartu tawaran, dan toggle (D242). Tidak ada garis tepi kiri dan tidak ada warna khusus Sekarang |
| Solid hijau hanya untuk aksi Sekarang | Penanda posisi (menu, tab, navigasi bawah) memakai hijau pucat, supaya tombol Ambil dan Terima menjadi satu-satunya elemen hijau solid di layar pekerja (D243) |
| Status berhasil memakai teal, bukan hijau | Supaya badge Selesai tidak tertukar dengan chip filter aktif, menu aktif, atau chip Sekarang yang hijau |
| Banner berlapis: latar pucat, garis tipis, chip ikon | Satu bentuk untuk semua nada status (Bagian 1.4b). Warna pucatnya tidak berebut perhatian dengan tombol |
| Bintang rating kuning | Paling cepat dikenali sebagai rating. Hanya berupa ikon di samping angka, jadi tidak tertukar dengan warning yang selalu berupa pill berisi teks |
| Netral hangat (stone), bukan abu-abu dingin | Lebih ramah untuk produk jasa rumah tangga |
| Plus Jakarta Sans | Huruf karya desainer Indonesia, terbaca baik di ukuran kecil, punya angka tabular |
| Identitas dari pola, bukan dari nilai hex | Sebagian besar nilai warna sama dengan palet bawaan Tailwind. Ini disengaja: karakter Jasana dibawa aturan tiga warna, badge Sekarang, dan nada teks, bukan oleh satu nilai hex yang dibuat beda tipis (review T10, D242 sampai D250) |
| Garis tepi tipis, bukan bayangan tebal | Kartu dan tabel tetap rapi saat padat data (dashboard usaha dan admin) |

**Hindari:** gradien ungu-biru, efek kaca (glassmorphism), emoji sebagai ikon, ilustrasi 3D generik, bayangan tebal di kartu, kartu dengan garis tepi kiri berwarna, kartu di dalam kartu lebih dari dua lapis, teks paragraf yang dirata tengah, animasi yang tidak membawa informasi, judul berisi klaim seperti "tepercaya" atau "terbaik", dan teks hijau terang di atas latar terang.

**Untuk Claude Code.** Kalau skill `frontend-design` aktif, arah estetika di bagian ini **sudah ditetapkan**. Jangan memilih arah baru, palet lain, atau font lain. Pakai kreativitas untuk komposisi dan detail interaksi di dalam batas token ini.

---

## 1. Warna

Nama token mengikuti konvensi shadcn/ui supaya komponen bawaannya langsung memakai palet ini. Token tambahan khusus Jasana ditandai **(Jasana)**.

**Catatan penamaan.** Dalam bahasa desain, hijau terang disebut *secondary*. Di kode, tokennya bernama **`--brand`**, karena shadcn sudah memakai `--secondary` untuk tombol sekunder abu-abu. Jangan mengubah arti `--secondary` bawaan shadcn.

### 1.1 Netral dan permukaan

| Token | Nilai | Pemakaian |
|---|---|---|
| `--background` | `#FAFAF9` | Latar halaman |
| `--foreground` | `#1C1917` | Teks utama |
| `--card` | `#FFFFFF` | Kartu, panel, dialog, sidebar |
| `--card-foreground` | `#1C1917` | Teks di kartu |
| `--popover` | `#FFFFFF` | Dropdown, popover |
| `--popover-foreground` | `#1C1917` | |
| `--muted` | `#F5F5F4` | Latar bagian sekunder, hover baris dan menu, skeleton, latar tombol nonaktif |
| `--muted-foreground` | `#57534E` | Teks sekunder, metadata, keterangan |
| `--border` | `#E7E5E4` | Garis tepi kartu dan pemisah (dekoratif) |
| `--input` | `#918A84` | Garis tepi input, checkbox, radio, tombol outline (3,40:1, syarat komponen UI) |
| `--disabled-foreground` **(Jasana)** | `#A8A29E` | Teks tombol nonaktif. Elemen nonaktif tidak wajib memenuhi kontras |

### 1.2 Primary: hitam hangat (aksi)

| Token | Nilai | Pemakaian |
|---|---|---|
| `--primary` | `#1C1917` | Tombol utama. Paling banyak satu per tampilan (P2) |
| `--primary-foreground` | `#FFFFFF` | Teks di atas `--primary` |
| `--primary-hover` **(Jasana)** | `#44403C` | Hover tombol utama |
| `--primary-pressed` **(Jasana)** | `#0C0A09` | Saat tombol utama ditekan |
| `--ring` | `#1C1917` | Cincin fokus keyboard semua elemen: 2 px dengan jarak putih 2 px, sehingga terlihat di atas tombol hitam, tombol hijau, maupun latar putih |
| `--secondary` | `#F5F5F4` | Tombol sekunder abu-abu (bawaan shadcn) |
| `--secondary-foreground` | `#1C1917` | |
| `--accent` | `#F5F5F4` | Hover item menu dan baris |
| `--accent-foreground` | `#1C1917` | |

### 1.3 Brand: hijau terang (secondary)

Artinya selalu **terpilih, aktif, atau sedang terjadi**. Tidak pernah untuk status dan tidak pernah untuk aksi utama di luar mode Sekarang.

| Token | Nilai | Pemakaian |
|---|---|---|
| `--brand` **(Jasana)** | `#22C55E` | Isi solid: tombol aksi mode Sekarang (Ambil, Terima), titik live, garis badge Sekarang, garis stepper yang sudah dilewati |
| `--brand-foreground` **(Jasana)** | `#1C1917` | Teks dan ikon di atas `--brand`. **Selalu hitam, tidak pernah putih** (putih di atas hijau terang hanya 2,28:1) |
| `--brand-hover` **(Jasana)** | `#16A34A` | Hover dan pressed elemen `--brand` yang bisa ditekan. **Trek dan garis switch menyala** (3,30:1 terhadap kartu dan thumb putih, D244) |
| `--brand-strong` **(Jasana)** | `#15803D` | Teks hijau di atas terang: tautan, ikon tautan, tautan aktif di header publik |
| `--brand-subtle` **(Jasana)** | `#DCFCE7` | Latar pucat: **menu sidebar, navigasi bawah, dan tab aktif** (D243), chip filter aktif, opsi terpilih, lingkaran stepper selesai, avatar inisial, lencana angka di item yang tidak aktif |
| `--brand-subtle-foreground` **(Jasana)** | `#166534` | Teks dan ikon di atas `--brand-subtle` |
| `--brand-glow` **(Jasana)** | `rgba(34, 197, 94, 0.2)` | Lingkaran cahaya 4 px di sekitar titik live |

**Aturan pakai:**

- `--brand` tidak pernah dipakai sebagai warna teks, ikon, atau garis tipis di atas latar terang. Untuk teks hijau, pakai `--brand-strong`
- Elemen `--brand` solid selalu berisi teks atau ikon `--brand-foreground` (hitam)
- Titik live dan garis 1 px badge Sekarang boleh `--brand` di atas putih, karena hanya penanda tambahan: maknanya selalu dibawa teks di sebelahnya (Bagian 1.5, penanda grafis)
- Garis 2 px `--brand` boleh untuk opsi terpilih dan input kode yang sedang diisi, karena selalu berpasangan dengan latar `--brand-subtle` atau teks yang membawa makna
- Garis tepi kiri berwarna tidak dipakai lagi di kartu mana pun (D242)

### 1.3b Mode "Sekarang"

Mode Available Now **tidak punya warna sendiri lagi**. Bentuknya yang membedakan:

| Elemen | Bentuk |
|---|---|
| Kartu tawaran (`OfferCard`) | Kartu biasa: latar `--card`, garis `--border`, **tanpa garis tepi kiri dan tanpa bayangan** (D242). Baris atas: label "Tawaran baru" (`caption` 600, `--muted-foreground`) di kiri, badge mode Sekarang dengan titik live di kanan. Lalu judul jasa (`h3`), baris hitung mundur (ikon `Clock` `--muted-foreground`, angka `--foreground` `tabular-nums`, di bawah 5 menit `--destructive`), dan detail. Tombol Ambil atau Terima varian `now`, Lewati atau Tolak varian `outline`, keduanya `lg` di area pekerja |
| Badge mode Sekarang | Pill latar `--card`, garis 1 px `--brand`, titik live 6 px, teks `--foreground` 600 "Sekarang", tinggi 28 px. **Bentuk yang sama** di kartu listing, kartu pesanan, kartu tawaran, dan toggle |
| Badge mode Terjadwal | Pill latar `--card`, garis `--border`, ikon `CalendarClock` dan teks `--muted-foreground`. Tidak ditampilkan di `ListingCard`, karena Terjadwal adalah mode bawaan (D246). Tetap tampil di kartu pesanan dan detail |
| Toggle "Siap terima pesanan sekarang" | Kartu putih biasa. Saat menyala: baris status berisi badge mode Sekarang (dengan titik live) lalu teks "Lokasi aktif", switch menyala (trek `--brand-hover`, D244). Saat mati: tanpa badge, switch `--muted` bergaris `--input` |
| Titik live | Lingkaran `--brand` 8 px (6 px di dalam badge) dengan `box-shadow: 0 0 0 4px var(--brand-glow)`. Denyut lewat pseudo-elemen yang hanya menganimasikan `transform` dan `opacity`, berhenti setelah tiga kali, dan mati sama sekali saat `prefers-reduced-motion` |
| Tawaran baru masuk | Diumumkan lewat `aria-live="polite"`: "Tawaran baru: {jasa}, sisa {waktu}" |

### 1.4 Semantik

| Token | Solid | Subtle (latar) | Teks di atas subtle | Pemakaian |
|---|---|---|---|---|
| `--success` | `#0F766E` | `#CCFBF1` | `#115E59` | Selesai, terverifikasi, dana cair. **Teal, bukan hijau**, supaya tidak tertukar dengan `--brand` |
| `--warning` | `#B45309` | `#FEF3C7` | `#92400E` | Menunggu tindakan seseorang. Selalu tampil pucat |
| `--destructive` | `#B91C1C` | `#FEE2E2` | `#991B1B` | Gagal, ditolak, komplain, aksi berbahaya |
| `--info` | `#1D4ED8` | `#DBEAFE` | `#1E40AF` | Terjadwal dan sedang berjalan |
| `--neutral` | `#57534E` | `#F5F5F4` | `#44403C` | Status akhir yang tidak berhasil (kedaluwarsa, dibatalkan) |

### 1.4b Banner status

Satu bentuk untuk semua nada: latar paling pucat, garis tepi 1 px, chip ikon bulat di kiri, judul tebal, lalu satu kalimat.

| Nada | Latar `--{nada}-surface` | Garis `--{nada}-border` | Chip ikon (latar / ikon) | Judul | Isi |
|---|---|---|---|---|---|
| success | `#F0FDFA` | `#99F6E4` | `#99F6E4` / `#0F766E` | `#134E4A` | `#115E59` |
| warning | `#FFFBEB` | `#FDE68A` | `#FDE68A` / `#B45309` | `#78350F` | `#92400E` |
| info | `#EFF6FF` | `#BFDBFE` | `#BFDBFE` / `#1D4ED8` | `#1E3A8A` | `#1E40AF` |
| destructive | `#FEF2F2` | `#FECACA` | `#FECACA` / `#B91C1C` | `#7F1D1D` | `#991B1B` |

Ikon chip memakai ikon lucide: `CircleCheck`, `TriangleAlert`, `Info`, `CircleX`. Tombol tutup (`X`) hanya untuk banner yang memang boleh ditutup, tidak untuk banner status pesanan.

### 1.4c Rating

| Token | Nilai | Pemakaian |
|---|---|---|
| `--rating` **(Jasana)** | `#FACC15` | Isi ikon `Star` |
| `--rating-stroke` **(Jasana)** | `#EAB308` | Garis ikon `Star` |

Bintang selalu diikuti angka rating berwarna `--foreground` (misalnya "4,8") dan jumlah ulasan berwarna `--muted-foreground`. Bintang tidak pernah berdiri sendiri sebagai satu-satunya informasi.

### 1.5 Hasil cek kontras

Dihitung dengan rumus WCAG 2.1. Seluruh pasangan teks lolos AA (minimal 4,5:1).

| Pasangan | Rasio |
|---|---|
| Putih di atas `--primary` | 17,49:1 |
| Putih di atas `--primary-hover` | 10,27:1 |
| `--foreground` di atas `--background` | 16,74:1 |
| `--muted-foreground` di atas putih | 7,63:1 |
| `--brand-foreground` di atas `--brand` | 7,68:1 |
| `--brand-foreground` di atas `--brand-hover` | 5,31:1 |
| `--brand-strong` di atas putih | 5,02:1 |
| `--brand-strong` di atas `--background` | 4,80:1 |
| `--brand-subtle-foreground` di atas `--brand-subtle` (menu, tab, navigasi aktif) | 6,49:1 |
| `--brand-subtle-foreground` di atas putih (label navigasi bawah aktif) | 7,13:1 |
| Putih di atas `--success` | 5,47:1 |
| `--success-subtle-foreground` di atas `--success-subtle` | 6,73:1 |
| `--warning-subtle-foreground` di atas `--warning-subtle` | 6,37:1 |
| `--destructive-subtle-foreground` di atas `--destructive-subtle` | 6,80:1 |
| `--info-subtle-foreground` di atas `--info-subtle` | 7,15:1 |
| `--neutral-subtle-foreground` di atas `--neutral-subtle` | 9,42:1 |
| Putih di atas `--destructive` | 6,47:1 |
| Putih di atas `--destructive-hover` | 8,31:1 |
| `--input` di atas putih (batas komponen, syarat 3:1) | 3,40:1 |
| Trek switch menyala `--brand-hover` terhadap kartu putih dan thumb putih (syarat 3:1) | 3,30:1 |

Angka dibulatkan dua desimal, tidak dipotong.

**Penanda grafis di bawah 3:1 yang dibenarkan.** Maknanya selalu dibawa teks atau angka di sebelahnya, jadi tidak wajib memenuhi 3:1:

| Penanda | Rasio | Pembawa makna |
|---|---|---|
| Titik live `--brand` di atas putih | 2,28:1 | Teks "Sekarang" di badge, "Lokasi aktif" di toggle |
| Garis 1 px badge Sekarang `--brand` | 2,28:1 | Teks "Sekarang" |
| Garis ikon bintang `--rating-stroke` di atas putih | 1,92:1 | Angka rating di sebelahnya |

**Yang tidak lolos dan karena itu dilarang:**

| Pasangan | Rasio | Gantinya |
|---|---|---|
| Putih di atas `--brand` | 2,28:1 | Teks hitam (`--brand-foreground`) |
| `--brand` sebagai teks di atas putih | 2,28:1 | `--brand-strong` |

`--border` (`#E7E5E4`) sengaja rendah kontrasnya karena hanya dekoratif. Komponen yang batasnya wajib terlihat (input, checkbox, radio, switch, tombol outline) memakai `--input`.

**Tidak ada mode gelap** (FE13, D222). Jangan menambahkan varian `dark:` di mana pun.

---

## 2. Tipografi

**Keluarga huruf:** Plus Jakarta Sans lewat `next/font/google`, bobot 400, 500, 600, 700, subset `latin`. Variabel CSS `--font-jakarta`. Huruf monospace hanya untuk potongan teknis di admin, memakai `ui-monospace` bawaan sistem. Nomor pesanan memakai huruf biasa dengan `tabular-nums` (Bagian 8).

| Token | Ukuran / tinggi baris | Bobot | Pemakaian |
|---|---|---|---|
| `display` | 30 / 36 px di HP, **40 / 48 px mulai `md`** | 700 | Judul utama beranda saja |
| `h1` | **28 / 36 px** | 700 | Judul halaman |
| `h2` | **22 / 30 px** | 600 | Judul bagian |
| `h3` | 18 / 26 px | 600 | Judul kartu, judul dialog |
| `body` | 16 / 24 px | 400 | Teks utama, **seluruh input** |
| `body-sm` | 14 / 20 px | 400 | Teks sekunder, isi tabel, deskripsi kartu |
| `caption` | 12 / 16 px | 500 (600 di badge) | Label kecil, metadata, keterangan di bawah input, teks badge |
| `code-xl` | 32 / 40 px | 700, `tabular-nums`, jarak huruf 0,2em | Kode verifikasi 6 digit di layar client. Kelas: `text-code-xl tracking-code font-bold tabular-nums` |

Aturan:

- Input selalu 16 px. Di bawah itu, Safari iOS memperbesar halaman otomatis saat input disentuh
- Angka uang di tabel dan hitung mundur memakai `tabular-nums` supaya angkanya tidak bergoyang
- Panjang baris teks paragraf paling banyak sekitar 72 karakter: `max-w-xl` (576 px) untuk `body`, `max-w-lg` (512 px) untuk `body-sm`. **Jangan `max-w-prose`**: dengan Plus Jakarta Sans hasilnya 94 sampai 98 karakter
- Judul `display` sampai `h3` memakai `text-balance`, paragraf memakai `text-pretty`, supaya baris terakhir tidak berisi satu kata
- Pesan error di bawah input memakai `body-sm` 14 px bobot 500 dengan ikon 16 px, bukan `caption`, supaya terbaca di lapangan (P3)
- Skala di atas (D247) dipakai lewat token `text-display`, `text-h1`, `text-h2`, `text-h3` (Bagian 13)
- Huruf kapital semua hanya untuk `caption` di kepala tabel, tidak untuk tombol dan judul

---

## 3. Jarak, Tata Letak, dan Titik Henti

**Satuan dasar 4 px**, mengikuti skala bawaan Tailwind. Jarak yang paling sering dipakai: 8, 12, 16, 24, 32 px (`2`, `3`, `4`, `6`, `8`).

| Aspek | Ketentuan |
|---|---|
| Padding halaman | 16 px di HP, 24 px mulai `md` |
| Lebar konten publik | `max-w-6xl` (1152 px), di tengah |
| Lebar halaman formulir | `max-w-xl` (576 px) |
| Sidebar area usaha dan admin | 248 px, bisa diciutkan di `lg` ke bawah |
| Navigasi bawah (client dan pekerja, HP) | Tinggi 64 px, 4 sampai 5 item, ikon + label |
| Bar aksi order di HP | Menempel di bawah layar, di atas navigasi bawah |

**Titik henti** mengikuti bawaan Tailwind: `sm` 640, `md` 768, `lg` 1024, `xl` 1280 px. Tiga lebar yang **wajib dicek** di setiap sesi: **390, 768, 1280 px**.

| Area | Orientasi | Lebar yang harus sempurna |
|---|---|---|
| Publik dan client | Mobile-first | 390 dan 1280 |
| Pekerja | **Mobile-only**, desktop cukup terbaca | 390 |
| Usaha | Desktop-first, tetap bisa dipakai di tablet | 1280 dan 768 |
| Admin | Desktop | 1280. Di HP cukup tampil pesan "Buka di layar yang lebih lebar" untuk tabel padat |

---

## 4. Radius, Garis, dan Bayangan

| Token | Nilai | Pemakaian |
|---|---|---|
| `--radius` (dasar) | 10 px | Tombol, input, select |
| `radius-sm` | 6 px | Checkbox, tag kecil |
| `radius-lg` | 14 px | Kartu, panel |
| `radius-xl` | 20 px | Dialog, sheet bawah |
| `radius-full` | | Badge, avatar, switch, indikator aktif navigasi bawah |

- Kartu memakai garis tepi 1 px `--border`, **tanpa bayangan**. Berlaku juga untuk `OfferCard` (D242)
- **Paling banyak dua lapis kotak.** Item di dalam panel atau kartu dipisah garis `--border` atau jarak 12 px, bukan kartu bergaris lagi (D249)
- **Aturan bentuk** (D249): pill (`radius-full`) hanya untuk yang tidak bisa ditekan (badge, status, avatar) dan switch. Semua yang bisa ditekan memakai radius 10 px, termasuk chip filter. Pengecualian: indikator aktif navigasi bawah berbentuk pill karena ia penanda di sekitar ikon, sedangkan area sentuhnya tetap seluruh item
- Bayangan hanya untuk elemen yang melayang: popover, dropdown, dialog, toast (`shadow-lg`), dan header yang menempel saat digulir (`shadow-sm`)
- Pemisah antarbagian memakai jarak, bukan garis, kecuali di tabel

---

## 5. Ikon dan Gambar

| Aspek | Ketentuan |
|---|---|
| Set ikon | **`lucide-react` saja**, nama ikon sesuai katalog lucide. Tidak mencampur set ikon lain, tidak menggambar ikon sendiri, dan tidak memakai emoji sebagai ikon. Di luar kode React (mockup, dokumen), pakai SVG asli dari paket `lucide-static` dengan nama yang sama |
| Bintang rating | Ikon `Star` terisi `--rating` dengan garis `--rating-stroke`, selalu diikuti angka (Bagian 1.4c) |
| Ukuran | 16 px di dalam teks, 20 px di tombol, 24 px di navigasi |
| Foto listing | Rasio 4:3, `object-cover`, lewat `next/image` dengan `sizes` yang benar |
| Avatar | Lingkaran. Tanpa foto: inisial `--brand-subtle-foreground` di atas `--brand-subtle` |
| Empty state | Ikon lucide 24 px di dalam lingkaran `--muted`, bukan ilustrasi stok |
| Dokumen e-KYC dan bukti komplain | **Tidak lewat `next/image`.** Signed URL privat berumur pendek tidak boleh ikut di-cache optimizer server Next. Pakai `<img>` biasa atau buka di tab baru |
| Peta | Tile OpenStreetMap dengan atribusi "© OpenStreetMap contributors" yang selalu terlihat |

Penanda peta:

| Penanda | Warna |
|---|---|
| Lokasi layanan (rumah client) | `--primary` (hitam), ikon `MapPin` |
| Posisi penanggung jawab | Lingkaran `--brand` dengan garis tepi 2 px `--brand-foreground` dan cahaya `--brand-glow`, berdenyut pelan. Garis gelap wajib, karena hijau terang kurang terlihat di atas tile peta yang terang |
| Lokasi basis usaha | `--neutral`, ikon `Store` |

---

## 6. Komponen

Dasar komponen dari **shadcn/ui** (disalin ke `src/components/ui`, berbasis Radix). Komponen domain dibangun di atasnya dan tinggal di `src/components/shared` atau `src/features/<domain>/components`.

### 6.1 Komponen dasar

| Komponen | Varian | Aturan pakai |
|---|---|---|
| `Button` | `primary` (hitam), `secondary` (latar `--muted`), `outline` (garis `--input`), `ghost`, `destructive`, `now` (latar `--brand`, teks hitam, **khusus aksi mode Sekarang**: Ambil dan Terima) | Satu `primary` per tampilan. State per varian di tabel Bagian 6.4. Saat memproses: label berubah ke bentuk proses berakhiran "…" ("Membayar…", "Mengambil…"), ditambah spinner, dan dinonaktifkan supaya tidak terkirim dua kali. Label selalu kata kerja |
| Ukuran tombol | `sm` 36 px, `md` 40 px, `lg` 48 px | **Area pekerja memakai `lg`** untuk seluruh aksi lapangan |
| `Input`, `Textarea` | | Label selalu terlihat di atas input. Placeholder bukan pengganti label, berisi contoh isian nyata dan diakhiri "…". Saat error: garis `--destructive`, `aria-invalid`, pesan `body-sm` 500 berwarna `--destructive` dengan ikon 16 px, dihubungkan lewat `aria-describedby`. Atribut field mengikuti Bagian 6.1b |
| Chip filter | | Radius 10 px. Tidak aktif: latar `--card`, garis `--input`, teks 500, hover `--muted`. Aktif: pucat (Bagian 6.4) dengan ikon `Check` |
| `Select`, `Combobox` | | Combobox untuk daftar lebih dari 8 item |
| `Checkbox`, `RadioGroup`, `Switch` | | Area sentuh minimal 44 px termasuk labelnya. Switch menyala: trek dan garis `--brand-hover` (D244). Switch mati: trek `--muted`, garis `--input`. Thumb selalu `--card` |
| `InputOTP` | 6 kotak | Untuk kode verifikasi di sisi pekerja. `inputMode="numeric"`, `autoComplete="one-time-code"`, `spellCheck={false}` |
| `Dialog` | | Konfirmasi aksi berbahaya dan formulir pendek. Di HP berubah jadi `Sheet` dari bawah |
| `Sheet` | bawah, kanan | Filter pencarian di HP, detail cepat di admin. `overscroll-behavior: contain` |
| `Tabs` | | Maksimal 5 tab, tinggi daftar tab 44 px. Di HP bisa digeser. Tab aktif mengikuti penanda aktif pucat (Bagian 6.4). Tab yang dipilih disimpan di query URL (Bagian 10) |
| `Table` / `DataTable` | | Area usaha dan admin. Header `caption` kapital, angka uang rata kanan dan `tabular-nums` |
| `Skeleton` | | Mengikuti bentuk konten yang dimuat, bukan blok abu-abu tunggal |
| `Toast` (sonner) | sukses, error, info | Pesan maksimal satu kalimat. Posisi bawah tengah di HP, kanan bawah di desktop |
| `Alert` / banner | success, info, warning, destructive | Banner status di atas halaman detail order (Bagian 1.4b) |
| `Badge` | nada `warning`, `info`, `success`, `destructive`, `neutral` (lihat Bagian 7), `outline` (latar `--card`, garis `--border`, teks `--muted-foreground`), dan `now` (latar `--card`, garis `--brand`, titik live, teks `--foreground` 600) | Selalu teks + ikon atau titik. Teks `caption` 12 px bobot 600, tinggi 28 px |
| `Avatar`, `Tooltip`, `Popover`, `Accordion`, `Pagination`, `Breadcrumb` | | Sesuai bawaan |

### 6.1b Atribut field formulir

Setiap input punya `name` dan atribut berikut (D248), supaya isi otomatis browser dan keyboard HP tepat:

| Field | `type` / `inputMode` | `autoComplete` | Catatan |
|---|---|---|---|
| Nama | `text` | `name` | |
| Email | `email` | `email` | `spellCheck={false}` |
| Nomor HP | `tel` | `tel` | |
| Kata sandi | `password` | `current-password` atau `new-password` | |
| Alamat | `text` | `street-address` | |
| Kode verifikasi | `inputMode="numeric"` | `one-time-code` | `spellCheck={false}` |
| Nominal uang | `inputMode="numeric"` | `off` | Ditampilkan terformat lewat `formatRupiah` |
| Pencarian | `search` | `off` | |

### 6.2 Komponen domain

| Komponen | Isi | Dipakai di |
|---|---|---|
| `StatusBadge` | Badge status order dari `ORDER_STATUS_META` | Semua daftar dan detail order |
| `ModeBadge` | "Terjadwal" (varian `outline`, ikon `CalendarClock`) atau "Sekarang" (varian `now`: putih bergaris hijau dengan titik live) | Kartu listing (hanya Sekarang, D246), kartu dan detail pesanan (keduanya), kartu tawaran, toggle |
| `MoneyText` | Rupiah terformat, `tabular-nums` | Seluruh angka uang |
| `PriceBreakdown` | Baris harga dasar, tiap opsi beserta deltanya, total. Prop `estimate` menambahkan label "Perkiraan" | Form pesan (perkiraan), detail order (dari server) |
| `Countdown` | Sisa waktu dari timestamp server, ikon `Clock` abu dan angka `--foreground`. Di bawah 5 menit angkanya `--destructive` | Tawaran, batas bayar, batas komplain, kode |
| `DateTimeText` | Tanggal dan jam WITA dengan label | Seluruh tampilan waktu |
| `ListingCard` | Foto 4:3, judul (maksimal 2 baris, `line-clamp-2`), nama usaha (1 baris, `truncate` dengan `min-w-0`), rating, "Mulai Rp...", jarak, `ModeBadge` hanya untuk mode Sekarang (D246) | Pencarian, beranda, rekomendasi Asisten |
| `OptionPicker` | Perender atribut OPTION berdasarkan definisi (PRD Frontend Bagian 6) | Form pesan |
| `AttributeFields` | Perender atribut SPEC untuk editor listing | Editor jasa |
| `OrderActionBar` | Merender hasil `getOrderActions()`. Tidak punya logika sendiri | Detail order semua area |
| `OrderTimeline` | Riwayat status dari `GET /orders/:id/history` | Detail order |
| `OfferCard` | Kartu tawaran Available Now sesuai Bagian 1.3b: kartu putih biasa, label "Tawaran baru", `ModeBadge` Sekarang di kanan atas, `Countdown` di bawah judul, tombol Ambil (pekerja) atau Terima (pemilik) varian `now`, dan Lewati atau Tolak varian `outline`. Saat waktu habis dan tombol jadi nonaktif ketika sedang difokus, fokus dipindah ke teks status (Bagian 10) | Area pekerja, dashboard usaha |
| `VerificationCodeDisplay` | Kode `code-xl`, sisa waktu, peringatan | Detail order sisi client |
| `VerificationCodeInput` | `InputOTP` + tombol Verifikasi + status percobaan | Detail order sisi pekerja |
| `OrderMessagesPanel` | Daftar pesan, input dengan penghitung karakter, tanda dibaca | Detail order |
| `MapView`, `MapPicker` | Peta baca saja dan peta pemilih pin. Dimuat dinamis tanpa SSR | Form pesan, alamat, detail order, profil usaha |
| `FileDropzone` | Varian `multipart` (e-KYC, bukti) dan `signedUrl` (foto listing) | Pendaftaran penyedia, komplain, editor jasa |
| `AvailabilityToggle` | Toggle besar "Siap terima pesanan sekarang" sesuai Bagian 1.3b, dengan status izin lokasi | Area pekerja |
| `EscrowNote` | Ikon `ShieldCheck` dan satu kalimat "Dana ditahan sampai pekerjaan selesai", `body-sm`, nada netral (`--muted-foreground`), tanpa kotak berwarna (D250) | Form pesan, halaman bayar, banner `PAID` |
| `RoleSwitcher` | Pindah area: Pelanggan, Usaha, Pekerja, Admin, hanya yang dimiliki | Menu avatar di header |
| `EmptyState`, `ErrorState` | Ikon, judul, satu kalimat, satu aksi | Seluruh halaman data |
| `AssistantWidget` | Tombol melayang "Tanya Asisten" dan panel percakapan | Area publik dan client |

### 6.3 Galeri komponen

Sediakan halaman **`/dev/ui`** yang menampilkan seluruh komponen dasar, seluruh varian tombol, 15 badge status order, badge enum lain, `PriceBreakdown`, `Countdown` di berbagai sisa waktu, `OfferCard`, penanda aktif dan terpilih, serta state tombol (Bagian 6.4). Halaman ini **hanya hidup di development** (`notFound()` kalau `NODE_ENV === 'production'`).

Gunanya: Claude Code dan kamu bisa mengecek konsistensi visual di satu tempat, dan screenshot halaman ini bisa jadi lampiran laporan.

Halaman **`/dev/ds`** adalah halaman peraga yang dipakai saat review v2.0 dan menjadi acuan visual v2.1. Isinya dipindah ke `/dev/ui` saat migrasi (Bagian 14).

### 6.4 Penanda aktif dan terpilih

Hijau terang punya tiga intensitas. **Solid hanya untuk aksi mode Sekarang**. Penanda posisi (di mana pengguna berada) memakai pucat (D243).

| Intensitas | Bentuk | Dipakai untuk |
|---|---|---|
| **Solid** | Latar `--brand`, teks dan ikon `--brand-foreground` (hitam), tebal 600, radius 10 px | Tombol varian `now` (Ambil, Terima). Switch menyala memakai solid `--brand-hover` (D244) |
| **Pucat** | Latar `--brand-subtle`, teks dan ikon `--brand-subtle-foreground` | Menu sidebar aktif, item navigasi bawah aktif, tab aktif (ketiganya tebal 600). Chip filter aktif dengan ikon `Check`, opsi terpilih di formulir (ditambah garis 2 px `--brand`), lingkaran stepper selesai dengan ikon `Check`, avatar inisial, lencana angka di item tidak aktif (tebal 700) |
| **Garis** | Garis atau titik `--brand` saja | Titik live, garis badge Sekarang, cincin langkah stepper aktif, garis stepper yang sudah dilewati, garis input kode yang sedang diisi |

**Menu sidebar dan navigasi:**

| State | Tampilan |
|---|---|
| Normal | Ikon `--muted-foreground`, teks `--foreground` tebal 500 |
| Hover | Latar `--muted` |
| Aktif | Pucat: latar `--brand-subtle`, ikon dan teks `--brand-subtle-foreground` tebal 600, radius 10 px. Lencana angka di menu atau tab aktif: latar `--primary`, teks putih |
| Fokus | Cincin `--ring` |

Navigasi bawah di HP memakai pola yang sama: indikator aktif berbentuk pill `--brand-subtle` di sekitar ikon (ikon `--brand-subtle-foreground`), label di bawahnya `--brand-subtle-foreground` tebal 600. Tab aktif juga pucat, tinggi 44 px.

Lencana angka selalu disertai teks `sr-only` sebagai konteks, misalnya "3 pesanan baru", supaya pembaca layar tidak hanya membacakan "3".

**Catatan.** Di v2.0 menu aktif solid hijau, sehingga di layar pekerja navigasi bawah aktif bersaing dengan tombol Ambil. Sejak v2.1 (D243) penanda posisi pucat, dan tombol `now` menjadi satu-satunya elemen hijau solid di layar.

**State tombol:**

| Varian | Normal | Hover | Ditekan | Nonaktif |
|---|---|---|---|---|
| `primary` | `--primary` | `--primary-hover` | `--primary-pressed`, turun 1 px | Latar `--muted`, teks `--disabled-foreground` |
| `now` | `--brand` | `--brand-hover` | `--brand-hover`, bayangan dalam tipis, turun 1 px | Latar `--muted`, teks `--disabled-foreground`, label diganti alasan (misalnya "Waktu respons habis") |
| `outline` | Latar `--card`, garis `--input` | Latar `--muted` | Latar `--muted`, turun 1 px | Latar `--card`, garis `--border`, teks `--disabled-foreground` |
| `secondary` | Latar `--muted` | Latar `--border` | Latar `--border`, turun 1 px | Latar `--muted`, teks `--disabled-foreground` |
| `ghost` | Transparan | Latar `--muted` | Latar `--muted`, turun 1 px | Teks `--disabled-foreground` |
| `destructive` | `--destructive`, teks putih | `--destructive-hover` | `--destructive-hover`, turun 1 px | Latar `--muted`, teks `--disabled-foreground` |

Seluruh varian memakai cincin fokus yang sama: `box-shadow: 0 0 0 2px var(--card), 0 0 0 4px var(--ring)`.

**Elemen lain:**

| Elemen | Tampilan |
|---|---|
| Tautan | `--brand-strong`, garis bawah dengan jarak 3 px. Hover `--brand-subtle-foreground` |
| Tautan aktif di header publik | Teks `--brand-strong` tebal 600 dengan garis bawah. Pengecualian dari penanda pucat, karena header publik berisi tautan halaman, bukan navigasi aplikasi |
| Input fokus | Garis `--foreground` ditambah cincin `--ring` 2 px berjarak 2 px |
| Input error | Garis `--destructive`. Saat fokus tetap memakai cincin `--ring` |
| Input kode yang sedang diisi | Garis 2 px `--brand` ditambah cincin 3 px `--brand-subtle` |
| Gelembung pesan sendiri | Latar `--primary`, teks putih. Gelembung lawan: latar `--muted` |
| Lencana notifikasi baru | Titik `--destructive` dengan garis putih |

---

## 7. Label dan Nada Status

### 7.1 Status order

Satu sumber di kode: `ORDER_STATUS_META` di `src/lib/order-status.ts`. Tidak ada label status yang ditulis langsung di komponen.

| Enum | Label | Nada | Ikon lucide |
|---|---|---|---|
| `PENDING_ACCEPTANCE` | Menunggu konfirmasi | `warning` | `Hourglass` |
| `ACCEPTED` | Menunggu pembayaran | `warning` | `Wallet` |
| `PAID` | Sudah dibayar | `info` | `Banknote` |
| `ON_THE_WAY` | Dalam perjalanan | `info` | `Navigation` |
| `ARRIVED` | Tiba di lokasi | `info` | `MapPinCheck` |
| `IN_PROGRESS` | Sedang dikerjakan | `info` | `Wrench` |
| `AWAITING_VERIFICATION` | Menunggu kode verifikasi | `warning` | `KeyRound` |
| `COMPLETED` | Selesai | `success` | `CircleCheck` |
| `SETTLED` | Dana cair | `success` | `BadgeCheck` |
| `DISPUTED` | Dalam komplain | `destructive` | `MessageSquareWarning` |
| `REJECTED` | Ditolak | `neutral` | `CircleX` |
| `EXPIRED` | Kedaluwarsa | `neutral` | `TimerOff` |
| `PAYMENT_EXPIRED` | Batas bayar lewat | `neutral` | `TimerOff` |
| `CANCELLED` | Dibatalkan | `neutral` | `Ban` |
| `REFUNDED` | Dana dikembalikan | `neutral` | `Undo2` |

Setiap nada memakai pasangan subtle masing-masing dari Bagian 1.4. **Warna merek (hitam dan hijau terang) tidak dipakai untuk status.** Urutannya terbaca sebagai alur: kuning (menunggu seseorang bertindak), biru (terjadwal dan sedang berjalan), teal (selesai), merah (komplain), abu (berakhir tanpa hasil). Nama ikon dicek ke versi `lucide-react` yang terpasang, karena beberapa nama berubah antarversi.

Kenapa `SETTLED` berlabel "Dana cair", bukan "Tuntas" (D245): "Selesai" dan "Tuntas" hampir sinonim, sama-sama teal, dan sering tampil berdekatan. "Dana cair" adalah istilah glosarium untuk settlement dan langsung menjelaskan apa yang berubah.

Kenapa `PAID` berlabel "Sudah dibayar", bukan "Terjadwal": label "Terjadwal" sudah dipakai `ModeBadge` untuk mode `SCHEDULED`, dan keduanya sering tampil berdampingan di kartu pesanan. Untuk alasan yang sama, `ModeBadge` "Terjadwal" memakai varian `outline`, bukan nada `info`: **pill berwarna selalu berarti status**, sedangkan mode Terjadwal tampil sebagai label bergaris. Mode Sekarang tampil sebagai pill putih bergaris hijau dengan titik (Bagian 1.3b), juga bukan pill berisi warna. "Sudah dibayar" berlaku untuk kedua mode. Jadwal kunjungan tetap ditampilkan di banner detail order (Matriks Bagian 2.3) lewat `scheduled_at`.

### 7.2 Enum lain

| Enum | Nilai dan label |
|---|---|
| `verification_status` (usaha) | `DRAFT` Draf (neutral), `PENDING` Menunggu verifikasi (warning), `VERIFIED` Terverifikasi (success), `REJECTED` Ditolak (destructive), `SUSPENDED` Ditangguhkan (destructive) |
| `membership_status` (pekerja) | `PENDING` Pelamar (warning), `ACTIVE` Aktif (success), `REJECTED` Ditolak (neutral), `RESIGNED` Keluar (neutral) |
| Status listing | `DRAFT` Draf (neutral), `ACTIVE` Tayang (success), `INACTIVE` Nonaktif (neutral), `SUSPENDED` Ditangguhkan admin (destructive) |
| `taxonomy_request_status` | `PENDING` Menunggu (warning), `APPROVED` Disetujui (success), `REJECTED` Ditolak (destructive), `MERGED` Sudah ada (info) |
| Komplain | `OPEN` Dibuka (warning), `UNDER_REVIEW` Ditinjau admin (info), `RESOLVED_RELEASE` dan `RESOLVED_PARTIAL` Diputus (success), `RESOLVED_REFUND` Diputus (neutral), `CLOSED` Ditutup (neutral) |
| Pencairan (withdrawal) | `REQUESTED` Menunggu persetujuan, `APPROVED` Disetujui, `DISBURSING` Sedang dikirim (ketiganya warning), `COMPLETED` Berhasil (success), `REJECTED` Ditolak dan `FAILED` Gagal (destructive), `REVERSED` Dibatalkan, saldo dikembalikan (neutral) |
| Pengembalian dana (refund) | `REQUESTED` Diajukan dan `PROCESSING` Diproses (warning), `COMPLETED` Berhasil (success), `FAILED` Gagal (destructive) |
| Notifikasi email | `PENDING` Menunggu dikirim (warning), `SENT` Terkirim (success), `FAILED` Gagal (destructive) |

Pola nada untuk enum baru: menunggu = `warning`, berhasil = `success`, gagal atau ditolak = `destructive`, dibatalkan atau berakhir = `neutral`. Seluruhnya dirender lewat `EnumBadge` (StatusBadge memakai komponen yang sama).

Seluruh tabel label enum disimpan di `src/lib/enum-labels.ts`.

---

## 8. Format Angka, Waktu, dan Teks

Seluruh format lewat fungsi di `src/lib/format.ts` dan `src/lib/time.ts`. Tidak ada `toLocaleString` atau `toLocaleDateString` yang dipanggil langsung di komponen.

| Jenis | Fungsi | Contoh keluaran | Catatan |
|---|---|---|---|
| Uang | `formatRupiah(150000)` | `Rp150.000` | Tanpa spasi, tanpa desimal. Data API sudah integer rupiah, **jangan dibagi atau dikali 100** |
| Uang negatif | `formatRupiah(-50000)` | `-Rp50.000` | Ledger dan refund |
| Harga kartu | | `Mulai Rp50.000` | `listings.price` tanpa delta opsi |
| Delta opsi | `formatDelta(25000)` | `+Rp25.000` | Delta nol ditampilkan `Termasuk` |
| Delta per unit | | `+Rp75.000 / unit` | Satuan dari definisi atribut |
| Tanggal | `formatTanggal(iso)` | `Sel, 17 Nov 2026` | |
| Jam | `formatJam(iso)` | `14.00 WITA` | Pemisah titik sesuai kaidah bahasa Indonesia, format 24 jam |
| Tanggal dan jam | `formatTanggalJam(iso)` | `Sel, 17 Nov 2026, 14.00 WITA` | |
| Relatif | `formatRelatif(iso)` | `5 menit lalu` | Hanya untuk notifikasi dan pesan, di bawah 7 hari |
| Hitung mundur | | `23 jam 15 menit`, lalu `04:59` di bawah satu jam | |
| Durasi | `formatDurasi(90)` | `1 jam 30 menit` | Dari menit |
| Jarak | `formatJarak(meter)` | `350 m`, `1,2 km` | Desimal koma |
| Nomor pesanan | | `ORD-20261117-0001` | Apa adanya, `tabular-nums`, `translate="no"` supaya tidak dirusak terjemahan otomatis browser |

**Zona waktu.** Seluruh waktu ditampilkan dan diinput dalam **WITA (UTC+08:00)** dengan label "WITA" yang eksplisit, tidak mengikuti zona perangkat (FE6). Indonesia tidak memakai waktu musim panas, jadi konversinya offset tetap: input `2026-11-20 14:00` WITA dikirim sebagai `2026-11-20T06:00:00.000Z`.

---

## 9. Bahasa dan Glosarium

### 9.1 Nada

| Aturan | Contoh benar | Contoh salah |
|---|---|---|
| Sapaan "kamu" untuk seluruh area pengguna | "Pesananmu sudah diterima" | "Pesanan Anda telah diterima oleh penyedia jasa" |
| Kalimat pendek dan aktif | "Pekerja sedang menuju lokasimu" | "Saat ini pekerja sedang dalam proses perjalanan" |
| Tombol berupa kata kerja yang jelas | "Bayar sekarang", "Berangkat" | "OK", "Submit", "Lanjutkan" untuk aksi penting |
| Pesan error menyebut apa yang bisa dilakukan | "Kode salah. Sisa 3 percobaan." | "Terjadi kesalahan" |
| Tidak menyalahkan pengguna | "Lokasimu belum terbaca. Izinkan akses lokasi lalu coba lagi." | "Anda tidak mengizinkan lokasi" |
| Area admin boleh lebih ringkas dan netral | "Setujui pengajuan" | |
| Judul memakai fakta, bukan klaim (D249) | "Servis AC, ledeng, dan kebersihan rumah di Denpasar" | "Jasa rumah tepercaya", "terbaik", "mudah" |
| Pemisah "·" hanya untuk pasangan metadata | "Sejuk Jaya Teknik · Denpasar" | "Tawaran baru · Sekarang" sebagai label |
| Proses yang sedang berjalan diakhiri "…" | "Membayar…", "Mengambil…" | "Membayar", "Loading" |

Nama merek "Jasana" ditulis dengan `translate="no"`.

### 9.2 Glosarium

Istilah di kolom tengah adalah satu-satunya yang dipakai di UI.

| Istilah sistem | Label di UI | Jangan dipakai di UI |
|---|---|---|
| order | **Pesanan** | order |
| listing | **Jasa** ("Jasa Saya" di area usaha) | listing, produk |
| client | **Pelanggan** (dari sisi usaha dan pekerja). Dari sisi client sendiri cukup "kamu" | klien, customer |
| provider | **Penyedia** (halaman publik), **Usaha** (area pengelolaan, "Usaha Saya") | provider, vendor, mitra |
| worker | **Pekerja** | worker, kru, karyawan |
| assigned worker | **Penanggung jawab** (D68) | teknisi, driver, pekerja yang mengerjakan |
| crew | **Pendamping** | kru, asisten |
| `AVAILABLE_NOW` | **Sekarang** (mode), "Bisa datang sekarang" (filter) | Available Now, instan, darurat |
| `SCHEDULED` | **Terjadwal** | booking, reservasi |
| tawaran Available Now | **Tawaran** | broadcast, request |
| order_messages | **Pesan** (D79) | chat, obrolan |
| chatbot | **Asisten Jasana**. Kata "chat" hanya boleh di sini | bot, AI chat |
| dispute | **Komplain** | sengketa, dispute |
| verification code | **Kode verifikasi** | OTP, PIN |
| check-in | Tombol **"Saya sudah sampai"**, status **"Tiba di lokasi"** | check-in |
| escrow hold | **Dana ditahan** | escrow |
| settlement | **Dana cair** | settlement |
| wallet | **Saldo**: "Saldo tersedia" (available), "Saldo tertahan" (pending) | dompet, wallet |
| withdrawal | Tombol **"Tarik saldo"**, riwayat **"Pencairan"** | withdraw |
| e-KYC | **Verifikasi identitas usaha** | KYC, e-KYC |
| taxonomy request | **Usulkan jenis jasa** atau **Usulkan pilihan** | taksonomi, atribut |
| SPEC | **Spesifikasi** | SPEC |
| OPTION | **Pilihan** | OPTION, varian |
| sesi refresh token | **Perangkat aktif** | sesi, token |

---

## 10. Pola State dan Interaksi

| State | Pola |
|---|---|
| Memuat | `Skeleton` berbentuk sama dengan konten. Spinner hanya di dalam tombol yang sedang memproses |
| Kosong | `EmptyState`: ikon, judul, satu kalimat penjelasan, satu aksi. Contoh: "Belum ada pesanan" + "Cari jasa" |
| Error | `ErrorState` dengan pesan dari peta kode error + tombol "Coba lagi". 404 dan 403 punya halaman sendiri berbahasa Indonesia |
| Berhasil | Toast satu kalimat. Langkah penting (pesanan dibuat, pendaftaran penyedia terkirim) punya tampilan konfirmasi sendiri |
| Validasi formulir | Dicek saat input ditinggalkan dan saat dikirim. Detail error 422 dari server dipetakan ke field yang sesuai. Setelah kirim gagal, fokus dipindah ke field error pertama |
| Aksi kedaluwarsa | Saat aksi jadi nonaktif karena waktu habis (misalnya tombol Ambil), fokus dipindah ke teks status ("Menunggu sistem memperbarui status", `tabIndex={-1}`), supaya fokus tidak jatuh ke `body` |
| Tab dan filter | Disimpan di query URL (`?tab=berjalan`, `?kategori=`) lewat `router.replace`, supaya kembali dari halaman detail tidak menghilangkan pilihan |
| Realtime | Perubahan dari pihak lain muncul sebagai toast singkat ditambah pembaruan halaman, tanpa memuat ulang penuh |

**Dialog konfirmasi wajib** untuk: membatalkan pesanan, menolak pesanan, menandai selesai, mengajukan komplain, menarik saldo, putusan admin, menghapus jasa, mengeluarkan pekerja, keluar dari semua perangkat. Dialog menyebut akibatnya dalam satu kalimat, dan tombol konfirmasinya memakai varian `destructive` untuk aksi yang tidak bisa dibatalkan.

---

## 11. Aksesibilitas

| Aspek | Ketentuan |
|---|---|
| Kontras | WCAG 2.1 AA: teks 4,5:1, teks besar dan batas komponen 3:1 (sudah dicek di Bagian 1.5) |
| Fokus | Cincin 2 px `--ring` dengan jarak 2 px, selalu terlihat saat navigasi keyboard |
| Status | Teks + ikon, tidak hanya warna (P5) |
| Area sentuh | Minimal 44 x 44 px, area pekerja 48 px |
| Pengumuman | Perubahan status order dan tawaran baru diumumkan lewat `aria-live="polite"`. Hitung mundur **tidak** diumumkan tiap detik, hanya pada ambang 5 menit, 1 menit, dan habis |
| Formulir | Setiap input punya label, `name`, dan atribut Bagian 6.1b. Error ditandai `aria-invalid` dan dihubungkan lewat `aria-describedby` |
| Lewati navigasi | Tautan "Lewati ke konten" sebagai elemen pertama di setiap layout, terlihat saat difokus |
| Sentuhan | `touch-action: manipulation` di elemen interaktif, supaya tidak ada jeda ketuk ganda di HP |
| Lencana angka | Disertai teks `sr-only` sebagai konteks (Bagian 6.4) |
| Terjemahan otomatis | `translate="no"` pada nama merek dan nomor pesanan |
| Gerak | Hormati `prefers-reduced-motion`: matikan animasi masuk, denyut titik live, dan denyut penanda peta |
| Bahasa | `<html lang="id">` |

---

## 12. Gerak

| Aspek | Ketentuan |
|---|---|
| Durasi | 150 ms untuk hover dan tekan, 200 ms untuk elemen masuk dan keluar |
| Kurva | `ease-out` untuk masuk, `ease-in` untuk keluar |
| Yang boleh bergerak | Kartu tawaran masuk (geser pelan dari atas), toast, dialog, sheet, denyut penanda posisi pekerja, denyut titik live (maksimal tiga kali) |
| Properti yang dianimasikan | Hanya `transform` dan `opacity`. Jangan menganimasikan `box-shadow`, `width`, atau `top` |
| Yang tidak boleh | Parallax, konfeti, animasi angka berputar pada uang, loader dekoratif |

---

## 13. Implementasi Token (Tailwind CSS v4 dan shadcn/ui)

Ganti isi `src/app/globals.css` dengan isi berikut. Tailwind v4 memakai konfigurasi berbasis CSS (`@theme`), bukan `tailwind.config.js`.

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

:root {
  --radius: 0.625rem;

  /* Netral dan permukaan */
  --background: #FAFAF9;
  --foreground: #1C1917;
  --card: #FFFFFF;
  --card-foreground: #1C1917;
  --popover: #FFFFFF;
  --popover-foreground: #1C1917;
  --muted: #F5F5F4;
  --muted-foreground: #57534E;
  --border: #E7E5E4;
  --input: #918A84;
  --disabled-foreground: #A8A29E;

  /* Primary: hitam hangat, untuk aksi */
  --primary: #1C1917;
  --primary-foreground: #FFFFFF;
  --primary-hover: #44403C;
  --primary-pressed: #0C0A09;
  --ring: #1C1917;
  --secondary: #F5F5F4;
  --secondary-foreground: #1C1917;
  --accent: #F5F5F4;
  --accent-foreground: #1C1917;

  /* Brand: hijau terang, untuk terpilih, aktif, dan sedang terjadi */
  --brand: #22C55E;
  --brand-foreground: #1C1917;
  --brand-hover: #16A34A;
  --brand-strong: #15803D;
  --brand-subtle: #DCFCE7;
  --brand-subtle-foreground: #166534;
  --brand-glow: rgba(34, 197, 94, 0.2);

  /* Rating */
  --rating: #FACC15;
  --rating-stroke: #EAB308;

  /* Semantik */
  --success: #0F766E;
  --success-subtle: #CCFBF1;
  --success-subtle-foreground: #115E59;
  --success-surface: #F0FDFA;
  --success-border: #99F6E4;
  --success-title: #134E4A;
  --warning: #B45309;
  --warning-subtle: #FEF3C7;
  --warning-subtle-foreground: #92400E;
  --warning-surface: #FFFBEB;
  --warning-border: #FDE68A;
  --warning-title: #78350F;
  --info: #1D4ED8;
  --info-subtle: #DBEAFE;
  --info-subtle-foreground: #1E40AF;
  --info-surface: #EFF6FF;
  --info-border: #BFDBFE;
  --info-title: #1E3A8A;
  --destructive: #B91C1C;
  --destructive-foreground: #FFFFFF;
  --destructive-hover: #991B1B;
  --destructive-subtle: #FEE2E2;
  --destructive-subtle-foreground: #991B1B;
  --destructive-surface: #FEF2F2;
  --destructive-border: #FECACA;
  --destructive-title: #7F1D1D;
  --neutral: #57534E;
  --neutral-subtle: #F5F5F4;
  --neutral-subtle-foreground: #44403C;
}

@theme inline {
  --font-sans: var(--font-jakarta), ui-sans-serif, system-ui, sans-serif;

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-disabled-foreground: var(--disabled-foreground);

  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary-hover: var(--primary-hover);
  --color-primary-pressed: var(--primary-pressed);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);

  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
  --color-brand-hover: var(--brand-hover);
  --color-brand-strong: var(--brand-strong);
  --color-brand-subtle: var(--brand-subtle);
  --color-brand-subtle-foreground: var(--brand-subtle-foreground);
  --color-brand-glow: var(--brand-glow);

  --color-rating: var(--rating);
  --color-rating-stroke: var(--rating-stroke);

  --color-success: var(--success);
  --color-success-subtle: var(--success-subtle);
  --color-success-subtle-foreground: var(--success-subtle-foreground);
  --color-success-surface: var(--success-surface);
  --color-success-border: var(--success-border);
  --color-success-title: var(--success-title);
  --color-warning: var(--warning);
  --color-warning-subtle: var(--warning-subtle);
  --color-warning-subtle-foreground: var(--warning-subtle-foreground);
  --color-warning-surface: var(--warning-surface);
  --color-warning-border: var(--warning-border);
  --color-warning-title: var(--warning-title);
  --color-info: var(--info);
  --color-info-subtle: var(--info-subtle);
  --color-info-subtle-foreground: var(--info-subtle-foreground);
  --color-info-surface: var(--info-surface);
  --color-info-border: var(--info-border);
  --color-info-title: var(--info-title);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-destructive-hover: var(--destructive-hover);
  --color-destructive-subtle: var(--destructive-subtle);
  --color-destructive-subtle-foreground: var(--destructive-subtle-foreground);
  --color-destructive-surface: var(--destructive-surface);
  --color-destructive-border: var(--destructive-border);
  --color-destructive-title: var(--destructive-title);
  --color-neutral: var(--neutral);
  --color-neutral-subtle: var(--neutral-subtle);
  --color-neutral-subtle-foreground: var(--neutral-subtle-foreground);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 4px);
  --radius-xl: calc(var(--radius) + 10px);

  --text-display: 1.875rem;
  --text-display--line-height: 2.25rem;
  --text-display-lg: 2.5rem;
  --text-display-lg--line-height: 3rem;
  --text-h1: 1.75rem;
  --text-h1--line-height: 2.25rem;
  --text-h2: 1.375rem;
  --text-h2--line-height: 1.875rem;
  --text-h3: 1.125rem;
  --text-h3--line-height: 1.625rem;

  --text-code-xl: 2rem;
  --text-code-xl--line-height: 2.5rem;
  --tracking-code: 0.2em;
}

@utility glow-brand {
  box-shadow: 0 0 0 4px var(--brand-glow);
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-sans antialiased;
  }
  h1, h2, h3 {
    text-wrap: balance;
  }
  p {
    text-wrap: pretty;
  }
  button:not(:disabled),
  [role="button"],
  a,
  input,
  select,
  textarea,
  label {
    touch-action: manipulation;
  }
  button:not(:disabled),
  [role="button"]:not([aria-disabled="true"]) {
    cursor: pointer;
  }
}
```

Tiga tambahan di luar token warna:

- `tw-animate-css` menyediakan kelas animasi (`animate-in`, `fade-in`, `slide-in-from-bottom`) yang dipakai Dialog, Sheet, Popover, dan Dropdown dari shadcn
- `shadcn/tailwind.css` menyediakan varian seperti `data-open:` yang dipakai komponen shadcn versi 4. Isinya varian, bukan warna, jadi tidak melanggar aturan token
- `@layer base` juga mengatur `text-wrap` judul dan paragraf, `touch-action`, serta kursor tombol (Tailwind v4 memakai `cursor: default` untuk `<button>`)
- `@layer base` menjadikan `--border` sebagai warna garis bawaan. Tanpa ini, Tailwind v4 memakai `currentColor`, sehingga setiap `border` yang lupa diberi `border-border` tampil hitam pekat

Hasilnya, kelas seperti `bg-primary`, `hover:bg-primary-hover`, `bg-brand`, `text-brand-foreground`, `text-brand-strong`, `bg-brand-subtle`, `bg-brand-hover`, `hover:bg-destructive-hover`, `text-h1`, `text-display md:text-display-lg`, `fill-rating`, `bg-success-subtle`, `text-code-xl`, dan `rounded-lg` langsung tersedia. Cahaya titik live memakai utilitas `glow-brand`, dan cincin fokus memakai `ring-2 ring-ring ring-offset-2 ring-offset-card` bawaan Tailwind.

**Aturan untuk kode:**

- Tidak ada warna hex, `rgb()`, atau nilai arbitrer seperti `bg-[#22C55E]` dan `p-[13px]` di `className`
- Tidak memakai palet bawaan Tailwind (`bg-green-500`, `text-gray-500`) di komponen. Semua lewat token di atas
- `text-brand` dan `text-white` di atas `bg-brand` dilarang (kontras 2,28:1). Pakai `text-brand-strong` untuk teks hijau dan `text-brand-foreground` di atas `bg-brand`. Penjaga token sebaiknya ditambah aturan untuk dua pola ini
- `border-l-brand` (garis tepi kiri berwarna) dan `max-w-prose` tidak dipakai lagi (D242, D247). Penjaga token sebaiknya menolak keduanya
- Butuh warna atau ukuran baru: tambahkan dulu ke dokumen ini dan ke `globals.css`, baru dipakai
- Pengecualian yang benar-benar perlu ditandai komentar `// token-check-ignore: <alasan>` di baris yang sama. Tanpa alasan, `npm run lint` tetap gagal

---

## 14. Migrasi dari v1.6 ke v2.1

Untuk sesi Claude Code yang memindahkan kode W0 dan W2 ke v2.1. Struktur komponen tidak berubah, yang berubah hanya token dan beberapa pola tampilan. Komponen lokal di `src/app/dev/ds/ui/` adalah acuan bentuk akhir `components/ui`, setelah disesuaikan ke v2.1.

**Token:**

| v1.6 | v2.0 | Keterangan |
|---|---|---|
| `--primary` `#00814B` | `--primary` `#1C1917` | Seluruh `bg-primary` otomatis jadi hitam |
| `--primary-hover` `#006B3E` | `--primary-hover` `#44403C` | |
| `--primary-subtle`, `--primary-subtle-foreground` | `--brand-subtle`, `--brand-subtle-foreground` | Token lama dihapus. Ganti pemakaiannya (avatar inisial, opsi terpilih, menu aktif lama) |
| `--ring` `#00814B` | `--ring` `#1C1917` | Cincin fokus jadi hitam dengan jarak putih 2 px |
| `--now`, `--now-foreground`, `--now-strong`, `--now-subtle`, `--now-subtle-foreground` | `--brand` dan turunannya | Token lama dihapus. Mode Sekarang dibedakan lewat bentuk (Bagian 1.3b) |
| `--success*` hijau | `--success*` teal | Nilai berganti, nama tetap. Ditambah `--success-title` dan judul banner nada lain |
| Bintang `--foreground` | `--rating`, `--rating-stroke` | Token baru |
| | `--primary-pressed`, `--disabled-foreground`, `--brand-*`, `--{nada}-title`, `--destructive-hover` | Token baru |
| Ukuran teks bawaan Tailwind | `text-display`, `text-display-lg`, `text-h1`, `text-h2`, `text-h3` | Token baru (D247) |

**Pola tampilan:**

| Komponen | Perubahan |
|---|---|
| `Button` varian `now` | Latar `--brand`, teks `--brand-foreground` (sebelumnya lime dengan teks hijau tua) |
| `ModeBadge` Sekarang dan `BOOKING_MODE_META.AVAILABLE_NOW` | Pill putih bergaris `--brand` dengan titik, bukan pill lime solid. Ikon `Zap` diganti titik |
| `OfferCard` | Kartu putih biasa tanpa garis tepi kiri dan tanpa bayangan, label "Tawaran baru", `ModeBadge` Sekarang di kanan atas, hitung mundur di bawah judul (D242). Bukan latar lime |
| `AvailabilityToggle` | Kartu putih biasa. Saat menyala, `ModeBadge` Sekarang di baris status (D242) |
| `Switch` | Trek dan garis menyala `--brand-hover`, thumb `--card` (D244) |
| Input fokus | Garis `--foreground` dan cincin `--ring`, bukan cincin hijau pucat |
| Header publik | Tautan menu aktif `--brand-strong` (Bagian 6.4, elemen lain). Tombol "Masuk" tetap `outline` |
| Menu sidebar, navigasi bawah, tab | Aktif pucat `--brand-subtle` (D243, Bagian 6.4) |
| `ListingCard` | Bintang `--rating`. `ModeBadge` hanya untuk mode Sekarang (D246). Judul `line-clamp-2`, nama usaha `truncate` |
| `ORDER_STATUS_META.SETTLED` | Label "Dana cair" (D245) |
| Tipografi | Judul memakai token `text-h1` sampai `text-display`. `max-w-prose` diganti `max-w-xl` atau `max-w-lg` (D247) |
| Formulir | Atribut field Bagian 6.1b, fokus ke error pertama, error `body-sm` 500 (D248) |
| Layout | Tautan "Lewati ke konten" (D248) |
| `EscrowNote` | Komponen domain baru (D250) |
| `/dev/ui` | Tambah bagian penanda aktif (Bagian 6.4) dan state tombol |
| `check-design-tokens.mjs` | Tambah aturan: `text-brand` dan `text-white` bersamaan `bg-brand` dilarang, `border-l-brand` dan `max-w-prose` dilarang |

**Verifikasi setelah migrasi:** tidak ada lagi referensi `now-`, `primary-subtle`, atau hex lama di `src/` (`grep`), typecheck, lint, test, dan screenshot `/dev/ui`, beranda, `/cari`, `/listing/[id]`, dan layout empat area di 390 dan 1280 px dibandingkan dengan halaman peraga `/dev/ds` (setelah diperbarui ke v2.1). Mockup Claude Design frame 05f tidak lagi menjadi acuan untuk penanda Sekarang dan menu aktif.

---

## Lampiran. Riwayat Revisi

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 17 November 2026 | Versi awal (draf). Token warna dengan cek kontras, tipografi, tata letak, komponen, label status, format, glosarium. Menunggu penyesuaian dengan mockup Figma |
| 1.1 | 17 November 2026 | Revisi dari tinjauan mockup. Primary jadi hijau zamrud yang lebih cerah (`#00814B`). Mode Sekarang jadi kuning (`#FACC15`, teks gelap) dengan token baru `--now-strong`. Warning jadi oranye pekat supaya lebih mencolok. Warna merek tidak lagi dipakai untuk status: status berjalan pindah ke nada `info`. Bintang rating berwarna teks. Ikon wajib dari lucide. Varian tombol `secondary` dan `outline` dipisah |
| 1.2 | 18 November 2026 | Mode Sekarang dari kuning jadi ungu (`#7C3AED`), token `--now-strong` dihapus. Warning kembali kuning dengan latar lebih pekat (`#FEF08A`). Alasannya: dua kuning tidak bisa dibedakan dengan andal |
| 1.3 | 18 November 2026 | Mode Sekarang jadi oranye terang (`#F97316`, teks gelap, selalu solid) dengan `--now-strong` kembali. Warning jadi kuning keemasan (amber) yang selalu pucat. Pola banner status berlapis untuk semua nada (Bagian 1.4b), mengikuti referensi yang dipilih |
| 1.4 | 18 November 2026 | Mode Sekarang jadi hijau neon (lime `#D4F034`) dengan teks hijau tua `#00432A`, terinspirasi gaya kartu Grab. Kartu tawaran memakai latar lime solid dengan tombol Ambil hijau tua. **Disetujui** sebagai acuan implementasi |
| 1.5 | 18 November 2026 | Hasil W0 bagian 1. Bagian 13 ditambah impor `tw-animate-css` dan `shadcn/tailwind.css`, `@layer base` (garis bawaan `--border`, gaya `body`), serta token `text-code-xl` dan `tracking-code`. Label `PAID` diganti "Sudah dibayar" (ikon `Banknote`) karena bentrok dengan `ModeBadge` "Terjadwal". `ModeBadge` "Terjadwal" pindah ke varian `outline` baru, supaya tidak sewarna dengan badge status `info`. Ukuran teks badge ditegaskan 12 px. Aturan pengecualian `token-check-ignore` |
| 1.6 | 19 November 2026 | Hasil W0 bagian 4. Label lengkap untuk status komplain (termasuk `CLOSED`), pencairan, pengembalian dana, dan notifikasi email di Bagian 7.2, seluruhnya lewat `EnumBadge` (D239) |
| 2.0 | 21 November 2026 | **Palet baru dari tinjauan mockup 05f.** Primary jadi hitam hangat `#1C1917` untuk aksi. Hijau terang `#22C55E` jadi secondary dengan token `--brand` untuk yang terpilih, aktif, dan sedang terjadi, termasuk mode Sekarang yang kini dibedakan lewat bentuk. Token lime `--now*` dan `--primary-subtle*` dihapus. Status berhasil jadi teal `#0F766E`. Bintang rating kuning. Menu aktif solid hijau (pilihan H). Bagian baru 1.3b, 1.4c, 6.4 (penanda aktif dan state tombol), dan 14 (migrasi dari v1.6). Cincin fokus hitam |
| 2.1 | 22 November 2026 | **Hasil review dengan empat skill desain** terhadap `/dev/ds` (D242 sampai D250). Palet tetap. Penanda mode Sekarang tanpa garis tepi kiri, memakai badge yang sama di semua tempat (D242). Menu, tab, dan navigasi bawah aktif jadi pucat (D243). Switch menyala `--brand-hover` (D244). `SETTLED` jadi "Dana cair" (D245). `ListingCard` hanya menandai mode Sekarang (D246). Skala tipografi baru dan lebar baris (D247). Bagian baru 6.1b (atribut field), aturan formulir, aksesibilitas, dan gerak (D248). Aturan dua lapis kotak, aturan bentuk, dan nada judul (D249). Komponen `EscrowNote` (D250). Koreksi angka kontras di 1.5, penanda grafis yang dibenarkan, state `secondary`, `ghost`, `destructive`, chip filter, dan token `--destructive-hover` |
