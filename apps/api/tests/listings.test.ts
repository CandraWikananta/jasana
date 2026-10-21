/**
 * Fase 4: listing, harga opsi, foto, FAQ, dan pemetaan dari dua arah.
 *
 *   D53 / H39  listing tanpa pekerja terpetakan tertahan di DRAFT (V7)
 *   D90 / H85  durasi wajib 15 sampai 720 menit
 *   D67 / H48  listing bertanda wajib melengkapi atribut sebelum disimpan
 *   D72        attributes hanya SPEC, harga opsi hanya OPTION
 *   H73        batas FAQ per listing (V12)
 *   H80        pembersihan berkas yatim foto listing
 */

import { randomInt } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { LISTING_PHOTO_BUCKET } from '../src/config/constants';
import { cleanOrphanListingPhotos } from '../src/jobs/orphan-listing-photos';
import { storage } from '../src/lib/supabase';
import { captureEmails, hasTestDatabase, resetDatabase } from './helpers/integration';
import {
  adminActor,
  approvedProvider,
  auth,
  createListing,
  mockStorage,
  runVerificationQuery,
  verifiedActor,
  type Actor,
  type ApprovedProvider,
} from './helpers/providers';

const opts = (...values: string[]) => values.map((value) => ({ value, is_active: true }));

