/**
 * Evaluasi akurasi intent (H15, D153): skema dataset, last_intent skenario
 * lanjutan, penilaian, ringkasan, dan pipeline dengan fake. Tanpa Gemini.
 */

import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { prisma } from '@jasana/database';
import { hashToken } from '../src/lib/crypto';
import { hasTestDatabase } from './helpers/integration';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { CHAT_HISTORY_MESSAGES } from '../src/config/constants';
import { AppError } from '../src/lib/errors';
import { FAKE_RETRY_MARKER, fakeGateway, type LlmGateway } from '../src/lib/llm-gateway';
import type { Intent } from '../src/lib/llm-intent';
import { buildUserInput } from '../src/lib/llm-prompt';
import {
  DERIVED_CONFIDENCE, buildMeta, catalogIssues, datasetSchema, inputFor, lastIntentFor, percentile, runEval, scoreScenario, summarize,
  toCsv, writeOutputs, type Scenario, type ScenarioResult,
} from '../scripts/eval-intent-core';

const SUBCATEGORIES = [
  { key: 'perbaikan/servis-ac', name: 'Servis AC', categoryName: 'Perbaikan' },
  { key: 'fotografi/foto-produk', name: 'Foto Produk', categoryName: 'Fotografi' },
  { key: 'fotografi/foto-prewedding', name: 'Foto Prewedding', categoryName: 'Fotografi' },
  { key: 'fotografi/dokumentasi-acara', name: 'Dokumentasi Acara', categoryName: 'Fotografi' },
];
const KEYS = SUBCATEGORIES.map((s) => s.key);

const scenario = (overrides: Partial<Scenario> = {}): Scenario => ({
  id: 's1',
  pesan: 'servis ac',
  label: { jenis: 'cari_jasa', sub_kategori: 'perbaikan/servis-ac' },
  ...overrides,
});

const intent = (overrides: Partial<Intent> = {}, slot: Partial<Intent['slot']> = {}): Intent => ({
  jenis: 'cari_jasa',
  sub_kategori: 'perbaikan/servis-ac',
  slot: {
    lokasi: { teks: null, pakai_lokasi_saat_ini: false },
    waktu: { jenis: 'TIDAK_DISEBUT', teks: null },
    budget_maks: null,
    atribut: [],
    ...slot,
  },
  confidence: 0.9,
  pertanyaan_klarifikasi: null,
  ...overrides,
});

const parse = (skenario: unknown[]) => datasetSchema.safeParse({ versi: 1, skenario });

describe('dataset (H15)', () => {
  it('template di repo sah, lima contoh mencakup kelima jenis intent, dan semuanya punya asal', () => {
    const file = readFileSync(resolve(__dirname, '../eval/intent-dataset.json'), 'utf8');
    const dataset = datasetSchema.parse(JSON.parse(file));
    expect(dataset.skenario).toHaveLength(5);
    expect(new Set(dataset.skenario.map((s) => s.label.jenis))).toEqual(
      new Set(['cari_jasa', 'perlu_klarifikasi', 'jasa_tidak_tersedia', 'sapaan', 'di_luar_cakupan']),
    );
    expect(dataset.skenario.every((s) => s.asal !== undefined)).toBe(true);
    expect(dataset.skenario.some((s) => s.riwayat?.length)).toBe(true);
    expect(dataset.catatan).toContain('akan diganti dataset penyusun');
    expect(catalogIssues(dataset, KEYS)).toEqual([]);
  });

  it.each([
    ['id ganda', [scenario(), scenario()], 'id ganda'],
    ['cari_jasa tanpa sub_kategori', [scenario({ label: { jenis: 'cari_jasa', sub_kategori: null } })], 'sub_kategori wajib'],
    ['sapaan dengan sub_kategori', [scenario({ label: { jenis: 'sapaan', sub_kategori: 'perbaikan/servis-ac' } })], 'sub_kategori wajib'],
    ['intent_terakhir tanpa riwayat', [scenario({ intent_terakhir: intent() as unknown as Record<string, unknown> })], 'hanya untuk skenario yang punya riwayat'],
    ['asal tidak dikenal', [{ ...scenario(), asal: 'chatgpt' }], 'asal'],
    ['field tidak dikenal', [{ ...scenario(), harapan: 'x' }], 'Unrecognized'],
    ['peran riwayat selain USER/ASSISTANT', [scenario({ riwayat: [{ role: 'SYSTEM' as 'USER', content: 'x' }] })], 'riwayat'],
    ['pesan kosong', [scenario({ pesan: '  ' })], 'pesan'],
  ])('%s ditolak', (_label, skenario, message) => {
    const result = parse(skenario);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error!.issues)).toContain(message);
  });

  it('label dan intent_terakhir diperiksa terhadap sub-kategori aktif', () => {
    const dataset = datasetSchema.parse({
      versi: 1,
      skenario: [
        scenario({ id: 'a', label: { jenis: 'cari_jasa', sub_kategori: 'kebersihan/sedot-wc' } }),
        scenario({
          id: 'b',
          riwayat: [{ role: 'USER', content: 'x' }],
          intent_terakhir: { ...intent(), sub_kategori: 'tidak/ada' } as unknown as Record<string, unknown>,
        }),
      ],
    });
    const issues = catalogIssues(dataset, KEYS);
    expect(issues[0]).toContain('a: label.sub_kategori "kebersihan/sedot-wc"');
    expect(issues.some((i) => i.startsWith('b: intent_terakhir.sub_kategori'))).toBe(true);
  });
});

