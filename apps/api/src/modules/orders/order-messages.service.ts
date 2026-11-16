/**
 * Pesan dalam order (D79, H70 sampai H72, sesi 10b).
 *
 *   Peserta     client, pemilik VERIFIED, dan assigned_worker_id ACTIVE (H71). Selain itu,
 *               termasuk pendamping, pekerja lain, OFFERED, dan admin saat menulis: 403 NOT_ORDER_PARTICIPANT
 *   Masa aktif  isMessageWindowOpen (H70). Di luar itu read-only, bukan terhapus
 *   Dua sisi    CLIENT dan sisi penyedia (PROVIDER, WORKER). read_at berarti dibaca sisi lawan
 *   Notifikasi  in-app saja ke sisi lawan, hanya kalau belum ada ORDER_MESSAGE belum dibaca (D178, D186)
 */

import { prisma, type OrderActorType, type OrderStatus, type Prisma } from '@jasana/database';
import { AppError, Errors } from '../../lib/errors';
import { pageMeta, skipTake, type Paginated } from '../../lib/pagination';
import { resolveOrderAccess, type OrderAccess } from '../access/access.service';
import { dispatchNotifications, type Outgoing } from '../notifications/email-outbox';
import { hasUnreadMessageNotification } from '../notifications/notifications.service';
import { getNumberSetting } from '../settings/settings.service';
import { emit } from '../../realtime/socket';
import { notifyUsers, parties } from './order-notify';
import { lockOrder, withOrderTransaction } from './order-transition.service';
import type { ListMessagesQuery } from './order-messages.schema';

