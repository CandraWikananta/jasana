"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"
import { useForm, type UseFormRegisterReturn } from "react-hook-form"
import { LINK_CLASS } from "@/components/shared/link-class"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api-error"
import { UNKNOWN_ERROR_MESSAGE } from "@/lib/error-messages"
import { qk } from "@/lib/query-keys"
import { loginHref, safeNext } from "@/lib/safe-next"
import { login } from "@/lib/session"
import { useSessionStatus } from "@/lib/use-session-status"
import { register as registerAccount } from "../api"
import { mapRegisterError, registerFormSchema, toRegisterInput, type RegisterFormValues } from "../schemas"
import { describedBy, FieldError, FieldHint } from "./field-error"
import { FormAlert } from "./form-alert"
import { PasswordField } from "./password-input"

type Registered = { email: string; signedIn: boolean }

export function RegisterForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const status = useSessionStatus()
  const searchParams = useSearchParams()
  const next = safeNext(searchParams.get("next"))
  const destination = next ?? "/"

  const [formError, setFormError] = useState<string | null>(null)
  const [registered, setRegistered] = useState<Registered | null>(null)
  const formErrorId = useId()
  const formErrorRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    mode: "onTouched",
    defaultValues: { full_name: "", email: "", phone: "", password: "" },
  })

  useEffect(() => {
    if (formError) formErrorRef.current?.focus()
  }, [formError])

  // Formulir hilang setelah berhasil: fokus ke hasilnya, bukan jatuh ke body (DS 10).
  useEffect(() => {
    if (registered) resultRef.current?.focus()
  }, [registered])

  // Sudah masuk sebelum mendaftar: halaman ini tidak berguna, langsung ke tujuan. Setelah mendaftar
  // pengguna juga berstatus masuk (D260), tapi tetap melihat konfirmasi dulu.
  useEffect(() => {
    if (status === "authenticated" && !isSubmitting && !registered) router.replace(destination)
  }, [status, isSubmitting, registered, router, destination])

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    const input = toRegisterInput(values)
    try {
      await registerAccount(input)
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setFormError(UNKNOWN_ERROR_MESSAGE)
        return
      }
      const view = mapRegisterError(error)
      Object.entries(view.fields).forEach(([field, message], i) => {
        setError(field as keyof RegisterFormValues, { message }, { shouldFocus: i === 0 })
      })
      setFormError(view.form)
      return
    }

    // D260: register tidak mengembalikan token, jadi langsung masuk dengan kredensial yang sama. D62
    // membolehkan masuk sebelum email terverifikasi. Gagal masuk (misalnya batas 10 per 15 menit)
    // tidak menggagalkan pendaftaran yang sudah tercatat: pengguna diarahkan ke /masuk.
    let signedIn = false
    try {
      await login({ email: input.email, password: input.password })
      signedIn = true
      await queryClient.invalidateQueries({ queryKey: qk.me })
    } catch {
      signedIn = false
    }
    setRegistered({ email: input.email, signedIn })
  })

  if (registered) {
    return (
      <div className="flex flex-col gap-6">
        <FormAlert tone="success" title="Akunmu sudah dibuat" ref={resultRef}>
          Kami mengirim link verifikasi ke <span className="font-semibold break-words">{registered.email}</span>.{" "}
          {registered.signedIn
            ? "Sambil menunggu, kamu sudah bisa menjelajah."
            : "Masuk dengan email dan kata sandimu untuk melanjutkan."}
        </FormAlert>
        <Button asChild size="lg" className="w-full">
          {registered.signedIn ? <Link href={destination}>Lanjut</Link> : <Link href={loginHref(destination)}>Masuk</Link>}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={onSubmit}
        noValidate
        aria-describedby={formError ? formErrorId : undefined}
        className="flex flex-col gap-5"
      >
        {formError && (
          <FormAlert tone="destructive" id={formErrorId} ref={formErrorRef}>
            {formError}
          </FormAlert>
        )}

        <TextField label="Nama lengkap" error={errors.full_name?.message} field={register("full_name")} autoComplete="name" />
        <TextField
          label="Email"
          error={errors.email?.message}
          field={register("email")}
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
        />
        <TextField
          label="Nomor ponsel"
          hint="Contohnya 0812 3456 7890. Bisa dipakai untuk masuk."
          error={errors.phone?.message}
          field={register("phone")}
          type="tel"
          autoComplete="tel"
        />
        <PasswordField error={errors.password?.message} field={register("password")} />

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          {isSubmitting ? "Mendaftar…" : "Daftar"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href={next ? loginHref(next) : "/masuk"} className={LINK_CLASS}>
          Masuk
        </Link>
      </p>
    </div>
  )
}

function TextField({
  label,
  hint,
  error,
  field,
  ...inputProps
}: {
  label: string
  hint?: string
  error?: string
  field: UseFormRegisterReturn
} & Pick<React.ComponentProps<"input">, "type" | "autoComplete" | "autoCapitalize" | "spellCheck">) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint && `${id}-hint`, error && `${id}-error`)}
        {...inputProps}
        {...field}
      />
      {hint && <FieldHint id={`${id}-hint`}>{hint}</FieldHint>}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}
