/**
 * Pengajuan provider dan keputusan admin (D33, D46, D47).
 *
 * Inti yang dibuktikan: persetujuan e-KYC membuat wallet DAN baris pekerja
 * pemilik dalam SATU transaksi. Kalau salah satu langkah gagal, tidak ada
 * yang tersimpan.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '@jasana/database';
import type { MailMessage } from '../src/lib/mailer';
import { createApp } from '../src/app';
import { captureEmails, hasTestDatabase, resetDatabase } from './helpers/integration';
import {
  adminActor,
  approvedProvider,
  auth,
  FILES,
  mockStorage,
  runVerificationQuery,
  submitProviderApplication,
  uploadKyc,
  verifiedActor,
  type Actor,
  type StorageMocks,
} from './helpers/providers';

describe.skipIf(!hasTestDatabase)('pengajuan provider dan persetujuan admin', () => {
  let app: Express;
  let admin: Actor;
  let sent: MailMessage[];
  let storage: StorageMocks;

  beforeEach(async () => {
    await resetDatabase();
    vi.restoreAllMocks();
    sent = captureEmails().sent;
    storage = mockStorage();
    app = createApp();
    admin = await adminActor(app);
  });

  const approve = (id: string, actor: Actor = admin) =>
    request(app).post(`/api/v1/admin/provider-applications/${id}/approve`).set(...auth(actor));

  // -------------------------------------------------------------------------
  describe('persetujuan e-KYC', () => {
    it('membuat wallet DAN baris pekerja pemilik (is_owner, ACTIVE, accepts_assignments)', async () => {
      const applicant = await verifiedActor(app);
      const providerId = await submitProviderApplication(app, applicant);

      const response = await approve(providerId);

      expect(response.status, JSON.stringify(response.body)).toBe(200);
      expect(response.body.data.provider.verification_status).toBe('VERIFIED');
      expect(response.body.data.wallet).toMatchObject({
        balance_available: 0,
        balance_pending: 0,
        currency: 'IDR',
      });
      expect(response.body.data.owner_worker).toMatchObject({
        is_owner: true,
        membership_status: 'ACTIVE',
        accepts_assignments: true,
        is_available: false,
      });

      const [profile, wallet, workers, documents] = await Promise.all([
        prisma.providerProfile.findUniqueOrThrow({ where: { id: providerId } }),
        prisma.wallet.findUnique({ where: { providerProfileId: providerId } }),
        prisma.providerWorker.findMany({ where: { providerProfileId: providerId } }),
        prisma.kycDocument.findMany({ where: { providerProfileId: providerId } }),
      ]);
      expect(profile.verifiedBy).toBe(admin.id);
      expect(profile.verifiedAt).not.toBeNull();
      expect(wallet).not.toBeNull();
      expect(workers).toHaveLength(1);
      expect(workers[0]).toMatchObject({
        userId: applicant.id,
        isOwner: true,
        membershipStatus: 'ACTIVE',
        acceptsAssignments: true,
        approvedBy: null,
      });
      expect(documents.every((doc) => doc.status === 'APPROVED')).toBe(true);

      // V6: setiap provider VERIFIED punya pekerja aktif yang bersedia ditugaskan.
      expect(await runVerificationQuery('V6')).toEqual([]);
      // V1: wallet baru tanpa ledger tetap rekonsiliasi.
      expect(await runVerificationQuery('V1')).toEqual([]);

      // Email keputusan dikirim setelah commit.
      await vi.waitFor(() => expect(sent.some((mail) => mail.to === applicant.email)).toBe(true));
    });

    it('SATU transaksi: kalau wallet gagal dibuat, profil dan dokumen tidak ikut berubah', async () => {
      const applicant = await verifiedActor(app);
      const providerId = await submitProviderApplication(app, applicant);
      // Wallet yang sudah ada membuat langkah 3 menabrak unique provider_profile_id,
      // SETELAH langkah 1 (profil VERIFIED) dan 2 (dokumen APPROVED) dijalankan.
      await prisma.wallet.create({ data: { providerProfileId: providerId } });

      const response = await approve(providerId);
      expect(response.status).toBe(500);

      const profile = await prisma.providerProfile.findUniqueOrThrow({ where: { id: providerId } });
      expect(profile.verificationStatus).toBe('PENDING');
      expect(profile.verifiedAt).toBeNull();
      expect(await prisma.kycDocument.count({ where: { providerProfileId: providerId, status: 'APPROVED' } })).toBe(0);
      expect(await prisma.providerWorker.count({ where: { providerProfileId: providerId } })).toBe(0);
    });

    it('pemohon yang masih pekerja aktif di usaha lain ditolak dengan pesan yang menjelaskan sebab (D36)', async () => {
      const business = await approvedProvider(app, admin, 'BUSINESS');
      const person = await verifiedActor(app);
      // Profil PENDING dibuat langsung: jalur apply sendiri sudah menolaknya.
      const profile = await prisma.providerProfile.create({
        data: {
          userId: person.id,
          verificationStatus: 'PENDING',
          kycDocuments: {
            create: [
              { documentType: 'KTP', fileUrl: 'kyc-documents/x/ktp.jpg' },
              { documentType: 'SELFIE_KTP', fileUrl: 'kyc-documents/x/selfie.jpg' },
            ],
          },
        },
      });
      await prisma.providerWorker.create({
        data: {
          providerProfileId: business.providerId,
          userId: person.id,
          displayName: 'Pekerja',
          membershipStatus: 'ACTIVE',
        },
      });

      const response = await approve(profile.id);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('WORKER_MEMBERSHIP_CONFLICT');
      expect(response.body.error.message).toMatch(/satu keanggotaan aktif/);
      expect(await prisma.wallet.count({ where: { providerProfileId: profile.id } })).toBe(0);
      expect(
        (await prisma.providerProfile.findUniqueOrThrow({ where: { id: profile.id } })).verificationStatus,
      ).toBe('PENDING');
    });

    it('lamaran pekerja pemohon yang masih PENDING di usaha lain ikut gugur (D37)', async () => {
      const business = await approvedProvider(app, admin, 'BUSINESS');
      const applicant = await verifiedActor(app);
      const pendingApplication = await prisma.providerWorker.create({
        data: {
          providerProfileId: business.providerId,
          userId: applicant.id,
          displayName: 'Pelamar',
          membershipStatus: 'PENDING',
        },
      });
      const providerId = await submitProviderApplication(app, applicant);

      expect((await approve(providerId)).status).toBe(200);

      const withdrawn = await prisma.providerWorker.findUniqueOrThrow({ where: { id: pendingApplication.id } });
      expect(withdrawn.membershipStatus).toBe('REJECTED');
    });

    it('hanya pengajuan PENDING yang bisa disetujui, dan tidak dua kali', async () => {
      const applicant = await verifiedActor(app);
      await request(app).post('/api/v1/providers/apply').set(...auth(applicant)).send({ provider_type: 'INDIVIDUAL' });
      const draft = await prisma.providerProfile.findUniqueOrThrow({ where: { userId: applicant.id } });

      const early = await approve(draft.id);
      expect(early.status).toBe(409);
      expect(early.body.error.code).toBe('PROVIDER_STATE_CONFLICT');

      const providerId = await submitProviderApplication(app, applicant);
      expect((await approve(providerId)).status).toBe(200);

      const again = await approve(providerId);
      expect(again.status).toBe(409);
      expect(await prisma.wallet.count({ where: { providerProfileId: providerId } })).toBe(1);
      expect(await prisma.providerWorker.count({ where: { providerProfileId: providerId } })).toBe(1);
    });

    it('bukan admin: 403 FORBIDDEN_ACTOR', async () => {
      const applicant = await verifiedActor(app);
      const providerId = await submitProviderApplication(app, applicant);

      const response = await approve(providerId, applicant);
      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN_ACTOR');
    });

    it('requireProvider langsung berlaku setelah disetujui, tanpa menunggu token baru', async () => {
      const applicant = await verifiedActor(app);
      const providerId = await submitProviderApplication(app, applicant);

      const before = await request(app)
        .patch('/api/v1/providers/me')
        .set(...auth(applicant))
        .send({ bio: 'Cuci mobil panggilan' });
      expect(before.status).toBe(403);

      await approve(providerId);

      const after = await request(app)
        .patch('/api/v1/providers/me')
        .set(...auth(applicant))
        .send({ bio: 'Cuci mobil panggilan', provider_type: 'BUSINESS' });
      expect(after.status).toBe(200);
      expect(after.body.data.bio).toBe('Cuci mobil panggilan');
      // D46: provider_type tidak bisa diganti lewat PATCH profil.
      expect(after.body.data.provider_type).toBe('INDIVIDUAL');
    });
  });

  // -------------------------------------------------------------------------
  describe('penolakan dan pengajuan ulang', () => {
    it('ditolak, lalu mengajukan ulang harus mengunggah dokumen baru', async () => {
      const applicant = await verifiedActor(app);
      const providerId = await submitProviderApplication(app, applicant);

      const rejected = await request(app)
        .post(`/api/v1/admin/provider-applications/${providerId}/reject`)
        .set(...auth(admin))
        .send({ reason: 'Foto KTP buram' });
      expect(rejected.status).toBe(200);
      expect(rejected.body.data).toMatchObject({
        verification_status: 'REJECTED',
        rejection_reason: 'Foto KTP buram',
      });

      // Unggah saat REJECTED ditolak: ajukan ulang dulu.
      const blocked = await uploadKyc(app, applicant, 'KTP', FILES.jpeg);
      expect(blocked.status).toBe(409);

      const reapplied = await request(app)
        .post('/api/v1/providers/apply')
        .set(...auth(applicant))
        .send({ provider_type: 'INDIVIDUAL' });
      expect(reapplied.status).toBe(200);
      expect(reapplied.body.data.verification_status).toBe('DRAFT');
      expect(reapplied.body.data.rejection_reason).toBeNull();
      // Dokumen putaran lama tidak ikut melengkapi.
      expect(reapplied.body.data.missing_documents).toEqual(['KTP', 'SELFIE_KTP']);
    });

    it('apply saat PENDING atau VERIFIED: 409', async () => {
      const applicant = await verifiedActor(app);
      await submitProviderApplication(app, applicant);

      const response = await request(app)
        .post('/api/v1/providers/apply')
        .set(...auth(applicant))
        .send({ provider_type: 'BUSINESS', business_name: 'Ganti Tipe' });
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('PROVIDER_STATE_CONFLICT');
    });

    it('apply butuh email terverifikasi (D62)', async () => {
      const unverified = await verifiedActor(app);
      await prisma.user.update({ where: { id: unverified.id }, data: { emailVerifiedAt: null } });

      const response = await request(app)
        .post('/api/v1/providers/apply')
        .set(...auth(unverified))
        .send({ provider_type: 'INDIVIDUAL' });
      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('EMAIL_NOT_VERIFIED');
    });
  });

  // -------------------------------------------------------------------------
  describe('admin membaca pengajuan', () => {
    it('daftar PENDING, lalu detail dengan signed URL berumur pendek dari bucket private', async () => {
      const applicant = await verifiedActor(app);
      const providerId = await submitProviderApplication(app, applicant);

      const list = await request(app)
        .get('/api/v1/admin/provider-applications?status=PENDING')
        .set(...auth(admin));
      expect(list.status).toBe(200);
      expect(list.body.meta).toMatchObject({ page: 1, limit: 20, total: 1 });
      expect(list.body.data[0]).toMatchObject({ id: providerId, document_count: 2 });

      const detail = await request(app)
        .get(`/api/v1/admin/provider-applications/${providerId}`)
        .set(...auth(admin));
      expect(detail.status).toBe(200);
      expect(detail.body.data.documents).toHaveLength(2);
      for (const document of detail.body.data.documents) {
        expect(document.signed_url).toMatch(/^https:\/\/storage\.test\/sign\/kyc-documents\//);
        expect(document).not.toHaveProperty('file_url');
      }
      expect(storage.sign).toHaveBeenCalledWith('kyc-documents', expect.any(String), 600);
    });
  });

  // -------------------------------------------------------------------------
  describe('perubahan tipe (D47)', () => {
    it('naik ke BUSINESS: verification_status tetap VERIFIED selama menunggu, admin menyetujui setelah dokumen usaha ada', async () => {
      const { owner, providerId } = await approvedProvider(app, admin, 'INDIVIDUAL');

      const requested = await request(app)
        .post('/api/v1/providers/me/type-upgrade')
        .set(...auth(owner))
        .send({ provider_type: 'BUSINESS', business_name: 'Cuci Mobil Bersaudara' });
      expect(requested.status).toBe(200);
      expect(requested.body.data).toMatchObject({
        provider_type: 'INDIVIDUAL',
        requested_provider_type: 'BUSINESS',
        verification_status: 'VERIFIED',
      });

      const decide = (body: object) =>
        request(app)
          .patch(`/api/v1/admin/type-upgrade-requests/${providerId}`)
          .set(...auth(admin))
          .send(body);

      // Belum ada NPWP atau izin usaha.
      expect((await decide({ decision: 'APPROVED' })).status).toBe(409);

      // Setelah VERIFIED, hanya dokumen usaha yang boleh diunggah.
      expect((await uploadKyc(app, owner, 'KTP', FILES.jpeg)).status).toBe(409);
      expect((await uploadKyc(app, owner, 'BUSINESS_LICENSE', FILES.pdf, 'izin.pdf', 'application/pdf')).status).toBe(201);

      const queue = await request(app).get('/api/v1/admin/type-upgrade-requests').set(...auth(admin));
      expect(queue.body.data[0].business_documents).toHaveLength(1);

      const approved = await decide({ decision: 'APPROVED' });
      expect(approved.status).toBe(200);
      expect(approved.body.data).toMatchObject({
        provider_type: 'BUSINESS',
        requested_provider_type: null,
        verification_status: 'VERIFIED',
      });
    });

    it('turun ke INDIVIDUAL hanya kalau tersisa satu pekerja aktif', async () => {
      const { owner, providerId } = await approvedProvider(app, admin, 'BUSINESS');
      const extra = await verifiedActor(app);
      await prisma.providerWorker.create({
        data: { providerProfileId: providerId, userId: extra.id, displayName: 'Kru', membershipStatus: 'ACTIVE' },
      });

      const downgrade = () =>
        request(app)
          .post('/api/v1/providers/me/type-upgrade')
          .set(...auth(owner))
          .send({ provider_type: 'INDIVIDUAL' });

      const blocked = await downgrade();
      expect(blocked.status).toBe(409);
      expect(blocked.body.error.code).toBe('PROVIDER_STATE_CONFLICT');

      await prisma.providerWorker.updateMany({
        where: { userId: extra.id },
        data: { membershipStatus: 'RESIGNED' },
      });
      const allowed = await downgrade();
      expect(allowed.status).toBe(200);
      expect(allowed.body.data.provider_type).toBe('INDIVIDUAL');
    });
  });

  // -------------------------------------------------------------------------
  describe('profil publik', () => {
    it('hanya provider VERIFIED yang tampil, tanpa alamat dan koordinat basis', async () => {
      const applicant = await verifiedActor(app);
      const providerId = await submitProviderApplication(app, applicant);

      expect((await request(app).get(`/api/v1/providers/${providerId}`)).status).toBe(404);

      await approve(providerId);
      const response = await request(app).get(`/api/v1/providers/${providerId}`);
      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({ id: providerId, accepts_worker_applications: false });
      expect(response.body.data).not.toHaveProperty('base_latitude');
      expect(response.body.data).not.toHaveProperty('base_address');
    });
  });
});
