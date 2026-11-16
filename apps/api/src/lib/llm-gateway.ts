/**
 * Port gerbang LLM (D151).
 *
 * Service chatbot hanya mengenal interface ini, tidak pernah API Gemini, supaya
 * model atau versi API bisa diganti tanpa menyentuh logika chatbot. Test,
 * newman, dan k6 selalu memakai `fakeGateway` yang deterministik, karena kuota
 * Gemini gratis dihitung per project per hari. Panggilan ke sini tidak boleh di
 * dalam transaksi basis data (jebakan 7).
 */

import { env } from '../config/env';
import { LLM_GATEWAY_TIMEOUT_MS, LLM_RETRY_DELAY_MS, LLM_RETRY_MIN_REMAINING_MS } from '../config/constants';
import { AppError, isAppError } from './errors';
import { buildIntentSchema, type Intent } from './llm-intent';
import { buildSystemInstruction, buildUserInput } from './llm-prompt';

/** Hanya tiga field ini yang boleh sampai ke prompt (H67). */
export interface PromptSubcategory {
  /** `subcategoryKey(kategori.slug, sub.slug)`. */
  key: string;
  name: string;
  categoryName: string;
}

export interface ChatTurn {
  role: 'USER' | 'ASSISTANT';
  content: string;
}

export interface ExtractIntentInput {
  message: string;
  /** Beberapa giliran terakhir, lama ke baru. Dipangkas pemanggil. */
  history: ChatTurn[];
  subcategories: PromptSubcategory[];
  /** `chat_sessions.last_intent`. */
  lastIntent: unknown | null;
  /**
   * Bagian personalization_snapshot yang boleh sampai ke prompt (usulan D168):
   * hanya kunci sub-kategori dari riwayat order. Alamat, rating, dan angka harga
   * tidak pernah dikirim. Null untuk tamu (H66).
   */
  personalization: { riwayat_sub_kategori: string[] } | null;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  thoughtTokens: number;
  totalTokens: number;
}

export interface ExtractIntentResult {
  intent: Intent;
  /** Model yang benar-benar menjawab, untuk `chat_messages.gemini_model`. */
  model: string;
  usage: TokenUsage;
  /** Waktu seluruh panggilan, termasuk jeda dan percobaan kedua (usulan D167). */
  latencyMs: number;
  /** 1, atau 2 kalau berhasil setelah retry 5xx (D165). */
  attempts: number;
  raw: unknown;
}

export interface LlmGateway {
  extractIntent(input: ExtractIntentInput): Promise<ExtractIntentResult>;
}

// ---------------------------------------------------------------------------
// Fake: kata kunci ke sub-kategori Lampiran B, tanpa jaringan dan deterministik
// ---------------------------------------------------------------------------

/** Urutan penting: aturan yang lebih spesifik lebih dulu. */
const FAKE_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bcuci\s*mobil\b/, 'otomotif/cuci-mobil-panggilan'],
  [/\b(servis|service)\s*motor\b/, 'otomotif/servis-motor-panggilan'],
  [/\boli\b/, 'otomotif/ganti-oli-panggilan'],
  [/\bprewed(ding)?\b/, 'fotografi/foto-prewedding'],
  [/\bfoto\s*produk\b/, 'fotografi/foto-produk'],
  [/\bdokumentasi\b/, 'fotografi/dokumentasi-acara'],
  [/\bpengantin\b/, 'kecantikan/makeup-pengantin'],
  [/\b(makeup|make up|mua)\b/, 'kecantikan/makeup-artist-acara'],
  [/\b(potong|cukur)\s*rambut\b|\bbarber\b/, 'kecantikan/potong-rambut-panggilan'],
  [/\bmesin\s*cuci\b/, 'perbaikan/servis-mesin-cuci'],
  [/\bac\b/, 'perbaikan/servis-ac'],
  [/\blistrik\b/, 'perbaikan/tukang-listrik'],
];
const FAKE_AMBIGUOUS_PHOTO = /\b(foto|fotografer|photo)\b/;
const FAKE_GREETING = /^(halo|hai|hi|hello|pagi|siang|sore|malam|selamat (pagi|siang|sore|malam)|permisi|om swastiastu)\b/;
const FAKE_SERVICE_WORD = /\b(jasa|tukang|servis|service|panggil|cari|butuh|perlu|les)\b/;
const FAKE_HISTORY_REFERENCE = /\b(kayak|seperti|kaya) (kemarin|kemaren|biasa|dulu|sebelumnya)\b|\blangganan\b/;
/** Penanda uji D165: percobaan pertama gagal 503, percobaan kedua berhasil. */
export const FAKE_RETRY_MARKER = '#uji-503';

