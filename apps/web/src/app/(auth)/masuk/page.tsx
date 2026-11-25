import type { Metadata } from "next"
import { Suspense } from "react"
import { ResetOnLeave } from "@/components/shared/reset-on-leave"
import { FormSkeleton } from "@/features/auth/components/form-skeleton"
import { LoginForm } from "@/features/auth/components/login-form"

export const metadata: Metadata = { title: "Masuk", robots: { index: false } }

export default function MasukPage() {
  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-h1 font-bold text-balance">Masuk</h1>
        <p className="text-sm text-muted-foreground">Pesan jasa dan pantau pesananmu dari satu akun.</p>
      </div>
      {/* useSearchParams di LoginForm butuh batas Suspense (cacheComponents). */}
      <Suspense fallback={<FormSkeleton fields={["plain", "plain"]} footer />}>
        <ResetOnLeave>
          <LoginForm />
        </ResetOnLeave>
      </Suspense>
    </>
  )
}
