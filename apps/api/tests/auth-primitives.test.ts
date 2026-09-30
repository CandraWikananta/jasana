/**
 * Unit test primitif autentikasi, tanpa basis data.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { generateToken, hashPassword, hashToken, verifyPassword } from '../src/lib/crypto';
import { signAccessToken, verifyAccessToken, type AccessTokenClaims } from '../src/lib/jwt';
import { loginSchema, passwordField, phoneField } from '../src/modules/auth/auth.schema';

const claims: AccessTokenClaims = {
  user_id: '0b8f3a52-5a52-4a53-9c3f-5d1b8c0e2f11',
  role: 'CLIENT',
  provider_profile_id: null,
  worker_id: null,
};

afterEach(() => {
  vi.useRealTimers();
});

describe('token acak dan hash', () => {
  it('token 32 byte ditulis 64 hex, dan tidak pernah sama', () => {
    const tokens = new Set(Array.from({ length: 100 }, generateToken));
    expect(tokens.size).toBe(100);
    for (const token of tokens) expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashToken adalah SHA-256 deterministik, jadi bisa dicari lewat index unique', () => {
    expect(hashToken('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    expect(hashToken('abc')).toBe(hashToken('abc'));
  });

  it('password di-hash bcrypt cost 10', async () => {
    const hash = await hashPassword('rahasia-123');
    expect(hash).toMatch(/^\$2[aby]\$10\$/);
    expect(await verifyPassword('rahasia-123', hash)).toBe(true);
    expect(await verifyPassword('rahasia-124', hash)).toBe(false);
  });
});

describe('access token JWT', () => {
  it('berlaku 15 menit dan memuat klaim peran dari relasi', () => {
    const token = signAccessToken(claims);
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    expect(decoded.exp! - decoded.iat!).toBe(15 * 60);
    expect(verifyAccessToken(token)).toEqual(claims);
  });

  it('ditolak setelah kedaluwarsa', () => {
    vi.useFakeTimers();
    const token = signAccessToken(claims);
    vi.advanceTimersByTime(15 * 60 * 1000 + 1000);
    expect(verifyAccessToken(token)).toBeNull();
  });

  it('ditolak kalau ditandatangani secret lain', () => {
    const forged = jwt.sign(claims, 'secret-lain-yang-juga-panjangnya-32-karakter-lebih');
    expect(verifyAccessToken(forged)).toBeNull();
  });

  it('menolak alg none', () => {
    const unsigned = jwt.sign({ ...claims, role: 'ADMIN' }, '', { algorithm: 'none' });
    expect(verifyAccessToken(unsigned)).toBeNull();
  });
});

describe('field skema', () => {
  it('menormalkan nomor ponsel ke +628...', () => {
    for (const input of ['081234567890', '6281234567890', '+62 812-3456-7890']) {
      expect(phoneField.parse(input)).toBe('+6281234567890');
    }
    expect(phoneField.safeParse('0212345678').success).toBe(false);
  });

  it('password maksimal 72 byte, batas yang benar-benar dibaca bcrypt', () => {
    expect(passwordField.safeParse('a'.repeat(72)).success).toBe(true);
    expect(passwordField.safeParse('a'.repeat(73)).success).toBe(false);
    // 25 karakter tiga byte = 75 byte, lewat walau cuma 25 karakter.
    expect(passwordField.safeParse('€'.repeat(25)).success).toBe(false);
  });

  it('login wajib tepat satu dari email atau phone', () => {
    expect(loginSchema.safeParse({ password: 'x' }).success).toBe(false);
    expect(
      loginSchema.safeParse({ email: 'a@b.co', phone: '081234567890', password: 'x' }).success,
    ).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
  });
});
