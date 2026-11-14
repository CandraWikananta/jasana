/**
 * Sesi 7a dan 8a: adapter Xendit (D101), refund dan payout, dan timeout gateway (H96). Tanpa jaringan:
 * `fetch` di-spy, sehingga yang diuji bentuk permintaan dan pemetaan galat.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '../src/config/env';
import { PAYMENT_GATEWAY_TIMEOUT_MS } from '../src/config/constants';
import { AppError } from '../src/lib/errors';
import { fakeGateway, xenditGateway } from '../src/lib/payment-gateway';

const KEY = env.XENDIT_SECRET_KEY;
const KEY_B64 = Buffer.from(`${KEY}:`).toString('base64');
const NOW = new Date('2026-11-10T03:00:00.000Z');

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const input = (expiresAt = new Date(NOW.getTime() + 9 * 60_000 + 30_500)) => ({
  externalId: 'PAY-abc',
  amount: 500000,
  description: 'Order ORD-20261110-ABCDEF12',
  payerEmail: 'client@uji.test',
  expiresAt,
});

/** Galat gateway apa pun tidak boleh membawa kunci, dalam bentuk asli maupun base64. */
async function expectSafeGatewayError(promise: Promise<unknown>) {
  const error = await promise.then(() => null, (e: unknown) => e);
  expect(error).toBeInstanceOf(AppError);
  const appError = error as AppError;
  expect(appError).toMatchObject({ code: 'PAYMENT_GATEWAY_ERROR', status: 502 });
  expect(appError.cause).toBeUndefined();
  const exposed = `${appError.message} ${JSON.stringify(appError.context)} ${appError.stack}`;
  expect(exposed).not.toContain(KEY);
  expect(exposed).not.toContain(KEY_B64);
  return appError;
}

describe('xenditGateway (sesi 7a)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('createInvoice mengirim body, autentikasi basic, dan invoice_duration sisa detik ke deadline', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: NOW });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json(200, { id: 'inv-1', invoice_url: 'https://checkout-staging.xendit.co/web/inv-1', expiry_date: '2026-11-10T03:09:31.000Z', status: 'PENDING' }),
    );

    const invoice = await xenditGateway.createInvoice(input());

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.xendit.co/v2/invoices');
    expect(init).toMatchObject({ method: 'POST', headers: { Authorization: `Basic ${KEY_B64}`, 'Content-Type': 'application/json' } });
    expect(init!.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(init!.body as string)).toEqual({
      external_id: 'PAY-abc',
      amount: 500000,
      description: 'Order ORD-20261110-ABCDEF12',
      payer_email: 'client@uji.test',
      currency: 'IDR',
      // 9 menit 30,5 detik dibulatkan ke atas.
      invoice_duration: 571,
    });
    expect(invoice).toMatchObject({
      invoiceId: 'inv-1',
      invoiceUrl: 'https://checkout-staging.xendit.co/web/inv-1',
      expiresAt: new Date('2026-11-10T03:09:31.000Z'),
    });
  });

  it('expireInvoice memanggil endpoint expire! dengan autentikasi yang sama', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, { id: 'inv-1', status: 'EXPIRED' }));
    await xenditGateway.expireInvoice('inv-1');
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.xendit.co/invoices/inv-1/expire!');
    expect(init).toMatchObject({ method: 'POST', headers: { Authorization: `Basic ${KEY_B64}` } });
    expect(init!.body).toBeUndefined();
  });

  it('timeout memakai PAYMENT_GATEWAY_TIMEOUT_MS dan menjadi PAYMENT_GATEWAY_ERROR (H96)', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));
    const error = await expectSafeGatewayError(xenditGateway.createInvoice(input()));
    expect(timeout).toHaveBeenCalledWith(PAYMENT_GATEWAY_TIMEOUT_MS);
    expect(error.context).toMatchObject({ gateway_operation: 'create_invoice', gateway_timeout: true });
  });

  it('galat jaringan yang pesannya memuat kunci tidak ikut diteruskan', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError(`fetch failed for Basic ${KEY_B64} ${KEY}`));
    const error = await expectSafeGatewayError(xenditGateway.expireInvoice('inv-1'));
    expect(error.context).toMatchObject({ gateway_operation: 'expire_invoice', gateway_timeout: false });
  });

  it.each([400, 401, 500])('respons %i menjadi PAYMENT_GATEWAY_ERROR tanpa isi balasan mentah', async (status) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json(status, { error_code: 'API_VALIDATION_ERROR', message: `key ${KEY} payer client@uji.test` }),
    );
    const error = await expectSafeGatewayError(xenditGateway.createInvoice(input()));
    expect(error.context).toEqual({ gateway_operation: 'create_invoice', gateway_status: status, gateway_error_code: 'API_VALIDATION_ERROR' });
    expect(JSON.stringify(error.context)).not.toContain('client@uji.test');
  });

  it('balasan 200 yang bentuknya tidak dikenali menjadi PAYMENT_GATEWAY_ERROR', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, { id: 'inv-1' }));
    await expectSafeGatewayError(xenditGateway.createInvoice(input()));
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<html>bukan json</html>', { status: 200 }));
    await expectSafeGatewayError(xenditGateway.createInvoice(input()));
  });
});

