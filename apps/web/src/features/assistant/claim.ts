"use client"

import { useQueryClient, type QueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { ApiError } from "@/lib/api-error"
import { qk } from "@/lib/query-keys"
import { useSessionStatus } from "@/lib/use-session-status"
import { claimSession } from "./api"
import { getAssistantState, updateAssistant } from "./assistant-store"
import type { ConversationMessage } from "./conversation"
import { getGuestSession, setGuestSession, useGuestSession } from "./guest-session"

// Klaim sesi tamu ke akun (D77, usulan D273). Selama sesi tamu belum diklaim, pengguna yang sudah masuk
// tidak bisa membukanya: untuk riwayat dan kirim pesan JWT menang atas token tamu, dan sesinya milik
// tamu, jadi server menjawab 404. Karena itu klaim selesai dulu sebelum percakapan ditampilkan.

/** Bentuk guest_token dari server (chat.controller). Token lain dijawab 401, yang bagi apiFetch berarti sesi akun berakhir. */
const GUEST_TOKEN_FORMAT = /^[0-9a-f]{64}$/

/**
 * claimed: sesi jadi milik akun ini. taken: sudah milik akun (tab duplikat yang lebih dulu mengklaim, atau
 * akun lain); dibuka sebagai akun, dan server yang memutuskan boleh tidaknya. gone: berakhir, kedaluwarsa,
 * atau tidak dikenal lagi, jadi tidak bisa dibuka siapa pun. retry: sementara; sesi tamu disimpan.
 */
export type ClaimKind = "claimed" | "taken" | "gone"
export type ClaimOutcome = { kind: ClaimKind; sessionId: string; resume: boolean } | { kind: "retry"; error: unknown } | { kind: "none" }

export function classifyClaimError(error: unknown): ClaimKind | "retry" {
  if (!(error instanceof ApiError)) return "retry"
  if (error.code === "CHAT_SESSION_ALREADY_CLAIMED") return "taken"
  if (error.code === "CHAT_SESSION_ENDED" || error.status === 404) return "gone"
  return "retry"
}

/**
 * Pertanyaan yang ditolak batas tamu (atau rem harian tamu) tidak tersimpan di server, padahal setelah masuk
 * yang berlaku batas akun. Hanya kalau ia pesan terakhir: setelahnya pengguna sudah bertanya hal lain.
 */
export function heldDraft(messages: readonly ConversationMessage[] | undefined): string {
  const last = messages?.at(-1)
  const kind = last?.failure?.kind
  return last?.role === "USER" && (kind === "limit" || kind === "resting") ? last.content : ""
}

let inflight: Promise<ClaimOutcome> | null = null

/** Single-flight per tab: halaman, widget, dan efek ganda StrictMode berbagi satu permintaan. */
export function runGuestClaim(queryClient: QueryClient): Promise<ClaimOutcome> {
  inflight ??= claimOnce(queryClient).finally(() => {
    inflight = null
  })
  return inflight
}

async function claimOnce(queryClient: QueryClient): Promise<ClaimOutcome> {
  const guest = getGuestSession()
  if (!guest) return { kind: "none" }
  const key = qk.chat.messages("guest", guest.sessionId)

  let kind: ClaimKind
  if (!GUEST_TOKEN_FORMAT.test(guest.token)) {
    kind = "gone"
  } else {
    try {
      await claimSession(guest.sessionId, guest.token)
      kind = "claimed"
    } catch (error) {
      const resolved = classifyClaimError(error)
      if (resolved === "retry") return { kind: "retry", error }
      kind = resolved
    }
  }

  const draft = heldDraft(queryClient.getQueryData<ConversationMessage[]>(key))
  queryClient.removeQueries({ queryKey: key, exact: true })
  setGuestSession(null)
  updateAssistant({
    accountSessionId: kind === "gone" ? null : guest.sessionId,
    handoffDraft: draft || getAssistantState().handoffDraft,
    claimEnded: kind === "gone",
  })
  return { kind, sessionId: guest.sessionId, resume: guest.resume === true }
}

/**
 * Menjalankan klaim selama pengguna sudah masuk dan tab ini masih menyimpan sesi tamu. `pending`: tampilkan
 * kerangka, bukan percakapan. `failed`: klaim gagal sementara, sesi tamu masih tersimpan untuk dicoba lagi.
 */
export function useGuestClaim(onOutcome?: (outcome: Extract<ClaimOutcome, { kind: ClaimKind }>) => void) {
  const queryClient = useQueryClient()
  const status = useSessionStatus()
  const guest = useGuestSession()
  const pending = status === "authenticated" && guest !== null
  const [failure, setFailure] = useState<{ error: unknown } | null>(null)
  const [attempt, setAttempt] = useState(0)
  const callback = useRef(onOutcome)
  useEffect(() => {
    callback.current = onOutcome
  })

  useEffect(() => {
    if (!pending) return
    let live = true
    void runGuestClaim(queryClient).then((outcome) => {
      if (outcome.kind === "retry") {
        if (live) setFailure({ error: outcome.error })
      } else if (outcome.kind !== "none") {
        // Tetap dipanggil walau komponennya sudah dilepas: isinya hanya menulis store.
        callback.current?.(outcome)
      }
    })
    return () => {
      live = false
    }
  }, [pending, attempt, queryClient])

  return {
    pending,
    /** Galat klaim yang gagal sementara, null kalau tidak gagal. */
    failure: pending ? (failure?.error ?? null) : null,
    retry: () => {
      setFailure(null)
      setAttempt((n) => n + 1)
    },
  }
}
