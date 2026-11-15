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
 */

import { prisma, type ChatSession } from '@jasana/database';
import { AppError, Errors } from '../../lib/errors';
import { generateToken, hashToken } from '../../lib/crypto';
import { logger } from '../../lib/logger';
import { pageMeta, skipTake, type Page, type Paginated } from '../../lib/pagination';
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

/** POST /chat/sessions. `personalization_snapshot` disusun di 9c (D27). */
export async function createUserSession(userId: string): Promise<ChatSessionDto> {
  return toSessionDto(await prisma.chatSession.create({ data: { userId } }));
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
  const where = 'userId' in identity ? { id, userId: identity.userId } : { id, guestToken: hashToken(identity.guestToken) };
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
