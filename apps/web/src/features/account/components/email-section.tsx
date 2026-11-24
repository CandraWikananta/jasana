"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useId, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FormAlert } from "@/features/auth/components/form-alert"
import { PasswordField } from "@/features/auth/components/password-input"
import { TextField } from "@/features/auth/components/text-field"
import { keepFieldFocus } from "@/features/auth/keep-field-focus"
import { ApiError } from "@/lib/api-error"
import { UNKNOWN_ERROR_MESSAGE } from "@/lib/error-messages"
import { qk } from "@/lib/query-keys"
import type { Me } from "@/types/api/auth"
import { cancelEmailChange, requestEmailChange } from "../api"
import { applyFormError } from "../form-error"
import { changeEmailFormSchema, mapChangeEmailError, type ChangeEmailFormValues } from "../schemas"
import { SettingsSection } from "./settings-section"

interface SectionProps {
  me: Me
  open: boolean
  onOpenChange: (open: boolean) => void
}

// D64: alamat lama tetap dipakai sampai yang baru dikonfirmasi. Permintaan baru menimpa yang lama,
// jadi formulir tetap bisa dibuka selama masih menunggu.
export function EmailSection({ me, open, onOpenChange }: SectionProps) {
  const queryClient = useQueryClient()
  const focusBanner = useRef(false)
  const bannerRef = useRef<HTMLDivElement>(null)
  const cancelErrorRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const close = () => {
    flushSync(() => onOpenChange(false))
    buttonRef.current?.focus()
  }

  const cancel = useMutation({
    mutationFn: cancelEmailChange,
    onSuccess: ({ cancelled }) => {
      queryClient.setQueryData<Me>(qk.me, (current) => current && { ...current, pending_email: null })
      if (cancelled) toast.success("Penggantian email dibatalkan.")
      else {
        // Link-nya keburu dikonfirmasi: email akun sendiri sudah berubah, jadi dibaca ulang.
        toast.info("Tidak ada penggantian email yang menunggu.")
        void queryClient.invalidateQueries({ queryKey: qk.me })
      }
      buttonRef.current?.focus()
    },
  })

  // Formulir hilang setelah berhasil: fokus ke banner yang menggantikannya (DS 10). Sekali saja, karena
  // efek berjalan lagi saat halaman ini ditampilkan kembali.
  useEffect(() => {
    if (!focusBanner.current || open || !me.pending_email) return
    focusBanner.current = false
    bannerRef.current?.focus()
  }, [open, me.pending_email])

  useEffect(() => {
    if (cancel.isError) cancelErrorRef.current?.focus()
  }, [cancel.isError])

  function handleRequested(pendingEmail: string) {
    queryClient.setQueryData<Me>(qk.me, (current) => current && { ...current, pending_email: pendingEmail })
    focusBanner.current = true
    onOpenChange(false)
  }

  return (
    <SettingsSection title="Email" description="Untuk masuk dan menerima kabar pesanan.">
      <div className="flex flex-col gap-5 p-4 md:p-6">
        {me.pending_email && (
          <FormAlert
            tone="info"
            title={
              <>
                Menunggu konfirmasi di <span className="break-words">{me.pending_email}</span>
              </>
            }
            ref={bannerRef}
          >
            <p>Buka link yang kami kirim ke alamat itu. Sampai dikonfirmasi, email lamamu tetap dipakai.</p>
            {/* Disembunyikan saat formulir terbuka: permintaan baru menimpa yang lama, dan "Batal" milik formulir. */}
            {!open && (
              <Button variant="outline" className="mt-3" loading={cancel.isPending} onClick={() => cancel.mutate()}>
                {cancel.isPending ? "Membatalkan…" : "Batalkan"}
              </Button>
            )}
          </FormAlert>
        )}
        {cancel.isError && me.pending_email && !open && (
          <FormAlert tone="destructive" ref={cancelErrorRef}>
            {cancel.error instanceof ApiError ? cancel.error.message : UNKNOWN_ERROR_MESSAGE}
          </FormAlert>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 font-semibold break-words">{me.email}</p>
          {!open && (
            <Button
              ref={buttonRef}
              variant="outline"
              className="self-start sm:self-auto"
              onClick={() => {
                cancel.reset()
                onOpenChange(true)
              }}
            >
              Ganti email
            </Button>
          )}
        </div>
        {open && <ChangeEmailForm onRequested={handleRequested} onCancel={close} />}
      </div>
    </SettingsSection>
  )
}

function ChangeEmailForm({
  onRequested,
  onCancel,
}: {
  onRequested: (pendingEmail: string) => void
  onCancel: () => void
}) {
  const [formError, setFormError] = useState<string | null>(null)
  const formErrorId = useId()
  const formErrorRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(changeEmailFormSchema),
    mode: "onTouched",
    defaultValues: { new_email: "", current_password: "" },
  })

  useEffect(() => setFocus("new_email"), [setFocus])

  useEffect(() => {
    if (formError) formErrorRef.current?.focus()
  }, [formError])

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const result = await requestEmailChange(values)
      onRequested(result.pending_email)
    } catch (error) {
      setFormError(applyFormError(error, mapChangeEmailError, setError))
    }
  })

  return (
    <form
      onSubmit={onSubmit}
      onMouseDown={keepFieldFocus}
      noValidate
      aria-label="Ganti email"
      aria-describedby={formError ? formErrorId : undefined}
      className="flex max-w-xl flex-col gap-5"
    >
      {formError && (
        <FormAlert tone="destructive" id={formErrorId} ref={formErrorRef}>
          {formError}
        </FormAlert>
      )}
      <TextField
        label="Email baru"
        error={errors.new_email?.message}
        field={register("new_email")}
        type="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
      />
      <PasswordField
        label="Kata sandi saat ini"
        autoComplete="current-password"
        error={errors.current_password?.message}
        field={register("current_password")}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" size="lg" loading={isSubmitting}>
          {isSubmitting ? "Mengirim…" : "Kirim link konfirmasi"}
        </Button>
        <Button type="button" size="lg" variant="ghost" disabled={isSubmitting} onClick={onCancel}>
          Batal
        </Button>
      </div>
    </form>
  )
}
