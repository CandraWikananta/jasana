import type { Metadata } from "next"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { LoginForm } from "@/features/auth/components/login-form"

export const metadata: Metadata = { title: "Masuk", robots: { index: false } }

function LoginFormSkeleton() {
  return (
    // Tinggi sama dengan isian asli (label 20 + jarak 6 + input 44) dan tombol lg 48.
    <div className="flex flex-col gap-5">
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-11" />
        </div>
      ))}
      <Skeleton className="h-12" />
    </div>
  )
}

export default function MasukPage() {
  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-h1 font-bold text-balance">Masuk</h1>
        <p className="text-sm text-muted-foreground">Pesan jasa dan pantau pesananmu dari satu akun.</p>
      </div>
      {/* useSearchParams di LoginForm butuh batas Suspense (cacheComponents). */}
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </>
  )
}
