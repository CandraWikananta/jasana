"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useId, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { MapPicker } from "@/components/shared/map-picker"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { describedBy, FieldError, FieldHint } from "@/features/auth/components/field-error"
import { FormAlert } from "@/features/auth/components/form-alert"
import { TextField } from "@/features/auth/components/text-field"
import { keepFieldFocus } from "@/features/auth/keep-field-focus"
import { ApiError } from "@/lib/api-error"
import type { AddressDto } from "@/types/api/address"
import { createAddress, updateAddress } from "../api"
import { applyFormError } from "../form-error"
import {
  addressFormSchema,
  mapAddressError,
  toAddressFormValues,
  toAddressInput,
  type AddressFormValues,
} from "../schemas"

export function AddressForm({
  address,
  onSaved,
  onGone,
  onCancel,
}: {
  /** null untuk alamat baru. */
  address: AddressDto | null
  onSaved: (saved: AddressDto) => Promise<void>
  /** Alamat yang diubah sudah dihapus, misalnya dari perangkat lain. */
  onGone: () => void
  onCancel: () => void
}) {
  const [formError, setFormError] = useState<string | null>(null)
  const id = useId()
  const formErrorRef = useRef<HTMLDivElement>(null)

  const {
    control,
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    mode: "onTouched",
    defaultValues: toAddressFormValues(address),
  })

  useEffect(() => setFocus("label"), [setFocus])

  useEffect(() => {
    if (formError) formErrorRef.current?.focus()
  }, [formError])

  const onSubmit = handleSubmit(async (values) => {
    if (!values.point) return
    setFormError(null)
    const input = toAddressInput(values, values.point)
    let saved: AddressDto
    try {
      saved = address ? await updateAddress(address.id, input) : await createAddress(input)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) onGone()
      else setFormError(applyFormError(error, mapAddressError, setError))
      return
    }
    await onSaved(saved)
  })

  return (
    <form
      onSubmit={onSubmit}
      onMouseDown={keepFieldFocus}
      noValidate
      aria-label={address ? "Ubah alamat" : "Tambah alamat"}
      aria-describedby={formError ? `${id}-form` : undefined}
      className="flex max-w-xl flex-col gap-5"
    >
      {formError && (
        <FormAlert tone="destructive" id={`${id}-form`} ref={formErrorRef}>
          {formError}
        </FormAlert>
      )}

      <TextField
        label="Nama alamat (opsional)"
        hint="Contohnya Rumah atau Kantor."
        error={errors.label?.message}
        field={register("label")}
        autoComplete="off"
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-line`} className="text-sm font-medium">
          Alamat lengkap
        </label>
        <Textarea
          id={`${id}-line`}
          rows={3}
          autoComplete="street-address"
          aria-invalid={errors.address_line ? true : undefined}
          aria-describedby={describedBy(`${id}-line-hint`, errors.address_line && `${id}-line-error`)}
          {...register("address_line")}
        />
        {/* Snapshot pesanan hanya menyalin teks ini (orders.service serviceLocation). */}
        <FieldHint id={`${id}-line-hint`}>
          Tulis jalan, nomor, dan daerahnya. Teks ini yang dilihat pekerja.
        </FieldHint>
        <FieldError id={`${id}-line-error`} message={errors.address_line?.message} />
      </div>

      <div role="group" aria-labelledby={`${id}-point`} className="flex flex-col gap-1.5">
        <p id={`${id}-point`} className="text-sm font-medium">
          Titik lokasi
        </p>
        <Controller
          control={control}
          name="point"
          render={({ field }) => (
            <MapPicker
              label="Peta titik lokasi alamat"
              value={field.value}
              onChange={field.onChange}
              ref={field.ref}
              invalid={Boolean(errors.point)}
              errorId={errors.point && `${id}-point-error`}
            />
          )}
        />
        <FieldError id={`${id}-point-error`} message={errors.point?.message} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Kecamatan (opsional)"
          error={errors.district?.message}
          field={register("district")}
          autoComplete="address-level3"
        />
        <TextField
          label="Kota atau kabupaten (opsional)"
          error={errors.city?.message}
          field={register("city")}
          autoComplete="address-level2"
        />
        <TextField
          label="Provinsi (opsional)"
          error={errors.province?.message}
          field={register("province")}
          autoComplete="address-level1"
        />
        <TextField
          label="Kode pos (opsional)"
          error={errors.postal_code?.message}
          field={register("postal_code")}
          inputMode="numeric"
          autoComplete="postal-code"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" size="lg" loading={isSubmitting}>
          {isSubmitting ? "Menyimpan…" : "Simpan alamat"}
        </Button>
        <Button type="button" size="lg" variant="ghost" disabled={isSubmitting} onClick={onCancel}>
          Batal
        </Button>
      </div>
    </form>
  )
}