describe('last_intent skenario lanjutan, sama dengan produksi', () => {
  const ask = 'Foto untuk apa: produk, prewedding, atau dokumentasi acara?';
  const riwayat = [
    { role: 'USER' as const, content: 'cari tukang foto' },
    { role: 'ASSISTANT' as const, content: ask },
  ];

  it('intent_terakhir dipakai apa adanya kalau diisi', () => {
    const explicit = intent({ jenis: 'perlu_klarifikasi', sub_kategori: null, pertanyaan_klarifikasi: ask }, { budget_maks: 500_000 });
    const s = scenario({ riwayat, intent_terakhir: explicit as unknown as Record<string, unknown> });
    expect(lastIntentFor(s)).toEqual({ intent: explicit, derived: false });
    expect(inputFor(s, SUBCATEGORIES).lastIntent).toEqual(explicit);
  });

  it('kosong dan riwayat diakhiri pertanyaan ASSISTANT: diturunkan sebagai perlu_klarifikasi yang lolos skema produksi', () => {
    const { intent: derived, derived: flag } = lastIntentFor(scenario({ riwayat }));
    expect(flag).toBe(true);
    expect(derived).toEqual({
      jenis: 'perlu_klarifikasi',
      sub_kategori: null,
      slot: { lokasi: { teks: null, pakai_lokasi_saat_ini: false }, waktu: { jenis: 'TIDAK_DISEBUT', teks: null }, budget_maks: null, atribut: [] },
      confidence: DERIVED_CONFIDENCE,
      pertanyaan_klarifikasi: ask,
    });
    const dataset = datasetSchema.parse({ versi: 1, skenario: [scenario({ riwayat, intent_terakhir: derived! })] });
    expect(catalogIssues(dataset, KEYS)).toEqual([]);
  });

  it.each([
    ['tanpa riwayat', undefined],
    ['riwayat diakhiri USER', [{ role: 'USER' as const, content: 'cari tukang foto?' }]],
    ['ASSISTANT bukan pertanyaan', [{ role: 'USER' as const, content: 'halo' }, { role: 'ASSISTANT' as const, content: 'Halo! Ceritakan jasa yang kamu butuhkan.' }]],
  ])('%s: last_intent null', (_label, history) => {
    expect(lastIntentFor(scenario({ riwayat: history }))).toEqual({ intent: null, derived: false });
  });

  it.skipIf(!hasTestDatabase)('teks prompt identik per byte dengan last_intent produksi yang dibaca ulang dari JSONB', async () => {
    const explicit = intent({ jenis: 'perlu_klarifikasi', sub_kategori: null, pertanyaan_klarifikasi: ask }, {
      lokasi: { teks: 'Kuta', pakai_lokasi_saat_ini: false },
      budget_maks: 500_000,
      atribut: [{ kunci: 'jumlah_orang', nilai: '2' }],
    });
    for (const s of [scenario({ riwayat }), scenario({ riwayat, intent_terakhir: explicit as unknown as Record<string, unknown> })]) {
      const input = inputFor(s, SUBCATEGORIES);
      // Sama seperti sendMessage: intent disimpan ke chat_sessions.last_intent lalu dibaca lagi di giliran berikutnya.
      const row = await prisma.chatSession.create({
        data: { guestToken: hashToken(`eval-${randomUUID()}`), expiresAt: new Date(Date.now() + 60_000), lastIntent: lastIntentFor(s).intent as object },
      });
      try {
        const stored = (await prisma.chatSession.findUniqueOrThrow({ where: { id: row.id } })).lastIntent;
        expect(buildUserInput(input)).toBe(buildUserInput({ ...input, lastIntent: stored }));
      } finally {
        await prisma.chatSession.delete({ where: { id: row.id } });
      }
    }
  });

  it('input prompt: riwayat dipangkas ke CHAT_HISTORY_MESSAGES terakhir, tanpa personalisasi', () => {
    const long = Array.from({ length: CHAT_HISTORY_MESSAGES + 3 }, (_, i) => ({ role: (i % 2 ? 'ASSISTANT' : 'USER') as 'USER', content: `pesan ${i}` }));
    const input = inputFor(scenario({ riwayat: long }), SUBCATEGORIES);
    expect(input.history).toEqual(long.slice(-CHAT_HISTORY_MESSAGES));
    expect(input.personalization).toBeNull();
    expect(input.subcategories).toEqual(SUBCATEGORIES);
  });
});

