/**
 * Alur akun Fase 1: registrasi, login, verifikasi email, lupa dan reset
 * password, beserta rate limit PRD 5.5.
 *
 * Rotasi refresh token diuji terpisah di auth.refresh-reuse.test.ts.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '@jasana/database';
import type { MailMessage } from '../src/lib/mailer';
import { createApp } from '../src/app';
import { hashToken } from '../src/lib/crypto';
import {
  bearer,
  captureEmails,
  hasTestDatabase,
  lastEmailTo,
  loginUser,
  newUserInput,
  refreshWith,
  registerUser,
  resetDatabase,
  tokenFrom,
} from './helpers/integration';

describe.skipIf(!hasTestDatabase)('alur akun', () => {
  let app: Express;
  let sent: MailMessage[];

  beforeEach(async () => {
    await resetDatabase();
    vi.restoreAllMocks();
    sent = captureEmails().sent;
    // App baru per kasus = store rate limit baru per kasus.
    app = createApp();
  });

  // -------------------------------------------------------------------------
  describe('POST /auth/register', () => {
    it('membuat akun belum terverifikasi dan mengirim tautan verifikasi', async () => {
      const input = newUserInput({ email: 'Budi.Santoso@Jasana.test' });
      const response = await request(app).post('/api/v1/auth/register').send(input);

      expect(response.status).toBe(201);
      const user = response.body.data.user;
      expect(user.email).toBe('budi.santoso@jasana.test');
      expect(user.email_verified).toBe(false);
      expect(user.role).toBe('CLIENT');
      expect(user.phone).toMatch(/^\+628\d+$/);
      expect(JSON.stringify(response.body)).not.toMatch(/password/i);

      const email = lastEmailTo(sent, 'budi.santoso@jasana.test');
      const token = tokenFrom(email);

      const stored = await prisma.verificationToken.findMany({ where: { userId: user.id } });
      expect(stored).toHaveLength(1);
      expect(stored[0]!.purpose).toBe('EMAIL_VERIFICATION');
      expect(stored[0]!.tokenHash).toBe(hashToken(token));

      // Baris notifikasi tercatat, isinya tidak memuat token mentah, dan
      // statusnya jadi SENT setelah pengiriman di luar transaksi selesai.
      await vi.waitFor(async () => {
        const notification = await prisma.notification.findFirstOrThrow({
          where: { userId: user.id },
        });
        expect(notification.channel).toBe('EMAIL');
        expect(notification.emailStatus).toBe('SENT');
        expect(`${notification.title} ${notification.body}`).not.toContain(token);
      });
    });

    it('mengabaikan field yang tidak boleh diisi client, seperti role dan email_verified_at', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...newUserInput(), role: 'ADMIN', email_verified_at: new Date().toISOString() });

      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe('CLIENT');
      expect(response.body.data.user.email_verified).toBe(false);
    });

    it('menolak email yang sudah terdaftar tanpa peduli huruf besar kecil', async () => {
      await registerUser(app, { email: 'sama@jasana.test' });
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(newUserInput({ email: 'SAMA@jasana.test' }));

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details[0].path).toBe('email');
    });

    it('menolak nomor ponsel yang sama walau ditulis dengan format berbeda', async () => {
      await registerUser(app, { phone: '081234567890' });
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(newUserInput({ phone: '+62 812-3456-7890' }));

      expect(response.status).toBe(422);
      expect(response.body.error.details[0].path).toBe('phone');
    });

    it('menolak password yang terlalu pendek', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(newUserInput({ password: 'pendek' }));

      expect(response.status).toBe(422);
      expect(response.body.error.details[0].path).toBe('password');
    });
  });

  // -------------------------------------------------------------------------
  describe('POST /auth/login dan GET /auth/me', () => {
    it('user yang BELUM verifikasi tetap boleh login (D62)', async () => {
      const user = await registerUser(app);
      const tokens = await loginUser(app, user);

      const me = await request(app).get('/api/v1/auth/me').set(...bearer(tokens.access_token));
      expect(me.status).toBe(200);
      expect(me.body.data).toMatchObject({
        id: user.id,
        email_verified: false,
        provider: null,
        worker: null,
      });
    });

    it('bisa login memakai nomor ponsel', async () => {
      const user = await registerUser(app, { phone: '081298765432' });
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: '0812-9876-5432', password: user.password });

      expect(response.status).toBe(200);
      expect(response.body.data.user.id).toBe(user.id);
    });

    it('password salah dan email tak terdaftar dibalas pesan yang sama', async () => {
      const user = await registerUser(app);

      const wrongPassword = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'bukan-passwordnya' });
      const unknownEmail = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'tidak.ada@jasana.test', password: 'bukan-passwordnya' });

      expect(wrongPassword.status).toBe(401);
      expect(unknownEmail.status).toBe(401);
      expect(unknownEmail.body.error).toEqual(wrongPassword.body.error);
    });

    it('rate limit login 10 per 15 menit per IP', async () => {
      const attempt = () =>
        request(app)
          .post('/api/v1/auth/login')
          .send({ email: 'tebak@jasana.test', password: 'tebakan' });

      for (let i = 0; i < 10; i += 1) expect((await attempt()).status).toBe(401);

      const blocked = await attempt();
      expect(blocked.status).toBe(429);
      expect(blocked.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('menolak access token palsu dan tanpa token', async () => {
      expect((await request(app).get('/api/v1/auth/me')).status).toBe(401);
      const forged = await request(app).get('/api/v1/auth/me').set(...bearer('bukan.jwt.sah'));
      expect(forged.status).toBe(401);
      expect(forged.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // -------------------------------------------------------------------------
  describe('verifikasi email', () => {
    it('token dari email memverifikasi akun, dan hanya bisa dipakai sekali', async () => {
      const user = await registerUser(app);
      const token = tokenFrom(lastEmailTo(sent, user.email));

      const verified = await request(app).post('/api/v1/auth/verify-email').send({ token });
      expect(verified.status).toBe(200);
      expect(verified.body.data.email_verified_at).toEqual(expect.any(String));

      const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(row.emailVerifiedAt).not.toBeNull();

      const again = await request(app).post('/api/v1/auth/verify-email').send({ token });
      expect(again.status).toBe(422);
      expect(again.body.error.code).toBe('TOKEN_ALREADY_USED');
    });

    it('token yang tidak dikenal dibalas TOKEN_INVALID', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: 'f'.repeat(64) });
      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('TOKEN_INVALID');
    });

    it('token kedaluwarsa dibalas TOKEN_EXPIRED', async () => {
      const user = await registerUser(app);
      const token = tokenFrom(lastEmailTo(sent, user.email));
      const past = new Date(Date.now() - 60_000);
      await prisma.verificationToken.update({
        where: { tokenHash: hashToken(token) },
        data: { createdAt: new Date(past.getTime() - 60_000), expiresAt: past },
      });

      const response = await request(app).post('/api/v1/auth/verify-email').send({ token });
      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('TOKEN_EXPIRED');
    });

    it('token reset password tidak bisa dipakai untuk verifikasi email', async () => {
      const user = await registerUser(app);
      await request(app).post('/api/v1/auth/forgot-password').send({ email: user.email });
      const resetToken = tokenFrom(lastEmailTo(sent, user.email));

      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: resetToken });
      expect(response.body.error.code).toBe('TOKEN_INVALID');
    });

    it('kirim ulang membatalkan token lama, dan dibatasi 1 per menit per akun', async () => {
      const user = await registerUser(app);
      const oldToken = tokenFrom(lastEmailTo(sent, user.email));
      const { access_token } = await loginUser(app, user);

      const resend = await request(app)
        .post('/api/v1/auth/resend-verification')
        .set(...bearer(access_token));
      expect(resend.status).toBe(200);
      expect(resend.body.data.sent).toBe(true);
      const newToken = tokenFrom(lastEmailTo(sent, user.email));
      expect(newToken).not.toBe(oldToken);

      const second = await request(app)
        .post('/api/v1/auth/resend-verification')
        .set(...bearer(access_token));
      expect(second.status).toBe(429);
      expect(second.body.error.code).toBe('RATE_LIMIT_EXCEEDED');

      const withOld = await request(app).post('/api/v1/auth/verify-email').send({ token: oldToken });
      expect(withOld.body.error.code).toBe('TOKEN_ALREADY_USED');

      const withNew = await request(app).post('/api/v1/auth/verify-email').send({ token: newToken });
      expect(withNew.status).toBe(200);
    });

    it('kirim ulang untuk akun yang sudah terverifikasi tidak mengirim email', async () => {
      const user = await registerUser(app);
      await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: tokenFrom(lastEmailTo(sent, user.email)) });
      const { access_token } = await loginUser(app, user);
      const before = sent.length;

      const response = await request(app)
        .post('/api/v1/auth/resend-verification')
        .set(...bearer(access_token));
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ sent: false, email_verified: true });
      expect(sent.length).toBe(before);
    });
  });

  // -------------------------------------------------------------------------
  describe('lupa dan reset password', () => {
    it('SELALU membalas sukses, dengan balasan identik untuk email terdaftar dan tidak', async () => {
      const user = await registerUser(app);
      const before = sent.length;

      const registered = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: user.email });
      const unregistered = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'tidak.terdaftar@jasana.test' });

      expect(registered.status).toBe(200);
      expect(unregistered.status).toBe(200);
      expect(unregistered.body).toEqual(registered.body);

      // Hanya satu email keluar, untuk alamat yang memang terdaftar.
      expect(sent.length).toBe(before + 1);
      expect(sent.at(-1)!.to).toBe(user.email);
      expect(lastEmailTo(sent, 'tidak.terdaftar@jasana.test')).toBeUndefined();
    });

    it('reset mengganti password, mencabut seluruh sesi, dan tokennya sekali pakai', async () => {
      const user = await registerUser(app);
      const session = await loginUser(app, user);

      await request(app).post('/api/v1/auth/forgot-password').send({ email: user.email });
      const token = tokenFrom(lastEmailTo(sent, user.email));

      const reset = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token, new_password: 'password-baru-456' });
      expect(reset.status).toBe(200);
      expect(reset.body.data.sessions_revoked).toBe(1);

      expect((await refreshWith(app, session.refresh_token)).status).toBe(401);

      const oldLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: user.password });
      expect(oldLogin.status).toBe(401);
      await loginUser(app, { email: user.email, password: 'password-baru-456' });

      const reuse = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token, new_password: 'password-lain-789' });
      expect(reuse.body.error.code).toBe('TOKEN_ALREADY_USED');
    });

    it('permintaan reset baru membatalkan tautan reset sebelumnya', async () => {
      const user = await registerUser(app);

      await request(app).post('/api/v1/auth/forgot-password').send({ email: user.email });
      const first = tokenFrom(lastEmailTo(sent, user.email));
      await request(app).post('/api/v1/auth/forgot-password').send({ email: user.email });
      const second = tokenFrom(lastEmailTo(sent, user.email));

      const withFirst = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: first, new_password: 'password-baru-456' });
      expect(withFirst.body.error.code).toBe('TOKEN_ALREADY_USED');

      const withSecond = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: second, new_password: 'password-baru-456' });
      expect(withSecond.status).toBe(200);
    });

    it('rate limit forgot-password 3 per jam per IP', async () => {
      const ask = () =>
        request(app).post('/api/v1/auth/forgot-password').send({ email: 'siapa@jasana.test' });

      for (let i = 0; i < 3; i += 1) expect((await ask()).status).toBe(200);
      const blocked = await ask();
      expect(blocked.status).toBe(429);
      expect(blocked.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });
});
