import Link from "next/link"

// Halaman autentikasi (PRD Frontend 4.2): tanpa header publik, satu kartu di tengah.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="px-4 py-4 md:px-6">
        <Link
          href="/"
          className="rounded-sm text-2xl font-bold text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Jasana
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-6 pb-12 md:items-center md:pt-0">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">{children}</div>
      </main>
    </div>
  )
}
