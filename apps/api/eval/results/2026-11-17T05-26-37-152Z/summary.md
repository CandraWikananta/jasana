# Evaluasi akurasi intent extraction (H15, D153)

| Meta | Nilai |
| --- | --- |
| gateway | gemini |
| model_dikonfigurasi | gemini-3.5-flash-lite |
| model_menjawab | ["gemini-3.5-flash-lite"] |
| dimulai | 2026-11-17T05:26:37.152Z |
| selesai | 2026-11-17T05:37:19.111Z |
| commit | a8b2f459fd973408520a1b4c4135f541579934ba |
| commit_dirty | false |
| sha256_system_instruction | b060690947797e385c0196021e1c20596abcfb68cb8fc9e0fc4cb6d4e3a16f6b |
| sha256_skema_intent | ffbe00a88f64da43c2a54fbe2b039d32c69928dccd1f3ab03f91785225843569 |
| sha256_seluruh_prompt | 8f3ce7c5d65989b4a455dfa2312faf5092dd0d9585725fa66c5696700f115503 |
| sha256_dataset | db96721973ebc58c1c9bb10dce62d47266a5cd4e5d706684680761e3c4a6510c |
| jumlah_sub_kategori_aktif | 12 |
| jumlah_skenario_dataset | 49 |
| jumlah_skenario_dijalankan | 49 |
| skenario_per_asal | {"penyusun":38,"teman":11} |

## Akurasi keseluruhan

Benar 37 dari 49 skenario: **75.51 persen**, target 80 persen (D85): belum tercapai.

- Gagal (dihitung salah, D161): 11
- Berhasil setelah retry 5xx (D165): 2
- Skenario lanjutan dengan last_intent turunan: 3

## Per jenis intent (label)

| Jenis | n | Benar | Persen |
| --- | --- | --- | --- |
| cari_jasa | 30 | 26 | 86.67 |
| perlu_klarifikasi | 6 | 3 | 50 |
| jasa_tidak_tersedia | 4 | 3 | 75 |
| sapaan | 4 | 2 | 50 |
| di_luar_cakupan | 5 | 3 | 60 |

## Per asal skenario

| Asal | n | Benar | Persen |
| --- | --- | --- | --- |
| penyusun | 38 | 29 | 76.32 |
| teman | 11 | 8 | 72.73 |

## Confusion matrix jenis intent (baris label, kolom prediksi)

| label \ prediksi | cari_jasa | perlu_klarifikasi | jasa_tidak_tersedia | sapaan | di_luar_cakupan | (gagal) |
| --- | --- | --- | --- | --- | --- | --- |
| cari_jasa | 26 | 0 | 0 | 0 | 1 | 3 |
| perlu_klarifikasi | 0 | 3 | 0 | 0 | 0 | 3 |
| jasa_tidak_tersedia | 0 | 0 | 3 | 0 | 0 | 1 |
| sapaan | 0 | 0 | 0 | 2 | 0 | 2 |
| di_luar_cakupan | 0 | 0 | 0 | 0 | 3 | 2 |

## Slot (metrik pendukung, hanya field berlabel)

| Field | n | Benar | Persen |
| --- | --- | --- | --- |
| lokasi_teks | 0 | 0 | - |
| waktu_jenis | 30 | 26 | 86.67 |
| budget_maks | 29 | 26 | 89.66 |
| atribut | 0 | 0 | - |

## Latensi Gemini dan token (panggilan berhasil)

- Latensi (ms, termasuk retry): n 38, rata-rata 4454, p50 4914, p95 7788
- Token: rata-rata total per panggilan 1145, jumlah input 37824, output 5688, total 43512
