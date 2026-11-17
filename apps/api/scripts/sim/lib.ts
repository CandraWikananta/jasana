/**
 * Bagian seed simulasi yang punya logika sendiri dan diuji
 * (tests/seed-simulasi.test.ts): PRNG, pengaman target, pengaman data asing,
 * pergeseran waktu order, PNG buatan, dan reset.
 */

import { deflateSync } from 'node:zlib';
import { prisma, Prisma } from '@jasana/database';
import { LISTING_PHOTO_BUCKET } from '../../src/config/constants';
import { storage } from '../../src/lib/supabase';
import { witaDateKey } from '../../src/lib/wita';

export const SIM_DOMAIN = '@sim.jasana.test';
/** Admin UAT. Dibuat dengan upsert dan TIDAK PERNAH dihapus reset. */
export const UAT_DOMAIN = '@uat.jasana.test';
const SIM_LIKE = `%${SIM_DOMAIN}`;

// ---------------------------------------------------------------- PRNG

/** mulberry32: kecil, cepat, dan hasilnya sama di setiap mesin untuk seed yang sama. */
export function prng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const pick = <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)]!;
  const chance = (p: number) => next() < p;
  const shuffle = <T>(items: readonly T[]): T[] => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(next() * (i + 1));
      [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    }
    return copy;
  };
  return { next, int, pick, chance, shuffle };
}
export type Rng = ReturnType<typeof prng>;

// ---------------------------------------------------------------- target

