import Link from "next/link"

const LINKS = [
  { href: "/cari", label: "Cari jasa" },
  { href: "/asisten", label: "Asisten Jasana" },
  { href: "/usaha/daftar", label: "Daftar jadi penyedia" },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-start md:justify-between md:px-6">
        <div className="flex flex-col gap-1">
          <span translate="no" className="text-xl font-bold text-primary">
            Jasana
          </span>
          <p className="text-sm text-muted-foreground">Cari dan pesan jasa di sekitarmu.</p>
        </div>
        <nav aria-label="Tautan footer">
          <ul className="flex flex-col gap-3 md:flex-row md:gap-6">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted-foreground md:px-6">© 2026 Jasana</p>
    </footer>
  )
}
