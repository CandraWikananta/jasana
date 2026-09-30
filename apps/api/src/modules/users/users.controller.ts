/**
 * Controller `/users/me` dan alamat. Tidak menyentuh Prisma.
 */

import { asyncHandler } from '../../lib/async-handler';
import { sendCreated, sendOk } from '../../lib/envelope';
import { currentUser } from '../../middlewares/auth';
import * as usersService from './users.service';
import * as addressesService from './addresses.service';

export const updateMe = asyncHandler(async (req, res) => {
  sendOk(res, await usersService.updateMe(currentUser(req).id, req.body));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;
  sendOk(res, await usersService.changePassword(currentUser(req).id, current_password, new_password));
});

export const requestEmailChange = asyncHandler(async (req, res) => {
  const { current_password, new_email } = req.body;
  sendOk(res, await usersService.requestEmailChange(currentUser(req).id, current_password, new_email));
});

export const cancelEmailChange = asyncHandler(async (req, res) => {
  sendOk(res, await usersService.cancelEmailChange(currentUser(req).id));
});

/** Dipasang di `/auth/confirm-email-change` (PRD 4.3), publik. */
export const confirmEmailChange = asyncHandler(async (req, res) => {
  sendOk(res, await usersService.confirmEmailChange(req.body.token));
});

export const listAddresses = asyncHandler(async (req, res) => {
  sendOk(res, await addressesService.listAddresses(currentUser(req).id));
});

export const createAddress = asyncHandler(async (req, res) => {
  sendCreated(res, await addressesService.createAddress(currentUser(req).id, req.body));
});

export const updateAddress = asyncHandler(async (req, res) => {
  sendOk(res, await addressesService.updateAddress(currentUser(req).id, req.params.id!, req.body));
});

export const deleteAddress = asyncHandler(async (req, res) => {
  sendOk(res, await addressesService.deleteAddress(currentUser(req).id, req.params.id!));
});