function fakeSlot(text: string): Intent['slot'] {
  const now = text.match(/\b(sekarang|skrg|segera)\b/);
  const scheduled = text.match(/\b(besok|bsk|lusa|minggu depan|jam \d{1,2})\b/);
  const budget = text.match(/(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta)\b/);
  const here = text.match(/\b(di sini|dekat sini|lokasiku|lokasi saya)\b/);
  const place = text.match(/\bdi ([a-z]{3,})\b/);
  return {
    lokasi: { teks: place && place[1] !== 'sini' ? place[1]! : null, pakai_lokasi_saat_ini: here !== null },
    waktu: now
      ? { jenis: 'SEKARANG', teks: now[1]! }
      : scheduled
        ? { jenis: 'TERJADWAL', teks: scheduled[1]! }
        : { jenis: 'TIDAK_DISEBUT', teks: null },
    budget_maks: budget
      ? Math.round(Number(budget[1]!.replace(',', '.')) * (/^(jt|juta)$/.test(budget[2]!) ? 1_000_000 : 1_000))
      : null,
    atribut: [],
  };
}

// shortcut: fake tidak menggabungkan slot dari lastIntent, cukup untuk alur dua giliran lewat klarifikasi. Tambahkan kalau Postman 9b butuh slot yang dibawa antar giliran.
function fakeIntent(message: string, keys: ReadonlySet<string>, history: readonly string[]): Intent {
  const text = message.toLowerCase().trim();
  const slot = fakeSlot(text);
  const base = { slot, pertanyaan_klarifikasi: null, sub_kategori: null };
  const matched = FAKE_RULES.filter(([pattern]) => pattern.test(text));
  const hit = matched.find(([, key]) => keys.has(key));
  if (hit) return { ...base, jenis: 'cari_jasa', sub_kategori: hit[1], confidence: 0.9 };
  // Usulan D168: riwayat hanya dipakai kalau pesan merujuknya secara eksplisit.
  const remembered = history.find((key) => keys.has(key));
  if (remembered && FAKE_HISTORY_REFERENCE.test(text)) return { ...base, jenis: 'cari_jasa', sub_kategori: remembered, confidence: 0.85 };
  if (matched.length > 0) return { ...base, jenis: 'jasa_tidak_tersedia', confidence: 0.8 };
  if (FAKE_AMBIGUOUS_PHOTO.test(text)) {
    return { ...base, jenis: 'perlu_klarifikasi', confidence: 0.6, pertanyaan_klarifikasi: 'Foto untuk apa: produk, prewedding, atau dokumentasi acara?' };
  }
  if (FAKE_GREETING.test(text)) return { ...base, jenis: 'sapaan', confidence: 0.9 };
  if (FAKE_SERVICE_WORD.test(text)) return { ...base, jenis: 'jasa_tidak_tersedia', confidence: 0.7 };
  return { ...base, jenis: 'di_luar_cakupan', confidence: 0.8 };
}

