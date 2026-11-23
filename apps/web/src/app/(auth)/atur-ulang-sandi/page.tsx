import type { Metadata } from "next"
import { Suspense } from "react"
import { FormSkeleton } from "@/features/auth/components/form-skeleton"
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form"

export const metadata: Metadata = { title: "Atur ulang kata sandi", robots: { index: false } }

// Path sama dengan link di email backend (PRD 4.2, D259).
export default function AturUlangSandiPage() {
  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-h1 font-bold text-balance">Atur ulang kata sandi</h1>
        <p className="text-sm text-muted-foreground">Buat kata sandi baru untuk akunmu.</p>
      </div>
      {/* Token dibaca lewat useSearchParams, yang butuh batas Suspense (cacheComponents). */}
      <Suspense fallback={<FormSkeleton fields={["hint"]} />}>
        <ResetPasswordForm />
      </Suspense>
    </>
  )
}
