import { Skeleton } from "@/components/ui/skeleton"

// Skeleton berbentuk sama dengan halaman detail jasa (Design System 10).
export default function ListingLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-16 md:px-6" aria-busy aria-label="Memuat jasa">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <Skeleton className="aspect-4/3 w-full rounded-lg" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <div className="flex gap-1.5">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-20 w-full rounded-lg" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
        <Skeleton className="hidden h-48 rounded-lg lg:block" />
      </div>
    </div>
  )
}
