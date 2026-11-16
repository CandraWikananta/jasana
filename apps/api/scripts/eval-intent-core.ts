/**
 * Inti evaluasi akurasi intent extraction (H15, D153). Dipakai bersama oleh CLI
 * `eval-intent.ts` dan test, jadi pipeline dan penilaiannya bisa diuji dengan
 * fake tanpa memanggil Gemini.
 *
 * Definisi D153: skenario benar kalau jenis intent tepat, dan untuk `cari_jasa`
 * juga sub-kategorinya tepat. Slot dilaporkan terpisah sebagai metrik pendukung.
 * Kegagalan gateway dihitung salah dan dilaporkan terpisah (D161). Skenario yang
 * baru berhasil setelah retry 5xx juga dihitung terpisah (D165).
 *
 * Prompt identik dengan produksi: input dibentuk dengan aturan yang sama dengan
 * `sendMessage` (riwayat dipangkas ke CHAT_HISTORY_MESSAGES terakhir, last_intent
 * dari giliran sebelumnya), lalu dikirim lewat `LlmGateway.extractIntent` yang sama.
 * Personalisasi selalu null, supaya yang diukur murni ekstraksi.
 */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { CHAT_HISTORY_MESSAGES, CHAT_MESSAGE_MAX_LENGTH } from '../src/config/constants';
import { isAppError } from '../src/lib/errors';
import type { ChatTurn, ExtractIntentInput, LlmGateway, PromptSubcategory, TokenUsage } from '../src/lib/llm-gateway';
import { buildIntentSchema, INTENT_TYPES, TIME_TYPES, type Intent } from '../src/lib/llm-intent';
import { buildSystemInstruction, buildUserInput } from '../src/lib/llm-prompt';

// ---------------------------------------------------------------------------
// Skema dataset
// ---------------------------------------------------------------------------

export const ORIGINS = ['penyusun', 'teman', 'draf_ai'] as const;
const NO_ORIGIN = '(tanpa asal)';

const text = (max: number) => z.string().trim().min(1).max(max);

const slotLabelSchema = z
  .object({
    lokasi_teks: z.string().trim().min(1).max(200).nullable().optional(),
    waktu_jenis: z.enum(TIME_TYPES).optional(),
    budget_maks: z.number().int().nonnegative().nullable().optional(),
    atribut: z.array(z.object({ kunci: text(50), nilai: text(100) }).strict()).max(10).optional(),
  })
  .strict();

const scenarioSchema = z
  .object({
    id: z.string().regex(/^[A-Za-z0-9_-]{1,50}$/, 'id hanya huruf, angka, - dan _'),
    pesan: text(CHAT_MESSAGE_MAX_LENGTH),
    riwayat: z.array(z.object({ role: z.enum(['USER', 'ASSISTANT']), content: text(CHAT_MESSAGE_MAX_LENGTH) }).strict()).optional(),
    /** Bentuk sama dengan `chat_sessions.last_intent`. Divalidasi terhadap daftar sub-kategori aktif saat dijalankan. */
    intent_terakhir: z.record(z.unknown()).optional(),
    label: z
      .object({
        jenis: z.enum(INTENT_TYPES),
        sub_kategori: z.string().trim().min(1).nullable(),
        slot: slotLabelSchema.optional(),
      })
      .strict(),
    asal: z.enum(ORIGINS).optional(),
    catatan: z.string().max(500).optional(),
  })
  .strict()
  .superRefine((scenario, ctx) => {
    // Aturan label sama dengan skema intent: sub_kategori wajib dan hanya untuk cari_jasa.
    if ((scenario.label.jenis === 'cari_jasa') !== (scenario.label.sub_kategori !== null)) {
      ctx.addIssue({ code: 'custom', path: ['label', 'sub_kategori'], message: 'sub_kategori wajib untuk cari_jasa dan null selain itu' });
    }
    if (scenario.intent_terakhir && !scenario.riwayat?.length) {
      ctx.addIssue({ code: 'custom', path: ['intent_terakhir'], message: 'intent_terakhir hanya untuk skenario yang punya riwayat' });
    }
  });

