/**
 * Validasi Zod untuk body, query, dan param (konvensi kode CLAUDE.md).
 *
 * Hasil parse DITULIS BALIK ke `req`, jadi controller menerima nilai yang
 * sudah bertipe dan sudah dikoersi. Kalau hasil parse dibuang dan
 * controller tetap membaca `req.body` mentah, validasi cuma jadi pemeriksaan
 * dan angka tetap datang sebagai string.
 *
 * Kegagalan diteruskan ke errorHandler sebagai ZodError, yang jadi
 * 422 VALIDATION_ERROR beserta daftar `details`.
 */

import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

export interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, _res, next) => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}
