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
import { prisma, type Prisma } from '@jasana/database';
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
    attribute_key: 'luas_area',
    label: 'Luas area',
    data_type: 'NUMBER',
    unit: 'm2',
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
    expect(validateSpecAttributes(attrs.body.data, { luas_area: 90 })).toEqual([]);
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
  describe('D100: durasi pada nilai opsi', () => {
    let subcategoryId: string;
    beforeEach(async () => {
      subcategoryId = await newSubcategory(await newCategory());
    });
    const create = (body: Record<string, unknown>) =>
      adminCall('post', `/subcategories/${subcategoryId}/attributes`).send(body);
    const patch = (id: string, body: Record<string, unknown>) =>
      adminCall('patch', `/subcategories/${subcategoryId}/attributes/${id}`).send(body);
    const paths = (res: request.Response) => res.body.error.details.map((d: { path: string }) => d.path);

    const durasi = (key = 'durasi_liputan', overrides: Record<string, unknown> = {}) => ({
      ...selectOption,
      attribute_key: key,
      label: 'Durasi liputan',
      options: [
        { value: '2 Jam', duration_minutes: 120 },
        { value: '4 Jam', duration_minutes: 240 },
      ],
      ...overrides,
    });

    it('duration_minutes tampil di respons admin dan publik, null untuk atribut tanpa durasi', async () => {
      const created = await create(durasi());
      expect(created.status, JSON.stringify(created.body)).toBe(201);
      expect(created.body.data.options).toEqual([
        { value: '2 Jam', is_active: true, duration_minutes: 120 },
        { value: '4 Jam', is_active: true, duration_minutes: 240 },
      ]);
      expect((await create(selectOption)).status).toBe(201);

      const attrs = await publicGet(`/subcategories/${subcategoryId}/attributes`);
      const byKey = Object.fromEntries(attrs.body.data.map((a: { attribute_key: string }) => [a.attribute_key, a]));
      expect(byKey.durasi_liputan.options[1]).toEqual({ value: '4 Jam', is_active: true, duration_minutes: 240 });
      expect(byKey.jenis_kendaraan.options[0]).toEqual({ value: 'Sedan', is_active: true, duration_minutes: null });
    });

    it.each([
      ['di bawah 15', 14],
      ['di atas 720', 721],
      ['bukan bilangan bulat', 90.5],
    ])('durasi %s ditolak 422', async (_name, minutes) => {
      const res = await create(durasi('durasi_liputan', { options: [{ value: '2 Jam', duration_minutes: minutes }] }));
      expect(res.status).toBe(422);
      expect(paths(res)).toEqual(['options.0.duration_minutes']);
    });

    it('aturan (1): MULTISELECT, SPEC, dan atribut opsional tidak boleh berdurasi', async () => {
      expect(paths(await create(durasi('a', { data_type: 'MULTISELECT' })))).toEqual(['options']);
      expect(paths(await create(durasi('b', { attribute_role: 'SPEC', pricing_mode: 'NONE' })))).toEqual(['options']);
      expect(paths(await create(durasi('c', { is_required: false })))).toEqual(['is_required']);
    });

    it('aturan (1): is_required tidak bisa dicabut selama ada durasi', async () => {
      const id = (await create(durasi())).body.data.id;
      const res = await patch(id, { is_required: false });
      expect(res.status).toBe(422);
      expect(paths(res)).toEqual(['is_required']);
      // Setelah durasinya dibuang, boleh.
      const cleared = await patch(id, { options: [{ value: '2 Jam' }, { value: '4 Jam' }], is_required: false });
      expect(cleared.status, JSON.stringify(cleared.body)).toBe(200);
    });

    it('aturan (2): maksimal satu atribut berdurasi aktif, lewat POST maupun PATCH (D103)', async () => {
      const first = (await create(durasi())).body.data.id;
      const second = await create(durasi('paket_durasi'));
      expect(second.status).toBe(422);
      expect(second.body.error.details[0].message).toContain('durasi_liputan');

      const plain = (await create(durasi('paket_durasi', { options: [{ value: 'A' }, { value: 'B' }] }))).body.data.id;
      const timed = { options: [{ value: 'A', duration_minutes: 60 }, { value: 'B', duration_minutes: 90 }] };
      expect((await patch(plain, timed)).status).toBe(422);

      // D103: yang nonaktif tidak dihitung, jalur D87 (nonaktifkan lalu ganti) tetap terbuka.
      expect((await patch(first, { is_active: false })).status).toBe(200);
      expect((await patch(plain, timed)).status).toBe(200);
      const reactivated = await patch(first, { is_active: true });
      expect(reactivated.status).toBe(422);
      expect(reactivated.body.error.details[0].message).toContain('paket_durasi');
    });

    // Dua request API biasa terlalu cepat untuk bertabrakan, jadi "admin lain"
    // disimulasikan transaksi yang memegang kunci sub-kategori lebih dulu, lalu
    // membuat atribut berdurasi setelah jeda. Tanpa kunci di assertSingleTimed,
    // POST membaca nol atribut berdurasi lain dan ikut lolos.
    it('aturan (2): dua atribut berdurasi dibuat bersamaan, tepat satu yang lolos', async () => {
      let holding!: () => void;
      const locked = new Promise<void>((resolve) => (holding = resolve));
      const anotherAdmin = prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM subcategories WHERE id = ${subcategoryId}::uuid FOR UPDATE`;
        holding();
        await new Promise((resolve) => setTimeout(resolve, 300));
        await tx.subcategoryAttribute.create({
          data: {
            subcategoryId,
            attributeKey: 'durasi_liputan',
            label: 'Durasi liputan',
            dataType: 'SELECT',
            attributeRole: 'OPTION',
            pricingMode: 'FLAT_PER_OPTION',
            isRequired: true,
            options: [{ value: '2 Jam', is_active: true, duration_minutes: 120 }],
          },
        });
      });
      await locked;
      const [res] = await Promise.all([create(durasi('paket_durasi')), anotherAdmin]);
      expect(res.status, JSON.stringify(res.body)).toBe(422);
      expect(res.body.error.details[0].message).toContain('durasi_liputan');
    });

    it('aturan (3): all-or-none di opsi aktif, mengaktifkan ulang opsi tanpa durasi ditolak (D103)', async () => {
      const partial = await create(durasi('durasi_liputan', { options: [{ value: '2 Jam', duration_minutes: 120 }, { value: '4 Jam' }] }));
      expect(paths(partial)).toEqual(['options']);

      const id = (
        await create(durasi('durasi_liputan', {
          options: [{ value: '2 Jam', duration_minutes: 120 }, { value: 'Dua Hari', is_active: false }],
        }))
      ).body.data.id;
      const res = await patch(id, { options: [{ value: '2 Jam', duration_minutes: 120 }, { value: 'Dua Hari' }] });
      expect(res.status).toBe(422);
      expect(res.body.error.details[0].message).toContain('Dua Hari');
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

    const listing = (attributes: Prisma.InputJsonObject, extra: Record<string, unknown> = {}) =>
      prisma.listing.create({
        data: { providerProfileId: providerId, subcategoryId, title: 'Listing lama', price: 100000, attributes, ...extra },
      });
    const flagOf = async (id: string) =>
      (await prisma.listing.findUniqueOrThrow({ where: { id } })).attributesNeedUpdate;

    it('atribut wajib menandai listing yang belum punya nilainya saja', async () => {
      const lacking = await listing({});
      const filled = await listing({ luas_area: 60 });
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

  it('seed Lampiran B idempotent: dijalankan dua kali, jumlahnya tetap 4, 12, 45 atribut aktif', async () => {
    const slugs = ['otomotif', 'fotografi', 'kecantikan', 'perbaikan'];
    const count = async () => ({
      categories: await prisma.category.count({ where: { slug: { in: slugs } } }),
      subcategories: await prisma.subcategory.count({ where: { category: { slug: { in: slugs } } } }),
      attributes: await prisma.subcategoryAttribute.count({
        // isActive: baris durasi_estimasi lama dinonaktifkan, bukan dihapus (D90).
        where: { isActive: true, subcategory: { category: { slug: { in: slugs } } } },
      }),
    });

    await prisma.$transaction((tx) => seedCatalog(tx), { timeout: 60_000 });
    const first = await count();
    await prisma.$transaction((tx) => seedCatalog(tx), { timeout: 60_000 });
    expect(await count()).toEqual(first);
    expect(first).toEqual({ categories: 4, subcategories: 12, attributes: 45 });

    const servisAc = await prisma.subcategory.findFirstOrThrow({ where: { slug: 'servis-ac' } });
    const attrs = await publicGet(`/subcategories/${servisAc.id}/attributes`);
    expect(attrs.body.data.map((a: { attribute_key: string }) => a.attribute_key)).toEqual([
      'jenis_pekerjaan',
      'jumlah_unit',
      'kapasitas_pk',
      'tambahan',
      'merek_dilayani',
    ]);

    // D100: durasi B.6 sampai ke respons publik, "Dua Hari" tidak ada.
    const liputan = await prisma.subcategory.findFirstOrThrow({ where: { slug: 'dokumentasi-acara' } });
    const b6 = await publicGet(`/subcategories/${liputan.id}/attributes`);
    const durasi = b6.body.data.find((a: { attribute_key: string }) => a.attribute_key === 'durasi_liputan');
    expect(durasi.options.map((o: { value: string; duration_minutes: number }) => [o.value, o.duration_minutes])).toEqual([
      ['2 Jam', 120],
      ['4 Jam', 240],
      ['8 Jam', 480],
    ]);
  });
});
