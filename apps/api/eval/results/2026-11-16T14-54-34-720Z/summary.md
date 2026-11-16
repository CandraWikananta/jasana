# Evaluasi akurasi intent extraction (H15, D153)

| Meta | Nilai |
| --- | --- |
| gateway | gemini |
| model_dikonfigurasi | gemini-3.5-flash-lite |
| model_menjawab | ["gemini-3.5-flash-lite"] |
| dimulai | 2026-11-16T14:54:34.720Z |
| selesai | 2026-11-16T15:04:50.442Z |
| commit | 0615f04c7e85d283741afad10923d536391c47c5 |
| commit_dirty | true |
| sha256_system_instruction | b060690947797e385c0196021e1c20596abcfb68cb8fc9e0fc4cb6d4e3a16f6b |
| sha256_skema_intent | ffbe00a88f64da43c2a54fbe2b039d32c69928dccd1f3ab03f91785225843569 |
| sha256_seluruh_prompt | 8f3ce7c5d65989b4a455dfa2312faf5092dd0d9585725fa66c5696700f115503 |
| sha256_dataset | db96721973ebc58c1c9bb10dce62d47266a5cd4e5d706684680761e3c4a6510c |
| jumlah_sub_kategori_aktif | 12 |
| jumlah_skenario_dataset | 49 |
| jumlah_skenario_dijalankan | 49 |
| skenario_per_asal | {"penyusun":38,"teman":11} |

## Akurasi keseluruhan

Benar 34 dari 49 skenario: **69.39 persen**, target 80 persen (D85): belum tercapai.

- Gagal (dihitung salah, D161): 14
- Berhasil setelah retry 5xx (D165): 6
- Skenario lanjutan dengan last_intent turunan: 3

## Per jenis intent (label)

| Jenis | n | Benar | Persen |
| --- | --- | --- | --- |
| cari_jasa | 30 | 25 | 83.33 |
| perlu_klarifikasi | 6 | 2 | 33.33 |
| jasa_tidak_tersedia | 4 | 3 | 75 |
| sapaan | 4 | 3 | 75 |
| di_luar_cakupan | 5 | 1 | 20 |

## Per asal skenario

| Asal | n | Benar | Persen |
| --- | --- | --- | --- |
| penyusun | 38 | 27 | 71.05 |
| teman | 11 | 7 | 63.64 |

## Confusion matrix jenis intent (baris label, kolom prediksi)

| label \ prediksi | cari_jasa | perlu_klarifikasi | jasa_tidak_tersedia | sapaan | di_luar_cakupan | (gagal) |
| --- | --- | --- | --- | --- | --- | --- |
| cari_jasa | 25 | 0 | 0 | 0 | 1 | 4 |
| perlu_klarifikasi | 0 | 2 | 0 | 0 | 0 | 4 |
| jasa_tidak_tersedia | 0 | 0 | 3 | 0 | 0 | 1 |
| sapaan | 0 | 0 | 0 | 3 | 0 | 1 |
| di_luar_cakupan | 0 | 0 | 0 | 0 | 1 | 4 |

## Slot (metrik pendukung, hanya field berlabel)

| Field | n | Benar | Persen |
| --- | --- | --- | --- |
| lokasi_teks | 0 | 0 | - |
| waktu_jenis | 30 | 24 | 80 |
| budget_maks | 29 | 25 | 86.21 |
| atribut | 0 | 0 | - |

## Latensi Gemini dan token (panggilan berhasil)

- Latensi (ms, termasuk retry): n 35, rata-rata 3589, p50 3257, p95 7224
- Token: rata-rata total per panggilan 1136, jumlah input 34722, output 5038, total 39760
