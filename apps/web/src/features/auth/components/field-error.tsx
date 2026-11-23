import { CircleX } from "lucide-react"

// DS 6.1: pesan body-sm 500 berwarna --destructive dengan ikon 16 px, dihubungkan lewat aria-describedby.
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="flex items-center gap-1.5 text-sm font-medium text-destructive">
      <CircleX aria-hidden className="size-4 shrink-0" />
      {message}
    </p>
  )
}

/** Teks bantu tetap di bawah isian (aturan kata sandi, contoh nomor), bukan placeholder. */
export function FieldHint({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="text-sm text-muted-foreground">
      {children}
    </p>
  )
}

/** Gabungan id untuk aria-describedby; undefined kalau kosong supaya atributnya tidak dirender. */
export function describedBy(...ids: (string | false | null | undefined)[]): string | undefined {
  const joined = ids.filter(Boolean).join(" ")
  return joined || undefined
}
