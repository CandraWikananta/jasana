/**
 * Sengketa (State Machine 3: T13, T15, T17, T19, T20, T21; D79, D80, D132, D133).
 *
 *   openDispute     order -> DISPUTED lewat transitionOrder, baris disputes OPEN
 *   uploadEvidence  multipart, pola e-KYC: magic bytes (H78), Storage dulu baru baris (H79)
 *   getDispute      detail, bukti dengan signed URL, dan seluruh order_messages (D79)
 *   reviewDispute   OPEN -> UNDER_REVIEW
 *   resolveDispute  T20 (RELEASE, PARTIAL) atau T21 (REFUND) dalam satu transaksi
 *
 * Urutan kunci di seluruh jalur: order, dispute, payment, wallet.
 * Pekerja tidak pernah punya hak di sini, pemilik yang mewakili usaha (State Machine 2).
 */

import { randomUUID } from 'node:crypto';
import { prisma, Prisma, type Dispute, type DisputeStatus, type Order, type Payment } from '@jasana/database';
import {
  DISPUTE_EVIDENCE_BUCKET,
  DISPUTE_EVIDENCE_MAX_PER_PARTY,
  DISPUTE_EVIDENCE_SIGNED_URL_TTL_SECONDS,
} from '../../config/constants';
import { AppError, Errors } from '../../lib/errors';
import { detectFileType } from '../../lib/file-signature';
import { logger } from '../../lib/logger';
import { pageMeta, skipTake, type Paginated } from '../../lib/pagination';
import { isUniqueViolation } from '../../lib/prisma-errors';
import { storage } from '../../lib/supabase';
import { actorFrom, resolveOrderAccess, type OrderAccess } from '../access/access.service';
import { dispatchNotifications } from '../notifications/email-outbox';
import { notifyUsers, parties } from '../orders/order-notify';
import { writeEscrow } from '../orders/order-payment.service';
import { lockOrder, transitionOrder, withOrderTransaction } from '../orders/order-transition.service';
import type { IncomingFile } from '../providers/kyc.service';
import { kycObjectKey, parseKycObjectKey } from '../providers/providers.mapper';
import { createRefund } from '../refunds/refunds.service';
import type { AdminDisputesQuery, OpenDisputeBody, ResolveDisputeBody } from './disputes.schema';

type Tx = Prisma.TransactionClient;

const iso = (value: Date | null) => value?.toISOString() ?? null;

const DTO_INCLUDE = { order: { select: { orderNumber: true, status: true } } } as const;
type DisputeRow = Prisma.DisputeGetPayload<{ include: typeof DTO_INCLUDE }>;

function toDto(d: DisputeRow) {
  return {
    id: d.id,
    order_id: d.orderId,
    order_number: d.order.orderNumber,
    order_status: d.order.status,
    raised_by_user_id: d.raisedByUserId,
    raised_by_role: d.raisedByRole,
    category: d.category,
    description: d.description,
    status: d.status,
    resolution_note: d.resolutionNote,
    refund_amount: d.refundAmount?.toNumber() ?? null,
    resolved_by: d.resolvedBy,
    created_at: d.createdAt.toISOString(),
    resolved_at: iso(d.resolvedAt),
  };
}
export type DisputeDto = ReturnType<typeof toDto>;

const getDto = async (id: string) => toDto(await prisma.dispute.findUniqueOrThrow({ where: { id }, include: DTO_INCLUDE }));

const alreadyExists = () => new AppError('DISPUTE_ALREADY_EXISTS', 'Order ini sudah punya sengketa');
const stateConflict = (d: Dispute, action: string) =>
  new AppError('DISPUTE_STATE_CONFLICT', `Sengketa berstatus ${d.status} tidak bisa ${action}`);
const OPEN_STATUSES: ReadonlySet<DisputeStatus> = new Set(['OPEN', 'UNDER_REVIEW']);

