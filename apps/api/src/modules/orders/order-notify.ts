/**
 * Notifikasi order menurut peta D58 (Keputusan 4.3), ditambah pembatalan
 * (usulan D106). Baris ditulis DI DALAM transaksi, pengiriman lewat
 * `afterCommit` (jebakan 7).
 */

import type { Prisma } from '@jasana/database';
import { recordEmail, type OutgoingEmail } from '../notifications/email-outbox';

export async function notifyUsers(
  tx: Prisma.TransactionClient,
  userIds: Array<string | null | undefined>,
  order: { id: string; orderNumber: string },
  title: string,
  detail: string,
): Promise<OutgoingEmail[]> {
  const ids = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
  const users = await tx.user.findMany({ where: { id: { in: ids } }, select: { id: true, email: true, fullName: true } });
  return Promise.all(
    users.map((user) =>
      recordEmail(tx, {
        userId: user.id,
        to: user.email,
        type: 'ORDER_STATUS',
        title: `${title} (${order.orderNumber})`,
        body: detail,
        subject: `Jasana: ${title} ${order.orderNumber}`,
        text: `Halo ${user.fullName},\n\n${detail}\n\nNomor order: ${order.orderNumber}`,
        referenceType: 'order',
        referenceId: order.id,
      }),
    ),
  );
}
