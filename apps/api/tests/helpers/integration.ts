/**
 * Perlengkapan uji integrasi yang menyentuh basis data sungguhan.
 *
 * Dipakai dengan `describe.skipIf(!hasTestDatabase)`. Lihat tests/setup.ts
 * untuk cara `TEST_DATABASE_URL` dipasang dan pengamannya.
 */

import { randomInt } from 'node:crypto';
import type { Express } from 'express';
import request from 'supertest';
import { expect, vi, type MockInstance } from 'vitest';
import { prisma } from '@jasana/database';
import { mailer, type MailMessage } from '../../src/lib/mailer';

export const hasTestDatabase = Boolean(process.env.TEST_DATABASE_URL);

if (!hasTestDatabase) {
  console.warn(
    '[uji] TEST_DATABASE_URL kosong, uji integrasi basis data DILEWATI. ' +
      'Lihat .env.example untuk menyiapkannya.',
  );
}

/**
 * Mengosongkan tabel Fase 1. `DELETE`, bukan `TRUNCATE ... CASCADE`:
 * TRUNCATE users CASCADE ikut mengosongkan `platform_settings` lewat kolom
 * `updated_by`, padahal tabel itu nanti berisi parameter yang diisi seed.
 */
export async function resetDatabase(): Promise<void> {
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.userAddress.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

/**
 * Menyadap email keluar. Basis data hanya menyimpan HASH token, jadi satu-
 * satunya cara uji mendapatkan token mentah adalah dari isi email, persis
 * seperti pengguna sungguhan.
 */
export function captureEmails(): { sent: MailMessage[]; spy: MockInstance } {
  const sent: MailMessage[] = [];
  const spy = vi.spyOn(mailer, 'send').mockImplementation(async (message) => {
    sent.push(message);
  });
  return { sent, spy };
}

/** Token 64 hex dari tautan di isi email. */
export function tokenFrom(message: MailMessage | undefined): string {
  const match = message?.text.match(/token=([0-9a-f]{64})/);
  if (!match) throw new Error(`Email tidak memuat token: ${message?.text ?? '(tidak ada email)'}`);
  return match[1]!;
}

export function lastEmailTo(sent: MailMessage[], address: string): MailMessage | undefined {
  return sent.filter((message) => message.to === address).at(-1);
}

export interface TestUser {
  id: string;
  email: string;
  phone: string;
  password: string;
}

let sequence = 0;

export function newUserInput(overrides: Partial<Omit<TestUser, 'id'>> = {}) {
  sequence += 1;
  return {
    full_name: `Pengguna Uji ${sequence}`,
    email: `pengguna${sequence}.${randomInt(1e9)}@jasana.test`,
    // Sembilan digit acak di belakang 0812, lolos regex +628\d{7,11}.
    phone: `0812${String(randomInt(1e8, 1e9))}`,
    password: 'password-uji-123',
    ...overrides,
  };
}

export async function registerUser(
  app: Express,
  overrides: Partial<Omit<TestUser, 'id'>> = {},
): Promise<TestUser> {
  const input = newUserInput(overrides);
  const response = await request(app).post('/api/v1/auth/register').send(input);
  expect(response.status, JSON.stringify(response.body)).toBe(201);
  return {
    id: response.body.data.user.id,
    email: input.email,
    phone: response.body.data.user.phone,
    password: input.password,
  };
}

export interface SessionTokens {
  access_token: string;
  refresh_token: string;
}

export async function loginUser(
  app: Express,
  user: Pick<TestUser, 'email' | 'password'>,
  userAgent = 'uji-vitest',
): Promise<SessionTokens> {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .set('User-Agent', userAgent)
    .send({ email: user.email, password: user.password });
  expect(response.status, JSON.stringify(response.body)).toBe(200);
  return response.body.data;
}

export function refreshWith(app: Express, refreshToken: string, userAgent = 'uji-vitest') {
  return request(app)
    .post('/api/v1/auth/refresh')
    .set('User-Agent', userAgent)
    .send({ refresh_token: refreshToken });
}

export function bearer(token: string): [string, string] {
  return ['Authorization', `Bearer ${token}`];
}
