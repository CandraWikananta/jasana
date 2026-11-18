import { QueryClient } from "@tanstack/react-query"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { qk } from "./query-keys"
import { createRealtimeHandlers, invalidationsFor } from "./socket-events"

// Socket palsu: cukup untuk memicu event bawaan socket.io-client (connect, disconnect,
// connect_error) dan mencatat yang dikirim client.
type Listener = (...args: unknown[]) => void
class FakeSocket {
  connected = false
  active = false
  emitted: [string, unknown][] = []
  connectCalls = 0
  disconnectCalls = 0
  private listeners = new Map<string, Listener[]>()
  private anyListeners: Listener[] = []
  constructor(readonly opts: { auth: (cb: (data: unknown) => void) => void }) {}
  on(event: string, fn: Listener) {
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), fn])
    return this
  }
  off(event: string, fn: Listener) {
    this.listeners.set(event, (this.listeners.get(event) ?? []).filter((l) => l !== fn))
    return this
  }
  onAny(fn: Listener) {
    this.anyListeners.push(fn)
    return this
  }
  emit(event: string, payload: unknown) {
    this.emitted.push([event, payload])
    return this
  }
  connect() {
    this.connectCalls++
    this.active = true
    return this
  }
  disconnect() {
    this.disconnectCalls++
    this.active = false
    this.connected = false
    this.fire("disconnect", "io client disconnect")
    return this
  }
  /** Mensimulasikan kejadian dari server atau jaringan. */
  fire(event: string, ...args: unknown[]) {
    if (event === "connect") this.connected = true
    for (const fn of this.listeners.get(event) ?? []) fn(...args)
  }
  serverEvent(event: string, payload: unknown) {
    for (const fn of this.anyListeners) fn(event, payload)
    for (const fn of this.listeners.get(event) ?? []) fn(payload)
  }
  authToken(): unknown {
    let token: unknown
    this.opts.auth((data) => (token = (data as { token: unknown }).token))
    return token
  }
}

const state = vi.hoisted(() => ({
  socket: null as unknown,
  status: "authenticated" as "unknown" | "authenticated" | "guest",
  token: "token-1" as string | null,
  listeners: new Set<() => void>(),
  refresh: (() => Promise.resolve(true)) as () => Promise<boolean>,
}))

vi.mock("socket.io-client", () => ({
  io: (_url: string, opts: ConstructorParameters<typeof FakeSocket>[0]) => {
    state.socket = new FakeSocket(opts)
    return state.socket
  },
}))

vi.mock("./session", () => ({
  getAccessToken: () => state.token,
  getSessionStatus: () => state.status,
  refreshSession: () => state.refresh(),
  subscribeSession: (fn: () => void) => {
    state.listeners.add(fn)
    return () => state.listeners.delete(fn)
  },
}))

const { getRealtimeStatus, joinOrderRoom, resetRealtimeForTests, startRealtime } = await import("./socket")

const fake = () => state.socket as FakeSocket
const setSession = (status: typeof state.status) => {
  state.status = status
  for (const fn of state.listeners) fn()
}

/** QueryClient dengan satu query per kunci, supaya invalidasi bisa diperiksa. */
function seededClient() {
  const client = new QueryClient()
  const keys = {
    list: qk.orders.list({ as: "client" }),
    detail: qk.orders.detail("o-1"),
    messages: qk.orders.messages("o-1"),
    worker: qk.worker.orders,
    notifications: qk.notifications,
    listing: qk.listings.detail("l-1"),
    me: qk.me,
  }
  for (const key of Object.values(keys)) client.setQueryData(key, { ok: true })
  const invalidated = () =>
    Object.entries(keys)
      .filter(([, key]) => client.getQueryState(key)?.isInvalidated)
      .map(([name]) => name)
  return { client, invalidated }
}

