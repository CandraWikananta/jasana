import { Skeleton } from "@/components/ui/skeleton"

// Fallback Suspense setinggi formulir asli, supaya tidak ada geseran saat formulir klien tiba:
// isian = label 20 + jarak 6 + input 44 (+ jarak 6 + teks bantu 20), tombol lg 48, lalu baris
// tautan 20 berjarak 24 di bawah formulir.
export function FormSkeleton({
  fields = [],
  footer = false,
}: {
  /** "hint" untuk isian yang punya teks bantu di bawahnya. */
  fields?: ("plain" | "hint")[]
  footer?: boolean
}) {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Memuat">
      <div className="flex flex-col gap-5">
        {fields.map((kind, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-11" />
            {kind === "hint" && <Skeleton className="h-5 w-48" />}
          </div>
        ))}
        <Skeleton className="h-12" />
      </div>
      {footer && <Skeleton className="mx-auto h-5 w-56" />}
    </div>
  )
}
