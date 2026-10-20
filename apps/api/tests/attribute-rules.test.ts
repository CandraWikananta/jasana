/**
 * Aturan atribut dinamis, tanpa basis data.
 *
 *   D72  kombinasi peran, tipe, dan pricing_mode yang sah
 *   D67  option nonaktif tidak bisa dipilih lagi
 *   PRD 3.2 kontrak wajib validasi `listings.attributes`
 *   Lampiran B  seluruh definisi contoh lolos aturan di atas
 */

import { describe, expect, it } from 'vitest';
import type { AttributeDataType, AttributeRole, PricingMode } from '@jasana/database';
import {
  checkAttributeDefinition,
  isAllowedPricingCombination,
  validateAttributeValue,
  validateSpecAttributes,
  type AttributeDefinition,
} from '../src/modules/catalog/attribute-rules';
// @ts-expect-error berkas .mjs tanpa deklarasi tipe
import { CATALOG } from '../../../scripts/catalog-data.mjs';

const opts = (...values: string[]) => values.map((value) => ({ value, is_active: true }));

const def = (overrides: Partial<AttributeDefinition> = {}): AttributeDefinition => ({
  attribute_key: 'jenis_kendaraan',
  data_type: 'SELECT',
  attribute_role: 'OPTION',
  pricing_mode: 'FLAT_PER_OPTION',
  options: opts('Sedan', 'SUV'),
  ...overrides,
});

const paths = (errors: { path: string }[]) => errors.map((error) => error.path);

describe('D72: kombinasi peran, tipe, dan pricing_mode', () => {
  const roles: AttributeRole[] = ['SPEC', 'OPTION'];
  const types: AttributeDataType[] = ['TEXT', 'NUMBER', 'BOOLEAN', 'SELECT', 'MULTISELECT', 'DATE'];
  const modes: PricingMode[] = ['NONE', 'FLAT_PER_OPTION', 'PER_UNIT'];

  const allowed = new Set([
    ...types.map((type) => `SPEC ${type} NONE`),
    'OPTION NUMBER PER_UNIT',
    'OPTION SELECT FLAT_PER_OPTION',
    'OPTION MULTISELECT FLAT_PER_OPTION',
    'OPTION BOOLEAN FLAT_PER_OPTION',
  ]);

  for (const role of roles) {
    for (const type of types) {
      for (const mode of modes) {
        const key = `${role} ${type} ${mode}`;
        it(`${key} ${allowed.has(key) ? 'sah' : 'ditolak'}`, () => {
          expect(isAllowedPricingCombination(role, type, mode)).toBe(allowed.has(key));
        });
      }
    }
  }

  it('kombinasi terlarang muncul sebagai galat pada pricing_mode', () => {
    expect(paths(checkAttributeDefinition(def({ pricing_mode: 'PER_UNIT' })))).toEqual(['pricing_mode']);
    expect(
      paths(checkAttributeDefinition(def({ attribute_role: 'SPEC', pricing_mode: 'FLAT_PER_OPTION' }))),
    ).toEqual(['pricing_mode']);
  });
});

describe('checkAttributeDefinition', () => {
  it('definisi yang sah tidak menghasilkan galat', () => {
    expect(checkAttributeDefinition(def())).toEqual([]);
  });

  it.each(['JenisKendaraan', 'jenis-kendaraan', '1jenis', 'jenis kendaraan', '', 'a'.repeat(51)])(
    'attribute_key %j bukan snake_case yang sah',
    (key) => {
      expect(paths(checkAttributeDefinition(def({ attribute_key: key })))).toContain('attribute_key');
    },
  );

  it('SELECT dan MULTISELECT wajib punya options', () => {
    expect(paths(checkAttributeDefinition(def({ options: null })))).toEqual(['options']);
    expect(paths(checkAttributeDefinition(def({ data_type: 'MULTISELECT', options: [] })))).toEqual(['options']);
  });

  it('options kembar ditolak, dan minimal satu harus aktif', () => {
    expect(paths(checkAttributeDefinition(def({ options: opts('SUV', 'SUV') })))).toEqual(['options']);
    expect(
      paths(checkAttributeDefinition(def({ options: [{ value: 'SUV', is_active: false }] }))),
    ).toEqual(['options']);
  });

  it('options dilarang untuk tipe selain SELECT dan MULTISELECT', () => {
    const number = def({ data_type: 'NUMBER', pricing_mode: 'PER_UNIT' });
    expect(paths(checkAttributeDefinition(number))).toEqual(['options']);
    expect(checkAttributeDefinition({ ...number, options: null })).toEqual([]);
  });

  it('validation_rule: min/max hanya NUMBER dan TEXT, regex hanya TEXT dan harus sah', () => {
    const number = def({ data_type: 'NUMBER', pricing_mode: 'PER_UNIT', options: null });
    expect(checkAttributeDefinition({ ...number, validation_rule: { min: 1, max: 20 } })).toEqual([]);
    expect(paths(checkAttributeDefinition({ ...number, validation_rule: { min: 5, max: 1 } }))).toEqual([
      'validation_rule',
    ]);
    expect(paths(checkAttributeDefinition({ ...number, validation_rule: { regex: '^a' } }))).toEqual([
      'validation_rule',
    ]);
    expect(paths(checkAttributeDefinition(def({ validation_rule: { min: 1 } })))).toEqual(['validation_rule']);

    const text = def({ data_type: 'TEXT', attribute_role: 'SPEC', pricing_mode: 'NONE', options: null });
    expect(checkAttributeDefinition({ ...text, validation_rule: { regex: '^[A-Z]{2}$' } })).toEqual([]);
    expect(paths(checkAttributeDefinition({ ...text, validation_rule: { regex: '([' } }))).toEqual([
      'validation_rule',
    ]);
  });
});

