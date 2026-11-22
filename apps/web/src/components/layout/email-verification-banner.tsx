"use client"

import { useMutation } from "@tanstack/react-query"
import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { resendVerification } from "@/features/auth/api"
import { useMe } from "@/features/auth/queries"
import { ApiError } from "@/lib/api-client"
import { getErrorMessage, retryAfterMessage } from "@/lib/error-messages"

// D62: login dan menjelajah tetap boleh, banner tetap di atas halaman sampai email terverifikasi.
export function EmailVerificationBanner() {
  const { data: me } = useMe()
  const resend = useMutation({ mutationFn: resendVerification })

  if (!me || me.email_verified) return null

  const error = resend.error instanceof ApiError ? resend.error : null
  const feedback = resend.isSuccess
    ? `Email verifikasi dikirim ke ${me.email}.`
    : error
      ? (retryAfterMessage(error.retryAfterSeconds) ?? getErrorMessage(error.code))
      : `Cek kotak masuk ${me.email} untuk memverifikasi akunmu.`

  return (
    <div role="status" className="border-b border-warning-border bg-warning-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:px-6">
        <div className="flex flex-1 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warning-border text-warning">
            <TriangleAlert aria-hidden className="size-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="text-base font-semibold text-warning-title">Email kamu belum diverifikasi</p>
            <p className="text-sm text-warning-subtle-foreground">{feedback}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          loading={resend.isPending}
          disabled={resend.isSuccess}
          onClick={() => resend.mutate()}
        >
          Kirim ulang email verifikasi
        </Button>
      </div>
    </div>
  )
}
