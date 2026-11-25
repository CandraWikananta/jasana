"use client"

import { useQueryClient } from "@tanstack/react-query"
import { MapPin, MapPinCheck, Plus } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { toast } from "sonner"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FormAlert } from "@/features/auth/components/form-alert"
import { ApiError } from "@/lib/api-error"
import { getErrorMessage, UNKNOWN_ERROR_MESSAGE } from "@/lib/error-messages"
import { qk } from "@/lib/query-keys"
import type { AddressDto } from "@/types/api/address"
import { deleteAddress, updateAddress } from "../api"
import { useAddresses } from "../queries"
import { AddressForm } from "./address-form"
import { SettingsSection } from "./settings-section"

const ADD_ID = "tambah-alamat"
const editId = (id: string) => `ubah-alamat-${id}`
const focusById = (id: string) => document.getElementById(id)?.focus()

const GONE_MESSAGE = "Alamat ini sudah tidak ada."
const isGone = (error: unknown) => error instanceof ApiError && error.status === 404
const messageOf = (error: unknown) => (error instanceof ApiError ? error.message : UNKNOWN_ERROR_MESSAGE)
/** Alamat tanpa nama dikenali dari teksnya. */
const nameOf = (address: AddressDto) => address.label ?? address.address_line

export function AddressesView() {
  const queryClient = useQueryClient()
  const { data, error, isPending, refetch } = useAddresses()
  // Satu formulir terbuka, supaya paling banyak satu tombol primary di layar (DS P2).
  const [open, setOpen] = useState<"new" | (string & {}) | null>(null)
  // D263: formulir ditutup saat halaman ditinggalkan, karena Next menyimpan halaman lama tersembunyi.
  useEffect(() => () => setOpen(null), [])

  const reload = () => queryClient.invalidateQueries({ queryKey: qk.addresses })

  function close(focusId: string) {
    flushSync(() => setOpen(null))
    focusById(focusId)
  }

  async function handleSaved(saved: AddressDto) {
    await reload()
    close(editId(saved.id))
    toast.success("Alamat tersimpan.")
  }

  function handleGone() {
    toast.error(GONE_MESSAGE)
    close(ADD_ID)
    void reload()
  }

  const addButton = (
    <Button id={ADD_ID} onClick={() => setOpen("new")}>
      <Plus aria-hidden />
      Tambah alamat
    </Button>
  )
  const newForm = (
    <div className="p-4 md:p-6">
      <AddressForm address={null} onSaved={handleSaved} onGone={handleGone} onCancel={() => close(ADD_ID)} />
    </div>
  )

  return (
    <SettingsSection title="Alamat tersimpan" description="Pilih salah satunya saat memesan jasa.">
      {isPending ? (
        <AddressSkeleton />
      ) : !data ? (
        <ErrorState
          message={getErrorMessage(error instanceof ApiError ? error.code : null)}
          onRetry={() => void refetch()}
        />
      ) : data.length === 0 ? (
        open === "new" ? (
          newForm
        ) : (
          <EmptyState
            icon={MapPin}
            title="Belum ada alamat"
            description="Simpan alamat rumah atau kantormu, jadi tidak perlu diisi lagi saat memesan."
            action={addButton}
          />
        )
      ) : (
        <>
          <ul className="divide-y divide-border">
            {data.map((address) => (
              <li key={address.id} className="p-4 md:px-6">
                {open === address.id ? (
                  <div className="md:py-2">
                    <AddressForm
                      address={address}
                      onSaved={handleSaved}
                      onGone={handleGone}
                      onCancel={() => close(editId(address.id))}
                    />
                  </div>
                ) : (
                  <AddressRow
                    address={address}
                    isOnly={data.length === 1}
                    showActions={open === null}
                    onEdit={() => setOpen(address.id)}
                    onChanged={reload}
                  />
                )}
              </li>
            ))}
          </ul>
          {open === null && <div className="border-t border-border p-4 md:px-6">{addButton}</div>}
          {open === "new" && <div className="border-t border-border">{newForm}</div>}
        </>
      )}
    </SettingsSection>
  )
}

