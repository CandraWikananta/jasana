/**
 * Controller auth. Tidak menyentuh Prisma: menerjemahkan HTTP ke panggilan
 * service, lalu membungkus hasilnya dalam envelope.
 */

import type { Request } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { sendCreated, sendOk } from '../../lib/envelope';
import { currentUser } from '../../middlewares/auth';
import * as authService from './auth.service';
import type { SessionMeta } from './session.service';

function sessionMeta(req: Request): SessionMeta {
  return { userAgent: req.get('user-agent'), ipAddress: req.ip };
}

export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  sendCreated(res, {
    user,
    message: 'Pendaftaran berhasil. Tautan verifikasi dikirim ke email Anda',
  });
});

export const login = asyncHandler(async (req, res) => {
  sendOk(res, await authService.login(req.body, sessionMeta(req)));
});

export const refresh = asyncHandler(async (req, res) => {
  sendOk(res, await authService.refresh(req.body.refresh_token, sessionMeta(req)));
});

export const logout = asyncHandler(async (req, res) => {
  sendOk(res, await authService.logout(currentUser(req).id, req.body.refresh_token));
});

export const logoutAll = asyncHandler(async (req, res) => {
  sendOk(res, await authService.logoutAll(currentUser(req).id));
});

export const sessions = asyncHandler(async (req, res) => {
  sendOk(res, await authService.sessions(currentUser(req).id));
});

export const me = asyncHandler(async (req, res) => {
  sendOk(res, await authService.me(currentUser(req).id));
});

export const verifyEmail = asyncHandler(async (req, res) => {
  sendOk(res, await authService.verifyEmail(req.body.token));
});

export const resendVerification = asyncHandler(async (req, res) => {
  sendOk(res, await authService.resendVerification(currentUser(req).id));
});

/** Satu bentuk balasan untuk email terdaftar maupun tidak (PRD 5.4). */
export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  sendOk(res, {
    message: 'Kalau email tersebut terdaftar, tautan reset password sudah dikirim',
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  sendOk(res, await authService.resetPassword(req.body.token, req.body.new_password));
});