/** Status yang selalu membuka jalur pesan. COMPLETED terbuka sampai settlement_due_at. */
const OPEN_STATUSES = new Set<OrderStatus>(['ACCEPTED', 'PAID', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_VERIFICATION']);

/**
 * H70. DISPUTED read-only apa pun status asalnya (usulan sesi 10b): percakapan yang menjadi
 * bukti (D79) dibekukan saat sengketa dibuka. Status akhir dan PENDING_ACCEPTANCE tertutup.
 */
export function isMessageWindowOpen(order: { status: OrderStatus; settlementDueAt: Date | null }, now: Date): boolean {
  if (OPEN_STATUSES.has(order.status)) return true;
  return order.status === 'COMPLETED' && order.settlementDueAt !== null && now < order.settlementDueAt;
}

export interface OrderMessageDto {
  id: string;
  order_id: string;
  sender_user_id: string;
  sender_role: OrderActorType;
  sender_name: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

const MESSAGE_SELECT = {
  id: true, orderId: true, senderUserId: true, senderRole: true, content: true, readAt: true, createdAt: true,
  sender: { select: { fullName: true } },
} satisfies Prisma.OrderMessageSelect;

type MessageRow = Prisma.OrderMessageGetPayload<{ select: typeof MESSAGE_SELECT }>;

const toDto = (m: MessageRow): OrderMessageDto => ({
  id: m.id.toString(),
  order_id: m.orderId,
  sender_user_id: m.senderUserId,
  sender_role: m.senderRole,
  sender_name: m.sender.fullName,
  content: m.content,
  read_at: m.readAt?.toISOString() ?? null,
  created_at: m.createdAt.toISOString(),
});

const PROVIDER_SIDE: OrderActorType[] = ['PROVIDER', 'WORKER'];
const opposite = (role: OrderActorType): OrderActorType[] => (role === 'CLIENT' ? PROVIDER_SIDE : ['CLIENT']);

/** H71. Pendamping dan pekerja lain tidak punya peran sama sekali, OFFERED dan admin tidak ikut menulis. */
async function participant(userId: string, orderId: string, allowAdmin: boolean): Promise<OrderActorType> {
  const denied = () => new AppError('NOT_ORDER_PARTICIPANT', 'Anda bukan peserta percakapan order ini');
  let access: OrderAccess;
  try {
    access = await resolveOrderAccess(userId, orderId, allowAdmin);
  } catch (error) {
    if (error instanceof AppError && error.code === 'FORBIDDEN_ACTOR') throw denied();
    throw error;
  }
  // WORKER lebih dulu: pemilik INDIVIDUAL yang juga penanggung jawab menulis sebagai pekerja (sama dengan 6e).
  for (const role of ['CLIENT', 'WORKER', 'PROVIDER'] as const) {
    if (access.roles.has(role)) return role;
  }
  if (access.roles.has('ADMIN')) return 'ADMIN';
  throw denied();
}

export async function sendMessage(userId: string, orderId: string, content: string): Promise<OrderMessageDto> {
  const senderRole = await participant(userId, orderId, false);
  const max = await getNumberSetting('order_message_max_length');
  if (content.length > max) {
    throw Errors.validation([{ path: 'content', message: `Pesan paling panjang ${max} karakter` }]);
  }

  return withOrderTransaction(async (tx, afterCommit) => {
    // Kunci order: serial terhadap T13 sampai T19 dan terhadap pemeriksaan anti-spam di bawah.
    const order = await lockOrder(tx, orderId);
    if (!isMessageWindowOpen(order, new Date())) {
      throw new AppError('MESSAGE_WINDOW_CLOSED', 'Masa aktif pesan order ini sudah berakhir atau belum dimulai');
    }
    const message = await tx.orderMessage.create({ data: { orderId, senderUserId: userId, senderRole, content }, select: MESSAGE_SELECT });

    const who = await parties(tx, orderId);
    const recipients = senderRole === 'CLIENT' ? [who.providerProfile.userId, who.assignedWorker?.userId] : [who.clientId];
    const outgoing: Outgoing[] = [];
    for (const recipient of new Set(recipients.filter((id): id is string => Boolean(id) && id !== userId))) {
      if (await hasUnreadMessageNotification(tx, recipient, orderId)) continue;
      outgoing.push(...(await notifyUsers(tx, [recipient], order, 'Pesan baru',
        senderRole === 'CLIENT' ? 'Client mengirim pesan baru di order ini.' : 'Penyedia mengirim pesan baru di order ini.',
        'ORDER_MESSAGE', { email: false })));
    }

    const dto = toDto(message);
    afterCommit(() => emit(`order:${orderId}`, 'order:message', dto));
    afterCommit(() => void dispatchNotifications(outgoing));
    return dto;
  });
}

/** Peserta dan admin, kapan pun. Terbaru dulu. */
export async function listMessages(userId: string, orderId: string, query: ListMessagesQuery): Promise<Paginated<OrderMessageDto>> {
  await participant(userId, orderId, true);
  const [rows, total] = await prisma.$transaction([
    prisma.orderMessage.findMany({ where: { orderId }, orderBy: { id: 'desc' }, select: MESSAGE_SELECT, ...skipTake(query) }),
    prisma.orderMessage.count({ where: { orderId } }),
  ]);
  return { items: rows.map(toDto), meta: pageMeta(query, total) };
}

/**
 * Menandai pesan SISI LAWAN dibaca, sekaligus notifikasi ORDER_MESSAGE pemanggil untuk order ini.
 * Tanpa yang kedua, aturan anti-spam D178 menahan notifikasi berikutnya selamanya.
 */
export async function markMessagesRead(userId: string, orderId: string): Promise<{ updated: number }> {
  const role = await participant(userId, orderId, false);
  const now = new Date();
  const [messages] = await prisma.$transaction([
    prisma.orderMessage.updateMany({ where: { orderId, readAt: null, senderRole: { in: opposite(role) } }, data: { readAt: now } }),
    prisma.notification.updateMany({
      where: { userId, channel: 'IN_APP', type: 'ORDER_MESSAGE', referenceType: 'order', referenceId: orderId, isRead: false },
      data: { isRead: true, readAt: now },
    }),
  ]);
  return { updated: messages.count };
}
