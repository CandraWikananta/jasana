/**
 * Controller katalog, publik dan admin. Tidak menyentuh Prisma.
 */

import { asyncHandler } from '../../lib/async-handler';
import { sendCreated, sendOk } from '../../lib/envelope';
import * as service from './catalog.service';

// Publik

export const listCategories = asyncHandler(async (_req, res) => {
  sendOk(res, await service.listCategories());
});

export const listSubcategories = asyncHandler(async (req, res) => {
  sendOk(res, await service.listSubcategories(req.params.id!));
});

export const listAttributes = asyncHandler(async (req, res) => {
  sendOk(res, await service.listAttributes(req.params.id!));
});

// Admin

export const createCategory = asyncHandler(async (req, res) => {
  sendCreated(res, await service.createCategory(req.body));
});

export const updateCategory = asyncHandler(async (req, res) => {
  sendOk(res, await service.updateCategory(req.params.id!, req.body));
});

export const deleteCategory = asyncHandler(async (req, res) => {
  sendOk(res, await service.deleteCategory(req.params.id!));
});

export const createSubcategory = asyncHandler(async (req, res) => {
  sendCreated(res, await service.createSubcategory(req.body));
});

export const updateSubcategory = asyncHandler(async (req, res) => {
  sendOk(res, await service.updateSubcategory(req.params.id!, req.body));
});

export const deleteSubcategory = asyncHandler(async (req, res) => {
  sendOk(res, await service.deleteSubcategory(req.params.id!));
});

export const createAttribute = asyncHandler(async (req, res) => {
  sendCreated(res, await service.createAttribute(req.params.id!, req.body));
});

export const updateAttribute = asyncHandler(async (req, res) => {
  sendOk(res, await service.updateAttribute(req.params.id!, req.params.attrId!, req.body));
});

export const deleteAttribute = asyncHandler(async (req, res) => {
  sendOk(res, await service.deleteAttribute(req.params.id!, req.params.attrId!));
});
