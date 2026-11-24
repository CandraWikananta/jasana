"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useId, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FormAlert } from "@/features/auth/components/form-alert"
import { PasswordField } from "@/features/auth/components/password-input"
import { keepFieldFocus } from "@/features/auth/keep-field-focus"
import { qk } from "@/lib/query-keys"
import { login, logout } from "@/lib/session"
import type { Me } from "@/types/api/auth"
import { changePassword } from "../api"
import { applyFormError } from "../form-error"
import { changePasswordFormSchema, mapChangePasswordError, type ChangePasswordFormValues } from "../schemas"
import { SettingsSection } from "./settings-section"

interface SectionProps {
  me: Me
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PasswordSection({ me, open, onOpenChange }: SectionProps) {
  const queryClient = useQueryClient()
  const [signedOut, setSignedOut] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const signedOutRef = useRef<HTMLDivElement>(null)

  const close = () => {
    flushSync(() => onOpenChange(false))
    buttonRef.current?.focus()
  }

  useEffect(() => {
    if (signedOut) signedOutRef.current?.focus()
  }, [signedOut])

  // D262: server mencabut SEMUA sesi termasuk yang ini (H65), jadi frontend langsung masuk lagi
  // dengan kata sandi baru, pola D260. Gagal masuk (429, jaringan) tidak menggagalkan penggantian yang
  // sudah tercatat: pengguna diminta masuk sendiri. Access token lama masih hidup sebentar, jadi
  // halaman ini tidak langsung tertutup dan pesannya sempat terbaca.
  async function handleChanged(newPassword: string) {
    try {
      await login({ email: me.email, password: newPassword })
    } catch {
      setSignedOut(true)
      onOpenChange(false)
      return
    }
    toast.success("Kata sandi diganti dan perangkat lain sudah keluar.")
    close()
    await queryClient.invalidateQueries({ queryKey: qk.sessions })
  }

  return (
    <SettingsSection title="Kata sandi" description="Dipakai bersama email atau nomor ponselmu untuk masuk.">
      <div className="flex flex-col gap-5 p-4 md:p-6">
        {signedOut ? (
          <>
            <FormAlert tone="success" title="Kata sandi sudah diganti" ref={signedOutRef}>
              Masuk lagi dengan kata sandi barumu untuk melanjutkan.
            </FormAlert>
            <Button
              size="lg"
              className="w-full sm:w-auto sm:self-start"
              loading={leaving}
              onClick={() => {
                setLeaving(true)
                // Setelah sesi dihapus, AreaGate yang mengalihkan ke /masuk.
                void logout().catch(() => undefined)
              }}
            >
              Masuk
            </Button>
          </>
        ) : open ? (
          <ChangePasswordForm email={me.email} onChanged={handleChanged} onCancel={close} />
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 text-sm text-muted-foreground">
              Kalau kata sandi diganti, perangkat lain harus masuk lagi.
            </p>
            <Button ref={buttonRef} variant="outline" className="self-start sm:self-auto" onClick={() => onOpenChange(true)}>
              Ganti kata sandi
            </Button>
          </div>
        )}
      </div>
    </SettingsSection>
  )
}

function ChangePasswordForm({
  email,
  onChanged,
  onCancel,
}: {
  email: string
  onChanged: (newPassword: string) => Promise<void>
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
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    mode: "onTouched",
    defaultValues: { current_password: "", new_password: "" },
  })

  useEffect(() => setFocus("current_password"), [setFocus])

  useEffect(() => {
    if (formError) formErrorRef.current?.focus()
  }, [formError])

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await changePassword(values)
    } catch (error) {
      setFormError(applyFormError(error, mapChangePasswordError, setError))
      return
    }
    await onChanged(values.new_password)
  })

  return (
    <form
      onSubmit={onSubmit}
      onMouseDown={keepFieldFocus}
      noValidate
      aria-label="Ganti kata sandi"
      aria-describedby={formError ? formErrorId : undefined}
      className="flex max-w-xl flex-col gap-5"
    >
      {/* Pengelola kata sandi memakai ini untuk memperbarui entri akun yang tepat. */}
      <input type="text" name="username" autoComplete="username" value={email} readOnly hidden />
      {formError && (
        <FormAlert tone="destructive" id={formErrorId} ref={formErrorRef}>
          {formError}
        </FormAlert>
      )}
      <PasswordField
        label="Kata sandi saat ini"
        autoComplete="current-password"
        error={errors.current_password?.message}
        field={register("current_password")}
      />
      <PasswordField label="Kata sandi baru" error={errors.new_password?.message} field={register("new_password")} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" size="lg" loading={isSubmitting}>
          {isSubmitting ? "Menyimpan…" : "Simpan kata sandi"}
        </Button>
        <Button type="button" size="lg" variant="ghost" disabled={isSubmitting} onClick={onCancel}>
          Batal
        </Button>
      </div>
    </form>
  )
}
