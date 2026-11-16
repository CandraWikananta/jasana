/**
 * Notifikasi order menurut tabel event D178 (turunan peta D58), ditambah
 * pembatalan (usulan D106). Baris ditulis DI DALAM transaksi, pengiriman
 * lewat `afterCommit` (jebakan 7).
 */

import type { NotificationType, Prisma } from '@jasana/database';
import { recordNotification, type Outgoing } from '../notifications/email-outbox';

/** Pihak-pihak order: client, pemilik usaha, dan penanggung jawab. */
export const parties = (tx: Prisma.TransactionClient, orderId: string) =>
  tx.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { clientId: true, providerProfile: { select: { userId: true } }, assignedWorker: { select: { userId: true } } },
  });

export async function notifyUsers(
  tx: Prisma.TransactionClient,
  userIds: Array<string | null | undefined>,
  order: { id: string; orderNumber: string },
  title: string,
  detail: string,
  type: NotificationType = 'ORDER_STATUS',
  channels: { inApp?: boolean; email?: boolean } = {},
): Promise<Outgoing[]> {
  const ids = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
  const users = await tx.user.findMany({ where: { id: { in: ids } }, select: { id: true, email: true, fullName: true } });
  const out: Outgoing[] = [];
  for (const user of users) {
    out.push(
      ...(await recordNotification(tx, {
        userId: user.id,
        type,
        title: `${title} (${order.orderNumber})`,
        body: detail,
        referenceType: 'order',
        referenceId: order.id,
        inApp: channels.inApp,
        email:
          channels.email === false
            ? undefined
            : {
                to: user.email,
                subject: `Jasana: ${title} ${order.orderNumber}`,
                text: `Halo ${user.fullName},\n\n${detail}\n\nNomor order: ${order.orderNumber}`,
              },
      })),
    );
  }
  return out;
}
