import type { Metadata } from "next"
import { Suspense } from "react"
import { FormSkeleton } from "@/features/auth/components/form-skeleton"
import { VerifyEmailView } from "@/features/auth/components/verify-email-view"

export const metadata: Metadata = { title: "Verifikasi email", robots: { index: false } }

// Path sama dengan link di email backend (PRD 4.2, D259).
export default function VerifikasiEmailPage() {
  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-h1 font-bold text-balance">Verifikasi email</h1>
        <p className="text-sm text-muted-foreground">Pastikan email ini milikmu supaya kamu bisa memesan jasa.</p>
      </div>
      {/* Token dibaca lewat useSearchParams, yang butuh batas Suspense (cacheComponents). */}
      <Suspense fallback={<FormSkeleton />}>
        <VerifyEmailView />
      </Suspense>
    </>
  )
}
