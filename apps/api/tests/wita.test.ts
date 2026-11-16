/**
 * Waktu WITA untuk manusia dan tanggal nomor order (perbaikan uji sandbox 10a, D154).
 */

import { describe, expect, it } from 'vitest';
import { formatWita, witaDateKey } from '../src/lib/wita';
import { newOrderNumber } from '../src/modules/orders/orders.service';

describe('formatWita', () => {
  it('menggeser ke UTC+8 dan melintasi tengah malam', () => {
    expect(formatWita(new Date('2026-11-16T16:24:03.779Z'))).toBe('17 Nov 2026 pukul 00.24 WITA');
    expect(formatWita(new Date('2026-11-17T16:24:03.779Z'))).toBe('18 Nov 2026 pukul 00.24 WITA');
  });

  it('lintas bulan dan tahun, nama bulan Indonesia, jam dan menit dua digit', () => {
    expect(formatWita(new Date('2026-12-31T16:05:00Z'))).toBe('1 Jan 2027 pukul 00.05 WITA');
    expect(formatWita(new Date('2026-05-31T23:00:00Z'))).toBe('1 Jun 2026 pukul 07.00 WITA');
    expect(formatWita(new Date('2026-08-10T01:09:00Z'))).toBe('10 Agu 2026 pukul 09.09 WITA');
    expect(formatWita(new Date('2026-10-10T15:59:00Z'))).toBe('10 Okt 2026 pukul 23.59 WITA');
  });
});

describe('nomor order', () => {
  it('tanggalnya hari kalender WITA, bukan UTC', () => {
    expect(witaDateKey(new Date('2026-11-16T15:59:59Z'))).toBe('20261116');
    expect(witaDateKey(new Date('2026-11-16T16:00:00Z'))).toBe('20261117');
    expect(newOrderNumber(new Date('2026-11-16T16:24:00Z'))).toMatch(/^ORD-20261117-[0-9A-F]{8}$/);
  });
});
