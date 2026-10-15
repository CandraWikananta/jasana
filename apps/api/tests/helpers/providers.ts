/**
 * Perlengkapan uji Fase 2: akun terverifikasi, admin, provider yang sudah
 * disetujui, listing, berkas uji, dan kueri verifikasi V1 sampai V12.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomInt } from 'node:crypto';
import type { Express } from 'express';
import request from 'supertest';
import { expect, vi, type MockInstance } from 'vitest';
import { prisma } from '@jasana/database';
import { storage } from '../../src/lib/supabase';
import { bearer, loginUser, registerUser, type TestUser } from './integration';

// ---------------------------------------------------------------------------
// Berkas uji. Hanya byte pertamanya yang menentukan jenis.
// ---------------------------------------------------------------------------

export const FILES = {
  jpeg: Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
    Buffer.from('JFIF\0'),
    Buffer.alloc(512, 0x11),
  ]),
  png: Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(512, 0x22),
  ]),
  pdf: Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(512, 0x20)]),
  /** Executable Windows: header DOS "MZ" diikuti stub PE. */
  exe: Buffer.concat([
    Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xff, 0xff]),
    Buffer.alloc(50, 0x00),
    Buffer.from('This program cannot be run in DOS mode.\r\r\n$'),
    Buffer.alloc(400, 0x00),
  ]),
};

// ---------------------------------------------------------------------------
// Supabase Storage disadap, uji tidak pernah memanggil jaringan.
// ---------------------------------------------------------------------------

export interface StorageMocks {
  upload: MockInstance;
  remove: MockInstance;
  sign: MockInstance;
}

export function mockStorage(): StorageMocks {
  return {
    upload: vi.spyOn(storage, 'upload').mockResolvedValue(undefined),
    remove: vi.spyOn(storage, 'remove').mockResolvedValue(undefined),
    sign: vi
      .spyOn(storage, 'createSignedUrl')
      .mockImplementation(async (bucket, path) => `https://storage.test/sign/${bucket}/${path}?token=t`),
  };
}

// ---------------------------------------------------------------------------
// Akun
// ---------------------------------------------------------------------------

export interface Actor extends TestUser {
  token: string;
}

/** User baru, email SUDAH terverifikasi, sudah login. */
export async function verifiedActor(app: Express): Promise<Actor> {
  const user = await registerUser(app);
  await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
  const { access_token } = await loginUser(app, user);
  return { ...user, token: access_token };
}

export async function adminActor(app: Express): Promise<Actor> {
  const actor = await verifiedActor(app);
  await prisma.user.update({ where: { id: actor.id }, data: { role: 'ADMIN' } });
  return actor;
}

export function auth(actor: Pick<Actor, 'token'>): [string, string] {
  return bearer(actor.token);
}

// ---------------------------------------------------------------------------
// Alur provider lewat API
// ---------------------------------------------------------------------------

export function uploadKyc(
  app: Express,
  actor: Actor,
  documentType: string,
  file: Buffer,
  filename = 'dokumen.jpg',
  contentType = 'image/jpeg',
) {
  return request(app)
    .post('/api/v1/providers/me/kyc-documents')
    .set(...auth(actor))
    .field('document_type', documentType)
    .attach('file', file, { filename, contentType });
}

/** Apply lalu unggah dokumen wajib, berakhir PENDING. Mengembalikan id profil. */
export async function submitProviderApplication(
  app: Express,
  actor: Actor,
  providerType: 'INDIVIDUAL' | 'BUSINESS' = 'INDIVIDUAL',
): Promise<string> {
  const applied = await request(app)
    .post('/api/v1/providers/apply')
    .set(...auth(actor))
    .send({
      provider_type: providerType,
      business_name: providerType === 'BUSINESS' ? `Usaha Uji ${randomInt(1e6)}` : undefined,
    });
  expect(applied.status, JSON.stringify(applied.body)).toBe(200);

  const docs = providerType === 'BUSINESS' ? ['KTP', 'SELFIE_KTP', 'NPWP'] : ['KTP', 'SELFIE_KTP'];
  for (const type of docs) {
    const uploaded = await uploadKyc(app, actor, type, FILES.jpeg);
    expect(uploaded.status, JSON.stringify(uploaded.body)).toBe(201);
  }
  const profile = await prisma.providerProfile.findUniqueOrThrow({ where: { userId: actor.id } });
  expect(profile.verificationStatus).toBe('PENDING');
  return profile.id;
}

export interface ApprovedProvider {
  owner: Actor;
  providerId: string;
  ownerWorkerId: string;
}

/** Provider VERIFIED lewat jalur API lengkap, termasuk persetujuan admin. */
export async function approvedProvider(
  app: Express,
  admin: Actor,
  providerType: 'INDIVIDUAL' | 'BUSINESS' = 'INDIVIDUAL',
): Promise<ApprovedProvider> {
  const owner = await verifiedActor(app);
  const providerId = await submitProviderApplication(app, owner, providerType);
  const approved = await request(app)
    .post(`/api/v1/admin/provider-applications/${providerId}/approve`)
    .set(...auth(admin));
  expect(approved.status, JSON.stringify(approved.body)).toBe(200);
  return { owner, providerId, ownerWorkerId: approved.body.data.owner_worker.id };
}

let catalogSequence = 0;

/** Listing ACTIVE milik provider. Katalog dan listing baru ada di Fase 3 dan 4, jadi dibuat langsung. */
export async function createListing(
  providerProfileId: string,
  status: 'ACTIVE' | 'DRAFT' = 'ACTIVE',
): Promise<string> {
  catalogSequence += 1;
  const suffix = `${catalogSequence}-${randomInt(1e9)}`;
  const category = await prisma.category.create({
    data: { name: `Kategori Uji ${suffix}`, slug: `uji-kategori-${suffix}` },
  });
  const subcategory = await prisma.subcategory.create({
    data: { categoryId: category.id, name: `Sub Uji ${suffix}`, slug: `uji-sub-${suffix}` },
  });
  const listing = await prisma.listing.create({
    data: {
      providerProfileId,
      subcategoryId: subcategory.id,
      title: `Listing Uji ${suffix}`,
      price: 100000,
      attributes: {},
      status,
    },
  });
  return listing.id;
}

/** Memetakan pekerja ke listing langsung. Endpoint pemetaan ada di Fase 4. */
export async function mapWorker(workerId: string, listingId: string): Promise<void> {
  await prisma.workerListing.create({ data: { workerId, listingId } });
}

// ---------------------------------------------------------------------------
// Kueri verifikasi, dibaca dari berkas yang sama dengan `npm run db:verify`
// ---------------------------------------------------------------------------

const verificationSql = readFileSync(
  resolve(__dirname, '../../../../packages/database/prisma/verification-queries.sql'),
  'utf8',
);

export async function runVerificationQuery(id: string): Promise<unknown[]> {
  const blocks = verificationSql.split(/^--\s*@query\s+/m);
  const block = blocks.find((text) => text.startsWith(`${id} `));
  if (!block) throw new Error(`Kueri ${id} tidak ditemukan di verification-queries.sql`);
  const sql = block.split('\n').slice(1).join('\n').trim().replace(/;\s*$/, '');
  return prisma.$queryRawUnsafe<unknown[]>(sql);
}
