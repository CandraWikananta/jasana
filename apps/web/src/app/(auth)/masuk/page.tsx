import type { Metadata } from "next"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { LoginForm } from "@/features/auth/components/login-form"

export const metadata: Metadata = { title: "Masuk", robots: { index: false } }

function LoginFormSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-16" />
      <Skeleton className="h-16" />
      <Skeleton className="h-12" />
    </div>
  )
}

export default function MasukPage() {
  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Masuk</h1>
        <p className="text-sm text-muted-foreground">Masuk untuk memesan jasa dan melihat pesananmu.</p>
      </div>
      {/* useSearchParams di LoginForm butuh batas Suspense (cacheComponents). */}
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </>
  )
}