async function lockDispute(tx: Tx, id: string): Promise<Dispute> {
  await tx.$queryRaw`SELECT id FROM disputes WHERE id = ${id}::uuid FOR UPDATE`;
  return tx.dispute.findUniqueOrThrow({ where: { id } });
}

// ---------------------------------------------------------------------------
// T13, T15, T17, T19
// ---------------------------------------------------------------------------

/**
 * POST /orders/:id/disputes. Transisi legalnya (ARRIVED sampai COMPLETED) dijaga
 * lapis 1 transitionOrder. Duplikat diperiksa SEBELUM transisi, di bawah kunci
 * order, supaya order yang sudah DISPUTED dibalas DISPUTE_ALREADY_EXISTS, bukan
 * kode transisi. Unique `order_id` tetap jaring terakhir.
 *
 * DISPUTED bukan in-flight (PRD 3.4), jadi kunci penanggung jawab dan pendamping
 * lepas sendiri. Settlement berhenti karena T18 hanya dari COMPLETED.
 */
export async function openDispute(access: OrderAccess, body: OpenDisputeBody): Promise<DisputeDto> {
  const actor = actorFrom(access, ['CLIENT', 'PROVIDER']);
  const orderId = access.orderId;
  const id = await withOrderTransaction(async (tx, afterCommit) => {
    await lockOrder(tx, orderId);
    if (await tx.dispute.count({ where: { orderId } })) throw alreadyExists();

    let disputeId!: string;
    await transitionOrder(tx, {
      orderId,
      afterCommit,
      toStatus: 'DISPUTED',
      actor,
      actorUserId: access.userId,
      reason: `Sengketa dibuka: ${body.category}`,
      guard: async (_tx, order) => {
        // Batasnya settlement_due_at (State Machine 6). Null berarti belum COMPLETED.
        if (order.settlementDueAt && order.settlementDueAt < new Date()) {
          throw new AppError('DISPUTE_WINDOW_CLOSED', 'Batas waktu membuka sengketa sudah lewat');
        }
      },
      effects: async (tx, order) => {
        const dispute = await tx.dispute
          .create({
            data: { orderId, raisedByUserId: access.userId, raisedByRole: actor === 'CLIENT' ? 'CLIENT' : 'PROVIDER', category: body.category, description: body.description },
          })
          .catch((error: unknown) => {
            if (isUniqueViolation(error, 'order_id') || isUniqueViolation(error, 'orderId')) throw alreadyExists();
            throw error;
          });
        disputeId = dispute.id;
        const admins = await tx.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
        // D178: pihak lawan ikut diberi tahu, sesuai peta D58 (sebelumnya hanya admin).
        const who = await parties(tx, orderId);
        const counterpart = actor === 'CLIENT' ? who.providerProfile.userId : order.clientId;
        const emails = await notifyUsers(tx, [...admins.map((a) => a.id), counterpart], order, 'Sengketa dibuka',
          `Sengketa ${body.category} dibuka oleh ${actor === 'CLIENT' ? 'client' : 'penyedia'} dan menunggu pemeriksaan admin.`, 'DISPUTE');
        afterCommit(() => void dispatchNotifications(emails));
      },
    });
    return disputeId;
  });
  return getDto(id);
}

// ---------------------------------------------------------------------------
// Bukti (D80, H78, H79, usulan D148)
// ---------------------------------------------------------------------------

/** Status dan batas per pihak, dicek sebelum unggah lalu diulang di bawah kunci dispute. */
async function assertEvidenceAllowed(db: Tx | typeof prisma, dispute: Dispute, userId: string): Promise<void> {
  if (!OPEN_STATUSES.has(dispute.status)) throw stateConflict(dispute, 'menerima bukti');
  const mine = await db.disputeEvidence.count({ where: { disputeId: dispute.id, uploadedByUserId: userId } });
  if (mine >= DISPUTE_EVIDENCE_MAX_PER_PARTY) {
    throw new AppError('DISPUTE_EVIDENCE_LIMIT_REACHED', `Setiap pihak paling banyak ${DISPUTE_EVIDENCE_MAX_PER_PARTY} bukti per sengketa`);
  }
}

