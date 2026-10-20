/**
 * Katalog Fase 3.
 *
 *   KRITERIA PRD 9  sub-kategori baru beserta atribut berbayar bisa
 *                   ditambah tanpa migrasi
 *   D72             kombinasi peran, tipe, dan pricing_mode
 *   D67             empat aturan perubahan definisi
 *   Lampiran B      seed idempotent
 */

import { randomInt } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { validateSpecAttributes } from '../src/modules/catalog/attribute-rules';
import { captureEmails, hasTestDatabase, resetDatabase } from './helpers/integration';
import {
  adminActor,
  approvedProvider,
  auth,
  mockStorage,
  verifiedActor,
  type Actor,
} from './helpers/providers';
// @ts-expect-error berkas .mjs tanpa deklarasi tipe
import { seedCatalog } from '../../../scripts/seed-catalog.mjs';

describe.skipIf(!hasTestDatabase)('katalog', () => {
  let app: Express;
  let admin: Actor;

  beforeEach(async () => {
    await resetDatabase();
    vi.restoreAllMocks();
    captureEmails();
    // approvedProvider mengunggah e-KYC; Storage disadap, bukan dipanggil.
    mockStorage();
    app = createApp();
    admin = await adminActor(app);
  });

  const adminCall = (method: 'post' | 'patch' | 'delete', path: string) =>
    request(app)[method](`/api/v1/admin${path}`).set(...auth(admin));
  const publicGet = (path: string) => request(app).get(`/api/v1${path}`);
  const unique = () => `${Date.now()}-${randomInt(1e6)}`;

  async function newCategory(): Promise<string> {
    const suffix = unique();
    const res = await adminCall('post', '/categories').send({ name: `Uji ${suffix}`, slug: `uji-kat-${suffix}` });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body.data.id;
  }

  async function newSubcategory(categoryId: string): Promise<string> {
    const suffix = unique();
    const res = await adminCall('post', '/subcategories').send({
      category_id: categoryId,
      name: `Sub Uji ${suffix}`,
      slug: `uji-sub-${suffix}`,
    });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body.data.id;
  }

  const selectOption = {
    attribute_key: 'jenis_kendaraan',
    label: 'Jenis kendaraan',
    data_type: 'SELECT',
    attribute_role: 'OPTION',
    pricing_mode: 'FLAT_PER_OPTION',
    options: [{ value: 'Sedan' }, { value: 'SUV' }],
    is_required: true,
    is_filterable: true,
  };

  const specNumber = (overrides: Record<string, unknown> = {}) => ({
    attribute_key: 'durasi_estimasi',
    label: 'Estimasi pengerjaan',
    data_type: 'NUMBER',
    unit: 'menit',
    validation_rule: { min: 30, max: 180 },
    ...overrides,
  });

  // -------------------------------------------------------------------------
  it('KRITERIA: sub-kategori baru beserta atribut berbayar ditambah lewat API, tanpa migrasi', async () => {
    const migrationsBefore = await prisma.$queryRaw<{ n: bigint }[]>`SELECT COUNT(*) AS n FROM _prisma_migrations`;
    const categoryId = await newCategory();
    const subcategoryId = await newSubcategory(categoryId);

    const created = await Promise.all([
      adminCall('post', `/subcategories/${subcategoryId}/attributes`).send(selectOption),
      adminCall('post', `/subcategories/${subcategoryId}/attributes`).send({
        attribute_key: 'jumlah_unit',
        label: 'Jumlah unit',
        data_type: 'NUMBER',
        attribute_role: 'OPTION',
        pricing_mode: 'PER_UNIT',
        is_required: true,
        validation_rule: { min: 1, max: 20 },
      }),
      adminCall('post', `/subcategories/${subcategoryId}/attributes`).send(specNumber({ is_required: true })),
    ]);
    for (const res of created) expect(res.status, JSON.stringify(res.body)).toBe(201);

    // Publik langsung melihatnya, tanpa restart dan tanpa perubahan skema.
    const subs = await publicGet(`/categories/${categoryId}/subcategories`);
    expect(subs.body.data.map((sub: { id: string }) => sub.id)).toEqual([subcategoryId]);

    const attrs = await publicGet(`/subcategories/${subcategoryId}/attributes`);
    expect(attrs.status).toBe(200);
    expect(attrs.body.data).toHaveLength(3);
    const byKey = Object.fromEntries(attrs.body.data.map((attr: { attribute_key: string }) => [attr.attribute_key, attr]));
    expect(byKey.jenis_kendaraan).toMatchObject({ attribute_role: 'OPTION', pricing_mode: 'FLAT_PER_OPTION' });
    expect(byKey.jumlah_unit).toMatchObject({ attribute_role: 'OPTION', pricing_mode: 'PER_UNIT' });

    // Definisi yang dibaca publik langsung bisa dipakai memvalidasi listing (Fase 4).
    expect(validateSpecAttributes(attrs.body.data, { durasi_estimasi: 90 })).toEqual([]);
    expect(validateSpecAttributes(attrs.body.data, {})).toHaveLength(1);

    const migrationsAfter = await prisma.$queryRaw<{ n: bigint }[]>`SELECT COUNT(*) AS n FROM _prisma_migrations`;
    expect(migrationsAfter[0]!.n).toBe(migrationsBefore[0]!.n);
  });

  // -------------------------------------------------------------------------
  describe('definisi atribut (D72)', () => {
    let subcategoryId: string;
    beforeEach(async () => {
      subcategoryId = await newSubcategory(await newCategory());
    });
    const create = (body: Record<string, unknown>) =>
      adminCall('post', `/subcategories/${subcategoryId}/attributes`).send(body);

    it.each([
      ['SPEC berbayar', { ...selectOption, attribute_role: 'SPEC' }],
      ['OPTION NUMBER FLAT', { ...specNumber(), attribute_role: 'OPTION', pricing_mode: 'FLAT_PER_OPTION' }],
      ['OPTION SELECT PER_UNIT', { ...selectOption, pricing_mode: 'PER_UNIT' }],
      ['OPTION TEXT', { attribute_key: 'catatan', label: 'Catatan', data_type: 'TEXT', attribute_role: 'OPTION', pricing_mode: 'FLAT_PER_OPTION' }],
    ])('%s ditolak 422', async (_name, body) => {
      const res = await create(body);
      expect(res.status).toBe(422);
      expect(res.body.error.details.map((d: { path: string }) => d.path)).toContain('pricing_mode');
    });

    it('attribute_key bukan snake_case dan key kembar ditolak 422', async () => {
      expect((await create({ ...selectOption, attribute_key: 'JenisKendaraan' })).status).toBe(422);
      expect((await create(selectOption)).status).toBe(201);
      const twin = await create(selectOption);
      expect(twin.status).toBe(422);
      expect(twin.body.error.details).toEqual([{ path: 'attribute_key', message: 'attribute_key sudah dipakai' }]);
    });

    it('attribute_key, data_type, attribute_role, dan pricing_mode tidak berubah lewat PATCH', async () => {
      const id = (await create(selectOption)).body.data.id;
      const res = await adminCall('patch', `/subcategories/${subcategoryId}/attributes/${id}`).send({
        label: 'Tipe kendaraan',
        attribute_key: 'tipe_kendaraan',
        data_type: 'MULTISELECT',
        attribute_role: 'SPEC',
        pricing_mode: 'NONE',
      });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        label: 'Tipe kendaraan',
        attribute_key: 'jenis_kendaraan',
        data_type: 'SELECT',
        attribute_role: 'OPTION',
        pricing_mode: 'FLAT_PER_OPTION',
      });
    });

    it('option tidak bisa dihapus, hanya dinonaktifkan, dan yang nonaktif hilang dari publik', async () => {
      const id = (await create(selectOption)).body.data.id;
      const path = `/subcategories/${subcategoryId}/attributes/${id}`;

      const dropped = await adminCall('patch', path).send({ options: [{ value: 'Sedan' }] });
      expect(dropped.status).toBe(422);
      expect(dropped.body.error.details[0].message).toContain('SUV');

      const deactivated = await adminCall('patch', path).send({
        options: [{ value: 'Sedan' }, { value: 'SUV', is_active: false }, { value: 'Van' }],
      });
      expect(deactivated.status, JSON.stringify(deactivated.body)).toBe(200);
      expect(deactivated.body.data.options).toHaveLength(3);

      const attrs = await publicGet(`/subcategories/${subcategoryId}/attributes`);
      expect(attrs.body.data[0].options.map((o: { value: string }) => o.value)).toEqual(['Sedan', 'Van']);
    });

    it('DELETE atribut bersifat soft: hilang dari publik, barisnya tetap ada', async () => {
      const id = (await create(selectOption)).body.data.id;
      const res = await adminCall('delete', `/subcategories/${subcategoryId}/attributes/${id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.is_active).toBe(false);
      expect((await publicGet(`/subcategories/${subcategoryId}/attributes`)).body.data).toEqual([]);
      expect(await prisma.subcategoryAttribute.findUnique({ where: { id } })).not.toBeNull();
    });

    it('atribut milik sub-kategori lain 404', async () => {
      const id = (await create(selectOption)).body.data.id;
      const other = await newSubcategory(await newCategory());
      expect((await adminCall('patch', `/subcategories/${other}/attributes/${id}`).send({ label: 'x' })).status).toBe(404);
    });
  });

  // -------------------------------------------------------------------------
  describe('D67: atribut wajib baru menandai listing lama, tanpa backfill', () => {
    let subcategoryId: string;
    let providerId: string;

    beforeEach(async () => {
      subcategoryId = await newSubcategory(await newCategory());
      providerId = (await approvedProvider(app, admin)).providerId;
    });

    const listing = (attributes: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
      prisma.listing.create({
        data: { providerProfileId: providerId, subcategoryId, title: 'Listing lama', price: 100000, attributes, ...extra },
      });
    const flagOf = async (id: string) =>
      (await prisma.listing.findUniqueOrThrow({ where: { id } })).attributesNeedUpdate;

    it('atribut wajib menandai listing yang belum punya nilainya saja', async () => {
      const lacking = await listing({});
      const filled = await listing({ durasi_estimasi: 60 });
      const deleted = await listing({}, { deletedAt: new Date() });

      const res = await adminCall('post', `/subcategories/${subcategoryId}/attributes`).send(
        specNumber({ is_required: true }),
      );
      expect(res.status).toBe(201);

      expect(await flagOf(lacking.id)).toBe(true);
      expect(await flagOf(filled.id)).toBe(false);
      expect(await flagOf(deleted.id)).toBe(false);
      // Poin 4: tidak ada nilai yang diisikan atas nama provider.
      expect((await prisma.listing.findUniqueOrThrow({ where: { id: lacking.id } })).attributes).toEqual({});
    });

    it('atribut opsional tidak menandai apa pun, lalu menandai saat dijadikan wajib', async () => {
      const lacking = await listing({});
      const created = await adminCall('post', `/subcategories/${subcategoryId}/attributes`).send(specNumber());
      expect(await flagOf(lacking.id)).toBe(false);

      await adminCall('patch', `/subcategories/${subcategoryId}/attributes/${created.body.data.id}`).send({
        is_required: true,
      });
      expect(await flagOf(lacking.id)).toBe(true);
    });

    it('atribut OPTION wajib menandai listing yang belum menawarkan opsinya', async () => {
      const lacking = await listing({});
      const offering = await listing({});
      await prisma.listingOptionPrice.create({
        data: { listingId: offering.id, attributeKey: 'jenis_kendaraan', optionValue: 'Sedan', priceDelta: 0 },
      });

      await adminCall('post', `/subcategories/${subcategoryId}/attributes`).send(selectOption);
      expect(await flagOf(lacking.id)).toBe(true);
      expect(await flagOf(offering.id)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('kategori dan sub-kategori', () => {
    it('DELETE soft menyembunyikan dari publik', async () => {
      const categoryId = await newCategory();
      const subcategoryId = await newSubcategory(categoryId);

      expect((await adminCall('delete', `/subcategories/${subcategoryId}`)).body.data.is_active).toBe(false);
      expect((await publicGet(`/categories/${categoryId}/subcategories`)).body.data).toEqual([]);
      expect((await publicGet(`/subcategories/${subcategoryId}/attributes`)).status).toBe(404);

      await adminCall('delete', `/categories/${categoryId}`);
      const categories = await publicGet('/categories');
      expect(categories.body.data.map((c: { id: string }) => c.id)).not.toContain(categoryId);
      expect((await publicGet(`/categories/${categoryId}/subcategories`)).status).toBe(404);
    });

    it('slug kembar 422, harga acuan min melebihi max 422 juga lewat PATCH', async () => {
      const categoryId = await newCategory();
      const category = await prisma.category.findUniqueOrThrow({ where: { id: categoryId } });
      const twin = await adminCall('post', '/categories').send({ name: `Uji lain ${unique()}`, slug: category.slug });
      expect(twin.status).toBe(422);
      expect(twin.body.error.details[0].path).toBe('slug');

      const subcategoryId = await newSubcategory(categoryId);
      await adminCall('patch', `/subcategories/${subcategoryId}`).send({ suggested_price_max: 100000 });
      const inverted = await adminCall('patch', `/subcategories/${subcategoryId}`).send({ suggested_price_min: 200000 });
      expect(inverted.status).toBe(422);
    });

    it('sub-kategori di kategori yang tidak ada 422, id tidak ada 404', async () => {
      const res = await adminCall('post', '/subcategories').send({
        category_id: '00000000-0000-4000-8000-000000000000',
        name: 'Yatim',
        slug: `uji-yatim-${unique()}`,
      });
      expect(res.status).toBe(422);
      expect((await adminCall('patch', '/categories/00000000-0000-4000-8000-000000000000').send({ name: 'x y' })).status).toBe(404);
    });
  });

  // -------------------------------------------------------------------------
  it('akses: client biasa dan provider 403, tanpa token 401, endpoint publik tanpa token', async () => {
    const client = await verifiedActor(app);
    const provider = await approvedProvider(app, admin);
    const body = { name: 'Tidak boleh', slug: 'uji-tidak-boleh' };

    expect((await request(app).post('/api/v1/admin/categories').send(body)).status).toBe(401);
    expect((await request(app).post('/api/v1/admin/categories').set(...auth(client)).send(body)).status).toBe(403);
    expect((await request(app).post('/api/v1/admin/categories').set(...auth(provider.owner)).send(body)).status).toBe(403);
    expect((await publicGet('/categories')).status).toBe(200);
    expect((await publicGet('/subcategories/bukan-uuid/attributes')).status).toBe(422);
  });

  it('seed Lampiran B idempotent: dijalankan dua kali, jumlahnya tetap 4, 12, 56', async () => {
    const slugs = ['otomotif', 'fotografi', 'kecantikan', 'perbaikan'];
    const count = async () => ({
      categories: await prisma.category.count({ where: { slug: { in: slugs } } }),
      subcategories: await prisma.subcategory.count({ where: { category: { slug: { in: slugs } } } }),
      attributes: await prisma.subcategoryAttribute.count({
        where: { subcategory: { category: { slug: { in: slugs } } } },
      }),
    });

    await prisma.$transaction((tx) => seedCatalog(tx), { timeout: 60_000 });
    const first = await count();
    await prisma.$transaction((tx) => seedCatalog(tx), { timeout: 60_000 });
    expect(await count()).toEqual(first);
    expect(first).toEqual({ categories: 4, subcategories: 12, attributes: 56 });

    const servisAc = await prisma.subcategory.findFirstOrThrow({ where: { slug: 'servis-ac' } });
    const attrs = await publicGet(`/subcategories/${servisAc.id}/attributes`);
    expect(attrs.body.data.map((a: { attribute_key: string }) => a.attribute_key)).toEqual([
      'jenis_pekerjaan',
      'jumlah_unit',
      'kapasitas_pk',
      'tambahan',
      'merek_dilayani',
      'durasi_estimasi',
    ]);
  });
});
