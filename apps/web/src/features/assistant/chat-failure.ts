import { ApiError } from "@/lib/api-error"
import { getErrorMessage, RATE_LIMITED_MESSAGE, retryAfterMessage, UNKNOWN_ERROR_MESSAGE } from "@/lib/error-messages"
import type { ChatScope } from "./api"

// Kode error chat (PRD Frontend Lampiran A, register D161 sampai D163, D170) ke perilaku layar.
export type ChatFailureKind =
  /** Kuota tamu habis: kotak tulis diganti ajakan mendaftar. */
  | "limit"
  /** Rem harian tamu: pesan tidak tersimpan, mengulang hari ini percuma. */
  | "resting"
  /** Gemini gagal: pesan pengguna SUDAH tersimpan dan kuota terpotong (D161). */
  | "gemini"
  /** Percakapannya sudah tidak bisa ditulisi: hanya bisa mulai baru. */
  | "ended"
  /** Isi pesan ditolak: dikembalikan ke kotak tulis. */
  | "invalid"
  /** Sementara (429, jaringan, 5xx): bisa dikirim lagi. */
  | "retry"

export interface ChatFailure {
  kind: ChatFailureKind
  message: string
}

export function resolveChatFailure(error: unknown, scope: ChatScope): ChatFailure {
  if (!(error instanceof ApiError)) return { kind: "retry", message: UNKNOWN_ERROR_MESSAGE }
  const message = getErrorMessage(error.code)
  const ended: ChatFailure = { kind: "ended", message: getErrorMessage("CHAT_SESSION_ENDED") }
  switch (error.code) {
    case "GUEST_CHAT_LIMIT_REACHED":
      return { kind: "limit", message }
    case "CHATBOT_TEMPORARILY_UNAVAILABLE":
      return { kind: "resting", message }
    case "GEMINI_UNAVAILABLE":
      return { kind: "gemini", message }
    case "CHAT_SESSION_ENDED":
    case "CHAT_SESSION_ALREADY_CLAIMED":
      return { kind: "ended", message }
    // Sesi hilang atau token tamu tidak dikenal lagi. Pesan "Silakan masuk lagi" dari peta salah arti untuk tamu.
    case "NOT_FOUND":
      return ended
    case "UNAUTHORIZED":
      return scope === "guest" ? ended : { kind: "retry", message }
    case "VALIDATION_ERROR":
      return { kind: "invalid", message }
    case "RATE_LIMIT_EXCEEDED": {
      const wait = retryAfterMessage(error.retryAfterSeconds)
      return { kind: "retry", message: wait ? `${RATE_LIMITED_MESSAGE} ${wait}` : message }
    }
    default:
      return { kind: "retry", message }
  }
}

/** Pesan dari peta menjadi judul dan isi banner DS 1.4b: kalimat pertama, lalu sisanya. */
export function splitMessage(message: string): { title: string; body: string } {
  const end = message.indexOf(". ")
  if (end === -1) return { title: message.replace(/\.$/, ""), body: "" }
  return { title: message.slice(0, end), body: message.slice(end + 2) }
}
