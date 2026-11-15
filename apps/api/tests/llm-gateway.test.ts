/**
 * Sesi 9a: port LlmGateway (D151), adapter Gemini, fake, dan skema intent (D152, H14).
 * Tanpa jaringan: `fetch` di-spy, jadi yang diuji bentuk permintaan dan pemetaan balasan.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '../src/config/env';
import { LLM_GATEWAY_TIMEOUT_MS } from '../src/config/constants';
import { AppError } from '../src/lib/errors';
import { fakeGateway, geminiGateway, type ExtractIntentInput } from '../src/lib/llm-gateway';
import { buildIntentSchema, type Intent } from '../src/lib/llm-intent';
import { buildSystemInstruction, buildUserInput } from '../src/lib/llm-prompt';

const KEY = env.GEMINI_API_KEY;

const SUBCATEGORIES = [
  { key: 'perbaikan/servis-ac', name: 'Servis AC', categoryName: 'Perbaikan' },
  { key: 'otomotif/cuci-mobil-panggilan', name: 'Cuci Mobil Panggilan', categoryName: 'Otomotif' },
  { key: 'fotografi/foto-prewedding', name: 'Foto Prewedding', categoryName: 'Fotografi' },
];
const KEYS = SUBCATEGORIES.map((s) => s.key);

const input = (overrides: Partial<ExtractIntentInput> = {}): ExtractIntentInput => ({
  message: 'ac kamar ga dingin, bisa skrg?',
  history: [],
  subcategories: SUBCATEGORIES,
  lastIntent: null,
  personalizationSnapshot: null,
  ...overrides,
});

const validIntent = (overrides: Partial<Intent> = {}): Intent => ({
  jenis: 'cari_jasa',
  sub_kategori: 'perbaikan/servis-ac',
  slot: {
    lokasi: { teks: null, pakai_lokasi_saat_ini: false },
    waktu: { jenis: 'SEKARANG', teks: 'skrg' },
    budget_maks: null,
    atribut: [],
  },
  confidence: 0.92,
  pertanyaan_klarifikasi: null,
  ...overrides,
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Balasan Interactions API: langkah thought diabaikan, teks diambil dari model_output. */
const interaction = (text: string, extra: Record<string, unknown> = {}) => ({
  id: 'int-1',
  object: 'interaction',
  status: 'completed',
  model: 'gemini-3.5-flash-lite',
  steps: [
    { type: 'thought', signature: 'abc', content: [{ type: 'text', text: 'pengguna menyebut AC' }] },
    { type: 'model_output', content: [{ type: 'text', text }] },
  ],
  usage: { total_input_tokens: 812, total_output_tokens: 64, total_thought_tokens: 12, total_tokens: 888 },
  ...extra,
});

/** Galat Gemini apa pun: GEMINI_UNAVAILABLE 502, tanpa kunci, tanpa cause, tanpa isi pesan pengguna. */
async function expectSafeLlmError(promise: Promise<unknown>) {
  const error = await promise.then(() => null, (e: unknown) => e);
  expect(error).toBeInstanceOf(AppError);
  const appError = error as AppError;
  expect(appError).toMatchObject({ code: 'GEMINI_UNAVAILABLE', status: 502 });
  expect(appError.cause).toBeUndefined();
  const exposed = `${appError.message} ${JSON.stringify(appError.context)} ${appError.stack}`;
  expect(exposed).not.toContain(KEY);
  expect(exposed).not.toContain('ga dingin');
  return appError;
}

