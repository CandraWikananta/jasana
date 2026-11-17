# Foto override data simulasi

Seed simulasi (`npm run seed:simulasi`) membuat PNG polos sendiri untuk foto listing. Kalau folder
`scripts/sim-photos/<slug-sub-kategori>/` berisi gambar, gambar di folder itu yang dipakai.
Contoh foldernya: `servis-ac/`, `dokumentasi-acara/`.

Aturan:

- Format PNG atau JPEG, maksimal 5 MB per berkas. Jenisnya diperiksa dari magic bytes, bukan dari ekstensi.
- **Tanpa wajah orang.** Pakai foto alat, hasil kerja, atau suasana.
- Hanya gambar milik sendiri, atau gambar berlisensi bebas yang sumbernya dicatat di `SUMBER.txt` dalam folder yang sama.
- Isi folder ini tidak masuk repo (di-gitignore), kecuali README ini.

Satu listing memakai satu sampai tiga gambar, diambil bergiliran dari folder sub-kategorinya.
