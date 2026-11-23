// Bagian halaman publik dengan judul h2 (token text-h2), dipakai /listing/[id] dan /penyedia/[id] supaya
// keduanya terbaca sebagai satu keluarga.
export function PageSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-h2 font-semibold text-balance">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}
