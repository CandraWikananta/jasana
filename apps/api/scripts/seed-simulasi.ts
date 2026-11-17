/**
 * Data simulasi Bali (H16) untuk frontend, stress test k6, dan UAT. Panduan lengkap:
 * docs/Data-Simulasi.md.
 *
 *   npm run seed:simulasi -- --dry-run                       ringkasan rencana, tanpa menulis
 *   npm run seed:simulasi                                    reset lalu bangun ulang (jasana_test lokal)
 *   npm run seed:simulasi -- --confirm-host <host>           target selain localhost "test" (Supabase dev)
 *   npm run seed:simulasi -- --reset [--confirm-host <host>] hapus seluruh data simulasi beserta fotonya
 *   npm run seed:simulasi -- --bulk 20000                    + penyedia dan listing massal (DB lokal k6)
 *
 * Seluruh akun ber-email @sim.jasana.test. Penyedia, pekerja, dan wallet di-insert
 * langsung (pola seed Fase 6). Listing lewat listings.service. Seluruh order lewat
 * service layer dengan gateway palsu, lalu order terminal digeser ke 60 hari terakhir
 * (usulan D205). Pilihan acak memakai PRNG berseed tetap, jadi isinya sama setiap kali,
 * walaupun UUID, nomor order, dan kode verifikasi tetap acak buatan service.
 */

import './sim/env';
import { randomUUID } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import bcrypt from 'bcryptjs';
import { prisma } from '@jasana/database';
import { LISTING_PHOTO_BUCKET } from '../src/config/constants';
import { isAppError } from '../src/lib/errors';
import { detectFileType } from '../src/lib/file-signature';
import { haversineKm } from '../src/lib/haversine';
import { storage } from '../src/lib/supabase';
import { witaDateKey } from '../src/lib/wita';
import { resolveOrderAccess, resolveProvider, resolveWorker, type ProviderContext } from '../src/modules/access/access.service';
import { reviewDispute, resolveDispute, openDispute } from '../src/modules/disputes/disputes.service';
import { addPhoto, createListing, setFaqs, setListingWorkers, setOptionPrices, updateListing } from '../src/modules/listings/listings.service';
import { createListingSchema } from '../src/modules/listings/listings.schema';
import { acceptOrder, cancelOrder, declineOffer, rejectOrder } from '../src/modules/orders/order-actions.service';
import { checkIn, departOrder, finishWork, getVerificationCode, startWork, verifyCode } from '../src/modules/orders/order-execution.service';
import { backdateDeadline, expireUnanswered, expireUnpaid, settleOrder } from '../src/modules/orders/order-expiry.service';
import { sendMessage } from '../src/modules/orders/order-messages.service';
import { simulatePayment } from '../src/modules/orders/order-payment.service';
import { withOrderTransaction } from '../src/modules/orders/order-transition.service';
import { acceptOrderSchema, createOrderSchema } from '../src/modules/orders/orders.schema';
import { createOrder } from '../src/modules/orders/orders.service';
import { syncRefund } from '../src/modules/refunds/refunds.service';
import { createReview, replyToReview } from '../src/modules/reviews/reviews.service';
import { approveWithdrawal, rejectWithdrawal, requestWithdrawal, syncWithdrawal } from '../src/modules/wallets/withdrawals.service';
import { setAvailability } from '../src/modules/workers/workers.service';
import { presence } from '../src/realtime/presence';
// @ts-expect-error berkas .mjs tanpa deklarasi tipe
import { CATALOG } from '../../../scripts/catalog-data.mjs';
// @ts-expect-error berkas .mjs tanpa deklarasi tipe
import { seedCatalog } from '../../../scripts/seed-catalog.mjs';
import {
  AREAS, BANKS, BOTH_MODES, DELTAS, DURATION, FAQS, FIRST_NAMES, LAST_NAMES, LISTINGS_PER_SUB, PITCH, PROVIDERS, QTY,
  REPLIES, REVIEW_TEXT, TITLES, type Area, type ProviderSpec, type SubSlug,
} from './sim/data';
import { assertTarget, findForeignLinks, makePng, prng, resetSimulation, shiftOrderTimes, SIM_DOMAIN, UAT_DOMAIN, type Rgb, type Rng } from './sim/lib';

const PASSWORD = 'Simulasi-Jasana-2026';
const SEED = 20261117;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WITA = 8 * HOUR;

// ------------------------------------------------------------------ argumen

const argv = process.argv.slice(2);
const flag = (name: string) => argv.includes(name);
const value = (name: string) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const DRY_RUN = flag('--dry-run');
const RESET_ONLY = flag('--reset');
const BULK = Number(value('--bulk') ?? 0);
if (!Number.isInteger(BULK) || BULK < 0) {
  console.error('--bulk harus bilangan bulat positif.');
  process.exit(1);
}

// ------------------------------------------------------------------ katalog

interface AttrDef {
  attribute_key: string;
  data_type: 'SELECT' | 'MULTISELECT' | 'NUMBER' | 'BOOLEAN' | 'TEXT';
  attribute_role: 'SPEC' | 'OPTION';
  is_required: boolean;
  options?: { value: string; is_active: boolean; duration_minutes?: number }[];
  validation_rule?: { min?: number; max?: number };
}
interface SubDef { slug: SubSlug; categorySlug: string; name: string; min: number; max: number; attributes: AttrDef[] }

const SUBS = new Map<SubSlug, SubDef>(
  (CATALOG as { slug: string; subcategories: { slug: SubSlug; name: string; suggested_price_min: number; suggested_price_max: number; attributes: AttrDef[] }[] }[])
    .flatMap((c) => c.subcategories.map((s) => [s.slug, { slug: s.slug, categorySlug: c.slug, name: s.name, min: s.suggested_price_min, max: s.suggested_price_max, attributes: s.attributes }] as const)),
);
const CATEGORY_COLORS: Record<string, [Rgb, Rgb]> = {
  otomotif: [[30, 64, 120], [70, 150, 200]],
  fotografi: [[90, 40, 110], [210, 120, 90]],
  kecantikan: [[170, 60, 110], [245, 170, 150]],
  perbaikan: [[20, 110, 90], [120, 200, 140]],
};
const SUB_ORDER = [...SUBS.keys()];

// ------------------------------------------------------------------ rencana deterministik

const rng = prng(SEED);
const areaOf = (key: string): Area => AREAS.find((a) => a.key === key)!;
/** Titik di sekitar `p`, maksimal `km` kilometer, deterministik dari rng. */
const near = (r: Rng, p: { lat: number; lng: number }, km: number) => {
  const d = (km * Math.sqrt(r.next())) / 111.195;
  const t = r.next() * 2 * Math.PI;
  return { lat: round8(p.lat + d * Math.sin(t)), lng: round8(p.lng + (d * Math.cos(t)) / Math.cos((p.lat * Math.PI) / 180)) };
};
const round8 = (n: number) => Math.round(n * 1e8) / 1e8;
const round = (n: number, step: number) => Math.max(step, Math.round(n / step) * step);

