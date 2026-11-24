"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useEffect, useId, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { LINK_CLASS } from "@/components/shared/link-class"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api-error"
import { UNKNOWN_ERROR_MESSAGE } from "@/lib/error-messages"
import { forgotPassword } from "../api"
import { keepFieldFocus } from "../keep-field-focus"
import { forgotPasswordFormSchema, mapForgotPasswordError, type ForgotPasswordFormValues } from "../schemas"
import { describedBy, FieldError } from "./field-error"
import { FormAlert } from "./form-alert"

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const emailId = useId()
  const formErrorId = useId()
  const formErrorRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    mode: "onTouched",
    defaultValues: { email: "" },
  })

  useEffect(() => {
    if (formError) formErrorRef.current?.focus()
  }, [formError])

  useEffect(() => {
    if (sentTo) resultRef.current?.focus()
  }, [sentTo])

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null)
    const address = email.trim().toLowerCase()
    try {
      await forgotPassword(address)
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setFormError(UNKNOWN_ERROR_MESSAGE)
        return
      }
      const view = mapForgotPasswordError(error)
      if (view.fields.email) setError("email", { message: view.fields.email }, { shouldFocus: true })
      setFormError(view.form)
      return
    }
    setSentTo(address)
  })

  // Balasan server sama untuk email terdaftar dan tidak, jadi kalimatnya juga bersyarat (PRD 4.2).
  if (sentTo) {
    return (
      <div className="flex flex-col gap-6">
        <FormAlert tone="success" title="Cek emailmu" ref={resultRef}>
          Kalau <span className="font-semibold break-words">{sentTo}</span> terdaftar, link untuk membuat kata sandi
          baru sudah dikirim ke sana. Cek juga folder spam.
        </FormAlert>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => {
            setSentTo(null)
            // Formulir baru dirender di klik ini, jadi fokus dipindah setelah React menggambarnya.
            requestAnimationFrame(() => setFocus("email", { shouldSelect: true }))
          }}
        >
          Kirim ke email lain
        </Button>
        <BackToLogin />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
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

        <div className="flex flex-col gap-1.5">
          <label htmlFor={emailId} className="text-sm font-medium">
            Email
          </label>
          <Input
            id={emailId}
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy(errors.email && `${emailId}-error`)}
            {...register("email")}
          />
          <FieldError id={`${emailId}-error`} message={errors.email?.message} />
        </div>

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          {isSubmitting ? "Mengirim…" : "Kirim link"}
        </Button>
      </form>
      <BackToLogin />
    </div>
  )
}

function BackToLogin() {
  return (
    <p className="text-center text-sm text-muted-foreground">
      Sudah ingat?{" "}
      <Link href="/masuk" className={LINK_CLASS}>
        Kembali ke halaman masuk
      </Link>
    </p>
  )
}
