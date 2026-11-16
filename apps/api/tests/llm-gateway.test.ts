/**
 * Sesi 9a: port LlmGateway (D151), adapter Gemini, fake, dan skema intent (D152, H14).
 * Tanpa jaringan: `fetch` di-spy, jadi yang diuji bentuk permintaan dan pemetaan balasan.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '../src/config/env';
import { LLM_GATEWAY_TIMEOUT_MS, LLM_RETRY_DELAY_MS, LLM_RETRY_MIN_REMAINING_MS } from '../src/config/constants';
import { AppError } from '../src/lib/errors';
import { FAKE_RETRY_MARKER, fakeGateway, geminiGateway, withRetry, type ExtractIntentInput } from '../src/lib/llm-gateway';
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
  personalization: null,
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
      llm_attempts: 1,
    });
  });

  it.each([500, 503])('respons %i bukan kuota habis', async (status) => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => json(status, { error: { code: 'unavailable', message: 'ac kamar ga dingin' } }));
    const error = await expectSafeLlmError(geminiGateway.extractIntent(input()));
    expect(error.context).toMatchObject({ llm_status: status, llm_error_code: 'unavailable', llm_quota_exceeded: false });
  });
});

describe('retry 5xx (D165, usulan D167)', () => {
  afterEach(() => vi.restoreAllMocks());

  const unavailable = (status: number) => json(status, { error: { code: 'unavailable', message: 'ac kamar ga dingin' } });
  const ok = () => json(200, interaction(JSON.stringify(validIntent())));

  it.each([500, 502, 503, 504])('%i sekali lalu berhasil: dua percobaan, latensi termasuk jeda, sisa tenggat untuk percobaan kedua', async (status) => {
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(unavailable(status)).mockResolvedValueOnce(ok());
    const result = await geminiGateway.extractIntent(input());
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[1]![1]!.body).toBe(fetchSpy.mock.calls[0]![1]!.body);
    expect(result).toMatchObject({ attempts: 2, intent: validIntent() });
    expect(result.latencyMs).toBeGreaterThanOrEqual(LLM_RETRY_DELAY_MS);
    expect(timeout.mock.calls[0]![0]).toBe(LLM_GATEWAY_TIMEOUT_MS);
    const second = timeout.mock.calls[1]![0];
    expect(Number.isInteger(second)).toBe(true);
    expect(second).toBeLessThanOrEqual(LLM_GATEWAY_TIMEOUT_MS - LLM_RETRY_DELAY_MS);
    expect(second).toBeGreaterThanOrEqual(LLM_RETRY_MIN_REMAINING_MS);
  });

  it('5xx dua kali: galat dengan llm_attempts 2, tidak ada percobaan ketiga', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => unavailable(503));
    const error = await expectSafeLlmError(geminiGateway.extractIntent(input()));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(error.context).toMatchObject({ llm_status: 503, llm_attempts: 2 });
  });

  it.each([
    ['429 kuota', () => json(429, { error: { status: 'RESOURCE_EXHAUSTED' } })],
    ['400', () => json(400, { error: { status: 'INVALID_ARGUMENT' } })],
    ['404', () => json(404, { error: { status: 'NOT_FOUND' } })],
    ['501 bukan sementara', () => json(501, { error: { status: 'UNIMPLEMENTED' } })],
    ['invalid_output', () => json(200, interaction('bukan json'))],
    ['incomplete', () => json(200, interaction(JSON.stringify(validIntent()), { status: 'incomplete' }))],
  ])('%s tidak diulang', async (_label, response) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => response());
    const error = await expectSafeLlmError(geminiGateway.extractIntent(input()));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(error.context!.llm_attempts).toBe(1);
  });

  it.each([
    ['timeout', new DOMException('The operation was aborted due to timeout', 'TimeoutError')],
    ['jaringan', new TypeError('fetch failed')],
  ])('%s tidak diulang', async (_label, failure) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(failure);
    const error = await expectSafeLlmError(geminiGateway.extractIntent(input()));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(error.context!.llm_attempts).toBe(1);
  });

  /** Jam palsu: percobaan pertama gagal pada `failedAt` ms sejak mulai. */
  async function attemptsWhenFailingAt(failedAt: number) {
    const clock = vi.spyOn(performance, 'now').mockReturnValueOnce(0).mockReturnValueOnce(failedAt).mockReturnValue(failedAt + 1000);
    let calls = 0;
    const result = await withRetry(async () => {
      calls += 1;
      if (calls === 1) throw new AppError('GEMINI_UNAVAILABLE', 'x', { context: { llm_reason: 'http', llm_status: 503 } });
      return { intent: validIntent(), model: 'm', usage: { inputTokens: 0, outputTokens: 0, thoughtTokens: 0, totalTokens: 0 }, raw: null };
    }).then(
      (r) => r.attempts,
      (e: AppError) => -(e.context!.llm_attempts as number),
    );
    clock.mockRestore();
    return { result, calls };
  }

  it('ambang sisa tenggat: tepat 3000 ms masih diulang, 2999 ms tidak', async () => {
    // 8000 - 4000 - 1000 = 3000
    expect(await attemptsWhenFailingAt(LLM_GATEWAY_TIMEOUT_MS - LLM_RETRY_DELAY_MS - LLM_RETRY_MIN_REMAINING_MS)).toEqual({ result: 2, calls: 2 });
    expect(await attemptsWhenFailingAt(LLM_GATEWAY_TIMEOUT_MS - LLM_RETRY_DELAY_MS - LLM_RETRY_MIN_REMAINING_MS + 1)).toEqual({ result: -1, calls: 1 });
    expect(LLM_RETRY_MIN_REMAINING_MS).toBe(3_000);
    expect(LLM_RETRY_DELAY_MS).toBe(1_000);
  });

  it('fake: penanda #uji-503 gagal sekali lalu berhasil, tanpa penanda satu percobaan', async () => {
    const retried = await fakeGateway.extractIntent(input({ message: `servis ac ${FAKE_RETRY_MARKER}` }));
    expect(retried.attempts).toBe(2);
    expect(retried.latencyMs).toBeGreaterThanOrEqual(LLM_RETRY_DELAY_MS);
    expect(retried.intent.sub_kategori).toBe('perbaikan/servis-ac');
    expect((await fakeGateway.extractIntent(input())).attempts).toBe(1);
  });
});

describe('fakeGateway (sesi 9a)', () => {
  const extract = async (message: string, subcategories = SUBCATEGORIES) =>
    (await fakeGateway.extractIntent(input({ message, subcategories }))).intent;

  it('deterministik: masukan sama, hasil sama', async () => {
    // latencyMs diukur sungguhan sejak usulan D167, jadi bukan bagian dari determinisme.
    const { latencyMs: _a, ...a } = await fakeGateway.extractIntent(input());
    const { latencyMs: _b, ...b } = await fakeGateway.extractIntent(input());
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

  it('riwayat dipakai hanya kalau pesan merujuknya secara eksplisit (usulan D168)', async () => {
    const personalization = { riwayat_sub_kategori: ['perbaikan/servis-ac'] };
    const remembered = await fakeGateway.extractIntent(input({ message: 'mau yang kayak kemarin dong', personalization }));
    expect(remembered.intent).toMatchObject({ jenis: 'cari_jasa', sub_kategori: 'perbaikan/servis-ac' });
    expect((await fakeGateway.extractIntent(input({ message: 'mau yang kayak kemarin dong' }))).intent.jenis).toBe('di_luar_cakupan');
    expect((await fakeGateway.extractIntent(input({ message: 'butuh fotografer', personalization }))).intent.jenis).toBe('perlu_klarifikasi');
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