// ---------------------------------------------------------------------------
// Sesi 8a: refund dan payout
// ---------------------------------------------------------------------------

const refundInput = {
  referenceId: '6a3f2c1e-0000-4000-8000-000000000001',
  invoiceId: 'inv-1',
  amount: 150000,
  reason: 'CANCELLATION' as const,
};

const payoutInput = {
  withdrawalId: '6a3f2c1e-0000-4000-8000-000000000002',
  channelCode: 'ID_BCA',
  accountNumber: '1234567890',
  accountHolderName: 'Penyedia Uji',
  amount: 95000,
  description: 'Withdrawal Jasana',
};

describe('xenditGateway refund dan payout (sesi 8a)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('refund: POST /refunds dengan invoice_id, reference_id, dan idempotency-key id referensi kita', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json(200, { id: 'rfd-1', invoice_id: 'inv-1', reference_id: refundInput.referenceId, status: 'PENDING', amount: 150000 }),
    );

    const result = await xenditGateway.refund(refundInput);

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.xendit.co/refunds');
    expect(init).toMatchObject({
      method: 'POST',
      headers: { Authorization: `Basic ${KEY_B64}`, 'Content-Type': 'application/json', 'idempotency-key': refundInput.referenceId },
    });
    expect(init!.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(init!.body as string)).toEqual({
      invoice_id: 'inv-1',
      reference_id: refundInput.referenceId,
      amount: 150000,
      currency: 'IDR',
      reason: 'CANCELLATION',
    });
    expect(result).toMatchObject({ refundId: 'rfd-1', status: 'PENDING' });
  });

  it('payout: POST /v2/payouts dengan Idempotency-key id withdrawal dan channel_properties (D134)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json(200, { id: 'disb-1', reference_id: payoutInput.withdrawalId, status: 'ACCEPTED', amount: 95000 }),
    );

    const result = await xenditGateway.payout(payoutInput);

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.xendit.co/v2/payouts');
    expect(init).toMatchObject({
      method: 'POST',
      headers: { Authorization: `Basic ${KEY_B64}`, 'Content-Type': 'application/json', 'Idempotency-key': payoutInput.withdrawalId },
    });
    expect(init!.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(init!.body as string)).toEqual({
      reference_id: payoutInput.withdrawalId,
      channel_code: 'ID_BCA',
      channel_properties: { account_holder_name: 'Penyedia Uji', account_number: '1234567890' },
      amount: 95000,
      currency: 'IDR',
      description: 'Withdrawal Jasana',
    });
    expect(result).toMatchObject({ payoutId: 'disb-1', status: 'ACCEPTED' });
  });

  it.each([
    ['refund', () => xenditGateway.refund(refundInput), 400, 'REFUND_NOT_SUPPORTED'],
    ['refund', () => xenditGateway.refund(refundInput), 403, 'PARTIAL_REFUND_NOT_SUPPORTED'],
    ['payout', () => xenditGateway.payout(payoutInput), 409, 'DUPLICATE_ERROR'],
  ] as const)('%s respons %i %s jadi PAYMENT_GATEWAY_ERROR tanpa isi balasan mentah', async (operation, call, status, code) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json(status, { error_code: code, message: `key ${KEY} rekening 1234567890 a.n. Penyedia Uji` }),
    );
    const error = await expectSafeGatewayError(call());
    expect(error.context).toEqual({ gateway_operation: operation, gateway_status: status, gateway_error_code: code });
    expect(`${error.message} ${JSON.stringify(error.context)}`).not.toMatch(/1234567890|Penyedia Uji/);
  });

  it.each([
    ['refund', () => xenditGateway.refund(refundInput)],
    ['payout', () => xenditGateway.payout(payoutInput)],
  ] as const)('%s: timeout memakai PAYMENT_GATEWAY_TIMEOUT_MS (H96)', async (operation, call) => {
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));
    const error = await expectSafeGatewayError(call());
    expect(timeout).toHaveBeenCalledWith(PAYMENT_GATEWAY_TIMEOUT_MS);
    expect(error.context).toMatchObject({ gateway_operation: operation, gateway_timeout: true });
  });

  it.each([
    ['refund tanpa status', () => xenditGateway.refund(refundInput), { id: 'rfd-1' }],
    ['refund tanpa id', () => xenditGateway.refund(refundInput), { status: 'PENDING' }],
    ['payout tanpa status', () => xenditGateway.payout(payoutInput), { id: 'disb-1' }],
    ['payout tanpa id', () => xenditGateway.payout(payoutInput), { status: 'ACCEPTED' }],
  ] as const)('balasan 200 %s ditolak', async (_label, call, body) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, body));
    await expectSafeGatewayError(call());
  });
});

