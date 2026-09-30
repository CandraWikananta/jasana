/**
 * Pembungkus handler async untuk Express 4.
 *
 * Express 4 tidak menangkap promise yang ditolak. Tanpa pembungkus ini,
 * galat dari service yang di-await di controller tidak sampai ke
 * errorHandler dan permintaan menggantung sampai timeout.
 */

import type { NextFunction, Request, RequestHandler, Response } from 'express';

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
