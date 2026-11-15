/**
 * Skema Zod modul chatbot (Fase 9).
 */

import { z } from 'zod';
import { CHAT_MESSAGE_MAX_LENGTH } from '../../config/constants';
import { paginationQuery } from '../../lib/pagination';

export const sessionParamsSchema = z.object({ id: z.string().uuid('id sesi tidak valid') });

export const pageQuerySchema = z.object(paginationQuery);

export const sendMessageSchema = z
  .object({
    content: z.string().trim().min(1, 'Pesan tidak boleh kosong').max(CHAT_MESSAGE_MAX_LENGTH),
    // Geolokasi browser (D77). Rule 9: jaraknya tetap dihitung server.
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  })
  .refine((body) => (body.latitude === undefined) === (body.longitude === undefined), {
    path: ['latitude'],
    message: 'latitude dan longitude wajib diisi berpasangan',
  });

export type SendMessageBody = z.infer<typeof sendMessageSchema>;