describe('scoreScenario (D153)', () => {
  const label = (jenis: Intent['jenis'], sub: string | null = null, slot?: Scenario['label']['slot']) => ({ jenis, sub_kategori: sub, slot });

  it('benar: jenis tepat, dan untuk cari_jasa juga sub-kategori tepat', () => {
    expect(scoreScenario(label('cari_jasa', 'perbaikan/servis-ac'), intent()).correct).toBe(true);
    expect(scoreScenario(label('cari_jasa', 'fotografi/foto-produk'), intent()).correct).toBe(false);
    expect(scoreScenario(label('sapaan'), intent()).correct).toBe(false);
    expect(scoreScenario(label('sapaan'), intent({ jenis: 'sapaan', sub_kategori: null })).correct).toBe(true);
    // Pertanyaan klarifikasi tidak dinilai, hanya jenisnya.
    expect(scoreScenario(label('perlu_klarifikasi'), intent({ jenis: 'perlu_klarifikasi', sub_kategori: null, pertanyaan_klarifikasi: 'apa?' })).correct).toBe(true);
  });

  it('gagal (prediksi null) salah, dan setiap slot berlabel ikut salah', () => {
    expect(scoreScenario(label('sapaan', null, { waktu_jenis: 'SEKARANG', budget_maks: null }), null)).toEqual({
      correct: false,
      slot: { waktu_jenis: false, budget_maks: false },
    });
  });

  it('slot hanya dinilai kalau berlabel; teks dinormalisasi; null berlabel berarti harus null', () => {
    const predicted = intent({}, {
      lokasi: { teks: '  Renon ', pakai_lokasi_saat_ini: false },
      waktu: { jenis: 'TERJADWAL', teks: 'besok' },
      budget_maks: 200_000,
      atribut: [{ kunci: 'jumlah_unit', nilai: '2' }, { kunci: 'Jenis', nilai: 'Split  1 PK' }],
    });
    expect(scoreScenario(label('cari_jasa', 'perbaikan/servis-ac'), predicted).slot).toEqual({});
    expect(
      scoreScenario(
        label('cari_jasa', 'perbaikan/servis-ac', {
          lokasi_teks: 'renon', waktu_jenis: 'TERJADWAL', budget_maks: 200_000,
          atribut: [{ kunci: 'jenis', nilai: 'split 1 pk' }, { kunci: 'jumlah_unit', nilai: '2' }],
        }),
        predicted,
      ).slot,
    ).toEqual({ lokasi_teks: true, waktu_jenis: true, budget_maks: true, atribut: true });
    expect(
      scoreScenario(
        label('cari_jasa', 'perbaikan/servis-ac', { lokasi_teks: null, waktu_jenis: 'SEKARANG', budget_maks: 150_000, atribut: [{ kunci: 'jumlah_unit', nilai: '2' }] }),
        predicted,
      ).slot,
    ).toEqual({ lokasi_teks: false, waktu_jenis: false, budget_maks: false, atribut: false });
  });
});

