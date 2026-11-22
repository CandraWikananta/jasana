import { BrandLogo } from "@/components/layout/brand-logo"

// Halaman autentikasi (PRD Frontend 4.2): tanpa header publik, satu kartu di tengah.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="px-4 py-4 md:px-6">
        <BrandLogo href="/" />
      </header>
      <main id="konten" tabIndex={-1} className="flex flex-1 items-start justify-center px-4 pt-6 pb-12 outline-none md:items-center md:pt-0">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">{children}</div>
      </main>
    </div>
  )
}