describe.skipIf(!hasTestDatabase)('listing dan pemetaan', () => {
  let app: Express;
  let admin: Actor;
  let individual: ApprovedProvider;
  let business: ApprovedProvider;
  let subcategoryId: string;

  /** Sub-kategori uji: satu SPEC wajib, satu OPTION wajib, dua OPTION opsional. */
  async function newSubcategory(): Promise<string> {
    const suffix = randomInt(1e9);
    const category = await prisma.category.create({ data: { name: `Kat ${suffix}`, slug: `uji-kat-${suffix}` } });
    const sub = await prisma.subcategory.create({
      data: { categoryId: category.id, name: `Sub ${suffix}`, slug: `uji-sub-${suffix}` },
    });
    await prisma.subcategoryAttribute.createMany({
      data: [
        { subcategoryId: sub.id, attributeKey: 'sumber_air', label: 'Sumber air', dataType: 'SELECT', attributeRole: 'SPEC', pricingMode: 'NONE', options: opts('Dibawa penyedia', 'Disediakan client'), isRequired: true },
        { subcategoryId: sub.id, attributeKey: 'jenis_kendaraan', label: 'Jenis kendaraan', dataType: 'SELECT', attributeRole: 'OPTION', pricingMode: 'FLAT_PER_OPTION', options: [...opts('Sedan', 'SUV'), { value: 'Bus', is_active: false }], isRequired: true, displayOrder: 1 },
        { subcategoryId: sub.id, attributeKey: 'layanan_malam', label: 'Layanan malam', dataType: 'BOOLEAN', attributeRole: 'OPTION', pricingMode: 'FLAT_PER_OPTION', displayOrder: 2 },
        { subcategoryId: sub.id, attributeKey: 'jumlah_unit', label: 'Jumlah unit', dataType: 'NUMBER', attributeRole: 'OPTION', pricingMode: 'PER_UNIT', displayOrder: 3 },
      ],
    });
    return sub.id;
  }

  beforeEach(async () => {
    await resetDatabase();
    vi.restoreAllMocks();
    captureEmails();
    mockStorage();
    app = createApp();
    admin = await adminActor(app);
    individual = await approvedProvider(app, admin, 'INDIVIDUAL');
    business = await approvedProvider(app, admin, 'BUSINESS');
    subcategoryId = await newSubcategory();
  });

  const body = (extra: Record<string, unknown> = {}) => ({
    subcategory_id: subcategoryId,
    title: 'Cuci Mobil Kilat',
    price: 75000,
    estimated_duration_minutes: 90,
    attributes: { sumber_air: 'Dibawa penyedia' },
    ...extra,
  });

  const call = (owner: Actor, method: 'get' | 'post' | 'patch' | 'put' | 'delete', path = '') =>
    request(app)[method](`/api/v1/providers/me/listings${path}`).set(...auth(owner));

  async function created(owner: Actor, extra: Record<string, unknown> = {}): Promise<string> {
    const res = await call(owner, 'post').send(body(extra));
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body.data.id;
  }

  const offerSedan = (owner: Actor, id: string) =>
    call(owner, 'put', `/${id}/option-prices`).send({
      options: [{ attribute_key: 'jenis_kendaraan', option_value: 'Sedan', price_delta: 0 }],
    });

  const activate = (owner: Actor, id: string) => call(owner, 'patch', `/${id}`).send({ status: 'ACTIVE' });

  /** Pekerja ACTIVE tambahan di usaha BUSINESS, langsung lewat basis data. */
  async function activeWorker(provider: ApprovedProvider): Promise<string> {
    const user = await verifiedActor(app);
    const worker = await prisma.providerWorker.create({
      data: { providerProfileId: provider.providerId, userId: user.id, displayName: 'Pekerja Uji', membershipStatus: 'ACTIVE', approvedAt: new Date() },
    });
    return worker.id;
  }

  /** Listing BUSINESS yang tayang, dipetakan ke `workerIds`. */
  async function activeBusinessListing(workerIds: string[]): Promise<string> {
    const id = await created(business.owner);
    expect((await call(business.owner, 'put', `/${id}/workers`).send({ worker_ids: workerIds })).status).toBe(200);
    expect((await offerSedan(business.owner, id)).status).toBe(200);
    const res = await activate(business.owner, id);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    return id;
  }

  // -------------------------------------------------------------------------
  describe('membuat listing', () => {
    it('INDIVIDUAL langsung terpetakan ke pemiliknya, BUSINESS tidak; keduanya lahir DRAFT (D53)', async () => {
      const own = await call(individual.owner, 'get', `/${await created(individual.owner)}`);
      expect(own.body.data).toMatchObject({ status: 'DRAFT', workers: [{ id: individual.ownerWorkerId }] });

      const biz = await call(business.owner, 'get', `/${await created(business.owner)}`);
      expect(biz.body.data).toMatchObject({ status: 'DRAFT', workers: [] });
    });

    it('durasi wajib 15 sampai 720 menit (D90, H85)', async () => {
      for (const minutes of [14, 721, 60.5, undefined]) {
        const res = await call(individual.owner, 'post').send(body({ estimated_duration_minutes: minutes }));
        expect(res.status, String(minutes)).toBe(422);
      }
      for (const minutes of [15, 720]) {
        expect((await call(individual.owner, 'post').send(body({ estimated_duration_minutes: minutes }))).status).toBe(201);
      }
    });

    it('attributes hanya SPEC yang sah: key OPTION, key asing, dan SPEC wajib kosong ditolak', async () => {
      const cases = [
        { sumber_air: 'Dibawa penyedia', jenis_kendaraan: 'SUV' },
        { sumber_air: 'Dibawa penyedia', warna: 'Merah' },
        {},
        { sumber_air: 'Sumur' },
      ];
      for (const attributes of cases) {
        const res = await call(individual.owner, 'post').send(body({ attributes }));
        expect(res.status, JSON.stringify(attributes)).toBe(422);
        expect(res.body.error.code).toBe('ATTRIBUTE_VALIDATION_FAILED');
      }
    });

    it('sub-kategori nonaktif ditolak 422', async () => {
      await prisma.subcategory.update({ where: { id: subcategoryId }, data: { isActive: false } });
      expect((await call(individual.owner, 'post').send(body())).status).toBe(422);
    });

    it('minimal satu mode pemesanan, saat create maupun PATCH (usulan D baru)', async () => {
      const none = await call(individual.owner, 'post').send(body({ supports_scheduled: false, supports_available_now: false }));
      expect(none.status).toBe(422);

      const id = await created(individual.owner, { supports_scheduled: true, supports_available_now: false });
      expect((await call(individual.owner, 'patch', `/${id}`).send({ supports_scheduled: false })).status).toBe(422);
      const swapped = await call(individual.owner, 'patch', `/${id}`).send({ supports_scheduled: false, supports_available_now: true });
      expect(swapped.status).toBe(200);
      expect(swapped.body.data).toMatchObject({ supports_scheduled: false, supports_available_now: true });
    });

    it('subcategory_id tidak bisa diubah lewat PATCH', async () => {
      const id = await created(individual.owner);
      expect((await call(individual.owner, 'patch', `/${id}`).send({ subcategory_id: subcategoryId })).status).toBe(422);
    });
  });

  // -------------------------------------------------------------------------
  describe('KRITERIA: listing tanpa pekerja terpetakan tertahan di DRAFT (D53, V7)', () => {
    it('aktivasi butuh pekerja aktif, lalu OPTION wajib, baru tayang', async () => {
      const id = await created(business.owner);

      const noWorker = await activate(business.owner, id);
      expect(noWorker.status).toBe(409);
      expect(noWorker.body.error.code).toBe('LISTING_HAS_NO_WORKER');
      expect((await prisma.listing.findUniqueOrThrow({ where: { id } })).status).toBe('DRAFT');
      expect(await runVerificationQuery('V7')).toEqual([]);

      expect((await call(business.owner, 'put', `/${id}/workers`).send({ worker_ids: [business.ownerWorkerId] })).status).toBe(200);
      const noOption = await activate(business.owner, id);
      expect(noOption.status).toBe(422);
      expect(noOption.body.error.code).toBe('ATTRIBUTE_VALIDATION_FAILED');

      expect((await offerSedan(business.owner, id)).status).toBe(200);
      const ok = await activate(business.owner, id);
      expect(ok.status, JSON.stringify(ok.body)).toBe(200);
      expect(ok.body.data.status).toBe('ACTIVE');
      expect(await runVerificationQuery('V7')).toEqual([]);
    });

    it('pemetaan ke pelamar PENDING tidak dihitung', async () => {
      const id = await created(business.owner);
      const applicant = await verifiedActor(app);
      const pending = await prisma.providerWorker.create({
        data: { providerProfileId: business.providerId, userId: applicant.id, displayName: 'Pelamar', membershipStatus: 'PENDING' },
      });
      await prisma.workerListing.create({ data: { workerId: pending.id, listingId: id } });
      await offerSedan(business.owner, id);
      expect((await activate(business.owner, id)).status).toBe(409);
    });

    it('pekerja terakhir listing tayang tidak bisa dicabut, dari sisi listing maupun sisi pekerja', async () => {
      const id = await activeBusinessListing([business.ownerWorkerId]);

      const fromListing = await call(business.owner, 'put', `/${id}/workers`).send({ worker_ids: [] });
      expect(fromListing.status).toBe(409);
      expect(fromListing.body.error.code).toBe('LISTING_HAS_NO_WORKER');

      const fromWorker = await request(app)
        .put(`/api/v1/providers/me/workers/${business.ownerWorkerId}/listings`)
        .set(...auth(business.owner))
        .send({ listing_ids: [] });
      expect(fromWorker.status).toBe(409);
      expect(fromWorker.body.error.code).toBe('LISTING_HAS_NO_WORKER');
      expect(await runVerificationQuery('V7')).toEqual([]);

      // Setelah listing diturunkan, pemetaannya boleh dicabut.
      expect((await call(business.owner, 'patch', `/${id}`).send({ status: 'INACTIVE' })).status).toBe(200);
      expect((await call(business.owner, 'put', `/${id}/workers`).send({ worker_ids: [] })).status).toBe(200);
    });

    it('PUT dari sisi listing tidak menyentuh centangan pelamar PENDING (D52) dan menolak pekerja tak aktif', async () => {
      const id = await created(business.owner);
      const applicant = await verifiedActor(app);
      const pending = await prisma.providerWorker.create({
        data: { providerProfileId: business.providerId, userId: applicant.id, displayName: 'Pelamar', membershipStatus: 'PENDING' },
      });
      await prisma.workerListing.create({ data: { workerId: pending.id, listingId: id } });

      const rejected = await call(business.owner, 'put', `/${id}/workers`).send({ worker_ids: [pending.id] });
      expect(rejected.status).toBe(422);
      expect(rejected.body.error.code).toBe('WORKER_NOT_ASSIGNABLE');

      expect((await call(business.owner, 'put', `/${id}/workers`).send({ worker_ids: [business.ownerWorkerId] })).status).toBe(200);
      expect((await call(business.owner, 'put', `/${id}/workers`).send({ worker_ids: [] })).status).toBe(200);
      expect(await prisma.workerListing.count({ where: { listingId: id, workerId: pending.id } })).toBe(1);
    });

    it('pemetaan dari sisi pekerja mengganti seluruh listingnya', async () => {
      const a = await created(business.owner);
      const b = await created(business.owner);
      const worker = await activeWorker(business);
      const put = (listingIds: string[]) =>
        request(app).put(`/api/v1/providers/me/workers/${worker}/listings`).set(...auth(business.owner)).send({ listing_ids: listingIds });

      expect((await put([a, b])).body.data.listings.map((l: { id: string }) => l.id).sort()).toEqual([a, b].sort());
      expect((await put([b])).body.data.listings.map((l: { id: string }) => l.id)).toEqual([b]);
      const foreign = await createListing(individual.providerId, 'DRAFT');
      expect((await put([foreign])).status).toBe(422);
    });

    it('BALAPAN: dua pemilik mencabut dua pekerja terakhir bersamaan, tepat satu yang lolos', async () => {
      const second = await activeWorker(business);
      const id = await activeBusinessListing([business.ownerWorkerId, second]);

      // Transaksi uji berperan sebagai permintaan lain yang sedang mencabut
      // pekerja kedua sambil memegang kunci provider.
      let holding!: () => void;
      const locked = new Promise<void>((resolve) => (holding = resolve));
      const otherOwner = prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM provider_profiles WHERE id = ${business.providerId}::uuid FOR UPDATE`;
        holding();
        await new Promise((resolve) => setTimeout(resolve, 300));
        await tx.workerListing.deleteMany({ where: { listingId: id, workerId: second } });
      });
      await locked;

      const [res] = await Promise.all([
        request(app)
          .put(`/api/v1/providers/me/workers/${business.ownerWorkerId}/listings`)
          .set(...auth(business.owner))
          .send({ listing_ids: [] }),
        otherOwner,
      ]);

      expect(res.status, JSON.stringify(res.body)).toBe(409);
      expect(await runVerificationQuery('V7')).toEqual([]);
    });

    it('BALAPAN: aktivasi bersamaan dengan dicabutnya pekerja terakhir tetap tertahan di DRAFT', async () => {
      const id = await created(business.owner);
      expect((await call(business.owner, 'put', `/${id}/workers`).send({ worker_ids: [business.ownerWorkerId] })).status).toBe(200);
      expect((await offerSedan(business.owner, id)).status).toBe(200);

      let holding!: () => void;
      const locked = new Promise<void>((resolve) => (holding = resolve));
      const otherOwner = prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM provider_profiles WHERE id = ${business.providerId}::uuid FOR UPDATE`;
        holding();
        await new Promise((resolve) => setTimeout(resolve, 300));
        await tx.workerListing.deleteMany({ where: { listingId: id } });
      });
      await locked;

      const [res] = await Promise.all([activate(business.owner, id), otherOwner]);

      expect(res.status, JSON.stringify(res.body)).toBe(409);
      expect((await prisma.listing.findUniqueOrThrow({ where: { id } })).status).toBe('DRAFT');
      expect(await runVerificationQuery('V7')).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  describe('harga opsi (D72)', () => {
    it('opsi yang tidak dicentang jadi is_offered = false, tidak dihapus', async () => {
      const id = await created(individual.owner);
      const first = await call(individual.owner, 'put', `/${id}/option-prices`).send({
        options: [
          { attribute_key: 'jenis_kendaraan', option_value: 'Sedan', price_delta: 0 },
          { attribute_key: 'jenis_kendaraan', option_value: 'SUV', price_delta: 20000 },
          { attribute_key: 'layanan_malam', option_value: null, price_delta: 30000 },
          { attribute_key: 'jumlah_unit', option_value: null, price_delta: 15000 },
        ],
      });
      expect(first.status, JSON.stringify(first.body)).toBe(200);
      expect(first.body.data.option_prices).toHaveLength(4);

      const second = await offerSedan(individual.owner, id);
      expect(second.status).toBe(200);
      const rows = await prisma.listingOptionPrice.findMany({ where: { listingId: id } });
      expect(rows).toHaveLength(4);
      expect(rows.filter((row) => row.isOffered).map((row) => row.optionValue)).toEqual(['Sedan']);
      // Delta lama tetap tersimpan, tinggal dicentang lagi.
      expect(rows.find((row) => row.optionValue === 'SUV')?.priceDelta.toNumber()).toBe(20000);
    });

    it('delta negatif, value nonaktif atau asing, value pada BOOLEAN, key SPEC, kembar, dan OPTION wajib kosong ditolak', async () => {
      const id = await created(individual.owner);
      const sedan = { attribute_key: 'jenis_kendaraan', option_value: 'Sedan', price_delta: 0 };
      const cases = [
        [{ ...sedan, price_delta: -1 }],
        [{ ...sedan, option_value: 'Bus' }],
        [{ ...sedan, option_value: 'Truk' }],
        [sedan, { attribute_key: 'layanan_malam', option_value: 'ya', price_delta: 1000 }],
        [sedan, { attribute_key: 'sumber_air', option_value: 'Dibawa penyedia', price_delta: 0 }],
        [sedan, sedan],
        [{ attribute_key: 'layanan_malam', option_value: null, price_delta: 1000 }],
      ];
      for (const options of cases) {
        const res = await call(individual.owner, 'put', `/${id}/option-prices`).send({ options });
        expect(res.status, JSON.stringify(options)).toBe(422);
      }
      expect(await prisma.listingOptionPrice.count({ where: { listingId: id } })).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  describe('perubahan definisi (D67, H48)', () => {
    it('listing bertanda tidak bisa disimpan sampai atribut wajib baru dilengkapi', async () => {
      const id = await created(individual.owner);
      expect((await offerSedan(individual.owner, id)).status).toBe(200);
      const added = await request(app)
        .post(`/api/v1/admin/subcategories/${subcategoryId}/attributes`)
        .set(...auth(admin))
        .send({ attribute_key: 'luas_area', label: 'Luas area', data_type: 'NUMBER', is_required: true });
      expect(added.status, JSON.stringify(added.body)).toBe(201);
      expect((await prisma.listing.findUniqueOrThrow({ where: { id } })).attributesNeedUpdate).toBe(true);

      const titleOnly = await call(individual.owner, 'patch', `/${id}`).send({ title: 'Judul baru' });
      expect(titleOnly.status).toBe(422);
      expect(titleOnly.body.error.code).toBe('ATTRIBUTE_VALIDATION_FAILED');

      const filled = await call(individual.owner, 'patch', `/${id}`).send({
        title: 'Judul baru',
        attributes: { sumber_air: 'Dibawa penyedia', luas_area: 12 },
      });
      expect(filled.status, JSON.stringify(filled.body)).toBe(200);
      expect(filled.body.data).toMatchObject({ title: 'Judul baru', attributes_need_update: false });
    });

    it('OPTION wajib baru dilengkapi lewat option-prices, yang memadamkan penandanya', async () => {
      const id = await created(individual.owner);
      await prisma.listing.update({ where: { id }, data: { attributesNeedUpdate: true } });
      expect((await call(individual.owner, 'patch', `/${id}`).send({ title: 'Judul baru' })).status).toBe(422);

      const res = await offerSedan(individual.owner, id);
      expect(res.status).toBe(200);
      expect(res.body.data.attributes_need_update).toBe(false);
      expect((await call(individual.owner, 'patch', `/${id}`).send({ title: 'Judul baru' })).status).toBe(200);
    });

    it('listing bertanda tetap boleh diturunkan ke INACTIVE, tapi hanya itu (usulan D baru)', async () => {
      const id = await created(individual.owner);
      expect((await offerSedan(individual.owner, id)).status).toBe(200);
      expect((await activate(individual.owner, id)).status).toBe(200);
      await prisma.listing.update({ where: { id }, data: { attributesNeedUpdate: true } });
      await prisma.listingOptionPrice.updateMany({ where: { listingId: id }, data: { isOffered: false } });

      expect((await call(individual.owner, 'patch', `/${id}`).send({ status: 'INACTIVE', title: 'Libur' })).status).toBe(422);

      const paused = await call(individual.owner, 'patch', `/${id}`).send({ status: 'INACTIVE' });
      expect(paused.status, JSON.stringify(paused.body)).toBe(200);
      // Penandanya tetap menyala: belum ada yang dilengkapi.
      expect(paused.body.data).toMatchObject({ status: 'INACTIVE', attributes_need_update: true });

      expect((await activate(individual.owner, id)).status).toBe(422);
    });
  });

  // -------------------------------------------------------------------------
  describe('FAQ (D78, H73)', () => {
    const faqs = (n: number) => ({ faqs: Array.from({ length: n }, (_, i) => ({ question: `Tanya ${i}?`, answer: `Jawab ${i}` })) });

    it('melewati listing_faq_max_items ditolak, batasnya ikut setting, tulis ulang menonaktifkan yang lama', async () => {
      const id = await created(individual.owner);
      expect((await call(individual.owner, 'put', `/${id}/faqs`).send(faqs(11))).status).toBe(422);
      expect((await call(individual.owner, 'put', `/${id}/faqs`).send(faqs(10))).status).toBe(200);

      const rewritten = await call(individual.owner, 'put', `/${id}/faqs`).send(faqs(2));
      expect(rewritten.body.data.faqs.map((f: { question: string }) => f.question)).toEqual(['Tanya 0?', 'Tanya 1?']);
      expect(await prisma.listingFaq.count({ where: { listingId: id, isActive: false } })).toBe(10);
      expect(await runVerificationQuery('V12')).toEqual([]);

      await prisma.platformSetting.create({ data: { key: 'listing_faq_max_items', value: 3 } });
      expect((await call(individual.owner, 'put', `/${id}/faqs`).send(faqs(4))).status).toBe(422);
      expect((await call(individual.owner, 'put', `/${id}/faqs`).send(faqs(3))).status).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  describe('foto lewat signed URL (D80)', () => {
    it('signed-url di folder pemanggil, foto hanya dari URL itu', async () => {
      vi.spyOn(storage, 'createSignedUploadUrl').mockImplementation(
        async (bucket, path) => `https://storage.test/upload/${bucket}/${path}?token=t`,
      );
      const signed = await request(app).post('/api/v1/uploads/signed-url').set(...auth(individual.owner));
      expect(signed.status, JSON.stringify(signed.body)).toBe(201);
      expect(signed.body.data.file_url).toContain(`/${LISTING_PHOTO_BUCKET}/${individual.owner.id}/`);
      expect((await request(app).post('/api/v1/uploads/signed-url')).status).toBe(401);

      const id = await created(individual.owner);
      const otherUsers = storage.publicUrl(LISTING_PHOTO_BUCKET, `${business.owner.id}/00000000-0000-4000-8000-000000000000`);
      for (const fileUrl of ['https://contoh.com/foto.jpg', otherUsers, `${signed.body.data.file_url}/../x`]) {
        expect((await call(individual.owner, 'post', `/${id}/photos`).send({ file_url: fileUrl })).status, fileUrl).toBe(422);
      }

      const added = await call(individual.owner, 'post', `/${id}/photos`).send({ file_url: signed.body.data.file_url, caption: 'Depan' });
      expect(added.status, JSON.stringify(added.body)).toBe(201);
      expect(added.body.data.photos).toMatchObject([{ file_url: signed.body.data.file_url, is_primary: true }]);

      const photoId = added.body.data.photos[0].id;
      expect((await call(individual.owner, 'delete', `/${id}/photos/${photoId}`)).body.data.photos).toEqual([]);
      expect((await call(individual.owner, 'delete', `/${id}/photos/${photoId}`)).status).toBe(404);
    });

    it('cron H80 hanya menghapus berkas lama yang tidak dirujuk baris listing_photos', async () => {
      const listingId = await createListing(individual.providerId, 'DRAFT');
      await prisma.listingPhoto.create({
        data: { listingId, fileUrl: storage.publicUrl(LISTING_PHOTO_BUCKET, 'u1/lama-dirujuk') },
      });
      const now = new Date('2026-10-22T03:00:00Z');
      const old = '2026-10-20T00:00:00Z';
      const fresh = '2026-10-22T02:00:00Z';
      vi.spyOn(storage, 'list').mockImplementation(async (_bucket, prefix) =>
        prefix === ''
          ? [{ name: 'u1', id: null, created_at: null }]
          : [
              { name: 'lama-yatim', id: '1', created_at: old },
              { name: 'lama-dirujuk', id: '2', created_at: old },
              { name: 'baru-yatim', id: '3', created_at: fresh },
            ],
      );
      const remove = vi.spyOn(storage, 'remove').mockResolvedValue(undefined);

      expect(await cleanOrphanListingPhotos(now)).toEqual({ scanned: 3, removed: 1 });
      expect(remove).toHaveBeenCalledWith(LISTING_PHOTO_BUCKET, ['u1/lama-yatim']);
    });
  });

  // -------------------------------------------------------------------------
  describe('jalur publik, hapus, dan akses', () => {
    it('detail publik hanya untuk listing tayang, dan hanya opsi yang masih bisa dipilih', async () => {
      const id = await created(individual.owner);
      expect((await request(app).get(`/api/v1/listings/${id}`)).status).toBe(404);

      await call(individual.owner, 'put', `/${id}/option-prices`).send({
        options: [
          { attribute_key: 'jenis_kendaraan', option_value: 'Sedan', price_delta: 0 },
          { attribute_key: 'jenis_kendaraan', option_value: 'SUV', price_delta: 20000 },
        ],
      });
      await call(individual.owner, 'put', `/${id}/faqs`).send({ faqs: [{ question: 'Bawa air?', answer: 'Ya' }] });
      expect((await activate(individual.owner, id)).status).toBe(200);

      // Admin menonaktifkan SUV: listing tetap tayang (D67), opsi itu hilang dari publik.
      await prisma.subcategoryAttribute.updateMany({
        where: { subcategoryId, attributeKey: 'jenis_kendaraan' },
        data: { options: [{ value: 'Sedan', is_active: true }, { value: 'SUV', is_active: false }] },
      });

      const pub = await request(app).get(`/api/v1/listings/${id}`);
      expect(pub.status).toBe(200);
      expect(pub.body.data.option_prices.map((o: { option_value: string }) => o.option_value)).toEqual(['Sedan']);
      expect(pub.body.data).not.toHaveProperty('status');
      expect(pub.body.data).not.toHaveProperty('workers');
      expect((await call(individual.owner, 'get', `/${id}`)).body.data.option_prices).toHaveLength(2);
      expect((await request(app).get(`/api/v1/listings/${id}/faqs`)).body.data).toMatchObject([{ question: 'Bawa air?' }]);
    });

    it('soft delete: baris tetap ada, hilang dari publik dan dari daftar milik sendiri (D22)', async () => {
      const id = await created(individual.owner);
      await offerSedan(individual.owner, id);
      await activate(individual.owner, id);

      const deleted = await call(individual.owner, 'delete', `/${id}`);
      expect(deleted.status).toBe(200);
      expect((await prisma.listing.findUniqueOrThrow({ where: { id } })).deletedAt).not.toBeNull();
      expect((await request(app).get(`/api/v1/listings/${id}`)).status).toBe(404);
      expect((await call(individual.owner, 'get')).body.meta.total).toBe(0);
      expect((await call(individual.owner, 'delete', `/${id}`)).status).toBe(404);
      expect((await call(individual.owner, 'patch', `/${id}`).send({ title: 'Hidup lagi' })).status).toBe(404);
    });

    it('client biasa 403, tanpa token 401, provider lain 404 untuk baca maupun ubah', async () => {
      const id = await created(individual.owner);
      const client = await verifiedActor(app);
      expect((await call(client, 'post').send(body())).status).toBe(403);
      expect((await request(app).get('/api/v1/providers/me/listings')).status).toBe(401);

      expect((await call(business.owner, 'get', `/${id}`)).status).toBe(404);
      expect((await call(business.owner, 'patch', `/${id}`).send({ title: 'Rebut' })).status).toBe(404);
      expect((await offerSedan(business.owner, id)).status).toBe(404);
      expect((await call(business.owner, 'put', `/${id}/workers`).send({ worker_ids: [] })).status).toBe(404);
      expect((await call(business.owner, 'delete', `/${id}`)).status).toBe(404);

      const list = await call(individual.owner, 'get');
      expect(list.status).toBe(200);
      expect(list.body.data.map((l: { id: string }) => l.id)).toEqual([id]);
    });
  });
});