export interface Target {
  host: string;
  database: string;
  local: boolean;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

/**
 * Lokal (localhost) dengan nama basis data memuat "test" langsung jalan. Selain itu
 * wajib `--confirm-host <host>` yang sama persis. `--bulk` hanya untuk basis data
 * lokal stress test, ke host lain wajib `--bulk-remote` juga (D207).
 */
export function assertTarget(
  url: string | undefined,
  options: { confirmHost?: string; bulk?: boolean; bulkRemote?: boolean } = {},
): Target {
  let parsed: URL;
  try {
    parsed = new URL(url ?? '');
  } catch {
    throw new Error('DATABASE_URL kosong atau bukan URL.');
  }
  const host = parsed.hostname;
  const database = parsed.pathname.replace(/^\//, '');
  const local = LOCAL_HOSTS.has(host);
  if (!(local && /test/i.test(database)) && options.confirmHost !== host) {
    throw new Error(
      `Target ${host}/${database} tidak dikenali otomatis. Kalau memang ini tujuannya, jalankan ulang dengan --confirm-host ${host}`,
    );
  }
  if (options.bulk && !local && !options.bulkRemote) {
    throw new Error(
      `PERINGATAN: --bulk ditujukan untuk basis data lokal stress test k6, bukan ${host}. ` +
        'Data bulk memenuhi tabel pencarian. Batalkan, atau tambahkan --bulk-remote kalau benar-benar disengaja.',
    );
  }
  return { host, database, local };
}

// ---------------------------------------------------------------- data asing

export interface ForeignLink {
  label: string;
  count: number;
}

/**
 * Baris milik akun NON-simulasi yang terkait data simulasi. Reset menghapus seluruh
 * data simulasi, jadi kalau ada responden UAT yang memesan ke listing simulasi atau
 * melamar ke usaha simulasi, reset harus berhenti, bukan menghapus jejak mereka.
 *
 * Sim = user ber-email @sim.jasana.test. Usaha sim = profil milik user sim.
 * Order sim = client sim ATAU usaha sim. Setiap baris di bawah adalah relasi yang
 * menyeberang batas itu (FK ke users, provider_profiles, dan orders di schema.prisma).
 */
export async function findForeignLinks(): Promise<ForeignLink[]> {
  const [row] = await prisma.$queryRaw<Record<string, number>[]>`
    WITH s AS (SELECT id FROM users WHERE email LIKE ${SIM_LIKE}),
    p AS (SELECT id FROM provider_profiles WHERE user_id IN (SELECT id FROM s)),
    o AS (SELECT id FROM orders WHERE client_id IN (SELECT id FROM s) OR provider_profile_id IN (SELECT id FROM p))
    SELECT
      (SELECT count(*) FROM orders
        WHERE (client_id IN (SELECT id FROM s)) <> (provider_profile_id IN (SELECT id FROM p)))::int AS "order lintas sim dan non-sim",
      (SELECT count(*) FROM provider_workers
        WHERE (user_id IN (SELECT id FROM s)) <> (provider_profile_id IN (SELECT id FROM p)))::int AS "keanggotaan atau lamaran pekerja lintas",
      (SELECT count(*) FROM order_status_histories
        WHERE changed_by_user_id IN (SELECT id FROM s) AND order_id NOT IN (SELECT id FROM o))::int AS "riwayat status order non-sim oleh akun sim",
      (SELECT count(*) FROM order_messages
        WHERE sender_user_id IN (SELECT id FROM s) AND order_id NOT IN (SELECT id FROM o))::int AS "pesan akun sim di order non-sim",
      (SELECT count(*) FROM order_crew
        WHERE added_by IN (SELECT id FROM s) AND order_id NOT IN (SELECT id FROM o))::int AS "kru order non-sim ditambah akun sim",
      (SELECT count(*) FROM refunds
        WHERE (initiated_by IN (SELECT id FROM s) OR completed_by IN (SELECT id FROM s))
          AND order_id NOT IN (SELECT id FROM o))::int AS "refund order non-sim oleh akun sim",
      (SELECT count(*) FROM disputes
        WHERE (resolved_by IN (SELECT id FROM s) OR raised_by_user_id IN (SELECT id FROM s))
          AND order_id NOT IN (SELECT id FROM o))::int AS "sengketa order non-sim oleh akun sim",
      (SELECT count(*) FROM dispute_evidences e JOIN disputes d ON d.id = e.dispute_id
        WHERE e.uploaded_by_user_id IN (SELECT id FROM s) AND d.order_id NOT IN (SELECT id FROM o))::int AS "bukti sengketa non-sim oleh akun sim",
      (SELECT count(*) FROM withdrawals w JOIN wallets wa ON wa.id = w.wallet_id
        WHERE w.reviewed_by IN (SELECT id FROM s) AND wa.provider_profile_id NOT IN (SELECT id FROM p))::int AS "withdrawal non-sim diputus admin sim",
      (SELECT count(*) FROM provider_profiles
        WHERE verified_by IN (SELECT id FROM s) AND id NOT IN (SELECT id FROM p))::int AS "e-KYC non-sim diputus admin sim",
      (SELECT count(*) FROM provider_workers
        WHERE approved_by IN (SELECT id FROM s) AND provider_profile_id NOT IN (SELECT id FROM p))::int AS "pekerja non-sim disetujui akun sim",
      (SELECT count(*) FROM taxonomy_requests
        WHERE reviewed_by IN (SELECT id FROM s) AND provider_profile_id NOT IN (SELECT id FROM p))::int AS "usulan taksonomi non-sim diputus admin sim",
      (SELECT count(*) FROM taxonomy_requests WHERE provider_profile_id IN (SELECT id FROM p))::int AS "usulan taksonomi dari usaha sim",
      (SELECT count(*) FROM platform_settings WHERE updated_by IN (SELECT id FROM s))::int AS "parameter sistem diubah akun sim"
  `;
  return Object.entries(row ?? {}).map(([label, count]) => ({ label, count: Number(count) }));
}

// ---------------------------------------------------------------- pergeseran waktu

const iv = (ms: number) => Prisma.sql`make_interval(secs => ${ms / 1000}::double precision)`;
const shiftCols = (cols: string[], ms: number) =>
  Prisma.join(cols.map((c) => Prisma.sql`${Prisma.raw(c)} = ${Prisma.raw(c)} - ${iv(ms)}`), ', ');

/** Kolom waktu per tabel (schema.prisma). Kolom NULL tetap NULL. */
export const ORDER_TIME_COLUMNS = {
  orders: [
    'scheduled_at', 'verification_locked_until', 'verification_expires_at', 'verified_at', 'response_deadline_at',
    'payment_deadline_at', 'settlement_due_at', 'accepted_at', 'paid_at', 'started_at', 'completed_at', 'settled_at',
    'cancelled_at', 'created_at', 'updated_at',
  ],
  payments: ['expires_at', 'paid_at', 'created_at', 'updated_at'],
  order_status_histories: ['created_at'],
  order_offers: ['offered_at', 'declined_at', 'sla_missed_at'],
  order_checkins: ['created_at'],
  order_crew: ['created_at'],
  order_messages: ['read_at', 'created_at'],
  refunds: ['created_at', 'completed_at'],
  disputes: ['created_at', 'resolved_at'],
  reviews: ['provider_replied_at', 'created_at', 'updated_at'],
  wallet_transactions: ['created_at'],
} as const;

/**
 * Menggeser seluruh jejak waktu satu order terminal sejauh `offsetMs` ke belakang,
 * dalam satu transaksi (usulan D205). Nominal tidak pernah disentuh, jadi V1 tetap nol.
 *
 * - `order_number` ditulis ulang dengan tanggal WITA yang baru, akhiran acaknya tetap.
 * - `settleGapMs` (order SETTLED lewat holding window): settled_at, baris riwayat
 *   SETTLED, dan ledger ESCROW_RELEASE dipindah ke completed_at + gap, supaya dana
 *   cair sehari setelah selesai, bukan beberapa detik.
 * - Notifikasi order itu DIHAPUS (penyesuaian penyusun): teksnya memuat jam saat skrip
 *   berjalan dan akan menyesatkan. Rujukannya order, review, refund, atau sengketa.
 *
 * Pengecualian aturan 3 (UPDATE wallet_transactions.created_at) hanya untuk order
 * milik usaha @sim.jasana.test. Order lain ditolak.
 */
export async function shiftOrderTimes(orderId: string, offsetMs: number, settleGapMs?: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { orderNumber: true, createdAt: true, providerProfile: { select: { user: { select: { email: true } } } } },
    });
    if (!order.providerProfile.user.email.endsWith(SIM_DOMAIN)) {
      throw new Error(`Order ${orderId} bukan milik usaha simulasi, waktunya tidak boleh digeser.`);
    }
    const orderNumber = order.orderNumber.replace(/^ORD-\d{8}-/, `ORD-${witaDateKey(new Date(order.createdAt.getTime() - offsetMs))}-`);
    await tx.$executeRaw`UPDATE orders SET ${shiftCols([...ORDER_TIME_COLUMNS.orders], offsetMs)}, order_number = ${orderNumber} WHERE id = ${orderId}::uuid`;
    for (const table of ['payments', 'order_status_histories', 'order_offers', 'order_checkins', 'order_crew', 'order_messages', 'refunds', 'disputes', 'reviews', 'wallet_transactions'] as const) {
      await tx.$executeRaw`UPDATE ${Prisma.raw(table)} SET ${shiftCols([...ORDER_TIME_COLUMNS[table]], offsetMs)} WHERE order_id = ${orderId}::uuid`;
    }
    await tx.$executeRaw`
      UPDATE dispute_evidences SET created_at = created_at - ${iv(offsetMs)}
      WHERE dispute_id IN (SELECT id FROM disputes WHERE order_id = ${orderId}::uuid)`;

