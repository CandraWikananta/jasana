/**
 * Tenaga kerja: lamaran, keanggotaan, dan dua kolom ketersediaan.
 *
 *   D36 / H23  satu orang satu keanggotaan ACTIVE, TAPI bukan seumur hidup:
 *              yang sudah RESIGNED boleh bergabung ke usaha lain
 *   D39 / H27  minimal satu pekerja ACTIVE dengan accepts_assignments = true
 *   D39        is_available hanya boleh true kalau accepts_assignments true
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { Prisma, prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { isActiveMembershipViolation } from '../src/lib/prisma-errors';
import { captureEmails, hasTestDatabase, loginUser, resetDatabase } from './helpers/integration';
import {
  adminActor,
  approvedProvider,
  auth,
  createListing,
  mapWorker,
  mockStorage,
  runVerificationQuery,
  verifiedActor,
  type Actor,
  type ApprovedProvider,
} from './helpers/providers';

describe.skipIf(!hasTestDatabase)('tenaga kerja', () => {
  let app: Express;
  let admin: Actor;
  let business: ApprovedProvider;
  let listingId: string;

  beforeEach(async () => {
    await resetDatabase();
    vi.restoreAllMocks();
    captureEmails();
    mockStorage();
    app = createApp();
    admin = await adminActor(app);
    business = await approvedProvider(app, admin, 'BUSINESS');
    listingId = await createListing(business.providerId);
    await mapWorker(business.ownerWorkerId, listingId);
  });

  const applyTo = (actor: Actor, providerId: string, listingIds: string[]) =>
    request(app)
      .post(`/api/v1/providers/${providerId}/worker-applications`)
      .set(...auth(actor))
      .send({ listing_ids: listingIds, experience_note: 'Dua tahun di bengkel cuci' });

  const ownerCall = (method: 'post' | 'patch' | 'delete', path: string, owner = business.owner) =>
    request(app)[method](`/api/v1/providers/me/workers${path}`).set(...auth(owner));

  /** Pelamar sampai ACTIVE lewat API. */
  async function hire(actor: Actor, provider: ApprovedProvider, listing: string): Promise<string> {
    const applied = await applyTo(actor, provider.providerId, [listing]);
    expect(applied.status, JSON.stringify(applied.body)).toBe(201);
    const approved = await ownerCall('post', `/${applied.body.data.id}/approve`, provider.owner).send({});
    expect(approved.status, JSON.stringify(approved.body)).toBe(200);
    return applied.body.data.id;
  }

  // -------------------------------------------------------------------------
  describe('lamaran dan persetujuan', () => {
    it('pelamar PENDING dengan usulan pemetaan, disetujui jadi ACTIVE dengan pemetaan final dari pemilik', async () => {
      const applicant = await verifiedActor(app);
      const second = await createListing(business.providerId, 'DRAFT');

      const applied = await applyTo(applicant, business.providerId, [listingId]);
      expect(applied.status).toBe(201);
      expect(applied.body.data).toMatchObject({
        membership_status: 'PENDING',
        is_owner: false,
        accepts_assignments: true,
        is_available: false,
      });
      expect(applied.body.data.listings.map((l: { id: string }) => l.id)).toEqual([listingId]);

      const list = await request(app)
        .get('/api/v1/providers/me/workers?membership_status=PENDING')
        .set(...auth(business.owner));
      expect(list.status).toBe(200);
      expect(list.body.data).toHaveLength(1);

      // D52: pemilik mencoret usulan dan menambah listing DRAFT.
      const approved = await ownerCall('post', `/${applied.body.data.id}/approve`).send({ listing_ids: [second] });
      expect(approved.status).toBe(200);
      expect(approved.body.data.membership_status).toBe('ACTIVE');
      expect(approved.body.data.listings.map((l: { id: string }) => l.id)).toEqual([second]);

      // Sekarang pelamar lolos requireWorker.
      const me = await request(app).get('/api/v1/workers/me').set(...auth(applicant));
      expect(me.status).toBe(200);
      expect(me.body.data.provider.id).toBe(business.providerId);
    });

    it('menolak lamaran ke usaha INDIVIDUAL', async () => {
      const individual = await approvedProvider(app, admin, 'INDIVIDUAL');
      const soloListing = await createListing(individual.providerId);
      const applicant = await verifiedActor(app);

      const response = await applyTo(applicant, individual.providerId, [soloListing]);
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('PROVIDER_STATE_CONFLICT');
    });

    it('listing wajib aktif dan milik usaha itu', async () => {
      const other = await approvedProvider(app, admin, 'BUSINESS');
      const foreign = await createListing(other.providerId);
      const draft = await createListing(business.providerId, 'DRAFT');
      const applicant = await verifiedActor(app);

      for (const ids of [[foreign], [draft], []]) {
        const response = await applyTo(applicant, business.providerId, ids);
        expect(response.status).toBe(422);
      }
    });

    it('pemilik tidak melamar ke usahanya sendiri, dan tidak bisa jadi pekerja di usaha lain', async () => {
      const own = await applyTo(business.owner, business.providerId, [listingId]);
      expect(own.status).toBe(409);
      expect(own.body.error.code).toBe('WORKER_MEMBERSHIP_CONFLICT');

      const other = await approvedProvider(app, admin, 'BUSINESS');
      const otherListing = await createListing(other.providerId);
      const elsewhere = await applyTo(business.owner, other.providerId, [otherListing]);
      expect(elsewhere.status).toBe(409);
      expect(elsewhere.body.error.message).toMatch(/Pemilik usaha tidak bisa/);
    });
  });

  // -------------------------------------------------------------------------
  describe('eksklusivitas keanggotaan (D36): satu ACTIVE, bukan satu seumur hidup', () => {
    it('orang yang aktif di usaha A tidak bisa melamar ke usaha B, dengan pesan yang menjelaskan sebab', async () => {
      const other = await approvedProvider(app, admin, 'BUSINESS');
      const otherListing = await createListing(other.providerId);
      const person = await verifiedActor(app);
      await hire(person, business, listingId);

      const response = await applyTo(person, other.providerId, [otherListing]);
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('WORKER_MEMBERSHIP_CONFLICT');
      expect(response.body.error.message).toMatch(/satu keanggotaan aktif/);
    });

    it('lamaran PENDING ke usaha lain gugur begitu satu usaha menyetujui (D37)', async () => {
      const other = await approvedProvider(app, admin, 'BUSINESS');
      const otherListing = await createListing(other.providerId);
      const person = await verifiedActor(app);

      const toB = await applyTo(person, other.providerId, [otherListing]);
      await hire(person, business, listingId);

      const application = await prisma.providerWorker.findUniqueOrThrow({ where: { id: toB.body.data.id } });
      expect(application.membershipStatus).toBe('REJECTED');

      const late = await ownerCall('post', `/${toB.body.data.id}/approve`, other.owner).send({});
      expect(late.status).toBe(409);
    });

    it('basis data sendiri menolak keanggotaan ACTIVE kedua (partial unique index H23)', async () => {
      const other = await approvedProvider(app, admin, 'BUSINESS');
      const person = await verifiedActor(app);
      await prisma.providerWorker.create({
        data: { providerProfileId: business.providerId, userId: person.id, displayName: 'A', membershipStatus: 'ACTIVE' },
      });

      const second = prisma.providerWorker.create({
        data: { providerProfileId: other.providerId, userId: person.id, displayName: 'B', membershipStatus: 'ACTIVE' },
      });
      const error = await second.catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      expect(error).toMatchObject({ code: 'P2002' });
      // Galat asli dari index inilah yang diterjemahkan service jadi 409
      // WORKER_MEMBERSHIP_CONFLICT kalau dua persetujuan balapan.
      expect(isActiveMembershipViolation(error)).toBe(true);
    });

    it('persetujuan untuk orang yang sudah aktif di usaha lain: 409, bukan 500', async () => {
      const other = await approvedProvider(app, admin, 'BUSINESS');
      const otherListing = await createListing(other.providerId);
      const person = await verifiedActor(app);
      const application = await applyTo(person, other.providerId, [otherListing]);

      // Keanggotaan ACTIVE muncul di usaha lain TANPA melewati service,
      // setelah lamaran ke usaha ini masuk.
      await prisma.providerWorker.create({
        data: { providerProfileId: business.providerId, userId: person.id, displayName: 'A', membershipStatus: 'ACTIVE' },
      });

      const response = await ownerCall('post', `/${application.body.data.id}/approve`, other.owner).send({});
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('WORKER_MEMBERSHIP_CONFLICT');
    });

    it('yang sudah RESIGNED boleh bergabung ke usaha lain, baris lamanya tetap ada', async () => {
      const other = await approvedProvider(app, admin, 'BUSINESS');
      const otherListing = await createListing(other.providerId);
      const person = await verifiedActor(app);

      const firstMembership = await hire(person, business, listingId);
      const removed = await ownerCall('delete', `/${firstMembership}`).send();
      expect(removed.status, JSON.stringify(removed.body)).toBe(200);
      expect(removed.body.data.membership_status).toBe('RESIGNED');

      const secondMembership = await hire(person, other, otherListing);

      const rows = await prisma.providerWorker.findMany({
        where: { userId: person.id },
        orderBy: { createdAt: 'asc' },
      });
      expect(rows.map((row) => [row.id, row.membershipStatus])).toEqual([
        [firstMembership, 'RESIGNED'],
        [secondMembership, 'ACTIVE'],
      ]);
    });

    it('pekerja yang keluar boleh membuka usaha sendiri', async () => {
      const person = await verifiedActor(app);
      const membership = await hire(person, business, listingId);

      const blocked = await request(app)
        .post('/api/v1/providers/apply')
        .set(...auth(person))
        .send({ provider_type: 'INDIVIDUAL' });
      expect(blocked.status).toBe(409);
      expect(blocked.body.error.message).toMatch(/mengundurkan diri/);

      await ownerCall('delete', `/${membership}`).send();
      const allowed = await request(app)
        .post('/api/v1/providers/apply')
        .set(...auth(person))
        .send({ provider_type: 'INDIVIDUAL' });
      expect(allowed.status).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  describe('accepts_assignments dan H27', () => {
    it('INDIVIDUAL tidak bisa mematikan kesediaan pemiliknya: 409 PROVIDER_HAS_NO_ACTIVE_WORKER', async () => {
      const individual = await approvedProvider(app, admin, 'INDIVIDUAL');
      const response = await ownerCall(
        'patch',
        `/${individual.ownerWorkerId}/assignments-setting`,
        individual.owner,
      ).send({ accepts_assignments: false });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('PROVIDER_HAS_NO_ACTIVE_WORKER');
      expect(await runVerificationQuery('V6')).toEqual([]);
    });

    it('BUSINESS: pemilik boleh jadi pengelola saja selama masih ada pekerja lain yang bersedia', async () => {
      const crew = await verifiedActor(app);
      const crewId = await hire(crew, business, listingId);

      const ownerOff = await ownerCall('patch', `/${business.ownerWorkerId}/assignments-setting`).send({
        accepts_assignments: false,
      });
      expect(ownerOff.status).toBe(200);
      expect(ownerOff.body.data.accepts_assignments).toBe(false);

      const crewOff = await ownerCall('patch', `/${crewId}/assignments-setting`).send({ accepts_assignments: false });
      expect(crewOff.status).toBe(409);
      expect(crewOff.body.error.code).toBe('PROVIDER_HAS_NO_ACTIVE_WORKER');

      // Mengeluarkan satu-satunya pekerja yang bersedia juga ditolak.
      const removeCrew = await ownerCall('delete', `/${crewId}`).send();
      expect(removeCrew.status).toBe(409);
      expect(removeCrew.body.error.code).toBe('PROVIDER_HAS_NO_ACTIVE_WORKER');

      expect(await runVerificationQuery('V6')).toEqual([]);
    });

    it('dua permintaan bersamaan yang masing-masing mematikan satu dari dua pekerja: tepat satu berhasil', async () => {
      const crew = await verifiedActor(app);
      const crewId = await hire(crew, business, listingId);

      const responses = await Promise.all([
        ownerCall('patch', `/${business.ownerWorkerId}/assignments-setting`).send({ accepts_assignments: false }),
        ownerCall('patch', `/${crewId}/assignments-setting`).send({ accepts_assignments: false }),
      ]);

      expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
      expect(
        await prisma.providerWorker.count({
          where: { providerProfileId: business.providerId, membershipStatus: 'ACTIVE', acceptsAssignments: true },
        }),
      ).toBe(1);
      expect(await runVerificationQuery('V6')).toEqual([]);
    });

    it('mematikan accepts_assignments ikut mematikan is_available', async () => {
      const crew = await verifiedActor(app);
      const crewId = await hire(crew, business, listingId);
      const crewToken = (await loginUser(app, crew)).access_token;

      const on = await request(app)
        .patch('/api/v1/workers/me/availability')
        .set('Authorization', `Bearer ${crewToken}`)
        .send({ is_available: true, latitude: -8.65, longitude: 115.2167 });
      expect(on.status).toBe(200);
      expect(on.body.data.is_available).toBe(true);

      await ownerCall('patch', `/${crewId}/assignments-setting`).send({ accepts_assignments: false });
      const row = await prisma.providerWorker.findUniqueOrThrow({ where: { id: crewId } });
      expect(row).toMatchObject({ acceptsAssignments: false, isAvailable: false });
    });

    it('pekerja pemilik tidak bisa dikeluarkan', async () => {
      const response = await ownerCall('delete', `/${business.ownerWorkerId}`).send();
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('WORKER_MEMBERSHIP_CONFLICT');
    });

    it('tidak bisa mengeluarkan satu-satunya pekerja terpetakan di listing yang tayang (D53)', async () => {
      const crew = await verifiedActor(app);
      const crewOnly = await createListing(business.providerId);
      const applied = await applyTo(crew, business.providerId, [crewOnly]);
      await ownerCall('post', `/${applied.body.data.id}/approve`).send({});

      const response = await ownerCall('delete', `/${applied.body.data.id}`).send();
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('LISTING_HAS_NO_WORKER');
      expect(await runVerificationQuery('V7')).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  describe('is_available (D39, D57)', () => {
    let crew: Actor;
    let crewId: string;

    beforeEach(async () => {
      crew = await verifiedActor(app);
      crewId = await hire(crew, business, listingId);
      crew.token = (await loginUser(app, crew)).access_token;
    });

    const toggle = (body: object) =>
      request(app).patch('/api/v1/workers/me/availability').set(...auth(crew)).send(body);

    it('menyalakan wajib menyertakan koordinat, mematikan tidak', async () => {
      const missing = await toggle({ is_available: true });
      expect(missing.status).toBe(422);
      expect(missing.body.error.details[0].path).toBe('latitude');

      const on = await toggle({ is_available: true, latitude: -8.65, longitude: 115.2167 });
      expect(on.status).toBe(200);
      expect(on.body.data).toMatchObject({
        is_available: true,
        current_latitude: -8.65,
        current_longitude: 115.2167,
      });
      expect(on.body.data.location_updated_at).not.toBeNull();

      const off = await toggle({ is_available: false });
      expect(off.status).toBe(200);
      expect(off.body.data.is_available).toBe(false);
    });

    it('tidak bisa dinyalakan kalau accepts_assignments false: 422 WORKER_NOT_ASSIGNABLE', async () => {
      await prisma.providerWorker.update({ where: { id: crewId }, data: { acceptsAssignments: false } });

      const response = await toggle({ is_available: true, latitude: -8.65, longitude: 115.2167 });
      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('WORKER_NOT_ASSIGNABLE');
      expect((await prisma.providerWorker.findUniqueOrThrow({ where: { id: crewId } })).isAvailable).toBe(false);
    });

    it('koordinat disimpan presisi Decimal, tidak bergeser', async () => {
      const response = await request(app)
        .patch('/api/v1/workers/me/location')
        .set(...auth(crew))
        .send({ latitude: -8.67052341, longitude: 115.21234567 });
      expect(response.status).toBe(200);
      const row = await prisma.providerWorker.findUniqueOrThrow({ where: { id: crewId } });
      expect(row.currentLatitude?.toString()).toBe('-8.67052341');
      expect(row.currentLongitude?.toString()).toBe('115.21234567');
    });

    it('bukan pekerja aktif: 403 FORBIDDEN_ACTOR', async () => {
      const outsider = await verifiedActor(app);
      const response = await request(app).get('/api/v1/workers/me').set(...auth(outsider));
      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN_ACTOR');
    });

    it('pekerja yang dikeluarkan langsung kehilangan akses, walau tokennya masih berlaku', async () => {
      const second = await verifiedActor(app);
      await hire(second, business, listingId);
      await ownerCall('delete', `/${crewId}`).send();

      const response = await request(app).get('/api/v1/workers/me').set(...auth(crew));
      expect(response.status).toBe(403);
    });
  });
});
