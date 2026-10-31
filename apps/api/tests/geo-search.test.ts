/**
 * Fase 5, unit: bounding box (D6) dan validasi filter `attr[key]`.
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { boundingBox, EARTH_RADIUS_KM } from '../src/lib/haversine';
import { MAX_PAGE, paginationQuery, queryNumber } from '../src/lib/pagination';
import { parseAttributeFilters, type AttributeDefinition } from '../src/modules/catalog/attribute-rules';

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Titik tujuan sejauh `km` dari pusat pada arah `bearing` derajat (rumus bola). */
function destination(lat: number, lng: number, km: number, bearing: number): [number, number] {
  const d = km / EARTH_RADIUS_KM;
  const [φ1, λ1, θ] = [toRad(lat), toRad(lng), toRad(bearing)];
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(d) + Math.cos(φ1) * Math.sin(d) * Math.cos(θ));
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(d) * Math.cos(φ1), Math.cos(d) - Math.sin(φ1) * Math.sin(φ2));
  return [toDeg(φ2), toDeg(λ2)];
}

describe('boundingBox', () => {
  const inside = (box: ReturnType<typeof boundingBox>, [lat, lng]: [number, number]) =>
    lat >= box.minLat && lat <= box.maxLat && lng >= box.minLng && lng <= box.maxLng;

  it.each([
    ['Denpasar', -8.6725, 115.234],
    ['lintang tinggi', 60, 10],
  ])('memuat seluruh titik di lingkaran radius (%s)', (_name, lat, lng) => {
    for (const km of [0.5, 3, 15, 120]) {
      const box = boundingBox(lat, lng, km);
      for (let bearing = 0; bearing < 360; bearing += 5) {
        expect(inside(box, destination(lat, lng, km * 0.999999, bearing)), `${km} km arah ${bearing}`).toBe(true);
      }
    }
  });

  it('titik sedikit di luar radius pada sumbu lintang berada di luar kotak', () => {
    const box = boundingBox(-8.6725, 115.234, 10);
    expect(inside(box, destination(-8.6725, 115.234, 10.01, 0))).toBe(false);
    expect(inside(box, destination(-8.6725, 115.234, 10.01, 180))).toBe(false);
  });
});

describe('queryNumber dan paginationQuery', () => {
  const pagination = z.object(paginationQuery);

  it('string kosong dan spasi memakai default, bukan 0', () => {
    expect(pagination.parse({ page: '', limit: '  ' })).toEqual({ page: 1, limit: 20 });
    expect(pagination.parse({ page: '3', limit: '5' })).toEqual({ page: 3, limit: 5 });
  });

  it('opsional yang kosong jadi undefined, isian tidak sah tetap ditolak', () => {
    const lat = z.object({ lat: queryNumber(z.coerce.number().min(-90).max(90).optional()) });
    expect(lat.parse({ lat: '' })).toEqual({ lat: undefined });
    expect(lat.parse({ lat: '0' })).toEqual({ lat: 0 });
    expect(lat.safeParse({ lat: 'abc' }).success).toBe(false);
    expect(pagination.safeParse({ page: '0' }).success).toBe(false);
  });

  it('page dibatasi MAX_PAGE supaya OFFSET tidak meluap', () => {
    expect(pagination.parse({ page: String(MAX_PAGE) }).page).toBe(MAX_PAGE);
    expect(pagination.safeParse({ page: String(MAX_PAGE + 1) }).success).toBe(false);
    expect(pagination.safeParse({ page: '1e300' }).success).toBe(false);
  });
});

describe('parseAttributeFilters', () => {
  const opts = (...values: string[]) => values.map((value) => ({ value, is_active: true }));
  const defs: AttributeDefinition[] = [
    { attribute_key: 'sumber_air', data_type: 'SELECT', attribute_role: 'SPEC', pricing_mode: 'NONE', options: opts('Dibawa', 'Client'), is_filterable: true },
    { attribute_key: 'merek', data_type: 'MULTISELECT', attribute_role: 'SPEC', pricing_mode: 'NONE', options: opts('Daikin', 'LG'), is_filterable: true },
    { attribute_key: 'kapasitas', data_type: 'NUMBER', attribute_role: 'SPEC', pricing_mode: 'NONE', validation_rule: { min: 1, max: 10 }, is_filterable: true },
    { attribute_key: 'catatan', data_type: 'TEXT', attribute_role: 'SPEC', pricing_mode: 'NONE', is_filterable: false },
    { attribute_key: 'lama', data_type: 'SELECT', attribute_role: 'SPEC', pricing_mode: 'NONE', options: opts('A'), is_filterable: true, is_active: false },
    { attribute_key: 'jenis', data_type: 'SELECT', attribute_role: 'OPTION', pricing_mode: 'FLAT_PER_OPTION', options: [...opts('Sedan'), { value: 'Bus', is_active: false }], is_filterable: true },
    { attribute_key: 'malam', data_type: 'BOOLEAN', attribute_role: 'OPTION', pricing_mode: 'FLAT_PER_OPTION', is_filterable: true },
  ];

  it('memisahkan SPEC dan OPTION beserta koersinya', () => {
    const { filters, errors } = parseAttributeFilters(defs, {
      sumber_air: 'Dibawa',
      merek: 'LG',
      kapasitas: '2',
      jenis: 'Sedan',
      malam: 'false',
    });
    expect(errors).toEqual([]);
    expect(filters.spec).toEqual({ sumber_air: 'Dibawa', merek: ['LG'], kapasitas: 2 });
    expect(filters.options).toEqual([
      { attribute_key: 'jenis', option_value: 'Sedan', offered: true },
      { attribute_key: 'malam', option_value: null, offered: false },
    ]);
  });

  it.each([
    ['tidak dikenal', { warna: 'Merah' }],
    ['tidak filterable', { catatan: 'x' }],
    ['atribut nonaktif', { lama: 'A' }],
    ['option nonaktif', { jenis: 'Bus' }],
    ['bukan pilihan', { sumber_air: 'Sungai' }],
    ['boolean tidak sah', { malam: 'ya' }],
    ['angka tidak sah', { kapasitas: 'dua' }],
    ['angka di luar aturan', { kapasitas: '11' }],
  ])('menolak %s', (_name, attr) => {
    const { errors } = parseAttributeFilters(defs, attr);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.path).toBe(`attr.${Object.keys(attr)[0]}`);
  });
});
