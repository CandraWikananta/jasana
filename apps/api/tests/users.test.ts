/**
 * Akun milik pemanggil: profil, ganti password, penggantian email (D64),
 * dan alamat.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '@jasana/database';
import type { MailMessage } from '../src/lib/mailer';
import { createApp } from '../src/app';
import {
  bearer,
  captureEmails,
  hasTestDatabase,
  lastEmailTo,
  loginUser,
  refreshWith,
  registerUser,
  resetDatabase,
  tokenFrom,
  type TestUser,
} from './helpers/integration';

describe.skipIf(!hasTestDatabase)('akun pemanggil', () => {
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

  const auth = () => bearer(accessToken);

  // -------------------------------------------------------------------------
  describe('PATCH /users/me', () => {
    it('mengubah nama, telepon, dan avatar, tapi mengabaikan email dan role', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set(...auth())
        .send({
          full_name: 'Nama Baru',
          phone: '0813 1111 2222',
          avatar_url: 'https://cdn.jasana.test/a.png',
          email: 'diam.diam@jasana.test',
          role: 'ADMIN',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        full_name: 'Nama Baru',
        phone: '+6281311112222',
        avatar_url: 'https://cdn.jasana.test/a.png',
        email: user.email,
        role: 'CLIENT',
      });
    });

    it('menolak nomor ponsel milik akun lain', async () => {
      const other = await registerUser(app);
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set(...auth())
        .send({ phone: other.phone });

      expect(response.status).toBe(422);
      expect(response.body.error.details[0].path).toBe('phone');
    });
  });

  // -------------------------------------------------------------------------
  describe('POST /users/me/change-password', () => {
    it('wajib password saat ini yang benar, dibalas 422 bukan 401', async () => {
      const response = await request(app)
        .post('/api/v1/users/me/change-password')
        .set(...auth())
        .send({ current_password: 'salah-total', new_password: 'password-baru-456' });

      expect(response.status).toBe(422);
      expect(response.body.error.details[0].path).toBe('current_password');
    });

    it('mencabut SELURUH refresh token milik user (H65)', async () => {
      const phone = await loginUser(app, user, 'ponsel');
      const laptop = await loginUser(app, user, 'laptop');

      const response = await request(app)
        .post('/api/v1/users/me/change-password')
        .set(...auth())
        .send({ current_password: user.password, new_password: 'password-baru-456' });

      expect(response.status).toBe(200);
      expect(response.body.data.sessions_revoked).toBe(3);
      expect((await refreshWith(app, phone.refresh_token)).status).toBe(401);
      expect((await refreshWith(app, laptop.refresh_token)).status).toBe(401);

      await loginUser(app, { email: user.email, password: 'password-baru-456' });
    });
  });

  // -------------------------------------------------------------------------
  describe('penggantian email (D64)', () => {
    const changeEmail = (body: Record<string, unknown>) =>
      request(app).patch('/api/v1/users/me/email').set(...auth()).send(body);

    it('WAJIB password saat ini: tanpa password atau password salah ditolak', async () => {
      const missing = await changeEmail({ new_email: 'baru@jasana.test' });
      expect(missing.status).toBe(422);
      expect(missing.body.error.details[0].path).toBe('current_password');

      const wrong = await changeEmail({ new_email: 'baru@jasana.test', current_password: 'salah' });
      expect(wrong.status).toBe(422);
      expect(wrong.body.error.details[0].path).toBe('current_password');

      const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(row.pendingEmail).toBeNull();
    });

    it('alamat lama TETAP AKTIF sampai alamat baru dikonfirmasi', async () => {
      const response = await changeEmail({
        new_email: 'Baru@Jasana.test',
        current_password: user.password,
      });
      expect(response.status).toBe(200);
      expect(response.body.data.pending_email).toBe('baru@jasana.test');

      const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(row.email).toBe(user.email);
      expect(row.pendingEmail).toBe('baru@jasana.test');

      // Masih login dengan alamat lama, belum bisa dengan alamat baru.
      await loginUser(app, user);
      const withNew = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'baru@jasana.test', password: user.password });
      expect(withNew.status).toBe(401);

      // Tautan konfirmasi ke alamat BARU, pemberitahuan ke alamat LAMA.
      const confirmation = lastEmailTo(sent, 'baru@jasana.test');
      const notice = lastEmailTo(sent, user.email);
      expect(confirmation?.text).toMatch(/confirm-email-change\?token=/);
      expect(notice?.subject).toMatch(/penggantian email/i);
      expect(notice?.text).not.toMatch(/token=/);

      // Setelah konfirmasi, barulah alamatnya berpindah.
      const confirm = await request(app)
        .post('/api/v1/auth/confirm-email-change')
        .send({ token: tokenFrom(confirmation) });
      expect(confirm.status).toBe(200);
      expect(confirm.body.data).toMatchObject({
        email: 'baru@jasana.test',
        pending_email: null,
        email_verified: true,
      });

      const oldLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: user.password });
      expect(oldLogin.status).toBe(401);
      await loginUser(app, { email: 'baru@jasana.test', password: user.password });
    });

    it('permintaan baru menggantikan permintaan lama', async () => {
      await changeEmail({ new_email: 'pertama@jasana.test', current_password: user.password });
      const firstToken = tokenFrom(lastEmailTo(sent, 'pertama@jasana.test'));
      await changeEmail({ new_email: 'kedua@jasana.test', current_password: user.password });

      const first = await request(app)
        .post('/api/v1/auth/confirm-email-change')
        .send({ token: firstToken });
      expect(first.body.error.code).toBe('TOKEN_ALREADY_USED');

      const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(row.pendingEmail).toBe('kedua@jasana.test');
    });

    it('pembatalan mengosongkan pending_email dan mematikan tautannya', async () => {
      await changeEmail({ new_email: 'batal@jasana.test', current_password: user.password });
      const token = tokenFrom(lastEmailTo(sent, 'batal@jasana.test'));

      const cancel = await request(app).delete('/api/v1/users/me/email-change').set(...auth());
      expect(cancel.status).toBe(200);
      expect(cancel.body.data.cancelled).toBe(true);

      const confirm = await request(app).post('/api/v1/auth/confirm-email-change').send({ token });
      expect(confirm.body.error.code).toBe('TOKEN_ALREADY_USED');

      const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(row.email).toBe(user.email);
      expect(row.pendingEmail).toBeNull();
    });

    it('menolak alamat yang sudah dipakai akun lain saat diajukan', async () => {
      const other = await registerUser(app);
      const response = await changeEmail({ new_email: other.email, current_password: user.password });
      expect(response.status).toBe(422);
      expect(response.body.error.details[0].path).toBe('new_email');
    });

    it('memeriksa ulang keunikan saat konfirmasi, karena alamatnya bisa keburu diambil', async () => {
      await changeEmail({ new_email: 'rebutan@jasana.test', current_password: user.password });
      const token = tokenFrom(lastEmailTo(sent, 'rebutan@jasana.test'));

      // Pemilik asli alamat itu mendaftar di antara pengajuan dan konfirmasi.
      await registerUser(app, { email: 'rebutan@jasana.test' });

      const confirm = await request(app).post('/api/v1/auth/confirm-email-change').send({ token });
      expect(confirm.status).toBe(422);
      expect(confirm.body.error.details[0].path).toBe('email');

      const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(row.email).toBe(user.email);
    });

    it('dibatasi 3 permintaan per hari per akun', async () => {
      for (let i = 0; i < 3; i += 1) {
        const response = await changeEmail({
          new_email: `ke${i}@jasana.test`,
          current_password: user.password,
        });
        expect(response.status).toBe(200);
      }
      const blocked = await changeEmail({
        new_email: 'ke4@jasana.test',
        current_password: user.password,
      });
      expect(blocked.status).toBe(429);
      expect(blocked.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  // -------------------------------------------------------------------------
  describe('alamat', () => {
    const base = { address_line: 'Jl. Raya Kampus Unud, Jimbaran', latitude: -8.79831234, longitude: 115.17123456 };

    const create = (body: Record<string, unknown>) =>
      request(app).post('/api/v1/users/me/addresses').set(...auth()).send(body);

    it('alamat pertama otomatis jadi alamat utama, koordinat utuh 8 desimal', async () => {
      const response = await create(base);
      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        is_default: true,
        latitude: -8.79831234,
        longitude: 115.17123456,
      });
    });

    it('menandai alamat lain sebagai utama melepas tanda di alamat lama', async () => {
      const first = (await create({ ...base, label: 'Rumah' })).body.data;
      const second = (await create({ ...base, label: 'Kantor', is_default: true })).body.data;
      expect(second.is_default).toBe(true);

      const list = await request(app).get('/api/v1/users/me/addresses').set(...auth());
      expect(list.body.data.map((a: { id: string }) => a.id)).toEqual([second.id, first.id]);
      expect(list.body.data.filter((a: { is_default: boolean }) => a.is_default)).toHaveLength(1);
    });

    it('alamat utama tidak bisa dilepas tanpa memilih penggantinya', async () => {
      const address = (await create(base)).body.data;
      const response = await request(app)
        .patch(`/api/v1/users/me/addresses/${address.id}`)
        .set(...auth())
        .send({ is_default: false });
      expect(response.status).toBe(422);
    });

    it('menghapus alamat utama memindahkan tandanya ke alamat lain', async () => {
      const first = (await create(base)).body.data;
      const second = (await create({ ...base, label: 'Kos' })).body.data;

      const removed = await request(app)
        .delete(`/api/v1/users/me/addresses/${first.id}`)
        .set(...auth());
      expect(removed.status).toBe(200);

      const list = await request(app).get('/api/v1/users/me/addresses').set(...auth());
      expect(list.body.data).toHaveLength(1);
      expect(list.body.data[0]).toMatchObject({ id: second.id, is_default: true });
    });

    it('alamat milik user lain dibalas 404, bukan 403', async () => {
      const other = await registerUser(app);
      const otherToken = (await loginUser(app, other)).access_token;
      const theirs = (
        await request(app)
          .post('/api/v1/users/me/addresses')
          .set(...bearer(otherToken))
          .send(base)
      ).body.data;

      const patch = await request(app)
        .patch(`/api/v1/users/me/addresses/${theirs.id}`)
        .set(...auth())
        .send({ label: 'Punyaku' });
      expect(patch.status).toBe(404);

      const remove = await request(app)
        .delete(`/api/v1/users/me/addresses/${theirs.id}`)
        .set(...auth());
      expect(remove.status).toBe(404);
    });

    it('menolak koordinat di luar rentang', async () => {
      const response = await create({ ...base, latitude: 91 });
      expect(response.status).toBe(422);
      expect(response.body.error.details[0].path).toBe('latitude');
    });
  });
});
