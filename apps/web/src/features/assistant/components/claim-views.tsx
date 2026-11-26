import { ErrorState } from "@/components/shared/error-state"
import { FormAlert } from "@/features/auth/components/form-alert"
import { ApiError } from "@/lib/api-error"
import { UNKNOWN_ERROR_MESSAGE } from "@/lib/error-messages"

// Tampilan klaim sesi tamu (usulan D273), dipakai halaman /asisten dan panel widget.

/** Klaim gagal sementara (jaringan, 5xx, 429): sesi tamu masih tersimpan, jadi bisa dicoba lagi. */
export function ClaimFailed({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <ErrorState
        title="Percakapanmu belum tersimpan ke akun"
        message={`${error instanceof ApiError ? error.message : UNKNOWN_ERROR_MESSAGE} Percakapanmu masih tersimpan di tab ini.`}
        onRetry={onRetry}
      />
    </div>
  )
}

/** Percakapan tamu sudah berakhir atau kedaluwarsa, jadi tidak bisa diklaim. Pertanyaan yang tertahan sudah di kotak tulis. */
export function ClaimEndedNotice() {
  return (
    <FormAlert tone="info" title="Percakapan tamu sudah berakhir">
      Percakapan itu tidak bisa disimpan ke akunmu. Lanjutkan dengan percakapan baru di sini.
    </FormAlert>
  )
}
