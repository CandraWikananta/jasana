/**
 * Rute listing (PRD 4.3, Listing, harga opsi, dan FAQ). Tiga router:
 *
 *   PR  /providers/me/listings   requireAuth + requireProvider. Dipasang di
 *                                app.ts SEBELUM router /providers
 *   P   /listings/:id[/faqs]     publik, hanya listing yang tayang.
 *                                `GET /listings` (pencarian) menyusul Fase 5
 *   C   /uploads/signed-url      hanya untuk foto listing (D80)
 */

import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { requireProvider } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import * as controller from './listings.controller';
import {
  createListingSchema,
  faqsSchema,
  listingParamsSchema,
  listingWorkersSchema,
  listMyListingsQuerySchema,
  optionPricesSchema,
  photoParamsSchema,
  photoSchema,
  updateListingSchema,
} from './listings.schema';

export function createProviderListingsRouter(): Router {
  const router = Router();
  router.use(requireAuth, requireProvider);

  const byId = { params: listingParamsSchema };

  router.post('/', validate({ body: createListingSchema }), controller.create);
  router.get('/', validate({ query: listMyListingsQuerySchema }), controller.listMine);
  router.get('/:id', validate(byId), controller.getMine);
  router.patch('/:id', validate({ ...byId, body: updateListingSchema }), controller.update);
  router.delete('/:id', validate(byId), controller.remove);
  router.put('/:id/option-prices', validate({ ...byId, body: optionPricesSchema }), controller.setOptionPrices);
  router.put('/:id/workers', validate({ ...byId, body: listingWorkersSchema }), controller.setWorkers);
  router.post('/:id/photos', validate({ ...byId, body: photoSchema }), controller.addPhoto);
  router.delete('/:id/photos/:photoId', validate({ params: photoParamsSchema }), controller.deletePhoto);
  router.put('/:id/faqs', validate({ ...byId, body: faqsSchema }), controller.setFaqs);

  return router;
}

export function createPublicListingsRouter(): Router {
  const router = Router();
  router.get('/:id', validate({ params: listingParamsSchema }), controller.getPublic);
  router.get('/:id/faqs', validate({ params: listingParamsSchema }), controller.getPublicFaqs);
  return router;
}

export function createUploadsRouter(): Router {
  const router = Router();
  router.post('/signed-url', requireAuth, controller.createUploadUrl);
  return router;
}