const usedNames = new Set<string>();
function personName(r: Rng): string {
  for (;;) {
    const name = `${r.pick(FIRST_NAMES)} ${r.pick(LAST_NAMES)}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
  }
}

interface PlanUser { email: string; fullName: string; phone: string; role: 'CLIENT' | 'ADMIN'; ageDays: number }
let phoneSeq = 0;
const nextPhone = () => `+62877${String((phoneSeq += 1)).padStart(7, '0')}`;
const simEmail = (local: string) => `${local}${SIM_DOMAIN}`;

interface PlanWorker { user: PlanUser; isOwner: boolean; accepts: boolean }
interface PlanProvider {
  spec: ProviderSpec; owner: PlanUser; workers: PlanWorker[]; base: { lat: number; lng: number };
  radiusKm: number; quality: number; popularity: number;
}
interface PlanClient { user: PlanUser; area: Area; home: { lat: number; lng: number }; street: string; office?: { lat: number; lng: number; area: Area } }

function makePlan() {
  const admin: PlanUser = { email: simEmail('demo.admin'), fullName: 'Admin Demo Jasana', phone: nextPhone(), role: 'ADMIN', ageDays: 150 };
  const providers: PlanProvider[] = PROVIDERS.map((spec) => {
    const area = areaOf(spec.area);
    const ownerEmail = simEmail(spec.demo ?? `pemilik.${spec.key}`);
    const owner: PlanUser = { email: ownerEmail, fullName: personName(rng), phone: nextPhone(), role: 'CLIENT', ageDays: rng.int(80, 140) };
    const workers: PlanWorker[] = [{ user: owner, isOwner: true, accepts: spec.workers < 4 }];
    for (let i = 2; i <= spec.workers; i += 1) {
      const local = spec.demo === 'demo.usaha' && i <= 3 ? (i === 2 ? 'demo.pekerja' : 'demo.pendamping') : `pekerja.${spec.key}.${i}`;
      workers.push({ user: { email: simEmail(local), fullName: personName(rng), phone: nextPhone(), role: 'CLIENT', ageDays: rng.int(70, owner.ageDays - 5) }, isOwner: false, accepts: true });
    }
    return {
      spec, owner, workers, base: near(rng, area, 0.4), radiusKm: rng.int(5, 25),
      quality: 3.6 + rng.next() * 1.3,
      // Penyedia akun demo dan kasus utama servis AC (PRD 8.4) sengaja ramai, sisanya acak.
      popularity: Math.max(0.4 + rng.next() * 1.2, spec.demo || spec.key === 'dingin-jaya' ? 1.6 : 0),
    };
  });
  const clients: PlanClient[] = [];
  const demoArea = areaOf('renon');
  clients.push({
    user: { email: simEmail('demo.client'), fullName: 'Ni Putu Demo Lestari', phone: nextPhone(), role: 'CLIENT', ageDays: 120 },
    area: demoArea, home: near(rng, demoArea, 0.3), street: 'Jl. Tukad Badung', office: { ...near(rng, areaOf('kuta'), 0.3), area: areaOf('kuta') },
  });
  for (let n = 1; n <= 40; n += 1) {
    const area = AREAS[(n * 7) % AREAS.length]!;
    clients.push({
      user: { email: simEmail(`klien.${String(n).padStart(2, '0')}`), fullName: personName(rng), phone: nextPhone(), role: 'CLIENT', ageDays: rng.int(62, 140) },
      area, home: near(rng, area, 0.4), street: rng.pick(area.streets),
      ...(rng.chance(0.25) ? { office: (() => { const a = rng.pick(AREAS); return { ...near(rng, a, 0.4), area: a }; })() } : {}),
    });
  }
  return { admin, providers, clients };
}

type Kind =
  | 'SETTLED' | 'REJECTED' | 'EXPIRED_S' | 'EXPIRED_AN' | 'PAYMENT_EXPIRED' | 'CANCEL_CLIENT' | 'CANCEL_PROVIDER'
  | 'REFUNDED' | 'DISPUTE_RELEASE' | 'DISPUTE_PARTIAL' | 'DISPUTE_REFUND';
const HISTORY: [Kind, number][] = [
  ['SETTLED', 210], ['REJECTED', 12], ['EXPIRED_S', 10], ['EXPIRED_AN', 6], ['PAYMENT_EXPIRED', 10], ['CANCEL_CLIENT', 10],
  ['CANCEL_PROVIDER', 5], ['REFUNDED', 8], ['DISPUTE_RELEASE', 3], ['DISPUTE_PARTIAL', 3], ['DISPUTE_REFUND', 3],
];
const LIVE = [
  'PENDING_ACCEPTANCE (Scheduled)', 'PENDING_ACCEPTANCE (Available Now, satu menolak)', 'ACCEPTED (menunggu bayar)',
  'PAID besok dengan pendamping', 'PAID 30 menit lagi', 'ON_THE_WAY', 'ARRIVED (check-in kedua)', 'IN_PROGRESS',
  'AWAITING_VERIFICATION', 'AWAITING_VERIFICATION terkunci', 'COMPLETED', 'DISPUTED OPEN', 'DISPUTED UNDER_REVIEW',
];

/** Pemeriksaan bentuk rencana terhadap target sesi (40 penyedia, 100 pekerja, 130 listing). */
function assertPlanShape() {
  const perSub = new Map<string, number>();
  for (const p of PROVIDERS) for (const s of p.listings) perSub.set(s, (perSub.get(s) ?? 0) + 1);
  const problems = Object.entries(LISTINGS_PER_SUB).filter(([s, n]) => perSub.get(s) !== n).map(([s, n]) => `${s}: ${perSub.get(s) ?? 0} != ${n}`);
  const workers = PROVIDERS.reduce((sum, p) => sum + p.workers, 0);
  if (workers !== 100) problems.push(`pekerja ${workers} != 100`);
  if (PROVIDERS.filter((p) => p.type === 'INDIVIDUAL').some((p) => p.workers !== 1)) problems.push('INDIVIDUAL harus satu pekerja');
  if (problems.length > 0) throw new Error(`Rencana data tidak sesuai: ${problems.join('; ')}`);
}

// ------------------------------------------------------------------ runtime

interface RtWorker { id: string; userId: string; name: string; accepts: boolean; isOwner: boolean }
interface RtProvider { plan: PlanProvider; id: string; ctx: ProviderContext; workers: RtWorker[]; listings: RtListing[] }
interface RtListing {
  id: string; slug: SubSlug; title: string; provider: RtProvider; mapped: RtWorker[]; supportsAn: boolean;
  /** attribute_key -> nilai yang dilayani (SELECT/MULTISELECT) atau true (NUMBER/BOOLEAN). */
  offered: Map<string, string[] | true>;
}
interface RtClient { plan: PlanClient; id: string; homeId: string; officeId?: string }

const userIds = new Map<string, string>();
const uid = (email: string) => {
  const id = userIds.get(email);
  if (!id) throw new Error(`User ${email} belum dibuat`);
  return id;
};

async function createUsers(plan: ReturnType<typeof makePlan>, passwordHash: string) {
  const all: PlanUser[] = [plan.admin, ...plan.providers.flatMap((p) => p.workers.map((w) => w.user)), ...plan.clients.map((c) => c.user)];
  const phones = all.map((u) => u.phone);
  const taken = await prisma.user.findMany({ where: { phone: { in: phones } }, select: { email: true } });
  if (taken.length > 0) throw new Error(`Nomor ponsel simulasi sudah dipakai akun lain: ${taken.map((t) => t.email).join(', ')}`);
  const now = Date.now();
  await prisma.user.createMany({
    data: all.map((u) => ({
      fullName: u.fullName, email: u.email, phone: u.phone, passwordHash, role: u.role,
      emailVerifiedAt: new Date(now - u.ageDays * DAY), createdAt: new Date(now - u.ageDays * DAY),
    })),
  });
  for (const u of await prisma.user.findMany({ where: { email: { endsWith: SIM_DOMAIN } }, select: { id: true, email: true } })) userIds.set(u.email, u.id);

  // Admin UAT (D85): dibuat sekali, tidak pernah ditimpa atau dihapus reset.
  for (let n = 1; n <= 3; n += 1) {
    const email = `uat-admin-0${n}${UAT_DOMAIN}`;
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { fullName: `Admin UAT ${n}`, email, phone: `+62877999000${n}`, passwordHash, role: 'ADMIN', emailVerifiedAt: new Date(now) },
    });
  }
}

async function createProviders(plan: ReturnType<typeof makePlan>): Promise<RtProvider[]> {
  const now = Date.now();
  const adminId = uid(plan.admin.email);
  const result: RtProvider[] = [];
  for (const p of plan.providers) {
    const area = areaOf(p.spec.area);
    const verifiedAt = new Date(now - (p.owner.ageDays - 2) * DAY);
    const profile = await prisma.providerProfile.create({
      data: {
        userId: uid(p.owner.email), providerType: p.spec.type, businessName: p.spec.name, verificationStatus: 'VERIFIED',
        verifiedAt, verifiedBy: adminId, createdAt: new Date(now - p.owner.ageDays * DAY),
        bio: `${p.spec.name} melayani ${area.name} dan sekitarnya.`,
        baseAddress: `${rng.pick(area.streets)} No. ${rng.int(1, 120)}, ${area.name}, ${area.city}, Bali`,
        baseLatitude: p.base.lat, baseLongitude: p.base.lng, serviceRadiusKm: p.radiusKm, wallet: { create: {} },
      },
    });
    const workers: RtWorker[] = [];
    for (const w of p.workers) {
      const at = near(rng, p.base, 3);
      const row = await prisma.providerWorker.create({
        data: {
          providerProfileId: profile.id, userId: uid(w.user.email), displayName: w.user.fullName, isOwner: w.isOwner,
          membershipStatus: 'ACTIVE', acceptsAssignments: w.accepts, approvedAt: w.isOwner ? verifiedAt : new Date(now - w.user.ageDays * DAY),
          approvedBy: w.isOwner ? null : uid(p.owner.email), currentLatitude: at.lat, currentLongitude: at.lng,
          createdAt: new Date(now - w.user.ageDays * DAY),
        },
      });
      workers.push({ id: row.id, userId: row.userId, name: w.user.fullName, accepts: w.accepts, isOwner: w.isOwner });
    }
    result.push({ plan: p, id: profile.id, ctx: await resolveProvider(uid(p.owner.email)), workers, listings: [] });
  }
  return result;
}

function specAttributes(def: SubDef): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  for (const a of def.attributes.filter((x) => x.attribute_role === 'SPEC')) {
    if (!a.is_required && rng.chance(0.3)) continue;
    const values = (a.options ?? []).filter((o) => o.is_active).map((o) => o.value);
    if (a.data_type === 'SELECT') attrs[a.attribute_key] = rng.pick(values);
    else if (a.data_type === 'MULTISELECT') attrs[a.attribute_key] = rng.shuffle(values).slice(0, rng.int(1, Math.min(3, values.length)));
    else if (a.data_type === 'BOOLEAN') attrs[a.attribute_key] = rng.chance(0.5);
    else if (a.data_type === 'NUMBER') {
      const min = a.validation_rule?.min ?? 0, max = a.validation_rule?.max ?? 100;
      attrs[a.attribute_key] = Math.min(max, Math.max(min, round(min + (max - min) * rng.next() * 0.5, max > 60 ? 10 : 1)));
    }
  }
  return attrs;
}

/** Variasi ±20% dari contoh delta, dibulatkan ke Rp5.000. Delta nol tetap nol. */
const vary = (base: number) => (base === 0 ? 0 : round(base * (0.8 + 0.4 * rng.next()), 5000));

function optionPrices(def: SubDef, full: boolean) {
  const out: { attribute_key: string; option_value: string | null; price_delta: number }[] = [];
  const offered = new Map<string, string[] | true>();
  const deltas = DELTAS[def.slug];
  for (const a of def.attributes.filter((x) => x.attribute_role === 'OPTION')) {
    const base = deltas[a.attribute_key];
    if (a.data_type === 'SELECT' || a.data_type === 'MULTISELECT') {
      const values = (a.options ?? []).filter((o) => o.is_active).map((o) => o.value);
      const keep = full || a.data_type === 'SELECT' ? values.length - (full ? 0 : rng.int(0, Math.min(2, values.length - 2))) : rng.int(2, values.length);
      // Nilai pertama (biasanya delta nol) selalu dilayani, supaya harga dasar tetap bisa dipesan.
      const chosen = [values[0]!, ...rng.shuffle(values.slice(1)).slice(0, keep - 1)];
      for (const v of chosen) out.push({ attribute_key: a.attribute_key, option_value: v, price_delta: vary(typeof base === 'object' ? base[v] ?? 0 : 0) });
      offered.set(a.attribute_key, chosen);
    } else if (a.is_required || full || rng.chance(0.8)) {
      out.push({ attribute_key: a.attribute_key, option_value: null, price_delta: vary(typeof base === 'number' ? base : 0) });
      offered.set(a.attribute_key, true);
    }
  }
  return { out, offered };
}

/** Gambar override `scripts/sim-photos/<slug>/` (D206), PNG atau JPEG menurut magic bytes. */
const overrides = new Map<SubSlug, { bytes: Buffer; mime: string }[]>();
function overrideImages(slug: SubSlug) {
  if (!overrides.has(slug)) {
    const dir = resolve(__dirname, '../../../scripts/sim-photos', slug);
    const files = existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isFile()).map((d) => d.name).sort() : [];
    const images = files.flatMap((name) => {
      const bytes = readFileSync(join(dir, name));
      const type = detectFileType(bytes);
      if (bytes.length > 5 * 1024 * 1024 || !type || type.mime === 'application/pdf') {
        if (name !== 'SUMBER.txt') console.warn(`  sim-photos/${slug}/${name} dilewati: bukan PNG/JPEG atau lebih dari 5 MB`);
        return [];
      }
      return [{ bytes, mime: type.mime }];
    });
    overrides.set(slug, images);
  }
  return overrides.get(slug)!;
}

async function uploadPhoto(provider: RtProvider, slug: SubSlug, variant: number): Promise<string> {
  const def = SUBS.get(slug)!;
  const [from, to] = CATEGORY_COLORS[def.categorySlug]!;
  const own = overrideImages(slug);
  const { bytes: png, mime } = own.length > 0 ? own[variant % own.length]! : { bytes: makePng(640, 480, from, to, SUB_ORDER.indexOf(slug), variant), mime: 'image/png' };
  // Folder milik pemilik, persis bentuk signed-url, supaya addPhoto menerimanya.
  // Koneksi ke Storage dev kadang lambat (timeout 15 detik). Coba ulang dengan
  // nama baru setiap percobaan, karena unggahan yang timeout bisa saja sudah
  // tersimpan dan x-upsert false menolak nama yang sama. Berkas yatim dari
  // percobaan yang gagal disapu cron berkas yatim.
  for (let attempt = 1; ; attempt += 1) {
    const path = `${provider.ctx.userId}/${randomUUID()}`;
    try {
      await storage.upload(LISTING_PHOTO_BUCKET, path, png, mime);
      return storage.publicUrl(LISTING_PHOTO_BUCKET, path);
    } catch (error) {
      if (attempt >= 4) throw error;
      console.warn(`Unggah foto gagal (percobaan ${attempt} dari 4), dicoba lagi: ${error instanceof Error ? error.message : String(error)}`);
      await new Promise((resolve) => setTimeout(resolve, 2_000 * attempt));
    }
  }
}

async function createListings(providers: RtProvider[]) {
  const subIds = new Map(
    (await prisma.subcategory.findMany({ where: { slug: { in: SUB_ORDER } }, select: { id: true, slug: true, category: { select: { slug: true } } } }))
      .filter((s) => SUBS.get(s.slug as SubSlug)?.categorySlug === s.category.slug)
      .map((s) => [s.slug as SubSlug, s.id]),
  );
  const now = Date.now();
  let variant = 0;
  for (const p of providers) {
    const area = areaOf(p.plan.spec.area);
    const acceptors = p.workers.filter((w) => w.accepts);
    const titles = new Map<SubSlug, string[]>();
    for (const [j, slug] of p.plan.spec.listings.entries()) {
      const def = SUBS.get(slug)!;
      const pool = titles.get(slug) ?? rng.shuffle(TITLES[slug]);
      titles.set(slug, pool);
      const title = pool.shift() ?? `${def.name} ${p.plan.spec.name}`;
      const span = def.max - def.min;
      const price = round(def.min + span * Math.pow(rng.next(), 1.5) * 0.85, def.max >= 1_000_000 ? 50_000 : 5_000);
      const [dMin, dMax] = DURATION[slug];
      // Listing pertama dingin-jaya adalah kasus Available Now demo (live order), jadi pasti menerima mode itu.
      const supportsAn = BOTH_MODES.has(slug) && ((p.plan.spec.key === 'dingin-jaya' && j === 0) || rng.chance(0.6));
      const body = createListingSchema.parse({
        subcategory_id: subIds.get(slug),
        title,
        description: `${PITCH[slug]} Melayani ${area.name} dan sekitarnya dalam radius ${p.plan.radiusKm} km.${rng.chance(0.5) ? ' Hubungi lewat pesan dalam order kalau ada permintaan khusus.' : ''}`,
        price,
        estimated_duration_minutes: round(dMin + (dMax - dMin) * rng.next(), 15),
        attributes: specAttributes(def),
        supports_scheduled: true,
        supports_available_now: supportsAn,
      });
      const listing = await createListing(p.ctx, body);
      const { out, offered } = optionPrices(def, j === 0);
      await setOptionPrices(p.ctx, listing.id, { options: out });
      let mapped: RtWorker[];
      if (p.plan.spec.type === 'BUSINESS') {
        const k = Math.min(acceptors.length, 2 + (j % 2));
        mapped = Array.from({ length: k }, (_, t) => acceptors[(j + t) % acceptors.length]!);
        await setListingWorkers(p.ctx, listing.id, mapped.map((w) => w.id));
      } else {
        mapped = [p.workers[0]!]; // D53: INDIVIDUAL terpetakan otomatis saat createListing.
      }
      for (let n = rng.int(1, 3); n > 0; n -= 1) {
        await addPhoto(p.ctx, listing.id, { file_url: await uploadPhoto(p, slug, (variant += 1)) });
      }
      if (rng.chance(0.55)) await setFaqs(p.ctx, listing.id, { faqs: rng.shuffle(FAQS[slug]).slice(0, rng.int(1, Math.min(3, FAQS[slug].length))) });
      await updateListing(p.ctx, listing.id, { status: 'ACTIVE' });
      p.listings.push({ id: listing.id, slug, title, provider: p, mapped, supportsAn, offered });
    }
    // Listing tayang sehari setelah usaha diverifikasi, bukan hari skrip dijalankan.
    await prisma.listing.updateMany({ where: { providerProfileId: p.id }, data: { createdAt: new Date(now - (p.plan.owner.ageDays - 3) * DAY) } });
  }
}

async function createClients(plan: ReturnType<typeof makePlan>): Promise<RtClient[]> {
  const out: RtClient[] = [];
  for (const c of plan.clients) {
    const id = uid(c.user.email);
    const home = await prisma.userAddress.create({
      data: {
        userId: id, label: 'Rumah', addressLine: `${c.street} No. ${rng.int(1, 150)}, ${c.area.name}`, district: c.area.district,
        city: c.area.city, province: 'Bali', latitude: c.home.lat, longitude: c.home.lng, isDefault: true,
      },
    });
    let officeId: string | undefined;
    if (c.office) {
      const office = await prisma.userAddress.create({
        data: {
          userId: id, label: 'Kantor', addressLine: `${rng.pick(c.office.area.streets)} No. ${rng.int(1, 150)}, ${c.office.area.name}`,
          district: c.office.area.district, city: c.office.area.city, province: 'Bali', latitude: c.office.lat, longitude: c.office.lng,
        },
      });
      officeId = office.id;
    }
    out.push({ plan: c, id, homeId: home.id, officeId });
  }
  return out;
}

// ------------------------------------------------------------------ order lewat service

const access = (userId: string, orderId: string, admin = false) => resolveOrderAccess(userId, orderId, admin);

/** Lokasi layanan: alamat tersimpan kalau masuk radius, selain itu pin peta dekat basis usaha. */
function locationFor(l: RtListing, c: RtClient) {
  const { base, radiusKm } = l.provider.plan;
  const candidates = [{ id: c.homeId, ...c.plan.home }, ...(c.officeId && c.plan.office ? [{ id: c.officeId, ...c.plan.office }] : [])];
  const saved = candidates.find((a) => haversineKm(a.lat, a.lng, base.lat, base.lng) <= radiusKm * 0.95);
  if (saved) return { body: { location_source: 'SAVED_ADDRESS', address_id: saved.id }, lat: saved.lat, lng: saved.lng };
  const pin = near(rng, base, Math.min(radiusKm * 0.7, 4));
  const area = areaOf(l.provider.plan.spec.area);
  return {
    body: { location_source: 'MAP_PIN', service_address: `${rng.pick(area.streets)} No. ${rng.int(1, 150)}, ${area.name}`, service_latitude: pin.lat, service_longitude: pin.lng },
    lat: pin.lat, lng: pin.lng,
  };
}

function selectOptions(l: RtListing): Record<string, unknown> {
  const def = SUBS.get(l.slug)!;
  const chosen: Record<string, unknown> = {};
  for (const a of def.attributes.filter((x) => x.attribute_role === 'OPTION')) {
    const offered = l.offered.get(a.attribute_key);
    if (!offered) continue;
    if (a.data_type === 'SELECT') chosen[a.attribute_key] = rng.pick(offered as string[]);
    else if (a.data_type === 'MULTISELECT') {
      const n = rng.int(0, 2);
      if (n > 0) chosen[a.attribute_key] = rng.shuffle(offered as string[]).slice(0, n);
    } else if (a.data_type === 'BOOLEAN') {
      if (rng.chance(0.5)) chosen[a.attribute_key] = true;
    } else if (a.data_type === 'NUMBER' && (a.is_required || rng.chance(0.5))) {
      const [lo, hi] = QTY[a.attribute_key] ?? [1, 2];
      chosen[a.attribute_key] = rng.int(Math.max(lo, a.validation_rule?.min ?? lo), Math.min(hi, a.validation_rule?.max ?? hi));
    }
  }
  return chosen;
}

/** Order terjadwal di `scheduledAt`, atau Available Now dengan tawaran ke `offerTo`. */
async function placeOrder(l: RtListing, c: RtClient, mode: { scheduledAt: Date } | { offerTo: RtWorker[] }) {
  const loc = locationFor(l, c);
  if ('offerTo' in mode) {
    // Presence in-memory proses ini saja (D65): hanya pekerja yang dituju yang online.
    presence.reset();
    for (const w of mode.offerTo) {
      const at = near(rng, loc, 1.5);
      await setAvailability(await resolveWorker(w.userId), { is_available: true, latitude: at.lat, longitude: at.lng });
      presence.touch(w.id);
    }
  }
  const body = createOrderSchema.parse({
    listing_id: l.id,
    booking_mode: 'offerTo' in mode ? 'AVAILABLE_NOW' : 'SCHEDULED',
    ...('scheduledAt' in mode ? { scheduled_at: mode.scheduledAt.toISOString() } : {}),
    ...loc.body,
    service_notes: rng.chance(0.3) ? rng.pick(['Rumah pagar hijau, parkir di depan.', 'Mohon kabari kalau sudah dekat.', 'Masuk lewat gang sebelah warung.']) : null,
    selected_options: selectOptions(l),
  });
  const order = await createOrder(c.id, body);
  return { id: order.id, loc };
}

const soon = () => ({ scheduledAt: new Date(Date.now() + 15 * MINUTE) });

async function acceptScheduled(l: RtListing, id: string, assignee: RtWorker, crew: RtWorker[] = []) {
  await acceptOrder(await access(l.provider.ctx.userId, id), id, acceptOrderSchema.parse({ assigned_worker_id: assignee.id, crew_worker_ids: crew.map((w) => w.id) }));
}

async function claim(id: string, worker: RtWorker) {
  await acceptOrder(await access(worker.userId, id), id, acceptOrderSchema.parse({}));
}

async function pay(c: RtClient, id: string, method: string) {
  await simulatePayment(await access(c.id, id), method);
}

async function expectError(code: string, run: () => Promise<unknown>) {
  try {
    await run();
  } catch (error) {
    if (isAppError(error) && error.code === code) return;
    throw error;
  }
  throw new Error(`Diharapkan galat ${code}, tapi berhasil`);
}

/** T8 sampai T14 oleh penanggung jawab. `failFirst`: percobaan check-in pertama 300 sampai 500 m meleset. */
async function runUntil(id: string, w: RtWorker, loc: { lat: number; lng: number }, until: 'ON_THE_WAY' | 'ARRIVED' | 'IN_PROGRESS' | 'AWAITING_VERIFICATION', failFirst = false) {
  await departOrder(await access(w.userId, id));
  if (until === 'ON_THE_WAY') return;
  if (failFirst) {
    const off = (300 + rng.int(0, 200)) / 111_195;
    await expectError('CHECKIN_OUT_OF_RADIUS', async () => checkIn(await access(w.userId, id), { latitude: round8(loc.lat + off), longitude: loc.lng, accuracy_meters: rng.int(15, 40) }));
  }
  await checkIn(await access(w.userId, id), { latitude: round8(loc.lat + rng.int(-20, 20) / 111_195), longitude: loc.lng, accuracy_meters: rng.int(5, 25) });
  if (until === 'ARRIVED') return;
  await startWork(await access(w.userId, id));
  if (until === 'IN_PROGRESS') return;
  await finishWork(await access(w.userId, id));
}

async function complete(id: string, c: RtClient, w: RtWorker, loc: { lat: number; lng: number }, failFirst: boolean) {
  await runUntil(id, w, loc, 'AWAITING_VERIFICATION', failFirst);
  const { code } = await getVerificationCode(await access(c.id, id));
  await verifyCode(await access(w.userId, id), code);
}

async function settleNow(id: string) {
  await backdateDeadline(id, 'settlement_due_at');
  await withOrderTransaction((tx, afterCommit) => settleOrder(tx, afterCommit, id));
}

async function syncRefunds(id: string) {
  for (const r of await prisma.refund.findMany({ where: { orderId: id }, select: { id: true } })) await syncRefund(r.id);
}

function reviewRating(quality: number): 1 | 2 | 3 | 4 | 5 {
  return Math.min(5, Math.max(1, Math.round(quality + (rng.next() * 2 - 1.2)))) as 1 | 2 | 3 | 4 | 5;
}

async function review(id: string, l: RtListing, c: RtClient) {
  const rating = reviewRating(l.provider.plan.quality);
  const created = await createReview(await access(c.id, id), { rating, ...(rng.chance(0.85) ? { comment: rng.pick(REVIEW_TEXT[rating]) } : {}) });
  if (rng.chance(rating <= 3 ? 0.7 : 0.35)) await replyToReview(l.provider.ctx, created.id, rng.pick(REPLIES));
}

/** Waktu akhir order terminal di 60 hari terakhir, lebih rapat di minggu-minggu terakhir. */
const endTime = () => Date.now() - (2 * HOUR + Math.pow(rng.next(), 1.6) * 58 * DAY);

const pickAssignee = (l: RtListing, except: RtWorker[] = []) => rng.pick(l.mapped.filter((w) => !except.includes(w)).length ? l.mapped.filter((w) => !except.includes(w)) : l.mapped);
const isDok = (l: RtListing) => l.slug === 'dokumentasi-acara';

async function historyOrder(kind: Kind, l: RtListing, c: RtClient) {
  const useAn = l.supportsAn && (kind === 'EXPIRED_AN' || (kind === 'SETTLED' && rng.chance(0.3)));
  const assignee = pickAssignee(l);
  const crewPool = l.provider.workers.filter((w) => w.accepts && w.id !== assignee.id);
  const crew = isDok(l) && !useAn && crewPool.length > 0 && rng.chance(0.5) ? [rng.pick(crewPool)] : [];
  const offerTo = useAn ? rng.shuffle(l.mapped).slice(0, Math.min(2, l.mapped.length)) : [];
  const { id, loc } = await placeOrder(l, c, useAn ? { offerTo } : soon());
  const method = rng.pick(['EWALLET', 'EWALLET', 'BANK_TRANSFER', 'QR_CODE']);
  const failFirst = rng.chance(0.2);
  let settleGap: number | undefined;

  if (kind === 'EXPIRED_AN') {
    if (rng.chance(0.5)) for (const w of offerTo) await declineOffer(await access(w.userId, id), id);
    else {
      await backdateDeadline(id, 'response_deadline_at');
      await withOrderTransaction((tx, ac) => expireUnanswered(tx, ac, id, 'DEADLINE'));
    }
  } else if (kind === 'EXPIRED_S') {
    await backdateDeadline(id, 'response_deadline_at');
    await withOrderTransaction((tx, ac) => expireUnanswered(tx, ac, id, 'DEADLINE'));
  } else if (kind === 'REJECTED') {
    await rejectOrder(await access(l.provider.ctx.userId, id), id, { reason: rng.pick(['Jadwal tim sudah penuh', 'Lokasi terlalu jauh untuk jadwal itu', 'Peralatan sedang diperbaiki']) });
  } else if (kind === 'CANCEL_CLIENT' && rng.chance(0.5)) {
    await cancelOrder(await access(c.id, id), id, { reason: 'Jadwal berubah' });
  } else {
    if (useAn) await claim(id, offerTo[0]!);
    else await acceptScheduled(l, id, assignee, crew);
    const who = useAn ? offerTo[0]! : assignee;
    if (kind === 'CANCEL_CLIENT') await cancelOrder(await access(c.id, id), id, { reason: rng.pick(['Sudah diperbaiki sendiri', 'Salah memilih tanggal']) });
    else if (kind === 'CANCEL_PROVIDER') await cancelOrder(await access(l.provider.ctx.userId, id), id, { reason: 'Pekerja berhalangan mendadak' });
    else if (kind === 'PAYMENT_EXPIRED') {
      await backdateDeadline(id, 'payment_deadline_at');
      await withOrderTransaction((tx, ac) => expireUnpaid(tx, ac, id));
    } else {
      await pay(c, id, kind === 'REFUNDED' || kind.startsWith('DISPUTE') ? 'EWALLET' : method);
      if (kind === 'REFUNDED') {
        await cancelOrder(await access(c.id, id), id, { reason: 'Acara dibatalkan keluarga' });
        await syncRefunds(id);
      } else {
        await complete(id, c, who, loc, failFirst);
        if (kind === 'SETTLED') {
          if (rng.chance(0.7)) await review(id, l, c);
          await settleNow(id);
          settleGap = DAY + rng.int(1, 90) * MINUTE;
        } else {
          const dispute = await openDispute(await access(c.id, id), {
            category: rng.pick(['POOR_QUALITY', 'WORK_NOT_DONE'] as const),
            description: rng.pick(['Pekerjaan belum selesai tapi pekerja sudah pulang.', 'Hasilnya tidak sesuai yang dijanjikan di listing.']),
          });
          await reviewDispute(dispute.id);
          const total = (await prisma.order.findUniqueOrThrow({ where: { id }, select: { totalAmount: true } })).totalAmount.toNumber();
          const body =
            kind === 'DISPUTE_RELEASE' ? { decision: 'RELEASE' as const, resolution_note: 'Bukti menunjukkan pekerjaan sudah selesai sesuai listing.' }
              : kind === 'DISPUTE_REFUND' ? { decision: 'REFUND' as const, resolution_note: 'Pekerjaan tidak dilakukan, dana dikembalikan penuh.' }
                : { decision: 'PARTIAL' as const, resolution_note: 'Sebagian pekerjaan tidak selesai.', refund_amount: round(total * 0.4, 5000) };
          await resolveDispute(uid(simEmail('demo.admin')), dispute.id, body);
          await syncRefunds(id);
        }
      }
    }
  }
  const final = await prisma.order.findUniqueOrThrow({ where: { id }, select: { status: true, completedAt: true, updatedAt: true } });
  // Waktu akhir dijadikan acuan: completed_at untuk order yang selesai, updated_at untuk sisanya.
  const target = settleGap !== undefined ? endTime() - settleGap : endTime();
  const anchor = (final.completedAt ?? final.updatedAt).getTime();
  await drainEmails(id);
  await shiftOrderTimes(id, anchor - target, settleGap);
  return final.status;
}

async function runHistory(providers: RtProvider[], clients: RtClient[]) {
  const listings = providers.flatMap((p) => p.listings);
  const weighted: RtListing[] = listings.flatMap((l) => Array.from({ length: Math.max(1, Math.round(l.provider.plan.popularity * 3)) }, () => l));
  const demo = clients[0]!;
  const kinds = HISTORY.flatMap(([k, n]) => Array.from({ length: n }, () => k));
  const queue = rng.shuffle(kinds);
  const demoKinds = new Set<Kind>();
  const tally = new Map<string, number>();
  let done = 0;
  for (const kind of queue) {
    // Setiap jenis terminal pertama milik demo.client, ditambah sekitar 4% order selesai.
    const forDemo = !demoKinds.has(kind) || (kind === 'SETTLED' && rng.chance(0.04));
    demoKinds.add(kind);
    const c = forDemo ? demo : rng.pick(clients.slice(1));
    let l = rng.pick(weighted);
    if (kind === 'EXPIRED_AN') l = rng.pick(listings.filter((x) => x.supportsAn));
    const status = await historyOrder(kind, l, c);
    tally.set(status, (tally.get(status) ?? 0) + 1);
    done += 1;
    if (done % 20 === 0) console.log(`  riwayat ${done}/${queue.length}`);
  }
  return tally;
}

// ------------------------------------------------------------------ order hidup, withdrawal

/** Jam `hour` WITA, `days` hari kalender WITA dari sekarang. */
function witaAt(days: number, hour: number): Date {
  const key = witaDateKey(new Date(Date.now() + days * DAY));
  return new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(4, 6)) - 1, Number(key.slice(6, 8)), hour) - WITA);
}

async function runLive(providers: RtProvider[], clients: RtClient[]) {
  const P = (key: string) => providers.find((p) => p.plan.spec.key === key)!;
  const L = (key: string, slug: SubSlug, n = 0) => P(key).listings.filter((l) => l.slug === slug)[n]!;
  const W = (email: string) => providers.flatMap((p) => p.workers).find((w) => w.userId === uid(simEmail(email)))!;
  const demo = clients[0]!;
  const K = (n: number) => clients[n]!;
  const out: { label: string; id: string }[] = [];
  const add = (label: string, id: string) => out.push({ label, id });
  const msg = async (id: string, userId: string, text: string) => sendMessage(userId, id, text);
  const pekerja = W('demo.pekerja');
  const pendamping = W('demo.pendamping');

  // 1. Menunggu persetujuan demo.usaha.
  {
    const l = L('lensa-dewata', 'dokumentasi-acara', 0);
    add(LIVE[0]!, (await placeOrder(l, demo, { scheduledAt: witaAt(3, 10) })).id);
  }
  // 4. PAID besok sore, penanggung jawab demo.pekerja, pendamping demo.pendamping.
  {
    const l = L('lensa-dewata', 'dokumentasi-acara', 1);
    const { id } = await placeOrder(l, demo, { scheduledAt: witaAt(1, 16) });
    await acceptScheduled(l, id, pekerja, [pendamping]);
    await pay(demo, id, 'EWALLET');
    await msg(id, demo.id, 'Halo, acaranya di halaman belakang rumah ya.');
    await msg(id, pekerja.userId, 'Baik, kami datang 30 menit lebih awal untuk menyiapkan alat.');
    add(LIVE[3]!, id);
  }
  // 8. IN_PROGRESS oleh demo.pekerja sekarang (tidak bentrok dengan jadwal besok).
  {
    const l = L('lensa-dewata', 'dokumentasi-acara', 0);
    const { id, loc } = await placeOrder(l, K(3), soon());
    await acceptScheduled(l, id, pekerja);
    await pay(K(3), id, 'QR_CODE');
    await runUntil(id, pekerja, loc, 'IN_PROGRESS');
    add(LIVE[7]!, id);
  }
  // 3. ACCEPTED, menunggu demo.client membayar (kedaluwarsa sekitar 10 menit).
  {
    const l = L('rias-ayu-sari', 'makeup-artist-acara', 0);
    const { id } = await placeOrder(l, demo, { scheduledAt: witaAt(2, 8) });
    await acceptScheduled(l, id, l.mapped[0]!);
    add(LIVE[2]!, id);
  }
  // 11. COMPLETED, boleh diulas demo.client.
  {
    const l = L('rias-ayu-sari', 'makeup-artist-acara', 1);
    const { id, loc } = await placeOrder(l, demo, soon());
    await acceptScheduled(l, id, l.mapped[0]!);
    await pay(demo, id, 'EWALLET');
    await complete(id, demo, l.mapped[0]!, loc, false);
    add(LIVE[10]!, id);
  }
  // 5. PAID 30 menit lagi: tombol Berangkat sudah aktif.
  const ac = L('dingin-jaya', 'servis-ac', 1);
  // Bukan pekerja listing Available Now demo (order 2), supaya keduanya tetap bisa ditawari.
  const acWorker = ac.mapped.find((w) => !L('dingin-jaya', 'servis-ac', 0).mapped.includes(w)) ?? ac.mapped[0]!;
  {
    const { id } = await placeOrder(ac, K(1), { scheduledAt: new Date(Date.now() + 30 * MINUTE) });
    await acceptScheduled(ac, id, acWorker);
    await pay(K(1), id, 'BANK_TRANSFER');
    add(LIVE[4]!, id);
  }
  // 6. ON_THE_WAY untuk demo.client.
  {
    const l = L('kilap-mobil', 'cuci-mobil-panggilan', 0);
    const w = l.mapped[0]!;
    const { id, loc } = await placeOrder(l, demo, soon());
    await acceptScheduled(l, id, w);
    await pay(demo, id, 'EWALLET');
    await runUntil(id, w, loc, 'ON_THE_WAY');
    add(LIVE[5]!, id);
  }
  // 7. ARRIVED, check-in pertama gagal.
  {
    const l = L('potong-keliling', 'potong-rambut-panggilan', 0);
    const w = l.mapped[0]!;
    const { id, loc } = await placeOrder(l, K(2), soon());
    await acceptScheduled(l, id, w);
    await pay(K(2), id, 'EWALLET');
    await runUntil(id, w, loc, 'ARRIVED', true);
    add(LIVE[6]!, id);
  }
  // 9. AWAITING_VERIFICATION untuk demo.client.
  {
    const l = L('teknik-panjer', 'servis-ac', 0);
    const w = l.mapped[0]!;
    const { id, loc } = await placeOrder(l, demo, soon());
    await acceptScheduled(l, id, w);
    await pay(demo, id, 'EWALLET');
    await runUntil(id, w, loc, 'AWAITING_VERIFICATION');
    await msg(id, w.userId, 'Pekerjaan sudah selesai, mohon cek AC-nya lalu berikan kode verifikasi.');
    add(LIVE[8]!, id);
  }
  // 10. AWAITING_VERIFICATION terkunci: kode salah sampai lockout.
  {
    const l = L('listrik-dewata', 'tukang-listrik', 0);
    const w = l.mapped[0]!;
    const { id, loc } = await placeOrder(l, K(4), soon());
    await acceptScheduled(l, id, w);
    await pay(K(4), id, 'EWALLET');
    await runUntil(id, w, loc, 'AWAITING_VERIFICATION');
    const { code } = await getVerificationCode(await access(K(4).id, id));
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 10; i += 1) {
      try {
        await verifyCode(await access(w.userId, id), wrong);
      } catch (error) {
        if (isAppError(error) && error.code === 'VERIFICATION_LOCKED') break;
        if (!isAppError(error) || error.code !== 'VERIFICATION_CODE_INVALID') throw error;
      }
    }
    add(LIVE[9]!, id);
  }
  // 12 dan 13. Sengketa OPEN milik demo.client, dan UNDER_REVIEW.
  for (const [n, key, slug, c, review] of [[11, 'motor-sehat', 'servis-motor-panggilan', demo, false], [12, 'sejuk-bali', 'servis-ac', K(5), true]] as const) {
    const l = L(key, slug, 0);
    const w = l.mapped[0]!;
    const { id, loc } = await placeOrder(l, c, soon());
    await acceptScheduled(l, id, w);
    await pay(c, id, 'EWALLET');
    await complete(id, c, w, loc, false);
    // Sebelum sengketa: DISPUTED membekukan pesan (sesi 10b), jadi percakapannya jadi bukti.
    await msg(id, c.id, 'Mohon dicek ulang, keluhannya muncul lagi.');
    const dispute = await openDispute(await access(c.id, id), { category: 'POOR_QUALITY', description: 'Masalahnya muncul lagi sejam setelah pekerja pulang.' });
    if (review) await reviewDispute(dispute.id);
    add(LIVE[n]!, id);
  }
  // 2. Available Now terakhir: dua pekerja ditawari, satu menolak. Kedaluwarsa sekitar 5 menit.
  {
    const l = L('dingin-jaya', 'servis-ac', 0);
    const offerTo = l.mapped.filter((w) => w.id !== acWorker.id).slice(0, 2);
    const targets = offerTo.length === 2 ? offerTo : l.mapped.slice(0, 2);
    const { id } = await placeOrder(l, demo, { offerTo: targets });
    if (targets.length > 1) await declineOffer(await access(targets[1]!.userId, id), id);
    add(LIVE[1]!, id);
  }
  return out;
}

async function runWithdrawals(providers: RtProvider[]) {
  const adminId = uid(simEmail('demo.admin'));
  const balance = async (p: RtProvider) =>
    (await prisma.wallet.findUniqueOrThrow({ where: { providerProfileId: p.id }, select: { balanceAvailable: true } })).balanceAvailable.toNumber();
  const request = async (p: RtProvider, share: number) => {
    const amount = Math.floor((await balance(p)) * share / 10_000) * 10_000;
    if (amount < 50_000) return null;
    return requestWithdrawal(p.ctx, {
      amount, bank_code: rng.pick(BANKS), bank_account_number: String(rng.int(1e9, 9e9)), bank_account_name: p.plan.owner.fullName,
    });
  };
  const tally: Record<string, number> = {};
  const count = (s: string) => (tally[s] = (tally[s] ?? 0) + 1);
  const demoUsaha = providers.find((p) => p.plan.spec.demo === 'demo.usaha')!;
  const others = [...providers].filter((p) => p !== demoUsaha);
  const ranked = (await Promise.all(others.map(async (p) => ({ p, b: await balance(p) })))).sort((a, b) => b.b - a.b).map((x) => x.p);

  for (const p of [demoUsaha, ranked[0]!, ranked[1]!]) {
    const w = await request(p, 0.5);
    if (!w) continue;
    await approveWithdrawal(adminId, w.id);
    await syncWithdrawal(w.id);
    count('COMPLETED');
  }
  const pending = await request(demoUsaha, 0.3);
  if (pending) count('REQUESTED');
  const rejected = await request(ranked[2]!, 0.4);
  if (rejected) {
    await rejectWithdrawal(adminId, rejected.id, 'Nama pemilik rekening tidak sama dengan nama pemilik usaha');
    count('REJECTED');
  }
  return tally;
}

/** Status akhir toggle ketersediaan: sebagian pekerja menyala, dekat basis usaha. Bukan uang. */
async function finalAvailability(providers: RtProvider[]) {
  const busy = new Set(
    (await prisma.order.findMany({
      where: { providerProfileId: { in: providers.map((p) => p.id) }, status: { in: ['PENDING_ACCEPTANCE', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_VERIFICATION'] } },
      select: { assignedWorkerId: true, offers: { select: { workerId: true } } },
    })).flatMap((o) => [o.assignedWorkerId, ...o.offers.map((x) => x.workerId)]),
  );
  for (const p of providers) {
    for (const w of p.workers.filter((x) => x.accepts && !busy.has(x.id))) {
      const at = near(rng, p.plan.base, 3);
      await prisma.providerWorker.update({ where: { id: w.id }, data: { isAvailable: rng.chance(0.4), currentLatitude: at.lat, currentLongitude: at.lng, locationUpdatedAt: new Date() } });
    }
  }
}

// ------------------------------------------------------------------ bulk (DB lokal k6)

async function runBulk(n: number, passwordHash: string) {
  const r = prng(SEED + 1);
  const subs = await prisma.subcategory.findMany({ where: { slug: { in: SUB_ORDER } }, select: { id: true, slug: true } });
  const CHUNK = 1000;
  for (let start = 0; start < n; start += CHUNK) {
    const size = Math.min(CHUNK, n - start);
    const users = [], profiles = [], wallets = [], workers = [], listings = [], prices = [], mapping = [];
    for (let i = start; i < start + size; i += 1) {
      const userId = randomUUID(), profileId = randomUUID(), workerId = randomUUID();
      const area = AREAS[i % AREAS.length]!;
      const base = near(r, area, 3);
      users.push({ id: userId, fullName: `Bulk ${i + 1}`, email: simEmail(`bulk-${i + 1}`), phone: `+62878${String(i + 1).padStart(7, '0')}`, passwordHash, emailVerifiedAt: new Date() });
      profiles.push({ id: profileId, userId, providerType: 'INDIVIDUAL' as const, businessName: `Bulk Usaha ${i + 1}`, verificationStatus: 'VERIFIED' as const, verifiedAt: new Date(), baseLatitude: base.lat, baseLongitude: base.lng, serviceRadiusKm: r.int(5, 25) });
      wallets.push({ providerProfileId: profileId });
      const at = near(r, base, 2);
      // V6: setiap penyedia bulk punya pekerja ACTIVE yang bersedia ditugaskan.
      workers.push({ id: workerId, providerProfileId: profileId, userId, displayName: `Bulk ${i + 1}`, isOwner: true, membershipStatus: 'ACTIVE' as const, acceptsAssignments: true, isAvailable: r.chance(0.4), currentLatitude: at.lat, currentLongitude: at.lng, approvedAt: new Date() });
      for (let k = r.int(1, 3); k > 0; k -= 1) {
        const sub = r.pick(subs);
        const def = SUBS.get(sub.slug as SubSlug)!;
        const listingId = randomUUID();
        const attrs: Record<string, unknown> = {};
        for (const a of def.attributes.filter((x) => x.attribute_role === 'SPEC' && x.is_required)) {
          const values = (a.options ?? []).map((o) => o.value);
          attrs[a.attribute_key] = a.data_type === 'SELECT' ? r.pick(values) : a.data_type === 'MULTISELECT' ? [r.pick(values)] : a.data_type === 'BOOLEAN' ? r.chance(0.5) : a.validation_rule?.min ?? 1;
        }
        listings.push({ id: listingId, providerProfileId: profileId, subcategoryId: sub.id, title: `${def.name} Bulk ${i + 1}`, price: round(def.min + (def.max - def.min) * r.next(), 5000), estimatedDurationMinutes: 60, attributes: attrs as object, status: 'ACTIVE' as const, supportsScheduled: true, supportsAvailableNow: BOTH_MODES.has(def.slug) });
        // V7: listing ACTIVE terpetakan ke pekerja ACTIVE. Opsi wajib dilayani seluruhnya.
        mapping.push({ workerId, listingId });
        for (const a of def.attributes.filter((x) => x.attribute_role === 'OPTION' && x.is_required)) {
          for (const v of a.data_type === 'SELECT' ? (a.options ?? []).map((o) => o.value) : [null]) {
            prices.push({ listingId, attributeKey: a.attribute_key, optionValue: v, priceDelta: 0 });
          }
        }
      }
    }
    await prisma.$transaction([
      prisma.user.createMany({ data: users }),
      prisma.providerProfile.createMany({ data: profiles }),
      prisma.wallet.createMany({ data: wallets }),
      prisma.providerWorker.createMany({ data: workers }),
      prisma.listing.createMany({ data: listings }),
      prisma.listingOptionPrice.createMany({ data: prices }),
      prisma.workerListing.createMany({ data: mapping }),
    ]);
    console.log(`  bulk ${start + size}/${n}`);
  }
}

// ------------------------------------------------------------------ ringkasan

/**
 * Pengiriman email berjalan setelah commit tanpa ditunggu. Notifikasi order terminal dihapus
 * saat digeser, jadi tunggu kirimannya selesai dulu supaya tidak memperbarui baris yang hilang.
 */
async function drainEmails(orderId: string) {
  const refs = [orderId, ...(await prisma.review.findMany({ where: { orderId }, select: { id: true } })).map((r) => r.id)];
  for (let i = 0; i < 50; i += 1) {
    if ((await prisma.notification.count({ where: { channel: 'EMAIL', emailStatus: 'PENDING', referenceId: { in: refs } } })) === 0) return;
    await new Promise((r) => setTimeout(r, 100));
  }
}

async function waitForEmails() {
  for (let i = 0; i < 60; i += 1) {
    const pending = await prisma.notification.count({ where: { channel: 'EMAIL', emailStatus: 'PENDING', user: { email: { endsWith: SIM_DOMAIN } } } });
    if (pending === 0) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.warn('  Masih ada notifikasi EMAIL PENDING setelah 60 detik (tidak terkirim ke mana pun, jsonTransport).');
}

async function printSummary(providers: RtProvider[]) {
  const sim = { providerProfile: { user: { email: { endsWith: SIM_DOMAIN } } } };
  const [users, statuses, reviews, replies, photos, ledger, withdrawals] = await Promise.all([
    prisma.user.count({ where: { email: { endsWith: SIM_DOMAIN } } }),
    prisma.order.groupBy({ by: ['status'], where: sim, _count: true }),
    prisma.review.count({ where: sim }),
    prisma.review.count({ where: { ...sim, providerReply: { not: null } } }),
    prisma.listingPhoto.count({ where: { listing: sim } }),
    prisma.walletTransaction.count({ where: { wallet: sim } }),
    prisma.withdrawal.groupBy({ by: ['status'], where: { wallet: sim }, _count: true }),
  ]);
  console.log(`\nAkun @sim: ${users}. Foto: ${photos}. Review: ${reviews} (${replies} dibalas). Baris ledger: ${ledger}.`);
  console.log('Order per status:', Object.fromEntries(statuses.map((s) => [s.status, s._count])));
  console.log('Withdrawal per status:', Object.fromEntries(withdrawals.map((s) => [s.status, s._count])));

  const rows = await prisma.providerProfile.findMany({
    where: { id: { in: providers.map((p) => p.id) } },
    select: { id: true, businessName: true, providerType: true, ratingAverage: true, ratingCount: true, completedOrdersCount: true, serviceRadiusKm: true },
  });
  console.log('\nPenyedia:');
  console.table(providers.map((p) => {
    const r = rows.find((x) => x.id === p.id)!;
    return {
      usaha: r.businessName, tipe: r.providerType, wilayah: areaOf(p.plan.spec.area).name, radius_km: r.serviceRadiusKm?.toNumber(),
      pekerja: p.workers.length, listing: p.listings.length, rating: `${r.ratingAverage.toNumber().toFixed(2)} (${r.ratingCount})`, selesai: r.completedOrdersCount,
    };
  }));
  console.log('Listing per sub-kategori:');
  console.table(SUB_ORDER.map((slug) => ({ sub_kategori: slug, listing: providers.flatMap((p) => p.listings).filter((l) => l.slug === slug).length })));
}

function printAccounts() {
  console.log(`\nAkun demo (password seluruhnya: ${PASSWORD}):`);
  console.table([
    { peran: 'Client', email: simEmail('demo.client'), catatan: 'Order di setiap status UI' },
    { peran: 'Pemilik perorangan', email: simEmail('demo.perorangan'), catatan: 'Rias Ayu Sari, MUA (INDIVIDUAL)' },
    { peran: 'Pemilik usaha', email: simEmail('demo.usaha'), catatan: 'Lensa Dewata Production (BUSINESS), penerima lamaran UAT' },
    { peran: 'Pekerja', email: simEmail('demo.pekerja'), catatan: 'Penanggung jawab order hidup Lensa Dewata' },
    { peran: 'Pendamping', email: simEmail('demo.pendamping'), catatan: 'Kru order dokumentasi besok' },
    { peran: 'Admin', email: simEmail('demo.admin'), catatan: 'Admin demo' },
    { peran: 'Admin UAT', email: `uat-admin-01..03${UAT_DOMAIN}`, catatan: 'Tidak dihapus reset' },
  ]);
}

// ------------------------------------------------------------------ main

async function main() {
  assertPlanShape();
  const target = assertTarget(process.env.DATABASE_URL, { confirmHost: value('--confirm-host'), bulk: BULK > 0, bulkRemote: flag('--bulk-remote') });
  console.log(`Basis data tujuan: ${target.host}/${target.database}${target.local ? ' (lokal)' : ''}`);

  const plan = makePlan();
  if (DRY_RUN) {
    console.log('\n--dry-run, tidak ada yang ditulis.');
    console.log(`Rencana: ${plan.providers.length} penyedia (${PROVIDERS.filter((p) => p.type === 'BUSINESS').length} BUSINESS), ` +
      `${plan.providers.reduce((s, p) => s + p.workers.length, 0)} pekerja, ${PROVIDERS.reduce((s, p) => s + p.listings.length, 0)} listing, ` +
      `${plan.clients.length} client, ${HISTORY.reduce((s, [, n]) => s + n, 0)} order riwayat + ${LIVE.length} order hidup${BULK ? `, bulk ${BULK} penyedia` : ''}.`);
    console.table(Object.entries(LISTINGS_PER_SUB).map(([sub, n]) => ({ sub_kategori: sub, listing: n })));
    console.table(HISTORY.map(([kind, n]) => ({ riwayat: kind, order: n })));
    console.log('Order hidup:', LIVE.join('; '));
    console.log(`Data simulasi yang sudah ada: ${await prisma.user.count({ where: { email: { endsWith: SIM_DOMAIN } } })} akun @sim.`);
    console.table((await findForeignLinks()).filter((f) => f.count > 0));
    printAccounts();
    return;
  }

  const foreign = (await findForeignLinks()).filter((f) => f.count > 0);
  if (foreign.length > 0) {
    console.error('\nDITOLAK: ada data akun non-simulasi yang terkait data simulasi. Reset akan menghapus jejak mereka.');
    console.table(foreign);
    console.error('Jangan reset selama dan sesudah UAT (docs/Data-Simulasi.md).');
    process.exitCode = 1;
    return;
  }
  const started = Date.now();
  const reset = await resetSimulation({ photos: true });
  console.log(`Reset: ${reset.users} akun, ${reset.orders} order, ${reset.files} berkas foto dihapus.`);
  if (RESET_ONLY) return;

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  await seedCatalog(prisma);
  await createUsers(plan, passwordHash);
  const providers = await createProviders(plan);
  console.log(`Penyedia dan pekerja dibuat (${providers.length}).`);
  await createListings(providers);
  console.log(`Listing dibuat (${providers.reduce((s, p) => s + p.listings.length, 0)}).`);
  const clients = await createClients(plan);
  console.log('Riwayat order:');
  const history = await runHistory(providers, clients);
  console.log('  status akhir riwayat:', Object.fromEntries(history));
  const withdrawals = await runWithdrawals(providers);
  console.log('Withdrawal:', withdrawals);
  const live = await runLive(providers, clients);
  console.log('Order hidup:');
  console.table(live);
  await finalAvailability(providers);
  if (BULK > 0) await runBulk(BULK, passwordHash);
  await waitForEmails();
  await printSummary(providers);
  printAccounts();
  console.log(`\nSelesai dalam ${Math.round((Date.now() - started) / 1000)} detik. Jalankan db:verify sesudahnya.`);
}

main()
  .catch((error) => {
    console.error('\nSeed simulasi gagal:', error instanceof Error ? error.stack ?? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
