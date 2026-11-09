/**
 * Lapis peran dari middleware berlapis PRD 5.2. Seluruhnya wajib dipasang
 * SETELAH requireAuth.
 *
 *   requireProvider   provider_profiles berstatus VERIFIED       403 FORBIDDEN_ACTOR
 *   requireWorker     provider_workers berstatus ACTIVE          403 FORBIDDEN_ACTOR
 *   requireAdmin      users.role = 'ADMIN'                       403 FORBIDDEN_ACTOR
 *
 *   requireOrderParticipant  client, pemilik, atau penanggung jawab order :id  403 FORBIDDEN_ACTOR
 *   requireAssignedWorker    PERSIS penanggung jawab order :id            403 NOT_ASSIGNED_WORKER
 */

import type { Request, RequestHandler } from 'express';
import { AppError, Errors } from '../lib/errors';
import {
  assertAdmin,
  resolveOrderAccess,
  resolveProvider,
  resolveWorker,
  type OrderAccess,
  type ProviderContext,
  type WorkerContext,
} from '../modules/access/access.service';

export const requireProvider: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    next(Errors.unauthorized());
    return;
  }
  resolveProvider(req.user.id).then((provider) => {
    req.provider = provider;
    next();
  }, next);
};

export const requireWorker: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    next(Errors.unauthorized());
    return;
  }
  resolveWorker(req.user.id).then((worker) => {
    req.worker = worker;
    next();
  }, next);
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    next(Errors.unauthorized());
    return;
  }
  assertAdmin(req.user.id).then(() => next(), next);
};

/** Konteks provider untuk controller di belakang requireProvider. */
export function currentProvider(req: Request): ProviderContext {
  if (!req.provider) throw Errors.unauthorized();
  return req.provider;
}

/** Konteks pekerja untuk controller di belakang requireWorker. */
export function currentWorker(req: Request): WorkerContext {
  if (!req.worker) throw Errors.unauthorized();
  return req.worker;
}

/**
 * Wajib setelah requireAuth dan validasi param `:id`. Pendamping tidak lolos
 * (PRD 5.2). Peran mana yang boleh bertindak diputuskan endpoint, bukan di sini.
 */
export function requireOrderParticipant(options: { allowAdmin?: boolean } = {}): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(Errors.unauthorized());
      return;
    }
    resolveOrderAccess(req.user.id, req.params.id!, options.allowAdmin ?? false).then((access) => {
      req.orderAccess = access;
      next();
    }, next);
  };
}

/**
 * PRD 5.2, lima transisi pelaksanaan. Wajib setelah requireOrderParticipant:
 * peran WORKER di sana hanya untuk penanggung jawab ACTIVE, bukan rekan
 * seusaha (yang sudah tertahan sebagai bukan peserta) dan bukan pendamping.
 */
export const requireAssignedWorker: RequestHandler = (req, _res, next) => {
  next(
    req.orderAccess?.roles.has('WORKER')
      ? undefined
      : new AppError('NOT_ASSIGNED_WORKER', 'Hanya penanggung jawab order ini yang boleh melakukan aksi ini'),
  );
};

/** Konteks peserta untuk controller di belakang requireOrderParticipant. */
export function currentOrderAccess(req: Request): OrderAccess {
  if (!req.orderAccess) throw Errors.unauthorized();
  return req.orderAccess;
}