describe("klien Socket.IO", () => {
  let stop: () => void = () => {}

  beforeEach(() => {
    vi.stubGlobal("window", {})
    resetRealtimeForTests()
    state.status = "authenticated"
    state.token = "token-1"
    state.listeners.clear()
    state.refresh = () => Promise.resolve(true)
  })

  afterEach(() => {
    stop()
    vi.unstubAllGlobals()
  })

  it("tersambung saat sesi aktif, putus saat logout", () => {
    stop = startRealtime({ onEvent: () => {}, onReconnect: () => {} })
    expect(fake().connectCalls).toBe(1)
    fake().fire("connect")
    expect(getRealtimeStatus()).toBe("connected")

    setSession("guest")
    expect(fake().disconnectCalls).toBe(1)
    expect(getRealtimeStatus()).toBe("idle")
  })

  it("tamu tidak membuka koneksi", () => {
    state.status = "guest"
    stop = startRealtime({ onEvent: () => {}, onReconnect: () => {} })
    expect(fake().connectCalls).toBe(0)
  })

  it("pergantian token tidak memaksa sambung ulang, callback auth membaca token terbaru", () => {
    stop = startRealtime({ onEvent: () => {}, onReconnect: () => {} })
    fake().fire("connect")
    state.token = "token-2" // refresh sesi: status tetap authenticated, listener tidak terpicu
    expect(fake().disconnectCalls).toBe(0)
    expect(fake().connectCalls).toBe(1)
    expect(fake().authToken()).toBe("token-2")
  })

  it("koneksi pertama tidak menginvalidasi, sambung ulang menginvalidasi order, tawaran, pesan, notifikasi", () => {
    const { client, invalidated } = seededClient()
    stop = startRealtime(createRealtimeHandlers(client))

    fake().fire("connect")
    expect(invalidated()).toEqual([])

    fake().fire("disconnect", "transport close")
    expect(getRealtimeStatus()).toBe("disconnected")
    fake().fire("connect")
    expect(invalidated()).toEqual(["list", "detail", "messages", "worker", "notifications"])
  })

  it("akun baru setelah logout: koneksi pertamanya bukan sambung ulang", () => {
    const onReconnect = vi.fn()
    stop = startRealtime({ onEvent: () => {}, onReconnect })
    fake().fire("connect")
    setSession("guest")
    setSession("authenticated")
    fake().fire("connect")
    expect(onReconnect).not.toHaveBeenCalled()
  })

  it("room order di-join ulang setelah sambung ulang, dan berhenti setelah dilepas", () => {
    stop = startRealtime({ onEvent: () => {}, onReconnect: () => {} })
    fake().fire("connect")
    const leave = joinOrderRoom("o-1")
    expect(fake().emitted).toEqual([["order:join", { order_id: "o-1" }]])

    fake().fire("disconnect", "transport close")
    fake().fire("connect")
    expect(fake().emitted).toHaveLength(2)
    expect(fake().emitted[1]).toEqual(["order:join", { order_id: "o-1" }])

    leave()
    fake().fire("disconnect", "transport close")
    fake().fire("connect")
    expect(fake().emitted).toHaveLength(2)
  })

  it("dua pemakai satu room: tetap di-join selama masih ada pemakai", () => {
    stop = startRealtime({ onEvent: () => {}, onReconnect: () => {} })
    const a = joinOrderRoom("o-1")
    joinOrderRoom("o-1")
    a()
    fake().fire("connect")
    expect(fake().emitted).toEqual([["order:join", { order_id: "o-1" }]])
  })

  it("ditolak middleware karena token: refresh sekali lalu sambung lagi", async () => {
    const refresh = vi.fn(() => Promise.resolve(true))
    state.refresh = refresh
    stop = startRealtime({ onEvent: () => {}, onReconnect: () => {} })
    fake().active = false
    fake().fire("connect_error", new Error("UNAUTHORIZED"))
    fake().fire("connect_error", new Error("UNAUTHORIZED"))
    await Promise.resolve()
    await Promise.resolve()
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(fake().connectCalls).toBe(2)
    expect(getRealtimeStatus()).toBe("disconnected")
  })

  it("refresh gagal: tidak mencoba lagi", async () => {
    state.refresh = () => Promise.resolve(false)
    stop = startRealtime({ onEvent: () => {}, onReconnect: () => {} })
    fake().active = false
    fake().fire("connect_error", new Error("UNAUTHORIZED"))
    await Promise.resolve()
    await Promise.resolve()
    expect(fake().connectCalls).toBe(1)
  })

  it("event server diteruskan ke invalidasi", () => {
    const { client, invalidated } = seededClient()
    stop = startRealtime(createRealtimeHandlers(client))
    fake().serverEvent("order:message", { order_id: "o-1" })
    expect(invalidated()).toEqual(["messages"])
  })
})

describe("invalidationsFor (PRD Frontend 7.3)", () => {
  it.each([
    ["order:status_changed", { order_id: "o-1", to_status: "PAID" }, [qk.orders.lists, qk.worker.orders, qk.orders.detail("o-1")]],
    ["order:status_changed", { order_id: "o-1", to_status: "SETTLED" }, [qk.orders.lists, qk.worker.orders, qk.orders.detail("o-1"), qk.wallet]],
    ["order:status_changed", { order_id: "o-1", to_status: "REFUNDED" }, [qk.orders.lists, qk.worker.orders, qk.orders.detail("o-1"), qk.wallet]],
    ["order:assignment_changed", { order_id: "o-1" }, [qk.orders.detail("o-1"), qk.worker.orders]],
    ["order:message", { order_id: "o-1" }, [qk.orders.messages("o-1")]],
    ["order:offer", { order_id: "o-1" }, [qk.worker.orders, qk.orders.lists]],
    ["order:offer_closed", { order_id: "o-1", reason: "CLAIMED" }, [qk.worker.orders, qk.orders.lists]],
    ["notification:new", { id: "1" }, [qk.notifications]],
    ["order:location_update", { order_id: "o-1", latitude: 0, longitude: 0 }, []],
    ["event:tak_dikenal", {}, []],
  ])("%s %j", (event, payload, expected) => {
    expect(invalidationsFor(event, payload)).toEqual(expected)
  })
})
