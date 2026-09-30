/**
 * Perakitan aplikasi Express.
 *
 * Dipisah dari `server.ts` supaya uji integrasi bisa mengimpor `createApp()`
 * dan memanggil endpoint lewat Supertest tanpa membuka port.
 *
 * URUTAN MIDDLEWARE DI SINI PENTING, bukan selera:
 *   1. helmet dan CORS lebih dulu, supaya permintaan yang ditolak tidak
 *      sampai diparse
 *   2. logger sebelum parser, supaya body yang rusak tetap tercatat
 *   3. parser JSON
 *   4. rute
 *   5. notFoundHandler
 *   6. errorHandler PALING AKHIR, karena Express hanya mengenali error
 *      handler yang terdaftar setelah seluruh rute
 */

import express, { type Express } from 'express';
import cors, { type CorsOptions } from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { API_PREFIX, JSON_BODY_LIMIT } from './config/constants';
import { httpLogger } from './lib/logger';
import {
  CORS_REJECTION_MESSAGE,
  errorHandler,
  notFoundHandler,
} from './middlewares/errorHandler';
import { limitPerIp, RATE_LIMITS } from './middlewares/rateLimit';
import { healthRouter } from './modules/health/health.routes';
import { createAuthRouter } from './modules/auth/auth.routes';
import { createUsersRouter } from './modules/users/users.routes';

function corsOptions(): CorsOptions {
  return {
    origin: (origin, callback) => {
      // Permintaan tanpa Origin bukan permintaan lintas asal: curl, health
      // probe, dan webhook Xendit semuanya masuk kategori ini.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (env.CORS_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }

      // Pesannya dikenali errorHandler dan dibalas 403 CORS_ORIGIN_NOT_ALLOWED.
      callback(new Error(CORS_REJECTION_MESSAGE));
    },
    credentials: true,
    exposedHeaders: ['X-Request-Id'],
  };
}

export function createApp(): Express {
  const app = express();

  // Supabase dan platform hosting menaruh API di belakang proxy. Tanpa ini
  // `req.ip` berisi IP proxy, dan rate limiting per IP di Fase 9 salah sasaran.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(cors(corsOptions()));
  app.use(httpLogger);
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: false, limit: JSON_BODY_LIMIT }));

  // Health check dipasang di akar untuk probe infrastruktur sekaligus di
  // bawah /api/v1 mengikuti daftar endpoint PRD Bagian 4.3.
  app.use('/', healthRouter);
  app.use(API_PREFIX, healthRouter);

  // Pengaman umum 100 per menit per IP (PRD 5.5). Dipasang SETELAH health
  // check, supaya probe pemantau tidak menghabiskan jatah pengguna sungguhan.
  app.use(API_PREFIX, limitPerIp(RATE_LIMITS.global));

  app.use(`${API_PREFIX}/auth`, createAuthRouter());
  app.use(`${API_PREFIX}/users`, createUsersRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
