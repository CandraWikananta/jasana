import { useSyncExternalStore } from "react"
import { getSessionStatus, subscribeSession, type SessionStatus } from "@/lib/session"

// State Asisten yang dipakai bersama halaman /asisten dan widget (usulan D271): hanya di memori tab, tidak
// pernah di storage. Percakapan tamu sudah bersama lewat guest-session.ts; yang di sini untuk akun dan
// serah terima antarbagian.

export interface AssistantState {
  /** Panel widget (md ke atas). Di sini, bukan state komponen, supaya tetap terbuka saat pindah layout. */
  panelOpen: boolean
  /** Percakapan akun yang sedang dibuka widget. Halaman /asisten tetap memakai ?percakapan= (D270). */
  accountSessionId: string | null
  /** Teks untuk kotak tulis percakapan yang dipasang berikutnya: dari panel ke halaman penuh, atau pesan yang tertahan batas tamu (usulan D273). */
  handoffDraft: string
  /** Klaim tidak mungkin karena percakapan tamunya sudah berakhir: percakapan akun baru menyebutnya sekali. */
  claimEnded: boolean
}

const INITIAL: AssistantState = { panelOpen: false, accountSessionId: null, handoffDraft: "", claimEnded: false }

let state = INITIAL
const listeners = new Set<() => void>()

export function getAssistantState(): AssistantState {
  return state
}

export function updateAssistant(patch: Partial<AssistantState>) {
  state = { ...state, ...patch }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useAssistantState(): AssistantState {
  return useSyncExternalStore(subscribe, getAssistantState, () => INITIAL)
}

// Keluar: percakapan akun dan draf tidak boleh tertinggal untuk orang berikutnya di tab ini (pola H149).
let lastStatus: SessionStatus | null = null
function onSessionChange() {
  const status = getSessionStatus()
  if (lastStatus === "authenticated" && status === "guest") state = { ...INITIAL }
  lastStatus = status
  for (const listener of listeners) listener()
}
if (typeof window !== "undefined") {
  lastStatus = getSessionStatus()
  subscribeSession(onSessionChange)
}

/** Hanya untuk unit test. */
export function resetAssistantForTests(status: SessionStatus | null = null) {
  state = INITIAL
  lastStatus = status
  listeners.clear()
}

/** Hanya untuk unit test: sama dengan perubahan status sesi. */
export const notifySessionChangeForTests = onSessionChange
