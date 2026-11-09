/**
 * Socket.IO (PRD 7.2, D65, D99, usulan D109) lewat server HTTP sungguhan.
 *
 *   handshake tanpa token sah ditolak
 *   koneksi pekerja = online, jadi ikut ditawari Available Now
 *   pekerja hanya menerima event di room miliknya
 *   order:join hanya untuk peserta, dan pekerja lama keluar setelah D44
 *   order:location_update hanya dari penanggung jawab saat ON_THE_WAY (usulan D112)
 */

import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { io as connect, type Socket } from 'socket.io-client';
import { createApp } from '../src/app';
import { presence } from '../src/realtime/presence';
import { attachRealtime, closeRealtime } from '../src/realtime/socket';
import { hasTestDatabase, resetDatabase } from './helpers/integration';
import { prisma } from '@jasana/database';
import { HOUR, RENON, auth, newUser, newWorld, paidScheduledOrder, type User, type World } from './helpers/orders';

describe.skipIf(!hasTestDatabase)('Socket.IO', () => {
  let server: HttpServer;
  let url: string;
  let w: World;
  const sockets: Socket[] = [];

  beforeAll(async () => {
    server = createServer(createApp());
    attachRealtime(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await closeRealtime();
  });

  beforeEach(async () => {
    await resetDatabase();
    presence.reset();
    w = await newWorld();
  });

  afterEach(() => {
    sockets.splice(0).forEach((socket) => socket.disconnect());
  });

  function open(token?: string): Socket {
    const socket = connect(url, { auth: token ? { token } : {}, transports: ['websocket'], reconnection: false, forceNew: true });
    sockets.push(socket);
    return socket;
  }

  async function connected(user: User): Promise<Socket> {
    const socket = open(user.token);
    await new Promise<void>((resolve, reject) => {
      socket.once('connect', resolve);
      socket.once('connect_error', reject);
    });
    return socket;
  }

  /** Mengumpulkan event sejak sekarang, supaya bisa dicek ada atau tidaknya. */
  function collect(socket: Socket, event: string) {
    const seen: Record<string, unknown>[] = [];
    socket.on(event, (payload: Record<string, unknown>) => seen.push(payload));
    return seen;
  }

  const settle = () => new Promise((resolve) => setTimeout(resolve, 300));

  const join = (socket: Socket, orderId: string) =>
    socket.emitWithAck('order:join', { order_id: orderId }) as Promise<{ ok: boolean; code?: string }>;

  const api = () => request(server);

  it('menolak koneksi tanpa token atau dengan token rusak', async () => {
    for (const token of [undefined, 'bukan-jwt']) {
      const socket = open(token);
      const error = await new Promise<Error>((resolve) => socket.once('connect_error', resolve));
      expect(error.message).toBe('UNAUTHORIZED');
    }
  });

  it('pekerja yang terhubung online dan hanya dia yang menerima tawarannya; pemilik lewat room provider', async () => {
    const w2 = await connected(w.w2);
    const w4 = await connected(w.w4); // online tapi tidak terpetakan, jadi tidak ditawari
    const owner = await connected(w.owner);
    const [w2Offers, w4Offers, ownerOffers] = [collect(w2, 'order:offer'), collect(w4, 'order:offer'), collect(owner, 'order:offer')];

    const res = await api().post('/api/v1/orders').set(...auth(w.client)).send({
      listing_id: w.listingId,
      booking_mode: 'AVAILABLE_NOW',
      location_source: 'SAVED_ADDRESS',
      address_id: w.addressId,
      selected_options: { durasi_liputan: '2 Jam' },
    });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    await settle();

    expect(w2Offers).toEqual([expect.objectContaining({ order_id: res.body.data.id, distance_meters: 500 })]);
    expect(w4Offers).toEqual([]);
    // Pemilik menerima dua: sebagai penerima (dia juga pekerja online) dan lewat room provider.
    expect(ownerOffers.map((offer) => offer.order_id)).toEqual([res.body.data.id, res.body.data.id]);

    // Klaim menutup kartu di layar penerima lain dan dashboard pemilik.
    const closed = collect(owner, 'order:offer_closed');
    await api().post(`/api/v1/orders/${res.body.data.id}/accept`).set(...auth(w.w2)).send({}).expect(200);
    await settle();
    expect(closed.length).toBeGreaterThan(0);
  });

  it('order:join hanya untuk peserta, dan peserta menerima order:status_changed', async () => {
    const order = await api()
      .post('/api/v1/orders')
      .set(...auth(w.client))
      .send({
        listing_id: w.listingId,
        booking_mode: 'SCHEDULED',
        scheduled_at: new Date(Date.now() + 72 * HOUR).toISOString(),
        location_source: 'SAVED_ADDRESS',
        address_id: w.addressId,
        selected_options: { durasi_liputan: '2 Jam' },
      })
      .expect(201);
    const orderId = order.body.data.id as string;

    expect(await join(await connected(await newUser()), orderId)).toEqual({ ok: false, code: 'FORBIDDEN_ACTOR' });
    const client = await connected(w.client);
    expect(await join(client, orderId)).toEqual({ ok: true });

    const changes = collect(client, 'order:status_changed');
    await api().post(`/api/v1/orders/${orderId}/accept`).set(...auth(w.owner)).send({ assigned_worker_id: w.w2.workerId }).expect(200);
    await settle();
    expect(changes).toEqual([expect.objectContaining({ order_id: orderId, from_status: 'PENDING_ACCEPTANCE', to_status: 'ACCEPTED' })]);
  });

  it('setelah penanggung jawab diganti, pekerja lama tidak lagi menerima order:status_changed (D44, usulan D109)', async () => {
    const created = await api()
      .post('/api/v1/orders')
      .set(...auth(w.client))
      .send({
        listing_id: w.listingId,
        booking_mode: 'SCHEDULED',
        scheduled_at: new Date(Date.now() + 72 * HOUR).toISOString(),
        location_source: 'SAVED_ADDRESS',
        address_id: w.addressId,
        selected_options: { durasi_liputan: '2 Jam' },
      })
      .expect(201);
    const orderId = created.body.data.id as string;
    await api().post(`/api/v1/orders/${orderId}/accept`).set(...auth(w.owner)).send({ assigned_worker_id: w.w2.workerId }).expect(200);

    const oldWorker = await connected(w.w2);
    expect(await join(oldWorker, orderId)).toEqual({ ok: true });
    const assignment = collect(oldWorker, 'order:assignment_changed');
    const changes = collect(oldWorker, 'order:status_changed');

    await api().patch(`/api/v1/orders/${orderId}/assignment`).set(...auth(w.owner)).send({ assigned_worker_id: w.w3.workerId }).expect(200);
    await settle();
    expect(assignment).toEqual([expect.objectContaining({ order_id: orderId })]);

    await api().post(`/api/v1/dev/orders/${orderId}/simulate-payment`).set(...auth(w.client)).expect(200);
    await settle();
    expect(changes).toEqual([]);
  });

  it('order:location_update hanya diteruskan dari penanggung jawab saat ON_THE_WAY, tanpa menulis basis data (usulan D112)', async () => {
    const { id } = await paidScheduledOrder(server, w, { assigned: w.w2, crew: [w.w3] });
    const client = await connected(w.client);
    expect(await join(client, id)).toEqual({ ok: true });
    const seen = collect(client, 'order:location_update');
    const [assignee, crew, coworker] = [await connected(w.w2), await connected(w.w3), await connected(w.w4)];
    const send = (socket: Socket, lat: number) =>
      socket.emitWithAck('order:location_update', { order_id: id, latitude: lat, longitude: RENON.lng }) as Promise<{ ok: boolean }>;

    // Masih PAID: belum berangkat.
    expect(await send(assignee, -8.7)).toEqual({ ok: false, code: 'FORBIDDEN_ACTOR' });
    await api().post(`/api/v1/orders/${id}/depart`).set(...auth(w.w2)).expect(200);
    expect(await send(crew, -8.71)).toEqual({ ok: false, code: 'FORBIDDEN_ACTOR' });
    expect(await send(coworker, -8.72)).toEqual({ ok: false, code: 'FORBIDDEN_ACTOR' });
    expect(await send(assignee, -8.68)).toEqual({ ok: true });
    await settle();

    expect(seen).toEqual([expect.objectContaining({ order_id: id, latitude: -8.68, longitude: RENON.lng })]);
    const worker = await prisma.providerWorker.findUniqueOrThrow({ where: { id: w.w2.workerId } });
    expect(worker.currentLatitude!.toNumber()).not.toBe(-8.68);
  });
});
