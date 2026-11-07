/**
 * Fase 5: GET /listings.
 *
 *   D96   hanya listing tayang milik provider VERIFIED
 *   D98   client di dalam service_radius_km, jarak dari basis atau pekerja
 *         online terdekat, radius_km penyaring opsional
 *   D45   available_now turunan, termasuk predikat in-flight
 *   H18   filter SPEC lewat @> (GIN), OPTION lewat listing_option_prices
 *   D-A   seluruh input sebagai parameter terikat (uji injeksi)
 *
 * Data dibuat langsung lewat Prisma: yang diuji pencariannya, bukan alur
 * e-KYC dan pemetaan yang sudah diuji Fase 2 dan 4.
 */

import { randomInt } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma, type Prisma } from '@jasana/database';
import { createApp } from '../src/app';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import { presence } from '../src/realtime/presence';

/** Puputan Renon, Denpasar. */
const CLIENT = { lat: -8.6725, lng: 115.234 };
/** Derajat per km di sekitar Denpasar. */
const LAT_PER_KM = 1 / 111.195;
const LNG_PER_KM = 1 / (111.195 * Math.cos((CLIENT.lat * Math.PI) / 180));
const north = (km: number) => ({ lat: CLIENT.lat + km * LAT_PER_KM, lng: CLIENT.lng });
const south = (km: number) => ({ lat: CLIENT.lat - km * LAT_PER_KM, lng: CLIENT.lng });
const east = (km: number) => ({ lat: CLIENT.lat, lng: CLIENT.lng + km * LNG_PER_KM });

const opts = (...values: string[]) => values.map((value) => ({ value, is_active: true }));
const INJECTION = `x' OR '1'='1"; DROP TABLE listings; --`;

