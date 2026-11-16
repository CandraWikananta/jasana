/**
 * Sesi chatbot tamu dan terdaftar (D77, D155), akses, dan cron sesi tamu.
 *
 * Identitas tamu adalah `guest_token` 32 byte acak. Yang disimpan hanya hash
 * SHA-256-nya (pola D63), jadi isi basis data yang bocor tidak bisa dipakai
 * melanjutkan sesi orang lain.
 *
 * Akses (usulan D162):
 *   tanpa identitas, format token salah       401 UNAUTHORIZED (controller)
 *   sesi tidak ada atau milik orang lain      404 NOT_FOUND, keberadaannya tidak dibocorkan
 *   sesi tamu ENDED atau kedaluwarsa          409 CHAT_SESSION_ENDED untuk semua aksi
 *   sesi terdaftar ENDED                      riwayat tetap terbaca (D77 permanen),
 *                                             kirim pesan dan end 409 CHAT_SESSION_ENDED
 *   token tamu ke sesi yang sudah diklaim     404, sesinya milik akun (usulan D170)
 *
 * Klaim (H68, D155, usulan D170): JWT dan X-Guest-Token wajib. Token salah 404,
 * sudah diklaim 409 CHAT_SESSION_ALREADY_CLAIMED, ENDED atau kedaluwarsa 409
 * CHAT_SESSION_ENDED. guest_token tetap disimpan karena V9 menghitung sesi tamu
 * dari kolom itu.
 */

import { Prisma, prisma, type ChatSession, type OrderStatus } from '@jasana/database';
import { CHAT_SNAPSHOT_HISTORY_LIMIT } from '../../config/constants';
import { AppError, Errors } from '../../lib/errors';
import { generateToken, hashToken } from '../../lib/crypto';
import { logger } from '../../lib/logger';
import { pageMeta, skipTake, type Page, type Paginated } from '../../lib/pagination';
import { subcategoryKey } from '../../lib/llm-intent';
import { getNumberSetting } from '../settings/settings.service';

export type ChatIdentity = { userId: string } | { guestToken: string };

const HOUR_MS = 60 * 60 * 1000;

export interface ChatSessionDto {
  id: string;
  type: 'GUEST' | 'REGISTERED';
  status: ChatSession['status'];
  title: string | null;
  message_count: number;
  expires_at: string | null;
  claimed_at: string | null;
  started_at: string;
  ended_at: string | null;
}

export function toSessionDto(row: ChatSession): ChatSessionDto {
  return {
    id: row.id,
    type: row.userId === null ? 'GUEST' : 'REGISTERED',
    status: row.status,
    title: row.title,
    message_count: row.messageCount,
    expires_at: row.expiresAt?.toISOString() ?? null,
    claimed_at: row.claimedAt?.toISOString() ?? null,
    started_at: row.startedAt.toISOString(),
    ended_at: row.endedAt?.toISOString() ?? null,
  };
}

/** POST /chat/guest-sessions. Token mentah hanya ada di respons ini. */
export async function createGuestSession(): Promise<{ session: ChatSessionDto; guest_token: string; message_limit: number }> {
  const [hours, messageLimit] = await Promise.all([
    getNumberSetting('guest_chat_session_hours'),
    getNumberSetting('guest_chat_message_limit'),
  ]);
  const token = generateToken();
  const row = await prisma.chatSession.create({
    data: { guestToken: hashToken(token), expiresAt: new Date(Date.now() + hours * HOUR_MS) },
  });
  return { session: toSessionDto(row), guest_token: token, message_limit: messageLimit };
}

// ---------------------------------------------------------------------------
// personalization_snapshot (D27, usulan D168 dan D169)
// ---------------------------------------------------------------------------

/** Order yang sudah dibayar dan tidak batal, ditolak, kedaluwarsa, disengketakan, atau dikembalikan. */
export const SNAPSHOT_ORDER_STATUSES: OrderStatus[] = [
  'PAID', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'COMPLETED', 'SETTLED',
];

export interface PersonalizationSnapshot {
  versi: 1;
  dihitung_pada: string;
  sumber: 'sesi_baru' | 'klaim';
  riwayat_sub_kategori: { kunci: string; nama: string; jumlah: number }[];
  kota_alamat_default: string | null;
  rata_rating_diberikan: number | null;
  jumlah_ulasan: number;
  /** Dari `orders.listing_base_amount`, kolom yang sama dengan `nilai_harga_dasar` di V4. */
  rentang_harga: { min: number; maks: number } | null;
}

