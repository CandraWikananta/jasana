"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api-error"
import { getErrorMessage, retryAfterMessage, UNKNOWN_ERROR_MESSAGE } from "@/lib/error-messages"
import { qk } from "@/lib/query-keys"
import { useSessionStatus } from "@/lib/use-session-status"
import { resendVerification, verifyEmail } from "../api"
import { useMe } from "../queries"
import { isLinkTokenError, linkTokenMessage, readLinkToken } from "../schemas"
import { FormAlert } from "./form-alert"

type Outcome = { kind: "done" } | { kind: "link-error"; error: ApiError | null }

// D261: verifikasi menunggu satu ketukan, bukan POST otomatis saat halaman dibuka. Pemindai tautan
// di layanan email yang menjalankan JavaScript bisa menghabiskan token sekali pakai, dan StrictMode
// yang memanggil efek dua kali akan berujung TOKEN_ALREADY_USED.
export function VerifyEmailView() {
  const token = readLinkToken(useSearchParams().get("token"))
  const status = useSessionStatus()
  const { data: me } = useMe()
  const queryClient = useQueryClient()

  const [outcome, setOutcome] = useState<Outcome | null>(token ? null : { kind: "link-error", error: null })
  const [failure, setFailure] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const failureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fokus hanya ke hasil kiriman. Halaman yang dibuka tanpa token (error null) tidak merebut fokus.
    if (outcome && !(outcome.kind === "link-error" && outcome.error === null)) resultRef.current?.focus()
  }, [outcome])

  useEffect(() => {
    if (failure) failureRef.current?.focus()
  }, [failure])

  async function verify() {
    if (!token) return
    setFailure(null)
    setPending(true)
    try {
      await verifyEmail(token)
      setOutcome({ kind: "done" })
      // Banner "Email kamu belum diverifikasi" di header hilang tanpa memuat ulang.
      if (status === "authenticated") void queryClient.invalidateQueries({ queryKey: qk.me })
    } catch (error) {
      if (error instanceof ApiError && isLinkTokenError(error)) setOutcome({ kind: "link-error", error })
      else setFailure(error instanceof ApiError ? error.message : UNKNOWN_ERROR_MESSAGE)
    } finally {
      setPending(false)
    }
  }

  const signedIn = status === "authenticated"
  // Link sudah pernah dipakai, dan akun yang sedang masuk memang sudah terverifikasi: itu berhasil.
  const alreadyVerified = outcome?.kind === "link-error" && outcome.error?.code === "TOKEN_ALREADY_USED" && me?.email_verified

  if (outcome?.kind === "done" || alreadyVerified) {
    return (
      <div className="flex flex-col gap-6">
        <FormAlert tone="success" title="Email sudah terverifikasi" ref={resultRef}>
          Sekarang kamu bisa memesan jasa.
        </FormAlert>
        <Button asChild size="lg" className="w-full">
          {signedIn ? <Link href="/">Lanjut</Link> : <Link href="/masuk">Masuk</Link>}
        </Button>
      </div>
    )
  }

  if (outcome?.kind === "link-error") {
    return <LinkErrorRecovery error={outcome.error} signedIn={signedIn} email={me?.email ?? null} resultRef={resultRef} />
  }

  return (
    <div className="flex flex-col gap-5">
      {failure && (
        <FormAlert tone="destructive" ref={failureRef}>
          {failure}
        </FormAlert>
      )}
      <Button size="lg" className="w-full" loading={pending} onClick={() => void verify()}>
        {pending ? "Memverifikasi…" : "Verifikasi email"}
      </Button>
    </div>
  )
}

/** Link tidak bisa dipakai: yang sedang masuk bisa langsung minta link baru, tamu diminta masuk dulu. */
function LinkErrorRecovery({
  error,
  signedIn,
  email,
  resultRef,
}: {
  error: ApiError | null
  signedIn: boolean
  email: string | null
  resultRef: React.Ref<HTMLDivElement>
}) {
  const resend = useMutation({ mutationFn: resendVerification })
  const resendError = resend.error instanceof ApiError ? resend.error : null
  const sentRef = useRef<HTMLDivElement>(null)
  const resendErrorRef = useRef<HTMLDivElement>(null)

  // Tombol kirim ulang hilang atau galat muncul: fokus ikut pindah ke pesannya.
  useEffect(() => {
    if (resend.isSuccess) sentRef.current?.focus()
    else if (resend.isError) resendErrorRef.current?.focus()
  }, [resend.isSuccess, resend.isError])

  if (resend.isSuccess) {
    return (
      <FormAlert tone="success" title="Link baru sudah dikirim" ref={sentRef}>
        Cek kotak masuk {email ? <span className="font-semibold break-words">{email}</span> : "emailmu"}, juga folder spam.
      </FormAlert>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <FormAlert tone="destructive" title="Link tidak bisa dipakai" ref={resultRef}>
        {signedIn
          ? linkTokenMessage(error)
          : `${linkTokenMessage(error)} Masuk dulu, lalu tekan Kirim ulang email verifikasi di banner atas halaman.`}
      </FormAlert>
      {resendError && (
        <FormAlert tone="destructive" ref={resendErrorRef}>
          {retryAfterMessage(resendError.retryAfterSeconds) ?? getErrorMessage(resendError.code)}
        </FormAlert>
      )}
      {signedIn ? (
        <Button size="lg" className="w-full" loading={resend.isPending} onClick={() => resend.mutate()}>
          {resend.isPending ? "Mengirim…" : "Kirim ulang email verifikasi"}
        </Button>
      ) : (
        <Button asChild size="lg" className="w-full">
          <Link href="/masuk">Masuk</Link>
        </Button>
      )}
    </div>
  )
}
