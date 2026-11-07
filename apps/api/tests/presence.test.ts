/**
 * Pelacak pekerja online (D65, D99, H40). Unit murni dengan jam palsu.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { presence } from '../src/realtime/presence';

const TIMEOUT = 10;
const MINUTE = 60_000;

describe('presence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-08T08:00:00Z'));
    presence.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('online selama terhubung, berapa lama pun', () => {
    presence.connect('w1');
    vi.advanceTimersByTime(60 * MINUTE);
    expect(presence.onlineWorkerIds(TIMEOUT)).toEqual(['w1']);
    expect(presence.isStale('w1', TIMEOUT)).toBe(false);
  });

  it('putus sesaat masih online dalam toleransi, lalu basi', () => {
    presence.connect('w1');
    presence.disconnect('w1');
    vi.advanceTimersByTime((TIMEOUT - 1) * MINUTE);
    expect(presence.onlineWorkerIds(TIMEOUT)).toEqual(['w1']);
    vi.advanceTimersByTime(MINUTE);
    expect(presence.onlineWorkerIds(TIMEOUT)).toEqual([]);
    expect(presence.isStale('w1', TIMEOUT)).toBe(true);
  });

  it('dua tab: menutup satu tab tidak membuat pekerja offline', () => {
    presence.connect('w1');
    presence.connect('w1');
    presence.disconnect('w1');
    vi.advanceTimersByTime(60 * MINUTE);
    expect(presence.onlineWorkerIds(TIMEOUT)).toEqual(['w1']);
  });

  it('denyut tanpa koneksi (H92) kedaluwarsa per toleransi', () => {
    presence.touch('w1');
    expect(presence.onlineWorkerIds(TIMEOUT)).toEqual(['w1']);
    vi.advanceTimersByTime(TIMEOUT * MINUTE);
    expect(presence.onlineWorkerIds(TIMEOUT)).toEqual([]);
  });

  it('pekerja yang belum pernah terlihat diberi tenggang sejak proses mulai', () => {
    expect(presence.onlineWorkerIds(TIMEOUT)).toEqual([]);
    expect(presence.isStale('baru', TIMEOUT)).toBe(false);
    vi.advanceTimersByTime(TIMEOUT * MINUTE);
    expect(presence.isStale('baru', TIMEOUT)).toBe(true);
  });
});