function AddressRow({
  address,
  isOnly,
  showActions,
  onEdit,
  onChanged,
}: {
  address: AddressDto
  isOnly: boolean
  showActions: boolean
  onEdit: () => void
  onChanged: () => Promise<void>
}) {
  const [pending, setPending] = useState(false)
  const name = nameOf(address)
  const area = [address.district, address.city, address.province, address.postal_code].filter(Boolean).join(", ")

  async function makeDefault() {
    setPending(true)
    try {
      await updateAddress(address.id, { is_default: true })
      await onChanged()
      toast.success(`${address.label ?? "Alamat ini"} jadi alamat utama.`)
      // Tombolnya hilang bersama tanda utama yang lama, jadi fokus pindah ke sebelahnya.
      focusById(editId(address.id))
    } catch (error) {
      toast.error(isGone(error) ? GONE_MESSAGE : messageOf(error))
      if (isGone(error)) void onChanged()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex min-h-7 flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="min-w-0 text-base font-semibold break-words">{name}</h3>
          {address.is_default && (
            <Badge tone="outline">
              <MapPinCheck aria-hidden />
              Alamat utama
            </Badge>
          )}
        </div>
        {address.label && <p className="max-w-lg text-sm break-words">{address.address_line}</p>}
        {area && <p className="max-w-lg text-sm break-words text-muted-foreground">{area}</p>}
      </div>
      {showActions && (
        <div className="flex flex-wrap gap-2">
          <Button id={editId(address.id)} variant="outline" onClick={onEdit}>
            Ubah<span className="sr-only"> {name}</span>
          </Button>
          {!address.is_default && (
            <Button variant="outline" loading={pending} onClick={() => void makeDefault()}>
              {pending ? "Menyimpan…" : "Jadikan utama"}
              <span className="sr-only"> {name}</span>
            </Button>
          )}
          <DeleteDialog address={address} isOnly={isOnly} onDeleted={onChanged} />
        </div>
      )}
    </div>
  )
}

function DeleteDialog({
  address,
  isOnly,
  onDeleted,
}: {
  address: AddressDto
  isOnly: boolean
  onDeleted: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const failureRef = useRef<HTMLDivElement>(null)
  const deleted = useRef(false)

  useEffect(() => {
    if (failure) failureRef.current?.focus()
  }, [failure])

  async function confirm() {
    setFailure(null)
    setPending(true)
    try {
      await deleteAddress(address.id)
      toast.success("Alamat dihapus.")
    } catch (error) {
      if (!isGone(error)) {
        setFailure(messageOf(error))
        setPending(false)
        return
      }
      toast.error(GONE_MESSAGE)
    }
    deleted.current = true
    setOpen(false)
    await onDeleted()
    setPending(false)
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return
        // Di HP toast dari aksi sebelumnya menutupi tombol konfirmasi di dialog bawah.
        if (next) toast.dismiss()
        setFailure(null)
        setOpen(next)
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="ghost">
          Hapus<span className="sr-only"> {nameOf(address)}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        onCloseAutoFocus={(event) => {
          if (!deleted.current) return
          // Baris dan tombol pemicunya ikut hilang.
          event.preventDefault()
          focusById(ADD_ID)
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus alamat {address.label ?? "ini"}?</AlertDialogTitle>
          <AlertDialogDescription>
            {address.is_default && !isOnly
              ? "Alamat terbarumu yang lain jadi alamat utama. Pesanan yang sudah dibuat tidak berubah."
              : "Alamat ini tidak bisa dipilih lagi saat memesan. Pesanan yang sudah dibuat tidak berubah."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {failure && (
          <FormAlert tone="destructive" ref={failureRef}>
            {failure}
          </FormAlert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <Button variant="destructive" loading={pending} onClick={() => void confirm()}>
            {pending ? "Menghapus…" : "Hapus alamat"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function AddressSkeleton() {
  return (
    <div className="divide-y divide-border" aria-busy="true" aria-label="Memuat alamat">
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-4 p-4 md:px-6">
          <div className="flex flex-col gap-0.5">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-5 w-full max-w-72" />
            <Skeleton className="h-5 w-full max-w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-11 w-20" />
            <Skeleton className="h-11 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}