const EVIDENCE_SELECT = { id: true, uploadedByUserId: true, fileUrl: true, fileType: true, description: true, createdAt: true } as const;
type EvidenceRow = Prisma.DisputeEvidenceGetPayload<{ select: typeof EVIDENCE_SELECT }>;

/** `file_url` tidak pernah ikut: bucket-nya private, berkas hanya dibuka lewat signed URL. */
const evidenceDto = (e: EvidenceRow) => ({
  id: e.id,
  uploaded_by_user_id: e.uploadedByUserId,
  file_type: e.fileType,
  description: e.description,
  created_at: e.createdAt.toISOString(),
});

/**
 * POST /disputes/:id/evidences. Urutan mengikat sama dengan e-KYC:
 *   1. ukuran (middleware), 2. magic bytes, 3. aturan bisnis, 4. Storage, 5. baru baris.
 * Langkah 4 dan 5 tidak boleh dibalik (H79). Kalau baris gagal ditulis, berkasnya dihapus lagi.
 */
export async function uploadEvidence(userId: string, disputeId: string, file: IncomingFile | undefined, description?: string) {
  if (!file || file.size === 0) throw Errors.validation([{ path: 'file', message: 'file wajib diunggah' }]);

  const detected = detectFileType(file.buffer);
  if (!detected) {
    throw new AppError('UNSUPPORTED_FILE_TYPE', 'Berkas harus JPEG, PNG, atau PDF. Jenisnya ditentukan dari isi berkas, bukan dari nama atau Content-Type');
  }

  const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
  if (!dispute) throw Errors.notFound('Sengketa tidak ditemukan');
  actorFrom(await resolveOrderAccess(userId, dispute.orderId, false), ['CLIENT', 'PROVIDER']);
  await assertEvidenceAllowed(prisma, dispute, userId);

  const objectPath = `${disputeId}/${randomUUID()}.${detected.extension}`;
  try {
    await storage.upload(DISPUTE_EVIDENCE_BUCKET, objectPath, file.buffer, detected.mime);
  } catch (error) {
    throw new AppError('STORAGE_UPLOAD_FAILED', 'Berkas gagal disimpan, silakan unggah ulang', {
      cause: error,
      context: { dispute_id: disputeId },
    });
  }

  try {
    const row = await prisma.$transaction(async (tx) => {
      // Putusan admin atau unggahan paralel bisa masuk di antara pemeriksaan awal dan langkah ini.
      await assertEvidenceAllowed(tx, await lockDispute(tx, disputeId), userId);
      return tx.disputeEvidence.create({
        data: {
          disputeId,
          uploadedByUserId: userId,
          fileUrl: kycObjectKey(DISPUTE_EVIDENCE_BUCKET, objectPath),
          fileType: detected.mime,
          description: description ?? null,
        },
        select: EVIDENCE_SELECT,
      });
    });
    return evidenceDto(row);
  } catch (error) {
    await storage.remove(DISPUTE_EVIDENCE_BUCKET, [objectPath]).catch((removeError: unknown) =>
      logger.error({ err: removeError, bucket: DISPUTE_EVIDENCE_BUCKET, path: objectPath }, 'Gagal menghapus bukti dispute yang barisnya batal ditulis'),
    );
    throw error;
  }
}

