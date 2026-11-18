import { useSyncExternalStore } from "react"
import { io, type Socket } from "socket.io-client"
import { publicEnv } from "./env"
import { getAccessToken, getSessionStatus, refreshSession, subscribeSession } from "./session"
import type { ServerEvents } from "./socket-events"

// Satu koneksi Socket.IO per tab setelah login (D217, PRD Frontend 8). Hanya dipakai di browser.
//
// Token hanya diperiksa Express saat handshake (apps/api realtime/socket.ts, server.use), dan
// koneksi yang sudah tersambung tidak diputus saat access token kedaluwarsa. Karena itu pergantian
// token TIDAK memaksa sambung ulang: callback `auth` membaca token terbaru setiap kali socket.io
// menyambung ulang. Berbeda dengan PRD Frontend 8 ("putus lalu sambung ulang"), tercatat di laporan.

export type RealtimeStatus = "idle" | "connected" | "disconnected"

interface Handlers {
  onEvent: (event: string, payload: unknown) => void
  onReconnect: () => void
}

let socket: Socket | null = null
let handlers: Handlers | null = null
let status: RealtimeStatus = "idle"
let everConnected = false
let authRetried = false
/** Room order yang sedang dibuka layar ini, beserta jumlah pemakainya. */
const rooms = new Map<string, number>()
const statusListeners = new Set<() => void>()

function setStatus(next: RealtimeStatus) {
  if (status === next) return
  status = next
  for (const listener of statusListeners) listener()
}

function joinRoom(s: Socket, orderId: string) {
  // Penolakan (FORBIDDEN_ACTOR, VALIDATION_ERROR) dibiarkan: layar tetap jalan lewat REST.
  s.emit("order:join", { order_id: orderId })
}

function getSocket(): Socket {
  if (socket) return socket
  const s = io(publicEnv.NEXT_PUBLIC_SOCKET_URL, {
    autoConnect: false,
    auth: (cb) => cb({ token: getAccessToken() }),
  })
  s.on("connect", () => {
    authRetried = false
    setStatus("connected")
    // Room hilang setiap kali koneksi baru, jadi seluruh room yang terbuka di-join ulang.
    for (const orderId of rooms.keys()) joinRoom(s, orderId)
    if (everConnected) handlers?.onReconnect()
    everConnected = true
  })
  s.on("disconnect", (reason) => setStatus(reason === "io client disconnect" ? "idle" : "disconnected"))
  s.on("connect_error", (error) => {
    setStatus("disconnected")
    // Ditolak middleware (token kedaluwarsa saat sambung ulang): socket.io berhenti mencoba.
    // Refresh sekali lewat jalur single-flight sesi, lalu coba lagi dengan token baru.
    if (s.active || error.message !== "UNAUTHORIZED" || authRetried) return
    authRetried = true
    refreshSession().then(
      (ok) => {
        if (ok && getSessionStatus() === "authenticated") s.connect()
      },
      () => undefined,
    )
  })
  s.onAny((event: string, payload: unknown) => handlers?.onEvent(event, payload))
  socket = s
  return s
}

function syncWithSession() {
  const s = getSocket()
  if (getSessionStatus() === "authenticated") {
    if (!s.connected && !s.active) s.connect()
    return
  }
  if (s.connected || s.active) s.disconnect()
  // Akun berikutnya di tab ini mulai dari nol: koneksi pertamanya bukan "sambung ulang".
  everConnected = false
  setStatus("idle")
}

/** Dipasang sekali di Providers. Tersambung saat sesi aktif, putus saat logout. */
export function startRealtime(next: Handlers): () => void {
  if (typeof window === "undefined") return () => {}
  handlers = next
  syncWithSession()
  const unsubscribe = subscribeSession(syncWithSession)
  return () => {
    unsubscribe()
    handlers = null
  }
}

/**
 * Masuk room order supaya event status, penugasan, pesan, dan posisi sampai (usulan D baru:
 * client mengirim `order:join`, hanya bergabung, tidak mengubah state). Di-join ulang otomatis
 * setelah sambung ulang. Kembalian dipanggil saat layar ditutup.
 */
export function joinOrderRoom(orderId: string): () => void {
  rooms.set(orderId, (rooms.get(orderId) ?? 0) + 1)
  const s = getSocket()
  if (s.connected && rooms.get(orderId) === 1) joinRoom(s, orderId)
  return () => {
    const left = (rooms.get(orderId) ?? 1) - 1
    // shortcut: backend belum punya `order:leave`, jadi socket tetap di room sampai koneksi berikutnya.
    // Akibatnya hanya invalidasi kunci order yang sudah tidak tampil. Tambah event leave kalau mengganggu.
    if (left <= 0) rooms.delete(orderId)
    else rooms.set(orderId, left)
  }
}

/** Untuk konsumen yang butuh payload langsung: kartu tawaran dan penanda posisi (W5). */
export function onSocketEvent<E extends keyof ServerEvents>(event: E, handler: (payload: ServerEvents[E]) => void) {
  const s = getSocket()
  const listener = (payload: ServerEvents[E]) => handler(payload)
  s.on(event as string, listener)
  return () => {
    s.off(event as string, listener)
  }
}

export function getRealtimeStatus(): RealtimeStatus {
  return status
}

function subscribeRealtimeStatus(listener: () => void) {
  statusListeners.add(listener)
  return () => {
    statusListeners.delete(listener)
  }
}

/** Untuk indikator koneksi dan, di W3 dan W5, polling cadangan saat `disconnected`. */
export function useRealtimeStatus(): RealtimeStatus {
  return useSyncExternalStore(subscribeRealtimeStatus, getRealtimeStatus, () => "idle")
}

/** Hanya untuk unit test. */
export function resetRealtimeForTests() {
  socket = null
  handlers = null
  status = "idle"
  everConnected = false
  authRetried = false
  rooms.clear()
  statusListeners.clear()
}
