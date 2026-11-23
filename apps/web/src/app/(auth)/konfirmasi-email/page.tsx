import type { Metadata } from "next"
import { Suspense } from "react"
import { ConfirmEmailView } from "@/features/auth/components/confirm-email-view"
import { FormSkeleton } from "@/features/auth/components/form-skeleton"

export const metadata: Metadata = { title: "Konfirmasi email baru", robots: { index: false } }

// Path sama dengan link di email backend (PRD 4.2, D259).
export default function KonfirmasiEmailPage() {
  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-h1 font-bold text-balance">Konfirmasi email baru</h1>
        <p className="text-sm text-muted-foreground">Jadikan alamat baru ini email akunmu.</p>
      </div>
      {/* Token dibaca lewat useSearchParams, yang butuh batas Suspense (cacheComponents). */}
      <Suspense fallback={<FormSkeleton />}>
        <ConfirmEmailView />
      </Suspense>
    </>
  )
}
