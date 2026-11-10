/**
 * Sesi 7a: adapter Xendit (D101) dan timeout gateway (H96). Tanpa jaringan:
 * `fetch` di-spy, sehingga yang diuji bentuk permintaan dan pemetaan galat.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '../src/config/env';
import { PAYMENT_GATEWAY_TIMEOUT_MS } from '../src/config/constants';
import { AppError } from '../src/lib/errors';
import { xenditGateway } from '../src/lib/payment-gateway';

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