describe('ringkasan', () => {
  const result = (overrides: Partial<ScenarioResult>): ScenarioResult => ({
    id: 'x', asal: 'penyusun', pesan: 'p', label: { jenis: 'sapaan', sub_kategori: null }, predicted: intent({ jenis: 'sapaan', sub_kategori: null }),
    model: 'm', error: null, attempts: 1, latencyMs: 1000, usage: { inputTokens: 10, outputTokens: 2, thoughtTokens: 0, totalTokens: 12 },
    lastIntentDerived: false, promptHash: 'h', score: { correct: true, slot: {} }, ...overrides,
  });

  it('percentile sama dengan PERCENTILE_CONT (interpolasi linear)', () => {
    expect(percentile([], 0.95)).toBeNull();
    expect(percentile([5], 0.95)).toBe(5);
    expect(percentile([1000, 2000, 3000, 4000], 0.5)).toBe(2500);
    expect(percentile([1000, 2000, 3000, 4000], 0.95)).toBeCloseTo(3850);
  });

  it('akurasi total, per jenis, per asal, confusion, gagal, retry, latensi dan token', () => {
    const results = [
      result({ id: 'a' }),
      result({ id: 'b', asal: 'teman', attempts: 2, latencyMs: 3000 }),
      result({ id: 'c', asal: 'draf_ai', label: { jenis: 'cari_jasa', sub_kategori: 'perbaikan/servis-ac' }, score: { correct: false, slot: { budget_maks: true } } }),
      result({
        id: 'd', asal: 'teman', label: { jenis: 'cari_jasa', sub_kategori: 'perbaikan/servis-ac' }, predicted: null, model: null, attempts: null,
        latencyMs: null, usage: null, error: { reason: 'http', status: 503, attempts: 2 }, score: { correct: false, slot: { budget_maks: false } },
      }),
      result({ id: 'e', asal: '(tanpa asal)', lastIntentDerived: true }),
    ];
    const summary = summarize(results);
    expect(summary.total).toEqual({ n: 5, benar: 3, persen: 60, target_persen: 80, lulus_target: false });
    expect(summary.gagal).toBe(1);
    expect(summary.berhasil_setelah_retry).toBe(1);
    expect(summary.last_intent_turunan).toBe(1);
    expect(summary.per_jenis).toEqual({ cari_jasa: { n: 2, benar: 0, persen: 0 }, sapaan: { n: 3, benar: 3, persen: 100 } });
    expect(summary.per_asal).toEqual({
      penyusun: { n: 1, benar: 1, persen: 100 },
      teman: { n: 2, benar: 1, persen: 50 },
      draf_ai: { n: 1, benar: 0, persen: 0 },
      '(tanpa asal)': { n: 1, benar: 1, persen: 100 },
    });
    expect(summary.confusion.cari_jasa).toMatchObject({ sapaan: 1, '(gagal)': 1, cari_jasa: 0 });
    expect(summary.confusion.sapaan).toMatchObject({ sapaan: 3 });
    expect(summary.slot.budget_maks).toEqual({ n: 2, benar: 1, persen: 50 });
    expect(summary.slot.atribut).toEqual({ n: 0, benar: 0, persen: null });
    expect(summary.latensi_ms).toEqual({ n: 4, rata: 1500, p50: 1000, p95: 2700 });
    expect(summary.token).toEqual({ rata_total_per_panggilan: 12, jumlah_input: 40, jumlah_output: 8, jumlah_total: 48 });
  });

  it('CSV meng-escape koma, kutip, dan baris baru di pesan', () => {
    const csv = toCsv([result({ pesan: 'ac "rusak", tolong\nsegera' })]);
    expect(csv.split('\n')[0]).toContain('id,asal,label_jenis');
    expect(csv).toContain('"ac ""rusak"", tolong\nsegera"');
  });
});

