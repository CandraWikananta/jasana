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
  listing_faq_max_items: 10,
  orphan_upload_cleanup_hours: 24,
  schedule_conflict_buffer_minutes: 30,
} as const;

export type NumericSettingKey = keyof typeof NUMERIC_SETTING_DEFAULTS;

/**
 * H89. Kunci yang nol-nya bermakna (tanpa jeda). Kunci lain tetap wajib > 0:
 * misalnya `orphan_upload_cleanup_hours = 0` akan menghapus unggahan yang baru masuk.
 */
const ZERO_ALLOWED = new Set<NumericSettingKey>(['schedule_conflict_buffer_minutes']);

/** JSONB boleh berisi angka mentah atau string angka. */
function asValidNumber(value: unknown, allowZero: boolean): number | null {
  const parsed = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) return null;
  return parsed > 0 || (allowZero && parsed === 0) ? parsed : null;
}

export async function getNumberSetting(key: NumericSettingKey): Promise<number> {
  const row = await prisma.platformSetting.findUnique({ where: { key }, select: { value: true } });
  if (!row) return NUMERIC_SETTING_DEFAULTS[key];

  const value = asValidNumber(row.value, ZERO_ALLOWED.has(key));
  if (value === null) {
    logger.warn({ key, value: row.value }, 'Nilai platform_settings tidak sah, memakai default PRD');
    return NUMERIC_SETTING_DEFAULTS[key];
  }
  return value;
}
