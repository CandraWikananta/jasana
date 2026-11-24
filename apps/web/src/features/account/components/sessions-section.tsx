"use client"

import { Monitor, MonitorSmartphone, Smartphone } from "lucide-react"
import { useEffect, useRef, useState } from "react"
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
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FormAlert } from "@/features/auth/components/form-alert"
import { ApiError } from "@/lib/api-error"
import { getErrorMessage, UNKNOWN_ERROR_MESSAGE } from "@/lib/error-messages"
import { logout } from "@/lib/session"
import { formatTanggalJam } from "@/lib/time"
import type { ActiveSession } from "@/types/api/auth"
import { logoutAll } from "../api"
import { useSessions } from "../queries"
import { describeUserAgent } from "../user-agent"
import { SettingsSection } from "./settings-section"

export function SessionsSection() {
  return (
    <SettingsSection title="Perangkat aktif" description="Perangkat yang sedang masuk ke akunmu.">
      <SessionList />
      <div className="border-t border-border p-4 md:px-6">
        <LogoutAllDialog />
      </div>
    </SettingsSection>
  )
}

function SessionList() {
  const { data, error, isPending, refetch } = useSessions()

  if (isPending) return <SessionSkeleton />
  if (!data) {
    const code = error instanceof ApiError ? error.code : null
    return <ErrorState message={getErrorMessage(code)} onRetry={() => void refetch()} />
  }
  if (data.length === 0) {
    return (
      <EmptyState
        icon={MonitorSmartphone}
        title="Tidak ada perangkat aktif"
        description="Perangkat muncul di sini setelah masuk ke akunmu."
      />
    )
  }
  return (
    <ul className="divide-y divide-border">
      {data.map((session) => (
        <SessionRow key={session.session_id} session={session} />
      ))}
    </ul>
  )
}

// GET /auth/sessions tidak menandai sesi pemanggil, jadi tidak ada label "Perangkat ini": menebak dari
// user agent bisa menandai perangkat orang lain yang memakai browser yang sama.
function SessionRow({ session }: { session: ActiveSession }) {
  const { label, mobile } = describeUserAgent(session.user_agent)
  const Icon = mobile ? Smartphone : Monitor
  return (
    <li className="flex items-start gap-4 px-4 py-4 md:px-6">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon aria-hidden className="size-5" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">Terakhir aktif {formatTanggalJam(session.last_used_at)}</p>
        <p className="text-sm text-muted-foreground">Masuk {formatTanggalJam(session.signed_in_at)}</p>
        {session.ip_address && (
          <p className="text-sm break-words text-muted-foreground tabular-nums">Alamat IP {session.ip_address}</p>
        )}
      </div>
    </li>
  )
}

function SessionSkeleton() {
  return (
    <div className="divide-y divide-border" aria-busy="true" aria-label="Memuat perangkat">
      {[0, 1].map((i) => (
        <div key={i} className="flex items-start gap-4 px-4 py-4 md:px-6">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-0.5">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-full max-w-72" />
            <Skeleton className="h-5 w-full max-w-64" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Konfirmasi wajib (DS 10). Setelah server mencabut semua sesi, logout() menghapus cookie browser ini
// dan AreaGate mengalihkan ke /masuk.
function LogoutAllDialog() {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const failureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (failure) failureRef.current?.focus()
  }, [failure])

  async function confirm() {
    setFailure(null)
    setPending(true)
    try {
      await logoutAll()
    } catch (error) {
      setFailure(error instanceof ApiError ? error.message : UNKNOWN_ERROR_MESSAGE)
      setPending(false)
      return
    }
    await logout().catch(() => undefined)
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return
        setFailure(null)
        setOpen(next)
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="outline">Keluar dari semua perangkat</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Keluar dari semua perangkat?</AlertDialogTitle>
          <AlertDialogDescription>
            Semua perangkat harus masuk lagi, termasuk yang sedang kamu pakai.
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
            {pending ? "Mengeluarkan…" : "Keluar dari semua"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