    if (settleGapMs !== undefined) {
      await tx.$executeRaw`
        UPDATE orders SET settlement_due_at = completed_at + ${iv(settleGapMs)}, settled_at = completed_at + ${iv(settleGapMs)}
        WHERE id = ${orderId}::uuid AND completed_at IS NOT NULL AND settled_at IS NOT NULL`;
      await tx.$executeRaw`
        UPDATE order_status_histories h SET created_at = o.settled_at FROM orders o
        WHERE o.id = h.order_id AND h.order_id = ${orderId}::uuid AND h.to_status = 'SETTLED'`;
      await tx.$executeRaw`
        UPDATE wallet_transactions t SET created_at = o.settled_at FROM orders o
        WHERE o.id = t.order_id AND t.order_id = ${orderId}::uuid AND t.type = 'ESCROW_RELEASE'`;
    }

    await tx.$executeRaw`
      DELETE FROM notifications WHERE reference_id IN (
        SELECT ${orderId}::uuid
        UNION SELECT id FROM reviews WHERE order_id = ${orderId}::uuid
        UNION SELECT id FROM refunds WHERE order_id = ${orderId}::uuid
        UNION SELECT id FROM disputes WHERE order_id = ${orderId}::uuid)`;
  });
}

// ---------------------------------------------------------------- PNG buatan

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(bytes: Buffer): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

export type Rgb = [number, number, number];

/**
 * PNG RGB tanpa teks dan tanpa dependensi (zlib bawaan): gradien diagonal dua warna
 * kategori, dengan pola geometris pembeda sub-kategori (`pattern` 0..11) dan variasi
 * per listing (`variant`). Tidak memuat wajah atau foto apa pun (D206).
 */
