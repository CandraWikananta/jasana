/**
 * Harga dan durasi order (jebakan 4, D67, D100, D103, H93) dan rumus bentrok
 * jadwal (H25, H89). Unit murni, tanpa basis data.
 */

import { describe, expect, it } from 'vitest';
import { Prisma } from '@jasana/database';
import { orderAmounts, priceOptions, type OptionDefinition, type OptionPriceRow } from '../src/modules/orders/order-pricing';
import { rangesOverlap } from '../src/modules/orders/order-schedule';

const def = (overrides: Partial<OptionDefinition>): OptionDefinition => ({
  attribute_key: 'x',
  label: 'X',
  data_type: 'SELECT',
  attribute_role: 'OPTION',
  pricing_mode: 'FLAT_PER_OPTION',
  options: null,
  validation_rule: null,
  is_required: false,
  is_active: true,
  is_filterable: false,
  ...overrides,
});

/** Mirip B.6: durasi liputan berdurasi, "Dua Hari" sudah nonaktif (D103). */
const DEFS: OptionDefinition[] = [
  def({
    attribute_key: 'durasi_liputan',
    label: 'Durasi liputan',
    is_required: true,
    options: [
      { value: '2 Jam', is_active: true, duration_minutes: 120 },
      { value: '8 Jam', is_active: true, duration_minutes: 480 },
      { value: 'Dua Hari', is_active: false },
    ],
  }),
  def({ attribute_key: 'tambahan', label: 'Tambahan', data_type: 'MULTISELECT', options: [{ value: 'Album', is_active: true }, { value: 'Drone', is_active: true }] }),
  def({ attribute_key: 'jumlah_orang', label: 'Jumlah orang', data_type: 'NUMBER', pricing_mode: 'PER_UNIT', validation_rule: { min: 1, max: 10 } }),
  def({ attribute_key: 'cetak', label: 'Cetak', data_type: 'BOOLEAN' }),
  def({ attribute_key: 'gaya', attribute_role: 'SPEC', pricing_mode: 'NONE', options: [{ value: 'Candid', is_active: true }] }),
];

const row = (attributeKey: string, optionValue: string | null, delta: number, isOffered = true): OptionPriceRow => ({
  attributeKey, optionValue, priceDelta: new Prisma.Decimal(delta), isOffered,
});

const PRICES = [
  row('durasi_liputan', '2 Jam', 0),
  row('durasi_liputan', '8 Jam', 500000),
  // D103: baris lama masih is_offered, tapi nilainya sudah nonaktif di taksonomi.
  row('durasi_liputan', 'Dua Hari', 900000),
  row('tambahan', 'Album', 150000),
  row('tambahan', 'Drone', 250000, false),
  row('jumlah_orang', null, 50000),
  row('cetak', null, 75000),
];

describe('priceOptions', () => {
  it('menjumlahkan delta per cara hitung dan mengambil durasi opsi (H93)', () => {
    const priced = priceOptions(DEFS, PRICES, { durasi_liputan: '8 Jam', tambahan: ['Album'], jumlah_orang: 3, cetak: true });
    expect(priced.optionsAmount.toNumber()).toBe(500000 + 150000 + 150000 + 75000);
    expect(priced.optionDurationMinutes).toBe(480);
    expect(priced.lines).toContainEqual({
      attribute_key: 'jumlah_orang', label: 'Jumlah orang', option_value: null, quantity: 3, unit_delta: 50000, amount: 150000,
    });
  });

  it('BOOLEAN false tidak menagih apa pun', () => {
    const priced = priceOptions(DEFS, PRICES, { durasi_liputan: '2 Jam', cetak: false });
    expect(priced.optionsAmount.toNumber()).toBe(0);
    expect(priced.lines).toHaveLength(1);
  });

  it('tanpa atribut berdurasi aktif, durasi jatuh ke listing (null di sini)', () => {
    const noTimed = DEFS.map((d) => (d.attribute_key === 'durasi_liputan' ? { ...d, is_active: false } : d));
    expect(priceOptions(noTimed, PRICES, {}).optionDurationMinutes).toBeNull();
  });

  it('menolak "Dua Hari" yang nonaktif walaupun barisnya masih is_offered (D67, D103)', () => {
    expect(() => priceOptions(DEFS, PRICES, { durasi_liputan: 'Dua Hari' })).toThrow(
      expect.objectContaining({ code: 'ATTRIBUTE_VALIDATION_FAILED' }),
    );
  });

  it('menolak opsi yang tidak dilayani penyedia', () => {
    expect(() => priceOptions(DEFS, PRICES, { durasi_liputan: '2 Jam', tambahan: ['Drone'] })).toThrow(
      expect.objectContaining({ code: 'OPTION_NOT_OFFERED' }),
    );
  });

  it('menolak atribut wajib kosong, key asing, dan atribut SPEC', () => {
    for (const selected of [{}, { durasi_liputan: '2 Jam', palsu: 1 }, { durasi_liputan: '2 Jam', gaya: 'Candid' }]) {
      expect(() => priceOptions(DEFS, PRICES, selected)).toThrow(expect.objectContaining({ code: 'ATTRIBUTE_VALIDATION_FAILED' }));
    }
  });
});

describe('orderAmounts', () => {
  it('komisi dibulatkan ke rupiah utuh dan earning = total - komisi', () => {
    const amounts = orderAmounts(new Prisma.Decimal(100005), new Prisma.Decimal(0), 10);
    expect(amounts.platformFee.toNumber()).toBe(10001);
    expect(amounts.providerEarning.toNumber()).toBe(90004);
  });
});

describe('rangesOverlap (H25)', () => {
  const at = (hhmm: string) => new Date(`2026-12-01T${hhmm}:00Z`);

  it('berdempetan persis dengan buffer 30 tetap bentrok', () => {
    // A 12.00 selama 2 jam (selesai 14.00), B mulai 14.00.
    expect(rangesOverlap(at('12:00'), 120, at('14:00'), 60, 30)).toBe(true);
  });

  it('hanya beririsan di buffer tetap bentrok', () => {
    expect(rangesOverlap(at('12:00'), 120, at('14:20'), 60, 30)).toBe(true);
  });

  it('lewat buffer tidak bentrok, dari kedua arah', () => {
    expect(rangesOverlap(at('12:00'), 120, at('14:30'), 60, 30)).toBe(false);
    expect(rangesOverlap(at('14:30'), 60, at('12:00'), 120, 30)).toBe(false);
  });

  it('buffer 0: berdempetan persis tidak bentrok (H89)', () => {
    expect(rangesOverlap(at('12:00'), 120, at('14:00'), 60, 0)).toBe(false);
    expect(rangesOverlap(at('12:00'), 120, at('13:59'), 60, 0)).toBe(true);
  });
});
