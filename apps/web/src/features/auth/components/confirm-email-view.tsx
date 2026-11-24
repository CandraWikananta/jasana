"use client"

import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api-error"
import { UNKNOWN_ERROR_MESSAGE } from "@/lib/error-messages"
import { qk } from "@/lib/query-keys"
import { useSessionStatus } from "@/lib/use-session-status"
import { confirmEmailChange } from "../api"
import { isLinkTokenError, linkTokenMessage, readLinkToken } from "../schemas"
import { FormAlert } from "./form-alert"

type Outcome =
  | { kind: "done"; email: string }
  | { kind: "link-error"; error: ApiError | null }
  | { kind: "email-taken" }

// Halaman tempat penggantian email diajukan (PRD 4.2).
const ACCOUNT_HREF = "/akun/keamanan"

// D261: konfirmasi menunggu satu ketukan, bukan POST otomatis saat halaman dibuka (alasannya sama
// dengan verifikasi email). Link ini publik: token menentukan akunnya, bukan sesi di tab ini (D64).
export function ConfirmEmailView() {
  const token = readLinkToken(useSearchParams().get("token"))
  const status = useSessionStatus()
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

  async function confirm() {
    if (!token) return
    setFailure(null)
    setPending(true)
    try {
      const user = await confirmEmailChange(token)
      setOutcome({ kind: "done", email: user.email })
      if (status === "authenticated") void queryClient.invalidateQueries({ queryKey: qk.me })
    } catch (error) {
      if (!(error instanceof ApiError)) setFailure(UNKNOWN_ERROR_MESSAGE)
      else if (isLinkTokenError(error)) setOutcome({ kind: "link-error", error })
      // Alamat baru keburu dipakai akun lain selama 24 jam masa berlaku link (users.service emailTaken).
      else if (error.code === "VALIDATION_ERROR" && error.details.some((d) => d.path === "email")) {
        setOutcome({ kind: "email-taken" })
      } else setFailure(error.message)
    } finally {
      setPending(false)
    }
  }

  if (outcome?.kind === "done") {
    return (
      <div className="flex flex-col gap-6">
        <FormAlert tone="success" title="Email sudah diganti" ref={resultRef}>
          Email akunmu sekarang <span className="font-semibold break-words">{outcome.email}</span>. Pakai alamat ini
          untuk masuk berikutnya.
        </FormAlert>
        <Button asChild size="lg" className="w-full">
          {status === "authenticated" ? <Link href={ACCOUNT_HREF}>Lanjut</Link> : <Link href="/masuk">Masuk</Link>}
        </Button>
      </div>
    )
  }

  if (outcome) {
    const taken = outcome.kind === "email-taken"
    return (
      <div className="flex flex-col gap-6">
        <FormAlert
          tone="destructive"
          title={taken ? "Email sudah dipakai akun lain" : "Link tidak bisa dipakai"}
          ref={resultRef}
        >
          {taken
            ? "Emailmu tidak berubah. Ajukan penggantian dengan alamat lain dari halaman keamanan akun."
            : `${linkTokenMessage(outcome.error)} Ajukan penggantian lagi dari halaman keamanan akun.`}
        </FormAlert>
        <Button asChild size="lg" className="w-full">
          <Link href={ACCOUNT_HREF}>Buka keamanan akun</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {failure && (
        <FormAlert tone="destructive" ref={failureRef}>
          {failure}
        </FormAlert>
      )}
      <Button size="lg" className="w-full" loading={pending} onClick={() => void confirm()}>
        {pending ? "Mengonfirmasi…" : "Konfirmasi email"}
      </Button>
    </div>
  )
}
