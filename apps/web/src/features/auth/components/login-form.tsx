"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { CircleX, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useId, useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api-error"
import { UNKNOWN_ERROR_MESSAGE } from "@/lib/error-messages"
import { qk } from "@/lib/query-keys"
import { safeNext } from "@/lib/safe-next"
import { login } from "@/lib/session"
import { useSessionStatus } from "@/lib/use-session-status"
import { loginFormSchema, mapLoginError, toLoginInput, type LoginFormValues } from "../schemas"

const linkClass =
  "rounded-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="flex items-center gap-1.5 text-sm text-destructive">
      <CircleX aria-hidden className="size-4 shrink-0" />
      {message}
    </p>
  )
}

export function LoginForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const status = useSessionStatus()
  const searchParams = useSearchParams()
  const destination = safeNext(searchParams.get("next")) ?? "/"

  const [formError, setFormError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  // Bukan isSubmitSuccessful: react-hook-form menganggap submit berhasil walau galat API sudah
  // ditangkap di bawah, sehingga tombol tetap memutar setelah kata sandi salah.
  const [redirecting, setRedirecting] = useState(false)
  const identifierId = useId()
  const passwordId = useId()
  const formErrorId = useId()

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
      for (const [field, message] of Object.entries(view.fields)) {
        setError(field as keyof LoginFormValues, { message })
      }
      setFormError(view.form)
      return
    }
    setRedirecting(true)
    await queryClient.invalidateQueries({ queryKey: qk.me })
    router.replace(destination)
  })

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-describedby={formError ? formErrorId : undefined}
      className="flex flex-col gap-5"
    >
      {formError && (
        <div
          id={formErrorId}
          role="alert"
          className="flex items-start gap-3 rounded-md border border-destructive-border bg-destructive-surface p-3 text-sm text-destructive-subtle-foreground"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-destructive-border text-destructive">
            <CircleX aria-hidden className="size-4" />
          </span>
          <p className="pt-1">{formError}</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={identifierId} className="text-sm font-medium">
          Email atau nomor ponsel
        </label>
        <Input
          id={identifierId}
          autoComplete="username"
          inputMode="email"
          aria-invalid={errors.identifier ? true : undefined}
          aria-describedby={errors.identifier ? `${identifierId}-error` : undefined}
          {...register("identifier")}
        />
        <FieldError id={`${identifierId}-error`} message={errors.identifier?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={passwordId} className="text-sm font-medium">
            Kata sandi
          </label>
          <Link href="/lupa-sandi" className={`text-sm ${linkClass}`}>
            Lupa kata sandi?
          </Link>
        </div>
        <div className="relative">
          <Input
            id={passwordId}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="pr-12"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? `${passwordId}-error` : undefined}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            aria-pressed={showPassword}
            className="absolute top-0 right-0 flex size-11 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {showPassword ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
          </button>
        </div>
        <FieldError id={`${passwordId}-error`} message={errors.password?.message} />
      </div>

      <Button type="submit" size="lg" loading={isSubmitting || redirecting} className="w-full">
        Masuk
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/daftar" className={linkClass}>
          Daftar
        </Link>
      </p>
    </form>
  )
}
