/**
 * Usulan taksonomi (D74).
 *
 *   H56  validasi bercabang per request_type
 *   H57  maksimal 3 usulan aktif per provider, lintas jenis
 *   D74  hanya provider VERIFIED; NEW_ATTRIBUTE disetujui selalu opsional;
 *        MERGED wajib catatan dan tautan
 *   Usulan D baru: sub-kategori hasil usulan lahir nonaktif
 */

import { randomInt } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '@jasana/database';
import { createApp } from '../src/app';
import type { MailMessage } from '../src/lib/mailer';
import { captureEmails, hasTestDatabase, resetDatabase } from './helpers/integration';
import {
  adminActor,
  approvedProvider,
  auth,
  mockStorage,
  submitProviderApplication,
  verifiedActor,
  type Actor,
  type ApprovedProvider,
} from './helpers/providers';

describe.skipIf(!hasTestDatabase)('usulan taksonomi', () => {
  let app: Express;
  let admin: Actor;
  let provider: ApprovedProvider;
  let sent: MailMessage[];
  let categoryId: string;
  let subcategoryId: string;

  const unique = () => `${Date.now()}-${randomInt(1e6)}`;

  beforeEach(async () => {
    await resetDatabase();
    vi.restoreAllMocks();
    sent = captureEmails().sent;
    mockStorage();
    app = createApp();
    admin = await adminActor(app);
    provider = await approvedProvider(app, admin);

    const suffix = unique();
    const category = await prisma.category.create({ data: { name: `Uji ${suffix}`, slug: `uji-kat-${suffix}` } });
    const subcategory = await prisma.subcategory.create({
      data: { categoryId: category.id, name: `Sub Uji ${suffix}`, slug: `uji-sub-${suffix}` },
    });
    await prisma.subcategoryAttribute.create({
      data: {
        subcategoryId: subcategory.id,
        attributeKey: 'jenis_kendaraan',
        label: 'Jenis kendaraan',
        dataType: 'SELECT',
        attributeRole: 'OPTION',
        pricingMode: 'FLAT_PER_OPTION',
        options: [{ value: 'Sedan', is_active: true }],
      },
    });
    categoryId = category.id;
    subcategoryId = subcategory.id;
  });

  const submit = (body: Record<string, unknown>, actor: Actor = provider.owner) =>
    request(app).post('/api/v1/taxonomy-requests').set(...auth(actor)).send(body);
  const decide = (id: string, body: Record<string, unknown>) =>
    request(app).patch(`/api/v1/admin/taxonomy-requests/${id}`).set(...auth(admin)).send(body);

  const newSubcategory = () => ({
    request_type: 'NEW_SUBCATEGORY',
    category_id: categoryId,
    proposed_name: 'Cuci Sofa Panggilan',
    work_description: 'Membersihkan sofa di rumah client',
    duration_min_minutes: 60,
    duration_max_minutes: 120,
    booking_mode_suggestion: 'BOTH',
    market_price_min: 100000,
    market_price_max: 300000,
  });
  const newAttribute = () => ({
    request_type: 'NEW_ATTRIBUTE',
    subcategory_id: subcategoryId,
    proposed_name: 'Ukuran velg',
    reason: 'Client sering menanyakan apakah velg besar dilayani',
    proposed_role: 'OPTION',
  });
  const newOption = (value = 'Minibus') => ({
    request_type: 'NEW_ATTRIBUTE_OPTION',
    subcategory_id: subcategoryId,
    attribute_key: 'jenis_kendaraan',
    proposed_name: value,
  });

  async function submitted(body: Record<string, unknown>): Promise<string> {
    const res = await submit(body);
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body.data.id;
  }

  const detailPaths = (res: request.Response) =>
    res.body.error.details.map((detail: { path: string }) => detail.path);

  // -------------------------------------------------------------------------
  describe('H56: validasi bercabang per request_type', () => {
    it('setiap jenis tersimpan dengan konteksnya', async () => {
      for (const body of [newSubcategory(), newAttribute(), newOption()]) {
        const res = await submit(body);
        expect(res.status, JSON.stringify(res.body)).toBe(201);
        expect(res.body.data).toMatchObject({ request_type: body.request_type, status: 'PENDING' });
      }
    });

    it.each([
      ['NEW_SUBCATEGORY tanpa category_id', () => ({ ...newSubcategory(), category_id: undefined }), 'category_id'],
      ['NEW_SUBCATEGORY tanpa work_description', () => ({ ...newSubcategory(), work_description: undefined }), 'work_description'],
      ['NEW_ATTRIBUTE tanpa subcategory_id', () => ({ ...newAttribute(), subcategory_id: undefined }), 'subcategory_id'],
      ['NEW_ATTRIBUTE tanpa reason', () => ({ ...newAttribute(), reason: undefined }), 'reason'],
      ['NEW_ATTRIBUTE_OPTION tanpa subcategory_id', () => ({ ...newOption(), subcategory_id: undefined }), 'subcategory_id'],
      ['NEW_ATTRIBUTE_OPTION tanpa attribute_key', () => ({ ...newOption(), attribute_key: undefined }), 'attribute_key'],
      ['request_type tidak dikenal', () => ({ ...newOption(), request_type: 'NEW_CATEGORY' }), 'request_type'],
      ['durasi min melebihi max', () => ({ ...newSubcategory(), duration_min_minutes: 200 }), 'duration_max_minutes'],
    ])('%s ditolak 422', async (_name, body, path) => {
      const res = await submit(body());
      expect(res.status).toBe(422);
      expect(detailPaths(res)).toContain(path);
    });

    it('field milik cabang lain dibuang, tidak tersimpan', async () => {
      const id = await submitted({ ...newSubcategory(), subcategory_id: subcategoryId, attribute_key: 'jenis_kendaraan' });
      const row = await prisma.taxonomyRequest.findUniqueOrThrow({ where: { id } });
      expect(row).toMatchObject({ categoryId, subcategoryId: null, attributeKey: null });
    });

    it('konteks harus ada: sub-kategori asing, atribut bukan pilihan, option yang sudah ada', async () => {
      const missing = await submit({ ...newAttribute(), subcategory_id: '00000000-0000-4000-8000-000000000000' });
      expect(missing.status).toBe(422);
      expect(detailPaths(missing)).toEqual(['subcategory_id']);

      expect(detailPaths(await submit({ ...newOption(), attribute_key: 'tidak_ada' }))).toEqual(['attribute_key']);
      expect(detailPaths(await submit(newOption('Sedan')))).toEqual(['proposed_name']);
    });
  });

  // -------------------------------------------------------------------------
  describe('H57: batas 3 usulan aktif lintas jenis', () => {
    it('tiga usulan berbeda jenis lolos, yang keempat 429, setelah satu diputus boleh lagi', async () => {
      const first = await submitted(newSubcategory());
      await submitted(newAttribute());
      await submitted(newOption());

      const fourth = await submit(newOption('Minivan'));
      expect(fourth.status).toBe(429);
      expect(fourth.body.error.code).toBe('TAXONOMY_REQUEST_LIMIT');

      expect((await decide(first, { decision: 'REJECTED', admin_note: 'Belum relevan' })).status).toBe(200);
      expect((await submit(newOption('Minivan'))).status).toBe(201);
    });

    it('lima kiriman bersamaan, tepat tiga yang lolos', async () => {
      const results = await Promise.all(
        ['A', 'B', 'C', 'D', 'E'].map((suffix) => submit(newOption(`Kendaraan ${suffix}`))),
      );
      const statuses = results.map((res) => res.status).sort();
      expect(statuses).toEqual([201, 201, 201, 429, 429]);
      expect(await prisma.taxonomyRequest.count({ where: { providerProfileId: provider.providerId, status: 'PENDING' } })).toBe(3);
    });

    it('batasnya per provider, bukan global', async () => {
      await submitted(newSubcategory());
      await submitted(newAttribute());
      await submitted(newOption());
      const other = await approvedProvider(app, admin);
      expect((await submit(newOption('Minivan'), other.owner)).status).toBe(201);
    });
  });

  // -------------------------------------------------------------------------
  it('hanya provider VERIFIED: client biasa dan pengajuan PENDING ditolak 403', async () => {
    const client = await verifiedActor(app);
    expect((await submit(newOption(), client)).status).toBe(403);

    const pending = await verifiedActor(app);
    await submitProviderApplication(app, pending);
    const res = await submit(newOption(), pending);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN_ACTOR');

    expect((await request(app).post('/api/v1/taxonomy-requests').send(newOption())).status).toBe(401);
  });

  // -------------------------------------------------------------------------
  describe('keputusan admin', () => {
    it('NEW_ATTRIBUTE disetujui selalu opsional walau admin mengirim is_required: true', async () => {
      const listing = await prisma.listing.create({
        data: { providerProfileId: provider.providerId, subcategoryId, title: 'Lama', price: 50000, attributes: {} },
      });
      const id = await submitted(newAttribute());

      const res = await decide(id, {
        decision: 'APPROVED',
        definition: {
          attribute_key: 'ukuran_velg',
          label: 'Ukuran velg',
          data_type: 'SELECT',
          attribute_role: 'OPTION',
          pricing_mode: 'FLAT_PER_OPTION',
          options: [{ value: '15 inci' }, { value: '17 inci' }],
          is_required: true,
        },
      });
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data.status).toBe('APPROVED');

      const attribute = await prisma.subcategoryAttribute.findUniqueOrThrow({ where: { id: res.body.data.resulting_id } });
      expect(attribute).toMatchObject({ attributeKey: 'ukuran_velg', isRequired: false });
      expect((await prisma.listing.findUniqueOrThrow({ where: { id: listing.id } })).attributesNeedUpdate).toBe(false);
    });

    it('definisi NEW_ATTRIBUTE yang melanggar D72 ditolak, usulan tetap PENDING', async () => {
      const id = await submitted(newAttribute());
      const res = await decide(id, {
        decision: 'APPROVED',
        definition: { attribute_key: 'ukuran_velg', label: 'Ukuran velg', data_type: 'TEXT', attribute_role: 'OPTION', pricing_mode: 'FLAT_PER_OPTION' },
      });
      expect(res.status).toBe(422);
      expect((await prisma.taxonomyRequest.findUniqueOrThrow({ where: { id } })).status).toBe('PENDING');

      const missing = await decide(id, { decision: 'APPROVED', definition: {} });
      expect(missing.status).toBe(422);
      expect(detailPaths(missing)).toContain('definition.attribute_key');
    });

    it('NEW_ATTRIBUTE_OPTION disetujui menambah option dan mengisi resulting_id', async () => {
      const id = await submitted(newOption('Minibus'));
      const res = await decide(id, { decision: 'APPROVED' });
      expect(res.status, JSON.stringify(res.body)).toBe(200);

      const attribute = await prisma.subcategoryAttribute.findUniqueOrThrow({ where: { id: res.body.data.resulting_id } });
      expect(attribute.attributeKey).toBe('jenis_kendaraan');
      expect(attribute.options).toEqual([
        { value: 'Sedan', is_active: true },
        { value: 'Minibus', is_active: true },
      ]);
    });

    // -----------------------------------------------------------------------
    // `options` dibaca, diubah, lalu ditulis ulang. Dua request API biasa
    // terlalu cepat untuk memperlihatkan balapannya, jadi "admin lain"
    // disimulasikan transaksi yang memegang kunci baris atribut lebih dulu,
    // lalu menulis setelah jeda. Tanpa lockAttribute, request API membaca
    // array lama dan menimpa tulisan admin lain begitu kuncinya lepas.
    // -----------------------------------------------------------------------
    async function attributeRow() {
      return prisma.subcategoryAttribute.findFirstOrThrow({ where: { subcategoryId, attributeKey: 'jenis_kendaraan' } });
    }

    async function whileAnotherAdminAdds<T>(value: string, call: () => Promise<T>): Promise<T> {
      const { id } = await attributeRow();
      let holding!: () => void;
      const locked = new Promise<void>((resolve) => (holding = resolve));
      const anotherAdmin = prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM subcategory_attributes WHERE id = ${id}::uuid FOR UPDATE`;
        holding();
        await new Promise((resolve) => setTimeout(resolve, 300));
        await tx.subcategoryAttribute.update({
          where: { id },
          data: { options: [{ value: 'Sedan', is_active: true }, { value, is_active: true }] },
        });
      });
      await locked;
      const [result] = await Promise.all([call(), anotherAdmin]);
      return result;
    }

    const optionValues = async () =>
      ((await attributeRow()).options as { value: string }[]).map((option) => option.value).sort();

    it('persetujuan option bersamaan dengan tulisan admin lain: kedua value tersimpan', async () => {
      const id = await submitted(newOption('Minibus'));
      const res = await whileAnotherAdminAdds('Minivan', () => decide(id, { decision: 'APPROVED' }));
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(await optionValues()).toEqual(['Minibus', 'Minivan', 'Sedan']);
    });

    it('PATCH options bersamaan dengan tulisan admin lain: tidak menghapus value yang baru masuk (D67)', async () => {
      const { id } = await attributeRow();
      const res = await whileAnotherAdminAdds('Minivan', () =>
        request(app)
          .patch(`/api/v1/admin/subcategories/${subcategoryId}/attributes/${id}`)
          .set(...auth(admin))
          .send({ options: [{ value: 'Sedan' }, { value: 'Van' }] }),
      );
      // PATCH melihat Minivan setelah menunggu kunci, jadi daftarnya ditolak.
      expect(res.status).toBe(422);
      expect(res.body.error.details[0].message).toContain('Minivan');
      expect(await optionValues()).toEqual(['Minivan', 'Sedan']);
    });

    it('NEW_SUBCATEGORY disetujui lahir nonaktif, baru tampil publik setelah diaktifkan admin', async () => {
      const id = await submitted(newSubcategory());
      const res = await decide(id, {
        decision: 'APPROVED',
        definition: { slug: `uji-sofa-${unique()}`, suggested_price_min: 100000, suggested_price_max: 300000 },
      });
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      const newId = res.body.data.resulting_id;

      const created = await prisma.subcategory.findUniqueOrThrow({ where: { id: newId } });
      expect(created).toMatchObject({ name: 'Cuci Sofa Panggilan', categoryId, isActive: false });

      const listed = async () =>
        (await request(app).get(`/api/v1/categories/${categoryId}/subcategories`)).body.data.map((s: { id: string }) => s.id);
      expect(await listed()).not.toContain(newId);
      expect((await request(app).get(`/api/v1/subcategories/${newId}/attributes`)).status).toBe(404);

      // Admin melengkapi atribut, lalu mengaktifkan.
      const attr = await request(app)
        .post(`/api/v1/admin/subcategories/${newId}/attributes`)
        .set(...auth(admin))
        .send({ attribute_key: 'jumlah_dudukan', label: 'Jumlah dudukan', data_type: 'NUMBER', attribute_role: 'OPTION', pricing_mode: 'PER_UNIT' });
      expect(attr.status).toBe(201);
      const activated = await request(app).patch(`/api/v1/admin/subcategories/${newId}`).set(...auth(admin)).send({ is_active: true });
      expect(activated.status).toBe(200);

      expect(await listed()).toContain(newId);
      expect((await request(app).get(`/api/v1/subcategories/${newId}/attributes`)).body.data).toHaveLength(1);
    });

    it('MERGED wajib admin_note dan resulting_id yang ada; email memuat tautan', async () => {
      const id = await submitted(newSubcategory());
      expect(detailPaths(await decide(id, { decision: 'MERGED', resulting_id: subcategoryId }))).toContain('admin_note');
      expect(detailPaths(await decide(id, { decision: 'MERGED', admin_note: 'Sudah ada' }))).toContain('resulting_id');
      expect(
        detailPaths(
          await decide(id, { decision: 'MERGED', admin_note: 'Sudah ada', resulting_id: '00000000-0000-4000-8000-000000000000' }),
        ),
      ).toEqual(['resulting_id']);

      const res = await decide(id, { decision: 'MERGED', admin_note: 'Sudah ada sebagai sub-kategori lain', resulting_id: subcategoryId });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ status: 'MERGED', resulting_id: subcategoryId });

      // Pemilik juga menerima email verifikasi dan keputusan e-KYC sebelumnya.
      const decisionMail = () =>
        sent.find((mail) => mail.to === provider.owner.email && mail.subject.includes('Cuci Sofa Panggilan'));
      await vi.waitFor(() => expect(decisionMail()).toBeDefined());
      expect(decisionMail()!.text).toContain(`/subcategories/${subcategoryId}`);
      const notification = await prisma.notification.findFirstOrThrow({ where: { referenceId: id } });
      expect(notification).toMatchObject({ type: 'TAXONOMY_REQUEST', channel: 'EMAIL', referenceType: 'taxonomy_request' });
      await vi.waitFor(async () =>
        expect((await prisma.notification.findUniqueOrThrow({ where: { id: notification.id } })).emailStatus).toBe('SENT'),
      );
    });

    it('REJECTED tanpa admin_note 422; memutus dua kali 409', async () => {
      const id = await submitted(newOption());
      expect((await decide(id, { decision: 'REJECTED' })).status).toBe(422);
      expect((await decide(id, { decision: 'REJECTED', admin_note: 'Hanya relevan untuk satu penyedia' })).status).toBe(200);

      const again = await decide(id, { decision: 'APPROVED' });
      expect(again.status).toBe(409);
      expect(again.body.error.code).toBe('TAXONOMY_REQUEST_STATE_CONFLICT');
    });

    it('antrean admin: default PENDING, filter jenis, provider tidak boleh 403', async () => {
      await submitted(newSubcategory());
      await submitted(newOption());
      const all = await request(app).get('/api/v1/admin/taxonomy-requests').set(...auth(admin));
      expect(all.status).toBe(200);
      expect(all.body.meta.total).toBe(2);

      const options = await request(app)
        .get('/api/v1/admin/taxonomy-requests?request_type=NEW_ATTRIBUTE_OPTION')
        .set(...auth(admin));
      expect(options.body.data.map((r: { request_type: string }) => r.request_type)).toEqual(['NEW_ATTRIBUTE_OPTION']);

      expect((await request(app).get('/api/v1/admin/taxonomy-requests').set(...auth(provider.owner))).status).toBe(403);
    });
  });

  it('mine hanya berisi usulan milik sendiri', async () => {
    await submitted(newOption());
    const other = await approvedProvider(app, admin);
    await submit(newOption('Minivan'), other.owner);

    const mine = await request(app).get('/api/v1/taxonomy-requests/mine').set(...auth(provider.owner));
    expect(mine.status).toBe(200);
    expect(mine.body.data.map((r: { proposed_name: string }) => r.proposed_name)).toEqual(['Minibus']);
    expect(mine.body.meta.total).toBe(1);
  });
});
