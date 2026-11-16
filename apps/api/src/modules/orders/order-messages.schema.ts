/**
 * Validasi pesan dalam order (D79). Batas panjang dibaca dari `order_message_max_length` di service.
 */

import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination';

export const sendMessageSchema = z.object({ content: z.string().trim().min(1, 'Pesan tidak boleh kosong') }).strict();

export const listMessagesQuerySchema = z.object({ ...paginationQuery }).strict();
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
