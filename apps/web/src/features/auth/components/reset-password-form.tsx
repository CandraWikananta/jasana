"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api-error"
import { UNKNOWN_ERROR_MESSAGE } from "@/lib/error-messages"
import { getSessionStatus, hasSessionFlag, logout } from "@/lib/session"
import { resetPassword } from "../api"
import { keepFieldFocus } from "../keep-field-focus"
import {
  isLinkTokenError,
  linkTokenMessage,
  mapResetPasswordError,
  readLinkToken,
  resetPasswordFormSchema,
  type ResetPasswordFormValues,
} from "../schemas"
import { FormAlert } from "./form-alert"
import { PasswordField } from "./password-input"

type Outcome = { kind: "done" } | { kind: "link-error"; error: ApiError | null }

export function ResetPasswordForm() {
  const token = readLinkToken(useSearchParams().get("token"))
  const [outcome, setOutcome] = useState<Outcome | null>(token ? null : { kind: "link-error", error: null })
  const [formError, setFormError] = useState<string | null>(null)
  const formErrorId = useId()
  const formErrorRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    mode: "onTouched",
    defaultValues: { password: "" },
  })

  useEffect(() => {
    if (formError) formErrorRef.current?.focus()
  }, [formError])

  useEffect(() => {
    // Fokus hanya ke hasil kiriman. Halaman yang dibuka tanpa token (error null) tidak merebut fokus.
    if (outcome && !(outcome.kind === "link-error" && outcome.error === null)) resultRef.current?.focus()
  }, [outcome])

  const onSubmit = handleSubmit(async ({ password }) => {
    if (!token) return
    setFormError(null)
    try {
      await resetPassword(token, password)
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setFormError(UNKNOWN_ERROR_MESSAGE)
        return
      }
      if (isLinkTokenError(error)) {
        setOutcome({ kind: "link-error", error })
        return
      }
      const view = mapResetPasswordError(error)
      if (view.fields.password) setError("password", { message: view.fields.password }, { shouldFocus: true })
      setFormError(view.form)
      return
    }
    // Server sudah mencabut seluruh sesi akun itu (H65). Kalau tab ini sedang masuk, sesinya juga
    // dibuang di sini (cookie dihapus Route Handler apa pun jawaban API), supaya tidak tampil masuk
    // sampai access token di memori habis. Akun yang masuk di tab ini bisa saja akun lain: tetap
    // dikeluarkan, karena pengguna akan masuk lagi dengan kata sandi baru.
    if (getSessionStatus() === "authenticated" || hasSessionFlag()) await logout().catch(() => undefined)
    setOutcome({ kind: "done" })
  })

  if (outcome?.kind === "done") {
    return (
      <div className="flex flex-col gap-6">
        <FormAlert tone="success" title="Kata sandi sudah diganti" ref={resultRef}>
          Kamu sudah dikeluarkan dari semua perangkat. Masuk lagi dengan kata sandi barumu.
        </FormAlert>
        <Button asChild size="lg" className="w-full">
          <Link href="/masuk">Masuk</Link>
        </Button>
      </div>
    )
  }

  if (outcome?.kind === "link-error") {
    return (
      <div className="flex flex-col gap-6">
        <FormAlert tone="destructive" title="Link tidak bisa dipakai" ref={resultRef}>
          {linkTokenMessage(outcome.error)}
        </FormAlert>
        <Button asChild size="lg" className="w-full">
          <Link href="/lupa-sandi">Minta link baru</Link>
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      onMouseDown={keepFieldFocus}
      noValidate
      aria-describedby={formError ? formErrorId : undefined}
      className="flex flex-col gap-5"
    >
      {formError && (
        <FormAlert tone="destructive" id={formErrorId} ref={formErrorRef}>
          {formError}
        </FormAlert>
      )}

      <PasswordField label="Kata sandi baru" error={errors.password?.message} field={register("password")} />

      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        {isSubmitting ? "Menyimpan…" : "Simpan kata sandi"}
      </Button>
    </form>
  )
}
