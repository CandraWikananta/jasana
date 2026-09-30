/**
 * Logger Pino, JSON terstruktur, dengan `request_id` per permintaan.
 *
 * Kenapa terstruktur dan bukan `console.log`: log penelitian ini dipakai
 * untuk menelusuri satu permintaan yang gagal dari masuk sampai keluar.
 * Tanpa `request_id` yang sama di setiap baris, dua permintaan yang
 * bersamaan tidak bisa dipisahkan.
 */

import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import pino, { type Logger } from 'pino';
import pinoHttp from 'pino-http';
import { env } from '../config/env';
import { REQUEST_ID_HEADER } from '../config/constants';

/**
 * Field yang tidak boleh masuk log dalam bentuk aslinya.
 *
 * Bukan sekadar kehati-hatian: token akses dan password yang tercatat di log
 * artinya kebocoran log sama nilainya dengan kebocoran basis data.
 */
const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-callback-token"]',
  'req.body.password',
  'req.body.new_password',
  'req.body.current_password',
  'req.body.token',
  'req.body.refresh_token',
  'res.headers["set-cookie"]',
];

export const logger: Logger = pino({
  level: env.isProduction ? 'info' : env.isTest ? 'silent' : 'debug',
  base: { service: 'jasana-api', env: env.NODE_ENV },
  redact: { paths: REDACTED_PATHS, censor: '[REDACTED]' },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // pino-pretty hanya di development. Di produksi log tetap JSON satu baris
  // supaya bisa diproses mesin.
  ...(env.isDevelopment
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
        },
      }
    : {}),
});

/**
 * Middleware yang menempelkan `request_id` ke setiap permintaan sekaligus
 * membalikkannya lewat header respons, supaya client bisa menyebutkan id itu
 * saat melaporkan masalah.
 *
 * Kalau client sudah mengirim `X-Request-Id`, nilainya dipakai ulang supaya
 * satu id berlaku lintas layanan.
 */
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req: IncomingMessage, res: ServerResponse) => {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const id = (Array.isArray(incoming) ? incoming[0] : incoming) ?? randomUUID();
    res.setHeader(REQUEST_ID_HEADER, id);
    return id;
  },
  // Kunci log dibuat `request_id` mengikuti penamaan snake_case di PRD,
  // bukan `reqId` bawaan pino-http.
  customAttributeKeys: { reqId: 'request_id' },
  customLogLevel: (_req, res, err) => {
    if (err) return 'error';
    if (res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} ${res.statusCode} ${err.message}`,
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      // IP dicatat karena rate limiting dan audit webhook bergantung padanya.
      remote_address: req.remoteAddress,
    }),
    res: (res) => ({ status_code: res.statusCode }),
  },
  // `GET /health` dipanggil pemantau tiap beberapa detik. Kalau ikut dicatat,
  // log penelitian tenggelam oleh baris yang tidak ada nilainya.
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url === '/api/v1/health',
  },
});