export const datasetSchema = z
  .object({ versi: z.literal(1), catatan: z.string().optional(), skenario: z.array(scenarioSchema).min(1) })
  .strict()
  .superRefine((dataset, ctx) => {
    const seen = new Set<string>();
    dataset.skenario.forEach((scenario, i) => {
      if (seen.has(scenario.id)) ctx.addIssue({ code: 'custom', path: ['skenario', i, 'id'], message: `id ganda: ${scenario.id}` });
      seen.add(scenario.id);
    });
  });

export type Dataset = z.infer<typeof datasetSchema>;
export type Scenario = Dataset['skenario'][number];
export type SlotLabel = z.infer<typeof slotLabelSchema>;
export const SLOT_FIELDS = ['lokasi_teks', 'waktu_jenis', 'budget_maks', 'atribut'] as const;
export type SlotField = (typeof SLOT_FIELDS)[number];

/** Pesan galat Zod yang bisa dibaca penyusun: path lalu pesan. */
export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join('.') || '(akar)'}: ${issue.message}`);
}

// ---------------------------------------------------------------------------
// last_intent dan input prompt
// ---------------------------------------------------------------------------

/** Confidence untuk last_intent turunan. Angka tipikal smoke 9a (0,95 sampai 1, H110). */
export const DERIVED_CONFIDENCE = 0.95;

/**
 * last_intent untuk skenario lanjutan. Kalau `intent_terakhir` kosong dan
 * riwayat diakhiri pertanyaan ASSISTANT (berakhiran "?"), diturunkan sebagai
 * perlu_klarifikasi berisi pertanyaan itu dengan slot kosong. Slot kosong hanya
 * sama dengan produksi kalau pesan sebelumnya memang tidak menyebut lokasi,
 * waktu, budget, atau atribut; kalau menyebut, isi `intent_terakhir` sendiri.
 */
export function lastIntentFor(scenario: Scenario): { intent: Record<string, unknown> | null; derived: boolean } {
  if (scenario.intent_terakhir) return { intent: scenario.intent_terakhir, derived: false };
  const last = scenario.riwayat?.at(-1);
  if (!last || last.role !== 'ASSISTANT' || !last.content.trim().endsWith('?')) return { intent: null, derived: false };
  const intent: Intent = {
    jenis: 'perlu_klarifikasi',
    sub_kategori: null,
    slot: {
      lokasi: { teks: null, pakai_lokasi_saat_ini: false },
      waktu: { jenis: 'TIDAK_DISEBUT', teks: null },
      budget_maks: null,
      atribut: [],
    },
    confidence: DERIVED_CONFIDENCE,
    pertanyaan_klarifikasi: last.content.trim(),
  };
  return { intent, derived: true };
}

/**
 * Urutan kunci seperti JSONB PostgreSQL (kunci pendek dulu, lalu urut byte).
 * Produksi membaca last_intent dari kolom JSONB, jadi `JSON.stringify` di prompt
 * memakai urutan ini. Tanpa penyamaan, teks prompt evaluasi berbeda urutan kunci.
 */
export function jsonbOrder(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(jsonbOrder);
  if (value === null || typeof value !== 'object') return value;
  const keys = Object.keys(value).sort((a, b) => Buffer.byteLength(a) - Buffer.byteLength(b) || Buffer.compare(Buffer.from(a), Buffer.from(b)));
  return Object.fromEntries(keys.map((k) => [k, jsonbOrder((value as Record<string, unknown>)[k])]));
}

/** Input gateway dengan aturan yang sama dengan `sendMessage`. */
export function inputFor(scenario: Scenario, subcategories: PromptSubcategory[]): ExtractIntentInput {
  const history: ChatTurn[] = (scenario.riwayat ?? []).slice(-CHAT_HISTORY_MESSAGES);
  const lastIntent = lastIntentFor(scenario).intent;
  return {
    message: scenario.pesan,
    history,
    subcategories: subcategories.map(({ key, name, categoryName }) => ({ key, name, categoryName })),
    lastIntent: lastIntent === null ? null : jsonbOrder(lastIntent),
    personalization: null,
  };
}

/**
 * Pemeriksaan yang butuh daftar sub-kategori aktif: label sub_kategori dan
 * intent_terakhir harus sah terhadap skema intent produksi.
 */
export function catalogIssues(dataset: Dataset, keys: readonly string[]): string[] {
  const active = new Set(keys);
  const intentZod = buildIntentSchema(keys).zod;
  const issues: string[] = [];
  for (const s of dataset.skenario) {
    if (s.label.sub_kategori !== null && !active.has(s.label.sub_kategori)) {
      issues.push(`${s.id}: label.sub_kategori "${s.label.sub_kategori}" tidak ada di sub-kategori aktif`);
    }
    if (s.intent_terakhir) {
      const parsed = intentZod.safeParse(s.intent_terakhir);
      if (!parsed.success) issues.push(...formatIssues(parsed.error).map((m) => `${s.id}: intent_terakhir.${m}`));
    }
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Penilaian
// ---------------------------------------------------------------------------

const norm = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
const normNullable = (value: string | null | undefined) => (value == null ? null : norm(value));

export interface ScenarioScore {
  correct: boolean;
  /** Hanya field slot yang berlabel. */
  slot: Partial<Record<SlotField, boolean>>;
}

/** D153. Prediksi null berarti gateway gagal, dihitung salah. */
export function scoreScenario(label: Scenario['label'], predicted: Intent | null): ScenarioScore {
  if (!predicted) {
    const slot: ScenarioScore['slot'] = {};
    for (const field of SLOT_FIELDS) if (label.slot?.[field] !== undefined) slot[field] = false;
    return { correct: false, slot };
  }
  const correct = predicted.jenis === label.jenis && (label.jenis !== 'cari_jasa' || predicted.sub_kategori === label.sub_kategori);
  const slot: ScenarioScore['slot'] = {};
  const expected = label.slot ?? {};
  if (expected.lokasi_teks !== undefined) slot.lokasi_teks = normNullable(expected.lokasi_teks) === normNullable(predicted.slot.lokasi.teks);
  if (expected.waktu_jenis !== undefined) slot.waktu_jenis = expected.waktu_jenis === predicted.slot.waktu.jenis;
  if (expected.budget_maks !== undefined) slot.budget_maks = expected.budget_maks === predicted.slot.budget_maks;
  if (expected.atribut !== undefined) {
    const pairs = (list: { kunci: string; nilai: string }[]) => [...new Set(list.map((a) => `${norm(a.kunci)}=${norm(a.nilai)}`))].sort();
    slot.atribut = JSON.stringify(pairs(expected.atribut)) === JSON.stringify(pairs(predicted.slot.atribut));
  }
  return { correct, slot };
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

export interface ScenarioResult {
  id: string;
  asal: string;
  pesan: string;
  label: Scenario['label'];
  predicted: Intent | null;
  model: string | null;
  error: { reason: string | null; status: number | null; attempts: number | null } | null;
  attempts: number | null;
  latencyMs: number | null;
  usage: TokenUsage | null;
  lastIntentDerived: boolean;
  promptHash: string;
  score: ScenarioScore;
}

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export interface RunOptions {
  delayMs: number;
  limit?: number;
  onProgress?: (result: ScenarioResult, index: number, total: number) => void;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function runEval(
  scenarios: Scenario[],
  gateway: LlmGateway,
  subcategories: PromptSubcategory[],
  options: RunOptions,
): Promise<ScenarioResult[]> {
  const sleep = options.sleep ?? defaultSleep;
  const selected = options.limit === undefined ? scenarios : scenarios.slice(0, options.limit);
  const system = buildSystemInstruction(subcategories);
  const results: ScenarioResult[] = [];
  for (const [index, scenario] of selected.entries()) {
    if (index > 0 && options.delayMs > 0) await sleep(options.delayMs);
    const input = inputFor(scenario, subcategories);
    const base = {
      id: scenario.id,
      asal: scenario.asal ?? NO_ORIGIN,
      pesan: scenario.pesan,
      label: scenario.label,
      lastIntentDerived: lastIntentFor(scenario).derived,
      promptHash: sha256(`${system}\n\n${buildUserInput(input)}`),
    };
    let result: ScenarioResult;
    try {
      const out = await gateway.extractIntent(input);
      result = {
        ...base, predicted: out.intent, model: out.model, error: null,
        attempts: out.attempts, latencyMs: out.latencyMs, usage: out.usage, score: scoreScenario(scenario.label, out.intent),
      };
    } catch (error) {
      // Hanya alasan, status, dan jumlah percobaan; isi galat bisa memuat data lain.
      const context = isAppError(error) ? error.context ?? {} : {};
      result = {
        ...base, predicted: null, model: null, attempts: null, latencyMs: null, usage: null,
        error: {
          reason: typeof context.llm_reason === 'string' ? context.llm_reason : isAppError(error) ? error.code : 'unknown',
          status: typeof context.llm_status === 'number' ? context.llm_status : null,
          attempts: typeof context.llm_attempts === 'number' ? context.llm_attempts : null,
        },
        score: scoreScenario(scenario.label, null),
      };
    }
    results.push(result);
    options.onProgress?.(result, index, selected.length);
  }
  return results;
}

// ---------------------------------------------------------------------------
// Ringkasan
// ---------------------------------------------------------------------------

/** Interpolasi linear, sama dengan PERCENTILE_CONT di V3, supaya angkanya sebanding. */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (sorted.length - 1) * p;
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  return sorted[low]! + (sorted[high]! - sorted[low]!) * (rank - low);
}

const pct = (part: number, whole: number) => (whole === 0 ? null : Math.round((10_000 * part) / whole) / 100);
const roundMs = (value: number | null) => (value === null ? null : Math.round(value));
const mean = (values: number[]) => (values.length === 0 ? null : Math.round(values.reduce((a, b) => a + b, 0) / values.length));

interface Bucket { n: number; benar: number; persen: number | null }
const bucket = (rows: ScenarioResult[]): Bucket => {
  const benar = rows.filter((r) => r.score.correct).length;
  return { n: rows.length, benar, persen: pct(benar, rows.length) };
};

export const TARGET_ACCURACY = 80;
export const FAILED = '(gagal)';

export function summarize(results: ScenarioResult[]) {
  const ok = results.filter((r) => r.error === null);
  const total = bucket(results);
  const groupBy = (key: (r: ScenarioResult) => string, order: readonly string[]) => {
    const keys = [...new Set([...order.filter((k) => results.some((r) => key(r) === k)), ...results.map(key)])];
    return Object.fromEntries(keys.map((k) => [k, bucket(results.filter((r) => key(r) === k))]));
  };
  const confusion = Object.fromEntries(
    INTENT_TYPES.map((label) => [
      label,
      Object.fromEntries(
        [...INTENT_TYPES, FAILED].map((col) => [
          col,
          results.filter((r) => r.label.jenis === label && (r.predicted?.jenis ?? FAILED) === col).length,
        ]),
      ),
    ]),
  );
  const slot = Object.fromEntries(
    SLOT_FIELDS.map((field) => {
      const scored = results.filter((r) => r.score.slot[field] !== undefined);
      const benar = scored.filter((r) => r.score.slot[field]).length;
      return [field, { n: scored.length, benar, persen: pct(benar, scored.length) }];
    }),
  );
  const latencies = ok.map((r) => r.latencyMs!);
  const tokens = ok.map((r) => r.usage!);
  return {
    total: { ...total, target_persen: TARGET_ACCURACY, lulus_target: total.persen !== null && total.persen >= TARGET_ACCURACY },
    gagal: results.length - ok.length,
    berhasil_setelah_retry: ok.filter((r) => (r.attempts ?? 1) > 1).length,
    last_intent_turunan: results.filter((r) => r.lastIntentDerived).length,
    per_jenis: groupBy((r) => r.label.jenis, INTENT_TYPES),
    per_asal: groupBy((r) => r.asal, [...ORIGINS, NO_ORIGIN]),
    confusion,
    slot,
    latensi_ms: { n: latencies.length, rata: mean(latencies), p50: roundMs(percentile(latencies, 0.5)), p95: roundMs(percentile(latencies, 0.95)) },
    token: {
      rata_total_per_panggilan: mean(tokens.map((t) => t.totalTokens)),
      jumlah_input: tokens.reduce((a, t) => a + t.inputTokens, 0),
      jumlah_output: tokens.reduce((a, t) => a + t.outputTokens, 0),
      jumlah_total: tokens.reduce((a, t) => a + t.totalTokens, 0),
    },
  };
}

export type Summary = ReturnType<typeof summarize>;

// ---------------------------------------------------------------------------
// Meta dan keluaran
// ---------------------------------------------------------------------------

function git(args: string[]): string | null {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

export function buildMeta(input: {
  gateway: string;
  configuredModel: string;
  results: ScenarioResult[];
  datasetText: string;
  dataset: Dataset;
  subcategories: PromptSubcategory[];
  startedAt: Date;
}) {
  const schemaJson = JSON.stringify(buildIntentSchema(input.subcategories.map((s) => s.key)).jsonSchema);
  const status = git(['status', '--porcelain']);
  const origins = input.dataset.skenario.reduce<Record<string, number>>((acc, s) => {
    const key = s.asal ?? NO_ORIGIN;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  return {
    gateway: input.gateway,
    model_dikonfigurasi: input.configuredModel,
    model_menjawab: [...new Set(input.results.map((r) => r.model).filter((m): m is string => m !== null))],
    dimulai: input.startedAt.toISOString(),
    selesai: new Date().toISOString(),
    commit: git(['rev-parse', 'HEAD']),
    commit_dirty: status === null ? null : status.length > 0,
    sha256_system_instruction: sha256(buildSystemInstruction(input.subcategories)),
    sha256_skema_intent: sha256(schemaJson),
    // Gabungan hash prompt per skenario (system + input), urut id: berubah kalau satu prompt saja berubah.
    sha256_seluruh_prompt: sha256(input.results.map((r) => `${r.id}:${r.promptHash}`).join('\n')),
    sha256_dataset: sha256(input.datasetText),
    jumlah_sub_kategori_aktif: input.subcategories.length,
    jumlah_skenario_dataset: input.dataset.skenario.length,
    jumlah_skenario_dijalankan: input.results.length,
    skenario_per_asal: origins,
  };
}

export type Meta = ReturnType<typeof buildMeta>;

const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function toCsv(results: ScenarioResult[]): string {
  const header = [
    'id', 'asal', 'label_jenis', 'label_sub_kategori', 'prediksi_jenis', 'prediksi_sub_kategori', 'benar', 'gagal', 'alasan_gagal',
    'status_gagal', 'percobaan', 'latensi_ms', 'total_token', 'confidence', 'last_intent_turunan',
    ...SLOT_FIELDS.map((f) => `slot_${f}`), 'pesan',
  ];
  const rows = results.map((r) => [
    r.id, r.asal, r.label.jenis, r.label.sub_kategori, r.predicted?.jenis ?? FAILED, r.predicted?.sub_kategori, r.score.correct ? 1 : 0,
    r.error ? 1 : 0, r.error?.reason, r.error?.status, r.attempts ?? r.error?.attempts, r.latencyMs, r.usage?.totalTokens,
    r.predicted?.confidence, r.lastIntentDerived ? 1 : 0,
    ...SLOT_FIELDS.map((f) => (r.score.slot[f] === undefined ? '' : r.score.slot[f] ? 1 : 0)), r.pesan,
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n') + '\n';
}

const show = (value: number | null) => (value === null ? '-' : String(Math.round(value * 100) / 100));
const line = (cells: unknown[]) => `| ${cells.map((c) => String(c)).join(' | ')} |`;
const bucketRows = (rows: Record<string, { n: number; benar: number; persen: number | null }>) =>
  Object.entries(rows).map(([k, b]) => line([k, b.n, b.benar, show(b.persen)]));

export function toMarkdown(meta: Meta, summary: Summary): string {
  const cols = [...INTENT_TYPES, FAILED];
  return [
    '# Evaluasi akurasi intent extraction (H15, D153)',
    '',
    line(['Meta', 'Nilai']),
    line(['---', '---']),
    ...Object.entries(meta).map(([k, v]) => line([k, typeof v === 'object' && v !== null ? JSON.stringify(v) : v])),
    '',
    '## Akurasi keseluruhan',
    '',
    `Benar ${summary.total.benar} dari ${summary.total.n} skenario: **${show(summary.total.persen)} persen**, target ${summary.total.target_persen} persen (D85): ${summary.total.lulus_target ? 'tercapai' : 'belum tercapai'}.`,
    '',
    `- Gagal (dihitung salah, D161): ${summary.gagal}`,
    `- Berhasil setelah retry 5xx (D165): ${summary.berhasil_setelah_retry}`,
    `- Skenario lanjutan dengan last_intent turunan: ${summary.last_intent_turunan}`,
    '',
    '## Per jenis intent (label)',
    '',
    line(['Jenis', 'n', 'Benar', 'Persen']),
    line(['---', '---', '---', '---']),
    ...bucketRows(summary.per_jenis),
    '',
    '## Per asal skenario',
    '',
    line(['Asal', 'n', 'Benar', 'Persen']),
    line(['---', '---', '---', '---']),
    ...bucketRows(summary.per_asal),
    '',
    '## Confusion matrix jenis intent (baris label, kolom prediksi)',
    '',
    line(['label \\ prediksi', ...cols]),
    line(['---', ...cols.map(() => '---')]),
    ...INTENT_TYPES.map((label) => line([label, ...cols.map((c) => summary.confusion[label]![c])])),
    '',
    '## Slot (metrik pendukung, hanya field berlabel)',
    '',
    line(['Field', 'n', 'Benar', 'Persen']),
    line(['---', '---', '---', '---']),
    ...bucketRows(summary.slot),
    '',
    '## Latensi Gemini dan token (panggilan berhasil)',
    '',
    `- Latensi (ms, termasuk retry): n ${summary.latensi_ms.n}, rata-rata ${show(summary.latensi_ms.rata)}, p50 ${show(summary.latensi_ms.p50)}, p95 ${show(summary.latensi_ms.p95)}`,
    `- Token: rata-rata total per panggilan ${show(summary.token.rata_total_per_panggilan)}, jumlah input ${summary.token.jumlah_input}, output ${summary.token.jumlah_output}, total ${summary.token.jumlah_total}`,
    '',
  ].join('\n');
}

export function writeOutputs(dir: string, meta: Meta, summary: Summary, results: ScenarioResult[]): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'results.json'), JSON.stringify({ meta, ringkasan: summary, hasil: results }, null, 2) + '\n');
  writeFileSync(join(dir, 'results.csv'), toCsv(results));
  writeFileSync(join(dir, 'summary.md'), toMarkdown(meta, summary));
}
