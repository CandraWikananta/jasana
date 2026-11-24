"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { LINK_CLASS } from "@/components/shared/link-class"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api-error"
import { UNKNOWN_ERROR_MESSAGE } from "@/lib/error-messages"
import { qk } from "@/lib/query-keys"
import { safeNext } from "@/lib/safe-next"
import { login } from "@/lib/session"
import { useSessionStatus } from "@/lib/use-session-status"
import { cn } from "@/lib/utils"
import { keepFieldFocus } from "../keep-field-focus"
import { loginFormSchema, mapLoginError, toLoginInput, type LoginFormValues } from "../schemas"
import { describedBy, FieldError } from "./field-error"
import { FormAlert } from "./form-alert"
import { PasswordInput } from "./password-input"

export function LoginForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const status = useSessionStatus()
  const searchParams = useSearchParams()
  const next = safeNext(searchParams.get("next"))
  const destination = next ?? "/"

  const [formError, setFormError] = useState<string | null>(null)
  // Bukan isSubmitSuccessful: react-hook-form menganggap submit berhasil walau galat API sudah
  // ditangkap di bawah, sehingga tombol tetap memutar setelah kata sandi salah.
  const [redirecting, setRedirecting] = useState(false)
  const identifierId = useId()
  const passwordId = useId()
  const formErrorId = useId()
  const formErrorRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    mode: "onTouched",
    defaultValues: { identifier: "", password: "" },
  })

  // DS 10: setelah kirim gagal tanpa field yang salah (401, 429, jaringan), fokus ke ringkasan error di atas
  // formulir. Error per field difokuskan react-hook-form (shouldFocusError dan setError shouldFocus).
  useEffect(() => {
    if (formError) formErrorRef.current?.focus()
  }, [formError])

  // Sudah masuk (misalnya /masuk dibuka lagi dari riwayat): langsung ke tujuan.
  useEffect(() => {
    if (status === "authenticated" && !isSubmitting && !redirecting) router.replace(destination)
  }, [status, isSubmitting, redirecting, router, destination])

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login(toLoginInput(values))
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setFormError(UNKNOWN_ERROR_MESSAGE)
        return
      }
      const view = mapLoginError(error)
      Object.entries(view.fields).forEach(([field, message], i) => {
        setError(field as keyof LoginFormValues, { message }, { shouldFocus: i === 0 })
      })
      setFormError(view.form)
      return
    }
    setRedirecting(true)
    await queryClient.invalidateQueries({ queryKey: qk.me })
    router.replace(destination)
  })

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
          <label htmlFor={identifierId} className="text-sm font-medium">
            Email atau nomor ponsel
          </label>
          <Input
            id={identifierId}
            // Satu isian untuk email atau nomor ponsel: bukan type="email". "username" dipasangkan pengelola kata
            // sandi dengan current-password (DS 6.1b, baris Identitas masuk).
            type="text"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={errors.identifier ? true : undefined}
            aria-describedby={describedBy(errors.identifier && `${identifierId}-error`)}
            {...register("identifier")}
          />
          <FieldError id={`${identifierId}-error`} message={errors.identifier?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={passwordId} className="text-sm font-medium">
              Kata sandi
            </label>
            {/* Padding vertikal dikembalikan margin negatif: area sentuh 44 px tanpa menggeser baris label. */}
            <Link href="/lupa-sandi" className={cn(LINK_CLASS, "-my-3 py-3 text-sm")}>
              Lupa kata sandi?
            </Link>
          </div>
          <PasswordInput
            id={passwordId}
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={describedBy(errors.password && `${passwordId}-error`)}
            {...register("password")}
          />
          <FieldError id={`${passwordId}-error`} message={errors.password?.message} />
        </div>

        <Button type="submit" size="lg" loading={isSubmitting || redirecting} className="w-full">
          {isSubmitting || redirecting ? "Masuk…" : "Masuk"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href={next ? `/daftar?next=${encodeURIComponent(next)}` : "/daftar"} className={LINK_CLASS}>
          Daftar
        </Link>
      </p>
    </div>
  )
}