export const fakeGateway: LlmGateway = {
  extractIntent: (input) =>
    withRetry(async (_signal, attempt) => {
      if (attempt === 1 && input.message.includes(FAKE_RETRY_MARKER)) {
        throw llmError('Gemini menolak permintaan', {
          llm_reason: 'http',
          llm_status: 503,
          llm_error_code: 'UNAVAILABLE',
          llm_quota_exceeded: false,
        });
      }
      const keys = input.subcategories.map((s) => s.key);
      const history = input.personalization?.riwayat_sub_kategori ?? [];
      // Divalidasi skema yang sama dengan Gemini, supaya fake tidak bisa menghasilkan bentuk yang Gemini tolak.
      const intent = buildIntentSchema(keys).zod.parse(fakeIntent(input.message, new Set(keys), history));
      return {
        intent,
        model: 'fake',
        usage: { inputTokens: 0, outputTokens: 0, thoughtTokens: 0, totalTokens: 0 },
        raw: { gateway: 'fake', message: input.message },
      };
    }),
};

// ---------------------------------------------------------------------------
// Gemini: Interactions API lewat fetch langsung, tanpa SDK
// ---------------------------------------------------------------------------

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1';
/** Intent JSON-nya kecil. Batas ini menahan balasan yang melantur. */
const MAX_OUTPUT_TOKENS = 1024;

type Payload = Record<string, unknown>;

/**
 * Galat asli dan isi balasan tidak pernah diteruskan: pesan fetch bisa memuat
 * header, dan balasan bisa memuat pesan pengguna. Yang dicatat hanya alasan,
 * status, dan kode galat.
 */
const llmError = (message: string, context: Record<string, unknown>) =>
  new AppError('GEMINI_UNAVAILABLE', message, { context: { llm_operation: 'extract_intent', ...context } });

/** `error.status` gaya Google (RESOURCE_EXHAUSTED) atau `error.code` string Interactions API. */
function errorCode(payload: Payload | null): string | null {
  const error = (payload?.error ?? null) as Payload | null;
  const code = error?.status ?? error?.code;
  return typeof code === 'string' && code.length <= 100 ? code : null;
}

/** Teks dari langkah `model_output`. Langkah thought dan lainnya diabaikan. */
function outputText(payload: Payload): string {
  const steps = Array.isArray(payload.steps) ? (payload.steps as Payload[]) : [];
  return steps
    .filter((step) => step?.type === 'model_output' && Array.isArray(step.content))
    .flatMap((step) => step.content as Payload[])
    .filter((part) => part?.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text as string)
    .join('');
}

const tokens = (usage: Payload, field: string) => (typeof usage[field] === 'number' ? (usage[field] as number) : 0);

