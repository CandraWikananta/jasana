"use client"

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Point } from "@/lib/geo"
import { qk } from "@/lib/query-keys"
import { listMessages, listSessions, sendMessage, SESSIONS_PER_PAGE, startSession, type ChatScope, type ChatTarget } from "./api"
import { resolveChatFailure } from "./chat-failure"
import { addSending, applyFailure, applyReply, type ConversationMessage } from "./conversation"

export interface SendInput {
  content: string
  point: Point | null
  /** Pesan gagal yang dikirim ulang. */
  replaceIds?: string[]
}

interface ConversationOptions {
  scope: ChatScope
  /** null: percakapan baru yang sesinya belum dibuat. */
  target: ChatTarget | null
  onSessionStart: (started: ChatTarget) => void
}

let localCount = 0

/**
 * Satu percakapan. Sesi dibuat saat pesan pertama, bukan saat halaman dibuka, supaya sesi kosong tidak
 * ikut terhitung di data penelitian (usulan D270).
 */
export function useConversation({ scope, target, onSessionStart }: ConversationOptions) {
  const queryClient = useQueryClient()
  const keyOf = (sessionId: string | null) => qk.chat.messages(scope, sessionId)

  const history = useQuery<ConversationMessage[]>({
    queryKey: keyOf(target?.sessionId ?? null),
    queryFn: () => listMessages(target!),
    enabled: target !== null,
    // Cache memuat pesan yang sedang dikirim, jadi tidak boleh ditimpa muat ulang otomatis.
    staleTime: Infinity,
  })

  // Seluruh tulisan cache di mutationFn, bukan di callback komponen: jawaban tetap tercatat kalau
  // halaman ditinggalkan selagi menunggu. Tanpa retry, karena setiap percobaan memakan kuota Gemini.
  const send = useMutation({
    retry: false,
    mutationFn: async ({ content, point, replaceIds }: SendInput) => {
      const id = `lokal-${++localCount}`
      let sessionId = target?.sessionId ?? null
      const patch = (change: (messages: ConversationMessage[]) => ConversationMessage[]) =>
        queryClient.setQueryData<ConversationMessage[]>(keyOf(sessionId), (messages = []) => change(messages))

      patch((messages) => addSending(messages, id, content, replaceIds))
      try {
        let active = target
        if (!active) {
          active = await startSession(scope)
          const draft = queryClient.getQueryData<ConversationMessage[]>(keyOf(null)) ?? []
          sessionId = active.sessionId
          // Cache diisi sebelum sesinya diumumkan: begitu target berubah, query riwayat aktif, dan tanpa isi ia
          // memuat riwayat kosong dari server lalu menimpa pesan yang sedang dikirim.
          patch(() => draft)
          onSessionStart(active)
        }
        const result = await sendMessage(active, {
          content,
          ...(point ? { latitude: point.lat, longitude: point.lng } : {}),
        })
        patch((messages) => applyReply(messages, id, result, point !== null))
      } catch (error) {
        patch((messages) => applyFailure(messages, id, resolveChatFailure(error, scope)))
      } finally {
        // Isi percakapan baru sudah pindah ke kunci sesinya.
        if (!target && sessionId !== null) queryClient.removeQueries({ queryKey: keyOf(null), exact: true })
        if (scope === "account") void queryClient.invalidateQueries({ queryKey: qk.chat.sessions })
      }
    },
  })

  /** Membuang pesan yang tidak pernah terkirim dari layar. */
  const discard = (id: string) =>
    queryClient.setQueryData<ConversationMessage[]>(keyOf(target?.sessionId ?? null), (messages = []) =>
      messages.filter((m) => m.id !== id),
    )

  return { history, messages: history.data ?? [], send: send.mutate, discard }
}

/** Riwayat percakapan akun, terbaru dulu. Kuncinya memuat id pengguna, supaya tidak tampil ke akun lain di tab yang sama. */
export function useChatSessions(userId: string | undefined, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: [...qk.chat.sessions, userId],
    queryFn: ({ pageParam }) => listSessions(pageParam),
    initialPageParam: 1,
    getNextPageParam: ({ meta }, pages) =>
      pages.length * SESSIONS_PER_PAGE < (meta?.total ?? 0) ? pages.length + 1 : undefined,
    enabled: enabled && userId !== undefined,
    staleTime: 0,
  })
}
