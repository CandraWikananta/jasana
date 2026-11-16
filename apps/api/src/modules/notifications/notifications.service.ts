/**
 * Notifikasi in-app milik pemanggil (D178). Hanya baris IN_APP, baris EMAIL
 * adalah log pengiriman dan tidak pernah tampil di sini.
 */

import { prisma, type Prisma } from '@jasana/database';
import { Errors } from '../../lib/errors';
import { pageMeta, skipTake } from '../../lib/pagination';
import { toNotificationDto, type NotificationDto } from './notifications.mapper';
import type { ListNotificationsQuery } from './notifications.schema';

const mine = (userId: string) => ({ userId, channel: 'IN_APP' as const });

export async function listNotifications(userId: string, query: ListNotificationsQuery) {
  const where: Prisma.NotificationWhereInput = { ...mine(userId), ...(query.is_read === undefined ? {} : { isRead: query.is_read }) };
  const [rows, total, unread] = await prisma.$transaction([
    prisma.notification.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], ...skipTake(query) }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { ...mine(userId), isRead: false } }),
  ]);
  return { items: rows.map(toNotificationDto), meta: { ...pageMeta(query, total), unread_count: unread } };
}

/** Milik orang lain dan baris EMAIL dibalas 404 yang sama, supaya keberadaannya tidak bocor. */
export async function markRead(userId: string, id: string): Promise<NotificationDto> {
  const row = await prisma.notification.findFirst({ where: { id: BigInt(id), ...mine(userId) } });
  if (!row) throw Errors.notFound('Notifikasi tidak ditemukan');
  if (row.isRead) return toNotificationDto(row);
  return toNotificationDto(await prisma.notification.update({ where: { id: row.id }, data: { isRead: true, readAt: new Date() } }));
}

export async function markAllRead(userId: string): Promise<{ updated: number }> {
  const { count } = await prisma.notification.updateMany({ where: { ...mine(userId), isRead: false }, data: { isRead: true, readAt: new Date() } });
  return { updated: count };
}

/**
 * D178, dipakai pesan dalam order di 10b: notifikasi pesan ke sisi lawan
 * hanya dibuat kalau belum ada yang belum dibaca untuk order itu.
 */
export async function hasUnreadMessageNotification(tx: Prisma.TransactionClient, userId: string, orderId: string): Promise<boolean> {
  const count = await tx.notification.count({
    where: { ...mine(userId), type: 'ORDER_MESSAGE', referenceType: 'order', referenceId: orderId, isRead: false },
  });
  return count > 0;
}
