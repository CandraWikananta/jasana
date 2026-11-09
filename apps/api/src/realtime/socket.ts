/**
 * Socket.IO di proses yang sama dengan API (D99, PRD 7.2).
 *
 * Socket.IO hanya MENGIRIM pemberitahuan. Seluruh perubahan state tetap lewat
 * REST, kecuali `worker:presence` yang memang tidak mengubah state apa pun.
 * Service memanggil `emit` hanya dari `afterCommit` (jebakan 7).
 *
 * Room:
 *   user:<user_id>                 otomatis saat terhubung
 *   provider:<provider_profile_id> otomatis untuk pemilik usaha VERIFIED
 *   order:<order_id>               lewat `order:join`, diperiksa resolveOrderAccess
 *                                  (usulan D109). Pekerja yang hanya ditawari dan
 *                                  pendamping tidak boleh masuk
 *
 * `order:location_update` dari penanggung jawab saat ON_THE_WAY diteruskan ke
 * room order (usulan D112). Hanya relay: posisi tersimpan pekerja tetap lewat
 * PATCH /workers/me/location (D66), jadi aturan "hanya worker:presence yang
 * boleh lewat socket" di PRD 7.2 tetap utuh.
 */

import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { z } from 'zod';
import { env } from '../config/env';
import { verifyAccessToken } from '../lib/jwt';
import { logger } from '../lib/logger';
import { resolveOrderAccess, resolveProvider, resolveWorker } from '../modules/access/access.service';
import { canRelayLocation } from '../modules/orders/order-execution.service';
import { presence } from './presence';

interface SocketData {
  userId: string;
  providerId: string | null;
  workerId: string | null;
}

let io: Server | null = null;

const joinSchema = z.object({ order_id: z.string().uuid() });
const PARTICIPANT_ROLES = new Set(['CLIENT', 'PROVIDER', 'WORKER']);
const locationSchema = z.object({
  order_id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

type Ack = (result: { ok: boolean; code?: string }) => void;

export function attachRealtime(httpServer: HttpServer): Server {
  const server = new Server(httpServer, { cors: { origin: env.CORS_ORIGINS } });

  // Peran dibaca dari basis data sebelum `connect` sampai ke client, jadi room
  // sudah lengkap begitu client menerima `connect`.
  server.use((socket, next) => {
    const claims = verifyAccessToken(String(socket.handshake.auth?.token ?? ''));
    if (!claims) {
      next(new Error('UNAUTHORIZED'));
      return;
    }
    Promise.all([
      resolveProvider(claims.user_id).then((p) => p.id, () => null),
      resolveWorker(claims.user_id).then((w) => w.id, () => null),
    ]).then(([providerId, workerId]) => {
      socket.data = { userId: claims.user_id, providerId, workerId } satisfies SocketData;
      next();
    }, next);
  });

  server.on('connection', (socket) => {
    const { userId, providerId, workerId } = socket.data as SocketData;
    void socket.join(`user:${userId}`);
    if (providerId) void socket.join(`provider:${providerId}`);
    if (workerId) {
      presence.connect(workerId);
      socket.on('disconnect', () => presence.disconnect(workerId));
      socket.on('worker:presence', () => presence.touch(workerId));
    }

    socket.on('order:join', (payload: unknown, ack?: (result: { ok: boolean; code?: string }) => void) => {
      const parsed = joinSchema.safeParse(payload);
      if (!parsed.success) {
        ack?.({ ok: false, code: 'VALIDATION_ERROR' });
        return;
      }
      const orderId = parsed.data.order_id;
      resolveOrderAccess(userId, orderId, false)
        .then((access) => {
          if (![...access.roles].some((role) => PARTICIPANT_ROLES.has(role))) throw new Error('FORBIDDEN_ACTOR');
          void socket.join(`order:${orderId}`);
          ack?.({ ok: true });
        })
        .catch((error: unknown) => ack?.({ ok: false, code: (error as { code?: string }).code ?? 'FORBIDDEN_ACTOR' }));
    });

    // shortcut: tanpa throttle per socket, satu kueri baca per event. Pasang throttle kalau k6 menunjukkan beban.
    socket.on('order:location_update', (payload: unknown, ack?: Ack) => {
      const parsed = locationSchema.safeParse(payload);
      if (!parsed.success) {
        ack?.({ ok: false, code: 'VALIDATION_ERROR' });
        return;
      }
      const { order_id, latitude, longitude } = parsed.data;
      canRelayLocation(userId, order_id).then(
        (allowed) => {
          if (!allowed) {
            ack?.({ ok: false, code: 'FORBIDDEN_ACTOR' });
            return;
          }
          emit(`order:${order_id}`, 'order:location_update', { order_id, latitude, longitude, timestamp: new Date().toISOString() });
          ack?.({ ok: true });
        },
        (error: unknown) => {
          logger.warn({ err: error, order_id }, 'Relay lokasi gagal');
          ack?.({ ok: false, code: 'INTERNAL_ERROR' });
        },
      );
    });
  });

  io = server;
  logger.info('Socket.IO terpasang');
  return io;
}

/** No-op kalau Socket.IO belum dipasang, misalnya uji yang hanya memakai `createApp()`. */
export function emit(room: string | string[], event: string, payload: unknown): void {
  io?.to(room).emit(event, payload);
}

/** Mengeluarkan seluruh socket milik satu pengguna dari sebuah room. */
export function leaveRoom(userId: string, room: string): void {
  io?.in(`user:${userId}`).socketsLeave(room);
}

/** Untuk test dan penutupan tertib. */
export async function closeRealtime(): Promise<void> {
  await io?.close();
  io = null;
}