export const geminiGateway: LlmGateway = {
  async extractIntent(input) {
    const schema = buildIntentSchema(input.subcategories.map((s) => s.key));
    const body = JSON.stringify({
      model: env.GEMINI_MODEL,
      system_instruction: buildSystemInstruction(input.subcategories),
      input: buildUserInput(input),
      response_format: { type: 'text', mime_type: 'application/json', schema: schema.jsonSchema },
      // temperature diabaikan model 3.6 ke atas, jadi tidak dikirim.
      generation_config: { thinking_level: 'minimal', max_output_tokens: MAX_OUTPUT_TOKENS },
      // Usulan D158: pesan pengguna tidak disimpan di Google. Riwayat dikirim ulang setiap giliran.
      store: false,
    });
    return withRetry(async (signal) => {
      let response: Response;
      try {
        response = await fetch(`${GEMINI_BASE_URL}/interactions`, {
          method: 'POST',
          headers: { 'x-goog-api-key': env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
          body,
          signal,
        });
      } catch (error) {
        const timedOut = error instanceof Error && error.name === 'TimeoutError';
        throw llmError(timedOut ? 'Gemini tidak merespons' : 'Gemini tidak bisa dihubungi', {
          llm_reason: timedOut ? 'timeout' : 'network',
          llm_timeout: timedOut,
        });
      }
      // Body dibaca di bawah signal yang sama, jadi timeout saat membaca berakhir null.
      const payload = (await response.json().catch(() => null)) as Payload | null;

      if (!response.ok) {
        throw llmError(response.status === 429 ? 'Kuota Gemini habis' : 'Gemini menolak permintaan', {
          llm_reason: 'http',
          llm_status: response.status,
          llm_error_code: errorCode(payload),
          llm_quota_exceeded: response.status === 429,
        });
      }
      if (!payload) throw llmError('Balasan Gemini tidak dikenali', { llm_reason: 'invalid_output' });
      // Status tidak ada dianggap selesai, biar teksnya yang diuji.
      if (payload.status !== undefined && payload.status !== 'completed') {
        throw llmError('Balasan Gemini tidak selesai', {
          llm_reason: 'incomplete',
          llm_interaction_status: typeof payload.status === 'string' ? payload.status : null,
        });
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(outputText(payload));
      } catch {
        throw llmError('Balasan Gemini bukan JSON', { llm_reason: 'invalid_output' });
      }
      const result = schema.zod.safeParse(parsed);
      if (!result.success) {
        // Hanya path, tanpa nilai: nilainya bisa memuat isi pesan pengguna.
        throw llmError('Balasan Gemini tidak sesuai skema intent', {
          llm_reason: 'invalid_output',
          llm_issue_paths: result.error.issues.map((issue) => issue.path.join('.') || '(root)'),
        });
      }

      const usage = (payload.usage ?? {}) as Payload;
      return {
        intent: result.data,
        model: typeof payload.model === 'string' ? payload.model.replace(/^models\//, '') : env.GEMINI_MODEL,
        usage: {
          inputTokens: tokens(usage, 'total_input_tokens'),
          outputTokens: tokens(usage, 'total_output_tokens'),
          thoughtTokens: tokens(usage, 'total_thought_tokens'),
          totalTokens: tokens(usage, 'total_tokens'),
        },
        raw: payload,
      };
    });
  },
};

// ---------------------------------------------------------------------------
// Retry 5xx (D165, usulan D167), dipakai Gemini dan fake
// ---------------------------------------------------------------------------

const RETRYABLE_STATUS = new Set([500, 502, 503, 504]);

/** Hanya 5xx. 429, 4xx lain, timeout, jaringan, dan output tidak sah hampir pasti berulang, jadi tidak diulang. */
const retryable = (error: unknown) =>
  isAppError(error) && error.context?.llm_reason === 'http' && RETRYABLE_STATUS.has(error.context.llm_status as number);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Dua percobaan berbagi satu tenggat LLM_GATEWAY_TIMEOUT_MS (D156). Percobaan
 * kedua memakai sisa waktu, dan dilewati kalau sisanya kurang dari ambang.
 * `llm_attempts` selalu ikut di context galat.
 */
export async function withRetry(
  run: (signal: AbortSignal, attempt: number) => Promise<Omit<ExtractIntentResult, 'latencyMs' | 'attempts'>>,
): Promise<ExtractIntentResult> {
  const started = performance.now();
  let timeoutMs = LLM_GATEWAY_TIMEOUT_MS;
  for (let attempt = 1; ; attempt += 1) {
    try {
      const result = await run(AbortSignal.timeout(timeoutMs), attempt);
      return { ...result, latencyMs: Math.round(performance.now() - started), attempts: attempt };
    } catch (error) {
      if (!isAppError(error)) throw error;
      // Dibulatkan ke bawah: AbortSignal.timeout menolak milidetik pecahan.
      const remaining = Math.floor(LLM_GATEWAY_TIMEOUT_MS - (performance.now() - started) - LLM_RETRY_DELAY_MS);
      if (attempt >= 2 || !retryable(error) || remaining < LLM_RETRY_MIN_REMAINING_MS) {
        throw new AppError(error.code, error.message, { context: { ...error.context, llm_attempts: attempt } });
      }
      await sleep(LLM_RETRY_DELAY_MS);
      timeoutMs = remaining;
    }
  }
}

export const llmGateway: LlmGateway = env.LLM_GATEWAY === 'gemini' ? geminiGateway : fakeGateway;
