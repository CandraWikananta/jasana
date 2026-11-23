import { BrandLogo } from "@/components/layout/brand-logo"
import { EmailVerificationBanner } from "./email-verification-banner"
import { HeaderAccount } from "./header-account"
import { HeaderSearch } from "./header-search"

// Header publik (PRD Frontend 4.1). Mobile-first: logo dan Masuk (atau menu avatar) di baris pertama,
// kotak cari baris kedua (disembunyikan di beranda); mulai md semuanya satu baris. Banner email
// belum terverifikasi (D62) tepat di bawahnya.
export function SiteHeader() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 md:flex-nowrap md:px-6">
          <BrandLogo href="/" />

          <HeaderSearch />

          <HeaderAccount customerLinks />
        </div>
      </header>
      <EmailVerificationBanner />
    </>
  )
}
