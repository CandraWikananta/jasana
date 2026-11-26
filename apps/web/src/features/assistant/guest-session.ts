import { useSyncExternalStore } from "react"

// Sesi Asisten tamu (D77, PRD Frontend 5.15). guest_token adalah satu-satunya token yang boleh di storage
// browser (aturan web nomor 7), dan hanya sessionStorage: hilang bersama tab. Dipakai bersama halaman
// /asisten dan widget (W8b), jadi berupa store, bukan state komponen.
// Tidak dihapus saat login: klaim sesi (D77, usulan D273) membutuhkannya, lalu menghapusnya sendiri.

export interface GuestSession {
  sessionId: string
  token: string
  /** Tamu meninggalkan percakapan lewat Daftar atau Masuk: setelah klaim, widget membuka panelnya lagi. Bukan token. */
  resume?: boolean
}

const STORAGE_KEY = "jasana_asisten_tamu"

// undefined: belum dibaca. Setelah itu memori yang jadi acuan, sehingga percakapan tetap jalan selama
// tab terbuka walaupun storage diblokir browser.
let current: GuestSession | null | undefined
const listeners = new Set<() => void>()

function read(): GuestSession | null {
  try {
    const value: unknown = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "null")
    const { sessionId, token, resume } = (value ?? {}) as Partial<GuestSession>
    if (typeof sessionId !== "string" || typeof token !== "string") return null
    return resume === true ? { sessionId, token, resume } : { sessionId, token }
  } catch {
    return null
  }
}

export function getGuestSession(): GuestSession | null {
  if (typeof window === "undefined") return null
  if (current === undefined) current = read()
  return current
}

export function setGuestSession(next: GuestSession | null) {
  current = next
  try {
    if (next) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage diblokir atau penuh: percakapan tetap jalan dari memori.
  }
  for (const listener of listeners) listener()
}

/** Daftar atau Masuk ditekan dari percakapan. */
export function markGuestResume() {
  const session = getGuestSession()
  if (session && !session.resume) setGuestSession({ ...session, resume: true })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useGuestSession(): GuestSession | null {
  return useSyncExternalStore(subscribe, getGuestSession, () => null)
}

/** Hanya untuk unit test: seperti tab baru yang belum membaca storage. */
export function forgetGuestSessionForTests() {
  current = undefined
  listeners.clear()
}
