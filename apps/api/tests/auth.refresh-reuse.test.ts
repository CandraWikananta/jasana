/**
 * Rotasi refresh token dan DETEKSI PEMAKAIAN ULANG (D76, H64).
 *
 * Kriteria selesai Fase 1 (PRD Bagian 9): "Rotasi terbukti mencabut
 * `family_id` saat token lama dipakai ulang."
 *
 * Skenario yang diuji adalah pencurian token: penyerang menyalin refresh
 * token korban, korban terus memakai aplikasinya (token dirotasi beberapa
 * kali), lalu penyerang mencoba salinannya yang sudah basi. Server tidak
 * bisa tahu mana yang pemilik asli, jadi SELURUH rantai sesi itu harus mati,
 * termasuk token terbaru yang sedang dipegang korban.
 *
 * Semua lewat HTTP sungguhan ke basis data sungguhan, bukan mock, karena
 * yang diklaim adalah perilaku transaksi dan UPDATE bersyarat.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { hashToken } from '../src/lib/crypto';
import {
  bearer,
  captureEmails,
  hasTestDatabase,
  loginUser,
  refreshWith,
  registerUser,
  resetDatabase,
  type TestUser,
} from './helpers/integration';

describe.skipIf(!hasTestDatabase)('refresh token: rotasi dan deteksi pemakaian ulang', () => {
  let app: Express;
  let user: TestUser;

  beforeEach(async () => {
    await resetDatabase();
    vi.restoreAllMocks();
    captureEmails();
    app = createApp();
    user = await registerUser(app);
  });

  it('rotasi: token lama dicabut, pengganti di family yang sama, tertaut lewat replaced_by', async () => {
    const login = await loginUser(app, user);

    const response = await refreshWith(app, login.refresh_token);
    expect(response.status).toBe(200);
    const rotated = response.body.data.refresh_token as string;
    expect(rotated).not.toBe(login.refresh_token);
    expect(response.body.data.access_token).toEqual(expect.any(String));

    const oldRow = await prisma.refreshToken.findUniqueOrThrow({
      where: { tokenHash: hashToken(login.refresh_token) },
    });
    const newRow = await prisma.refreshToken.findUniqueOrThrow({
      where: { tokenHash: hashToken(rotated) },
    });

    expect(oldRow.revokedAt).not.toBeNull();
    expect(oldRow.replacedBy).toBe(newRow.id);
    expect(newRow.familyId).toBe(oldRow.familyId);
    expect(newRow.revokedAt).toBeNull();
  });

  it('token disimpan sebagai hash SHA-256, token mentah tidak ada di basis data', async () => {
    const login = await loginUser(app, user);

    const rows = await prisma.refreshToken.findMany({ where: { userId: user.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.tokenHash).toBe(hashToken(login.refresh_token));
    expect(rows[0]!.tokenHash).not.toBe(login.refresh_token);

    // Cari token mentah di SELURUH kolom teks tabel itu, bukan hanya
    // token_hash, supaya kebocoran ke kolom lain pun tertangkap.
    const leaked = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT count(*) AS n FROM refresh_tokens t
      WHERE t::text LIKE ${'%' + login.refresh_token + '%'}`;
    expect(Number(leaked[0]!.n)).toBe(0);
  });

  it('PEMAKAIAN ULANG token yang sudah dirotasi mematikan SELURUH rantai sesi', async () => {
    // Korban login. Penyerang diam-diam menyalin refresh token pertama.
    const login = await loginUser(app, user, 'browser-korban');
    const stolen = login.refresh_token;

    // Korban terus memakai aplikasi: dua kali rotasi. t0 -> t1 -> t2.
    const r1 = await refreshWith(app, stolen);
    expect(r1.status).toBe(200);
    const t1 = r1.body.data.refresh_token as string;

    const r2 = await refreshWith(app, t1);
    expect(r2.status).toBe(200);
    const t2 = r2.body.data.refresh_token as string;

    // Sesi lain milik user yang sama di perangkat berbeda (family berbeda).
    // Ini pembanding: pencabutan harus sebatas family, bukan seluruh akun.
    const otherDevice = await loginUser(app, user, 'ponsel-korban');

    const familyId = (
      await prisma.refreshToken.findUniqueOrThrow({ where: { tokenHash: hashToken(stolen) } })
    ).familyId;
    expect(await prisma.refreshToken.count({ where: { familyId } })).toBe(3);

    // --- Penyerang memakai salinan yang sudah basi ---
    const attack = await refreshWith(app, stolen);
    expect(attack.status).toBe(401);
    expect(attack.body.success).toBe(false);
    expect(attack.body.error.code).toBe('UNAUTHORIZED');
    // Penyerang TIDAK mendapat token apa pun.
    expect(attack.body.data).toBeUndefined();

    // --- Seluruh rantai mati, termasuk token terbaru milik korban ---
    const victimNext = await refreshWith(app, t2);
    expect(victimNext.status).toBe(401);

    // Masih tiga baris: tidak ada token baru yang sempat diterbitkan ke
    // penyerang maupun ke korban, dan ketiganya dicabut.
    const family = await prisma.refreshToken.findMany({ where: { familyId } });
    expect(family).toHaveLength(3);
    expect(family.every((row) => row.revokedAt !== null)).toBe(true);

    // --- Family lain milik user yang sama tetap hidup ---
    const otherRow = await prisma.refreshToken.findUniqueOrThrow({
      where: { tokenHash: hashToken(otherDevice.refresh_token) },
    });
    expect(otherRow.revokedAt).toBeNull();
    expect(otherRow.familyId).not.toBe(familyId);

    const otherRefresh = await refreshWith(app, otherDevice.refresh_token, 'ponsel-korban');
    expect(otherRefresh.status).toBe(200);

    // Daftar perangkat hanya menyisakan perangkat yang tidak tersentuh.
    const sessions = await request(app)
      .get('/api/v1/auth/sessions')
      .set(...bearer(otherRefresh.body.data.access_token));
    expect(sessions.status).toBe(200);
    expect(sessions.body.data).toHaveLength(1);
    expect(sessions.body.data[0].session_id).toBe(otherRow.familyId);
    expect(sessions.body.data[0].user_agent).toBe('ponsel-korban');
  });

  it('token di tengah rantai yang dipakai ulang juga mematikan rantai', async () => {
    const login = await loginUser(app, user);
    const t1 = (await refreshWith(app, login.refresh_token)).body.data.refresh_token as string;
    const t2 = (await refreshWith(app, t1)).body.data.refresh_token as string;
    const t3 = (await refreshWith(app, t2)).body.data.refresh_token as string;

    expect((await refreshWith(app, t1)).status).toBe(401);
    expect((await refreshWith(app, t3)).status).toBe(401);

    const live = await prisma.refreshToken.count({ where: { userId: user.id, revokedAt: null } });
    expect(live).toBe(0);
  });

  it('pemakaian ulang yang BERSAMAAN pun terdeteksi: satu menang, lalu rantai dicabut', async () => {
    // Pola baca-lalu-cek akan meloloskan keduanya. UPDATE bersyarat hanya
    // meloloskan satu, dan yang kedua dibaca sebagai pemakaian ulang.
    const login = await loginUser(app, user);

    const [a, b] = await Promise.all([
      refreshWith(app, login.refresh_token),
      refreshWith(app, login.refresh_token),
    ]);

    expect([a.status, b.status].sort()).toEqual([200, 401]);

    const winner = (a.status === 200 ? a : b).body.data.refresh_token as string;
    expect((await refreshWith(app, winner)).status).toBe(401);
    expect(await prisma.refreshToken.count({ where: { userId: user.id, revokedAt: null } })).toBe(0);
  });

  it('token kedaluwarsa ditolak tanpa menerbitkan pengganti', async () => {
    const login = await loginUser(app, user);
    const past = new Date(Date.now() - 60 * 60 * 1000);
    await prisma.refreshToken.update({
      where: { tokenHash: hashToken(login.refresh_token) },
      // CHECK expires_at > created_at tetap harus terpenuhi.
      data: { createdAt: new Date(past.getTime() - 60_000), expiresAt: past },
    });

    const response = await refreshWith(app, login.refresh_token);
    expect(response.status).toBe(401);
    expect(await prisma.refreshToken.count({ where: { userId: user.id } })).toBe(1);
  });

  it('token yang tidak dikenal dibalas 401', async () => {
    const response = await refreshWith(app, 'a'.repeat(64));
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('logout mencabut satu perangkat, logout-all mencabut semuanya', async () => {
    const laptop = await loginUser(app, user, 'laptop');
    const phone = await loginUser(app, user, 'ponsel');
    const tablet = await loginUser(app, user, 'tablet');

    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .set(...bearer(laptop.access_token))
      .send({ refresh_token: laptop.refresh_token });
    expect(logout.status).toBe(200);
    expect(logout.body.data.revoked).toBe(true);

    expect((await refreshWith(app, laptop.refresh_token)).status).toBe(401);
    const phoneRefreshed = await refreshWith(app, phone.refresh_token);
    expect(phoneRefreshed.status).toBe(200);

    const logoutAll = await request(app)
      .post('/api/v1/auth/logout-all')
      .set(...bearer(tablet.access_token));
    expect(logoutAll.status).toBe(200);
    expect(logoutAll.body.data.revoked_count).toBe(2);

    expect((await refreshWith(app, phoneRefreshed.body.data.refresh_token)).status).toBe(401);
    expect((await refreshWith(app, tablet.refresh_token)).status).toBe(401);
  });

  it('logout tidak bisa mencabut refresh token milik user lain', async () => {
    const other = await registerUser(app);
    const mine = await loginUser(app, user);
    const theirs = await loginUser(app, other);

    await request(app)
      .post('/api/v1/auth/logout')
      .set(...bearer(mine.access_token))
      .send({ refresh_token: theirs.refresh_token })
      .expect(200);

    expect((await refreshWith(app, theirs.refresh_token)).status).toBe(200);
  });
});