/**
 * Empat sumber D27, dihitung sekali per sesi lalu tidak diubah, supaya jawaban
 * bisa diaudit. Yang sampai ke prompt hanya kunci riwayat sub-kategori
 * (llm-prompt). Kota tanpa koordinat dan alamat baris, karena lokasi pencarian
 * dibaca langsung dari user_addresses saat pesan dikirim.
 */
export async function buildPersonalizationSnapshot(userId: string, sumber: PersonalizationSnapshot['sumber']): Promise<PersonalizationSnapshot> {
  const [orders, address, reviews] = await Promise.all([
    // shortcut: semua order client dimuat ke memori. Ganti dengan groupBy di SQL kalau satu client punya ratusan order.
    prisma.order.findMany({
      where: { clientId: userId, status: { in: SNAPSHOT_ORDER_STATUSES } },
      select: {
        listingBaseAmount: true,
        createdAt: true,
        listing: { select: { subcategory: { select: { name: true, slug: true, category: { select: { slug: true } } } } } },
      },
    }),
    prisma.userAddress.findFirst({ where: { userId, isDefault: true }, select: { city: true } }),
    prisma.review.aggregate({ where: { clientId: userId }, _avg: { rating: true }, _count: { _all: true } }),
  ]);

  const history = new Map<string, { kunci: string; nama: string; jumlah: number; terakhir: number }>();
  for (const order of orders) {
    const sub = order.listing.subcategory;
    const kunci = subcategoryKey(sub.category.slug, sub.slug);
    const entry = history.get(kunci) ?? { kunci, nama: sub.name, jumlah: 0, terakhir: 0 };
    entry.jumlah += 1;
    entry.terakhir = Math.max(entry.terakhir, order.createdAt.getTime());
    history.set(kunci, entry);
  }
  const prices = orders.map((order) => order.listingBaseAmount.toNumber());
  const average = reviews._avg.rating;

  return {
    versi: 1,
    dihitung_pada: new Date().toISOString(),
    sumber,
    riwayat_sub_kategori: [...history.values()]
      .sort((a, b) => b.jumlah - a.jumlah || b.terakhir - a.terakhir || a.kunci.localeCompare(b.kunci))
      .slice(0, CHAT_SNAPSHOT_HISTORY_LIMIT)
      .map(({ kunci, nama, jumlah }) => ({ kunci, nama, jumlah })),
    kota_alamat_default: address?.city ?? null,
    rata_rating_diberikan: average === null ? null : Math.round(average * 100) / 100,
    jumlah_ulasan: reviews._count._all,
    rentang_harga: prices.length > 0 ? { min: Math.min(...prices), maks: Math.max(...prices) } : null,
  };
}

const snapshotJson = (snapshot: PersonalizationSnapshot) => snapshot as unknown as Prisma.InputJsonValue;

/** POST /chat/sessions */
export async function createUserSession(userId: string): Promise<ChatSessionDto> {
  const snapshot = await buildPersonalizationSnapshot(userId, 'sesi_baru');
  return toSessionDto(await prisma.chatSession.create({ data: { userId, personalizationSnapshot: snapshotJson(snapshot) } }));
}

/** GET /chat/sessions */
export async function listUserSessions(userId: string, page: Page): Promise<Paginated<ChatSessionDto>> {
  const where = { userId };
  const [rows, total] = await Promise.all([
    prisma.chatSession.findMany({ where, orderBy: [{ startedAt: 'desc' }, { id: 'desc' }], ...skipTake(page) }),
    prisma.chatSession.count({ where }),
  ]);
  return { items: rows.map(toSessionDto), meta: pageMeta(page, total) };
}

const ended = () => new AppError('CHAT_SESSION_ENDED', 'Sesi chat sudah berakhir, mulai sesi baru');

/**
 * Sesi milik pemanggil. `write` untuk kirim pesan dan end, yang menolak sesi
 * ENDED dari jenis apa pun.
 */
export async function findOwnSession(id: string, identity: ChatIdentity, write: boolean): Promise<ChatSession> {
  // Tamu hanya sesi yang belum diklaim: token yang tertinggal di perangkat tidak membuka percakapan milik akun (usulan D170).
  const where =
    'userId' in identity ? { id, userId: identity.userId } : { id, userId: null, guestToken: hashToken(identity.guestToken) };
  const session = await prisma.chatSession.findFirst({ where });
  if (!session) throw Errors.notFound('Sesi chat tidak ditemukan');

  const guest = session.userId === null;
  const expired = session.expiresAt !== null && session.expiresAt <= new Date();
  if (guest && (session.status === 'ENDED' || expired)) throw ended();
  if (write && session.status === 'ENDED') throw ended();
  return session;
}

