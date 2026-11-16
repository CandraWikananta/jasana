/**
 * POST /chat/sessions/:id/messages (PRD 4.4, D152, D154).
 *
 * Urutan pemeriksaan tamu (usulan D163):
 *   1. per alamat IP     middleware di memori, sebelum basis data   429 RATE_LIMIT_EXCEEDED
 *   2. rem global        COUNT pesan USER sesi tamu hari ini WITA   503 CHATBOT_TEMPORARILY_UNAVAILABLE
 *   3. per sesi          satu UPDATE bersyarat atas message_count   429 GUEST_CHAT_LIMIT_REACHED
 * Rem global sebelum per sesi supaya 503 tidak memakan kuota sesi. Per sesi
 * paling akhir karena satu-satunya yang mengubah data, dan langsung disusul
 * insert pesan USER di transaksi yang sama.
 *
 * LlmGateway dipanggil di LUAR transaksi (jebakan 7): pesan USER di-commit
 * dulu, balasan ASSISTANT ditulis di transaksi kedua. Gemini hanya menerima
 * sub-kategori dan percakapan. Data listing diambil server dari pencarian
 * Fase 5 dan tidak pernah masuk prompt (D152, H67).
 */

import { Prisma, prisma } from '@jasana/database';
import { CHAT_HISTORY_MESSAGES, CHAT_RECOMMENDATION_LIMIT } from '../../config/constants';
import { AppError, isAppError } from '../../lib/errors';
import { llmGateway, type ChatTurn, type ExtractIntentResult } from '../../lib/llm-gateway';
import type { Intent } from '../../lib/llm-intent';
import { activeSubcategories, type ActiveSubcategory } from '../catalog/catalog.service';
import { searchListings } from '../listings/listing-search.service';
import type { ListingCardDto } from '../listings/listings.mapper';
import { getNumberSetting } from '../settings/settings.service';
import { logger } from '../../lib/logger';
import { findOwnSession, toMessageDto, type ChatIdentity, type ChatMessageDto, type PersonalizationSnapshot } from './chat.service';
import type { SendMessageBody } from './chat.schema';

const DAY_MS = 24 * 60 * 60 * 1000;
/** WITA adalah UTC+8 tetap, tanpa daylight saving. */
const WITA_OFFSET_MS = 8 * 60 * 60 * 1000;

/** Awal hari kalender WITA (00.00 WITA) yang memuat `now`, sebagai instan UTC (D154). */
export function witaDayStart(now: Date): Date {
  return new Date(Math.floor((now.getTime() + WITA_OFFSET_MS) / DAY_MS) * DAY_MS - WITA_OFFSET_MS);
}

export const REPLY = {
  greeting:
    'Halo! Aku asisten Jasana. Ceritakan jasa yang kamu butuhkan, misalnya "servis AC besok pagi di Denpasar", nanti aku carikan pilihannya.',
  outOfScope:
    'Aku hanya bisa membantu mencari jasa di Jasana. Untuk pertanyaan seputar cara kerja platform, silakan buka halaman Bantuan.',
  unavailable: (categories: readonly string[]) =>
    categories.length > 0
      ? `Maaf, jasa itu belum tersedia di Jasana. Saat ini yang tersedia: ${categories.join(', ')}.`
      : 'Maaf, jasa itu belum tersedia di Jasana.',
  needLocation: (subName: string, guest: boolean) =>
    guest
      ? `Untuk mencarikan ${subName} terdekat, izinkan akses lokasi di browser lalu kirim pesanmu lagi.`
      : `Untuk mencarikan ${subName} terdekat, izinkan akses lokasi di browser atau atur alamat default di profilmu, lalu kirim pesanmu lagi.`,
  found: (count: number, subName: string) => `Ini ${count} pilihan ${subName} yang bisa melayani lokasimu.`,
  /** D166: saran mengikuti slot yang diekstrak, bukan selalu "ubah waktu atau budget". */
  none: (subName: string, slot: Intent['slot'], categories: string[]) => {
    const now = slot.waktu.jenis === 'SEKARANG';
    const hasBudget = slot.budget_maks !== null;
    const hasTime = slot.waktu.jenis !== 'TIDAK_DISEBUT';
    const tips = [hasBudget ? 'naikkan budget-nya' : null, hasTime ? 'ganti waktunya' : null].filter((tip) => tip !== null);
    const advice =
      tips.length > 0
        ? `Coba ${tips.join(' atau ')}.`
        : `Coba cari di lokasi lain${categories.length > 0 ? `, atau jasa lain yang tersedia: ${categories.join(', ')}` : ''}.`;
    return `Belum ada ${subName} yang bisa melayani lokasimu${now ? ' saat ini' : ''}. ${advice}`;
  },
  failed: 'Maaf, asisten sedang tidak bisa menjawab. Coba kirim lagi sebentar lagi.',
} as const;

