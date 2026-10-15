/**
 * Pembaca `platform_settings` (PRD Bagian 3.5).
 *
 * Nilai dibaca ulang setiap kali dibutuhkan, tidak di-cache, supaya
 * perubahan saat eksperimen langsung berlaku tanpa restart. Kueri ini satu
 * baris lewat primary key, jadi murah.
 *
 * Kalau barisnya belum diseed atau isinya bukan angka, dipakai nilai
 * default PRD. Aplikasi tidak boleh berhenti bekerja hanya karena seed
 * parameter belum dijalankan.
 */

import { prisma } from '@jasana/database';
import { logger } from '../../lib/logger';

/** Nilai default PRD 3.5 untuk parameter yang sudah dipakai kode. */
export const NUMERIC_SETTING_DEFAULTS = {
  kyc_document_max_size_mb: 5,
  dispute_evidence_max_size_mb: 5,
} as const;

export type NumericSettingKey = keyof typeof NUMERIC_SETTING_DEFAULTS;

/** JSONB boleh berisi angka mentah atau string angka. */
function asPositiveNumber(value: unknown): number | null {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function getNumberSetting(key: NumericSettingKey): Promise<number> {
  const row = await prisma.platformSetting.findUnique({ where: { key }, select: { value: true } });
  if (!row) return NUMERIC_SETTING_DEFAULTS[key];

  const value = asPositiveNumber(row.value);
  if (value === null) {
    logger.warn({ key, value: row.value }, 'Nilai platform_settings tidak sah, memakai default PRD');
    return NUMERIC_SETTING_DEFAULTS[key];
  }
  return value;
}
