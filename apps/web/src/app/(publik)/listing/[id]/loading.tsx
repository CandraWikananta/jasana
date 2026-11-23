import { Skeleton } from "@/components/ui/skeleton"

// Skeleton berbentuk sama dengan halaman detail jasa (Design System 10): judul di atas grid, lalu foto dan panel harga.
// min-h-dvh: di 390 px skeleton lebih pendek dari layar, sehingga footer sempat terlihat lalu terdorong (CLS 0,05).
export default function ListingLoading() {
  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 pt-6 pb-16 md:px-6" aria-busy aria-label="Memuat jasa">
      <div className="flex flex-col gap-5 pb-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-28" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-2/3 rounded-full" />
            <Skeleton className="h-7 w-1/2 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <Skeleton className="aspect-4/3 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
        <Skeleton className="hidden h-56 rounded-lg lg:block" />
      </div>
    </div>
  )
}
