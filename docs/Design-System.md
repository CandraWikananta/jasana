# Design System Jasana

**Artefak frontend 2 dari 4**
Platform Jasana, Tugas Akhir I Nyoman Gede Candra Wikananta (2305551065)
**Versi 1.4 (disetujui)**, 18 November 2026

Dokumen ini menetapkan bahasa visual dan bahasa teks seluruh antarmuka Jasana: warna, tipografi, jarak, komponen, label status, format angka dan waktu, serta glosarium. Tujuannya satu: **empat area (publik dan client, usaha, pekerja, admin) terlihat dan terbaca seperti satu produk**, walaupun dibangun dalam belasan sesi Claude Code yang terpisah.

> **Status nilai token.** Nilai di dokumen ini **sudah disetujui** pada 18 November 2026 setelah empat putaran tinjauan mockup. Mockup acuan: [Jasana Design System](https://claude.ai/artifact/JbFfFaYxNEV4MBeJKBKUZA) (tipografi, tombol, status, komponen, layar pelanggan, layar pekerja). Kalau mockup dan dokumen ini berbeda, **dokumen ini yang menang** dan mockup yang diperbaiki. Perubahan token berikutnya harus lewat revisi dokumen ini lebih dulu, baru kode. Yang tidak boleh berubah adalah strukturnya: seluruh komponen membaca token, tidak ada nilai warna, radius, atau font yang ditulis lepas.

---

## 0. Prinsip

| # | Prinsip | Artinya di layar |
|---|---|---|
| P1 | **Jelas dulu, baru menarik** | UAT menilai fungsionalitas, kemudahan, dan kepuasan per aktor (D85). Pengguna harus selalu tahu status pesanannya dan langkah berikutnya tanpa membaca paragraf |
| P2 | **Satu layar, satu aksi utama** | Paling banyak satu tombol `primary` per tampilan. Aksi lain `secondary` atau `ghost` |
| P3 | **Pekerja memakai HP di lapangan** | Area pekerja dirancang untuk lebar 390 px, satu tangan, layar terkena matahari: tombol besar, kontras tinggi, teks pendek |
| P4 | **Angka datang dari server** | Uang, waktu, dan sisa waktu selalu dari respons API, diformat dengan satu set fungsi yang sama |
| P5 | **Status tidak hanya warna** | Setiap status punya teks dan ikon, bukan sekadar warna |

### Arah estetika

**Hangat, rapi, dan tepercaya.** Platform ini menangani uang orang dan mengirim orang ke rumah orang lain, jadi kesan yang dicari adalah tenang dan bisa dipercaya, bukan ramai.

| Pilihan | Alasan |
|---|---|
| Hijau zamrud cerah sebagai warna utama | Segar dan tepercaya. Ini hijau paling cerah yang masih lolos kontras AA dengan teks putih, di atas putih maupun latar halaman |
| Warna merek **hanya untuk aksi** | Tombol utama, tautan, dan elemen aktif. Status pesanan tidak pernah memakai warna merek, supaya hijau aksi tidak tertukar dengan hijau "Selesai" |
| Hijau neon (lime) khusus untuk hal yang terjadi **sekarang** | Mode Available Now, tawaran masuk, dan hitung mundur punya warna sendiri yang paling menyala di layar, sehingga urgensi terbaca tanpa membaca teks. Selalu dipasangkan dengan teks hijau tua, dan selalu tampil sebagai isi solid. Satu keluarga dengan hijau merek, jadi terasa bagian dari Jasana, tapi jauh lebih terang sehingga tidak tertukar |
| Banner berlapis: latar pucat, garis tipis, chip ikon | Pola banner status mengikuti satu bentuk untuk semua nada (Bagian 1.4): mudah dikenali, dan warna pucatnya tidak berebut perhatian dengan tombol utama |
| Bintang rating berwarna teks, bukan kuning | Kuning sudah dipakai untuk warning |
| Netral hangat (stone), bukan abu-abu dingin | Lebih ramah untuk produk jasa rumah tangga |
| Plus Jakarta Sans | Huruf karya desainer Indonesia, terbaca baik di ukuran kecil, punya angka tabular |
| Garis tepi tipis, bukan bayangan tebal | Kartu dan tabel tetap rapi saat padat data (dashboard usaha dan admin) |

**Hindari:** gradien ungu-biru, efek kaca (glassmorphism), emoji sebagai ikon, ilustrasi 3D generik, bayangan tebal di kartu, teks paragraf yang dirata tengah, animasi yang tidak membawa informasi.

**Untuk Claude Code.** Kalau skill `frontend-design` aktif, arah estetika di bagian ini **sudah ditetapkan**. Jangan memilih arah baru, palet lain, atau font lain. Pakai kreativitas untuk komposisi dan detail interaksi di dalam batas token ini.

---

## 1. Warna

Nama token mengikuti konvensi shadcn/ui supaya komponen bawaannya langsung memakai palet ini. Token tambahan khusus Jasana ditandai **(Jasana)**.

### 1.1 Netral dan permukaan

| Token | Nilai | Pemakaian |
|---|---|---|
| `--background` | `#FAFAF9` | Latar halaman |
| `--foreground` | `#1C1917` | Teks utama |
| `--card` | `#FFFFFF` | Kartu, panel, dialog |
| `--card-foreground` | `#1C1917` | Teks di kartu |
| `--popover` | `#FFFFFF` | Dropdown, popover |
| `--popover-foreground` | `#1C1917` | |
| `--muted` | `#F5F5F4` | Latar bagian sekunder, baris tabel selang-seling, skeleton |
| `--muted-foreground` | `#57534E` | Teks sekunder, metadata, keterangan |
| `--border` | `#E7E5E4` | Garis tepi kartu dan pemisah (dekoratif) |
| `--input` | `#918A84` | Garis tepi input, checkbox, radio (kontras 3,4:1, syarat komponen UI) |

### 1.2 Merek

| Token | Nilai | Pemakaian |
|---|---|---|
| `--primary` | `#00814B` | Tombol utama, tautan, elemen aktif. **Tidak untuk status** |
| `--primary-foreground` | `#FFFFFF` | Teks di atas `--primary` |
| `--primary-hover` **(Jasana)** | `#006B3E` | Hover dan pressed tombol utama |
| `--primary-subtle` **(Jasana)** | `#E7F6EE` | Latar sorotan, item menu aktif, opsi yang dipilih, cincin fokus input |
| `--primary-subtle-foreground` **(Jasana)** | `#005C33` | Teks di atas `--primary-subtle` |
| `--ring` | `#00814B` | Cincin fokus keyboard |
| `--secondary` | `#F5F5F4` | Tombol sekunder |
| `--secondary-foreground` | `#1C1917` | |
| `--accent` | `#F5F5F4` | Hover item menu dan baris |
| `--accent-foreground` | `#1C1917` | |

### 1.3 Mode "Sekarang" (Jasana)

Dipakai **hanya** untuk hal yang terjadi sekarang: badge mode Available Now, kartu tawaran masuk, hitung mundur respons, toggle "Siap terima pesanan sekarang". Jangan dipakai untuk peringatan biasa.

| Token | Nilai | Pemakaian |
|---|---|---|
| `--now` | `#D4F034` | Latar kartu tawaran (solid), badge "Sekarang", tombol Ambil di luar kartu tawaran, penanda posisi pekerja di peta |
| `--now-foreground` | `#00432A` | Teks dan ikon di atas `--now`. Juga isi tombol Ambil **di dalam** kartu tawaran (dengan teks `--now`), supaya tombolnya terlihat di atas latar lime |
| `--now-strong` | `#4D7C0F` | Teks, ikon, dan hitung mundur bernada Sekarang di atas putih atau `--now-subtle`. Track toggle yang menyala |
| `--now-subtle` | `#ECFCCB` | Latar toggle yang menyala |
| `--now-subtle-foreground` | `#3F6212` | Teks di atas `--now-subtle` |

**Aturan pakai.** Lime tidak pernah dipakai sebagai warna teks, ikon, atau garis di atas latar terang (kontrasnya hanya 1,29:1 di atas putih), dan tidak pernah diberi teks putih. Di atas latar terang, pakai `--now-strong`. Elemen lime di atas latar putih selalu punya isi teks gelap yang menjelaskan dirinya, jadi tidak bergantung pada batas warnanya.

### 1.4 Semantik

| Token | Solid | Subtle (latar) | Teks di atas subtle | Pemakaian |
|---|---|---|---|---|
| `--success` | `#15803D` | `#DCFCE7` | `#166534` | Selesai, terverifikasi, dana cair |
| `--warning` | `#B45309` | `#FEF3C7` | `#92400E` | Menunggu tindakan seseorang. Kuning keemasan (amber), selalu tampil pucat |
| `--destructive` | `#B91C1C` | `#FEE2E2` | `#991B1B` | Gagal, ditolak, komplain, aksi berbahaya |
| `--info` | `#1D4ED8` | `#DBEAFE` | `#1E40AF` | Informasi netral yang perlu diperhatikan |
| `--neutral` | `#57534E` | `#F5F5F4` | `#44403C` | Status akhir yang tidak berhasil (kedaluwarsa, dibatalkan) |

### 1.4b Banner status

Satu bentuk untuk semua nada, mengikuti referensi yang dipilih: latar paling pucat, garis tepi 1 px, chip ikon bulat di kiri, judul tebal, lalu satu kalimat.

| Nada | Latar `--{nada}-surface` | Garis `--{nada}-border` | Chip ikon (latar / ikon) | Judul | Isi |
|---|---|---|---|---|---|
| success | `#F0FDF4` | `#BBF7D0` | `#BBF7D0` / `#15803D` | `#14532D` | `#166534` |
| warning | `#FFFBEB` | `#FDE68A` | `#FDE68A` / `#B45309` | `#78350F` | `#92400E` |
| info | `#EFF6FF` | `#BFDBFE` | `#BFDBFE` / `#1D4ED8` | `#1E3A8A` | `#1E40AF` |
| destructive | `#FEF2F2` | `#FECACA` | `#FECACA` / `#B91C1C` | `#7F1D1D` | `#991B1B` |

Ikon chip memakai ikon lucide: `CircleCheck`, `TriangleAlert`, `Info`, `CircleX`. Tombol tutup (`X`) hanya untuk banner yang memang boleh ditutup, tidak untuk banner status pesanan.

### 1.5 Hasil cek kontras

Dihitung dengan rumus WCAG 2.1. Seluruh pasangan teks lolos AA (minimal 4,5:1).

| Pasangan | Rasio |
|---|---|
| `--primary` di atas putih | 4,95:1 |
| `--primary` di atas `--background` (tautan di halaman) | 4,74:1 |
| `--primary` di atas `--muted` | 4,54:1 |
| Putih di atas `--primary-hover` | 6,62:1 |
| `--primary-subtle-foreground` di atas `--primary-subtle` | 7,30:1 |
| `--foreground` di atas `--background` | 16,74:1 |
| `--muted-foreground` di atas putih | 7,63:1 |
| `--now-foreground` di atas `--now` | 8,88:1 |
| `--now-strong` di atas putih | 4,99:1 |
| `--now-strong` di atas `--now-subtle` | 4,60:1 |
| `--now-subtle-foreground` di atas `--now-subtle` | 6,52:1 |
| `--warning-subtle-foreground` di atas `--warning-subtle` (badge) | 6,37:1 |
| Isi banner warning (`#92400E`) di atas `#FFFBEB` | 6,84:1 |
| Judul banner warning (`#78350F`) di atas `#FFFBEB` | 8,75:1 |
| Putih di atas `--success` | 5,02:1 |
| Teks subtle semantik lain di atas latarnya | 6,49 sampai 9,42:1 |
| Putih di atas `--destructive` | 6,47:1 |
| `--input` di atas putih (batas komponen, syarat 3:1) | 3,40:1 |

Kenapa hijau utamanya tidak lebih terang lagi: hijau yang lebih cerah dari `#00814B` turun di bawah 4,5:1 kalau diberi teks putih (misalnya `#059669` hanya 3,77:1). Kalau suatu saat ingin hijau yang jauh lebih cerah, teks di atas tombol harus diganti gelap, seperti tombol kuning pada umumnya.

`--border` (`#E7E5E4`) sengaja rendah kontrasnya karena hanya dekoratif. Komponen yang batasnya wajib terlihat (input, checkbox, radio, switch) memakai `--input`.

**Tidak ada mode gelap** (FE13). Jangan menambahkan varian `dark:` di mana pun.

---

## 2. Tipografi

**Keluarga huruf:** Plus Jakarta Sans lewat `next/font/google`, bobot 400, 500, 600, 700, subset `latin`. Variabel CSS `--font-jakarta`. Huruf monospace hanya untuk nomor pesanan dan potongan teknis di admin, memakai `ui-monospace` bawaan sistem.

| Token | Ukuran / tinggi baris | Bobot | Pemakaian |
|---|---|---|---|
| `display` | 30 / 36 px | 700 | Judul utama beranda saja |
| `h1` | 24 / 32 px | 700 | Judul halaman |
| `h2` | 20 / 28 px | 600 | Judul bagian |
| `h3` | 18 / 26 px | 600 | Judul kartu, judul dialog |
| `body` | 16 / 24 px | 400 | Teks utama, **seluruh input** |
| `body-sm` | 14 / 20 px | 400 | Teks sekunder, isi tabel, deskripsi kartu |
| `caption` | 12 / 16 px | 500 | Label kecil, metadata, keterangan di bawah input |
| `code-xl` | 32 / 40 px | 700, `tabular-nums`, jarak huruf 0,2em | Kode verifikasi 6 digit di layar client |

Aturan:

- Input selalu 16 px. Di bawah itu, Safari iOS memperbesar halaman otomatis saat input disentuh
- Angka uang di tabel dan hitung mundur memakai `tabular-nums` supaya angkanya tidak bergoyang
- Panjang baris teks paragraf paling banyak sekitar 70 karakter (`max-w-prose`)
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
| `radius-full` | | Badge, avatar, toggle |

- Kartu memakai garis tepi 1 px `--border`, **tanpa bayangan**
- Bayangan hanya untuk elemen yang melayang: popover, dropdown, dialog, toast (`shadow-lg`), dan header yang menempel saat digulir (`shadow-sm`)
- Pemisah antarbagian memakai jarak, bukan garis, kecuali di tabel

---

## 5. Ikon dan Gambar

| Aspek | Ketentuan |
|---|---|
| Set ikon | **`lucide-react` saja**, nama ikon sesuai katalog lucide. Tidak mencampur set ikon lain, tidak menggambar ikon sendiri, dan tidak memakai emoji sebagai ikon. Di luar kode React (mockup, dokumen), pakai SVG asli dari paket `lucide-static` dengan nama yang sama |
| Bintang rating | Ikon `Star` terisi `--foreground`. Tidak memakai kuning, supaya tidak terbaca sebagai warning |
| Ukuran | 16 px di dalam teks, 20 px di tombol, 24 px di navigasi |
| Foto listing | Rasio 4:3, `object-cover`, lewat `next/image` dengan `sizes` yang benar |
| Avatar | Lingkaran. Tanpa foto: inisial di atas `--primary-subtle` |
| Empty state | Ikon lucide 24 px di dalam lingkaran `--muted`, bukan ilustrasi stok |
| Dokumen e-KYC dan bukti komplain | **Tidak lewat `next/image`.** Signed URL privat berumur pendek tidak boleh ikut di-cache optimizer server Next. Pakai `<img>` biasa atau buka di tab baru |
| Peta | Tile OpenStreetMap dengan atribusi "© OpenStreetMap contributors" yang selalu terlihat |

Penanda peta:

| Penanda | Warna |
|---|---|
| Lokasi layanan (rumah client) | `--primary`, ikon `MapPin` |
| Posisi penanggung jawab | `--now` dengan garis tepi 2 px `--now-foreground`, lingkaran berdenyut pelan. Garis gelap wajib, karena lime hampir hilang di atas tile peta yang terang |
| Lokasi basis usaha | `--neutral`, ikon `Store` |

---

## 6. Komponen

Dasar komponen dari **shadcn/ui** (disalin ke `src/components/ui`, berbasis Radix). Komponen domain dibangun di atasnya dan tinggal di `src/components/shared` atau `src/features/<domain>/components`.

### 6.1 Komponen dasar

| Komponen | Varian | Aturan pakai |
|---|---|---|
| `Button` | `primary`, `secondary` (latar `--muted`), `outline` (garis `--input`), `ghost`, `destructive`, `now` (latar lime, teks hijau tua) | Satu `primary` per tampilan. Saat memproses: tetap menampilkan label, ditambah spinner, dan dinonaktifkan supaya tidak terkirim dua kali. Label selalu kata kerja |
| Ukuran tombol | `sm` 36 px, `md` 40 px, `lg` 48 px | **Area pekerja memakai `lg`** untuk seluruh aksi lapangan |
| `Input`, `Textarea` | | Label selalu terlihat di atas input. Placeholder bukan pengganti label. Pesan error di bawah input berwarna `--destructive` dengan ikon |
| `Select`, `Combobox` | | Combobox untuk daftar lebih dari 8 item |
| `Checkbox`, `RadioGroup`, `Switch` | | Area sentuh minimal 44 px termasuk labelnya |
| `InputOTP` | 6 kotak | Untuk kode verifikasi di sisi pekerja. `inputMode="numeric"` |
| `Dialog` | | Konfirmasi aksi berbahaya dan formulir pendek. Di HP berubah jadi `Sheet` dari bawah |
| `Sheet` | bawah, kanan | Filter pencarian di HP, detail cepat di admin |
| `Tabs` | | Maksimal 5 tab. Di HP bisa digeser |
| `Table` / `DataTable` | | Area usaha dan admin. Header `caption` kapital, angka uang rata kanan dan `tabular-nums` |
| `Skeleton` | | Mengikuti bentuk konten yang dimuat, bukan blok abu-abu tunggal |
| `Toast` (sonner) | sukses, error, info | Pesan maksimal satu kalimat. Posisi bawah tengah di HP, kanan bawah di desktop |
| `Alert` / banner | info, warning, destructive, now | Banner status di atas halaman detail order |
| `Badge` | lihat Bagian 7 | Selalu teks + ikon |
| `Avatar`, `Tooltip`, `Popover`, `Accordion`, `Pagination`, `Breadcrumb` | | Sesuai bawaan |

### 6.2 Komponen domain

| Komponen | Isi | Dipakai di |
|---|---|---|
| `StatusBadge` | Badge status order dari `ORDER_STATUS_META` | Semua daftar dan detail order |
| `ModeBadge` | "Terjadwal" (ikon `CalendarClock`, nada `info`) atau "Sekarang" (ikon `Zap`, nada `now`) | Kartu listing, order, tawaran |
| `MoneyText` | Rupiah terformat, `tabular-nums` | Seluruh angka uang |
| `PriceBreakdown` | Baris harga dasar, tiap opsi beserta deltanya, total. Prop `estimate` menambahkan label "Perkiraan" | Form pesan (perkiraan), detail order (dari server) |
| `Countdown` | Sisa waktu dari timestamp server. Nada `now` kalau di bawah 5 menit | Tawaran, batas bayar, batas komplain, kode |
| `DateTimeText` | Tanggal dan jam WITA dengan label | Seluruh tampilan waktu |
| `ListingCard` | Foto 4:3, judul, nama usaha, rating, "Mulai Rp...", jarak, `ModeBadge` | Pencarian, beranda, rekomendasi Asisten |
| `OptionPicker` | Perender atribut OPTION berdasarkan definisi (PRD Frontend Bagian 6) | Form pesan |
| `AttributeFields` | Perender atribut SPEC untuk editor listing | Editor jasa |
| `OrderActionBar` | Merender hasil `getOrderActions()`. Tidak punya logika sendiri | Detail order semua area |
| `OrderTimeline` | Riwayat status dari `GET /orders/:id/history` | Detail order |
| `OfferCard` | Kartu tawaran Available Now: latar `--now-subtle`, `Countdown`, tombol Ambil dan Lewati | Area pekerja, dashboard usaha |
| `VerificationCodeDisplay` | Kode `code-xl`, sisa waktu, peringatan | Detail order sisi client |
| `VerificationCodeInput` | `InputOTP` + tombol Verifikasi + status percobaan | Detail order sisi pekerja |
| `OrderMessagesPanel` | Daftar pesan, input dengan penghitung karakter, tanda dibaca | Detail order |
| `MapView`, `MapPicker` | Peta baca saja dan peta pemilih pin. Dimuat dinamis tanpa SSR | Form pesan, alamat, detail order, profil usaha |
| `FileDropzone` | Varian `multipart` (e-KYC, bukti) dan `signedUrl` (foto listing) | Pendaftaran penyedia, komplain, editor jasa |
| `AvailabilityToggle` | Toggle besar "Siap terima pesanan sekarang" bernada `now`, dengan status izin lokasi | Area pekerja |
| `RoleSwitcher` | Pindah area: Pelanggan, Usaha, Pekerja, Admin, hanya yang dimiliki | Menu avatar di header |
| `EmptyState`, `ErrorState` | Ikon, judul, satu kalimat, satu aksi | Seluruh halaman data |
| `AssistantWidget` | Tombol melayang "Tanya Asisten" dan panel percakapan | Area publik dan client |

### 6.3 Galeri komponen

Sediakan halaman **`/dev/ui`** yang menampilkan seluruh komponen dasar, seluruh varian tombol, 15 badge status order, badge enum lain, `PriceBreakdown`, `Countdown` di berbagai sisa waktu, dan `OfferCard`. Halaman ini **hanya hidup di development** (`notFound()` kalau `NODE_ENV === 'production'`).

Gunanya: Claude Code dan kamu bisa mengecek konsistensi visual di satu tempat, dan screenshot halaman ini bisa jadi lampiran laporan.

---

## 7. Label dan Nada Status

### 7.1 Status order

Satu sumber di kode: `ORDER_STATUS_META` di `src/lib/order-status.ts`. Tidak ada label status yang ditulis langsung di komponen.

| Enum | Label | Nada | Ikon lucide |
|---|---|---|---|
| `PENDING_ACCEPTANCE` | Menunggu konfirmasi | `warning` | `Hourglass` |
| `ACCEPTED` | Menunggu pembayaran | `warning` | `Wallet` |
| `PAID` | Terjadwal | `info` | `CalendarCheck` |
| `ON_THE_WAY` | Dalam perjalanan | `info` | `Navigation` |
| `ARRIVED` | Tiba di lokasi | `info` | `MapPinCheck` |
| `IN_PROGRESS` | Sedang dikerjakan | `info` | `Wrench` |
| `AWAITING_VERIFICATION` | Menunggu kode verifikasi | `warning` | `KeyRound` |
| `COMPLETED` | Selesai | `success` | `CircleCheck` |
| `SETTLED` | Tuntas | `success` | `BadgeCheck` |
| `DISPUTED` | Dalam komplain | `destructive` | `MessageSquareWarning` |
| `REJECTED` | Ditolak | `neutral` | `CircleX` |
| `EXPIRED` | Kedaluwarsa | `neutral` | `TimerOff` |
| `PAYMENT_EXPIRED` | Batas bayar lewat | `neutral` | `TimerOff` |
| `CANCELLED` | Dibatalkan | `neutral` | `Ban` |
| `REFUNDED` | Dana dikembalikan | `neutral` | `Undo2` |

Setiap nada memakai pasangan subtle masing-masing dari Bagian 1.4. **Warna merek tidak dipakai untuk status.** Urutannya terbaca sebagai alur: kuning (menunggu seseorang bertindak), biru (terjadwal dan sedang berjalan), hijau (selesai), merah (komplain), abu (berakhir tanpa hasil). Nama ikon dicek ke versi `lucide-react` yang terpasang, karena beberapa nama berubah antarversi.

Kenapa `PAID` berlabel "Terjadwal": D43 menamai slot yang sudah pasti dengan "terjadwal". Pada mode Available Now status ini hanya beberapa menit, dan banner di detail order (Matriks Bagian 2.3) yang menjelaskan konteksnya.

### 7.2 Enum lain

| Enum | Nilai dan label |
|---|---|
| `verification_status` (usaha) | `DRAFT` Draf (neutral), `PENDING` Menunggu verifikasi (warning), `VERIFIED` Terverifikasi (success), `REJECTED` Ditolak (destructive), `SUSPENDED` Ditangguhkan (destructive) |
| `membership_status` (pekerja) | `PENDING` Pelamar (warning), `ACTIVE` Aktif (success), `REJECTED` Ditolak (neutral), `RESIGNED` Keluar (neutral) |
| Status listing | `DRAFT` Draf (neutral), `ACTIVE` Tayang (success), `INACTIVE` Nonaktif (neutral), `SUSPENDED` Ditangguhkan admin (destructive) |
| `taxonomy_request_status` | `PENDING` Menunggu (warning), `APPROVED` Disetujui (success), `REJECTED` Ditolak (destructive), `MERGED` Sudah ada (info) |
| Komplain | `OPEN` Dibuka (warning), `UNDER_REVIEW` Ditinjau admin (info), putusan `RESOLVED_*` Diputus (success atau neutral sesuai hasil) |
| Withdrawal, refund, notifikasi email | Nilai enum diambil dari `packages/shared`. Pola nada: menunggu = `warning`, berhasil = `success`, gagal atau ditolak = `destructive`, dibatalkan = `neutral` |

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
| Nomor pesanan | | `ORD-20261117-0001` | Apa adanya, `tabular-nums` |

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
| Validasi formulir | Dicek saat input ditinggalkan dan saat dikirim. Detail error 422 dari server dipetakan ke field yang sesuai |
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
| Pengumuman | Perubahan status order diumumkan lewat `aria-live="polite"`. Hitung mundur **tidak** diumumkan tiap detik, hanya pada ambang 5 menit, 1 menit, dan habis |
| Formulir | Setiap input punya label, error dihubungkan lewat `aria-describedby` |
| Gerak | Hormati `prefers-reduced-motion`: matikan animasi masuk dan denyut penanda peta |
| Bahasa | `<html lang="id">` |

---

## 12. Gerak

| Aspek | Ketentuan |
|---|---|
| Durasi | 150 ms untuk hover dan tekan, 200 ms untuk elemen masuk dan keluar |
| Kurva | `ease-out` untuk masuk, `ease-in` untuk keluar |
| Yang boleh bergerak | Kartu tawaran masuk (geser pelan dari atas), toast, dialog, sheet, denyut penanda posisi pekerja |
| Yang tidak boleh | Parallax, konfeti, animasi angka berputar pada uang, loader dekoratif |

---

## 13. Implementasi Token (Tailwind CSS v4 dan shadcn/ui)

Setelah `shadcn init`, ganti nilai variabel di `src/app/globals.css` dengan isi berikut. Tailwind v4 memakai konfigurasi berbasis CSS (`@theme`), bukan `tailwind.config.js`.

```css
@import "tailwindcss";

:root {
  --radius: 0.625rem;

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
  --ring: #00814B;

  --primary: #00814B;
  --primary-foreground: #FFFFFF;
  --primary-hover: #006B3E;
  --primary-subtle: #E7F6EE;
  --primary-subtle-foreground: #005C33;
  --secondary: #F5F5F4;
  --secondary-foreground: #1C1917;
  --accent: #F5F5F4;
  --accent-foreground: #1C1917;

  --now: #D4F034;
  --now-foreground: #00432A;
  --now-strong: #4D7C0F;
  --now-subtle: #ECFCCB;
  --now-subtle-foreground: #3F6212;

  --success: #15803D;
  --success-subtle: #DCFCE7;
  --success-subtle-foreground: #166534;
  --warning: #B45309;
  --warning-subtle: #FEF3C7;
  --warning-subtle-foreground: #92400E;
  --success-surface: #F0FDF4;
  --success-border: #BBF7D0;
  --warning-surface: #FFFBEB;
  --warning-border: #FDE68A;
  --info-surface: #EFF6FF;
  --info-border: #BFDBFE;
  --destructive-surface: #FEF2F2;
  --destructive-border: #FECACA;
  --destructive: #B91C1C;
  --destructive-foreground: #FFFFFF;
  --destructive-subtle: #FEE2E2;
  --destructive-subtle-foreground: #991B1B;
  --info: #1D4ED8;
  --info-subtle: #DBEAFE;
  --info-subtle-foreground: #1E40AF;
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

  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary-hover: var(--primary-hover);
  --color-primary-subtle: var(--primary-subtle);
  --color-primary-subtle-foreground: var(--primary-subtle-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);

  --color-now: var(--now);
  --color-now-foreground: var(--now-foreground);
  --color-now-strong: var(--now-strong);
  --color-now-subtle: var(--now-subtle);
  --color-now-subtle-foreground: var(--now-subtle-foreground);

  --color-success: var(--success);
  --color-success-subtle: var(--success-subtle);
  --color-success-subtle-foreground: var(--success-subtle-foreground);
  --color-warning: var(--warning);
  --color-warning-subtle: var(--warning-subtle);
  --color-warning-subtle-foreground: var(--warning-subtle-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-destructive-subtle: var(--destructive-subtle);
  --color-destructive-subtle-foreground: var(--destructive-subtle-foreground);
  --color-info: var(--info);
  --color-info-subtle: var(--info-subtle);
  --color-info-subtle-foreground: var(--info-subtle-foreground);
  --color-success-surface: var(--success-surface);
  --color-success-border: var(--success-border);
  --color-warning-surface: var(--warning-surface);
  --color-warning-border: var(--warning-border);
  --color-info-surface: var(--info-surface);
  --color-info-border: var(--info-border);
  --color-destructive-surface: var(--destructive-surface);
  --color-destructive-border: var(--destructive-border);
  --color-neutral: var(--neutral);
  --color-neutral-subtle: var(--neutral-subtle);
  --color-neutral-subtle-foreground: var(--neutral-subtle-foreground);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 4px);
  --radius-xl: calc(var(--radius) + 10px);
}
```

Hasilnya, kelas seperti `bg-primary`, `text-muted-foreground`, `bg-now-subtle`, `text-now-strong`, `bg-warning-surface`, `text-success-subtle-foreground`, dan `rounded-lg` langsung tersedia.

**Aturan untuk kode:**

- Tidak ada warna hex, `rgb()`, atau nilai arbitrer seperti `bg-[#00814B]` dan `p-[13px]` di `className`
- Tidak memakai palet bawaan Tailwind (`bg-teal-700`, `text-gray-500`) di komponen. Semua lewat token di atas
- Butuh warna atau ukuran baru: tambahkan dulu ke dokumen ini dan ke `globals.css`, baru dipakai

---

## Lampiran. Riwayat Revisi

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 17 November 2026 | Versi awal (draf). Token warna dengan cek kontras, tipografi, tata letak, komponen, label status, format, glosarium. Menunggu penyesuaian dengan mockup Figma |
| 1.1 | 17 November 2026 | Revisi dari tinjauan mockup. Primary jadi hijau zamrud yang lebih cerah (`#00814B`). Mode Sekarang jadi kuning (`#FACC15`, teks gelap) dengan token baru `--now-strong`. Warning jadi oranye pekat supaya lebih mencolok. Warna merek tidak lagi dipakai untuk status: status berjalan pindah ke nada `info`. Bintang rating berwarna teks. Ikon wajib dari lucide. Varian tombol `secondary` dan `outline` dipisah |
| 1.2 | 18 November 2026 | Mode Sekarang dari kuning jadi ungu (`#7C3AED`), token `--now-strong` dihapus. Warning kembali kuning dengan latar lebih pekat (`#FEF08A`). Alasannya: dua kuning tidak bisa dibedakan dengan andal |
| 1.3 | 18 November 2026 | Mode Sekarang jadi oranye terang (`#F97316`, teks gelap, selalu solid) dengan `--now-strong` kembali. Warning jadi kuning keemasan (amber) yang selalu pucat. Pola banner status berlapis untuk semua nada (Bagian 1.4b), mengikuti referensi yang dipilih |
| 1.4 | 18 November 2026 | Mode Sekarang jadi hijau neon (lime `#D4F034`) dengan teks hijau tua `#00432A`, terinspirasi gaya kartu Grab. Kartu tawaran memakai latar lime solid dengan tombol Ambil hijau tua. **Disetujui** sebagai acuan implementasi |