export interface ChatMessageDto {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  /** Jenis intent untuk balasan ASSISTANT, null untuk pesan USER dan balasan gagal. */
  intent: string | null;
  recommended_listing_ids: string[];
  created_at: string;
}

interface MessageRow {
  id: bigint;
  role: ChatMessageDto['role'];
  content: string;
  extractedIntent: unknown;
  recommendedListingIds: unknown;
  createdAt: Date;
}

/** Kolom pengukuran (model, token, latensi, confidence) tidak dikirim ke pengguna. */
export function toMessageDto(row: MessageRow): ChatMessageDto {
  const intent = row.extractedIntent as { jenis?: unknown } | null;
  return {
    id: row.id.toString(),
    role: row.role,
    content: row.content,
    intent: typeof intent?.jenis === 'string' ? intent.jenis : null,
    recommended_listing_ids: Array.isArray(row.recommendedListingIds) ? (row.recommendedListingIds as string[]) : [],
    created_at: row.createdAt.toISOString(),
  };
}

/** GET /chat/sessions/:id/messages, lama ke baru. */
export async function listMessages(id: string, identity: ChatIdentity, page: Page): Promise<Paginated<ChatMessageDto>> {
  await findOwnSession(id, identity, false);
  const where = { sessionId: id };
  const [rows, total] = await Promise.all([
    prisma.chatMessage.findMany({ where, orderBy: { id: 'asc' }, ...skipTake(page) }),
    prisma.chatMessage.count({ where }),
  ]);
  return { items: rows.map(toMessageDto), meta: pageMeta(page, total) };
}

const alreadyClaimed = () => new AppError('CHAT_SESSION_ALREADY_CLAIMED', 'Sesi chat ini sudah diklaim');

/** POST /chat/sessions/:id/claim (H68, D155, usulan D170). */
export async function claimSession(id: string, userId: string, guestToken: string): Promise<ChatSessionDto> {
  const where = { id, guestToken: hashToken(guestToken) };
  const session = await prisma.chatSession.findFirst({ where });
  if (!session) throw Errors.notFound('Sesi chat tidak ditemukan');
  if (session.userId !== null) throw alreadyClaimed();
  const now = new Date();
  if (session.status === 'ENDED' || (session.expiresAt !== null && session.expiresAt <= now)) throw ended();

  // Dihitung sebelum UPDATE dan di luar transaksi: hanya baca, dan UPDATE di bawah yang memutuskan pemenang.
  const snapshot = await buildPersonalizationSnapshot(userId, 'klaim');
  // UPDATE bersyarat atomik, bukan baca lalu cek: dua klaim paralel, tepat satu yang mengisi user_id.
  const { count } = await prisma.chatSession.updateMany({
    where: { ...where, userId: null, status: 'ACTIVE', expiresAt: { gt: now } },
    data: { userId, claimedAt: now, expiresAt: null, personalizationSnapshot: snapshotJson(snapshot) },
  });
  if (count === 0) {
    const current = await prisma.chatSession.findUniqueOrThrow({ where: { id }, select: { userId: true } });
    throw current.userId !== null ? alreadyClaimed() : ended();
  }
  return toSessionDto(await prisma.chatSession.findUniqueOrThrow({ where: { id } }));
}

/** POST /chat/sessions/:id/end */
export async function endSession(id: string, identity: ChatIdentity): Promise<ChatSessionDto> {
  await findOwnSession(id, identity, true);
  // Bersyarat ACTIVE: dua end bersamaan, yang kedua 409, bukan menimpa ended_at.
  const { count } = await prisma.chatSession.updateMany({
    where: { id, status: 'ACTIVE' },
    data: { status: 'ENDED', endedAt: new Date() },
  });
  if (count === 0) throw ended();
  return toSessionDto(await prisma.chatSession.findUniqueOrThrow({ where: { id } }));
}

/**
 * Cron tiap jam (PRD 7.1): sesi tamu kedaluwarsa ditandai ENDED. Datanya tidak
 * dihapus karena jadi bahan pengukuran Bab IV. Satu UPDATE, jadi tidak perlu
 * batch FOR UPDATE SKIP LOCKED.
 */
export async function endExpiredGuestSessions(now = new Date()): Promise<number> {
  const { count } = await prisma.chatSession.updateMany({
    where: { userId: null, status: 'ACTIVE', expiresAt: { lt: now } },
    data: { status: 'ENDED', endedAt: now },
  });
  if (count > 0) logger.info({ count }, 'Sesi chat tamu kedaluwarsa ditandai ENDED');
  return count;
}
