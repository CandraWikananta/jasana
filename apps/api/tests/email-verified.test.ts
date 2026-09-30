/**
 * Middleware requireEmailVerified (D62, PRD 5.2).
 *
 * Kriteria selesai Fase 1: "Middleware requireEmailVerified aktif."
 *
 * Tiga route yang memakainya (POST /orders, pengajuan provider, lamaran
 * pekerja) baru dibangun di Fase 2 dan 6. Jadi di sini middleware diuji
 * dipasang di rute uji, dengan rantai yang persis sama seperti nanti:
 * requireAuth lalu requireEmailVerified, lalu errorHandler sungguhan.
 *
 * Bagian kedua membuktikan sisi sebaliknya: route Fase 1 yang memang tidak
 * butuh verifikasi tetap terbuka untuk akun yang belum verifikasi.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import { prisma } from '@jasana/database';
import type { MailMessage } from '../src/lib/mailer';
import { createApp } from '../src/app';
import { requireAuth, requireEmailVerified } from '../src/middlewares/auth';
import { errorHandler } from '../src/middlewares/errorHandler';
import {
  bearer,
  captureEmails,
  hasTestDatabase,
  lastEmailTo,
  loginUser,
  registerUser,
  resetDatabase,
  tokenFrom,
  type TestUser,
} from './helpers/integration';

function guardedApp(): Express {
  const guarded = express();
  guarded.post('/aksi-terlindungi', requireAuth, requireEmailVerified, (_req, res) => {
    res.json({ success: true, data: { ok: true } });
  });
  guarded.use(errorHandler);
  return guarded;
}

describe.skipIf(!hasTestDatabase)('requireEmailVerified', () => {
  let app: Express;
  let sent: MailMessage[];
  let user: TestUser;
  let accessToken: string;

  beforeEach(async () => {
    await resetDatabase();
    vi.restoreAllMocks();
    sent = captureEmails().sent;
    app = createApp();
    user = await registerUser(app);
    accessToken = (await loginUser(app, user)).access_token;
  });

  it('menolak akun yang belum verifikasi dengan 403 EMAIL_NOT_VERIFIED', async () => {
    const response = await request(guardedApp())
      .post('/aksi-terlindungi')
      .set(...bearer(accessToken));

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('meloloskan akun setelah verifikasi, TANPA perlu access token baru', async () => {
    // Access token diterbitkan SEBELUM verifikasi. Middleware membaca basis
    // data, bukan klaim JWT, jadi user tidak perlu menunggu 15 menit.
    await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: tokenFrom(lastEmailTo(sent, user.email)) })
      .expect(200);

    const response = await request(guardedApp())
      .post('/aksi-terlindungi')
      .set(...bearer(accessToken));

    expect(response.status).toBe(200);
  });

  it('tanpa access token dibalas 401, bukan 403', async () => {
    const response = await request(guardedApp()).post('/aksi-terlindungi');
    expect(response.status).toBe(401);
  });

  it('akun yang dinonaktifkan dibalas 401 walau access token-nya masih berlaku', async () => {
    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: false, emailVerifiedAt: new Date() },
    });

    const response = await request(guardedApp())
      .post('/aksi-terlindungi')
      .set(...bearer(accessToken));
    expect(response.status).toBe(401);
  });

  it('route Fase 1 yang tidak butuh verifikasi tetap terbuka untuk akun belum verifikasi', async () => {
    const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(row.emailVerifiedAt).toBeNull();

    const calls = [
      request(app).get('/api/v1/auth/me').set(...bearer(accessToken)),
      request(app).get('/api/v1/auth/sessions').set(...bearer(accessToken)),
      request(app).get('/api/v1/users/me/addresses').set(...bearer(accessToken)),
      request(app)
        .post('/api/v1/users/me/addresses')
        .set(...bearer(accessToken))
        .send({ address_line: 'Jl. Sudirman No. 1', latitude: -8.65, longitude: 115.21 }),
      request(app)
        .patch('/api/v1/users/me')
        .set(...bearer(accessToken))
        .send({ full_name: 'Belum Verifikasi' }),
      // Justru ini yang paling penting terbuka: orang yang salah ketik email
      // saat mendaftar hanya bisa memperbaikinya lewat jalur ini.
      request(app)
        .patch('/api/v1/users/me/email')
        .set(...bearer(accessToken))
        .send({ new_email: 'perbaikan@jasana.test', current_password: user.password }),
    ];

    for (const response of await Promise.all(calls)) {
      expect(response.status, JSON.stringify(response.body)).toBeLessThan(300);
    }
  });
});
