/**
 * POST /providers/me/kyc-documents (D80, H78, H79).
 *
 * Yang dibuktikan:
 *   - jenis berkas ditentukan MAGIC BYTES, bukan nama dan bukan Content-Type
 *   - berkas masuk Storage LEBIH DULU, baru baris kyc_documents ditulis
 *   - Storage gagal: 502, tanpa baris
 *   - batas ukuran dari platform_settings: 413
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { KYC_BUCKET } from '../src/config/constants';
import { StorageError } from '../src/lib/supabase';
import { captureEmails, hasTestDatabase, resetDatabase } from './helpers/integration';
import {
  auth,
  FILES,
  mockStorage,
  uploadKyc,
  verifiedActor,
  type Actor,
  type StorageMocks,
} from './helpers/providers';

describe.skipIf(!hasTestDatabase)('POST /providers/me/kyc-documents', () => {
  let app: Express;
  let applicant: Actor;
  let storage: StorageMocks;

  const documentRows = () =>
    prisma.kycDocument.count({ where: { providerProfile: { userId: applicant.id } } });

  beforeEach(async () => {
    await resetDatabase();
    vi.restoreAllMocks();
    captureEmails();
    storage = mockStorage();
    app = createApp();
    applicant = await verifiedActor(app);

    const applied = await request(app)
      .post('/api/v1/providers/apply')
      .set(...auth(applicant))
      .send({ provider_type: 'INDIVIDUAL' });
    expect(applied.status).toBe(200);
  });

  // -------------------------------------------------------------------------
  describe('magic bytes, bukan Content-Type', () => {
    it('menolak berkas .exe yang dinamai ktp.jpg dengan Content-Type image/jpeg: 422 UNSUPPORTED_FILE_TYPE', async () => {
      const response = await request(app)
        .post('/api/v1/providers/me/kyc-documents')
        .set(...auth(applicant))
        .field('document_type', 'KTP')
        .attach('file', FILES.exe, { filename: 'ktp.jpg', contentType: 'image/jpeg' });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNSUPPORTED_FILE_TYPE');

      // Tidak sampai ke Storage, tidak ada baris yang ditulis.
      expect(storage.upload).not.toHaveBeenCalled();
      expect(await documentRows()).toBe(0);
    });

    it('menolak teks biasa yang mengaku PDF', async () => {
      const response = await uploadKyc(
        app,
        applicant,
        'KTP',
        Buffer.from('bukan pdf sama sekali'),
        'ktp.pdf',
        'application/pdf',
      );
      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('UNSUPPORTED_FILE_TYPE');
      expect(storage.upload).not.toHaveBeenCalled();
    });

    it('menerima PNG asli yang diberi nama .pdf, dan menyimpannya sebagai image/png', async () => {
      const response = await uploadKyc(app, applicant, 'KTP', FILES.png, 'ktp.pdf', 'application/pdf');

      expect(response.status, JSON.stringify(response.body)).toBe(201);
      expect(storage.upload).toHaveBeenCalledTimes(1);
      const [bucket, path, , contentType] = storage.upload.mock.calls[0]!;
      expect(bucket).toBe(KYC_BUCKET);
      // Jenis dan ekstensi dari isi berkas, nama asli tidak dipakai.
      expect(contentType).toBe('image/png');
      expect(path).toMatch(/\.png$/);
      expect(path).not.toContain('ktp');
    });
  });

  // -------------------------------------------------------------------------
  describe('urutan: Storage dulu, baru baris basis data', () => {
    it('berkas sudah di Storage sebelum baris ditulis, dan file_url merujuk objek itu', async () => {
      let rowsWhenUploading = -1;
      storage.upload.mockImplementation(async () => {
        rowsWhenUploading = await documentRows();
      });

      const response = await uploadKyc(app, applicant, 'KTP', FILES.jpeg);

      expect(response.status, JSON.stringify(response.body)).toBe(201);
      expect(rowsWhenUploading).toBe(0);
      expect(await documentRows()).toBe(1);

      const row = await prisma.kycDocument.findFirstOrThrow({
        where: { providerProfile: { userId: applicant.id } },
      });
      const [bucket, path] = storage.upload.mock.calls[0]!;
      expect(row.fileUrl).toBe(`${bucket}/${path}`);
      expect(row.documentType).toBe('KTP');
      expect(row.status).toBe('PENDING');
      // file_url tidak dibocorkan ke client.
      expect(response.body.data.document).not.toHaveProperty('file_url');
    });

    it('Storage gagal: 502 STORAGE_UPLOAD_FAILED dan TIDAK ada baris yang ditulis', async () => {
      storage.upload.mockRejectedValue(new StorageError('Unggah berkas ditolak Storage (500)', 500));

      const response = await uploadKyc(app, applicant, 'KTP', FILES.jpeg);

      expect(response.status).toBe(502);
      expect(response.body.error.code).toBe('STORAGE_UPLOAD_FAILED');
      expect(await documentRows()).toBe(0);
    });

    it('baris gagal ditulis setelah berkas masuk: berkasnya dihapus lagi', async () => {
      // Status berubah di antara pemeriksaan awal dan penulisan baris,
      // misalnya admin memutus pada saat yang sama.
      storage.upload.mockImplementation(async () => {
        await prisma.providerProfile.update({
          where: { userId: applicant.id },
          data: { verificationStatus: 'SUSPENDED' },
        });
      });

      const response = await uploadKyc(app, applicant, 'KTP', FILES.jpeg);

      expect(response.status).toBe(409);
      expect(await documentRows()).toBe(0);
      const [, uploadedPath] = storage.upload.mock.calls[0]!;
      expect(storage.remove).toHaveBeenCalledWith(KYC_BUCKET, [uploadedPath]);
    });
  });

  // -------------------------------------------------------------------------
  describe('aturan bisnis', () => {
    it('INDIVIDUAL tidak boleh mengunggah NPWP: 422, tanpa menyentuh Storage', async () => {
      const response = await uploadKyc(app, applicant, 'NPWP', FILES.pdf, 'npwp.pdf', 'application/pdf');
      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details[0].path).toBe('document_type');
      expect(storage.upload).not.toHaveBeenCalled();
    });

    it('status pindah DRAFT ke PENDING begitu dokumen wajib lengkap', async () => {
      const first = await uploadKyc(app, applicant, 'KTP', FILES.jpeg);
      expect(first.body.data.verification_status).toBe('DRAFT');
      expect(first.body.data.missing_documents).toEqual(['SELFIE_KTP']);

      const second = await uploadKyc(app, applicant, 'SELFIE_KTP', FILES.png, 'selfie.png', 'image/png');
      expect(second.status).toBe(201);
      expect(second.body.data.verification_status).toBe('PENDING');
      expect(second.body.data.missing_documents).toEqual([]);
    });

    it('document_type tidak dikenal: 422', async () => {
      const response = await uploadKyc(app, applicant, 'PASPOR', FILES.jpeg);
      expect(response.status).toBe(422);
      expect(response.body.error.details[0].path).toBe('document_type');
      expect(storage.upload).not.toHaveBeenCalled();
    });

    it('tanpa berkas: 422', async () => {
      const response = await request(app)
        .post('/api/v1/providers/me/kyc-documents')
        .set(...auth(applicant))
        .field('document_type', 'KTP');
      expect(response.status).toBe(422);
      expect(response.body.error.details[0].path).toBe('file');
    });

    it('belum apply: 404', async () => {
      const stranger = await verifiedActor(app);
      const response = await uploadKyc(app, stranger, 'KTP', FILES.jpeg);
      expect(response.status).toBe(404);
      expect(storage.upload).not.toHaveBeenCalled();
    });

    it('tanpa login: 401', async () => {
      const response = await request(app)
        .post('/api/v1/providers/me/kyc-documents')
        .field('document_type', 'KTP')
        .attach('file', FILES.jpeg, { filename: 'ktp.jpg', contentType: 'image/jpeg' });
      expect(response.status).toBe(401);
    });
  });

  // -------------------------------------------------------------------------
  describe('batas ukuran dari platform_settings', () => {
    it('melebihi kyc_document_max_size_mb: 413 PAYLOAD_TOO_LARGE', async () => {
      await prisma.platformSetting.create({ data: { key: 'kyc_document_max_size_mb', value: 1 } });
      const big = Buffer.concat([FILES.jpeg, Buffer.alloc(1024 * 1024 + 1, 0x33)]);

      const response = await uploadKyc(app, applicant, 'KTP', big);

      expect(response.status).toBe(413);
      expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
      expect(storage.upload).not.toHaveBeenCalled();
      expect(await documentRows()).toBe(0);
    });

    it('di bawah batas diterima, walau lebih dari batas body JSON 1 MB', async () => {
      await prisma.platformSetting.create({ data: { key: 'kyc_document_max_size_mb', value: 3 } });
      const large = Buffer.concat([FILES.jpeg, Buffer.alloc(2 * 1024 * 1024, 0x33)]);

      const response = await uploadKyc(app, applicant, 'KTP', large);
      expect(response.status, JSON.stringify(response.body)).toBe(201);
    });
  });
});
