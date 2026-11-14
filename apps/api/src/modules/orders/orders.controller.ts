/**
 * Controller order (Fase 6). Tidak menyentuh Prisma.
 */

import { asyncHandler } from '../../lib/async-handler';
import { sendCreated, sendOk } from '../../lib/envelope';
import { currentUser } from '../../middlewares/auth';
import { currentOrderAccess } from '../../middlewares/rbac';
import * as actions from './order-actions.service';
import * as execution from './order-execution.service';
import * as expiry from './order-expiry.service';
import { getPayment, renewInvoice, simulatePayment as simulate } from './order-payment.service';
import { presence } from '../../realtime/presence';
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

export const depart = asyncHandler(async (req, res) => {
  sendOk(res, await execution.departOrder(currentOrderAccess(req)));
});

export const checkIn = asyncHandler(async (req, res) => {
  sendOk(res, await execution.checkIn(currentOrderAccess(req), req.body));
});

export const start = asyncHandler(async (req, res) => {
  sendOk(res, await execution.startWork(currentOrderAccess(req)));
});

export const finish = asyncHandler(async (req, res) => {
  sendOk(res, await execution.finishWork(currentOrderAccess(req)));
});

export const verify = asyncHandler(async (req, res) => {
  sendOk(res, await execution.verifyCode(currentOrderAccess(req), req.body.code));
});

export const verificationCode = asyncHandler(async (req, res) => {
  sendOk(res, await execution.getVerificationCode(currentOrderAccess(req)));
});

export const renewVerificationCode = asyncHandler(async (req, res) => {
  sendOk(res, await execution.renewVerificationCode(currentOrderAccess(req)));
});

export const payment = asyncHandler(async (req, res) => {
  sendOk(res, await getPayment(currentOrderAccess(req)));
});

export const renewPayment = asyncHandler(async (req, res) => {
  sendOk(res, await renewInvoice(currentOrderAccess(req)));
});

/** D101 no. 4. Hanya client order itu, memanggil fungsi yang sama dengan webhook Fase 7. */
export const simulatePayment = asyncHandler(async (req, res) => {
  const access = currentOrderAccess(req);
  await simulate(access, (req.body as { payment_method: string }).payment_method);
  sendOk(res, await service.getOrder(access.orderId));
});

export const declineOffer = asyncHandler(async (req, res) => {
  const access = currentOrderAccess(req);
  sendOk(res, await actions.declineOffer(access, access.orderId));
});

/** Sesi 6f, hanya router /dev: deadline dimundurkan, lalu sweep dipicu lewat devRunJob. */
export const devBackdate = asyncHandler(async (req, res) => {
  sendOk(res, await expiry.backdateDeadline(currentOrderAccess(req).orderId, (req.body as { field: expiry.DeadlineField }).field));
});

export const devRunJob = asyncHandler(async (req, res) => {
  sendOk(res, await expiry.DEV_JOBS[req.params.job as expiry.DevJob]());
});

/**
 * H92: menandai pekerja seed sebagai online untuk Postman dan k6. Dihitung satu
 * denyut presence, jadi kedaluwarsa setelah `worker_presence_timeout_minutes`;
 * script k6 harus mengirim ulang secara berkala selama skenario berjalan.
 * Hanya ada di router /dev, yang tidak pernah terdaftar di produksi (D101).
 */
export const devPresence = asyncHandler(async (req, res) => {
  const ids = (req.body as { worker_ids: string[] }).worker_ids;
  ids.forEach((id) => presence.touch(id));
  sendOk(res, { touched: ids.length });
});