describe('pipeline dengan fake', () => {
  it('menjalankan skenario berurutan dengan jeda, mencatat gagal dan retry terpisah, dan menulis JSON, CSV, Markdown', async () => {
    const dataset = datasetSchema.parse({
      versi: 1,
      skenario: [
        scenario({ id: 'ac', asal: 'penyusun', label: { jenis: 'cari_jasa', sub_kategori: 'perbaikan/servis-ac', slot: { waktu_jenis: 'SEKARANG' } }, pesan: 'servis ac sekarang' }),
        scenario({ id: 'halo', asal: 'teman', pesan: 'halo kak', label: { jenis: 'sapaan', sub_kategori: null } }),
        scenario({ id: 'retry', asal: 'draf_ai', pesan: `halo ${FAKE_RETRY_MARKER}`, label: { jenis: 'sapaan', sub_kategori: null } }),
        scenario({ id: 'gagal', asal: 'draf_ai', pesan: 'akan gagal', label: { jenis: 'di_luar_cakupan', sub_kategori: null } }),
        scenario({ id: 'lewat-limit', pesan: 'tidak dijalankan', label: { jenis: 'sapaan', sub_kategori: null } }),
      ],
    });
    const gateway: LlmGateway = {
      extractIntent: (input) =>
        input.message === 'akan gagal'
          ? Promise.reject(new AppError('GEMINI_UNAVAILABLE', 'x', { context: { llm_reason: 'http', llm_status: 503, llm_attempts: 2 } }))
          : fakeGateway.extractIntent(input),
    };
    const spy = vi.spyOn(gateway, 'extractIntent');
    const sleep = vi.fn(async () => {});
    const results = await runEval(dataset.skenario, gateway, SUBCATEGORIES, { delayMs: 8000, limit: 4, sleep });

    expect(results.map((r) => r.id)).toEqual(['ac', 'halo', 'retry', 'gagal']);
    expect(sleep.mock.calls).toEqual([[8000], [8000], [8000]]);
    expect(spy.mock.calls[0]![0]).toEqual(inputFor(dataset.skenario[0]!, SUBCATEGORIES));
    expect(results.map((r) => r.score.correct)).toEqual([true, true, true, false]);
    expect(results[2]!.attempts).toBe(2);
    expect(results[3]).toMatchObject({ predicted: null, error: { reason: 'http', status: 503, attempts: 2 } });
    expect(results[0]!.score.slot).toEqual({ waktu_jenis: true });
    expect(results[0]!.promptHash).toMatch(/^[0-9a-f]{64}$/);

    const summary = summarize(results);
    expect(summary.total.persen).toBe(75);
    expect(summary.gagal).toBe(1);
    expect(summary.berhasil_setelah_retry).toBe(1);

    const meta = buildMeta({
      gateway: 'fake', configuredModel: 'gemini-uji', results, datasetText: JSON.stringify(dataset), dataset, subcategories: SUBCATEGORIES,
      startedAt: new Date('2026-11-16T00:00:00Z'),
    });
    expect(meta).toMatchObject({
      gateway: 'fake', model_menjawab: ['fake'], jumlah_skenario_dataset: 5, jumlah_skenario_dijalankan: 4,
      skenario_per_asal: { penyusun: 1, teman: 1, draf_ai: 2, '(tanpa asal)': 1 },
    });
    expect(meta.sha256_system_instruction).toMatch(/^[0-9a-f]{64}$/);
    expect(meta.commit).toMatch(/^[0-9a-f]{40}$/);
    // Hash prompt berubah kalau satu input prompt saja berubah.
    const changed = buildMeta({ ...{ gateway: 'fake', configuredModel: 'g', datasetText: '', dataset, subcategories: SUBCATEGORIES, startedAt: new Date() },
      results: results.map((r, i) => (i === 0 ? { ...r, promptHash: 'lain' } : r)) });
    expect(changed.sha256_seluruh_prompt).not.toBe(meta.sha256_seluruh_prompt);

    const dir = mkdtempSync(join(tmpdir(), 'eval-intent-'));
    try {
      writeOutputs(dir, meta, summary, results);
      const json = JSON.parse(readFileSync(join(dir, 'results.json'), 'utf8'));
      expect(json.meta.gateway).toBe('fake');
      expect(json.hasil).toHaveLength(4);
      expect(readFileSync(join(dir, 'results.csv'), 'utf8').trim().split('\n')).toHaveLength(5);
      const md = readFileSync(join(dir, 'summary.md'), 'utf8');
      expect(md).toContain('**75 persen**');
      expect(md).toContain('| draf_ai | 2 | 1 | 50 |');
      expect(md).toContain('Berhasil setelah retry 5xx (D165): 1');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('prompt evaluasi sama dengan prompt produksi tamu: riwayat, last_intent turunan, tanpa blok personalisasi', () => {
    const s = scenario({
      riwayat: [{ role: 'USER', content: 'cari tukang foto' }, { role: 'ASSISTANT', content: 'Foto untuk apa?' }],
      pesan: 'produk',
      label: { jenis: 'cari_jasa', sub_kategori: 'fotografi/foto-produk' },
    });
    const text = buildUserInput(inputFor(s, SUBCATEGORIES));
    expect(text).toContain('PENGGUNA: cari tukang foto\nASISTEN: Foto untuk apa?');
    expect(text).toContain('"jenis":"perlu_klarifikasi"');
    expect(text).not.toContain('Riwayat sub-kategori');
  });
});
