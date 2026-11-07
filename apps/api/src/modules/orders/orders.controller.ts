/**
 * Controller order (Fase 6). Tidak menyentuh Prisma.
 */

import { asyncHandler } from '../../lib/async-handler';
import { sendCreated, sendOk } from '../../lib/envelope';
import { currentUser } from '../../middlewares/auth';
import { currentOrderAccess } from '../../middlewares/rbac';
import * as actions from './order-actions.service';
import { simulatePayment as simulate } from './order-payment.service';
import type { ListOrdersQuery } from './orders.schema';
import * as service from './orders.service';

export const create = asyncHandler(async (req, res) => {
  sendCreated(res, await service.createOrder(currentUser(req).id, req.body));
});

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listOrders(currentUser(req).id, req.query as unknown as ListOrdersQuery);
  sendOk(res, items, meta);
});

export const get = asyncHandler(async (req, res) => {
  sendOk(res, await service.getOrder(currentOrderAccess(req).orderId));
});

export const history = asyncHandler(async (req, res) => {
  sendOk(res, await service.getOrderHistory(currentOrderAccess(req).orderId));
});

export const accept = asyncHandler(async (req, res) => {
  const access = currentOrderAccess(req);
  sendOk(res, await actions.acceptOrder(access, access.orderId, req.body));
});

export const reject = asyncHandler(async (req, res) => {
  const access = currentOrderAccess(req);
  sendOk(res, await actions.rejectOrder(access, access.orderId, req.body));
});

export const cancel = asyncHandler(async (req, res) => {
  const access = currentOrderAccess(req);
  sendOk(res, await actions.cancelOrder(access, access.orderId, req.body));
});

export const assignment = asyncHandler(async (req, res) => {
  const access = currentOrderAccess(req);
  sendOk(res, await actions.changeAssignment(access, access.orderId, req.body.assigned_worker_id));
});

export const crew = asyncHandler(async (req, res) => {
  const access = currentOrderAccess(req);
  sendOk(res, await actions.setCrew(access, access.orderId, req.body.crew_worker_ids));
});

/** D101 no. 4. Hanya client order itu, memanggil fungsi yang sama dengan webhook Fase 7. */
export const simulatePayment = asyncHandler(async (req, res) => {
  const access = currentOrderAccess(req);
  await simulate(access);
  sendOk(res, await service.getOrder(access.orderId));
});
