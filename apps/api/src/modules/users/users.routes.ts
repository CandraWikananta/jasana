/**
 * Rute `/users/me` (PRD 4.3, bagian User dan alamat).
 *
 * Seluruhnya butuh login, TIDAK ADA yang butuh email terverifikasi (D62).
 * Lihat alasan lengkapnya di middlewares/auth.ts.
 */

import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { requireAuth } from '../../middlewares/auth';
import { limitPerAccount, RATE_LIMITS } from '../../middlewares/rateLimit';
import * as controller from './users.controller';
import {
  addressParamsSchema,
  changeEmailSchema,
  changePasswordSchema,
  createAddressSchema,
  updateAddressSchema,
  updateMeSchema,
} from './users.schema';

export function createUsersRouter(): Router {
  const router = Router();
  router.use(requireAuth);

  router.patch('/me', validate({ body: updateMeSchema }), controller.updateMe);
  router.post(
    '/me/change-password',
    validate({ body: changePasswordSchema }),
    controller.changePassword,
  );

  // Rate limit dipasang SEBELUM validasi, jadi percobaan dengan password
  // salah pun ikut terhitung. Endpoint ini bisa dipakai membanjiri inbox
  // orang lain sekaligus menebak password.
  router.patch(
    '/me/email',
    limitPerAccount(RATE_LIMITS.emailChange),
    validate({ body: changeEmailSchema }),
    controller.requestEmailChange,
  );
  router.delete('/me/email-change', controller.cancelEmailChange);

  router.get('/me/addresses', controller.listAddresses);
  router.post('/me/addresses', validate({ body: createAddressSchema }), controller.createAddress);
  router.patch(
    '/me/addresses/:id',
    validate({ params: addressParamsSchema, body: updateAddressSchema }),
    controller.updateAddress,
  );
  router.delete(
    '/me/addresses/:id',
    validate({ params: addressParamsSchema }),
    controller.deleteAddress,
  );

  return router;
}
