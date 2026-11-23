import { Skeleton } from "@/components/ui/skeleton"

// Skeleton berbentuk sama dengan profil penyedia (Design System 10). min-h-dvh: footer tidak sempat terlihat lalu
// terdorong saat isi datang (pola yang sama dengan /listing/[id]).
export default function PenyediaLoading() {
  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 pt-6 pb-16 md:px-6" aria-busy aria-label="Memuat penyedia">
      <div className="flex flex-col gap-8 lg:w-2/3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-9 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-5 w-3/4" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
