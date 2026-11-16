import type { Notification } from '@jasana/database';

export interface NotificationDto {
  id: string;
  type: Notification['type'];
  title: string;
  body: string | null;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/** Dipakai respons REST dan payload `notification:new`, supaya bentuknya satu. */
export function toNotificationDto(row: Notification): NotificationDto {
  return {
    id: row.id.toString(),
    type: row.type,
    title: row.title,
    body: row.body,
    reference_type: row.referenceType,
    reference_id: row.referenceId,
    is_read: row.isRead,
    read_at: row.readAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
  };
}