export interface SendMessageResult {
  user_message: ChatMessageDto;
  assistant_message: ChatMessageDto;
  intent: Intent['jenis'];
  recommendations: ListingCardDto[];
  /** Hanya untuk tamu. */
  guest_quota: { limit: number; used: number; remaining: number } | null;
}

/** H19, D154: dari basis data, jadi tetap benar setelah restart. Sesi tamu = user_id NULL, sama dengan V3. */
async function assertGlobalBrake(): Promise<void> {
  const [limit, used] = await Promise.all([
    getNumberSetting('guest_chat_daily_global_limit'),
    // shortcut: COUNT tanpa lock, jadi pesan paralel di detik yang sama bisa melewati batas beberapa buah. Cukup untuk rem darurat; kunci advisory kalau harus tepat.
    // shortcut: tidak ada index chat_messages(created_at), COUNT memindai pesan. Tambahkan @@index([role, createdAt]) kalau chat_messages mencapai puluhan ribu baris.
    prisma.chatMessage.count({
      where: { role: 'USER', createdAt: { gte: witaDayStart(new Date()) }, session: { userId: null } },
    }),
  ]);
  if (used >= limit) {
    throw new AppError('CHATBOT_TEMPORARILY_UNAVAILABLE', 'Chatbot sedang istirahat untuk tamu hari ini. Masuk atau daftar untuk melanjutkan', {
      context: { guest_chat_daily_used: used, guest_chat_daily_limit: limit },
    });
  }
}

/**
 * Transaksi 1. UPDATE bersyarat atomik, bukan baca lalu cek: dua pesan di batas
 * terakhir, tepat satu lolos. Satu `update` dengan filter non-unik sekaligus
 * mengembalikan message_count, jadi tanpa SELECT susulan (H111); P2025 berarti
 * syaratnya tidak terpenuhi.
 */
async function recordUserMessage(sessionId: string, content: string, guestLimit: number | null) {
  return prisma.$transaction(async (tx) => {
    let messageCount: number;
    try {
      ({ messageCount } = await tx.chatSession.update({
        where: { id: sessionId, ...(guestLimit === null ? {} : { messageCount: { lt: guestLimit } }) },
        data: { messageCount: { increment: 1 } },
        select: { messageCount: true },
      }));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError('GUEST_CHAT_LIMIT_REACHED', 'Batas pesan sesi tamu sudah habis. Masuk atau daftar untuk melanjutkan');
      }
      throw error;
    }
    const message = await tx.chatMessage.create({ data: { sessionId, role: 'USER', content } });
    return { message, messageCount };
  });
}

/** Riwayat sebelum pesan ini, lama ke baru. Balasan gagal (D161, intent NULL) tidak dikirim ke prompt. */
async function loadHistory(sessionId: string, beforeId: bigint): Promise<ChatTurn[]> {
  const rows = await prisma.chatMessage.findMany({
    where: {
      sessionId,
      id: { lt: beforeId },
      OR: [{ role: 'USER' }, { role: 'ASSISTANT', extractedIntent: { not: Prisma.DbNull } }],
    },
    orderBy: { id: 'desc' },
    take: CHAT_HISTORY_MESSAGES,
    select: { role: true, content: true },
  });
  return rows.reverse().map((row) => ({ role: row.role as ChatTurn['role'], content: row.content }));
}