async function signEvidence(fileUrl: string): Promise<string | null> {
  const key = parseKycObjectKey(fileUrl);
  if (!key) return null;
  try {
    return await storage.createSignedUrl(key.bucket, key.path, DISPUTE_EVIDENCE_SIGNED_URL_TTL_SECONDS);
  } catch (error) {
    logger.warn({ err: error, bucket: key.bucket }, 'Gagal membuat signed URL bukti dispute');
    return null;
  }
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

/** GET /disputes/:id, C/PR/A (PRD 4.3). Pesan dalam order ikut sebagai bukti, read-only (D79). */
export async function getDispute(userId: string, id: string) {
  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      order: { select: { orderNumber: true, status: true, totalAmount: true, platformFee: true, providerEarning: true, platformFeeRefunded: true } },
      evidences: { select: EVIDENCE_SELECT, orderBy: { createdAt: 'asc' } },
    },
  });
  if (!dispute) throw Errors.notFound('Sengketa tidak ditemukan');
  actorFrom(await resolveOrderAccess(userId, dispute.orderId, true), ['CLIENT', 'PROVIDER', 'ADMIN']);

  const messages = await prisma.orderMessage.findMany({
    where: { orderId: dispute.orderId },
    orderBy: { id: 'asc' },
    select: { id: true, senderUserId: true, senderRole: true, content: true, createdAt: true },
  });
  const evidences = await Promise.all(
    dispute.evidences.map(async (e) => ({
      ...evidenceDto(e),
      signed_url: await signEvidence(e.fileUrl),
      signed_url_expires_in: DISPUTE_EVIDENCE_SIGNED_URL_TTL_SECONDS,
    })),
  );
  const { order } = dispute;
  return {
    ...toDto(dispute),
    order: {
      order_number: order.orderNumber,
      status: order.status,
      total_amount: order.totalAmount.toNumber(),
      platform_fee: order.platformFee.toNumber(),
      provider_earning: order.providerEarning.toNumber(),
      platform_fee_refunded: order.platformFeeRefunded.toNumber(),
    },
    evidences,
    order_messages: messages.map((m) => ({
      id: m.id.toString(),
      sender_user_id: m.senderUserId,
      sender_role: m.senderRole,
      content: m.content,
      created_at: m.createdAt.toISOString(),
    })),
  };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

/** Antrean, terlama dulu. */
export async function listForAdmin(query: AdminDisputesQuery): Promise<Paginated<DisputeDto>> {
  // shortcut: filter status tanpa index sendiri (yang ada hanya unique order_id), tambah @@index([status, createdAt]) kalau antrean membesar.
  const where = query.status ? { status: query.status } : {};
  const [rows, total] = await prisma.$transaction([
    prisma.dispute.findMany({ where, orderBy: { createdAt: 'asc' }, include: DTO_INCLUDE, ...skipTake(query) }),
    prisma.dispute.count({ where }),
  ]);
  return { items: rows.map(toDto), meta: pageMeta(query, total) };
}

/** POST /admin/disputes/:id/review. Bukan transisi order, order tetap DISPUTED. */
export async function reviewDispute(id: string): Promise<DisputeDto> {
  const { count } = await prisma.dispute.updateMany({ where: { id, status: 'OPEN' }, data: { status: 'UNDER_REVIEW' } });
  if (count === 0) {
    const dispute = await prisma.dispute.findUnique({ where: { id } });
    if (!dispute) throw Errors.notFound('Sengketa tidak ditemukan');
    throw stateConflict(dispute, 'mulai diperiksa');
  }
  return getDto(id);
}

/**
 * D133. Platform fee dikembalikan sebanding porsi refund, bagian provider adalah
 * selisihnya (bukan dibulatkan sendiri), jadi `fee_refunded + provider_share`
 * selalu tepat `refund_amount`.
 */
export function partialSplit(order: Pick<Order, 'totalAmount' | 'platformFee' | 'providerEarning'>, refundAmount: number) {
  const amount = new Prisma.Decimal(refundAmount);
  const feeRefunded = order.platformFee.mul(amount).div(order.totalAmount).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
  const providerShare = amount.minus(feeRefunded);
  return { amount, feeRefunded, providerShare, release: order.providerEarning.minus(providerShare) };
}

const RESOLVED_STATUS = { RELEASE: 'RESOLVED_RELEASE', PARTIAL: 'RESOLVED_PARTIAL', REFUND: 'RESOLVED_REFUND' } as const;

/**
 * POST /admin/disputes/:id/resolve, T20 atau T21 dalam satu transaksi. Hanya dari
 * UNDER_REVIEW. Refund dieksekusi setelah commit (createRefund, usulan D140), dan
 * T22 tidak berlaku karena order bukan CANCELLED (D146).
 */