export function makePng(width: number, height: number, from: Rgb, to: Rgb, pattern: number, variant: number): Buffer {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  const cx = width * (0.3 + 0.4 * ((variant * 37) % 100) / 100);
  const cy = height * (0.3 + 0.4 * ((variant * 61) % 100) / 100);
  const size = Math.min(width, height) * (0.18 + 0.04 * (variant % 4));
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const t = (x / width + y / height) / 2;
      let rgb = from.map((c, i) => Math.round(c + (to[i]! - c) * t)) as Rgb;
      const dx = x - cx, dy = y - cy;
      const r = Math.hypot(dx, dy);
      let on = false;
      switch (pattern % 6) {
        case 0: on = r < size; break; // lingkaran
        case 1: on = Math.abs(dx) < size && Math.abs(dy) < size; break; // persegi
        case 2: on = Math.abs(dx) + Math.abs(dy) < size * 1.3; break; // belah ketupat
        case 3: on = r < size && r > size * 0.6; break; // cincin
        case 4: on = Math.abs(dy) < size * 0.35 || Math.abs(dx) < size * 0.35; break; // tanda tambah
        default: on = ((Math.floor(x / (size / 2)) + Math.floor(y / (size / 2))) % 2 === 0) && r < size * 1.6; break; // papan catur
      }
      // Enam sub-kategori kedua memakai pola yang sama dengan garis diagonal tipis.
      if (pattern >= 6 && Math.abs((x - y + 1000) % Math.round(size / 2)) < 2) on = !on;
      if (on) rgb = rgb.map((c) => Math.round(c + (255 - c) * 0.55)) as Rgb;
      raw[row + 1 + x * 3] = rgb[0];
      raw[row + 2 + x * 3] = rgb[1];
      raw[row + 3 + x * 3] = rgb[2];
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- reset

export interface ResetResult {
  users: number;
  orders: number;
  files: number;
}

/**
 * Menghapus seluruh data simulasi (domain @sim.jasana.test), termasuk berkas foto di
 * folder Storage setiap pemilik usaha. Pemanggil WAJIB memeriksa `findForeignLinks`
 * lebih dulu. Ledger dompet usaha sim ikut dihapus (perluasan D130, usulan D205).
 *
 * Urutan mengikuti FK restrict: ledger, withdrawal, refund, payment, sengketa, review,
 * order (crew, offer, pesan, riwayat, check-in ikut cascade), pekerja, lalu user
 * (profil, wallet, listing, alamat, token, notifikasi ikut cascade).
 */
export async function resetSimulation(options: { photos: boolean }): Promise<ResetResult> {
  const users = await prisma.user.findMany({ where: { email: { endsWith: SIM_DOMAIN } }, select: { id: true, email: true } });
  const ids = users.map((u) => u.id);

  let files = 0;
  if (options.photos) {
    // Bulk tidak punya foto. Folder dibaca dari Storage, jadi sisa unggahan run yang gagal ikut terhapus.
    const owners = await prisma.providerProfile.findMany({
      where: { userId: { in: ids }, user: { email: { not: { startsWith: 'bulk-' } } } },
      select: { userId: true },
    });
    for (const { userId } of owners) {
      const objects = (await storage.list(LISTING_PHOTO_BUCKET, `${userId}/`)).filter((o) => o.id !== null);
      await storage.remove(LISTING_PHOTO_BUCKET, objects.map((o) => `${userId}/${o.name}`));
      files += objects.length;
    }
  }

  const provider = { providerProfile: { userId: { in: ids } } };
  const order = { OR: [{ clientId: { in: ids } }, provider] };
  const orders = await prisma.$transaction(
    async (tx) => {
      // Notifikasi admin non-sim (misalnya "Sengketa dibuka") tidak ikut cascade dari user sim.
      const simOrders = await tx.order.findMany({ where: order, select: { id: true, dispute: { select: { id: true } } } });
      const refs = simOrders.flatMap((o) => (o.dispute ? [o.id, o.dispute.id] : [o.id]));
      await tx.notification.deleteMany({ where: { referenceId: { in: refs } } });
      await tx.walletTransaction.deleteMany({ where: { wallet: provider } });
      await tx.withdrawal.deleteMany({ where: { wallet: provider } });
      await tx.refund.deleteMany({ where: { order } });
      await tx.payment.deleteMany({ where: { order } });
      await tx.dispute.deleteMany({ where: { order } });
      await tx.review.deleteMany({ where: { order } });
      const { count } = await tx.order.deleteMany({ where: order });
      await tx.providerWorker.deleteMany({ where: { OR: [{ userId: { in: ids } }, provider] } });
      await tx.listing.deleteMany({ where: provider });
      await tx.user.deleteMany({ where: { id: { in: ids } } });
      return count;
    },
    { timeout: 600_000, maxWait: 30_000 },
  );
  return { users: ids.length, orders, files };
}
