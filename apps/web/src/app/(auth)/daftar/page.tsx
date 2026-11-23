import type { Metadata } from "next"
import { Suspense } from "react"
import { FormSkeleton } from "@/features/auth/components/form-skeleton"
import { RegisterForm } from "@/features/auth/components/register-form"

export const metadata: Metadata = { title: "Daftar", robots: { index: false } }

export default function DaftarPage() {
  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-h1 font-bold text-balance">Daftar</h1>
        <p className="text-sm text-muted-foreground">Satu akun untuk memesan jasa, dan nanti membuka usahamu sendiri.</p>
      </div>
      {/* useSearchParams (?next=) di RegisterForm butuh batas Suspense (cacheComponents). */}
      <Suspense fallback={<FormSkeleton fields={["plain", "plain", "hint", "hint"]} footer />}>
        <RegisterForm />
      </Suspense>
    </>
  )
}