async function defaultAddress(userId: string): Promise<{ lat: number; lng: number } | null> {
  const address = await prisma.userAddress.findFirst({
    where: { userId, isDefault: true },
    select: { latitude: true, longitude: true },
  });
  return address ? { lat: address.latitude.toNumber(), lng: address.longitude.toNumber() } : null;
}

interface Reply {
  content: string;
  recommendations: ListingCardDto[];
}

type PriceRange = PersonalizationSnapshot['rentang_harga'];

/** Jarak harga dasar listing ke rentang harga dasar order sebelumnya, 0 kalau di dalam rentang. */
const priceGap = (price: number, range: NonNullable<PriceRange>) => Math.max(range.min - price, price - range.maks, 0);

/**
 * Usulan D168: urutan ulang, BUKAN filter. Array.sort stabil, jadi jarak sama
 * tetap mengikuti urutan pencarian (jarak lokasi).
 */
export function rerankByPriceRange<T extends { price: number }>(cards: T[], range: PriceRange): T[] {
  if (!range) return cards;
  return [...cards].sort((a, b) => priceGap(a.price, range) - priceGap(b.price, range));
}

/** Kategori unik dari daftar aktif, untuk templat yang menyebut jasa lain yang tersedia. */
const categoryNames = (subcategories: ActiveSubcategory[]) => [...new Set(subcategories.map((s) => s.categoryName))];

async function replyFor(
  intent: Intent,
  sub: ActiveSubcategory | null,
  location: { lat: number; lng: number } | null,
  subcategories: ActiveSubcategory[],
  guest: boolean,
  priceRange: PriceRange,
): Promise<Reply> {
  const text = (content: string): Reply => ({ content, recommendations: [] });
  switch (intent.jenis) {
    case 'sapaan':
      return text(REPLY.greeting);
    case 'di_luar_cakupan':
      return text(REPLY.outOfScope);
    case 'jasa_tidak_tersedia':
      return text(REPLY.unavailable(categoryNames(subcategories)));
    case 'perlu_klarifikasi':
      return text(intent.pertanyaan_klarifikasi!);
    case 'cari_jasa': {
      // shortcut: slot.lokasi.teks tidak di-geocode, lokasi hanya dari body atau alamat default. Tambahkan geocoding kalau UAT menunjukkan pengguna sering menyebut tempat.
      if (!location) return text(REPLY.needLocation(sub!.name, guest));
      const now = intent.slot.waktu.jenis === 'SEKARANG';
      // shortcut: slot.atribut hanya dicatat di extracted_intent, belum jadi filter attr. Petakan ke attr subcategory_attributes kalau evaluasi slot (D153) cukup tepat.
      const { items } = await searchListings({
        page: 1,
        limit: CHAT_RECOMMENDATION_LIMIT,
        subcategory_id: sub!.id,
        lat: location.lat,
        lng: location.lng,
        available_now: now || undefined,
        price_max: intent.slot.budget_maks ?? undefined,
      });
      return items.length > 0
        ? { content: REPLY.found(items.length, sub!.name), recommendations: rerankByPriceRange(items, priceRange) }
        : text(REPLY.none(sub!.name, intent.slot, categoryNames(subcategories)));
    }
  }
}

/** Kunci `cari_jasa` yang tidak ada di cache aktif diperlakukan sebagai output Gemini yang tidak sah. */
function resolveSubcategory(intent: Intent, subcategories: ActiveSubcategory[]): ActiveSubcategory | null {
  if (intent.jenis !== 'cari_jasa') return null;
  const sub = subcategories.find((s) => s.key === intent.sub_kategori);
  if (!sub) {
    throw new AppError('GEMINI_UNAVAILABLE', 'Balasan Gemini tidak sesuai skema intent', {
      context: { llm_operation: 'extract_intent', llm_reason: 'unknown_subcategory' },
    });
  }
  return sub;
}

