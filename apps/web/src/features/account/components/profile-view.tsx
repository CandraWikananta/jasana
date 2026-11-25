"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { ChevronRight, CircleCheck, TriangleAlert } from "lucide-react"
import Link from "next/link"
import { useEffect, useId, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { initials } from "@/components/layout/header-account"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FormAlert } from "@/features/auth/components/form-alert"
import { TextField } from "@/features/auth/components/text-field"
import { keepFieldFocus } from "@/features/auth/keep-field-focus"
import { useMe } from "@/features/auth/queries"
import { qk } from "@/lib/query-keys"
import type { Me } from "@/types/api/auth"
import { updateMe } from "../api"
import { applyFormError } from "../form-error"
import { mapProfileError, profileFormSchema, type ProfileFormValues } from "../schemas"
import { SettingsSection } from "./settings-section"

export function ProfileView() {
  // AreaGate sudah memastikan /auth/me ada sebelum isi halaman dirender.
  const { data: me } = useMe()
  if (!me) return null

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <SettingsSection title="Profil" description="Nama dan nomor ponsel di akunmu.">
        <div className="flex flex-col gap-6 p-4 md:p-6">
          <div className="flex items-center gap-4">
            {/* Inisial saja: backend belum punya jalur unggah avatar (PRD 12.1 nomor 10). */}
            <span
              aria-hidden
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-h3 font-semibold text-brand-subtle-foreground"
            >
              {initials(me.full_name)}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-base font-semibold break-words">{me.full_name}</p>
              <p className="text-sm break-words text-muted-foreground">{me.email}</p>
              {me.email_verified ? (
                <Badge tone="success" className="mt-1">
                  <CircleCheck aria-hidden />
                  Email terverifikasi
                </Badge>
              ) : (
                <Badge tone="warning" className="mt-1">
                  <TriangleAlert aria-hidden />
                  Email belum diverifikasi
                </Badge>
              )}
            </div>
          </div>
          <ProfileForm me={me} />
        </div>
      </SettingsSection>

      <SettingsSection title="Alamat" description="Alamat tersimpan untuk memesan jasa.">
        <SettingsLink href="/akun/alamat">Atur alamat</SettingsLink>
      </SettingsSection>

      <SettingsSection title="Keamanan" description="Email, kata sandi, dan perangkat aktif.">
        <SettingsLink href="/akun/keamanan">Atur keamanan akun</SettingsLink>
      </SettingsSection>
    </div>
  )
}

function SettingsLink({ href, children }: { href: "/akun/alamat" | "/akun/keamanan"; children: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-14 items-center justify-between gap-4 rounded-lg px-4 py-3 font-semibold outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset md:px-6"
    >
      <span className="min-w-0">{children}</span>
      <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  )
}

function ProfileForm({ me }: { me: Me }) {
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)
  const formErrorId = useId()
  const formErrorRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onTouched",
    defaultValues: { full_name: me.full_name, phone: me.phone },
  })

  useEffect(() => {
    if (formError) formErrorRef.current?.focus()
  }, [formError])

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const user = await updateMe(values)
      queryClient.setQueryData<Me>(qk.me, (current) => current && { ...current, ...user })
      // Nilai dari server: nama dirapikan dan nomor dinormalisasi ke +628…
      reset({ full_name: user.full_name, phone: user.phone })
      toast.success("Profil tersimpan.")
    } catch (error) {
      setFormError(applyFormError(error, mapProfileError, setError))
    }
  })

  return (
    <form
      onSubmit={onSubmit}
      onMouseDown={keepFieldFocus}
      noValidate
      aria-describedby={formError ? formErrorId : undefined}
      className="flex max-w-xl flex-col gap-5"
    >
      {formError && (
        <FormAlert tone="destructive" id={formErrorId} ref={formErrorRef}>
          {formError}
        </FormAlert>
      )}
      <TextField label="Nama lengkap" error={errors.full_name?.message} field={register("full_name")} autoComplete="name" />
      <TextField
        label="Nomor ponsel"
        hint="Bisa dipakai untuk masuk."
        error={errors.phone?.message}
        field={register("phone")}
        type="tel"
        autoComplete="tel"
      />
      <Button type="submit" size="lg" loading={isSubmitting} className="w-full sm:w-auto sm:self-start">
        {isSubmitting ? "Menyimpan…" : "Simpan profil"}
      </Button>
    </form>
  )
}
