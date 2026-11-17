import { Skeleton } from "@/components/ui/skeleton"

export default function PenyediaLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-6 md:px-6" aria-busy aria-label="Memuat penyedia">
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    </div>
  )
}
