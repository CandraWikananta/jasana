/**
 * Harga dan durasi order dari pilihan client (PRD 4.4 langkah 2 sampai 4).
 *
 * Fungsi murni, tanpa basis data. Request tidak pernah memuat nominal
 * (jebakan 4): yang masuk hanya pilihan opsi, angka seluruhnya dari
 * `listing_option_prices` milik listing itu.
 */

import { Prisma } from '@jasana/database';
import type { ErrorDetail } from '@jasana/shared';
import { AppError } from '../../lib/errors';
import { isEmptyValue, isTimed, validateAttributeValue, type AttributeDefinition } from '../catalog/attribute-rules';

export type OptionDefinition = Required<AttributeDefinition> & { label: string };

export interface OptionPriceRow {
  attributeKey: string;
  optionValue: string | null;
  priceDelta: Prisma.Decimal;
  isOffered: boolean;
}

/** Satu baris rincian, sekaligus isi `snapshot_selected_options` (D73). */
export interface PricedLine {
  attribute_key: string;
  label: string;
  option_value: string | null;
  quantity: number;
  unit_delta: number;
  amount: number;
}

export interface PricedOptions {
  lines: PricedLine[];
  optionsAmount: Prisma.Decimal;
  /** D100: dari opsi berdurasi kalau ada, selain itu `null` (pakai durasi listing). */
  optionDurationMinutes: number | null;
}

export function priceOptions(
  defs: OptionDefinition[],
  prices: OptionPriceRow[],
  selected: Record<string, unknown>,
): PricedOptions {
  const optionDefs = new Map(
    defs.filter((def) => def.attribute_role === 'OPTION' && def.is_active).map((def) => [def.attribute_key, def]),
  );
  const invalid: ErrorDetail[] = [];
  const notOffered: ErrorDetail[] = [];
  const lines: PricedLine[] = [];
  let optionDurationMinutes: number | null = null;

  for (const key of Object.keys(selected)) {
    if (!optionDefs.has(key)) invalid.push({ path: `selected_options.${key}`, message: `${key} bukan opsi aktif sub-kategori ini` });
  }

  for (const [key, def] of optionDefs) {
    const path = `selected_options.${key}`;
    const value = selected[key];
    if (isEmptyValue(value)) {
      if (def.is_required) invalid.push({ path, message: `${key} wajib dipilih` });
      continue;
    }
    // Menolak nilai SELECT nonaktif walaupun barisnya masih is_offered (D67, D103).
    const message = validateAttributeValue(def, value);
    if (message) {
      invalid.push({ path, message: `${key} ${message}` });
      continue;
    }

    const charge = (optionValue: string | null, quantity: number) => {
      const row = prices.find((p) => p.attributeKey === key && p.optionValue === optionValue && p.isOffered);
      if (!row) {
        notOffered.push({ path, message: `${optionValue ?? key} tidak dilayani penyedia ini` });
        return;
      }
      const unit = row.priceDelta.toNumber();
      lines.push({ attribute_key: key, label: def.label, option_value: optionValue, quantity, unit_delta: unit, amount: unit * quantity });
    };

    if (def.data_type === 'SELECT') charge(value as string, 1);
    else if (def.data_type === 'MULTISELECT') (value as string[]).forEach((item) => charge(item, 1));
    else if (def.data_type === 'BOOLEAN') { if (value === true) charge(null, 1); }
    else if (def.data_type === 'NUMBER') charge(null, value as number);

    if (isTimed(def) && def.data_type === 'SELECT') {
      optionDurationMinutes = def.options?.find((option) => option.value === value)?.duration_minutes ?? null;
    }
  }

  if (invalid.length > 0) {
    throw new AppError('ATTRIBUTE_VALIDATION_FAILED', 'Pilihan opsi tidak sesuai definisi sub-kategori', { details: invalid });
  }
  if (notOffered.length > 0) {
    throw new AppError('OPTION_NOT_OFFERED', 'Ada opsi yang tidak dilayani penyedia ini', { details: notOffered });
  }

  const optionsAmount = lines.reduce((sum, line) => sum.add(line.amount), new Prisma.Decimal(0));
  return { lines, optionsAmount, optionDurationMinutes };
}

/** PRD 4.4 langkah 3. Komisi dibulatkan ke rupiah utuh, setengah ke atas. */
export function orderAmounts(listingBaseAmount: Prisma.Decimal, optionsAmount: Prisma.Decimal, feePercentage: number) {
  const totalAmount = listingBaseAmount.add(optionsAmount);
  const platformFee = totalAmount.mul(feePercentage).div(100).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
  return { listingBaseAmount, optionsAmount, totalAmount, platformFee, providerEarning: totalAmount.sub(platformFee) };
}
