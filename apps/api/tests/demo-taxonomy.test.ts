/**
 * H16, usulan D173: kriteria skrip nonaktif taksonomi demo. Murni, tanpa
 * basis data, karena skripnya hanya dijalankan penyusun ke Supabase dev.
 */

import { describe, expect, it } from 'vitest';
// @ts-expect-error modul .mjs tanpa deklarasi tipe, sama seperti catalog-data di attribute-rules.test.
import { OFFICIAL_SUBCATEGORIES, demoTargets } from '../../../scripts/deactivate-demo-taxonomy.mjs';

const at = new Date('2026-10-01T00:00:00Z');
const sub = (slug: string, name = slug, isActive = true) => ({ id: `s-${slug}`, slug, name, isActive, createdAt: at, activeListings: 1 });
const category = (slug: string, name: string, subcategories: ReturnType<typeof sub>[], isActive = true) => ({
  id: `c-${slug}-${name}`, slug, name, isActive, createdAt: at, activeListings: subcategories.length, subcategories,
});

describe('demoTargets (H16, usulan D173)', () => {
  it('taksonomi resmi Lampiran B: empat kategori, dua belas sub-kategori', () => {
    expect(OFFICIAL_SUBCATEGORIES.size).toBe(12);
    expect(OFFICIAL_SUBCATEGORIES.has('perbaikan/servis-ac')).toBe(true);
  });

  it('menangkap slug postman-, nama (Demo ...), dan Otomotif ganda; taksonomi resmi dan yang sudah nonaktif tidak', () => {
    const targets = demoTargets([
      category('otomotif', 'Otomotif', [sub('cuci-mobil-panggilan'), sub('uji-tambahan', 'Tambahan')]),
      category('otomotif-2', 'Otomotif', [sub('cuci-mobil-panggilan')]),
      category('postman-otomotif', 'Otomotif (Demo Postman)', [sub('postman-cuci-kendaraan', 'Cuci Kendaraan Panggilan (Demo Postman)')]),
      category('postman-f3-kebersihan', 'Kebersihan Rumah (Demo F3)', [sub('postman-f3-cuci-karpet', 'x', false)]),
      category('perbaikan', 'Perbaikan', [sub('servis-ac'), sub('tukang-listrik')]),
      category('lama', 'Lama', [], false),
    ]);
    expect(targets.map((t: { jenis: string; slug: string; alasan: string }) => `${t.jenis}:${t.slug}:${t.alasan}`)).toEqual([
      'sub-kategori:uji-tambahan:sub-kategori bukan taksonomi resmi',
      'kategori:otomotif-2:slug kategori bukan taksonomi resmi',
      'sub-kategori:cuci-mobil-panggilan:di bawah kategori bukan taksonomi resmi',
      'kategori:postman-otomotif:slug kategori bukan taksonomi resmi',
      'sub-kategori:postman-cuci-kendaraan:di bawah kategori bukan taksonomi resmi',
      'kategori:postman-f3-kebersihan:slug kategori bukan taksonomi resmi',
    ]);
  });
});
