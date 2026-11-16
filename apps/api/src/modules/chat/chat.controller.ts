/**
 * Controller chatbot. Tidak menyentuh Prisma. Identitas disusun di sini dari
 * `req.user` (JWT) atau header `X-Guest-Token`, lalu diteruskan ke service.
 */

import type { Request } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { sendCreated, sendOk } from '../../lib/envelope';
import { Errors } from '../../lib/errors';
import type { Page } from '../../lib/pagination';
import { currentUser } from '../../middlewares/auth';
import * as chatService from './chat.service';
import * as messageService from './chat-message.service';

const GUEST_TOKEN = /^[0-9a-f]{64}$/;

function guestToken(req: Request): string {
  const token = req.get('x-guest-token');
  if (!token || !GUEST_TOKEN.test(token)) throw Errors.unauthorized('Header X-Guest-Token tidak ada atau tidak valid');
  return token;
}

/** JWT menang kalau keduanya ada. Tanpa keduanya, atau token bukan 64 hex: 401 (usulan D162). */
function identity(req: Request): chatService.ChatIdentity {
  if (req.user) return { userId: req.user.id };
  return { guestToken: guestToken(req) };
}

/** Klaim butuh keduanya: JWT dari requireAuth dan token tamu (usulan D170). */
export const claimSession = asyncHandler(async (req, res) => {
  sendOk(res, await chatService.claimSession(req.params.id!, currentUser(req).id, guestToken(req)));
});

export const createGuestSession = asyncHandler(async (_req, res) => {
  sendCreated(res, await chatService.createGuestSession());
});

export const createUserSession = asyncHandler(async (req, res) => {
  sendCreated(res, await chatService.createUserSession(currentUser(req).id));
});

export const listUserSessions = asyncHandler(async (req, res) => {
  const { items, meta } = await chatService.listUserSessions(currentUser(req).id, req.query as unknown as Page);
  sendOk(res, items, meta);
});

export const listMessages = asyncHandler(async (req, res) => {
  const { items, meta } = await chatService.listMessages(req.params.id!, identity(req), req.query as unknown as Page);
  sendOk(res, items, meta);
});

export const sendMessage = asyncHandler(async (req, res) => {
  sendCreated(res, await messageService.sendMessage(req.params.id!, identity(req), req.body));
});

export const endSession = asyncHandler(async (req, res) => {
  sendOk(res, await chatService.endSession(req.params.id!, identity(req)));
});
