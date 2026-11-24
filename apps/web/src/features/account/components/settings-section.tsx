import { useId } from "react"

// Bagian halaman akun: satu kolom di HP; mulai lg judul di kolom pertama dan panel di dua kolom
// sisanya, supaya isian tetap selebar formulir (DS 3) tanpa menyisakan separuh layar kosong.
export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="grid gap-3 lg:grid-cols-3 lg:items-start lg:gap-8">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-h2 font-semibold">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="min-w-0 rounded-lg border border-border bg-card lg:col-span-2">{children}</div>
    </section>
  )
}