describe('fakeGateway refund dan payout (sesi 8a)', () => {
  it('deterministik dan tanpa jaringan', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect(await fakeGateway.refund(refundInput)).toMatchObject({ refundId: `fake-ref-${refundInput.referenceId}`, status: 'PENDING' });
    expect(await fakeGateway.refund(refundInput)).toEqual(await fakeGateway.refund(refundInput));
    expect(await fakeGateway.payout(payoutInput)).toMatchObject({ payoutId: `fake-payout-${payoutInput.withdrawalId}`, status: 'ACCEPTED' });
    expect(await fakeGateway.payout(payoutInput)).toEqual(await fakeGateway.payout(payoutInput));
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe('xenditGateway getPayout dan getRefund (sesi 8c, H106)', () => {
  afterEach(() => vi.restoreAllMocks());

  const ref = '41c597a1-7799-4497-b381-8d2a05b3104b';
  const item = (id: string, reference_id: string, extra: Record<string, unknown> = {}) => ({ id, status: 'SUCCEEDED', reference_id, ...extra });

  it('getPayout lewat id: GET /v2/payouts/{id} tanpa body, kunci yang sama', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, item('disb-1', ref, { failure_code: null, amount: 93500 })));
    expect(await xenditGateway.getPayout({ payoutId: 'disb-1', referenceId: ref })).toEqual({ id: 'disb-1', status: 'SUCCEEDED', reference_id: ref, failure_code: null });
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.xendit.co/v2/payouts/disb-1');
    expect(init).toMatchObject({ method: 'GET', headers: { Authorization: `Basic ${KEY_B64}` } });
    expect(init!.body).toBeUndefined();
  });

  it('getPayout tanpa id: GET /v2/payouts?reference_id=, memilih yang reference_id-nya cocok, kosong jadi null', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json(200, { data: [item('disb-lain', 'ref-lain'), item('disb-2', ref, { status: 'FAILED', failure_code: 'INVALID_DESTINATION' })], has_more: false }))
      .mockResolvedValueOnce(json(200, [item('disb-3', ref)]))
      .mockResolvedValueOnce(json(200, { data: [] }));
    expect(await xenditGateway.getPayout({ payoutId: null, referenceId: ref })).toEqual({ id: 'disb-2', status: 'FAILED', reference_id: ref, failure_code: 'INVALID_DESTINATION' });
    expect(fetchSpy.mock.calls[0]![0]).toBe(`https://api.xendit.co/v2/payouts?reference_id=${ref}`);
    // Array telanjang ikut diterima, bentuk daftar baru dipastikan di sandbox.
    expect((await xenditGateway.getPayout({ payoutId: null, referenceId: ref }))?.id).toBe('disb-3');
    expect(await xenditGateway.getPayout({ payoutId: null, referenceId: ref })).toBeNull();
  });

  it('getRefund lewat id: GET /refunds/{id}; 404 jadi null, 5xx tetap galat', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json(200, item('rfd-1', ref)))
      .mockResolvedValueOnce(json(404, { error_code: 'DATA_NOT_FOUND' }))
      .mockResolvedValueOnce(json(503, { error_code: 'SERVER_ERROR' }));
    expect(await xenditGateway.getRefund({ refundId: 'rfd-1', invoiceId: 'inv-1', referenceId: ref })).toMatchObject({ id: 'rfd-1', reference_id: ref });
    expect(fetchSpy.mock.calls[0]![0]).toBe('https://api.xendit.co/refunds/rfd-1');
    expect(fetchSpy.mock.calls[0]![1]).toMatchObject({ method: 'GET' });
    expect(await xenditGateway.getRefund({ refundId: 'rfd-1', invoiceId: 'inv-1', referenceId: ref })).toBeNull();
    const error = await expectSafeGatewayError(xenditGateway.getRefund({ refundId: 'rfd-1', invoiceId: 'inv-1', referenceId: ref }));
    expect(error.context).toMatchObject({ gateway_operation: 'get_refund', gateway_status: 503 });
  });

  it('getRefund tanpa id: GET /refunds?invoice_id=, disaring reference_id di sisi kita', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json(200, { data: [{ id: 'rfd-dashboard', status: 'SUCCEEDED' }, item('rfd-2', ref)], has_more: false }))
      .mockResolvedValueOnce(json(200, { data: [item('rfd-3', 'ref-lain')] }));
    expect((await xenditGateway.getRefund({ refundId: null, invoiceId: 'inv-9', referenceId: ref }))?.id).toBe('rfd-2');
    expect(fetchSpy.mock.calls[0]![0]).toBe('https://api.xendit.co/refunds?invoice_id=inv-9');
    expect(await xenditGateway.getRefund({ refundId: null, invoiceId: 'inv-9', referenceId: ref })).toBeNull();
  });

  it('record tanpa reference_id menjadi PAYMENT_GATEWAY_ERROR', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, { id: 'rfd-1', status: 'SUCCEEDED' }));
    await expectSafeGatewayError(xenditGateway.getRefund({ refundId: 'rfd-1', invoiceId: 'inv-1', referenceId: ref }));
  });
});

describe('fakeGateway getPayout dan getRefund (sesi 8c, usulan D144)', () => {
  it('selalu SUCCEEDED dengan id deterministik, tanpa jaringan', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect(await fakeGateway.getPayout({ payoutId: null, referenceId: 'w-1' })).toEqual({ id: 'fake-payout-w-1', status: 'SUCCEEDED', reference_id: 'w-1', failure_code: null });
    expect(await fakeGateway.getRefund({ refundId: 'rfd-x', invoiceId: 'inv', referenceId: 'r-1' })).toMatchObject({ id: 'rfd-x', status: 'SUCCEEDED', reference_id: 'r-1' });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
