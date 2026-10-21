/**
 * Controller listing (Fase 4). Tidak menyentuh Prisma.
 */

import type { Request } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { sendCreated, sendOk } from '../../lib/envelope';
import { currentUser } from '../../middlewares/auth';
import { currentProvider } from '../../middlewares/rbac';
import type { ListMyListingsQuery } from './listings.schema';
import * as service from './listings.service';

function paramId(req: Request): string {
  return req.params.id!;
}

export const create = asyncHandler(async (req, res) => {
  sendCreated(res, await service.createListing(currentProvider(req), req.body));
});

export const listMine = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listMyListings(currentProvider(req), req.query as unknown as ListMyListingsQuery);
  sendOk(res, items, meta);
});

export const getMine = asyncHandler(async (req, res) => {
  sendOk(res, await service.getMyListing(currentProvider(req), paramId(req)));
});

export const update = asyncHandler(async (req, res) => {
  sendOk(res, await service.updateListing(currentProvider(req), paramId(req), req.body));
});

export const remove = asyncHandler(async (req, res) => {
  sendOk(res, await service.deleteListing(currentProvider(req), paramId(req)));
});

export const setOptionPrices = asyncHandler(async (req, res) => {
  sendOk(res, await service.setOptionPrices(currentProvider(req), paramId(req), req.body));
});

export const setWorkers = asyncHandler(async (req, res) => {
  sendOk(res, await service.setListingWorkers(currentProvider(req), paramId(req), req.body.worker_ids));
});

export const addPhoto = asyncHandler(async (req, res) => {
  sendCreated(res, await service.addPhoto(currentProvider(req), paramId(req), req.body));
});

export const deletePhoto = asyncHandler(async (req, res) => {
  sendOk(res, await service.deletePhoto(currentProvider(req), paramId(req), req.params.photoId!));
});

export const setFaqs = asyncHandler(async (req, res) => {
  sendOk(res, await service.setFaqs(currentProvider(req), paramId(req), req.body));
});

export const getPublic = asyncHandler(async (req, res) => {
  sendOk(res, await service.getPublicListing(paramId(req)));
});

export const getPublicFaqs = asyncHandler(async (req, res) => {
  sendOk(res, await service.getPublicFaqs(paramId(req)));
});

export const createUploadUrl = asyncHandler(async (req, res) => {
  sendCreated(res, await service.createPhotoUploadUrl(currentUser(req).id));
});
