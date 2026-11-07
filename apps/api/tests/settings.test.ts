/**
 * H89: getNumberSetting menerima 0 hanya untuk kunci yang nol-nya bermakna.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@jasana/database';
import { getNumberSetting } from '../src/modules/settings/settings.service';
import { hasTestDatabase, resetDatabase } from './helpers/integration';

describe.skipIf(!hasTestDatabase)('getNumberSetting', () => {
  const set = (key: string, value: unknown) =>
    prisma.platformSetting.upsert({ where: { key }, create: { key, value: value as never }, update: { value: value as never } });

  beforeEach(resetDatabase);

  it('schedule_conflict_buffer_minutes boleh 0', async () => {
    await set('schedule_conflict_buffer_minutes', 0);
    expect(await getNumberSetting('schedule_conflict_buffer_minutes')).toBe(0);
  });

  it('kunci lain yang bernilai 0, negatif, atau string kosong jatuh ke default', async () => {
    await set('kyc_document_max_size_mb', 0);
    expect(await getNumberSetting('kyc_document_max_size_mb')).toBe(5);
    await set('schedule_conflict_buffer_minutes', -5);
    expect(await getNumberSetting('schedule_conflict_buffer_minutes')).toBe(30);
    // Number('') bernilai 0, jadi string kosong tidak boleh lolos sebagai nol.
    await set('schedule_conflict_buffer_minutes', '');
    expect(await getNumberSetting('schedule_conflict_buffer_minutes')).toBe(30);
  });

  it('tanpa baris memakai default PRD', async () => {
    expect(await getNumberSetting('schedule_conflict_buffer_minutes')).toBe(30);
  });
});