describe('geminiGateway (sesi 9a)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('mengirim model dari env, skema intent, prompt, store:false, dan kunci di header, bukan di URL', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, interaction(JSON.stringify(validIntent()))));
    await geminiGateway.extractIntent(input());

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://generativelanguage.googleapis.com/v1/interactions');
    expect(String(url)).not.toContain(KEY);
    expect(init).toMatchObject({ method: 'POST', headers: { 'x-goog-api-key': KEY, 'Content-Type': 'application/json' } });
    expect(init!.signal).toBeInstanceOf(AbortSignal);
    const body = JSON.parse(init!.body as string);
    expect(body).toEqual({
      model: env.GEMINI_MODEL,
      system_instruction: buildSystemInstruction(SUBCATEGORIES),
      input: buildUserInput(input()),
      response_format: { type: 'text', mime_type: 'application/json', schema: buildIntentSchema(KEYS).jsonSchema },
      generation_config: { thinking_level: 'minimal', max_output_tokens: 1024 },
      store: false,
    });
    expect(body.response_format.schema.properties.sub_kategori.anyOf[0].enum).toEqual(KEYS);
  });

  it('memetakan balasan ke intent, model yang menjawab, token, dan latensi', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json(200, interaction(JSON.stringify(validIntent()), { model: 'models/gemini-3.5-flash-lite' })),
    );
    const result = await geminiGateway.extractIntent(input());
    expect(result.intent).toEqual(validIntent());
    expect(result.model).toBe('gemini-3.5-flash-lite');
    expect(result.usage).toEqual({ inputTokens: 812, outputTokens: 64, thoughtTokens: 12, totalTokens: 888 });
    expect(Number.isInteger(result.latencyMs)).toBe(true);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('model dari env dipakai kalau balasan tidak menyebut model', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, interaction(JSON.stringify(validIntent()), { model: undefined })));
    expect((await geminiGateway.extractIntent(input())).model).toBe(env.GEMINI_MODEL);
  });

  it.each([
    ['teks bukan JSON', 'maaf saya tidak paham'],
    ['sub-kategori di luar daftar', JSON.stringify(validIntent({ sub_kategori: 'kebersihan/sedot-wc' }))],
    ['perlu_klarifikasi tanpa pertanyaan', JSON.stringify(validIntent({ jenis: 'perlu_klarifikasi', sub_kategori: null }))],
    ['sapaan yang membawa sub-kategori', JSON.stringify(validIntent({ jenis: 'sapaan' }))],
    ['kunci tambahan', JSON.stringify({ ...validIntent(), harga: 150000 })],
    ['confidence di atas 1', JSON.stringify(validIntent({ confidence: 1.4 }))],
  ])('%s ditolak sebagai invalid_output, tidak diperbaiki diam-diam', async (_label, text) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, interaction(text)));
    const error = await expectSafeLlmError(geminiGateway.extractIntent(input()));
    expect(error.context).toMatchObject({ llm_operation: 'extract_intent', llm_reason: 'invalid_output' });
  });

  it('path isu Zod dicatat tanpa nilainya', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, interaction(JSON.stringify(validIntent({ sub_kategori: 'ga dingin' })))));
    const error = await expectSafeLlmError(geminiGateway.extractIntent(input()));
    expect(error.context!.llm_issue_paths).toContain('sub_kategori');
  });

  it('status selain completed ditolak sebagai incomplete', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, interaction(JSON.stringify(validIntent()), { status: 'incomplete' })));
    const error = await expectSafeLlmError(geminiGateway.extractIntent(input()));
    expect(error.context).toMatchObject({ llm_reason: 'incomplete', llm_interaction_status: 'incomplete' });
  });

  it('timeout memakai LLM_GATEWAY_TIMEOUT_MS 8 detik (usulan D156) dan menjadi GEMINI_UNAVAILABLE', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));
    const error = await expectSafeLlmError(geminiGateway.extractIntent(input()));
    expect(LLM_GATEWAY_TIMEOUT_MS).toBe(8_000);
    expect(timeout).toHaveBeenCalledWith(LLM_GATEWAY_TIMEOUT_MS);
    expect(error.context).toMatchObject({ llm_reason: 'timeout', llm_timeout: true });
  });

  it('galat jaringan yang pesannya memuat kunci tidak ikut diteruskan', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError(`fetch failed x-goog-api-key: ${KEY}`));
    const error = await expectSafeLlmError(geminiGateway.extractIntent(input()));
    expect(error.context).toMatchObject({ llm_reason: 'network', llm_timeout: false });
  });

  it('429 ditandai kuota habis, dengan status dan kode galat tanpa isi balasan', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json(429, { error: { code: 429, status: 'RESOURCE_EXHAUSTED', message: `quota for key ${KEY}: ac kamar ga dingin` } }),
    );
    const error = await expectSafeLlmError(geminiGateway.extractIntent(input()));
    expect(error.context).toEqual({
      llm_operation: 'extract_intent',
      llm_reason: 'http',
      llm_status: 429,
      llm_error_code: 'RESOURCE_EXHAUSTED',
      llm_quota_exceeded: true,
    });
  });

  it.each([500, 503])('respons %i bukan kuota habis', async (status) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(status, { error: { code: 'unavailable', message: 'ac kamar ga dingin' } }));
    const error = await expectSafeLlmError(geminiGateway.extractIntent(input()));
    expect(error.context).toMatchObject({ llm_status: status, llm_error_code: 'unavailable', llm_quota_exceeded: false });
  });
});