export async function resolveDispute(adminId: string, id: string, body: ResolveDisputeBody): Promise<DisputeDto> {
  const found = await prisma.dispute.findUnique({ where: { id }, select: { orderId: true } });
  if (!found) throw Errors.notFound('Sengketa tidak ditemukan');
  const { orderId } = found;
  const refundAmount = body.decision === 'PARTIAL' ? body.refund_amount : null;

  await withOrderTransaction(async (tx, afterCommit) => {
    // Kunci: order, dispute, payment, lalu wallet di writeEscrow.
    const order = await lockOrder(tx, orderId);
    const dispute = await lockDispute(tx, id);
    if (dispute.status !== 'UNDER_REVIEW') throw stateConflict(dispute, 'diputus');
    if (refundAmount !== null && !new Prisma.Decimal(refundAmount).lt(order.totalAmount)) {
      throw Errors.validation([{ path: 'refund_amount', message: `refund_amount harus kurang dari total_amount ${order.totalAmount.toNumber()}` }]);
    }
    const [locked] = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM payments WHERE order_id = ${orderId}::uuid AND status = 'PAID' FOR UPDATE
    `;
    if (!locked) throw new AppError('ORDER_TRANSITION_NOT_ALLOWED', 'Order ini tidak punya pembayaran lunas');
    const payment: Payment = await tx.payment.findUniqueOrThrow({ where: { id: locked.id } });

    await transitionOrder(tx, {
      orderId,
      afterCommit,
      toStatus: body.decision === 'REFUND' ? 'REFUNDED' : 'SETTLED',
      actor: 'ADMIN',
      actorUserId: adminId,
      reason: body.resolution_note,
      metadata: { operation: 'DISPUTE_RESOLVED', dispute_id: id, decision: body.decision, refund_amount: refundAmount },
      effects: async (tx, order) => {
        const reason = `Putusan sengketa ${body.decision}`;
        let note: string;
        if (body.decision === 'RELEASE') {
          await writeEscrow(tx, order, 'ESCROW_RELEASE');
          note = 'Dana dilepas penuh ke penyedia.';
        } else if (body.decision === 'PARTIAL') {
          const split = partialSplit(order, body.refund_amount);
          await tx.order.update({ where: { id: orderId }, data: { platformFeeRefunded: split.feeRefunded } });
          await writeEscrow(tx, order, 'REFUND_DEDUCTION', split.providerShare);
          await writeEscrow(tx, order, 'ESCROW_RELEASE', split.release);
          await createRefund(tx, afterCommit, { orderId, payment, initiatedBy: adminId, reason, type: 'PARTIAL', amount: split.amount });
          note = `Sebagian dana, Rp${body.refund_amount.toLocaleString('id-ID')}, dikembalikan ke client dan sisanya dilepas ke penyedia.`;
        } else {
          // T21. D29: platform fee ikut dikembalikan penuh.
          await tx.order.update({ where: { id: orderId }, data: { platformFeeRefunded: order.platformFee } });
          await writeEscrow(tx, order, 'REFUND_DEDUCTION');
          await createRefund(tx, afterCommit, { orderId, payment, initiatedBy: adminId, reason });
          note = 'Dana dikembalikan penuh ke client.';
        }

        await tx.dispute.update({
          where: { id },
          data: {
            status: RESOLVED_STATUS[body.decision],
            resolutionNote: body.resolution_note,
            refundAmount,
            resolvedBy: adminId,
            resolvedAt: new Date(),
          },
        });
        const who = await parties(tx, orderId);
        const emails = await notifyUsers(tx, [order.clientId, who.providerProfile.userId], order, 'Sengketa diputus',
          `${note} Catatan admin: ${body.resolution_note}`, 'DISPUTE');
        afterCommit(() => void dispatchNotifications(emails));
      },
    });
  });
  return getDto(id);
}
