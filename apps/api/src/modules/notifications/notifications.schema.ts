import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination';

export const listNotificationsQuerySchema = z.object({
  ...paginationQuery,
  is_read: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
});
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;

/** `notifications.id` bertipe bigserial. */
export const notificationParamsSchema = z.object({ id: z.string().regex(/^\d{1,18}$/, 'id harus angka') });