describe('validateAttributeValue', () => {
  it('SELECT hanya menerima option aktif', () => {
    const select = def({ options: [...opts('Sedan'), { value: 'Van', is_active: false }] });
    expect(validateAttributeValue(select, 'Sedan')).toBeNull();
    expect(validateAttributeValue(select, 'Van')).not.toBeNull();
    expect(validateAttributeValue(select, 'Truk')).not.toBeNull();
    expect(validateAttributeValue(select, ['Sedan'])).not.toBeNull();
  });

  it('MULTISELECT: daftar tidak kosong, tanpa kembar, seluruhnya option aktif', () => {
    const multi = def({ data_type: 'MULTISELECT', options: opts('Poles Body', 'Vacuum Interior') });
    expect(validateAttributeValue(multi, ['Poles Body', 'Vacuum Interior'])).toBeNull();
    expect(validateAttributeValue(multi, [])).not.toBeNull();
    expect(validateAttributeValue(multi, ['Poles Body', 'Poles Body'])).not.toBeNull();
    expect(validateAttributeValue(multi, ['Poles Body', 'Cuci Mesin'])).toContain('Cuci Mesin');
    expect(validateAttributeValue(multi, 'Poles Body')).not.toBeNull();
  });

  it('NUMBER: angka, batas min dan max inklusif', () => {
    const number = def({
      data_type: 'NUMBER',
      attribute_role: 'SPEC',
      pricing_mode: 'NONE',
      options: null,
      validation_rule: { min: 30, max: 180 },
    });
    expect(validateAttributeValue(number, 30)).toBeNull();
    expect(validateAttributeValue(number, 180)).toBeNull();
    expect(validateAttributeValue(number, 29)).not.toBeNull();
    expect(validateAttributeValue(number, 181)).not.toBeNull();
    expect(validateAttributeValue(number, '60')).not.toBeNull();
    expect(validateAttributeValue(number, Number.NaN)).not.toBeNull();
  });

  it('PER_UNIT wajib bilangan bulat: 2,5 unit AC ditolak, 3 diterima (usulan D baru)', () => {
    const perUnit = def({
      attribute_key: 'jumlah_unit',
      data_type: 'NUMBER',
      pricing_mode: 'PER_UNIT',
      options: null,
      validation_rule: { min: 1, max: 20 },
    });
    expect(validateAttributeValue(perUnit, 2.5)).toBe('harus bilangan bulat');
    expect(validateAttributeValue(perUnit, 3)).toBeNull();

    // SPEC NUMBER (NONE) tidak dikali harga, jadi pecahan tetap boleh.
    expect(
      validateAttributeValue({ ...perUnit, attribute_role: 'SPEC', pricing_mode: 'NONE' }, 2.5),
    ).toBeNull();
  });

  it('BOOLEAN, TEXT, dan DATE', () => {
    const bool = def({ data_type: 'BOOLEAN', options: null });
    expect(validateAttributeValue(bool, false)).toBeNull();
    expect(validateAttributeValue(bool, 'true')).not.toBeNull();

    const text = def({
      data_type: 'TEXT',
      attribute_role: 'SPEC',
      pricing_mode: 'NONE',
      options: null,
      validation_rule: { min: 2, max: 5, regex: '^[A-Z]+$' },
    });
    expect(validateAttributeValue(text, 'ABC')).toBeNull();
    expect(validateAttributeValue(text, 'abc')).not.toBeNull();
    expect(validateAttributeValue(text, 'A')).not.toBeNull();
    expect(validateAttributeValue(text, 'ABCDEF')).not.toBeNull();
    expect(validateAttributeValue(text, '   ')).not.toBeNull();

    const date = def({ data_type: 'DATE', attribute_role: 'SPEC', pricing_mode: 'NONE', options: null });
    expect(validateAttributeValue(date, '2026-10-20')).toBeNull();
    expect(validateAttributeValue(date, '2026-10-20T07:30:00.000Z')).toBeNull();
    expect(validateAttributeValue(date, '20-10-2026')).not.toBeNull();
    expect(validateAttributeValue(date, '2026-13-45')).not.toBeNull();
  });
});