export async function sendMessage(sessionId: string, identity: ChatIdentity, body: SendMessageBody): Promise<SendMessageResult> {
  const session = await findOwnSession(sessionId, identity, true);
  const guest = session.userId === null;

  let guestLimit: number | null = null;
  if (guest) {
    // Membaca setting bukan pemeriksaan, jadi boleh bersamaan dengan rem global tanpa mengubah urutan D163 (H111).
    [, guestLimit] = await Promise.all([assertGlobalBrake(), getNumberSetting('guest_chat_message_limit')]);
  }
  const { message: userMessage, messageCount } = await recordUserMessage(sessionId, body.content, guestLimit);

  const bodyLocation = body.latitude !== undefined && body.longitude !== undefined ? { lat: body.latitude, lng: body.longitude } : null;
  const [history, subcategories, savedLocation] = await Promise.all([
    loadHistory(sessionId, userMessage.id),
    activeSubcategories(),
    // H66: tamu tidak punya alamat tersimpan, lokasinya hanya dari geolokasi browser.
    !bodyLocation && session.userId ? defaultAddress(session.userId) : null,
  ]);

  // H66: tamu tidak punya snapshot. Kunci riwayat yang sudah nonaktif tidak dikirim, karena skema intent pasti menolaknya.
  const snapshot = session.personalizationSnapshot as PersonalizationSnapshot | null;
  const activeKeys = new Set(subcategories.map((s) => s.key));
  const personalization = snapshot
    ? { riwayat_sub_kategori: snapshot.riwayat_sub_kategori.map((h) => h.kunci).filter((key) => activeKeys.has(key)) }
    : null;

  const started = performance.now();
  let result: ExtractIntentResult;
  let sub: ActiveSubcategory | null;
  try {
    result = await llmGateway.extractIntent({
      message: body.content,
      history,
      subcategories: subcategories.map(({ key, name, categoryName }) => ({ key, name, categoryName })),
      lastIntent: session.lastIntent,
      personalization,
    });
    logger.info({ llm_attempts: result.attempts, llm_latency_ms: result.latencyMs, intent: result.intent.jenis }, 'Intent diekstrak');
    sub = resolveSubcategory(result.intent, subcategories);
  } catch (error) {
    if (isAppError(error) && error.code === 'GEMINI_UNAVAILABLE') {
      // Usulan D161: kegagalan ikut tercatat, jadi `gagal_ekstraksi` di V3 bermakna.
      await prisma.chatMessage.create({
        data: { sessionId, role: 'ASSISTANT', content: REPLY.failed, latencyMs: Math.round(performance.now() - started) },
      });
      throw new AppError('GEMINI_UNAVAILABLE', REPLY.failed, { ...(error.context ? { context: error.context } : {}), cause: error });
    }
    throw error;
  }

  const reply = await replyFor(result.intent, sub, bodyLocation ?? savedLocation, subcategories, guest, snapshot?.rentang_harga ?? null);

  const assistant = await prisma.$transaction(async (tx) => {
    const row = await tx.chatMessage.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: reply.content,
        extractedIntent: result.intent as Prisma.InputJsonValue,
        intentConfidence: result.intent.confidence,
        recommendedListingIds: reply.recommendations.map((card) => card.id),
        geminiModel: result.model.slice(0, 50),
        tokenUsage: result.usage as unknown as Prisma.InputJsonValue,
        latencyMs: result.latencyMs,
      },
    });
    await tx.chatSession.update({ where: { id: sessionId }, data: { lastIntent: result.intent as Prisma.InputJsonValue } });
    return row;
  });

  return {
    user_message: toMessageDto(userMessage),
    assistant_message: toMessageDto(assistant),
    intent: result.intent.jenis,
    recommendations: reply.recommendations,
    guest_quota: guestLimit === null ? null : { limit: guestLimit, used: messageCount, remaining: Math.max(0, guestLimit - messageCount) },
  };
}
