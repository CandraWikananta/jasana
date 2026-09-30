/**
 * Uji `GET /health` dan envelope respons (PRD Bagian 4.1, Lampiran A.2).
 *
 * Koneksi basis data di-mock supaya kedua cabang bisa diuji secara pasti.
 * Cabang "basis data mati" tidak bisa diuji dengan basis data sungguhan tanpa
 * mematikannya, dan justru cabang itulah yang membedakan 503 dari 500.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const checkDatabaseConnection = vi.hoisted(() => vi.fn());

vi.mock('@jasana/database', () => ({
  checkDatabaseConnection,
  disconnectDatabase: vi.fn(),
  prisma: {},
}));

const { createApp } = await import('../src/app');
const app = createApp();

beforeEach(() => {
  checkDatabaseConnection.mockReset();
});

describe('GET /health', () => {
  it('mengembalikan 200 dan envelope sukses saat basis data hidup', async () => {
    checkDatabaseConnection.mockResolvedValue(undefined);

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { status: 'ok', database: 'up' },
    });
    expect(typeof response.body.data.uptime_seconds).toBe('number');
    // Timestamp wajib ISO 8601 UTC.
    expect(response.body.data.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
  });

  it('juga tersedia di bawah /api/v1 mengikuti daftar endpoint', async () => {
    checkDatabaseConnection.mockResolvedValue(undefined);

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.data.database).toBe('up');
  });

  it('mengembalikan 503 SERVICE_UNAVAILABLE saat basis data mati, bukan 500', async () => {
    checkDatabaseConnection.mockRejectedValue(
      new Error('connect ECONNREFUSED 127.0.0.1:5432'),
    );

    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('tidak membocorkan pesan galat koneksi ke client', async () => {
    // Pesan aslinya memuat host dan port basis data, dan itu hanya boleh
    // masuk log Pino.
    checkDatabaseConnection.mockRejectedValue(
      new Error('connect ECONNREFUSED 10.1.2.3:5432 database jasana_prod'),
    );

    const response = await request(app).get('/health');

    const body = JSON.stringify(response.body);
    expect(body).not.toContain('ECONNREFUSED');
    expect(body).not.toContain('10.1.2.3');
    expect(body).not.toContain('jasana_prod');
  });

  it('membalikkan request_id lewat header respons', async () => {
    checkDatabaseConnection.mockResolvedValue(undefined);

    const response = await request(app).get('/health');
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('memakai ulang request_id yang dikirim client', async () => {
    checkDatabaseConnection.mockResolvedValue(undefined);

    const response = await request(app)
      .get('/health')
      .set('X-Request-Id', 'uji-korelasi-123');

    expect(response.headers['x-request-id']).toBe('uji-korelasi-123');
  });
});

describe('envelope error lapisan infrastruktur', () => {
  it('membalas 404 NOT_FOUND dalam bentuk envelope, bukan HTML Express', async () => {
    const response = await request(app).get('/rute-yang-tidak-ada');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: expect.stringContaining('/rute-yang-tidak-ada'),
        details: [],
      },
    });
  });

  it('membalas 400 INVALID_JSON untuk body yang rusak, bukan 422', async () => {
    // Masalah BENTUK, bukan isi. Ini pembedaan yang disengaja di PRD 4.2.
    const response = await request(app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send('{"mau_jadi_json": ');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_JSON');
  });

  it('membalas 413 PAYLOAD_TOO_LARGE saat body melebihi 1 MB', async () => {
    const response = await request(app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ isi: 'x'.repeat(1_200_000) }));

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('membalas 403 CORS_ORIGIN_NOT_ALLOWED untuk origin di luar whitelist', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'https://penyerang.example');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('CORS_ORIGIN_NOT_ALLOWED');
  });

  it('mengizinkan origin yang ada di whitelist', async () => {
    checkDatabaseConnection.mockResolvedValue(undefined);

    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:3000');

    expect(response.status).toBe(200);
  });
});