describe('validateSpecAttributes: kontrak listings.attributes (PRD 3.2)', () => {
  const defs: AttributeDefinition[] = [
    def(), // OPTION, nilainya di listing_option_prices
    def({
      attribute_key: 'sumber_air',
      attribute_role: 'SPEC',
      pricing_mode: 'NONE',
      options: opts('Dibawa penyedia', 'Disediakan client'),
      is_required: true,
    }),
    def({
      attribute_key: 'durasi_estimasi',
      data_type: 'NUMBER',
      attribute_role: 'SPEC',
      pricing_mode: 'NONE',
      options: null,
      validation_rule: { min: 30, max: 180 },
      is_required: true,
    }),
    def({
      attribute_key: 'garansi_hari',
      data_type: 'NUMBER',
      attribute_role: 'SPEC',
      pricing_mode: 'NONE',
      options: null,
    }),
    def({
      attribute_key: 'atribut_lama',
      data_type: 'TEXT',
      attribute_role: 'SPEC',
      pricing_mode: 'NONE',
      options: null,
      is_required: true,
      is_active: false,
    }),
  ];

  it('record lengkap diterima, atribut opsional boleh kosong', () => {
    expect(validateSpecAttributes(defs, { sumber_air: 'Dibawa penyedia', durasi_estimasi: 60 })).toEqual([]);
  });

  it('atribut wajib yang kosong ditolak', () => {
    expect(paths(validateSpecAttributes(defs, { sumber_air: 'Dibawa penyedia' }))).toEqual([
      'attributes.durasi_estimasi',
    ]);
    expect(paths(validateSpecAttributes(defs, { sumber_air: null, durasi_estimasi: 60 }))).toEqual([
      'attributes.sumber_air',
    ]);
  });

  it('key tak dikenal dan key OPTION ditolak', () => {
    const errors = validateSpecAttributes(defs, {
      sumber_air: 'Dibawa penyedia',
      durasi_estimasi: 60,
      jenis_kendaraan: 'SUV',
      warna_mobil: 'Merah',
    });
    expect(paths(errors).sort()).toEqual(['attributes.jenis_kendaraan', 'attributes.warna_mobil']);
  });

  it('atribut nonaktif tidak lagi diwajibkan, dan nilainya tidak bisa ditulis ulang', () => {
    expect(paths(validateSpecAttributes(defs, { sumber_air: 'Dibawa penyedia', durasi_estimasi: 60 }))).toEqual([]);
    expect(
      paths(validateSpecAttributes(defs, { sumber_air: 'Dibawa penyedia', durasi_estimasi: 60, atribut_lama: 'x' })),
    ).toEqual(['attributes.atribut_lama']);
  });

  it('nilai di luar definisi ditolak dengan path atributnya', () => {
    expect(paths(validateSpecAttributes(defs, { sumber_air: 'Sumur', durasi_estimasi: 500 })).sort()).toEqual([
      'attributes.durasi_estimasi',
      'attributes.sumber_air',
    ]);
  });
});

describe('Lampiran B: katalog contoh (D71)', () => {
  interface SeedSubcategory {
    slug: string;
    suggested_price_min: number;
    suggested_price_max: number;
    attributes: AttributeDefinition[];
  }
  const subcategories: SeedSubcategory[] = CATALOG.flatMap(
    (category: { subcategories: SeedSubcategory[] }) => category.subcategories,
  );

  it('empat kategori dan dua belas sub-kategori', () => {
    expect(CATALOG.map((category: { slug: string }) => category.slug)).toEqual([
      'otomotif',
      'fotografi',
      'kecantikan',
      'perbaikan',
    ]);
    expect(subcategories).toHaveLength(12);
  });

  it('jumlah atribut per sub-kategori sesuai B.13', () => {
    const counts = Object.fromEntries(subcategories.map((sub) => [sub.slug, sub.attributes.length]));
    expect(counts).toEqual({
      'ganti-oli-panggilan': 2,
      'potong-rambut-panggilan': 3,
      'cuci-mobil-panggilan': 4,
      'servis-motor-panggilan': 4,
      'foto-produk': 4,
      'makeup-artist-acara': 5,
      'makeup-pengantin': 5,
      'tukang-listrik': 5,
      'servis-mesin-cuci': 5,
      'dokumentasi-acara': 6,
      'servis-ac': 6,
      'foto-prewedding': 7,
    });
  });

  it('seluruh definisi lolos aturan D72, setiap sub-kategori punya OPTION, rentang harga masuk akal', () => {
    for (const sub of subcategories) {
      for (const attribute of sub.attributes) {
        expect(checkAttributeDefinition(attribute), `${sub.slug}.${attribute.attribute_key}`).toEqual([]);
      }
      expect(sub.attributes.some((attribute) => attribute.attribute_role === 'OPTION'), sub.slug).toBe(true);
      expect(sub.suggested_price_min).toBeLessThan(sub.suggested_price_max);
    }
  });
});
