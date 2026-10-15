/**
 * Lapis peran dari middleware berlapis PRD 5.2. Seluruhnya wajib dipasang
 * SETELAH requireAuth.
 *
 *   requireProvider   provider_profiles berstatus VERIFIED       403 FORBIDDEN_ACTOR
 *   requireWorker     provider_workers berstatus ACTIVE          403 FORBIDDEN_ACTOR
 *   requireAdmin      users.role = 'ADMIN'                       403 FORBIDDEN_ACTOR
 *
 * requireOrderParticipant dan requireAssignedWorker menyusul di Fase 6.
 */

import type { Request, RequestHandler } from 'express';
import { Errors } from '../lib/errors';
import {
  assertAdmin,
  resolveProvider,
  resolveWorker,
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