describe('fakeGateway (sesi 9a)', () => {
  const extract = async (message: string, subcategories = SUBCATEGORIES) =>
    (await fakeGateway.extractIntent(input({ message, subcategories }))).intent;

  it('deterministik: masukan sama, hasil sama', async () => {
    const a = await fakeGateway.extractIntent(input());
    const b = await fakeGateway.extractIntent(input());
    expect(a).toEqual(b);
    expect(a.model).toBe('fake');
  });

  it.each([
    ['servis AC sekarang', 'cari_jasa', 'perbaikan/servis-ac'],
    ['mau cuci mobil di denpasar besok', 'cari_jasa', 'otomotif/cuci-mobil-panggilan'],
    ['butuh fotografer', 'perlu_klarifikasi', null],
    ['yang prewedding aja', 'cari_jasa', 'fotografi/foto-prewedding'],
    ['halo kak', 'sapaan', null],
    ['cari jasa les piano', 'jasa_tidak_tersedia', null],
    ['cara bikin nasi goreng', 'di_luar_cakupan', null],
  ] as const)('"%s" menjadi %s', async (message, jenis, subKategori) => {
    const intent = await extract(message);
    expect(intent.jenis).toBe(jenis);
    expect(intent.sub_kategori).toBe(subKategori);
    expect(buildIntentSchema(KEYS).zod.safeParse(intent).success).toBe(true);
  });

  it('lokasi atau waktu yang kurang tetap cari_jasa, bukan klarifikasi', async () => {
    const intent = await extract('servis AC sekarang');
    expect(intent.slot.lokasi).toEqual({ teks: null, pakai_lokasi_saat_ini: false });
    expect(intent.slot.waktu).toEqual({ jenis: 'SEKARANG', teks: 'sekarang' });
    expect((await extract('servis ac')).slot.waktu).toEqual({ jenis: 'TIDAK_DISEBUT', teks: null });
  });

  it('mengekstrak budget dan lokasi', async () => {
    const intent = await extract('cuci mobil di kuta budget 150rb');
    expect(intent.slot.budget_maks).toBe(150_000);
    expect(intent.slot.lokasi.teks).toBe('kuta');
    expect((await extract('prewedding max 1,5jt dekat sini')).slot).toMatchObject({
      budget_maks: 1_500_000,
      lokasi: { pakai_lokasi_saat_ini: true },
    });
    expect((await extract('servis ac di sini')).slot.lokasi).toEqual({ teks: null, pakai_lokasi_saat_ini: true });
  });

  it('sub-kategori yang tidak ada di daftar aktif tidak pernah dipilih', async () => {
    const intent = await extract('servis AC sekarang', SUBCATEGORIES.filter((s) => s.key !== 'perbaikan/servis-ac'));
    expect(intent).toMatchObject({ jenis: 'jasa_tidak_tersedia', sub_kategori: null });
  });
});

describe('skema intent (D152)', () => {
  const { zod, jsonSchema } = buildIntentSchema(KEYS);

  it('menerima intent yang sah untuk tiap jenis', () => {
    expect(zod.safeParse(validIntent()).success).toBe(true);
    expect(zod.safeParse(validIntent({ jenis: 'perlu_klarifikasi', sub_kategori: null, pertanyaan_klarifikasi: 'Foto untuk apa?' })).success).toBe(true);
    expect(zod.safeParse(validIntent({ jenis: 'di_luar_cakupan', sub_kategori: null })).success).toBe(true);
  });

  it.each([
    ['cari_jasa tanpa sub-kategori', validIntent({ sub_kategori: null })],
    ['pertanyaan klarifikasi pada cari_jasa', validIntent({ pertanyaan_klarifikasi: 'Kapan?' })],
    ['budget negatif', validIntent({ slot: { ...validIntent().slot, budget_maks: -5 } })],
    ['budget pecahan', validIntent({ slot: { ...validIntent().slot, budget_maks: 1500.5 } })],
    ['confidence negatif', validIntent({ confidence: -0.1 })],
    ['teks lokasi melebihi 200 karakter', validIntent({ slot: { ...validIntent().slot, lokasi: { teks: 'a'.repeat(201), pakai_lokasi_saat_ini: false } } })],
  ])('menolak %s', (_label, intent) => {
    expect(zod.safeParse(intent).success).toBe(false);
  });

  it('daftar sub-kategori kosong: sub_kategori hanya boleh null', () => {
    const empty = buildIntentSchema([]);
    expect(empty.jsonSchema.properties.sub_kategori).toEqual({ type: 'null' });
    expect(empty.zod.safeParse(validIntent()).success).toBe(false);
    expect(empty.zod.safeParse(validIntent({ jenis: 'jasa_tidak_tersedia', sub_kategori: null })).success).toBe(true);
  });

  it('JSON Schema dan Zod memuat properti yang sama di setiap tingkat', () => {
    const props = (schema: { properties: Record<string, unknown> }) => Object.keys(schema.properties).sort();
    const top = jsonSchema as unknown as { properties: Record<string, { properties: Record<string, unknown> }> };
    expect(props(top)).toEqual(Object.keys(validIntent()).sort());
    expect(props(top.properties.slot!)).toEqual(Object.keys(validIntent().slot).sort());
    expect(top.properties.slot!.properties).toMatchObject({
      lokasi: { required: ['teks', 'pakai_lokasi_saat_ini'] },
      waktu: { required: ['jenis', 'teks'] },
    });
  });
});