describe.skipIf(!hasTestDatabase)('pencarian listing', () => {
  let app: Express;
  let subcategoryId: string;
  let categoryId: string;

  // -------------------------------------------------------------------------
  // Fixture
  // -------------------------------------------------------------------------

  async function newUser() {
    const n = randomInt(1e9);
    return prisma.user.create({
      data: { fullName: `Uji ${n}`, email: `cari-${n}@uji.test`, phone: `+6281${n}`, passwordHash: 'x', emailVerifiedAt: new Date() },
    });
  }

  async function newSubcategory() {
    const n = randomInt(1e9);
    const category = await prisma.category.create({ data: { name: `Kat ${n}`, slug: `uji-kat-${n}` } });
    const sub = await prisma.subcategory.create({ data: { categoryId: category.id, name: `Sub ${n}`, slug: `uji-sub-${n}` } });
    await prisma.subcategoryAttribute.createMany({
      data: [
        { subcategoryId: sub.id, attributeKey: 'sumber_air', label: 'Sumber air', dataType: 'SELECT', attributeRole: 'SPEC', pricingMode: 'NONE', options: opts('Dibawa', 'Client'), isFilterable: true },
        { subcategoryId: sub.id, attributeKey: 'merek', label: 'Merek', dataType: 'MULTISELECT', attributeRole: 'SPEC', pricingMode: 'NONE', options: opts('Daikin', 'LG', 'Sharp'), isFilterable: true },
        { subcategoryId: sub.id, attributeKey: 'catatan', label: 'Catatan', dataType: 'TEXT', attributeRole: 'SPEC', pricingMode: 'NONE', isFilterable: true },
        { subcategoryId: sub.id, attributeKey: 'rahasia', label: 'Rahasia', dataType: 'TEXT', attributeRole: 'SPEC', pricingMode: 'NONE', isFilterable: false },
        { subcategoryId: sub.id, attributeKey: 'jenis', label: 'Jenis', dataType: 'SELECT', attributeRole: 'OPTION', pricingMode: 'FLAT_PER_OPTION', options: [...opts('Sedan', 'SUV'), { value: 'Bus', is_active: false }], isFilterable: true },
        { subcategoryId: sub.id, attributeKey: 'malam', label: 'Malam', dataType: 'BOOLEAN', attributeRole: 'OPTION', pricingMode: 'FLAT_PER_OPTION', isFilterable: true },
      ],
    });
    return sub;
  }

  interface ProviderOpts {
    base?: { lat: number; lng: number } | null;
    radiusKm?: number;
    status?: 'VERIFIED' | 'SUSPENDED' | 'PENDING';
  }

  /** Provider beserta baris pekerja pemiliknya (ACTIVE, offline). */
  async function newProvider({ base = CLIENT, radiusKm = 10, status = 'VERIFIED' }: ProviderOpts = {}) {
    const user = await newUser();
    const profile = await prisma.providerProfile.create({
      data: {
        userId: user.id,
        businessName: `Usaha ${user.fullName}`,
        verificationStatus: status,
        baseLatitude: base?.lat ?? null,
        baseLongitude: base?.lng ?? null,
        serviceRadiusKm: radiusKm,
      },
    });
    const owner = await prisma.providerWorker.create({
      data: { providerProfileId: profile.id, userId: user.id, displayName: user.fullName, isOwner: true, membershipStatus: 'ACTIVE' },
    });
    return { id: profile.id, ownerWorkerId: owner.id };
  }

  async function newWorker(
    providerId: string,
    data: Partial<Prisma.ProviderWorkerUncheckedCreateInput> & { at?: { lat: number; lng: number }; connected?: boolean } = {},
  ) {
    const { at = CLIENT, connected = true, ...rest } = data;
    const user = await newUser();
    const worker = await prisma.providerWorker.create({
      data: {
        providerProfileId: providerId,
        userId: user.id,
        displayName: user.fullName,
        membershipStatus: 'ACTIVE',
        isAvailable: true,
        currentLatitude: at.lat,
        currentLongitude: at.lng,
        ...rest,
      },
    });
    // D99: online = toggle menyala DAN terhubung. Di sini koneksinya diwakili satu denyut.
    if (connected) presence.touch(worker.id);
    return worker.id;
  }

  async function newListing(
    provider: { id: string; ownerWorkerId: string },
    data: Partial<Prisma.ListingUncheckedCreateInput> = {},
  ) {
    const listing = await prisma.listing.create({
      data: {
        providerProfileId: provider.id,
        subcategoryId,
        title: 'Cuci Mobil',
        price: 100000,
        estimatedDurationMinutes: 60,
        attributes: { sumber_air: 'Dibawa' },
        status: 'ACTIVE',
        supportsAvailableNow: true,
        ...data,
      },
    });
    await prisma.workerListing.create({ data: { workerId: provider.ownerWorkerId, listingId: listing.id } });
    return listing.id;
  }

  async function newOrder(listingId: string, providerId: string, workerId: string, status: string, bookingMode: string) {
    const client = await newUser();
    await prisma.order.create({
      data: {
        orderNumber: `ORD-UJI-${randomInt(1e9)}`,
        clientId: client.id,
        providerProfileId: providerId,
        listingId,
        assignedWorkerId: workerId,
        bookingMode: bookingMode as 'SCHEDULED',
        status: status as 'PAID',
        scheduledAt: bookingMode === 'SCHEDULED' ? new Date(Date.now() + 86_400_000) : null,
        serviceAddress: 'Jl. Uji',
        serviceLatitude: CLIENT.lat,
        serviceLongitude: CLIENT.lng,
        locationSource: 'MAP_PIN',
        snapshotListingTitle: 'Cuci Mobil',
        listingBaseAmount: 100000,
        platformFee: 10000,
        totalAmount: 100000,
        providerEarning: 90000,
      },
    });
  }

  async function search(query: Record<string, unknown>) {
    return request(app).get('/api/v1/listings').query(query);
  }

  async function ids(query: Record<string, unknown>): Promise<string[]> {
    const res = await search(query);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    return res.body.data.map((item: { id: string }) => item.id);
  }

  beforeEach(async () => {
    await resetDatabase();
    presence.reset();
    app = createApp();
    const sub = await newSubcategory();
    subcategoryId = sub.id;
    categoryId = sub.categoryId;
  });

  // -------------------------------------------------------------------------

  it('D96: hanya listing tayang milik provider VERIFIED di katalog aktif', async () => {
    const provider = await newProvider();
    const visible = await newListing(provider);
    await newListing(provider, { status: 'DRAFT' });
    await newListing(provider, { status: 'INACTIVE' });
    await newListing(provider, { status: 'SUSPENDED' });
    await newListing(provider, { deletedAt: new Date() });
    await newListing(await newProvider({ status: 'SUSPENDED' }));
    await newListing(await newProvider({ status: 'PENDING' }));

    const inactiveSub = await newSubcategory();
    await prisma.subcategory.update({ where: { id: inactiveSub.id }, data: { isActive: false } });
    await newListing(provider, { subcategoryId: inactiveSub.id });
    const inactiveCat = await newSubcategory();
    await prisma.category.update({ where: { id: inactiveCat.categoryId }, data: { isActive: false } });
    await newListing(provider, { subcategoryId: inactiveCat.id });

    const res = await search({});
    expect(res.status).toBe(200);
    expect(res.body.data.map((item: { id: string }) => item.id)).toEqual([visible]);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 20, total: 1 });
    expect(res.body.data[0]).toMatchObject({ price: 100000, distance_km: null, subcategory: { id: subcategoryId } });
  });

  it('filter kategori, harga, kata kunci, mode, beserta sort dan paginasi', async () => {
    const provider = await newProvider();
    const murah = await newListing(provider, { title: 'Cuci Hemat', price: 50000, orderCount: 1, ratingAverage: 4 });
    const sedang = await newListing(provider, { title: 'Diskon 100% Kilat', price: 80000, orderCount: 9, ratingAverage: 5, supportsAvailableNow: false });
    const mahal = await newListing(provider, { title: 'Cuci Premium', description: 'Poles kaca', price: 200000, orderCount: 5, ratingAverage: 3, supportsScheduled: false });
    const lain = await newSubcategory();
    const beda = await newListing(provider, { subcategoryId: lain.id, attributes: {} });

    expect(await ids({ subcategory_id: subcategoryId, sort: 'price_asc' })).toEqual([murah, sedang, mahal]);
    expect(await ids({ category_id: lain.categoryId })).toEqual([beda]);
    expect(await ids({ category_id: categoryId, sort: 'price_desc' })).toEqual([mahal, sedang, murah]);
    expect(await ids({ subcategory_id: subcategoryId, price_min: 60000, price_max: 200000, sort: 'price_asc' })).toEqual([sedang, mahal]);
    expect(await ids({ subcategory_id: subcategoryId, sort: 'rating' })).toEqual([sedang, murah, mahal]);
    expect(await ids({ subcategory_id: subcategoryId, sort: 'popular' })).toEqual([sedang, mahal, murah]);
    expect(await ids({ q: 'poles' })).toEqual([mahal]);
    // `%` dicari sebagai huruf, bukan wildcard.
    expect(await ids({ q: '100%' })).toEqual([sedang]);
    expect(await ids({ q: '%' })).toEqual([sedang]);
    expect(await ids({ subcategory_id: subcategoryId, booking_mode: 'SCHEDULED', sort: 'price_asc' })).toEqual([murah, sedang]);
    expect(await ids({ subcategory_id: subcategoryId, booking_mode: 'AVAILABLE_NOW', sort: 'price_asc' })).toEqual([murah, mahal]);

    const page2 = await search({ subcategory_id: subcategoryId, sort: 'price_asc', limit: 2, page: 2 });
    expect(page2.body.data.map((item: { id: string }) => item.id)).toEqual([mahal]);
    expect(page2.body.meta).toEqual({ page: 2, limit: 2, total: 3 });
    const beyond = await search({ subcategory_id: subcategoryId, limit: 2, page: 5 });
    expect(beyond.body.data).toEqual([]);
    expect(beyond.body.meta.total).toBe(3);
  });

  it('D98: client wajib di dalam service_radius_km usaha, diukur dari basis', async () => {
    const dekat = await newListing(await newProvider({ base: east(1), radiusKm: 10 }));
    const masuk = await newListing(await newProvider({ base: north(4), radiusKm: 5 }));
    // Jarak sama dengan `masuk`, tapi radius usahanya lebih kecil.
    await newListing(await newProvider({ base: south(4), radiusKm: 3 }));
    await newListing(await newProvider({ base: null, radiusKm: 999 }));

    const res = await search({ lat: CLIENT.lat, lng: CLIENT.lng });
    expect(res.status).toBe(200);
    expect(res.body.data.map((item: { id: string }) => item.id)).toEqual([dekat, masuk]);
    expect(res.body.data[0].distance_km).toBeCloseTo(1, 1);
    expect(res.body.data[1].distance_km).toBeCloseTo(4, 1);

    expect(await ids({ lat: CLIENT.lat, lng: CLIENT.lng, radius_km: 2 })).toEqual([dekat]);
    expect(await ids({ lat: CLIENT.lat, lng: CLIENT.lng, sort: 'price_asc' })).toHaveLength(2);
  });

  it.each([
    ['lat tanpa lng', { lat: CLIENT.lat }],
    ['radius_km tanpa lokasi', { radius_km: 5 }],
    ['sort=distance tanpa lokasi', { sort: 'distance' }],
    ['price_min > price_max', { price_min: 10, price_max: 5 }],
    ['sort di luar daftar putih', { sort: 'l.id; DROP TABLE listings' }],
    ['attr tanpa subcategory_id', { 'attr[sumber_air]': 'Dibawa' }],
  ])('422: %s', async (_name, query) => {
    const res = await search(query);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('angka kosong di query string dianggap tidak diisi, bukan 0', async () => {
    // Basis di lintang/bujur 0 dengan radius besar: kalau `lat=` jadi 0, listing ini ikut muncul.
    await newListing(await newProvider({ base: { lat: 0, lng: 0 }, radiusKm: 999 }));
    const dekat = await newListing(await newProvider({ base: east(1) }));

    const blank = await search({ lat: '', lng: ' ', radius_km: '', price_min: '', price_max: '', page: '', limit: '' });
    expect(blank.status, JSON.stringify(blank.body)).toBe(200);
    expect(blank.body.meta).toMatchObject({ page: 1, limit: 20, total: 2 });
    expect(blank.body.data.every((item: { distance_km: unknown }) => item.distance_km === null)).toBe(true);

    expect(await ids({ lat: CLIENT.lat, lng: CLIENT.lng, radius_km: '' })).toEqual([dekat]);

    const half = await search({ lat: '', lng: CLIENT.lng });
    expect(half.status).toBe(422);
    expect(half.body.error.details.map((d: { path: string }) => d.path)).toContain('lat');
    expect((await search({ lat: 'abc', lng: CLIENT.lng })).status).toBe(422);
  });

  it('page raksasa ditolak 422, bukan 500 karena OFFSET meluap', async () => {
    const res = await search({ page: '1e300' });
    expect(res.status).toBe(422);
    expect(res.body.error.details.map((d: { path: string }) => d.path)).toContain('page');
  });

  it('D45: available_now membuang listing yang tidak punya pekerja bebas', async () => {
    const make = async () => {
      const provider = await newProvider();
      return { provider, listingId: await newListing(provider) };
    };
    const map = (workerId: string, listingId: string) => prisma.workerListing.create({ data: { workerId, listingId } });

    const ok = await make();
    await map(await newWorker(ok.provider.id), ok.listingId);

    const tidakMendukung = await make();
    await prisma.listing.update({ where: { id: tidakMendukung.listingId }, data: { supportsAvailableNow: false } });
    await map(await newWorker(tidakMendukung.provider.id), tidakMendukung.listingId);

    const tidakTerpetakan = await make();
    await newWorker(tidakTerpetakan.provider.id);

    const pelamar = await make();
    await map(await newWorker(pelamar.provider.id, { membershipStatus: 'PENDING' }), pelamar.listingId);

    const pengelola = await make();
    await map(await newWorker(pengelola.provider.id, { acceptsAssignments: false }), pengelola.listingId);

    const offline = await make();
    await map(await newWorker(offline.provider.id, { isAvailable: false }), offline.listingId);

    // Toggle menyala tapi tidak terhubung Socket.IO dan denyutnya tidak ada (D65, D99).
    const tidakTerhubung = await make();
    await map(await newWorker(tidakTerhubung.provider.id, { connected: false }), tidakTerhubung.listingId);

    const sibuk = await make();
    const sibukWorker = await newWorker(sibuk.provider.id);
    await map(sibukWorker, sibuk.listingId);
    await newOrder(sibuk.listingId, sibuk.provider.id, sibukWorker, 'IN_PROGRESS', 'SCHEDULED');

    const diklaim = await make();
    const diklaimWorker = await newWorker(diklaim.provider.id);
    await map(diklaimWorker, diklaim.listingId);
    await newOrder(diklaim.listingId, diklaim.provider.id, diklaimWorker, 'ACCEPTED', 'AVAILABLE_NOW');

    // SCHEDULED PAID bisa berhari-hari sebelum jadwalnya, bukan in-flight.
    const terjadwal = await make();
    const terjadwalWorker = await newWorker(terjadwal.provider.id);
    await map(terjadwalWorker, terjadwal.listingId);
    await newOrder(terjadwal.listingId, terjadwal.provider.id, terjadwalWorker, 'PAID', 'SCHEDULED');

    const found = await ids({ available_now: 'true' });
    expect(found.sort()).toEqual([ok.listingId, terjadwal.listingId].sort());
    expect(await ids({ available_now: 'false' })).toHaveLength(10);
  });

  it('D98: available_now + lokasi diukur dari pekerja online terdekat', async () => {
    // Basis di dalam radius, pekerja online di luar: keluar.
    const basisDekat = await newProvider({ base: CLIENT, radiusKm: 5 });
    const listingBasisDekat = await newListing(basisDekat);
    await prisma.workerListing.create({ data: { listingId: listingBasisDekat, workerId: await newWorker(basisDekat.id, { at: north(8) }) } });

    // Basis jauh di luar radius, satu pekerja online dekat: masuk.
    const basisJauh = await newProvider({ base: north(30), radiusKm: 5 });
    const listingBasisJauh = await newListing(basisJauh);
    for (const at of [north(12), east(2)]) {
      await prisma.workerListing.create({ data: { listingId: listingBasisJauh, workerId: await newWorker(basisJauh.id, { at }) } });
    }

    const res = await search({ available_now: 'true', lat: CLIENT.lat, lng: CLIENT.lng });
    expect(res.status).toBe(200);
    expect(res.body.data.map((item: { id: string }) => item.id)).toEqual([listingBasisJauh]);
    expect(res.body.data[0].distance_km).toBeCloseTo(2, 1);
    expect(await ids({ available_now: 'true', lat: CLIENT.lat, lng: CLIENT.lng, radius_km: 1 })).toEqual([]);
    // Tanpa available_now, basis yang dipakai.
    expect(await ids({ lat: CLIENT.lat, lng: CLIENT.lng })).toEqual([listingBasisDekat]);
  });

  it('H18: filter atribut SPEC lewat attributes, OPTION lewat harga opsi yang dilayani', async () => {
    const provider = await newProvider();
    const a = await newListing(provider, { attributes: { sumber_air: 'Dibawa', merek: ['Daikin', 'LG'] } });
    const b = await newListing(provider, { attributes: { sumber_air: 'Client', merek: ['LG'] } });
    const c = await newListing(provider, { attributes: { sumber_air: 'Dibawa', merek: ['Sharp'] } });
    await prisma.listingOptionPrice.createMany({
      data: [
        { listingId: a, attributeKey: 'jenis', optionValue: 'SUV', priceDelta: 20000 },
        { listingId: b, attributeKey: 'jenis', optionValue: 'SUV', priceDelta: 20000, isOffered: false },
        { listingId: b, attributeKey: 'malam', optionValue: null, priceDelta: 30000 },
        { listingId: c, attributeKey: 'jenis', optionValue: 'Sedan', priceDelta: 0 },
      ],
    });
    const sorted = (list: string[]) => [...list].sort();
    const attr = (filters: Record<string, string>) => ({
      subcategory_id: subcategoryId,
      ...Object.fromEntries(Object.entries(filters).map(([key, value]) => [`attr[${key}]`, value])),
    });

    expect(sorted(await ids(attr({ sumber_air: 'Dibawa' })))).toEqual(sorted([a, c]));
    expect(sorted(await ids(attr({ merek: 'LG' })))).toEqual(sorted([a, b]));
    expect(await ids(attr({ sumber_air: 'Dibawa', merek: 'LG' }))).toEqual([a]);
    expect(await ids(attr({ jenis: 'SUV' }))).toEqual([a]);
    expect(await ids(attr({ malam: 'true' }))).toEqual([b]);
    expect(sorted(await ids(attr({ malam: 'false' })))).toEqual(sorted([a, c]));
    expect(await ids(attr({ jenis: 'Sedan', merek: 'Sharp' }))).toEqual([c]);
    // Atribut dan radius kotak dibaca bersamaan; hasil dan galatnya tetap sama.
    expect(sorted(await ids({ ...attr({ sumber_air: 'Dibawa' }), lat: CLIENT.lat, lng: CLIENT.lng }))).toEqual(sorted([a, c]));
    const located = await search({ ...attr({ rahasia: 'x' }), lat: CLIENT.lat, lng: CLIENT.lng });
    expect(located.status).toBe(422);
    expect(located.body.error.details[0].path).toBe('attr.rahasia');

    for (const bad of [{ rahasia: 'x' }, { warna: 'Merah' }, { jenis: 'Bus' }, { sumber_air: 'Sungai' }, { malam: 'ya' }]) {
      const res = await search(attr(bad));
      expect(res.status, JSON.stringify(bad)).toBe(422);
      expect(res.body.error.details[0].path).toBe(`attr.${Object.keys(bad)[0]}`);
    }
  });

  it('D-A: isi attr dan q diperlakukan sebagai teks, bukan SQL', async () => {
    const provider = await newProvider();
    const target = await newListing(provider, { attributes: { sumber_air: 'Dibawa', catatan: INJECTION } });
    await newListing(provider, { attributes: { sumber_air: 'Dibawa', catatan: 'biasa' } });

    expect(await ids({ subcategory_id: subcategoryId, 'attr[catatan]': INJECTION })).toEqual([target]);
    expect(await ids({ subcategory_id: subcategoryId, 'attr[catatan]': `x' OR '1'='1` })).toEqual([]);
    expect(await ids({ subcategory_id: subcategoryId, 'attr[catatan]': `"} OR 1=1 --` })).toEqual([]);
    expect(await ids({ q: `' OR 1=1 --` })).toEqual([]);
    expect(await prisma.listing.count()).toBe(2);
  });
});
